import { Page, Text, View } from '@react-pdf/renderer';
import { visibleSections, sectionTitle } from '@/lib/resume/sections';
import { buildTheme } from '../theme';
import { ContactInline, PageFooter, Section, SectionContent, SectionHeading } from '../primitives';
import type { TemplateProps } from './types';

/** 12. Simple Black & White — high-contrast monochrome, heavy type & print-ready clarity. */
export default function BlackAndWhite({ data, c, variant }: TemplateProps) {
  const t = buildTheme({ ...c, primaryColor: '#111111' }, { nameScale: 2.7, lineHeight: 1.42, text: '#111111', muted: '#444444' });
  const p = data.personal;
  const block = variant === 'block';
  const keys = visibleSections(data);

  return (
    <Page
      size="A4"
      style={{
        fontFamily: t.font,
        fontSize: t.fs.base,
        color: '#111111',
        lineHeight: t.lh,
        paddingTop: t.margin,
        paddingBottom: t.margin + 6,
        paddingHorizontal: t.margin,
      }}
    >
      {block ? (
        <View
          style={{
            backgroundColor: '#111111',
            paddingVertical: 18,
            paddingHorizontal: 20,
            marginBottom: t.sectionGap * 1.15,
          }}
        >
          <Text style={{ fontSize: t.fs.name, fontWeight: 700, color: '#ffffff', letterSpacing: -0.4, lineHeight: 1.1 }}>
            {p.fullName || 'Your Name'}
          </Text>
          {p.jobTitle ? (
            <Text style={{ fontSize: t.fs.title, color: '#d4d4d4', marginTop: 3, letterSpacing: 1, textTransform: 'uppercase' }}>
              {p.jobTitle}
            </Text>
          ) : null}
          <ContactInline t={t} personal={p} color="#e5e5e5" separator="   /   " style={{ marginTop: 8 }} />
        </View>
      ) : (
        <View
          style={{
            borderTopWidth: 3.5,
            borderBottomWidth: 1,
            borderColor: '#111111',
            paddingVertical: 12,
            marginBottom: t.sectionGap * 1.1,
          }}
        >
          <Text style={{ fontSize: t.fs.name, fontWeight: 700, color: '#000000', letterSpacing: -0.5, lineHeight: 1.08 }}>
            {p.fullName || 'Your Name'}
          </Text>
          {p.jobTitle ? (
            <Text style={{ fontSize: t.fs.title, fontWeight: 500, color: '#333333', marginTop: 3 }}>{p.jobTitle}</Text>
          ) : null}
          <ContactInline t={t} personal={p} color="#222222" separator="   /   " style={{ marginTop: 7 }} />
        </View>
      )}

      {keys.map((k, i) => (
        <Section
          key={k}
          t={t}
          last={i === keys.length - 1}
          heading={
            c.headingStyle === 'filled' ? (
              <View style={{ backgroundColor: '#111111', paddingVertical: 3, paddingHorizontal: 7, marginBottom: Math.max(5, t.itemGap * 0.75) }}>
                <Text style={{ fontSize: t.fs.small, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 1.4 }}>
                  {sectionTitle(data, k)}
                </Text>
              </View>
            ) : (
              <SectionHeading t={t} title={sectionTitle(data, k)} color="#111111" ruleColor="#111111" letterSpacing={1.4} />
            )
          }
        >
          <SectionContent
            k={k}
            data={data}
            t={t}
            o={{
              entry: { dateStyle: 'right', subtitleColor: '#333333', bullet: '■', bulletColor: '#111111' },
              skills: 'columns',
              skillColumns: 3,
              barColor: '#111111',
              languages: 'inline',
            }}
          />
        </Section>
      ))}

      <PageFooter t={t} name={p.fullName} color="#555555" />
    </Page>
  );
}
