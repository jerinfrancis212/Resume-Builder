import { Page, Text, View } from '@react-pdf/renderer';
import { visibleSections, sectionTitle } from '@/lib/resume/sections';
import { buildTheme } from '../theme';
import { ContactInline, PageFooter, Section, SectionContent, SectionHeading } from '../primitives';
import type { TemplateProps } from './types';

/** 8. Elegant Minimal — Garamond editorial poise, hairline rules & spacious margins. */
export default function Elegant({ data, c, variant }: TemplateProps) {
  const t = buildTheme(c, { nameScale: 2.55, lineHeight: 1.46, text: '#1c1917', muted: '#78716c' });
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
        paddingHorizontal: t.margin + 6,
      }}
    >
      {/* Editorial masthead */}
      <View style={{ marginBottom: t.sectionGap * 1.25 }}>
        <Text
          style={{
            fontSize: t.fs.name,
            fontWeight: 400,
            textAlign: align,
            color: t.text,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            lineHeight: 1.15,
          }}
        >
          {p.fullName || 'Your Name'}
        </Text>
        {p.jobTitle ? (
          <Text
            style={{
              fontSize: t.fs.title,
              fontStyle: 'italic',
              color: t.primary,
              textAlign: align,
              marginTop: 4,
            }}
          >
            {p.jobTitle}
          </Text>
        ) : null}
        <View style={{ alignItems: centered ? 'center' : 'flex-start', marginTop: 10 }}>
          <View style={{ width: 42, height: 0.6, backgroundColor: t.primary }} />
        </View>
        <ContactInline t={t} personal={p} align={align} separator="   ·   " style={{ marginTop: 9 }} />
      </View>

      {keys.map((k, i) => (
        <Section
          key={k}
          t={t}
          last={i === keys.length - 1}
          heading={
            c.headingStyle === 'plain' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Math.max(5, t.itemGap * 0.8) }}>
                {centered ? <View style={{ flex: 1, height: 0.5, backgroundColor: '#d6d3d1', marginRight: 10 }} /> : null}
                <Text
                  style={{
                    fontSize: t.fs.small,
                    fontWeight: 600,
                    color: t.primary,
                    textTransform: 'uppercase',
                    letterSpacing: 2.2,
                  }}
                >
                  {sectionTitle(data, k)}
                </Text>
                <View style={{ flex: 1, height: 0.5, backgroundColor: '#d6d3d1', marginLeft: 10 }} />
              </View>
            ) : (
              <SectionHeading
                t={t}
                title={sectionTitle(data, k)}
                align={centered && c.headingStyle !== 'bar' ? 'center' : 'left'}
                fontSize={t.fs.small}
                letterSpacing={2.2}
                fontWeight={600}
                ruleColor="#d6d3d1"
              />
            )
          }
        >
          <SectionContent
            k={k}
            data={data}
            t={t}
            o={{
              entry: { dateStyle: 'right', subtitleItalic: true, subtitleColor: t.muted, bullet: '—', bulletColor: t.primary },
              skills: 'inline',
              languages: 'inline',
            }}
          />
        </Section>
      ))}

      <PageFooter t={t} name={p.fullName} />
    </Page>
  );
}
