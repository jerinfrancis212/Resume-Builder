import { Font } from '@react-pdf/renderer';

export interface FontFamilyDef {
  id: string;
  label: string;
  category: 'sans' | 'serif' | 'mono';
  file: string;
  weights: number[];
  italic: number[];
}

export const FONT_FAMILIES: FontFamilyDef[] = [
  { id: 'Inter', label: 'Inter', category: 'sans', file: 'inter', weights: [400, 500, 600, 700], italic: [400] },
  { id: 'Lato', label: 'Lato', category: 'sans', file: 'lato', weights: [400, 700], italic: [400] },
  { id: 'Roboto', label: 'Roboto', category: 'sans', file: 'roboto', weights: [400, 500, 700], italic: [400] },
  { id: 'Open Sans', label: 'Open Sans', category: 'sans', file: 'open-sans', weights: [400, 600, 700], italic: [400] },
  { id: 'Montserrat', label: 'Montserrat', category: 'sans', file: 'montserrat', weights: [400, 500, 600, 700], italic: [400] },
  { id: 'Source Sans 3', label: 'Source Sans', category: 'sans', file: 'source-sans-3', weights: [400, 600, 700], italic: [400] },
  { id: 'Merriweather', label: 'Merriweather', category: 'serif', file: 'merriweather', weights: [400, 700], italic: [400] },
  { id: 'Playfair Display', label: 'Playfair Display', category: 'serif', file: 'playfair-display', weights: [400, 600, 700], italic: [400] },
  { id: 'EB Garamond', label: 'EB Garamond', category: 'serif', file: 'eb-garamond', weights: [400, 500, 600, 700], italic: [400] },
  { id: 'Source Serif 4', label: 'Source Serif', category: 'serif', file: 'source-serif-4', weights: [400, 600, 700], italic: [400] },
  { id: 'IBM Plex Mono', label: 'IBM Plex Mono', category: 'mono', file: 'ibm-plex-mono', weights: [400, 500, 600], italic: [400] },
];

export const FONT_IDS = FONT_FAMILIES.map((f) => f.id);

let registeredBase: string | null = null;

/**
 * Registers all font families with react-pdf. `baseUrl` is a URL prefix in the
 * browser (e.g. "/fonts") or an absolute directory path in Node scripts.
 */
export function registerFonts(baseUrl: string) {
  if (registeredBase === baseUrl) return;
  registeredBase = baseUrl;
  for (const f of FONT_FAMILIES) {
    Font.register({
      family: f.id,
      fonts: [
        ...f.weights.map((w) => ({ src: `${baseUrl}/${f.file}-latin-${w}-normal.woff`, fontWeight: w })),
        ...f.italic.map((w) => ({ src: `${baseUrl}/${f.file}-latin-${w}-italic.woff`, fontWeight: w, fontStyle: 'italic' as const })),
      ],
    });
  }
  // Never hyphenate words – resumes should keep words intact.
  Font.registerHyphenationCallback((word) => [word]);
}

/** CSS @font-face declarations so the UI can preview fonts in pickers. */
export function fontFaceCss(baseUrl = '/fonts'): string {
  return FONT_FAMILIES.map(
    (f) =>
      `@font-face{font-family:'${f.id}';src:url('${baseUrl}/${f.file}-latin-400-normal.woff') format('woff');font-weight:400;font-display:swap;}`,
  ).join('\n');
}
