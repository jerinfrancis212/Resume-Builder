import { Page, Text, View } from '@react-pdf/renderer';
import { visibleSections, sectionTitle } from '@/lib/resume/sections';
import { buildTheme, tint } from '../theme';
import { ContactStack, PageFooter, Photo, Section, SectionContent, hasPhoto } from '../primitives';
import type { TemplateProps } from './types';

/**
 * 13. Europass CV — authentic European Union CV structure with Europass blue accents,
 * structured personal details header, left-date timeline, and CEFR language table.
 */
export default function Europass({ data, c, variant }: TemplateProps) {
  const compact = variant === 'compact';
  const t = buildTheme(
    {
      ...c,
      fontSize: compact ? Math.max(8.2, c.fontSize - 0.5) : c.fontSize,
      sectionSpacing: compact ? c.sectionSpacing * 0.85 : c.sectionSpacing,
    },
    { nameScale: 2.35, lineHeight: compact ? 1.38 : 1.44, text: '#1d2433', muted: '#526075' },
  );
  const p = data.personal;
  const keys = visibleSections(data);
  const colW = compact ? 104 : 118;

  return (
    <Page
      size="A4"
      style={{
        fontFamily: t.font,
        fontSize: t.fs.base,
        color: t.text,
        lineHeight: t.lh,
        paddingTop: t.margin,
        paddingBottom: t.margin + 12,
        paddingHorizontal: t.margin,
      }}
    >
      {/* Top Europass bar repeated across pages */}
      <View fixed style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, backgroundColor: t.primary }} />

      {/* Europass header block */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: tint(t.primary, 0.94),
          borderBottomWidth: 2,
          borderBottomColor: t.primary,
          padding: compact ? 13 : 16,
          marginBottom: t.sectionGap * 1.15,
          borderRadius: 3,
        }}
      >
        {/* Left: Photo or Europass emblem badge */}
        <View style={{ width: colW - 10, paddingRight: 12, alignItems: 'center' }}>
          {hasPhoto(t, p) ? (
            <Photo src={p.photo} size={76} shape="circle" borderColor={t.primary} borderWidth={2} />
          ) : (
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                backgroundColor: t.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                europass
              </Text>
            </View>
          )}
          <Text
            style={{
              fontSize: 7,
              fontWeight: 700,
              color: t.primary,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              marginTop: 6,
            }}
          >
            Curriculum Vitae
          </Text>
        </View>

        {/* Right: Name, title & structured contact stack */}
        <View style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: tint(t.primary, 0.7), paddingLeft: 14 }}>
          <Text style={{ fontSize: t.fs.name, fontWeight: 700, color: t.primary, lineHeight: 1.12 }}>
            {p.fullName || 'Your Name'}
          </Text>
          {p.jobTitle ? (
            <Text style={{ fontSize: t.fs.title, fontWeight: 600, color: t.text, marginTop: 3, marginBottom: 8 }}>
              {p.jobTitle}
            </Text>
          ) : (
            <View style={{ height: 6 }} />
          )}
          <ContactStack t={t} personal={p} icons iconColor={t.primary} gap={2.5} />
        </View>
      </View>

      {/* Body sections with Europass left-rail accent heading */}
      {keys.map((k, i) => (
        <Section
          key={k}
          t={t}
          last={i === keys.length - 1}
          heading={
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Math.max(5, t.itemGap * 0.8) }}>
              <View style={{ width: colW, paddingRight: 10 }}>
                <Text
                  style={{
                    fontSize: t.fs.small,
                    fontWeight: 700,
                    color: t.primary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.9,
                  }}
                >
                  {sectionTitle(data, k)}
                </Text>
              </View>
              <View style={{ flex: 1, height: 1.2, backgroundColor: tint(t.primary, 0.55) }} />
            </View>
          }
        >
          <SectionContent
            k={k}
            data={data}
            t={t}
            o={{
              entry: {
                dateStyle: 'column',
                columnWidth: colW,
                subtitleColor: t.primary,
                bullet: '•',
                bulletColor: t.primary,
              },
              skills: 'tags',
              tagBg: tint(t.primary, 0.92),
              tagColor: t.primary,
              tagBorder: tint(t.primary, 0.72),
              languages: 'table',
            }}
          />
        </Section>
      ))}

      <PageFooter t={t} name={p.fullName ? `Europass CV  ·  ${p.fullName}` : 'Europass CV'} color={t.muted} />
    </Page>
  );
}
