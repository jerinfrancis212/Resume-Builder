import { useEffect, useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/primitives';
import type { TemplateMeta } from '@/templates/meta';
import { templateDefaultCustomization } from '@/templates/customization';
import { SAMPLES } from '@/lib/resume/sample';
import { generateResumePdfBlob, renderPdfPagesToImages } from '@/pdf/renderer';
import { cn } from '@/lib/utils';

const ACCENT_SWATCHES = ['#1e3a5f', '#0f766e', '#2563eb', '#9a3412', '#7f1d1d', '#047857', '#4338ca', '#111111'];

interface TemplatePreviewModalProps {
  template: TemplateMeta | null;
  onClose: () => void;
  onUseTemplate: (templateId: string, color?: string) => void;
}

export function TemplatePreviewModal({ template, onClose, onUseTemplate }: TemplatePreviewModalProps) {
  const [color, setColor] = useState<string>('#1e3a5f');
  const [variant, setVariant] = useState<string>('default');
  const [pages, setPages] = useState<{ dataUrl: string; width: number; height: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!template) return;
    setColor(template.defaults.primaryColor);
    setVariant(template.variants[0]?.id ?? 'default');
  }, [template]);

  useEffect(() => {
    if (!template) return;
    let alive = true;
    setLoading(true);
    const base = templateDefaultCustomization(template.id);
    const custom = { ...base, primaryColor: template.monochrome ? base.primaryColor : color, layoutVariant: variant };
    generateResumePdfBlob(template.id, SAMPLES[template.sample], custom)
      .then((blob) => blob.arrayBuffer())
      .then((buf) => renderPdfPagesToImages(new Uint8Array(buf), 1.6))
      .then((imgs) => {
        if (alive) {
          setPages(imgs);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [template, color, variant]);

  return (
    <Dialog open={template !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden gap-0">
        {template && (
          <div className="flex flex-col max-h-[90dvh]">
            <div className="grid md:grid-cols-[1fr_290px] flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
              {/* Left: Live rendered A4 PDF */}
              <div className="bg-slate-100/90 p-4 sm:p-7 md:overflow-y-auto thin-scroll flex flex-col items-center gap-5">
                {loading && pages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-xs">Rendering A4 preview…</span>
                  </div>
                ) : (
                  pages.map((p, idx) => (
                    <div key={idx} className="relative w-full max-w-[520px] bg-white shadow-page rounded-[2px] overflow-hidden">
                      <img src={p.dataUrl} alt={`Page ${idx + 1}`} className="w-full h-auto block" />
                      {loading && (
                        <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Right: Metadata + quick customize */}
              <div className="p-5 sm:p-6 flex flex-col gap-5 border-t md:border-t-0 md:border-l border-border bg-background md:overflow-y-auto">
                <DialogHeader>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {template.categories.map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-[11px]">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                  <DialogTitle className="text-xl">{template.name}</DialogTitle>
                  <DialogDescription className="pt-1 leading-relaxed">{template.description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground/80">Highlights</p>
                  <div className="flex flex-wrap gap-1.5">
                    {template.highlights.map((h) => (
                      <span key={h} className="rounded-md bg-secondary/70 px-2 py-1 text-xs text-muted-foreground">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                {!template.monochrome && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground/80">Accent Color</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set([template.defaults.primaryColor, ...ACCENT_SWATCHES])).map((sw) => (
                        <button
                          key={sw}
                          type="button"
                          onClick={() => setColor(sw)}
                          className={cn(
                            'h-6 w-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ring-offset-2',
                            color === sw && 'ring-2 ring-primary',
                          )}
                          style={{ backgroundColor: sw }}
                          aria-label={`Select color ${sw}`}
                        >
                          {color === sw && <Check className="h-3.5 w-3.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {template.variants.length > 1 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground/80">Layout Variation</p>
                    <div className="grid grid-cols-2 gap-2">
                      {template.variants.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setVariant(v.id)}
                          className={cn(
                            'rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors text-left',
                            variant === v.id
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border text-muted-foreground hover:bg-secondary/60',
                          )}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Bottom Bar — always visible at the bottom of the preview on mobile & desktop */}
            <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-md px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="hidden sm:block text-xs text-muted-foreground">
                Like <span className="font-medium text-foreground">{template.name}</span>? Start editing now — you can switch templates anytime.
              </p>
              <Button className="w-full sm:w-auto sm:min-w-[220px]" size="lg" onClick={() => onUseTemplate(template.id, color)}>
                Use This Template
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
