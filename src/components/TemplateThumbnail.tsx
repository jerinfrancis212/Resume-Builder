import { useEffect, useRef, useState } from 'react';
import type { Customization, ResumeData } from '@/types/resume';
import { getTemplate } from '@/templates/meta';
import { templateDefaultCustomization } from '@/templates/customization';
import { SAMPLES } from '@/lib/resume/sample';
import { getTemplateThumbnail } from '@/pdf/renderer';
import { cn } from '@/lib/utils';

interface TemplateThumbnailProps {
  templateId: string;
  /** Optional live user data; defaults to the template's curated sample persona. */
  data?: ResumeData;
  customization?: Customization;
  /** Cache-busting key (e.g. `${doc.id}:${doc.updatedAt}`) so edited resumes re-render fresh thumbnails immediately. */
  versionKey?: string;
  className?: string;
}

/** Renders the real first-page A4 PDF preview of a template, lazily when visible. */
export function TemplateThumbnail({ templateId, data, customization, versionKey, className }: TemplateThumbnailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '240px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    const meta = getTemplate(templateId);
    const d = data ?? SAMPLES[meta.sample];
    const c = customization ?? templateDefaultCustomization(meta.id);
    const cacheKey = data
      ? `doc:${meta.id}:${versionKey ?? `${customization?.primaryColor ?? ''}:${customization?.layoutVariant ?? ''}:${JSON.stringify(data).length}`}`
      : `sample:${meta.id}`;
    getTemplateThumbnail(meta.id, d, c, cacheKey)
      .then((url) => {
        if (alive) setSrc(url);
      })
      .catch(() => {
        // Ignore transient render errors
      });
    return () => {
      alive = false;
    };
  }, [visible, templateId, data, customization, versionKey]);

  return (
    <div
      ref={ref}
      className={cn(
        'relative aspect-[210/297] w-full overflow-hidden rounded-lg border border-border/80 bg-white shadow-soft',
        className,
      )}
    >
      {src ? (
        <img src={src} alt={`${getTemplate(templateId).name} resume preview`} className="h-full w-full object-cover object-top" />
      ) : (
        <div className="flex h-full w-full flex-col gap-3 p-5 animate-pulse bg-white">
          <div className="h-4 w-2/3 rounded bg-slate-200/80" />
          <div className="h-2.5 w-1/2 rounded bg-slate-100" />
          <div className="mt-2 h-px w-full bg-slate-100" />
          <div className="space-y-2 mt-1">
            <div className="h-2 w-full rounded bg-slate-100" />
            <div className="h-2 w-11/12 rounded bg-slate-100" />
            <div className="h-2 w-4/5 rounded bg-slate-100" />
          </div>
          <div className="mt-3 h-3 w-1/3 rounded bg-slate-200/70" />
          <div className="space-y-2">
            <div className="h-2 w-full rounded bg-slate-100" />
            <div className="h-2 w-5/6 rounded bg-slate-100" />
            <div className="h-2 w-3/4 rounded bg-slate-100" />
          </div>
        </div>
      )}
    </div>
  );
}
