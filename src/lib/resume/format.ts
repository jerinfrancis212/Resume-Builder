const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2022-05" → "May 2022", "2022" → "2022", anything else returned trimmed. */
export function formatDate(value: string | undefined | null): string {
  if (!value) return '';
  const v = value.trim();
  const m = /^(\d{4})-(\d{1,2})$/.exec(v);
  if (m) {
    const month = MONTHS[Number(m[2]) - 1];
    return month ? `${month} ${m[1]}` : m[1];
  }
  return v;
}

export function formatRange(start?: string, end?: string, current?: boolean, presentLabel = 'Present'): string {
  const s = formatDate(start);
  const e = current ? presentLabel : formatDate(end);
  if (s && e) return `${s} – ${e}`;
  return s || e || '';
}

/** Splits multi-line text into trimmed, non-empty lines, stripping bullet glyphs. */
export function toLines(text: string | undefined | null): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*([-•*·▪●]|\d+[.)])\s+/, '').trim())
    .filter(Boolean);
}

/** Strips protocol / trailing slash for display: https://www.x.com/ → x.com */
export function prettyUrl(url: string | undefined | null): string {
  if (!url) return '';
  return url
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}

export function ensureUrl(url: string): string {
  const u = url.trim();
  if (!u) return '';
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
  return `https://${u}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function resumeFileName(fullName: string): string {
  const base = fullName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join('_');
  return `${base || 'My'}_Resume.pdf`;
}

export const SKILL_LEVEL_LABELS = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];

export const LANGUAGE_LEVELS = [
  'Native',
  'Fluent',
  'Professional working',
  'Conversational',
  'Basic',
  'C2 – Proficient',
  'C1 – Advanced',
  'B2 – Upper intermediate',
  'B1 – Intermediate',
  'A2 – Elementary',
  'A1 – Beginner',
];
