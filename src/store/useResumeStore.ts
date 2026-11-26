import { create } from 'zustand';
import type { Customization, ResumeData, ResumeDocument } from '@/types/resume';
import { newResumeDocument, normalizeCustomization, normalizeResumeData, uid } from '@/lib/resume/defaults';
import { cloneSample } from '@/lib/resume/sample';
import { DEFAULT_TEMPLATE_ID, getTemplate } from '@/templates/meta';
import { customizationForSwitch, templateDefaultCustomization } from '@/templates/customization';
import { deleteUserResume, fetchUserResumes, upsertUserResume } from '@/lib/supabase/resumes';
import { trackEvent } from '@/lib/analytics';

const STORAGE_KEY = 'folio.resumes.v1';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'local' | 'error';

function loadLocalResumes(): ResumeDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ResumeDocument[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((d) => ({
      ...d,
      data: normalizeResumeData(d.data),
      customization: normalizeCustomization(d.customization, templateDefaultCustomization(d.templateId)),
    }));
  } catch {
    return [];
  }
}

function saveLocalResumes(list: ResumeDocument[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore quota errors
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

interface ResumeStore {
  resumes: ResumeDocument[];
  activeId: string | null;
  loading: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  hasUnsavedChanges: boolean;
  userId: string | null;

  /** Syncs store when auth user changes; migrates local drafts into Supabase. */
  syncForUser: (userId: string | null) => Promise<void>;

  /** Returns the currently open resume (if any). */
  getActive: () => ResumeDocument | undefined;

  /** Selects an existing resume by id. */
  setActiveId: (id: string) => void;

  /** Creates a new resume from a template (optionally pre-filled with sample data). */
  createResume: (templateId?: string, opts?: { withSample?: boolean; name?: string }) => ResumeDocument;

  /** Updates the active resume's data. */
  updateData: (updater: (prev: ResumeData) => ResumeData) => void;

  /** Updates the active resume's customization. */
  updateCustomization: (patch: Partial<Customization>) => void;

  /** Renames a resume. */
  renameResume: (id: string, name: string) => void;

  /** Switches template on the active resume without losing any user data. */
  switchTemplate: (templateId: string) => void;

  /** Duplicates a resume. */
  duplicateResume: (id: string) => ResumeDocument | null;

  /** Deletes a resume. */
  deleteResume: (id: string) => Promise<void>;

  /** Forces an immediate save of the active resume. */
  flushSave: () => Promise<void>;

  /** Updates local entitlement state strictly after server-side payment verification. */
  markResumePaid: (id: string, paidAt?: string | null) => void;
}

function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}

const initialLocal = typeof window !== 'undefined' ? loadLocalResumes() : [];

export const useResumeStore = create<ResumeStore>((set, get) => {
  const schedulePersist = (doc: ResumeDocument) => {
    const uidNow = get().userId;
    saveLocalResumes(get().resumes);
    if (!uidNow) {
      set({ saveStatus: 'local', saveError: null });
      return;
    }
    set({ saveStatus: 'saving', saveError: null, hasUnsavedChanges: true });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        await upsertUserResume(uidNow, doc);
        set({ saveStatus: 'saved', saveError: null, hasUnsavedChanges: false });
      } catch (err) {
        const msg = errorMessage(err, 'Failed to save');
        console.error('[Folio] Save to Supabase failed:', err);
        set({ saveStatus: 'error', saveError: msg });
      }
    }, 650);
  };

  return {
    resumes: initialLocal,
    activeId: initialLocal[0]?.id ?? null,
    loading: false,
    saveStatus: initialLocal.length ? 'local' : 'idle',
    saveError: null,
    hasUnsavedChanges: false,
    userId: null,

    syncForUser: async (userId) => {
      const prevUserId = get().userId;
      if (userId === prevUserId && userId !== null) return;
      set({ userId });

      if (!userId) {
        const local = loadLocalResumes();
        set({ resumes: local, activeId: local[0]?.id ?? null, saveStatus: local.length ? 'local' : 'idle', loading: false });
        return;
      }

      set({ loading: true });
      try {
        const remote = await fetchUserResumes(userId);
        const local = loadLocalResumes();
        const remoteIds = new Set(remote.map((r) => r.id));
        const toMigrate = local.filter((d) => !remoteIds.has(d.id));
        const migrated: ResumeDocument[] = [];
        for (const draft of toMigrate) {
          try {
            const saved = await upsertUserResume(userId, draft);
            migrated.push(saved);
          } catch {
            // Skip drafts that cannot be migrated
          }
        }
        const merged = [...migrated, ...remote].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        saveLocalResumes(merged);
        const currentActive = get().activeId;
        const nextActive = merged.some((r) => r.id === currentActive) ? currentActive : merged[0]?.id ?? null;
        set({ resumes: merged, activeId: nextActive, loading: false, saveStatus: 'saved' });
      } catch (err) {
        const msg = errorMessage(err, 'Could not load resumes');
        console.error('[Folio] Load from Supabase failed:', err);
        set({ loading: false, saveStatus: 'error', saveError: msg });
      }
    },

    getActive: () => {
      const { resumes, activeId } = get();
      return resumes.find((r) => r.id === activeId) ?? resumes[0];
    },

    setActiveId: (id) => set({ activeId: id }),

    createResume: (templateId = DEFAULT_TEMPLATE_ID, opts) => {
      const tpl = getTemplate(templateId);
      const custom = templateDefaultCustomization(tpl.id);
      const data = opts?.withSample ? cloneSample(tpl.sample) : undefined;
      const doc = newResumeDocument(tpl.id, custom, data);
      if (tpl.recommendedOrder && !opts?.withSample) {
        doc.data.sectionOrder = [...tpl.recommendedOrder];
      }
      doc.name = opts?.name ?? (opts?.withSample ? `${tpl.name} (Sample)` : `${tpl.name} Resume`);
      doc.isPaid = false;
      doc.paidAt = null;
      const resumes = [doc, ...get().resumes];
      set({ resumes, activeId: doc.id });
      schedulePersist(doc);
      void trackEvent('resume_created', { userId: get().userId, resumeId: doc.id, metadata: { templateId: tpl.id } });
      return doc;
    },

    updateData: (updater) => {
      const active = get().getActive();
      if (!active) return;
      const updated: ResumeDocument = {
        ...active,
        data: updater(active.data),
        // Any content edit requires a fresh ₹49 payment to download the updated PDF
        isPaid: false,
        paidAt: null,
        updatedAt: new Date().toISOString(),
      };
      const resumes = get().resumes.map((r) => (r.id === updated.id ? updated : r));
      set({ resumes });
      schedulePersist(updated);
    },

    updateCustomization: (patch) => {
      const active = get().getActive();
      if (!active) return;
      const updated: ResumeDocument = {
        ...active,
        customization: { ...active.customization, ...patch },
        // Any design customization edit requires a fresh ₹49 payment to download
        isPaid: false,
        paidAt: null,
        updatedAt: new Date().toISOString(),
      };
      const resumes = get().resumes.map((r) => (r.id === updated.id ? updated : r));
      set({ resumes });
      schedulePersist(updated);
    },

    renameResume: (id, name) => {
      const target = get().resumes.find((r) => r.id === id);
      if (!target) return;
      const updated: ResumeDocument = { ...target, name: name.trim() || 'Untitled Resume', updatedAt: new Date().toISOString() };
      const resumes = get().resumes.map((r) => (r.id === id ? updated : r));
      set({ resumes });
      schedulePersist(updated);
    },

    switchTemplate: (templateId) => {
      const active = get().getActive();
      if (!active || active.templateId === templateId) return;
      const updated: ResumeDocument = {
        ...active,
        templateId,
        customization: customizationForSwitch(active.customization, active.templateId, templateId),
        // Switching template creates a new layout version and requires ₹49 to download
        isPaid: false,
        paidAt: null,
        updatedAt: new Date().toISOString(),
      };
      const resumes = get().resumes.map((r) => (r.id === updated.id ? updated : r));
      set({ resumes });
      schedulePersist(updated);
    },

    duplicateResume: (id) => {
      const src = get().resumes.find((r) => r.id === id);
      if (!src) return null;
      const now = new Date().toISOString();
      const copy: ResumeDocument = {
        ...JSON.parse(JSON.stringify(src)),
        id: uid(),
        name: `${src.name} (Copy)`,
        // Duplicating a paid resume never transfers its payment entitlement
        isPaid: false,
        paidAt: null,
        createdAt: now,
        updatedAt: now,
      };
      const resumes = [copy, ...get().resumes];
      set({ resumes, activeId: copy.id });
      schedulePersist(copy);
      return copy;
    },

    deleteResume: async (id) => {
      const remaining = get().resumes.filter((r) => r.id !== id);
      const nextActive = get().activeId === id ? remaining[0]?.id ?? null : get().activeId;
      set({ resumes: remaining, activeId: nextActive });
      saveLocalResumes(remaining);
      const uidNow = get().userId;
      if (uidNow) {
        try {
          await deleteUserResume(uidNow, id);
        } catch (err) {
          set({ saveStatus: 'error', saveError: err instanceof Error ? err.message : 'Failed to delete' });
        }
      }
    },

    flushSave: async () => {
      const active = get().getActive();
      const uidNow = get().userId;
      if (!active) return;
      saveLocalResumes(get().resumes);
      if (!uidNow) return;
      if (saveTimer) clearTimeout(saveTimer);
      set({ saveStatus: 'saving', saveError: null });
      try {
        await upsertUserResume(uidNow, active);
        set({ saveStatus: 'saved', saveError: null, hasUnsavedChanges: false });
      } catch (err) {
        const msg = errorMessage(err, 'Failed to save');
        console.error('[Folio] Save to Supabase failed:', err);
        set({ saveStatus: 'error', saveError: msg });
      }
    },

    markResumePaid: (id, paidAt) => {
      const resumes = get().resumes.map((r) =>
        r.id === id ? { ...r, isPaid: true, paidAt: paidAt ?? new Date().toISOString() } : r,
      );
      set({ resumes });
      saveLocalResumes(resumes);
    },
  };
});
