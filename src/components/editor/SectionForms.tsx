import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Crop,
  ImagePlus,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { PhotoCropModal } from './PhotoCropModal';
import type { ResumeData, SectionKey } from '@/types/resume';
import {
  emptyAdditionalItem,
  emptyCertification,
  emptyEducation,
  emptyExperience,
  emptyLanguage,
  emptyProject,
  emptySkill,
} from '@/lib/resume/defaults';
import { LANGUAGE_LEVELS, SKILL_LEVEL_LABELS } from '@/lib/resume/format';
import { ADDITIONAL_SECTION_META, isExtraKey } from '@/lib/resume/sections';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/primitives';
import { Checkbox, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/controls';
import { cn } from '@/lib/utils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s().-]{6,}$/;

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

/**
 * Reads an uploaded image file and downscales only if larger than 1000px on the longest edge
 * while preserving the full original aspect ratio, so re-cropping can always zoom back out.
 */
function prepareOriginalPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        const maxSide = 1000;
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(reader.result as string);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

function EntryCard({
  title,
  subtitle,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onDelete,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle?: string;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="flex items-center justify-between gap-2 bg-secondary/40 px-3.5 py-2.5 border-b border-border/60">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2 text-left min-w-0"
        >
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{title || 'Untitled entry'}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant="ghost" size="icon-sm" disabled={index === 0} onClick={onMoveUp} aria-label="Move up">
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" disabled={index === total - 1} onClick={onMoveDown} aria-label="Move down">
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDelete} className="text-muted-foreground hover:text-destructive" aria-label="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {open && <div className="p-4 space-y-3.5">{children}</div>}
    </div>
  );
}

interface SectionFormsProps {
  section: 'personal' | SectionKey;
  data: ResumeData;
  onChange: (updater: (prev: ResumeData) => ResumeData) => void;
  onRemoveAdditional: (id: string) => void;
}

