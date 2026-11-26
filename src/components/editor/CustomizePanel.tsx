import { Check, RotateCcw } from 'lucide-react';
import type { Customization, HeadingStyle } from '@/types/resume';
import { getTemplate } from '@/templates/meta';
import { templateDefaultCustomization } from '@/templates/customization';
import { FONT_FAMILIES } from '@/pdf/fonts';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Slider, Switch } from '@/components/ui/controls';
import { cn } from '@/lib/utils';

const COLOR_SWATCHES = [
  '#1e3a5f',
  '#0f766e',
  '#2563eb',
  '#1d4ed8',
  '#047857',
  '#9a3412',
  '#7f1d1d',
  '#57534e',
  '#4338ca',
  '#6d28d9',
  '#be123c',
  '#111111',
];

const HEADING_STYLES: { id: HeadingStyle; label: string }[] = [
  { id: 'underline', label: 'Underlined' },
  { id: 'bar', label: 'Accent Bar' },
  { id: 'filled', label: 'Shaded' },
  { id: 'plain', label: 'Minimal' },
];

interface CustomizePanelProps {
  templateId: string;
  customization: Customization;
  onChange: (patch: Partial<Customization>) => void;
}

export function CustomizePanel({ templateId, customization, onChange }: CustomizePanelProps) {
  const tpl = getTemplate(templateId);

  const resetDefaults = () => {
    onChange(templateDefaultCustomization(templateId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Customize Design</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fine-tune typography, spacing, and color for <span className="font-medium text-foreground">{tpl.name}</span>.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={resetDefaults} className="text-xs text-muted-foreground">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      {/* Primary color */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label>Primary Color</Label>
          {tpl.monochrome ? (
            <span className="text-[11px] text-muted-foreground">Monochrome template</span>
          ) : (
            <span className="font-mono text-[11px] text-muted-foreground">{customization.primaryColor}</span>
          )}
        </div>
        <div className={cn('flex flex-wrap items-center gap-2', tpl.monochrome && 'opacity-40 pointer-events-none')}>
          {COLOR_SWATCHES.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => onChange({ primaryColor: hex })}
              className={cn(
                'h-7 w-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 ring-offset-2',
                customization.primaryColor.toLowerCase() === hex && 'ring-2 ring-primary',
              )}
              style={{ backgroundColor: hex }}
              aria-label={`Color ${hex}`}
            >
              {customization.primaryColor.toLowerCase() === hex && <Check className="h-3.5 w-3.5 text-white" />}
            </button>
          ))}
          <label
            className="h-7 w-7 rounded-full border border-dashed border-input flex items-center justify-center cursor-pointer text-[10px] text-muted-foreground hover:border-primary"
            title="Custom color"
          >
            +
            <input
              type="color"
              value={customization.primaryColor}
              onChange={(e) => onChange({ primaryColor: e.target.value })}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Layout variation */}
      {tpl.variants.length > 1 && (
        <div className="space-y-2">
          <Label>Layout Variation</Label>
          <div className="grid grid-cols-2 gap-2">
            {tpl.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onChange({ layoutVariant: v.id })}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs font-medium transition-colors text-left',
                  customization.layoutVariant === v.id
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

      {/* Font family */}
      <div className="space-y-2">
        <Label>Font Family</Label>
        <Select value={customization.fontFamily} onValueChange={(fontFamily) => onChange({ fontFamily })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <span className="flex items-center justify-between gap-4">
                  <span>{f.label}</span>
                  <span className="text-[10px] uppercase text-muted-foreground">{f.category}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Heading style */}
      <div className="space-y-2">
        <Label>Heading Style</Label>
        <div className="grid grid-cols-2 gap-2">
          {HEADING_STYLES.map((hs) => (
            <button
              key={hs.id}
              type="button"
              onClick={() => onChange({ headingStyle: hs.id })}
              className={cn(
                'rounded-lg border px-3 py-2 text-xs font-medium transition-colors text-left',
                customization.headingStyle === hs.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:bg-secondary/60',
              )}
            >
              {hs.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label>Font Size</Label>
          <span className="text-xs font-mono text-muted-foreground">{customization.fontSize.toFixed(1)} pt</span>
        </div>
        <Slider
          min={8}
          max={11.5}
          step={0.5}
          value={[customization.fontSize]}
          onValueChange={([v]) => onChange({ fontSize: v })}
        />
      </div>

      {/* Section spacing */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label>Section Spacing</Label>
          <span className="text-xs font-mono text-muted-foreground">{Math.round(customization.sectionSpacing * 100)}%</span>
        </div>
        <Slider
          min={0.6}
          max={1.6}
          step={0.1}
          value={[customization.sectionSpacing]}
          onValueChange={([v]) => onChange({ sectionSpacing: Number(v.toFixed(2)) })}
        />
      </div>

      {/* Page margins */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label>Page Margins</Label>
          <span className="text-xs font-mono text-muted-foreground">{customization.pageMargin} pt</span>
        </div>
        <Slider
          min={24}
          max={58}
          step={2}
          value={[customization.pageMargin]}
          onValueChange={([v]) => onChange({ pageMargin: v })}
        />
      </div>

      {/* Profile photo toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
        <div>
          <p className="text-xs font-medium text-foreground">Show Profile Photo</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {tpl.supportsPhoto
              ? 'Display your uploaded photo in the resume header.'
              : 'This template is text-only and does not display a photo.'}
          </p>
        </div>
        <Switch
          checked={customization.showPhoto}
          disabled={!tpl.supportsPhoto}
          onCheckedChange={(showPhoto) => onChange({ showPhoto })}
        />
      </div>
    </div>
  );
}
