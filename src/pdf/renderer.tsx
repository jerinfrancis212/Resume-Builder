import { pdf } from '@react-pdf/renderer';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { Customization, ResumeData } from '@/types/resume';
import { resumeFileName } from '@/lib/resume/format';
import { registerFonts } from './fonts';
import { ResumePdf } from './ResumePdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function ensureBrowserFonts() {
  if (typeof window !== 'undefined') {
    registerFonts(`${window.location.origin}/fonts`);
  }
}

/** Generates a real, selectable-text PDF Blob from the exact ResumePdf template. */
export async function generateResumePdfBlob(
  templateId: string,
  data: ResumeData,
  customization: Customization,
): Promise<Blob> {
  ensureBrowserFonts();
  const doc = <ResumePdf templateId={templateId} data={data} customization={customization} />;
  return pdf(doc).toBlob();
}

/** Generates and downloads the resume PDF as FirstName_LastName_Resume.pdf. */
export async function downloadResumePdf(
  templateId: string,
  data: ResumeData,
  customization: Customization,
): Promise<void> {
  const blob = await generateResumePdfBlob(templateId, data, customization);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = resumeFileName(data.personal.fullName);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Renders all pages of a PDF ArrayBuffer to PNG data URLs at the requested scale. */
export async function renderPdfPagesToImages(
  bytes: Uint8Array,
  scale = 1.5,
): Promise<{ dataUrl: string; width: number; height: number }[]> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdfDoc = await loadingTask.promise;
  const results: { dataUrl: string; width: number; height: number }[] = [];
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const vp = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(vp.width);
    canvas.height = Math.floor(vp.height);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
    }
    results.push({ dataUrl: canvas.toDataURL('image/png'), width: vp.width, height: vp.height });
  }
  await pdfDoc.destroy();
  return results;
}

const thumbCache = new Map<string, Promise<string>>();

/** Cached first-page thumbnail for template gallery cards. */
export function getTemplateThumbnail(
  templateId: string,
  data: ResumeData,
  customization: Customization,
  cacheKey?: string,
): Promise<string> {
  const key = cacheKey ?? `${templateId}:${customization.primaryColor}:${customization.layoutVariant}`;
  const hit = thumbCache.get(key);
  if (hit) return hit;

  const job = (async () => {
    const blob = await generateResumePdfBlob(templateId, data, customization);
    const buf = new Uint8Array(await blob.arrayBuffer());
    const loadingTask = pdfjsLib.getDocument({ data: buf });
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(1);
    const vp = page.getViewport({ scale: 1.05 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(vp.width);
    canvas.height = Math.floor(vp.height);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
    }
    const url = canvas.toDataURL('image/jpeg', 0.9);
    await pdfDoc.destroy();
    return url;
  })();

  thumbCache.set(key, job);
  return job;
}
