// Copies the WOFF font files used by the PDF engine from @fontsource packages
// into /public/fonts so they can be served statically and embedded in PDFs.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'fonts');
mkdirSync(out, { recursive: true });

// [package, file prefix, weights, italic weights]
const fonts = [
  ['inter', 'inter', [400, 500, 600, 700], [400]],
  ['lato', 'lato', [400, 700], [400]],
  ['roboto', 'roboto', [400, 500, 700], [400]],
  ['open-sans', 'open-sans', [400, 600, 700], [400]],
  ['montserrat', 'montserrat', [400, 500, 600, 700], [400]],
  ['source-sans-3', 'source-sans-3', [400, 600, 700], [400]],
  ['merriweather', 'merriweather', [400, 700], [400]],
  ['playfair-display', 'playfair-display', [400, 600, 700], [400]],
  ['eb-garamond', 'eb-garamond', [400, 500, 600, 700], [400]],
  ['source-serif-4', 'source-serif-4', [400, 600, 700], [400]],
  ['ibm-plex-mono', 'ibm-plex-mono', [400, 500, 600], [400]],
];

let copied = 0;
for (const [pkg, prefix, weights, italics] of fonts) {
  const variants = [
    ...weights.map((w) => `${w}-normal`),
    ...italics.map((w) => `${w}-italic`),
  ];
  for (const v of variants) {
    const name = `${prefix}-latin-${v}.woff`;
    const src = join(root, 'node_modules', '@fontsource', pkg, 'files', name);
    if (!existsSync(src)) {
      console.warn(`[copy-fonts] missing ${src}`);
      continue;
    }
    copyFileSync(src, join(out, name));
    copied++;
  }
}
console.log(`[copy-fonts] copied ${copied} font files to public/fonts`);
