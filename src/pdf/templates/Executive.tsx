import { Page, Text, View } from '@react-pdf/renderer';
import { visibleSections, sectionTitle } from '@/lib/resume/sections';
import { buildTheme, shade, tint } from '../theme';
import { ContactInline, PageFooter, Paragraph, Photo, Section, SectionContent, SectionHeading, hasPhoto } from '../primitives';
import type { TemplateProps } from './types';

/** 3. Corporate Executive — commanding full-width header band & executive profile box. */
export default function Executive({ data, c, variant }: TemplateProps) {
  const t = buildTheme(c, { nameScale: 2.55, lineHeight: 1.44, text: '#1e2430' });
  const p = data.personal;
  const lightBand = variant === 'light';
  const bandBg = lightBand ? tint(t.primary, 0.92) : shade(t.primary, 0.08);
  const bandText = lightBand ? t.primary : '#ffffff';
  const bandSub = lightBand ? t.muted : 'rgba(255,255,255,0.82)';
  const keys = visibleSections(data);
  const hasSummary = keys.includes('summary');
  const rest = keys.filter((k) => k !== 'summary');

  return (
    <Page
      size="A4"
      style={{
        fontFamily: t.font,
        fontSize: t.fs.base,
        color: t.text,
        lineHeight: t.lh,
        paddingTop: t.margin,
        paddingBottom: t.margin + 8,
        paddingHorizontal: t.margin,
      }}
    >
      {/* Top accent strip repeated on continuation pages */}
      <View fixed style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: t.primary }} />

      {/* Full-bleed executive header band (negative margins counteract page padding on page 1) */}
      <View
        style={{
          marginTop: -t.margin,
          marginHorizontal: -t.margin,
          backgroundColor: bandBg,
          paddingTop: 26,
          paddingBottom: 20,
          paddingHorizontal: t.margin,
          marginBottom: t.sectionGap * 1.15,
          borderBottomWidth: lightBand ? 2 : 0,
          borderBottomColor: t.primary,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1, paddingRight: hasPhoto(t, p) ? 16 : 0 }}>
          <Text style={{ fontSize: t.fs.name, fontWeight: 700, color: bandText, letterSpacing: 0.4, lineHeight: 1.12 }}>
            {p.fullName || 'Your Name'}
          </Text>
          {p.jobTitle ? (
            <Text style={{ fontSize: t.fs.title, color: bandSub, marginTop: 4, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
              {p.jobTitle}
            </Text>
          ) : null}
          <ContactInline
            t={t}
            personal={p}
            icons
            color={bandSub}
            iconColor={lightBand ? t.primary : 'rgba(255,255,255,0.75)'}
            style={{ marginTop: 10 }}
          />
        </View>
        {hasPhoto(t, p) ? (
          <Photo src={p.photo} size={74} shape="circle" borderColor={lightBand ? t.primary : 'rgba(255,255,255,0.85)'} borderWidth={2} />
        ) : null}
      </View>

      {/* Highlighted Executive Summary */}
      {hasSummary ? (
        <View
          style={{
            backgroundColor: tint(t.primary, 0.94),
            borderLeftWidth: 3,
            borderLeftColor: t.primary,
            paddingVertical: 10,
            paddingHorizontal: 13,
            marginBottom: t.sectionGap * 1.1,
          }}
          wrap={false}
        >
          <Text style={{ fontSize: t.fs.tiny, fontWeight: 700, color: t.primary, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
            {sectionTitle(data, 'summary')}
          </Text>
          <Paragraph t={t} text={data.summary} />
        </View>
      ) : null}

      {/* Remaining sections */}
      {rest.map((k, i) => (
        <Section
          key={k}
          t={t}
          last={i === rest.length - 1}
          heading={<SectionHeading t={t} title={sectionTitle(data, k)} letterSpacing={1.2} />}
        >
          <SectionContent
            k={k}
            data={data}
            t={t}
            o={{
              entry: { dateStyle: 'right', subtitleColor: t.primary, bullet: '▪', bulletColor: t.primary },
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
