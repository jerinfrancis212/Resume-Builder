// Core resume domain types. These shapes are stored verbatim in Supabase
// (resumes.resume_data / resumes.customization_data JSONB columns) and in
// localStorage for guest drafts, so changes must remain backward compatible.

export interface PhotoCropState {
  zoom: number;
  rotation: number;
  x: number;
  y: number;
}

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  /** Cropped JPEG data URL (or remote URL) rendered on the resume. Empty string when not set. */
  photo: string;
  /** Full uncropped original image (resized to max 1000px) so the user can always re-crop or zoom back out. */
  photoOriginal?: string;
  /** Last crop position/zoom/rotation so re-opening Crop starts where the user left off. */
  photoCrop?: PhotoCropState;
}

export interface ExperienceItem {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  /** "YYYY-MM" or "YYYY" */
  startDate: string;
  endDate: string;
  current: boolean;
  /** One responsibility per line. */
  responsibilities: string;
  /** One achievement per line. */
  achievements: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startYear: string;
  endYear: string;
  grade: string;
  description: string;
}

export interface SkillItem {
  id: string;
  name: string;
  /** 0 = not specified, 1..5 */
  level: number;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  technologies: string;
  url: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface LanguageItem {
  id: string;
  language: string;
  proficiency: string;
}

export type AdditionalSectionType =
  | 'achievements'
  | 'awards'
  | 'publications'
  | 'volunteer'
  | 'internships'
  | 'hobbies'
  | 'references'
  | 'custom';

export interface AdditionalItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string;
  url: string;
}

export interface AdditionalSection {
  id: string;
  type: AdditionalSectionType;
  title: string;
  items: AdditionalItem[];
}

export type CoreSectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages';

/** Either a core section key or `extra:<additionalSectionId>` */
export type SectionKey = CoreSectionKey | `extra:${string}`;

export interface ResumeData {
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  languages: LanguageItem[];
  additional: AdditionalSection[];
  /** Display order of body sections. */
  sectionOrder: SectionKey[];
  /** Sections the user chose not to display. */
  hiddenSections: SectionKey[];
  /** Optional custom titles for core sections. */
  sectionTitles: Partial<Record<CoreSectionKey, string>>;
}

export type HeadingStyle = 'underline' | 'bar' | 'plain' | 'filled';

export interface Customization {
  primaryColor: string;
  fontFamily: string;
  /** Base body font size in pt. */
  fontSize: number;
  /** Multiplier applied to vertical rhythm between sections. */
  sectionSpacing: number;
  /** Page margin in pt. */
  pageMargin: number;
  showPhoto: boolean;
  headingStyle: HeadingStyle;
  layoutVariant: string;
}

export type PaymentStatus = 'created' | 'pending' | 'successful' | 'failed' | 'refunded';

export interface PaymentRecord {
  id: string;
  userId: string;
  resumeId: string;
  resumeName?: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amount: number; // in paise (4900 = ₹49)
  currency: string;
  paymentStatus: PaymentStatus;
  failureReason?: string | null;
  createdAt: string;
  verifiedAt: string | null;
}

export interface ResumeDocument {
  id: string;
  name: string;
  templateId: string;
  data: ResumeData;
  customization: Customization;
  /** Server-verified payment entitlement for this specific resume. */
  isPaid?: boolean;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
