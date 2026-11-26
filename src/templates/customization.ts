import type { Customization } from '@/types/resume';
import { DEFAULT_CUSTOMIZATION } from '@/lib/resume/defaults';
import { getTemplate } from './meta';

/** Full customization for a template using only its defaults. */
export function templateDefaultCustomization(templateId: string): Customization {
  const t = getTemplate(templateId);
  return {
    ...DEFAULT_CUSTOMIZATION,
    ...t.defaults,
    layoutVariant: t.variants[0]?.id ?? 'default',
  };
}

/**
 * Customization when switching templates: the template's typographic
 * defaults are applied but the user's explicit choices for color, sizing,
 * spacing and photo visibility are preserved.
 */
export function customizationForSwitch(prev: Customization, prevTemplateId: string, nextTemplateId: string): Customization {
  const next = getTemplate(nextTemplateId);
  const prevTpl = getTemplate(prevTemplateId);
  const prevDefaults = templateDefaultCustomization(prevTemplateId);
  const d = templateDefaultCustomization(nextTemplateId);
  const keys: (keyof Customization)[] = ['primaryColor', 'fontFamily', 'fontSize', 'pageMargin', 'headingStyle', 'sectionSpacing', 'showPhoto'];
  const out: Customization = { ...d };
  for (const k of keys) {
    // Keep a value only if the user deliberately changed it from the old template's default.
    if (prev[k] !== prevDefaults[k]) (out as unknown as Record<string, unknown>)[k] = prev[k];
  }
  if (next.monochrome) out.primaryColor = d.primaryColor;
  if (prevTpl.monochrome && !next.monochrome && prev.primaryColor === prevDefaults.primaryColor) out.primaryColor = d.primaryColor;
  return out;
}

/** Resolves the active layout variant, falling back to the template default. */
export function activeVariant(templateId: string, c: Customization): string {
  const t = getTemplate(templateId);
  return t.variants.some((v) => v.id === c.layoutVariant) ? c.layoutVariant : t.variants[0]?.id ?? 'default';
}
