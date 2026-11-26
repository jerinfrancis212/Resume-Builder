import { Page, Text, View } from '@react-pdf/renderer';
import { visibleSections, sectionTitle } from '@/lib/resume/sections';
import { buildTheme } from '../theme';
import { ContactInline, PageFooter, Section, SectionContent, SectionHeading } from '../primitives';
import type { TemplateProps } from './types';

/** 1. Classic Professional — centered serif header, ruled single-column sections. */
export default function Classic({ data, c, variant }: TemplateProps) {
  const t = buildTheme(c, { nameScale: 2.45, lineHeight: 1.45, text: '#1b1d21' });
  const p = data.personal;
  const centered = variant !== 'left';
  const align = centered ? 'center' : 'left';
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
        paddingBottom: t.margin + 6,
        paddingHorizontal: t.margin + 4,
      }}
    >
      <View style={{ marginBottom: t.sectionGap * 0.9 }}>
        <Text style={{ fontSize: t.fs.name, fontWeight: 700, textAlign: align, color: t.text, lineHeight: 1.15, letterSpacing: 0.3 }}>
          {p.fullName || 'Your Name'}
        </Text>
        {p.jobTitle ? (
          <Text style={{ fontSize: t.fs.title, color: t.primary, textAlign: align, marginTop: 3, letterSpacing: 0.4 }}>{p.jobTitle}</Text>
        ) : null}
        <ContactInline t={t} personal={p} align={align} separator="   |   " style={{ marginTop: 6 }} />
        <View style={{ marginTop: 9, borderBottomWidth: 1.4, borderBottomColor: t.primary }} />
        <View style={{ marginTop: 1.4, borderBottomWidth: 0.5, borderBottomColor: t.primary }} />
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
              align={centered && c.headingStyle !== 'bar' ? 'center' : 'left'}
              letterSpacing={1.6}
              textColor={c.headingStyle === 'underline' ? t.primary : undefined}
              ruleColor="#c9ccd2"
            />
          }
        >
          <SectionContent
            k={k}
            data={data}
            t={t}
            o={{
              entry: { dateStyle: 'right', subtitleItalic: true, subtitleColor: t.text, bullet: '•' },
              skills: 'columns',
              skillColumns: 3,
              languages: 'inline',
            }}
          />
        </Section>
      ))}
      <PageFooter t={t} name={p.fullName} />
    </Page>
  );
}
