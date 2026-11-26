import { Page, Text, View } from '@react-pdf/renderer';
import { visibleSections, sectionTitle } from '@/lib/resume/sections';
import { buildTheme } from '../theme';
import { ContactInline, PageFooter, Section, SectionContent, SectionHeading } from '../primitives';
import type { TemplateProps } from './types';

/** 4. ATS-Friendly Single Column — pure linear hierarchy, zero graphics or columns. */
export default function AtsFriendly({ data, c, variant }: TemplateProps) {
  const compact = variant === 'compact';
  const t = buildTheme(
    {
      ...c,
      fontSize: compact ? Math.max(8.5, c.fontSize - 0.6) : c.fontSize,
      sectionSpacing: compact ? c.sectionSpacing * 0.82 : c.sectionSpacing,
      pageMargin: compact ? Math.max(28, c.pageMargin - 8) : c.pageMargin,
    },
    { nameScale: 2.15, lineHeight: compact ? 1.35 : 1.42, text: '#111111', muted: '#444444' },
  );
  const p = data.personal;
  const keys = visibleSections(data);

  return (
    <Page
      size="A4"
      style={{
        fontFamily: t.font,
        fontSize: t.fs.base,
        color: t.text,
        lineHeight: t.lh,
        paddingTop: t.margin,
        paddingBottom: t.margin + 4,
        paddingHorizontal: t.margin,
      }}
    >
      {/* Simple ATS-safe header */}
      <View style={{ marginBottom: t.sectionGap * 0.9 }}>
        <Text style={{ fontSize: t.fs.name, fontWeight: 700, color: '#000000', lineHeight: 1.15 }}>
          {p.fullName || 'Your Name'}
        </Text>
        {p.jobTitle ? (
          <Text style={{ fontSize: t.fs.title, fontWeight: 400, color: t.muted, marginTop: 2 }}>{p.jobTitle}</Text>
        ) : null}
        <ContactInline t={t} personal={p} separator=" | " color={t.text} style={{ marginTop: 5 }} />
      </View>

      {keys.map((k, i) => (
        <Section
          key={k}
          t={t}
          last={i === keys.length - 1}
          heading={
            <SectionHeading
              t={t}
              title={sectionTitle(data, k)}
              color={t.primary}
              ruleColor="#222222"
              letterSpacing={0.9}
              fontSize={t.fs.h}
            />
          }
        >
          <SectionContent
            k={k}
            data={data}
            t={t}
            o={{
              entry: { dateStyle: 'right', subtitleColor: t.text, subtitleItalic: false, bullet: '-', bulletColor: t.text },
              skills: 'inline',
              languages: 'inline',
              achievementsLabel: false,
            }}
          />
        </Section>
      ))}

      <PageFooter t={t} name={p.fullName} />
    </Page>
  );
}
