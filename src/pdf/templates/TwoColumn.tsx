import { Page, Text, View } from '@react-pdf/renderer';
import type { SectionKey } from '@/types/resume';
import { visibleSections, sectionTitle, isExtraKey } from '@/lib/resume/sections';
import { ADDITIONAL_SECTION_META } from '@/lib/resume/sections';
import { initials } from '@/lib/resume/format';
import { buildTheme, shade } from '../theme';
import { ContactStack, PageFooter, Photo, Section, SectionContent, SectionHeading, hasPhoto } from '../primitives';
import type { TemplateProps } from './types';

const SIDEBAR_KEYS: SectionKey[] = ['skills', 'languages', 'certifications'];

/** 5. Modern Two Column — full-height colored sidebar + spacious main column. */
export default function TwoColumn({ data, c, variant }: TemplateProps) {
  const t = buildTheme(c, { nameScale: 2.6 });
  const p = data.personal;
  const right = variant === 'right';
  const sideW = 182;
  const keys = visibleSections(data);
  const isSide = (k: SectionKey) =>
    SIDEBAR_KEYS.includes(k) ||
    (isExtraKey(k) && (() => {
      const s = data.additional.find((a) => `extra:${a.id}` === k);
      return !!s && ADDITIONAL_SECTION_META[s.type].compact;
    })());
  const side = keys.filter(isSide);
  const main = keys.filter((k) => !isSide(k));
  const sideBg = shade(t.primary, 0.05);
  const onSide = '#ffffff';
  const onSideMuted = 'rgba(255,255,255,0.72)';

  return (
    <Page
      size="A4"
      style={{
        fontFamily: t.font,
        fontSize: t.fs.base,
        color: t.text,
        lineHeight: t.lh,
        paddingTop: t.margin,
        paddingBottom: t.margin,
        flexDirection: right ? 'row-reverse' : 'row',
      }}
    >
      {/* Sidebar background repeated on every page */}
      <View fixed style={{ position: 'absolute', top: 0, bottom: 0, [right ? 'right' : 'left']: 0, width: sideW, backgroundColor: sideBg }} />

      <View style={{ width: sideW, paddingHorizontal: 18 }}>
        <View style={{ alignItems: 'center', marginBottom: 18 }}>
          {hasPhoto(t, p) ? (
            <Photo src={p.photo} size={96} borderColor="rgba(255,255,255,0.9)" borderWidth={2.5} />
          ) : (
            <View style={{ width: 70, height: 70, borderRadius: 35, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: onSide, fontSize: 22, fontWeight: 600, letterSpacing: 1 }}>{initials(p.fullName) || 'CV'}</Text>
            </View>
          )}
        </View>

        <Section t={t} heading={<SectionHeading t={t} title="Contact" onDark fontSize={t.fs.base} />}>
          <ContactStack t={t} personal={p} color={onSide} iconColor={onSideMuted} />
        </Section>

        {side.map((k) => (
          <Section key={k} t={t} heading={<SectionHeading t={t} title={sectionTitle(data, k)} onDark fontSize={t.fs.base} />}>
            <SectionContent
              k={k}
              data={data}
              t={t}
              o={{ onDark: true, textColor: onSide, mutedColor: onSideMuted, skills: 'bars', languages: 'bars', compact: true }}
            />
          </Section>
        ))}
      </View>

      <View style={{ flex: 1, paddingLeft: right ? t.margin : 26, paddingRight: right ? 26 : t.margin }}>
        <View style={{ marginBottom: t.sectionGap * 1.1 }}>
          <Text style={{ fontSize: t.fs.name, fontWeight: 700, color: t.primary, lineHeight: 1.1, letterSpacing: -0.2 }}>{p.fullName || 'Your Name'}</Text>
          {p.jobTitle ? (
            <Text style={{ fontSize: t.fs.title, color: t.muted, marginTop: 4, letterSpacing: 1.2, textTransform: 'uppercase' }}>{p.jobTitle}</Text>
          ) : null}
          <View style={{ width: 36, height: 2.5, backgroundColor: t.primary, marginTop: 9 }} />
        </View>
        {main.map((k, i) => (
          <Section key={k} t={t} last={i === main.length - 1} heading={<SectionHeading t={t} title={sectionTitle(data, k)} ruleColor="#dfe2e6" />}>
            <SectionContent k={k} data={data} t={t} o={{ entry: { dateStyle: 'right' }, skills: 'tags' }} />
          </Section>
        ))}
      </View>
      <PageFooter t={t} name={p.fullName} />
    </Page>
  );
}
