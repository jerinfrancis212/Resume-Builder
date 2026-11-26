import type { FC } from 'react';
import type { Customization, ResumeData } from '@/types/resume';
import type { TemplateMeta } from '@/templates/meta';

export interface TemplateProps {
  data: ResumeData;
  c: Customization;
  /** Resolved layout variant id (always one of meta.variants). */
  variant: string;
  meta: TemplateMeta;
}

export type TemplateComponent = FC<TemplateProps>;
