/**
 * Renders every template with its sample persona (plus a long multi-page
 * variant) to samples-out/*.pdf, for visual QA. Run: npm run render:samples
 * Optional args: template ids to render, e.g. `npm run render:samples classic bw`
 */
import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { registerFonts } from '../src/pdf/fonts';
import { ResumePdf } from '../src/pdf/ResumePdf';
import { TEMPLATES } from '../src/templates/meta';
import { templateDefaultCustomization } from '../src/templates/customization';
import { cloneSample } from '../src/lib/resume/sample';
import type { ResumeData } from '../src/types/resume';

const root = path.resolve(import.meta.dirname, '..');
registerFonts(path.join(root, 'public', 'fonts'));
const out = path.join(root, 'samples-out');
mkdirSync(out, { recursive: true });

const only = process.argv.slice(2);

function longVersion(d: ResumeData): ResumeData {
  const x = JSON.parse(JSON.stringify(d)) as ResumeData;
  x.experience = [...x.experience, ...x.experience.map((e) => ({ ...e, id: e.id + 'b' })), ...x.experience.map((e) => ({ ...e, id: e.id + 'c' }))];
  x.projects = [...x.projects, ...x.projects.map((p) => ({ ...p, id: p.id + 'b' }))];
  x.additional = [
    ...x.additional,
    {
      id: 'vol', type: 'volunteer', title: 'Volunteer Experience',
      items: [{ id: 'v1', title: 'Mentor', subtitle: 'Code for Good', date: '2019', description: 'Mentored 20+ students learning to code\nOrganised quarterly hackathons', url: '' }],
    },
    { id: 'hob', type: 'hobbies', title: 'Interests', items: ['Trail running', 'Photography', 'Chess'].map((n, i) => ({ id: 'h' + i, title: n, subtitle: '', date: '', description: '', url: '' })) },
    {
      id: 'ref', type: 'references', title: 'References',
      items: [
        { id: 'r1', title: 'Jane Cooper', subtitle: 'VP Product, Northwind Labs', date: '', description: 'jane.cooper@email.com', url: '' },
        { id: 'r2', title: 'Marcus Lee', subtitle: 'CTO, Brightline Health', date: '', description: 'marcus.lee@email.com', url: '' },
      ],
    },
  ];
  x.sectionOrder = [...x.sectionOrder, 'extra:vol', 'extra:hob', 'extra:ref'];
  return x;
}

for (const tpl of TEMPLATES) {
  if (only.length && !only.includes(tpl.id)) continue;
  const data = cloneSample(tpl.sample);
  const c = templateDefaultCustomization(tpl.id);
  const t0 = Date.now();
  await renderToFile(<ResumePdf templateId={tpl.id} data={data} customization={c} />, path.join(out, `${tpl.id}.pdf`));
  await renderToFile(<ResumePdf templateId={tpl.id} data={longVersion(data)} customization={{ ...c, layoutVariant: tpl.variants[1]?.id ?? c.layoutVariant }} />, path.join(out, `${tpl.id}-long.pdf`));
  console.log(`${tpl.id.padEnd(16)} ${Date.now() - t0}ms`);
}