export function SectionForms({ section, data, onChange, onRemoveAdditional }: SectionFormsProps) {
  const [newSkill, setNewSkill] = useState('');
  const [cropSession, setCropSession] = useState<{ src: string; isNewUpload: boolean } | null>(null);
  const aiEnabled = import.meta.env.VITE_ENABLE_AI === 'true';

  /* ---------------- A. Personal Information ---------------- */
  if (section === 'personal') {
    const p = data.personal;
    const setP = (patch: Partial<typeof p>) =>
      onChange((prev) => ({ ...prev, personal: { ...prev.personal, ...patch } }));

    const emailError = p.email.trim() && !EMAIL_RE.test(p.email.trim()) ? 'Enter a valid email address' : null;
    const phoneError = p.phone.trim() && !PHONE_RE.test(p.phone.trim()) ? 'Enter a valid phone number' : null;

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const originalUrl = await prepareOriginalPhoto(file);
        setCropSession({ src: originalUrl, isNewUpload: true });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to read image');
      } finally {
        e.target.value = '';
      }
    };

    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
          <p className="text-xs text-muted-foreground mt-0.5">How recruiters and hiring managers can reach you.</p>
        </div>

        {/* Optional Photo */}
        <div className="flex items-center gap-4 rounded-xl border border-border p-3.5 bg-secondary/20">
          {p.photo ? (
            <img src={p.photo} alt="Profile" className="h-16 w-16 rounded-full object-cover border border-border" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-input bg-background text-muted-foreground">
              <ImagePlus className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1 space-y-1.5">
            <p className="text-xs font-medium text-foreground">Profile Photo (optional)</p>
            <p className="text-[11px] text-muted-foreground">Upload an image to crop, zoom, and position it for photo-supported templates.</p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-soft hover:bg-secondary">
                {p.photo ? 'Change Photo' : 'Upload Photo'}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="sr-only" />
              </label>
              {p.photo && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCropSession({ src: p.photoOriginal || p.photo, isNewUpload: false })}
                  >
                    <Crop className="h-3.5 w-3.5" />
                    Crop
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setP({ photo: '', photoOriginal: undefined, photoCrop: undefined })}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <PhotoCropModal
          imageSrc={cropSession?.src ?? null}
          initialCrop={cropSession?.isNewUpload ? undefined : p.photoCrop}
          onCancel={() => setCropSession(null)}
          onConfirm={(croppedDataUrl, cropState) => {
            setP({
              photo: croppedDataUrl,
              photoOriginal: cropSession?.isNewUpload ? cropSession.src : p.photoOriginal || cropSession?.src,
              photoCrop: cropState,
            });
            setCropSession(null);
            toast.success('Profile photo updated');
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name">
            <Input value={p.fullName} onChange={(e) => setP({ fullName: e.target.value })} placeholder="Olivia Bennett" />
          </Field>
          <Field label="Professional Job Title">
            <Input value={p.jobTitle} onChange={(e) => setP({ jobTitle: e.target.value })} placeholder="Senior Product Manager" />
          </Field>
          <Field label="Email Address" error={emailError}>
            <Input
              type="email"
              value={p.email}
              onChange={(e) => setP({ email: e.target.value })}
              placeholder="olivia@example.com"
              className={emailError ? 'border-destructive focus-visible:ring-destructive/30' : undefined}
            />
          </Field>
          <Field label="Phone Number" error={phoneError}>
            <Input
              type="tel"
              value={p.phone}
              onChange={(e) => setP({ phone: e.target.value })}
              placeholder="+1 (415) 555-0142"
              className={phoneError ? 'border-destructive focus-visible:ring-destructive/30' : undefined}
            />
          </Field>
          <Field label="Location / Address" className="sm:col-span-2">
            <Input value={p.location} onChange={(e) => setP({ location: e.target.value })} placeholder="San Francisco, CA" />
          </Field>
          <Field label="LinkedIn Profile">
            <Input value={p.linkedin} onChange={(e) => setP({ linkedin: e.target.value })} placeholder="linkedin.com/in/yourname" />
          </Field>
          <Field label="Portfolio / Website">
            <Input value={p.website} onChange={(e) => setP({ website: e.target.value })} placeholder="yourportfolio.com" />
          </Field>
        </div>
      </div>
    );
  }

  /* ---------------- B. Professional Summary ---------------- */
  if (section === 'summary') {
    const words = data.summary.trim() ? data.summary.trim().split(/\s+/).length : 0;
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Professional Summary</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Write 2–4 concise sentences highlighting your role, experience, and impact.</p>
          </div>
          {aiEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const role = data.personal.jobTitle || 'professional';
                const topSkills = data.skills.slice(0, 3).map((s) => s.name).filter(Boolean).join(', ');
                const draft = `Results-driven ${role} with a proven track record of delivering measurable outcomes${topSkills ? ` across ${topSkills}` : ''}. Skilled at collaborating with cross-functional teams to turn complex challenges into clear, scalable solutions.`;
                onChange((prev) => ({ ...prev, summary: draft }));
                toast.success('Summary draft inserted');
              }}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Suggest
            </Button>
          )}
        </div>

        <Field label="Summary" hint={`${words} words`}>
          <Textarea
            rows={6}
            value={data.summary}
            onChange={(e) => onChange((prev) => ({ ...prev, summary: e.target.value }))}
            placeholder="Product leader with 8+ years of experience shipping B2B and consumer software..."
          />
        </Field>
      </div>
    );
  }

  /* ---------------- C. Work Experience ---------------- */
  if (section === 'experience') {
    const list = data.experience;
    const setList = (next: typeof list) => onChange((prev) => ({ ...prev, experience: next }));
    const updateAt = (idx: number, patch: Partial<(typeof list)[number]>) =>
      setList(list.map((item, i) => (i === idx ? { ...item, ...patch } : item)));

    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Work Experience</h2>
            <p className="text-xs text-muted-foreground mt-0.5">List your relevant roles starting with the most recent.</p>
          </div>
          <Button size="sm" onClick={() => setList([...list, emptyExperience()])}>
            <Plus className="h-4 w-4" />
            Add Experience
          </Button>
        </div>

        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No work experience added yet.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setList([emptyExperience()])}>
              <Plus className="h-4 w-4" />
              Add your first role
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((exp, idx) => (
              <EntryCard
                key={exp.id}
                title={exp.jobTitle || exp.company || `Experience #${idx + 1}`}
                subtitle={[exp.company, exp.location].filter(Boolean).join(' · ')}
                index={idx}
                total={list.length}
                onMoveUp={() => setList(moveItem(list, idx, idx - 1))}
                onMoveDown={() => setList(moveItem(list, idx, idx + 1))}
                onDelete={() => setList(list.filter((_, i) => i !== idx))}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="Job Title">
                    <Input value={exp.jobTitle} onChange={(e) => updateAt(idx, { jobTitle: e.target.value })} placeholder="Senior Software Engineer" />
                  </Field>
                  <Field label="Company Name">
                    <Input value={exp.company} onChange={(e) => updateAt(idx, { company: e.target.value })} placeholder="Northwind Labs" />
                  </Field>
                  <Field label="Location" className="sm:col-span-2">
                    <Input value={exp.location} onChange={(e) => updateAt(idx, { location: e.target.value })} placeholder="San Francisco, CA (or Remote)" />
                  </Field>
                  <Field label="Start Date" hint="YYYY-MM or YYYY">
                    <Input value={exp.startDate} onChange={(e) => updateAt(idx, { startDate: e.target.value })} placeholder="2021-03" />
                  </Field>
                  <Field label="End Date" hint="YYYY-MM or YYYY">
                    <Input
                      value={exp.current ? '' : exp.endDate}
                      disabled={exp.current}
                      onChange={(e) => updateAt(idx, { endDate: e.target.value })}
                      placeholder={exp.current ? 'Present' : '2024-06'}
                    />
                  </Field>
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-foreground/85 cursor-pointer select-none">
                  <Checkbox checked={exp.current} onCheckedChange={(checked) => updateAt(idx, { current: Boolean(checked) })} />
                  Currently working here
                </label>

                <Field label="Job Responsibilities" hint="One bullet point per line">
                  <Textarea
                    rows={4}
                    value={exp.responsibilities}
                    onChange={(e) => updateAt(idx, { responsibilities: e.target.value })}
                    placeholder="Own the roadmap for the analytics platform&#10;Lead a cross-functional team of engineers and designers"
                  />
                </Field>

                <Field label="Key Achievements" hint="Optional · one per line">
                  <Textarea
                    rows={3}
                    value={exp.achievements}
                    onChange={(e) => updateAt(idx, { achievements: e.target.value })}
                    placeholder="Grew annual recurring revenue by 45%&#10;Reduced onboarding drop-off by 32%"
                  />
                </Field>
              </EntryCard>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ---------------- D. Education ---------------- */
  if (section === 'education') {
    const list = data.education;
    const setList = (next: typeof list) => onChange((prev) => ({ ...prev, education: next }));
    const updateAt = (idx: number, patch: Partial<(typeof list)[number]>) =>
      setList(list.map((item, i) => (i === idx ? { ...item, ...patch } : item)));

    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Education</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Degrees, diplomas, or academic programs.</p>
          </div>
          <Button size="sm" onClick={() => setList([...list, emptyEducation()])}>
            <Plus className="h-4 w-4" />
            Add Education
          </Button>
        </div>

        <div className="space-y-3">
          {list.map((ed, idx) => (
            <EntryCard
              key={ed.id}
              title={ed.degree || ed.institution || `Education #${idx + 1}`}
              subtitle={[ed.institution, ed.endYear].filter(Boolean).join(' · ')}
              index={idx}
              total={list.length}
              onMoveUp={() => setList(moveItem(list, idx, idx - 1))}
              onMoveDown={() => setList(moveItem(list, idx, idx + 1))}
              onDelete={() => setList(list.filter((_, i) => i !== idx))}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Degree / Qualification" className="sm:col-span-2">
                  <Input value={ed.degree} onChange={(e) => updateAt(idx, { degree: e.target.value })} placeholder="B.Sc. Computer Science" />
                </Field>
                <Field label="University / Institution">
                  <Input value={ed.institution} onChange={(e) => updateAt(idx, { institution: e.target.value })} placeholder="University of Washington" />
                </Field>
                <Field label="Location">
                  <Input value={ed.location} onChange={(e) => updateAt(idx, { location: e.target.value })} placeholder="Seattle, WA" />
                </Field>
                <Field label="Start Year">
                  <Input value={ed.startYear} onChange={(e) => updateAt(idx, { startYear: e.target.value })} placeholder="2018" />
                </Field>
                <Field label="End Year">
                  <Input value={ed.endYear} onChange={(e) => updateAt(idx, { endYear: e.target.value })} placeholder="2022" />
                </Field>
                <Field label="Grade / CGPA / Percentage" className="sm:col-span-2">
                  <Input value={ed.grade} onChange={(e) => updateAt(idx, { grade: e.target.value })} placeholder="GPA 3.8 / 4.0 or 8.9 CGPA" />
                </Field>
                <Field label="Description" hint="Honors, coursework, or thesis" className="sm:col-span-2">
                  <Textarea rows={2} value={ed.description} onChange={(e) => updateAt(idx, { description: e.target.value })} placeholder="Relevant coursework, honors, or thesis title..." />
                </Field>
              </div>
            </EntryCard>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------- E. Skills ---------------- */
  if (section === 'skills') {
    const list = data.skills;
    const setList = (next: typeof list) => onChange((prev) => ({ ...prev, skills: next }));

    const addSkill = () => {
      const names = newSkill
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!names.length) return;
      setList([...list, ...names.map((n) => emptySkill(n))]);
      setNewSkill('');
    };

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Skills</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add skills one by one or paste a comma-separated list. Optional proficiency levels power skill bars on supported templates.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder="e.g. TypeScript, Product Strategy, SQL"
          />
          <Button type="button" onClick={addSkill}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {list.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No skills yet. Type a skill above and press Enter.
          </p>
        ) : (
          <div className="space-y-2">
            {list.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <Input
                  value={s.name}
                  onChange={(e) => setList(list.map((item, i) => (i === idx ? { ...item, name: e.target.value } : item)))}
                  className="h-8 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                />
                <Select
                  value={String(s.level)}
                  onValueChange={(v) => setList(list.map((item, i) => (i === idx ? { ...item, level: Number(v) } : item)))}
                >
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No level</SelectItem>
                    {[1, 2, 3, 4, 5].map((lv) => (
                      <SelectItem key={lv} value={String(lv)}>
                        {SKILL_LEVEL_LABELS[lv]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setList(list.filter((_, i) => i !== idx))}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove skill"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ---------------- F. Projects ---------------- */
  if (section === 'projects') {
    const list = data.projects;
    const setList = (next: typeof list) => onChange((prev) => ({ ...prev, projects: next }));
    const updateAt = (idx: number, patch: Partial<(typeof list)[number]>) =>
      setList(list.map((item, i) => (i === idx ? { ...item, ...patch } : item)));

    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Projects</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Highlight personal, open-source, or academic projects.</p>
          </div>
          <Button size="sm" onClick={() => setList([...list, emptyProject()])}>
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        </div>

        <div className="space-y-3">
          {list.map((proj, idx) => (
            <EntryCard
              key={proj.id}
              title={proj.name || `Project #${idx + 1}`}
              subtitle={proj.technologies}
              index={idx}
              total={list.length}
              onMoveUp={() => setList(moveItem(list, idx, idx - 1))}
              onMoveDown={() => setList(moveItem(list, idx, idx + 1))}
              onDelete={() => setList(list.filter((_, i) => i !== idx))}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Project Name">
                  <Input value={proj.name} onChange={(e) => updateAt(idx, { name: e.target.value })} placeholder="Campus Connect" />
                </Field>
                <Field label="Technologies Used">
                  <Input value={proj.technologies} onChange={(e) => updateAt(idx, { technologies: e.target.value })} placeholder="React, TypeScript, PostgreSQL" />
                </Field>
                <Field label="Project URL" className="sm:col-span-2">
                  <Input value={proj.url} onChange={(e) => updateAt(idx, { url: e.target.value })} placeholder="github.com/username/project" />
                </Field>
                <Field label="Project Description" className="sm:col-span-2">
                  <Textarea rows={3} value={proj.description} onChange={(e) => updateAt(idx, { description: e.target.value })} placeholder="What you built and its impact..." />
                </Field>
              </div>
            </EntryCard>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------- G. Certifications ---------------- */
  if (section === 'certifications') {
    const list = data.certifications;
    const setList = (next: typeof list) => onChange((prev) => ({ ...prev, certifications: next }));
    const updateAt = (idx: number, patch: Partial<(typeof list)[number]>) =>
      setList(list.map((item, i) => (i === idx ? { ...item, ...patch } : item)));

    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Certifications</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Professional licenses and verified credentials.</p>
          </div>
          <Button size="sm" onClick={() => setList([...list, emptyCertification()])}>
            <Plus className="h-4 w-4" />
            Add Certification
          </Button>
        </div>

        <div className="space-y-3">
          {list.map((cert, idx) => (
            <EntryCard
              key={cert.id}
              title={cert.name || `Certification #${idx + 1}`}
              subtitle={[cert.issuer, cert.date].filter(Boolean).join(' · ')}
              index={idx}
              total={list.length}
              onMoveUp={() => setList(moveItem(list, idx, idx - 1))}
              onMoveDown={() => setList(moveItem(list, idx, idx + 1))}
              onDelete={() => setList(list.filter((_, i) => i !== idx))}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Certification Name" className="sm:col-span-2">
                  <Input value={cert.name} onChange={(e) => updateAt(idx, { name: e.target.value })} placeholder="AWS Solutions Architect" />
                </Field>
                <Field label="Issuing Organization">
                  <Input value={cert.issuer} onChange={(e) => updateAt(idx, { issuer: e.target.value })} placeholder="Amazon Web Services" />
                </Field>
                <Field label="Issue Date" hint="YYYY-MM or YYYY">
                  <Input value={cert.date} onChange={(e) => updateAt(idx, { date: e.target.value })} placeholder="2024-05" />
                </Field>
                <Field label="Credential URL" className="sm:col-span-2">
                  <Input value={cert.url} onChange={(e) => updateAt(idx, { url: e.target.value })} placeholder="credly.com/badges/..." />
                </Field>
              </div>
            </EntryCard>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------- H. Languages ---------------- */
  if (section === 'languages') {
    const list = data.languages;
    const setList = (next: typeof list) => onChange((prev) => ({ ...prev, languages: next }));

    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Languages</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Languages you speak and your proficiency level.</p>
          </div>
          <Button size="sm" onClick={() => setList([...list, emptyLanguage()])}>
            <Plus className="h-4 w-4" />
            Add Language
          </Button>
        </div>

        <div className="space-y-2.5">
          {list.map((lang, idx) => (
            <div key={lang.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 rounded-lg border border-border bg-card p-2.5">
              <Input
                value={lang.language}
                onChange={(e) => setList(list.map((item, i) => (i === idx ? { ...item, language: e.target.value } : item)))}
                placeholder="English"
              />
              <Select
                value={lang.proficiency || '__none'}
                onValueChange={(v) =>
                  setList(list.map((item, i) => (i === idx ? { ...item, proficiency: v === '__none' ? '' : v } : item)))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Proficiency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Not specified</SelectItem>
                  {LANGUAGE_LEVELS.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>
                      {lvl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setList(list.filter((_, i) => i !== idx))}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove language"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------- I. Additional / Custom Sections ---------------- */
  if (isExtraKey(section)) {
    const secId = section.slice('extra:'.length);
    const sec = data.additional.find((s) => s.id === secId);
    if (!sec) return null;
    const meta = ADDITIONAL_SECTION_META[sec.type];

    const updateSec = (updater: (s: NonNullable<typeof sec>) => NonNullable<typeof sec>) =>
      onChange((prev) => ({
        ...prev,
        additional: prev.additional.map((s) => (s.id === secId ? updater(s) : s)),
      }));

    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Label>Section Title</Label>
            <Input
              value={sec.title}
              onChange={(e) => updateSec((s) => ({ ...s, title: e.target.value }))}
              className="mt-1 font-medium"
            />
          </div>
          <div className="flex items-center gap-1.5 pt-5">
            <Button size="sm" onClick={() => updateSec((s) => ({ ...s, items: [...s.items, emptyAdditionalItem()] }))}>
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              className="text-muted-foreground hover:text-destructive"
              title="Remove section"
              onClick={() => onRemoveAdditional(secId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {sec.items.map((item, idx) => (
            <EntryCard
              key={item.id}
              title={item.title || `${meta.titleLabel} #${idx + 1}`}
              subtitle={[item.subtitle, item.date].filter(Boolean).join(' · ')}
              index={idx}
              total={sec.items.length}
              onMoveUp={() => updateSec((s) => ({ ...s, items: moveItem(s.items, idx, idx - 1) }))}
              onMoveDown={() => updateSec((s) => ({ ...s, items: moveItem(s.items, idx, idx + 1) }))}
              onDelete={() => updateSec((s) => ({ ...s, items: s.items.filter((_, i) => i !== idx) }))}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label={meta.titleLabel} className={meta.subtitleLabel ? '' : 'sm:col-span-2'}>
                  <Input
                    value={item.title}
                    onChange={(e) =>
                      updateSec((s) => ({
                        ...s,
                        items: s.items.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)),
                      }))
                    }
                  />
                </Field>
                {meta.subtitleLabel && (
                  <Field label={meta.subtitleLabel}>
                    <Input
                      value={item.subtitle}
                      onChange={(e) =>
                        updateSec((s) => ({
                          ...s,
                          items: s.items.map((x, i) => (i === idx ? { ...x, subtitle: e.target.value } : x)),
                        }))
                      }
                    />
                  </Field>
                )}
                {meta.dateLabel && (
                  <Field label={meta.dateLabel}>
                    <Input
                      value={item.date}
                      onChange={(e) =>
                        updateSec((s) => ({
                          ...s,
                          items: s.items.map((x, i) => (i === idx ? { ...x, date: e.target.value } : x)),
                        }))
                      }
                    />
                  </Field>
                )}
                {meta.hasDescription && (
                  <Field label="Description" className="sm:col-span-2">
                    <Textarea
                      rows={3}
                      value={item.description}
                      onChange={(e) =>
                        updateSec((s) => ({
                          ...s,
                          items: s.items.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)),
                        }))
                      }
                    />
                  </Field>
                )}
              </div>
            </EntryCard>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
