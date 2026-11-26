import type { Customization, ResumeData, ResumeDocument } from '@/types/resume';
import { normalizeCustomization, normalizeResumeData } from '@/lib/resume/defaults';
import { templateDefaultCustomization } from '@/templates/customization';
import { supabase } from './client';

interface ResumeRow {
  id: string;
  user_id: string;
  resume_name: string;
  template_id: string;
  resume_data: Partial<ResumeData>;
  customization_data: Partial<Customization>;
  is_paid?: boolean | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

function rowToDoc(row: ResumeRow): ResumeDocument {
  return {
    id: row.id,
    name: row.resume_name || 'Untitled Resume',
    templateId: row.template_id || 'modern-minimal',
    data: normalizeResumeData(row.resume_data),
    customization: normalizeCustomization(row.customization_data, templateDefaultCustomization(row.template_id)),
    isPaid: Boolean(row.is_paid),
    paidAt: row.paid_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchUserResumes(userId: string): Promise<ResumeDocument[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as ResumeRow[]).map(rowToDoc);
}

export async function upsertUserResume(userId: string, doc: ResumeDocument): Promise<ResumeDocument> {
  if (!supabase) return doc;
  const payload = {
    id: doc.id,
    user_id: userId,
    resume_name: doc.name,
    template_id: doc.templateId,
    resume_data: doc.data,
    customization_data: doc.customization,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('resumes').upsert(payload, { onConflict: 'id' }).select('*').single();
  if (error) throw error;
  return rowToDoc(data as ResumeRow);
}

export async function deleteUserResume(userId: string, id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('resumes').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}
