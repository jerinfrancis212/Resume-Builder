import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, Search, Sparkles, X } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { TemplateThumbnail } from '@/components/TemplateThumbnail';
import { TemplatePreviewModal } from '@/components/TemplatePreviewModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/primitives';
import { TEMPLATE_CATEGORIES, TEMPLATES, type TemplateCategory, type TemplateMeta } from '@/templates/meta';
import { useResumeStore } from '@/store/useResumeStore';
import { cn } from '@/lib/utils';

/** Crisp inline European Union flag icon (renders consistently across all OSes). */
export function EuFlagIcon({ className }: { className?: string }) {
  const stars = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    const cx = 12 + 4.8 * Math.cos(angle);
    const cy = 8 + 4.8 * Math.sin(angle);
    return <circle key={i} cx={cx} cy={cy} r="0.85" fill="#FFCC00" />;
  });
  return (
    <svg viewBox="0 0 24 16" className={cn('h-3.5 w-5 shrink-0 rounded-[2px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.12)]', className)} aria-hidden="true">
      <rect width="24" height="16" fill="#003399" />
      {stars}
    </svg>
  );
}

export function TemplatesPage() {
  const navigate = useNavigate();
  const { createResume, updateCustomization } = useResumeStore();
  const [category, setCategory] = useState<'All' | TemplateCategory>('All');
  const [query, setQuery] = useState('');
  const [startWithSample, setStartWithSample] = useState(true);
  const [previewTpl, setPreviewTpl] = useState<TemplateMeta | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter((t) => {
      const catOk = category === 'All' || t.categories.includes(category);
      const qOk =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.categories.some((c) => c.toLowerCase().includes(q)) ||
        t.highlights.some((h) => h.toLowerCase().includes(q));
      return catOk && qOk;
    });
  }, [category, query]);

  const handleUseTemplate = (templateId: string, color?: string) => {
    const doc = createResume(templateId, { withSample: startWithSample });
    if (color) updateCustomization({ primaryColor: color });
    setPreviewTpl(null);
    navigate(`/editor/${doc.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border/80 bg-secondary/30">
          <div className="container py-12 sm:py-14">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Resume Template Library</p>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                  Choose a template that fits your career
                </h1>
                <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                  All 13 templates feature distinct layouts, true A4 multi-page support, and selectable-text PDF export. Switch templates anytime inside the editor without losing your information.
                </p>
              </div>

              {/* Improved Search Bar + Sample Toggle */}
              <div className="w-full lg:w-[380px] space-y-2.5">
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search templates by name or style…"
                    aria-label="Search resume templates"
                    className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-20 text-sm text-foreground shadow-soft transition-all placeholder:text-muted-foreground/75 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="absolute right-2.5 flex items-center gap-1.5">
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery('')}
                        aria-label="Clear search"
                        className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {filtered.length}
                    </span>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none pl-1">
                  <input
                    type="checkbox"
                    checked={startWithSample}
                    onChange={(e) => setStartWithSample(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-input accent-primary"
                  />
                  Pre-fill new resume with sample content
                </label>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="mt-7 flex flex-wrap items-center gap-2">
              {(['All', ...TEMPLATE_CATEGORIES] as const).map((cat) => {
                const isEuropass = cat === 'Europass CV';
                const isActive = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                      isEuropass
                        ? isActive
                          ? 'bg-[#003399] text-white shadow-soft ring-2 ring-[#003399]/25'
                          : 'border border-[#003399]/35 bg-[#003399]/[0.06] text-[#003399] hover:bg-[#003399]/12'
                        : isActive
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-secondary',
                    )}
                  >
                    {isEuropass && <EuFlagIcon />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="container py-12">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <Sparkles className="mx-auto h-7 w-7 text-muted-foreground/60 mb-3" />
              <p className="text-sm font-medium text-foreground">No templates match your filter</p>
              <p className="mt-1 text-xs text-muted-foreground">Try clearing your search or choosing another category.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setCategory('All');
                  setQuery('');
                }}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {filtered.map((tpl) => (
                <article
                  key={tpl.id}
                  className="group rounded-xl border border-border bg-card p-4 shadow-soft transition-all hover:shadow-lift hover:border-primary/30 flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewTpl(tpl)}
                    className="relative mb-4 block w-full text-left overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {tpl.id === 'europass' && (
                      <span className="absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#003399] px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                        <EuFlagIcon className="h-2.5 w-3.5" />
                        Europass CV
                      </span>
                    )}
                    <TemplateThumbnail templateId={tpl.id} className="transition-transform duration-300 group-hover:scale-[1.015]" />
                  </button>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-semibold text-foreground">{tpl.name}</h2>
                      <Badge variant="secondary" className="shrink-0 text-[11px]">
                        {tpl.categories[0]}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{tpl.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/70 flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewTpl(tpl)}>
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => handleUseTemplate(tpl.id)}>
                      Use This Template
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />

      <TemplatePreviewModal
        template={previewTpl}
        onClose={() => setPreviewTpl(null)}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
}
