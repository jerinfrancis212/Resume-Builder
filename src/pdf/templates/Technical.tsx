import { Page, Text, View } from '@react-pdf/renderer';
import type { SectionKey } from '@/types/resume';
import { visibleSections, sectionTitle } from '@/lib/resume/sections';
import { buildTheme, tint } from '../theme';
import { ContactInline, PageFooter, Section, SectionContent, SectionHeading } from '../primitives';
import type { TemplateProps } from './types';

const SIDE_KEYS: SectionKey[] = ['skills', 'certifications', 'languages'];

/** 9. Technical / IT Professional — monospace metadata, clean engineering hierarchy & skill meters. */
export default function Technical({ data, c, variant }: TemplateProps) {
  const t = buildTheme(c, { nameScale: 2.45, lineHeight: 1.4, text: '#111827', muted: '#4b5563' });
  const p = data.personal;
  const single = variant === 'single';
  const keys = visibleSections(data);
  const side = keys.filter((k) => SIDE_KEYS.includes(k));
  const main = keys.filter((k) => !SIDE_KEYS.includes(k));

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
      {/* Crisp engineering header */}
      <View
        style={{
          borderBottomWidth: 1.5,
          borderBottomColor: t.primary,
          paddingBottom: 11,
          marginBottom: t.sectionGap * 1.1,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontSize: t.fs.name, fontWeight: 700, color: t.text, letterSpacing: -0.3, lineHeight: 1.1 }}>
            {p.fullName || 'Your Name'}
          </Text>
          {p.jobTitle ? (
            <Text style={{ fontFamily: 'IBM Plex Mono', fontSize: t.fs.small, fontWeight: 500, color: t.primary }}>
              {p.jobTitle}
            </Text>
          ) : null}
        </View>
        <ContactInline
          t={t}
          personal={p}
          icons
          iconColor={t.primary}
          color={t.muted}
          fontSize={t.fs.tiny * 1.05}
          style={{ marginTop: 7, fontFamily: 'IBM Plex Mono' }}
        />
      </View>

      {single ? (
        keys.map((k, i) => (
          <Section
            key={k}
            t={t}
            last={i === keys.length - 1}
            heading={
              <SectionHeading
                t={t}
                title={sectionTitle(data, k)}
                fontFamily="IBM Plex Mono"
                fontSize={t.fs.base}
                letterSpacing={1}
              />
            }
          >
            <SectionContent
              k={k}
              data={data}
              t={t}
              o={{
                entry: { dateStyle: 'right', dateFont: 'IBM Plex Mono', subtitleColor: t.primary, bullet: '›', bulletColor: t.primary },
                skills: 'tags',
                tagBg: tint(t.primary, 0.92),
                tagColor: t.primary,
                tagBorder: tint(t.primary, 0.72),
                languages: 'inline',
              }}
            />
          </Section>
        ))
      ) : (
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1, paddingRight: 18 }}>
            {main.map((k, i) => (
              <Section
                key={k}
                t={t}
                last={i === main.length - 1}
                heading={
                  <SectionHeading
                    t={t}
                    title={sectionTitle(data, k)}
                    fontFamily="IBM Plex Mono"
                    fontSize={t.fs.base}
                    letterSpacing={0.9}
                  />
                }
              >
                <SectionContent
                  k={k}
                  data={data}
                  t={t}
                  o={{
                    entry: { dateStyle: 'right', dateFont: 'IBM Plex Mono', subtitleColor: t.primary, bullet: '›', bulletColor: t.primary },
                  }}
                />
              </Section>
            ))}
          </View>

          <View
            style={{
              width: 158,
              backgroundColor: '#f8fafc',
              borderRadius: 4,
              borderWidth: 0.6,
              borderColor: '#e2e8f0',
              padding: 11,
              alignSelf: 'flex-start',
            }}
          >
            {side.map((k, i) => (
              <Section
                key={k}
                t={t}
                last={i === side.length - 1}
                heading={
                  <SectionHeading
                    t={t}
                    title={sectionTitle(data, k)}
                    fontFamily="IBM Plex Mono"
                    fontSize={t.fs.small}
                    letterSpacing={0.9}
                  />
                }
              >
                <SectionContent
                  k={k}
                  data={data}
                  t={t}
                  o={{
                    skills: 'bars',
                    languages: 'list',
                    compact: true,
                  }}
                />
              </Section>
            ))}
          </View>
        </View>
      )}

      <PageFooter t={t} name={p.fullName} />
    </Page>
  );
}
