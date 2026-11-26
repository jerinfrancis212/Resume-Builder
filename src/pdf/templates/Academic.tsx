import { Page, Text, View } from '@react-pdf/renderer';
import { visibleSections, sectionTitle } from '@/lib/resume/sections';
import { buildTheme } from '../theme';
import { ContactInline, PageFooter, Section, SectionContent, SectionHeading } from '../primitives';
import type { TemplateProps } from './types';

/** 10. Academic CV — scholarly serif layout with dedicated date column & running page footer. */
export default function Academic({ data, c, variant }: TemplateProps) {
  const t = buildTheme(c, { nameScale: 2.35, lineHeight: 1.44, text: '#1a1a1a', muted: '#525252' });
  const p = data.personal;
  const dateCol = variant !== 'dates-right';
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
        paddingBottom: t.margin + 10,
        paddingHorizontal: t.margin,
      }}
    >
      {/* Scholarly header */}
      <View style={{ marginBottom: t.sectionGap * 1.05, borderBottomWidth: 1, borderBottomColor: t.primary, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontSize: t.fs.name, fontWeight: 700, color: t.text, lineHeight: 1.15 }}>
            {p.fullName || 'Your Name'}
          </Text>
          <Text style={{ fontSize: t.fs.tiny, color: t.primary, textTransform: 'uppercase', letterSpacing: 1.6, fontWeight: 600 }}>
            Curriculum Vitae
          </Text>
        </View>
        {p.jobTitle ? (
          <Text style={{ fontSize: t.fs.title, fontStyle: 'italic', color: t.muted, marginTop: 2 }}>{p.jobTitle}</Text>
        ) : null}
        <ContactInline t={t} personal={p} separator="   •   " style={{ marginTop: 6 }} />
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
              ruleColor={t.primary}
              letterSpacing={1.1}
            />
          }
        >
          <SectionContent
            k={k}
            data={data}
            t={t}
            o={{
              entry: {
                dateStyle: dateCol ? 'column' : 'right',
                columnWidth: 86,
                subtitleItalic: true,
                subtitleColor: t.muted,
                bullet: '•',
                bulletColor: t.primary,
              },
              skills: 'inline',
              languages: 'table',
              achievementsLabel: false,
            }}
          />
        </Section>
      ))}

      <PageFooter t={t} name={p.fullName} />
    </Page>
  );
}
