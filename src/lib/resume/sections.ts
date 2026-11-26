import type {
  AdditionalSectionType,
  CoreSectionKey,
  ResumeData,
  SectionKey,
} from '@/types/resume';

export const CORE_SECTION_LABELS: Record<CoreSectionKey, string> = {
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
};

/** Shorter titles typically printed on the resume itself. */
export const CORE_SECTION_PRINT_TITLES: Record<CoreSectionKey, string> = {
  summary: 'Profile',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
};

export const ADDITIONAL_SECTION_META: Record<
  AdditionalSectionType,
  { label: string; titleLabel: string; subtitleLabel: string; dateLabel: string; hasDescription: boolean; compact: boolean }
> = {
  achievements: { label: 'Achievements', titleLabel: 'Achievement', subtitleLabel: 'Context', dateLabel: 'Date', hasDescription: true, compact: false },
  awards: { label: 'Awards', titleLabel: 'Award', subtitleLabel: 'Awarded by', dateLabel: 'Date', hasDescription: true, compact: false },
  publications: { label: 'Publications', titleLabel: 'Title', subtitleLabel: 'Publisher / Journal', dateLabel: 'Date', hasDescription: true, compact: false },
  volunteer: { label: 'Volunteer Experience', titleLabel: 'Role', subtitleLabel: 'Organization', dateLabel: 'Period', hasDescription: true, compact: false },
  internships: { label: 'Internships', titleLabel: 'Role', subtitleLabel: 'Company', dateLabel: 'Period', hasDescription: true, compact: false },
  hobbies: { label: 'Hobbies & Interests', titleLabel: 'Interest', subtitleLabel: '', dateLabel: '', hasDescription: false, compact: true },
  references: { label: 'References', titleLabel: 'Name', subtitleLabel: 'Position & Company', dateLabel: '', hasDescription: true, compact: false },
  custom: { label: 'Custom Section', titleLabel: 'Title', subtitleLabel: 'Subtitle', dateLabel: 'Date', hasDescription: true, compact: false },
};

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
];

export function isExtraKey(key: SectionKey): key is `extra:${string}` {
  return key.startsWith('extra:');
}

export function sectionTitle(data: ResumeData, key: SectionKey): string {
  if (isExtraKey(key)) {
    const sec = data.additional.find((s) => `extra:${s.id}` === key);
    return sec?.title || 'Section';
  }
  return data.sectionTitles?.[key] || CORE_SECTION_PRINT_TITLES[key];
}

/** True when a section has printable content. */
export function sectionHasContent(data: ResumeData, key: SectionKey): boolean {
  if (isExtraKey(key)) {
    const sec = data.additional.find((s) => `extra:${s.id}` === key);
    return !!sec && sec.items.some((i) => i.title.trim() || i.description.trim());
  }
  switch (key) {
    case 'summary':
      return !!data.summary.trim();
    case 'experience':
      return data.experience.some((e) => e.jobTitle.trim() || e.company.trim());
    case 'education':
      return data.education.some((e) => e.degree.trim() || e.institution.trim());
    case 'skills':
      return data.skills.some((s) => s.name.trim());
    case 'projects':
      return data.projects.some((p) => p.name.trim());
    case 'certifications':
      return data.certifications.some((c) => c.name.trim());
    case 'languages':
      return data.languages.some((l) => l.language.trim());
  }
}

/** Ordered, visible sections that have content. */
export function visibleSections(data: ResumeData): SectionKey[] {
  const known = new Set<SectionKey>([
    ...DEFAULT_SECTION_ORDER,
    ...data.additional.map((s) => `extra:${s.id}` as SectionKey),
  ]);
  const order = data.sectionOrder.filter((k) => known.has(k));
  // Append any sections missing from the order (e.g. data from older versions).
  for (const k of known) if (!order.includes(k)) order.push(k);
  return order.filter((k) => !data.hiddenSections.includes(k) && sectionHasContent(data, k));
}
