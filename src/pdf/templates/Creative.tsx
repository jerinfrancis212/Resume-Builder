import { Page, Text, View } from '@react-pdf/renderer';
import type { SectionKey } from '@/types/resume';
import { visibleSections, sectionTitle } from '@/lib/resume/sections';
import { formatRange, initials, toLines } from '@/lib/resume/format';
import { buildTheme, tint } from '../theme';
import { Bullets, ContactStack, PageFooter, Photo, Section, SectionContent, SectionHeading, hasPhoto } from '../primitives';
import type { TemplateProps } from './types';

const RAIL_KEYS: SectionKey[] = ['skills', 'languages', 'certifications'];

/** 7. Creative Professional — Playfair Display header, monogram badge & experience timeline. */
export default function Creative({ data, c, variant }: TemplateProps) {
  const t = buildTheme(c, { nameScale: 2.95, lineHeight: 1.44, text: '#24201d', muted: '#6b635b' });
  const p = data.personal;
  const timeline = variant !== 'classic';
  const keys = visibleSections(data);
  const rail = keys.filter((k) => RAIL_KEYS.includes(k));
  const main = keys.filter((k) => !RAIL_KEYS.includes(k));

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
      {/* Left accent stripe on every page */}
      <View fixed style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 7, backgroundColor: t.primary }} />

      {/* Expressive editorial header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: t.sectionGap * 1.2, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: tint(t.primary, 0.72) }}>
        <View style={{ marginRight: 16 }}>
          {hasPhoto(t, p) ? (
            <Photo src={p.photo} size={68} shape="rounded" borderColor={t.primary} borderWidth={1.5} />
          ) : (
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 6,
                backgroundColor: t.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 700, color: t.onPrimary }}>
                {initials(p.fullName) || 'CV'}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Playfair Display', fontSize: t.fs.name, fontWeight: 700, color: t.text, lineHeight: 1.08 }}>
            {p.fullName || 'Your Name'}
          </Text>
          {p.jobTitle ? (
            <Text style={{ fontSize: t.fs.title, color: t.primary, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 4 }}>
              {p.jobTitle}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Two-column editorial grid */}
      <View style={{ flexDirection: 'row' }}>
        {/* Main narrative column */}
        <View style={{ flex: 1, paddingRight: 22 }}>
          {main.map((k, i) => (
            <Section
              key={k}
              t={t}
              last={i === main.length - 1}
              heading={
                <SectionHeading
                  t={t}
                  title={sectionTitle(data, k)}
                  fontFamily="Playfair Display"
                  uppercase={false}
                  fontSize={t.fs.h * 1.2}
                  color={t.primary}
                />
              }
            >
              {timeline && k === 'experience' ? (
                <View>
                  {data.experience
                    .filter((x) => x.jobTitle.trim() || x.company.trim())
                    .map((x, idx, arr) => {
                      const resp = toLines(x.responsibilities);
                      const ach = toLines(x.achievements);
                      return (
                        <View key={x.id} style={{ flexDirection: 'row', marginBottom: idx === arr.length - 1 ? 0 : t.itemGap * 1.1 }}>
                          <View style={{ width: 14, alignItems: 'center', marginRight: 6 }}>
                            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: t.primary, marginTop: 3 }} />
                            {idx < arr.length - 1 ? (
                              <View style={{ width: 1, flex: 1, backgroundColor: tint(t.primary, 0.7), marginTop: 2 }} />
                            ) : null}
                          </View>
                          <View style={{ flex: 1 }}>
                            <View wrap={false} minPresenceAhead={14}>
                              <Text style={{ fontSize: t.fs.base * 1.05, fontWeight: 700, color: t.text }}>{x.jobTitle}</Text>
                              <Text style={{ fontSize: t.fs.small, color: t.primary, fontWeight: 600 }}>
                                {[x.company, x.location].filter(Boolean).join(' · ')}
                              </Text>
                              <Text style={{ fontSize: t.fs.tiny, color: t.muted, marginTop: 1 }}>
                                {formatRange(x.startDate, x.endDate, x.current)}
                              </Text>
                            </View>
                            {resp.length || ach.length ? (
                              <View style={{ marginTop: 3 }}>
                                <Bullets t={t} items={[...resp, ...ach]} bullet="▸" bulletColor={t.primary} />
                              </View>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                </View>
              ) : (
                <SectionContent
                  k={k}
                  data={data}
                  t={t}
                  o={{
                    entry: { dateStyle: 'below', subtitleColor: t.primary, bullet: '▸', bulletColor: t.primary },
                  }}
                />
              )}
            </Section>
          ))}
        </View>

        {/* Right info rail */}
        <View style={{ width: 162, paddingLeft: 16, borderLeftWidth: 0.75, borderLeftColor: '#e7e2dc' }}>
          <Section
            t={t}
            heading={
              <SectionHeading
                t={t}
                title="Contact"
                fontFamily="Playfair Display"
                uppercase={false}
                fontSize={t.fs.h * 1.1}
                color={t.primary}
              />
            }
          >
            <ContactStack t={t} personal={p} iconColor={t.primary} />
          </Section>

          {rail.map((k, i) => (
            <Section
              key={k}
              t={t}
              last={i === rail.length - 1}
              heading={
                <SectionHeading
                  t={t}
                  title={sectionTitle(data, k)}
                  fontFamily="Playfair Display"
                  uppercase={false}
                  fontSize={t.fs.h * 1.1}
                  color={t.primary}
                />
              }
            >
              <SectionContent
                k={k}
                data={data}
                t={t}
                o={{
                  skills: 'dots',
                  languages: 'list',
                  compact: true,
                }}
              />
            </Section>
          ))}
        </View>
      </View>

      <PageFooter t={t} name={p.fullName} />
    </Page>
  );
}
