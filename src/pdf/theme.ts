import type { Customization } from '@/types/resume';

/** Mixes two hex colors. amount=0 → a, amount=1 → b */
export function mix(a: string, b: string, amount: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * amount);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * amount);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * amount);
  return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

export function parseHex(hex: string): [number, number, number] {
  let h = (hex || '#000000').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) h = '000000';
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function isDark(hex: string): boolean {
  const [r, g, b] = parseHex(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 < 150;
}

export const tint = (hex: string, amount: number) => mix(hex, '#ffffff', amount);
export const shade = (hex: string, amount: number) => mix(hex, '#000000', amount);

export interface Theme {
  c: Customization;
  primary: string;
  /** Primary color tinted for subtle backgrounds. */
  primarySoft: string;
  /** Readable text color on top of the primary color. */
  onPrimary: string;
  text: string;
  muted: string;
  faint: string;
  rule: string;
  font: string;
  fs: {
    base: number;
    small: number;
    tiny: number;
    h: number;
    name: number;
    title: number;
  };
  lh: number;
  /** Vertical gap between sections. */
  sectionGap: number;
  /** Vertical gap between items inside a section. */
  itemGap: number;
  margin: number;
}

export interface ThemeOptions {
  nameScale?: number;
  text?: string;
  muted?: string;
  lineHeight?: number;
}

export function buildTheme(c: Customization, opts: ThemeOptions = {}): Theme {
  const base = clamp(c.fontSize || 9.5, 7.5, 12);
  const spacing = clamp(c.sectionSpacing || 1, 0.5, 2);
  return {
    c,
    primary: c.primaryColor,
    primarySoft: tint(c.primaryColor, 0.9),
    onPrimary: isDark(c.primaryColor) ? '#ffffff' : '#111111',
    text: opts.text ?? '#1f2328',
    muted: opts.muted ?? '#5b6270',
    faint: '#8a909c',
    rule: '#d9dce1',
    font: c.fontFamily,
    fs: {
      base,
      small: round(base * 0.9),
      tiny: round(base * 0.8),
      h: round(base * 1.12),
      name: round(base * (opts.nameScale ?? 2.5)),
      title: round(base * 1.2),
    },
    lh: opts.lineHeight ?? 1.42,
    sectionGap: round(14 * spacing),
    itemGap: round(8 * spacing),
    margin: clamp(c.pageMargin || 40, 18, 72),
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function round(n: number) {
  return Math.round(n * 100) / 100;
}
