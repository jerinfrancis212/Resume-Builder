import { Page, Text, View } from '@react-pdf/renderer';
import { visibleSections, sectionTitle } from '@/lib/resume/sections';
import { buildTheme, tint } from '../theme';
import { ContactStack, PageFooter, Photo, Section, SectionContent, SectionHeading, hasPhoto } from '../primitives';
import type { TemplateProps } from './types';

/** 11. International Job Application — Europass-inspired structured two-column label/content layout. */
export default function International({ data, c, variant }: TemplateProps) {
  const t = buildTheme(c, { nameScale: 2.35, lineHeight: 1.42, text: '#1f2937', muted: '#4b5563' });
  const p = data.personal;
  const stacked = variant === 'stacked';
  const keys = visibleSections(data);
  const labelW = 128;

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
      {/* Structured Personal Details Header */}
      <View
        style={{
          flexDirection: 'row',
          paddingBottom: 14,
          marginBottom: t.sectionGap * 1.1,
          borderBottomWidth: 1.5,
          borderBottomColor: t.primary,
        }}
      >
        <View style={{ width: stacked ? 86 : labelW, paddingRight: 12, alignItems: 'flex-start' }}>
          {hasPhoto(t, p) ? (
            <Photo src={p.photo} size={74} shape="rounded" borderColor={t.primary} borderWidth={1} />
          ) : (
            <View
              style={{
                backgroundColor: tint(t.primary, 0.92),
                paddingVertical: 4,
                paddingHorizontal: 7,
                borderLeftWidth: 2.5,
                borderLeftColor: t.primary,
              }}
            >
              <Text style={{ fontSize: t.fs.tiny, fontWeight: 700, color: t.primary, textTransform: 'uppercase', letterSpacing: 1 }}>
                Personal Information
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.fs.name, fontWeight: 700, color: t.primary, lineHeight: 1.1 }}>
            {p.fullName || 'Your Name'}
          </Text>
          {p.jobTitle ? (
            <Text style={{ fontSize: t.fs.title, fontWeight: 500, color: t.text, marginTop: 3, marginBottom: 8 }}>
              {p.jobTitle}
            </Text>
          ) : null}
          <ContactStack t={t} personal={p} icons iconColor={t.primary} gap={2.5} />
        </View>
      </View>

      {/* Sections */}
      {stacked ? (
        keys.map((k, i) => (
          <Section
            key={k}
            t={t}
            last={i === keys.length - 1}
            heading={<SectionHeading t={t} title={sectionTitle(data, k)} />}
          >
            <SectionContent
              k={k}
              data={data}
              t={t}
              o={{
                entry: { dateStyle: 'column', columnWidth: 92, subtitleColor: t.primary, bullet: '•', bulletColor: t.primary },
                skills: 'tags',
                languages: 'table',
              }}
            />
          </Section>
        ))
      ) : (
        keys.map((k, i) => (
          <View key={k} style={{ flexDirection: 'row', marginBottom: i === keys.length - 1 ? 0 : t.sectionGap }}>
            <View style={{ width: labelW, paddingRight: 14 }} wrap={false}>
              <Text
                style={{
                  fontSize: t.fs.small,
                  fontWeight: 700,
                  color: t.primary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  lineHeight: 1.3,
                }}
              >
                {sectionTitle(data, k)}
              </Text>
              <View style={{ height: 1, backgroundColor: tint(t.primary, 0.7), marginTop: 4 }} />
            </View>
            <View style={{ flex: 1 }}>
              <SectionContent
                k={k}
                data={data}
                t={t}
                o={{
                  entry: { dateStyle: 'right', subtitleColor: t.primary, bullet: '•', bulletColor: t.primary },
                  skills: 'tags',
                  languages: 'table',
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
