import type {
  AdditionalItem,
  AdditionalSection,
  AdditionalSectionType,
  CertificationItem,
  Customization,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  ProjectItem,
  ResumeData,
  ResumeDocument,
  SkillItem,
} from '@/types/resume';
import { ADDITIONAL_SECTION_META, DEFAULT_SECTION_ORDER } from './sections';

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const emptyExperience = (): ExperienceItem => ({
  id: uid(), jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, responsibilities: '', achievements: '',
});
export const emptyEducation = (): EducationItem => ({
  id: uid(), degree: '', institution: '', location: '', startYear: '', endYear: '', grade: '', description: '',
});
export const emptySkill = (name = ''): SkillItem => ({ id: uid(), name, level: 0 });
export const emptyProject = (): ProjectItem => ({ id: uid(), name: '', description: '', technologies: '', url: '' });
export const emptyCertification = (): CertificationItem => ({ id: uid(), name: '', issuer: '', date: '', url: '' });
export const emptyLanguage = (): LanguageItem => ({ id: uid(), language: '', proficiency: '' });
export const emptyAdditionalItem = (): AdditionalItem => ({ id: uid(), title: '', subtitle: '', date: '', description: '', url: '' });
export const emptyAdditionalSection = (type: AdditionalSectionType): AdditionalSection => ({
  id: uid(),
  type,
  title: ADDITIONAL_SECTION_META[type].label,
  items: [emptyAdditionalItem()],
});

export function emptyResumeData(): ResumeData {
  return {
    personal: { fullName: '', jobTitle: '', email: '', phone: '', location: '', linkedin: '', website: '', photo: '' },
    summary: '',
    experience: [emptyExperience()],
    education: [emptyEducation()],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    additional: [],
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    hiddenSections: [],
    sectionTitles: {},
  };
}

export const DEFAULT_CUSTOMIZATION: Customization = {
  primaryColor: '#1e3a5f',
  fontFamily: 'Inter',
  fontSize: 9.5,
  sectionSpacing: 1,
  pageMargin: 40,
  showPhoto: true,
  headingStyle: 'underline',
  layoutVariant: 'default',
};

export function newResumeDocument(templateId: string, customization: Customization, data?: ResumeData): ResumeDocument {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: 'Untitled Resume',
    templateId,
    data: data ?? emptyResumeData(),
    customization,
    createdAt: now,
    updatedAt: now,
  };
}

/** Fills in any fields missing from stored data (forward compatibility). */
export function normalizeResumeData(raw: Partial<ResumeData> | null | undefined): ResumeData {
  const base = emptyResumeData();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    personal: { ...base.personal, ...(raw.personal ?? {}) },
    experience: raw.experience ?? [],
    education: raw.education ?? [],
    skills: raw.skills ?? [],
    projects: raw.projects ?? [],
    certifications: raw.certifications ?? [],
    languages: raw.languages ?? [],
    additional: raw.additional ?? [],
    sectionOrder: raw.sectionOrder?.length ? raw.sectionOrder : base.sectionOrder,
    hiddenSections: raw.hiddenSections ?? [],
    sectionTitles: raw.sectionTitles ?? {},
  };
}

export function normalizeCustomization(raw: Partial<Customization> | null | undefined, fallback: Customization): Customization {
  return { ...fallback, ...(raw ?? {}) };
}
