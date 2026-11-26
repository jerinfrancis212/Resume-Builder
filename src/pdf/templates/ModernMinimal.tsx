import { Page, Text, View } from '@react-pdf/renderer';
import { visibleSections, sectionTitle } from '@/lib/resume/sections';
import { buildTheme } from '../theme';
import { ContactInline, PageFooter, Photo, Section, SectionContent, SectionHeading, hasPhoto } from '../primitives';
import type { TemplateProps } from './types';

/** 2. Modern Minimal — airy layout with section labels in a left gutter. */
export default function ModernMinimal({ data, c, variant }: TemplateProps) {
  const t = buildTheme(c, { nameScale: 2.65, lineHeight: 1.46, text: '#18181b', muted: '#64748b' });
  const p = data.personal;
  const stacked = variant === 'stacked';
  const keys = visibleSections(data);
  const gutterW = 112;

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
        paddingHorizontal: t.margin,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 16,
          marginBottom: t.sectionGap * 1.1,
          borderBottomWidth: 0.75,
          borderBottomColor: '#e4e4e7',
        }}
      >
        <View style={{ flex: 1, paddingRight: hasPhoto(t, p) ? 16 : 0 }}>
          <Text style={{ fontSize: t.fs.name, fontWeight: 600, color: t.text, letterSpacing: -0.4, lineHeight: 1.12 }}>
            {p.fullName || 'Your Name'}
          </Text>
          {p.jobTitle ? (
            <Text style={{ fontSize: t.fs.title, color: t.primary, fontWeight: 500, marginTop: 4 }}>{p.jobTitle}</Text>
          ) : null}
          <ContactInline t={t} personal={p} separator="   ·   " style={{ marginTop: 8 }} />
        </View>
        {hasPhoto(t, p) ? <Photo src={p.photo} size={62} shape="rounded" /> : null}
      </View>

      {/* Body */}
      {stacked ? (
        keys.map((k, i) => (
          <Section
            key={k}
            t={t}
            last={i === keys.length - 1}
            heading={
              <SectionHeading
                t={t}
                title={sectionTitle(data, k)}
                fontSize={t.fs.small}
                letterSpacing={1.5}
                color={t.primary}
                ruleColor="#e4e4e7"
              />
            }
          >
            <SectionContent
              k={k}
              data={data}
              t={t}
              o={{
                entry: { dateStyle: 'right', subtitleColor: t.muted, bullet: '–', bulletColor: t.primary },
                skills: 'inline',
                languages: 'inline',
              }}
            />
          </Section>
        ))
      ) : (
        keys.map((k, i) => (
          <View
            key={k}
            style={{
              flexDirection: 'row',
              marginBottom: i === keys.length - 1 ? 0 : t.sectionGap * 1.05,
            }}
          >
            <View style={{ width: gutterW, paddingRight: 14, paddingTop: 1 }} wrap={false}>
              <Text
                style={{
                  fontSize: t.fs.tiny * 1.05,
                  fontWeight: 700,
                  color: t.primary,
                  textTransform: 'uppercase',
                  letterSpacing: 1.3,
                  lineHeight: 1.35,
                }}
              >
                {sectionTitle(data, k)}
              </Text>
              {c.headingStyle === 'underline' ? (
                <View style={{ width: 18, height: 1.5, backgroundColor: t.primary, marginTop: 4 }} />
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <SectionContent
                k={k}
                data={data}
                t={t}
                o={{
                  entry: { dateStyle: 'right', subtitleColor: t.muted, bullet: '–', bulletColor: t.primary },
                  skills: 'inline',
                  languages: 'inline',
                }}
              />
            </View>
          </View>
        ))
      )}

      <PageFooter t={t} name={p.fullName} />
    </Page>
  );
}
