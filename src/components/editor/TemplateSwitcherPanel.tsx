import { useState } from 'react';
import { Check } from 'lucide-react';
import { TEMPLATE_CATEGORIES, TEMPLATES, type TemplateCategory } from '@/templates/meta';
import { TemplateThumbnail } from '@/components/TemplateThumbnail';
import { EuFlagIcon } from '@/pages/TemplatesPage';
import { cn } from '@/lib/utils';

interface TemplateSwitcherPanelProps {
  activeTemplateId: string;
  onSelect: (templateId: string) => void;
}

export function TemplateSwitcherPanel({ activeTemplateId, onSelect }: TemplateSwitcherPanelProps) {
  const [cat, setCat] = useState<'All' | TemplateCategory>('All');
  const list = cat === 'All' ? TEMPLATES : TEMPLATES.filter((t) => t.categories.includes(cat));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Switch Template</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          All your resume details are preserved automatically when switching templates.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(['All', ...TEMPLATE_CATEGORIES] as const).map((c) => {
          const isEuropass = c === 'Europass CV';
          const isActive = cat === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                isEuropass
                  ? isActive
                    ? 'bg-[#003399] text-white'
                    : 'border border-[#003399]/35 bg-[#003399]/[0.06] text-[#003399] hover:bg-[#003399]/12'
                  : isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              {isEuropass && <EuFlagIcon className="h-3 w-4" />}
              {c}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        {list.map((tpl) => {
          const isActive = tpl.id === activeTemplateId;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl.id)}
              className={cn(
                'group relative rounded-xl border p-2.5 text-left transition-all hover:border-primary/50',
                isActive ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card',
              )}
            >
              <div className="relative">
                <TemplateThumbnail templateId={tpl.id} />
                {isActive && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Check className="h-3 w-3 stroke-[2.5]" />
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs font-semibold text-foreground truncate">{tpl.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{tpl.categories[0]}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
