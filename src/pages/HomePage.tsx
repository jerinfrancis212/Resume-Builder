import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  Layers,
  LayoutTemplate,
  Smartphone,
  SlidersHorizontal,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { TemplateThumbnail } from '@/components/TemplateThumbnail';
import { TemplatePreviewModal } from '@/components/TemplatePreviewModal';
import { EuFlagIcon } from '@/pages/TemplatesPage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/primitives';
import { TEMPLATES, type TemplateMeta } from '@/templates/meta';
import { useResumeStore } from '@/store/useResumeStore';

const SHOWCASE_IDS = ['europass', 'modern-minimal', 'executive', 'two-column', 'creative', 'technical'];

const FEATURES = [
  {
    icon: LayoutTemplate,
    title: 'Professional resume templates',
    description: '12 genuinely distinct layouts crafted for corporate, creative, technical, academic, and graduate roles.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Easy editing & customization',
    description: 'Clean, structured forms with drag-and-drop reordering, typography controls, spacing, and color themes.',
  },
  {
    icon: Eye,
    title: 'True live resume preview',
    description: 'See your exact A4 pages update in real time—complete with accurate margins and multi-page breaks.',
  },
  {
    icon: Download,
    title: 'Selectable-text PDF downloads',
    description: 'Export crisp vector A4 PDFs with embedded fonts and selectable text that match the live preview identically.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-friendly editor',
    description: 'Refine your resume from desktop or mobile with a responsive workspace and instant tab switching.',
  },
  {
    icon: Layers,
    title: 'Switch templates anytime',
    description: 'Try any of the 12 templates at any point without re-typing or losing a single word of your experience.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Pick a template',
    description: 'Browse 12 recruiter-ready designs across modern, classic, ATS-friendly, creative, and academic styles.',
  },
  {
    step: '02',
    title: 'Add your details',
    description: 'Fill in guided sections for experience, education, skills, and projects while watching your A4 preview update live.',
  },
  {
    step: '03',
    title: 'Download your PDF',
    description: 'Fine-tune colors, fonts, and spacing, then export a high-resolution, ATS-readable PDF in one click.',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { createResume, updateCustomization } = useResumeStore();
  const [previewTpl, setPreviewTpl] = useState<TemplateMeta | null>(null);

  const showcase = SHOWCASE_IDS.map((id) => TEMPLATES.find((t) => t.id === id)!).filter(Boolean);

  const startWithTemplate = (templateId: string, color?: string) => {
    const doc = createResume(templateId, { withSample: false });
    if (color) updateCustomization({ primaryColor: color });
    setPreviewTpl(null);
    navigate(`/editor/${doc.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border/70 bg-gradient-to-b from-secondary/40 via-background to-background">
          <div className="container py-16 sm:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1 text-xs font-medium text-muted-foreground shadow-soft">
                <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                13 A4 PDF Templates · ATS-Friendly · No Sign-Up Required to Start
              </div>

              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground leading-[1.12]">
                Build a Professional Resume That Gets You Noticed
              </h1>

              <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Choose a professional template, add your details, and create a job-ready resume in minutes.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" className="w-full sm:w-auto px-7" onClick={() => navigate('/templates')}>
                  Create My Resume
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-7" asChild>
                  <Link to="/templates">Explore Templates</Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  100% selectable text PDF
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Multi-page A4 layout
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Instant template switching
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Template Showcase */}
        <section className="py-16 sm:py-22">
          <div className="container">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Template Library</p>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  Designed to pass ATS & impress hiring managers
                </h2>
              </div>
              <Button variant="outline" asChild>
                <Link to="/templates">
                  View all 13 templates
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {showcase.map((tpl) => (
                <div
                  key={tpl.id}
                  className="group rounded-xl border border-border bg-card p-4 shadow-soft transition-all hover:shadow-lift hover:border-primary/30 flex flex-col"
                >
                  <div className="relative mb-4 overflow-hidden rounded-lg bg-secondary/40">
                    {tpl.id === 'europass' && (
                      <span className="absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#003399] px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                        <EuFlagIcon className="h-2.5 w-3.5" />
                        Europass CV
                      </span>
                    )}
                    <TemplateThumbnail templateId={tpl.id} className="transition-transform duration-300 group-hover:scale-[1.015]" />
                    <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/25 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <Button size="sm" variant="secondary" onClick={() => setPreviewTpl(tpl)}>
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </Button>
                      <Button size="sm" onClick={() => startWithTemplate(tpl.id)}>
                        Use Template
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{tpl.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{tpl.description}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[11px]">
                      {tpl.categories[0]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-border/80 bg-secondary/35 py-16 sm:py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">How It Works</p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                From blank page to polished PDF in 3 simple steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {STEPS.map((s) => (
                <div key={s.step} className="rounded-xl border border-border bg-background p-6 shadow-soft">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {s.step}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-16 sm:py-22">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Built for Quality</p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Everything you need, without the clutter
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-xl border border-border/80 bg-card p-6 shadow-soft">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-border/80 bg-primary text-primary-foreground">
          <div className="container py-14 sm:py-16 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Ready to craft your next resume?</h2>
              <p className="mt-2 text-sm sm:text-base text-primary-foreground/80">
                Start editing right away—your draft saves automatically, and you can sign in anytime to sync across devices.
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              className="shrink-0 bg-white text-primary hover:bg-white/90 px-7"
              onClick={() => navigate('/templates')}
            >
              Create My Resume
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />

      <TemplatePreviewModal
        template={previewTpl}
        onClose={() => setPreviewTpl(null)}
        onUseTemplate={startWithTemplate}
      />
    </div>
  );
}
