import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  Cloud,
  CloudOff,
  Download,
  Eye,
  LayoutTemplate,
  Loader2,
  Lock,
  Palette,
  PenLine,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdditionalSectionType, ResumeDocument, SectionKey } from '@/types/resume';
import { emptyAdditionalSection } from '@/lib/resume/defaults';
import { ADDITIONAL_SECTION_META, CORE_SECTION_PRINT_TITLES, isExtraKey } from '@/lib/resume/sections';
import { downloadResumePdf } from '@/pdf/renderer';
import { checkResumeEntitlement } from '@/lib/payments/razorpay';
import { trackEvent } from '@/lib/analytics';
import { useAuthStore } from '@/store/useAuthStore';
import { useResumeStore } from '@/store/useResumeStore';
import { SectionSidebar, type EditorTab } from '@/components/editor/SectionSidebar';
import { SectionForms } from '@/components/editor/SectionForms';
import { CustomizePanel } from '@/components/editor/CustomizePanel';
import { TemplateSwitcherPanel } from '@/components/editor/TemplateSwitcherPanel';
import { LivePdfPreview } from '@/components/editor/LivePdfPreview';
import { MobileSectionsSheet } from '@/components/editor/MobileSectionsSheet';
import { PaymentModal } from '@/components/PaymentModal';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/controls';
import { cn } from '@/lib/utils';

