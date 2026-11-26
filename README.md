# Folio — Modern Resume Builder Web Application

A full-featured SaaS Resume Builder built with **React, TypeScript, Tailwind CSS, Shadcn UI, Lucide React, Supabase, and `@react-pdf/renderer` + `pdfjs-dist`**.

## Key Features

- **12 Distinct A4 Resume Templates** across 7 categories (`Modern`, `Professional`, `Minimal`, `Creative`, `ATS-Friendly`, `Fresher / Graduate`, `Experienced Professional`), each with multiple layout variations and full multi-page support:
  1. Classic Professional
  2. Modern Minimal
  3. Corporate Executive
  4. ATS-Friendly Single Column
  5. Modern Two Column
  6. Graduate / Fresher
  7. Creative Professional
  8. Elegant Minimal
  9. Technical / IT Professional
  10. Academic CV
  11. International Job Application
  12. Simple Black & White
- **Three-Panel Desktop Editor & Mobile Tabs**:
  - **Left Panel**: Drag-and-drop section reordering (`@dnd-kit`), hide/show toggles, and optional additional sections (Achievements, Awards, Publications, Volunteer Experience, Internships, Hobbies & Interests, References, Custom Section).
  - **Center Panel**: Clean forms for Personal Info (with email/phone validation and automatic client-side photo cropping/compression), Summary, Work Experience, Education, Skills, Projects, Certifications, Languages, and Additional Sections.
  - **Right Panel**: True A4 Live Preview rendered directly from the same vector PDF engine used for export, with accurate page boundaries, multi-page indicators, and zoom controls (`55%`–`160%`).
- **Real Selectable-Text A4 PDF Export**: Generated via `@react-pdf/renderer` with embedded WOFF fonts (`public/fonts/`), ensuring the downloaded `FirstName_LastName_Resume.pdf` is visually identical to the live preview and 100% ATS-readable.
- **Full Customization**: Primary color swatches + custom picker, 11 embedded font families, font size, section spacing, page margins, heading styles, layout variations, and profile photo visibility.
- **Guest Mode + Supabase Cloud Sync**: Start editing immediately with automatic local browser persistence. Sign in with **Google** or **Email & Password** to sync drafts to Supabase PostgreSQL with Row Level Security (RLS) and manage multiple resumes from the User Dashboard.

---

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run [`supabase/schema.sql`](./supabase/schema.sql). This creates:
   - `public.profiles` (auto-populated via trigger on `auth.users`)
   - `public.templates` (seeded with all 12 templates, publicly readable)
   - `public.resumes` (JSONB `resume_data` & `customization_data`, strictly scoped to `auth.uid() = user_id` via RLS)
3. Enable **Email** and **Google** providers under **Authentication → Providers**. Add your site URL (`http://localhost:5173/dashboard` and your Vercel URL) to **Authentication → URL Configuration → Redirect URLs**.
4. Copy `.env.example` to `.env` and fill in your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Deploying to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket (or run `npx vercel`).
2. Import the project in Vercel — `vercel.json` is pre-configured with SPA rewrites and immutable font caching.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in **Project Settings → Environment Variables**.
4. Deploy!
