import type { Customization, SectionKey } from '@/types/resume';

export type TemplateCategory =
  | 'Europass CV'
  | 'Modern'
  | 'Professional'
  | 'Minimal'
  | 'Creative'
  | 'ATS-Friendly'
  | 'Fresher / Graduate'
  | 'Experienced Professional';

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Europass CV',
  'Modern',
  'Professional',
  'Minimal',
  'Creative',
  'ATS-Friendly',
  'Fresher / Graduate',
  'Experienced Professional',
];

export type SampleKind = 'professional' | 'graduate' | 'academic' | 'tech';

export interface TemplateMeta {
  id: string;
  name: string;
  categories: TemplateCategory[];
  description: string;
  /** Default customization applied when the template is first selected. */
  defaults: Partial<Customization> & Pick<Customization, 'primaryColor' | 'fontFamily' | 'headingStyle'>;
  /** Layout variations. The first one is the default. */
  variants: { id: string; label: string }[];
  /** Which sample persona is used for the gallery thumbnail. */
  sample: SampleKind;
  supportsPhoto: boolean;
  /** When true the template is monochrome and ignores the primary color picker. */
  monochrome?: boolean;
  /** Section order suggested when a new resume starts from this template. */
  recommendedOrder?: SectionKey[];
  highlights: string[];
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'europass',
    name: 'Europass CV',
    categories: ['Europass CV', 'Professional', 'ATS-Friendly'],
    description: 'Official European CV style with a structured personal details block, date timeline and CEFR language table.',
    defaults: { primaryColor: '#003399', fontFamily: 'Open Sans', headingStyle: 'underline', fontSize: 9, pageMargin: 36 },
    variants: [
      { id: 'classic', label: 'Standard Europass' },
      { id: 'compact', label: 'Compact Europass' },
    ],
    sample: 'professional',
    supportsPhoto: true,
    highlights: ['European standard', 'Date timeline', 'CEFR languages'],
  },
  {
    id: 'classic',
    name: 'Classic Professional',
    categories: ['Professional', 'Experienced Professional'],
    description: 'A timeless serif layout with a centered header and ruled sections. Safe for any industry.',
    defaults: { primaryColor: '#1f3a5f', fontFamily: 'Merriweather', headingStyle: 'underline', fontSize: 9, pageMargin: 42 },
    variants: [
      { id: 'centered', label: 'Centered header' },
      { id: 'left', label: 'Left-aligned header' },
    ],
    sample: 'professional',
    supportsPhoto: false,
    highlights: ['Serif typography', 'Single column', 'Conservative'],
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    categories: ['Modern', 'Minimal'],
    description: 'Generous whitespace with section labels in a left gutter. Calm, confident and easy to scan.',
    defaults: { primaryColor: '#0f766e', fontFamily: 'Inter', headingStyle: 'plain', fontSize: 9, pageMargin: 44 },
    variants: [
      { id: 'gutter', label: 'Labels in gutter' },
      { id: 'stacked', label: 'Stacked labels' },
    ],
    sample: 'professional',
    supportsPhoto: true,
    highlights: ['Gutter labels', 'Airy spacing', 'Sans-serif'],
  },
  {
    id: 'executive',
    name: 'Corporate Executive',
    categories: ['Professional', 'Experienced Professional'],
    description: 'A bold full-width header band and a highlighted executive summary for senior leadership roles.',
    defaults: { primaryColor: '#1e3a5f', fontFamily: 'Source Sans 3', headingStyle: 'bar', fontSize: 9.5, pageMargin: 40 },
    variants: [
      { id: 'band', label: 'Solid header band' },
      { id: 'light', label: 'Soft header band' },
    ],
    sample: 'professional',
    supportsPhoto: true,
    highlights: ['Header band', 'Leadership focus', 'Two-tone'],
  },
  {
    id: 'ats',
    name: 'ATS-Friendly Single Column',
    categories: ['ATS-Friendly', 'Professional'],
    description: 'Plain single column with standard headings and no graphics, parsed cleanly by applicant tracking systems.',
    defaults: { primaryColor: '#222222', fontFamily: 'Lato', headingStyle: 'underline', fontSize: 10, pageMargin: 44 },
    variants: [
      { id: 'standard', label: 'Standard' },
      { id: 'compact', label: 'Compact' },
    ],
    sample: 'professional',
    supportsPhoto: false,
    highlights: ['ATS optimised', 'No columns', 'Plain text'],
  },
  {
    id: 'two-column',
    name: 'Modern Two Column',
    categories: ['Modern', 'Experienced Professional'],
    description: 'A colored sidebar for contact details, skills and languages beside a spacious experience column.',
    defaults: { primaryColor: '#24364f', fontFamily: 'Montserrat', headingStyle: 'underline', fontSize: 8.8, pageMargin: 32 },
    variants: [
      { id: 'left', label: 'Sidebar left' },
      { id: 'right', label: 'Sidebar right' },
    ],
    sample: 'professional',
    supportsPhoto: true,
    highlights: ['Colored sidebar', 'Photo friendly', 'Skill meters'],
  },
  {
    id: 'graduate',
    name: 'Graduate / Fresher',
    categories: ['Fresher / Graduate', 'Modern'],
    description: 'Puts education, projects and skills first so students and fresh graduates can shine without long experience.',
    defaults: { primaryColor: '#2563eb', fontFamily: 'Open Sans', headingStyle: 'filled', fontSize: 9.2, pageMargin: 38 },
    variants: [
      { id: 'left', label: 'Left header' },
      { id: 'centered', label: 'Centered header' },
    ],
    sample: 'graduate',
    supportsPhoto: true,
    recommendedOrder: ['summary', 'education', 'projects', 'skills', 'experience', 'certifications', 'languages'],
    highlights: ['Education first', 'Project focus', 'Skill tags'],
  },
  {
    id: 'creative',
    name: 'Creative Professional',
    categories: ['Creative', 'Modern'],
    description: 'Expressive display typography, a monogram and a timeline for designers, marketers and creatives.',
    defaults: { primaryColor: '#9a3412', fontFamily: 'Lato', headingStyle: 'plain', fontSize: 9, pageMargin: 36 },
    variants: [
      { id: 'timeline', label: 'Timeline' },
      { id: 'classic', label: 'Classic list' },
    ],
    sample: 'professional',
    supportsPhoto: true,
    highlights: ['Display serif', 'Timeline', 'Monogram'],
  },
  {
    id: 'elegant',
    name: 'Elegant Minimal',
    categories: ['Minimal', 'Professional'],
    description: 'Refined Garamond typography with hairline rules and letter-spaced headings. Quietly luxurious.',
    defaults: { primaryColor: '#57534e', fontFamily: 'EB Garamond', headingStyle: 'plain', fontSize: 10.5, pageMargin: 50 },
    variants: [
      { id: 'centered', label: 'Centered' },
      { id: 'left', label: 'Left aligned' },
    ],
    sample: 'professional',
    supportsPhoto: false,
    highlights: ['Garamond', 'Hairlines', 'Centered'],
  },
  {
    id: 'technical',
    name: 'Technical / IT Professional',
    categories: ['Modern', 'Experienced Professional'],
    description: 'Monospace accents, a skills sidebar with proficiency meters and prominent projects for engineers.',
    defaults: { primaryColor: '#047857', fontFamily: 'Inter', headingStyle: 'bar', fontSize: 8.8, pageMargin: 34 },
    variants: [
      { id: 'sidebar', label: 'Skills sidebar' },
      { id: 'single', label: 'Single column' },
    ],
    sample: 'tech',
    supportsPhoto: false,
    recommendedOrder: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'languages'],
    highlights: ['Mono accents', 'Skill meters', 'Projects'],
  },
  {
    id: 'academic',
    name: 'Academic CV',
    categories: ['Professional', 'Experienced Professional'],
    description: 'A scholarly curriculum vitae with a date column, publications and page numbering for long CVs.',
    defaults: { primaryColor: '#7f1d1d', fontFamily: 'Source Serif 4', headingStyle: 'underline', fontSize: 9.5, pageMargin: 48 },
    variants: [
      { id: 'date-column', label: 'Date column' },
      { id: 'dates-right', label: 'Dates on right' },
    ],
    sample: 'academic',
    supportsPhoto: false,
    recommendedOrder: ['summary', 'education', 'experience', 'projects', 'certifications', 'skills', 'languages'],
    highlights: ['Date column', 'Publications', 'Page numbers'],
  },
  {
    id: 'international',
    name: 'International Job Application',
    categories: ['Professional', 'ATS-Friendly'],
    description: 'A Europass-inspired structure with labelled personal details, a photo and CEFR language levels.',
    defaults: { primaryColor: '#1d4ed8', fontFamily: 'Roboto', headingStyle: 'underline', fontSize: 9, pageMargin: 38 },
    variants: [
      { id: 'labels', label: 'Side labels' },
      { id: 'stacked', label: 'Stacked' },
    ],
    sample: 'professional',
    supportsPhoto: true,
    highlights: ['Europass style', 'Labelled details', 'CEFR'],
  },
  {
    id: 'bw',
    name: 'Simple Black & White',
    categories: ['Minimal', 'ATS-Friendly'],
    description: 'High-contrast monochrome with heavy type and inverted section bars. Prints perfectly anywhere.',
    defaults: { primaryColor: '#111111', fontFamily: 'Inter', headingStyle: 'filled', fontSize: 9.2, pageMargin: 40 },
    variants: [
      { id: 'rules', label: 'Bold rules' },
      { id: 'block', label: 'Black header block' },
    ],
    sample: 'professional',
    supportsPhoto: false,
    monochrome: true,
    highlights: ['Monochrome', 'Heavy type', 'Print ready'],
  },
];

export const TEMPLATE_MAP: Record<string, TemplateMeta> = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

export const DEFAULT_TEMPLATE_ID = 'modern-minimal';

export function getTemplate(id: string | undefined | null): TemplateMeta {
  return (id && TEMPLATE_MAP[id]) || TEMPLATE_MAP[DEFAULT_TEMPLATE_ID];
}