const PENDING_DOWNLOAD_KEY = 'folio.pendingDownloadResumeId';

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuthStore();
  const {
    resumes,
    activeId,
    setActiveId,
    createResume,
    updateData,
    updateCustomization,
    renameResume,
    switchTemplate,
    flushSave,
    markResumePaid,
    hasUnsavedChanges,
    saveStatus,
    saveError,
  } = useResumeStore();

  const [activeTab, setActiveTab] = useState<EditorTab>('personal');
  const [lastFormTab, setLastFormTab] = useState<'personal' | SectionKey>('personal');
  const [mobilePane, setMobilePane] = useState<'edit' | 'preview'>('edit');
  const [downloading, setDownloading] = useState(false);
  const [paymentDoc, setPaymentDoc] = useState<ResumeDocument | null>(null);
  const [mobileReorderOpen, setMobileReorderOpen] = useState(false);
  const previewTrackedRef = useRef<string | null>(null);

  const selectTab = (tab: EditorTab) => {
    setActiveTab(tab);
    if (tab !== 'templates' && tab !== 'customize') {
      setLastFormTab(tab);
    }
  };

  // Resolve the active resume from URL param or create a fresh one if none exist
  useEffect(() => {
    if (id) {
      const exists = resumes.some((r) => r.id === id);
      if (exists) {
        if (activeId !== id) setActiveId(id);
        return;
      }
    }
    if (resumes.length > 0) {
      setActiveId(resumes[0].id);
      navigate(`/editor/${resumes[0].id}`, { replace: true });
    } else {
      const fresh = createResume('modern-minimal', { withSample: true });
      navigate(`/editor/${fresh.id}`, { replace: true });
    }
  }, [id, resumes, activeId, setActiveId, createResume, navigate]);

  const doc = resumes.find((r) => r.id === (id || activeId)) ?? resumes[0];

  // Track resume preview once per opened resume
  useEffect(() => {
    if (!doc || previewTrackedRef.current === doc.id) return;
    previewTrackedRef.current = doc.id;
    void trackEvent('resume_previewed', { userId: user?.id, resumeId: doc.id, metadata: { templateId: doc.templateId } });
  }, [doc, user?.id]);

  // Resume download / payment flow automatically after returning from Google Sign-In
  useEffect(() => {
    if (!user || !doc) return;
    const pendingId = sessionStorage.getItem(PENDING_DOWNLOAD_KEY);
    if (pendingId && pendingId === doc.id) {
      sessionStorage.removeItem(PENDING_DOWNLOAD_KEY);
      void handleDownload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, doc?.id]);

  // Flush any pending edits immediately when leaving the editor so changes persist and reflect right away
  useEffect(() => {
    return () => {
      const state = useResumeStore.getState();
      if (state.hasUnsavedChanges) {
        void state.flushSave();
      }
    };
  }, []);

  if (!doc) return null;

  const triggerPdfDownload = async (target: ResumeDocument) => {
    setDownloading(true);
    try {
      await downloadResumePdf(target.templateId, target.data, target.customization);
      void trackEvent('pdf_downloaded', { userId: user?.id, resumeId: target.id, metadata: { templateId: target.templateId } });
      toast.success('Resume downloaded as PDF');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownload = async () => {
    void trackEvent('download_clicked', { userId: user?.id, resumeId: doc.id });

    // Step 1: Require Google Sign-In
    if (!user) {
      sessionStorage.setItem(PENDING_DOWNLOAD_KEY, doc.id);
      openAuthModal(
        'Sign in with your Google account to unlock PDF downloads and save your resume securely.',
        'download',
      );
      return;
    }

    // Step 2: Flush any pending edits to Supabase (without touching updated_at if nothing was edited),
    // then verify payment entitlement on the server.
    setDownloading(true);
    try {
      if (hasUnsavedChanges) {
        await flushSave();
      }
      const entitlement = await checkResumeEntitlement(doc.id);
      if (entitlement.isPaid) {
        markResumePaid(doc.id, entitlement.paidAt);
        await triggerPdfDownload(doc);
      } else {
        setDownloading(false);
        setPaymentDoc(doc);
      }
    } catch (err) {
      setDownloading(false);
      toast.error(err instanceof Error ? err.message : 'Could not verify download status');
    }
  };

  const handleToggleHidden = (key: SectionKey) => {
    updateData((prev) => ({
      ...prev,
      hiddenSections: prev.hiddenSections.includes(key)
        ? prev.hiddenSections.filter((k) => k !== key)
        : [...prev.hiddenSections, key],
    }));
  };

  const handleAddAdditional = (type: AdditionalSectionType) => {
    const sec = emptyAdditionalSection(type);
    const key: SectionKey = `extra:${sec.id}`;
    updateData((prev) => ({
      ...prev,
      additional: [...prev.additional, sec],
      sectionOrder: [...prev.sectionOrder, key],
    }));
    selectTab(key);
    toast.success(`Added ${sec.title} section`);
  };

  const handleRemoveAdditional = (secId: string) => {
    const key: SectionKey = `extra:${secId}`;
    updateData((prev) => ({
      ...prev,
      additional: prev.additional.filter((s) => s.id !== secId),
      sectionOrder: prev.sectionOrder.filter((k) => k !== key),
      hiddenSections: prev.hiddenSections.filter((k) => k !== key),
    }));
    selectTab('personal');
    toast.success('Section removed');
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      {/* Top Editor Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 sm:gap-3 border-b border-border bg-background px-2.5 sm:px-4">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          <Button variant="ghost" size="icon-sm" asChild title="Back to My Resumes" className="shrink-0">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <input
            aria-label="Resume name"
            value={doc.name}
            onChange={(e) => renameResume(doc.id, e.target.value)}
            className="min-w-0 flex-1 max-w-[220px] truncate rounded-md border border-transparent bg-transparent px-1.5 sm:px-2 py-1 text-sm font-semibold text-foreground hover:border-border focus:border-primary focus:outline-none"
          />

          {/* Save status indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Saving…</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Cloud className="h-3.5 w-3.5 text-emerald-600" />
                <span>Saved</span>
              </>
            )}
            {saveStatus === 'local' && (
              <button
                type="button"
                onClick={() => openAuthModal('Sign in to sync your resumes to the cloud and access them anywhere.')}
                className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Check className="h-3 w-3 text-emerald-600" />
                Saved locally · Sign in to sync
              </button>
            )}
            {saveStatus === 'error' && (
              <button
                type="button"
                onClick={() => flushSave()}
                title={saveError || 'Click to retry saving'}
                className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-medium text-destructive hover:bg-destructive/15 transition-colors"
              >
                <CloudOff className="h-3.5 w-3.5" />
                Save failed · Retry
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => {
              setActiveTab('templates');
              setMobilePane('edit');
            }}
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            Templates
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => {
              setActiveTab('customize');
              setMobilePane('edit');
            }}
          >
            <Palette className="h-3.5 w-3.5" />
            Customize
          </Button>
          {!user && (
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:inline-flex"
              onClick={() => openAuthModal('Sign in to save your resume to your account.')}
            >
              Sign In
            </Button>
          )}
          <Button size="sm" onClick={handleDownload} disabled={downloading} className="shrink-0">
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : doc.isPaid || !user ? (
              <Download className="h-4 w-4" />
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
            <span className="sm:hidden">{doc.isPaid || !user ? 'PDF' : 'PDF · ₹49'}</span>
            <span className="hidden sm:inline">{doc.isPaid || !user ? 'Download PDF' : 'Download PDF · ₹49'}</span>
          </Button>
        </div>
      </header>

      {/* Three-panel Workspace (Desktop) / Native App Workspace (Mobile) */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT PANEL: Sections Sidebar */}
        <div className={cn('w-56 xl:w-60 shrink-0 hidden md:block h-full', mobilePane === 'preview' && 'md:hidden lg:block')}>
          <SectionSidebar
            data={doc.data}
            activeTab={activeTab}
            onSelectTab={(t) => {
              selectTab(t);
              setMobilePane('edit');
            }}
            onReorder={(order) => updateData((prev) => ({ ...prev, sectionOrder: order }))}
            onToggleHidden={handleToggleHidden}
            onAddAdditional={handleAddAdditional}
          />
        </div>

        {/* CENTER PANEL: Form / Customize / Templates */}
        <div
          className={cn(
            'flex-1 lg:max-w-[520px] xl:max-w-[560px] h-full overflow-y-auto thin-scroll border-r border-border bg-background',
            mobilePane === 'preview' && 'hidden lg:block',
          )}
        >
          {/* Mobile horizontal section rail (shown only on Edit form view; Templates & Design live in bottom nav) */}
          {activeTab !== 'templates' && activeTab !== 'customize' && (
            <div className="sticky top-0 z-20 flex md:hidden items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-border/80 px-3 py-2.5 bg-background/95 backdrop-blur-md">
              <button
                type="button"
                onClick={() => selectTab('personal')}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95',
                  activeTab === 'personal'
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'bg-secondary/70 text-foreground/80',
                )}
              >
                Personal
              </button>

              {doc.data.sectionOrder.map((key) => {
                const label = isExtraKey(key)
                  ? doc.data.additional.find((s) => `extra:${s.id}` === key)?.title || 'Custom'
                  : CORE_SECTION_PRINT_TITLES[key];
                const isHidden = doc.data.hiddenSections.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectTab(key)}
                    className={cn(
                      'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95',
                      activeTab === key
                        ? 'bg-primary text-primary-foreground shadow-soft'
                        : 'bg-secondary/70 text-foreground/80',
                      isHidden && 'opacity-50',
                    )}
                  >
                    {label}
                  </button>
                );
              })}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-primary/50 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary active:scale-95 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Section
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {(Object.keys(ADDITIONAL_SECTION_META) as AdditionalSectionType[]).map((type) => (
                    <DropdownMenuItem key={type} onClick={() => handleAddAdditional(type)}>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                      {ADDITIONAL_SECTION_META[type].label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={() => setMobileReorderOpen(true)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 active:scale-95 transition-all"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
                Reorder
              </button>
            </div>
          )}

          <div className="p-4 sm:p-6 pb-24 lg:pb-16">
            {activeTab === 'customize' ? (
              <CustomizePanel
                templateId={doc.templateId}
                customization={doc.customization}
                onChange={updateCustomization}
              />
            ) : activeTab === 'templates' ? (
              <TemplateSwitcherPanel
                activeTemplateId={doc.templateId}
                onSelect={(tplId) => {
                  switchTemplate(tplId);
                  toast.success('Template switched — all your data is intact');
                }}
              />
            ) : (
              <SectionForms
                section={activeTab}
                data={doc.data}
                onChange={updateData}
                onRemoveAdditional={handleRemoveAdditional}
              />
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Live A4 PDF Preview */}
        <div className={cn('flex-1 min-w-0 min-h-0 h-full', mobilePane === 'edit' && 'hidden lg:block')}>
          <LivePdfPreview
            templateId={doc.templateId}
            data={doc.data}
            customization={doc.customization}
          />
        </div>
      </div>

      {/* Mobile Native-App Bottom Navigation Bar */}
      <nav
        aria-label="Editor navigation"
        className="flex lg:hidden shrink-0 items-stretch border-t border-border/80 bg-background/95 backdrop-blur-md shadow-[0_-2px_12px_rgba(15,23,42,0.06)] pb-[env(safe-area-inset-bottom)] px-1"
      >
        <button
          type="button"
          onClick={() => {
            setMobilePane('edit');
            if (activeTab === 'templates' || activeTab === 'customize') {
              setActiveTab(lastFormTab);
            }
          }}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors active:scale-95',
            mobilePane === 'edit' && activeTab !== 'templates' && activeTab !== 'customize'
              ? 'text-primary'
              : 'text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
              mobilePane === 'edit' && activeTab !== 'templates' && activeTab !== 'customize' && 'bg-primary/10',
            )}
          >
            <PenLine className="h-4 w-4" />
          </span>
          <span>Edit CV</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobilePane('edit');
            setActiveTab('templates');
          }}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors active:scale-95',
            mobilePane === 'edit' && activeTab === 'templates' ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
              mobilePane === 'edit' && activeTab === 'templates' && 'bg-primary/10',
            )}
          >
            <LayoutTemplate className="h-4 w-4" />
          </span>
          <span>Templates</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobilePane('edit');
            setActiveTab('customize');
          }}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors active:scale-95',
            mobilePane === 'edit' && activeTab === 'customize' ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
              mobilePane === 'edit' && activeTab === 'customize' && 'bg-primary/10',
            )}
          >
            <Palette className="h-4 w-4" />
          </span>
          <span>Design</span>
        </button>

        <button
          type="button"
          onClick={() => setMobilePane('preview')}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors active:scale-95',
            mobilePane === 'preview' ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
              mobilePane === 'preview' && 'bg-primary/10',
            )}
          >
            <Eye className="h-4 w-4" />
          </span>
          <span>Live Preview</span>
        </button>
      </nav>
      <MobileSectionsSheet
        open={mobileReorderOpen}
        onClose={() => setMobileReorderOpen(false)}
        data={doc.data}
        onReorder={(order) => updateData((prev) => ({ ...prev, sectionOrder: order }))}
        onToggleHidden={handleToggleHidden}
        onSelectSection={(key) => {
          selectTab(key);
          setMobilePane('edit');
        }}
      />

      <PaymentModal
        resume={paymentDoc}
        onClose={() => setPaymentDoc(null)}
        onUnlocked={(unlockedDoc) => {
          void triggerPdfDownload(unlockedDoc);
        }}
      />
    </div>
  );
}
