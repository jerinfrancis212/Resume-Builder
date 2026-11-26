import { Page, Text, View } from '@react-pdf/renderer';
import { visibleSections, sectionTitle } from '@/lib/resume/sections';
import { buildTheme, tint } from '../theme';
import { ContactInline, PageFooter, Photo, Section, SectionContent, SectionHeading, hasPhoto } from '../primitives';
import type { TemplateProps } from './types';

/** 6. Graduate / Fresher — energetic, approachable layout spotlighting education, projects & skills. */
export default function Graduate({ data, c, variant }: TemplateProps) {
  const t = buildTheme(c, { nameScale: 2.5, lineHeight: 1.42 });
  const p = data.personal;
  const centered = variant === 'centered';
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
        paddingHorizontal: t.margin,
      }}
    >
      {/* Top color bar */}
      <View fixed style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: t.primary }} />

      {/* Header card */}
      <View
        style={{
          flexDirection: centered ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: tint(t.primary, 0.94),
          borderRadius: 6,
          paddingVertical: 14,
          paddingHorizontal: 16,
          marginBottom: t.sectionGap * 1.1,
        }}
      >
        {centered && hasPhoto(t, p) ? <Photo src={p.photo} size={64} borderColor={t.primary} borderWidth={1.5} style={{ marginBottom: 8 }} /> : null}
        <View style={{ flex: centered ? undefined : 1, alignItems: centered ? 'center' : 'flex-start', paddingRight: !centered && hasPhoto(t, p) ? 14 : 0 }}>
          <Text style={{ fontSize: t.fs.name, fontWeight: 700, color: t.text, lineHeight: 1.12, textAlign: centered ? 'center' : 'left' }}>
            {p.fullName || 'Your Name'}
          </Text>
          {p.jobTitle ? (
            <Text style={{ fontSize: t.fs.title, fontWeight: 600, color: t.primary, marginTop: 3, textAlign: centered ? 'center' : 'left' }}>
              {p.jobTitle}
            </Text>
          ) : null}
          <ContactInline
            t={t}
            personal={p}
            icons
            align={centered ? 'center' : 'left'}
            iconColor={t.primary}
            color={t.muted}
            style={{ marginTop: 8 }}
          />
        </View>
        {!centered && hasPhoto(t, p) ? <Photo src={p.photo} size={66} borderColor={t.primary} borderWidth={1.5} /> : null}
      </View>

      {keys.map((k, i) => (
        <Section
          key={k}
          t={t}
          last={i === keys.length - 1}
          heading={<SectionHeading t={t} title={sectionTitle(data, k)} letterSpacing={0.9} />}
        >
          <SectionContent
            k={k}
            data={data}
            t={t}
            o={{
              entry: { dateStyle: 'right', subtitleColor: t.primary, bullet: '•', bulletColor: t.primary },
              skills: 'tags',
              tagBg: tint(t.primary, 0.9),
              tagColor: t.primary,
              tagBorder: tint(t.primary, 0.72),
              languages: 'inline',
            }}
          />
        </Section>
      ))}

      <PageFooter t={t} name={p.fullName} />
    </Page>
  );
}
