import { Document } from '@react-pdf/renderer';
import type { Customization, ResumeData } from '@/types/resume';
import { getTemplate } from '@/templates/meta';
import { activeVariant } from '@/templates/customization';
import { TEMPLATE_COMPONENTS } from './templates';
import Classic from './templates/Classic';

export interface ResumePdfProps {
  templateId: string;
  data: ResumeData;
  customization: Customization;
}

/** The complete react-pdf <Document> for a resume. Used for preview, thumbnails and download. */
export function ResumePdf({ templateId, data, customization }: ResumePdfProps) {
  const meta = getTemplate(templateId);
  const Comp = TEMPLATE_COMPONENTS[meta.id] ?? Classic;
  const c = meta.monochrome ? { ...customization, primaryColor: meta.defaults.primaryColor } : customization;
  const name = data.personal.fullName.trim();
  return (
    <Document
      title={name ? `${name} – Resume` : 'Resume'}
      author={name || undefined}
      subject={data.personal.jobTitle || 'Resume'}
      creator="Norvel Resume Builder"
      producer="Norvel Resume Builder"
      language="en"
    >
      <Comp data={data} c={c} variant={activeVariant(meta.id, c)} meta={meta} />
    </Document>
  );
}
