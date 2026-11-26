import { useEffect, useRef, useState } from 'react';
import { Loader2, ZoomIn, ZoomOut, RotateCcw, AlertCircle } from 'lucide-react';
import type { Customization, ResumeData } from '@/types/resume';
import { generateResumePdfBlob, renderPdfPagesToImages } from '@/pdf/renderer';
import { Button } from '@/components/ui/button';

interface LivePdfPreviewProps {
  templateId: string;
  data: ResumeData;
  customization: Customization;
}

/**
 * Renders the exact react-pdf A4 document into page canvases via pdf.js.
 * Automatically fits the A4 page to the viewport on mobile and desktop,
 * while allowing smooth zoom in/out and panning.
 */
export function LivePdfPreview({ templateId, data, customization }: LivePdfPreviewProps) {
  const [pages, setPages] = useState<{ dataUrl: string; width: number; height: number }[]>([]);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [containerWidth, setContainerWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const runId = useRef(0);

  // Measure the live scroll viewport so 100% zoom always fits mobile & desktop cleanly
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => {
      if (el.clientWidth > 0) setContainerWidth(el.clientWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const id = ++runId.current;
    setRendering(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const blob = await generateResumePdfBlob(templateId, data, customization);
        if (runId.current !== id) return;
        const buf = new Uint8Array(await blob.arrayBuffer());
        const imgs = await renderPdfPagesToImages(buf, 1.85);
        if (runId.current !== id) return;
        setPages(imgs);
        setRendering(false);
      } catch (err) {
        if (runId.current !== id) return;
        setError(err instanceof Error ? err.message : 'Preview failed to render');
        setRendering(false);
      }
    }, 260);

    return () => clearTimeout(timer);
  }, [templateId, data, customization]);

  const zoomOut = () => setZoom((z) => Math.max(60, z - 15));
  const zoomIn = () => setZoom((z) => Math.min(180, z + 15));

  // Base fit width: fill mobile width minus padding (24px), cap at 580px on large desktops
  const isCompact = containerWidth > 0 && containerWidth < 640;
  const horizontalPad = isCompact ? 24 : 56;
  const baseWidth = containerWidth > 0 ? Math.min(580, Math.max(240, containerWidth - horizontalPad)) : 340;
  const pageWidth = Math.round((baseWidth * zoom) / 100);

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-100/90">
      {/* Preview Toolbar */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border/80 bg-background/95 px-3 sm:px-3.5 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          <span className="font-medium text-foreground truncate">
            {pages.length ? `${pages.length} ${pages.length === 1 ? 'Page' : 'Pages'} · A4` : 'A4 Preview'}
          </span>
          {rendering && (
            <span className="inline-flex items-center gap-1 text-[11px] text-primary shrink-0">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="hidden xs:inline">Updating…</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={zoomOut} disabled={zoom <= 60} aria-label="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="w-10 text-center font-mono text-[11px] text-muted-foreground">{zoom}%</span>
          <Button variant="ghost" size="icon-sm" onClick={zoomIn} disabled={zoom >= 180} aria-label="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          {zoom !== 100 && (
            <Button variant="ghost" size="icon-sm" onClick={() => setZoom(100)} aria-label="Reset zoom" title="Fit to width">
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable A4 pages viewport (supports touch pan when zoomed in) */}
      <div
        ref={viewportRef}
        className="flex-1 min-h-0 overflow-auto overscroll-contain thin-scroll p-3 sm:p-7"
      >
        {error ? (
          <div className="mx-auto max-w-sm rounded-xl border border-destructive/30 bg-background p-5 text-center space-y-2 mt-12">
            <AlertCircle className="mx-auto h-6 w-6 text-destructive" />
            <p className="text-sm font-medium text-foreground">Could not render preview</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="flex h-full items-center justify-center py-24 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs">Rendering live A4 resume…</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 pb-10 min-w-full">
            {pages.map((p, idx) => (
              <div
                key={idx}
                className="mx-auto flex flex-col items-center gap-2 shrink-0"
                style={{ width: `${pageWidth}px` }}
              >
                <div className="relative w-full aspect-[210/297] bg-white shadow-page rounded-[2px] ring-1 ring-slate-900/5 overflow-hidden">
                  <img
                    src={p.dataUrl}
                    alt={`Resume page ${idx + 1}`}
                    className="h-full w-full object-contain block select-none"
                  />
                </div>
                {pages.length > 1 && (
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Page {idx + 1} of {pages.length}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
