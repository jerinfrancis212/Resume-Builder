/* Shared react-pdf building blocks used by all resume templates. */
import { Image, Link, Path, Rect, Circle, Svg, Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import type { ReactNode } from 'react';
import type { HeadingStyle, PersonalInfo, ResumeData, SectionKey } from '@/types/resume';
import { ensureUrl, formatDate, formatRange, prettyUrl, SKILL_LEVEL_LABELS, toLines } from '@/lib/resume/format';
import { ADDITIONAL_SECTION_META, isExtraKey } from '@/lib/resume/sections';
import type { Theme } from './theme';

type S = Style | Style[];
const flat = (s?: S): Style => (Array.isArray(s) ? Object.assign({}, ...s) : s ?? {});

/* ------------------------------------------------------------------------ */
/* Icons (Lucide paths, stroke based)                                        */
/* ------------------------------------------------------------------------ */

export type IconName = 'mail' | 'phone' | 'pin' | 'linkedin' | 'globe';

export function Icon({ name, size = 8, color = '#555' }: { name: IconName; size?: number; color?: string }) {
  const common = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'mail' && (
        <>
          <Rect x="2" y="4" width="20" height="16" rx="2" {...common} />
          <Path d="M22 7 L13.03 12.7 A1.94 1.94 0 0 1 10.97 12.7 L2 7" {...common} />
        </>
      )}
      {name === 'phone' && (
        <Path
          d="M22 16.92 V19.92 A2 2 0 0 1 19.82 21.92 A19.79 19.79 0 0 1 11.19 18.85 A19.5 19.5 0 0 1 5.19 12.85 A19.79 19.79 0 0 1 2.12 4.18 A2 2 0 0 1 4.11 2 H7.11 A2 2 0 0 1 9.11 3.72 A12.84 12.84 0 0 0 9.81 6.53 A2 2 0 0 1 9.36 8.64 L8.09 9.91 A16 16 0 0 0 14.09 15.91 L15.36 14.64 A2 2 0 0 1 17.47 14.19 A12.84 12.84 0 0 0 20.28 14.89 A2 2 0 0 1 22 16.92 Z"
          {...common}
        />
      )}
      {name === 'pin' && (
        <>
          <Path d="M20 10 C20 16 12 22 12 22 C12 22 4 16 4 10 A8 8 0 0 1 20 10 Z" {...common} />
          <Circle cx="12" cy="10" r="3" {...common} />
        </>
      )}
      {name === 'linkedin' && (
        <>
          <Path d="M16 8 A6 6 0 0 1 22 14 V21 H18 V14 A2 2 0 0 0 14 14 V21 H10 V14 A6 6 0 0 1 16 8 Z" {...common} />
          <Rect x="2" y="9" width="4" height="12" {...common} />
          <Circle cx="4" cy="4" r="2" {...common} />
        </>
      )}
      {name === 'globe' && (
        <>
          <Circle cx="12" cy="12" r="10" {...common} />
          <Path d="M12 2 A14.5 14.5 0 0 0 12 22 A14.5 14.5 0 0 0 12 2" {...common} />
          <Path d="M2 12 H22" {...common} />
        </>
      )}
    </Svg>
  );
}

/* ------------------------------------------------------------------------ */
/* Contact details                                                           */
/* ------------------------------------------------------------------------ */

export interface ContactItem {
  icon: IconName;
  label: string;
  value: string;
  href?: string;
}

export function contactItems(p: PersonalInfo): ContactItem[] {
  const items: ContactItem[] = [];
  if (p.email.trim()) items.push({ icon: 'mail', label: 'Email', value: p.email.trim(), href: `mailto:${p.email.trim()}` });
  if (p.phone.trim()) items.push({ icon: 'phone', label: 'Phone', value: p.phone.trim(), href: `tel:${p.phone.replace(/[^\d+]/g, '')}` });
  if (p.location.trim()) items.push({ icon: 'pin', label: 'Location', value: p.location.trim() });
  if (p.linkedin.trim()) items.push({ icon: 'linkedin', label: 'LinkedIn', value: prettyUrl(p.linkedin), href: ensureUrl(p.linkedin) });
  if (p.website.trim()) items.push({ icon: 'globe', label: 'Website', value: prettyUrl(p.website), href: ensureUrl(p.website) });
  return items;
}

export function ContactInline({
  t,
  personal,
  color,
  separator = '  •  ',
  align = 'left',
  icons = false,
  iconColor,
  style,
  fontSize,
}: {
  t: Theme;
  personal: PersonalInfo;
  color?: string;
  separator?: string;
  align?: 'left' | 'center' | 'right';
  icons?: boolean;
  iconColor?: string;
  style?: S;
  fontSize?: number;
}) {
  const items = contactItems(personal);
  if (!items.length) return null;
  const fs = fontSize ?? t.fs.small;
  const col = color ?? t.muted;
  const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
  if (!icons) {
    return (
      <Text style={[{ fontSize: fs, color: col, textAlign: align }, flat(style)]}>
        {items.map((it, i) => (
          <Text key={it.icon}>
            {i > 0 ? separator : ''}
            {it.href ? (
              <Link src={it.href} style={{ color: col, textDecoration: 'none' }}>
                {it.value}
              </Link>
            ) : (
              it.value
            )}
          </Text>
        ))}
      </Text>
    );
  }
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: justify }, flat(style)]}>
      {items.map((it) => (
        <View key={it.icon} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, marginBottom: 2 }}>
          <Icon name={it.icon} size={fs * 0.95} color={iconColor ?? col} />
          <ItemValue item={it} style={{ fontSize: fs, color: col, marginLeft: 3 }} />
        </View>
      ))}
    </View>
  );
}

export function ContactStack({
  t,
  personal,
  color,
  iconColor,
  labels = false,
  icons = true,
  labelColor,
  gap = 4,
}: {
  t: Theme;
  personal: PersonalInfo;
  color?: string;
  iconColor?: string;
  labels?: boolean;
  icons?: boolean;
  labelColor?: string;
  gap?: number;
}) {
  const items = contactItems(personal);
  const col = color ?? t.text;
  return (
    <View>
      {items.map((it) => (
        <View key={it.icon} style={{ marginBottom: gap }} wrap={false}>
          {labels ? (
            <Text style={{ fontSize: t.fs.tiny, color: labelColor ?? t.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 1 }}>
              {it.label}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {icons ? (
              <View style={{ marginTop: t.fs.small * 0.22, marginRight: 5 }}>
                <Icon name={it.icon} size={t.fs.small} color={iconColor ?? col} />
              </View>
            ) : null}
            <ItemValue item={it} style={{ fontSize: t.fs.small, color: col, flex: 1 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

function ItemValue({ item, style }: { item: ContactItem; style: Style }) {
  if (item.href)
    return (
      <Link src={item.href} style={[style, { textDecoration: 'none' }]}>
        {item.value}
      </Link>
    );
  return <Text style={style}>{item.value}</Text>;
}

/* ------------------------------------------------------------------------ */
/* Photo                                                                     */
/* ------------------------------------------------------------------------ */

export function Photo({
  src,
  size,
  shape = 'circle',
  borderColor,
  borderWidth = 0,
  style,
}: {
  src: string;
  size: number;
  shape?: 'circle' | 'square' | 'rounded';
  borderColor?: string;
  borderWidth?: number;
  style?: S;
}) {
  const radius = shape === 'circle' ? size / 2 : shape === 'rounded' ? size * 0.12 : 0;
  const innerSize = Math.max(1, size - borderWidth * 2);
  const innerRadius = Math.max(0, radius - borderWidth);
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth,
          borderColor: borderColor ?? '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        },
        flat(style),
      ]}
    >
      <Image
        src={src}
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerRadius,
          objectFit: 'cover',
        }}
      />
    </View>
  );
}

export const hasPhoto = (t: Theme, p: PersonalInfo) => t.c.showPhoto && !!p.photo;

/* ------------------------------------------------------------------------ */
/* Headings                                                                  */
/* ------------------------------------------------------------------------ */

export interface HeadingProps {
  t: Theme;
  title: string;
  variant?: HeadingStyle;
  color?: string;
  textColor?: string;
  ruleColor?: string;
  align?: 'left' | 'center';
  uppercase?: boolean;
  letterSpacing?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  marginBottom?: number;
  onDark?: boolean;
}

export function SectionHeading({
  t,
  title,
  variant,
  color,
  textColor,
  ruleColor,
  align = 'left',
  uppercase = true,
  letterSpacing = 1.1,
  fontSize,
  fontFamily,
  fontWeight = 700,
  marginBottom,
  onDark = false,
}: HeadingProps) {
  const v = variant ?? t.c.headingStyle;
  const accent = color ?? (onDark ? '#ffffff' : t.primary);
  const fs = fontSize ?? t.fs.h;
  const mb = marginBottom ?? Math.max(4, t.itemGap * 0.75);
  const txt: Style = {
    fontSize: fs,
    fontWeight,
    fontFamily: fontFamily ?? t.font,
    color: textColor ?? accent,
    letterSpacing: uppercase ? letterSpacing : 0,
    textTransform: uppercase ? 'uppercase' : 'none',
    textAlign: align,
    lineHeight: 1.2,
  };
  switch (v) {
    case 'bar':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: mb, justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
          <View style={{ width: 3, height: fs * 1.05, backgroundColor: accent, marginRight: 6 }} />
          <Text style={txt}>{title}</Text>
        </View>
      );
    case 'filled':
      return (
        <View
          style={{
            backgroundColor: onDark ? 'rgba(255,255,255,0.14)' : t.primarySoft,
            paddingVertical: 3,
            paddingHorizontal: 6,
            marginBottom: mb,
            borderRadius: 1.5,
          }}
        >
          <Text style={[txt, onDark ? { color: '#ffffff' } : {}]}>{title}</Text>
        </View>
      );
    case 'plain':
      return <Text style={[txt, { marginBottom: mb }]}>{title}</Text>;
    case 'underline':
    default:
      return (
        <View
          style={{
            borderBottomWidth: 0.75,
            borderBottomColor: ruleColor ?? (onDark ? 'rgba(255,255,255,0.45)' : accent),
            paddingBottom: 2.5,
            marginBottom: mb,
          }}
        >
          <Text style={txt}>{title}</Text>
        </View>
      );
  }
}

/** A section with a heading that never sits orphaned at the bottom of a page. */
export function Section({
  t,
  heading,
  children,
  style,
  last = false,
}: {
  t: Theme;
  heading: ReactNode;
  children: ReactNode;
  style?: S;
  last?: boolean;
}) {
  return (
    <View style={[{ marginBottom: last ? 0 : t.sectionGap }, flat(style)]}>
      <View minPresenceAhead={36} wrap={false}>
        {heading}
      </View>
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------------ */
/* Text helpers                                                              */
/* ------------------------------------------------------------------------ */

export function Bullets({
  t,
  items,
  bullet = '•',
  color,
  bulletColor,
  fontSize,
  style,
  indent = 9,
}: {
  t: Theme;
  items: string[];
  bullet?: string;
  color?: string;
  bulletColor?: string;
  fontSize?: number;
  style?: S;
  indent?: number;
}) {
  if (!items.length) return null;
  const fs = fontSize ?? t.fs.base;
  return (
    <View style={flat(style)}>
      {items.map((line, i) => (
        <View key={i} style={{ flexDirection: 'row', marginTop: i === 0 ? 0 : 1.6 }} wrap={false}>
          <Text style={{ width: indent, fontSize: fs, color: bulletColor ?? t.muted }}>{bullet}</Text>
          <Text style={{ flex: 1, fontSize: fs, color: color ?? t.text, lineHeight: t.lh }}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

/** Renders multi-line text as a paragraph (single line) or bullets (multiple lines). */
export function RichText({ t, text, color, fontSize, style, bullet }: { t: Theme; text: string; color?: string; fontSize?: number; style?: S; bullet?: string }) {
  const lines = toLines(text);
  if (!lines.length) return null;
  if (lines.length === 1)
    return <Text style={[{ fontSize: fontSize ?? t.fs.base, color: color ?? t.text, lineHeight: t.lh }, flat(style)]}>{lines[0]}</Text>;
  return <Bullets t={t} items={lines} color={color} fontSize={fontSize} style={style} bullet={bullet} />;
}

export function Paragraph({ t, text, color, style }: { t: Theme; text: string; color?: string; style?: S }) {
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
  return (
    <View style={flat(style)}>
      {paras.map((p, i) => (
        <Text key={i} style={{ fontSize: t.fs.base, color: color ?? t.text, lineHeight: t.lh, marginTop: i ? 4 : 0 }}>
          {p}
        </Text>
      ))}
    </View>
  );
}

const join = (parts: (string | undefined | null | false)[], sep = ' · ') => parts.filter((p) => p && String(p).trim()).join(sep);

/* ------------------------------------------------------------------------ */
/* Generic entry                                                             */
/* ------------------------------------------------------------------------ */

export type DateStyle = 'right' | 'below' | 'column' | 'inline';

export interface EntryOptions {
  dateStyle?: DateStyle;
  /** Width of the date column when dateStyle = 'column'. */
  columnWidth?: number;
  titleColor?: string;
  subtitleColor?: string;
  dateColor?: string;
  subtitleItalic?: boolean;
  /** Put subtitle (company) above title (role). */
  subtitleFirst?: boolean;
  bullet?: string;
  bulletColor?: string;
  titleSize?: number;
  dateUppercase?: boolean;
  dateFont?: string;
}

export function Entry({
  t,
  title,
  subtitle,
  meta,
  date,
  url,
  children,
  o = {},
}: {
  t: Theme;
  title: string;
  subtitle?: string;
  meta?: string;
  date?: string;
  url?: string;
  children?: ReactNode;
  o?: EntryOptions;
}) {
  const ds = o.dateStyle ?? 'right';
  const titleStyle: Style = { fontSize: o.titleSize ?? t.fs.base * 1.04, fontWeight: 700, color: o.titleColor ?? t.text, lineHeight: 1.3 };
  const subStyle: Style = {
    fontSize: t.fs.base,
    color: o.subtitleColor ?? t.primary,
    fontStyle: o.subtitleItalic ? 'italic' : 'normal',
    fontWeight: o.subtitleItalic ? 400 : 500,
    lineHeight: 1.3,
  };
  const dateStyle: Style = {
    fontSize: t.fs.small,
    color: o.dateColor ?? t.muted,
    lineHeight: 1.3,
    textTransform: o.dateUppercase ? 'uppercase' : 'none',
    letterSpacing: o.dateUppercase ? 0.4 : 0,
    fontFamily: o.dateFont,
  };
  const metaStyle: Style = { fontSize: t.fs.small, color: t.muted, lineHeight: 1.3 };
  const urlEl = url?.trim() ? (
    <Link src={ensureUrl(url)} style={{ fontSize: t.fs.small, color: t.primary, textDecoration: 'none' }}>
      {prettyUrl(url)}
    </Link>
  ) : null;

  const first = o.subtitleFirst ? subtitle : title;
  const second = o.subtitleFirst ? title : subtitle;
  const firstStyle = o.subtitleFirst ? { ...titleStyle } : titleStyle;
  const secondStyle = o.subtitleFirst ? { ...subStyle, color: o.subtitleColor ?? t.text, fontWeight: 400 } : subStyle;

  const body = children ? <View style={{ marginTop: 2.5 }}>{children}</View> : null;

  if (ds === 'column') {
    const w = o.columnWidth ?? 78;
    return (
      <View style={{ flexDirection: 'row', marginBottom: t.itemGap }}>
        <View style={{ width: w, paddingRight: 8 }}>
          {date ? <Text style={dateStyle}>{date}</Text> : null}
          {meta ? <Text style={[metaStyle, { marginTop: 1 }]}>{meta}</Text> : null}
        </View>
        <View style={{ flex: 1 }}>
          <View wrap={false} minPresenceAhead={14}>
            {first ? <Text style={firstStyle}>{first}</Text> : null}
            {second ? <Text style={secondStyle}>{second}</Text> : null}
            {urlEl}
          </View>
          {body}
        </View>
      </View>
    );
  }

  if (ds === 'below' || ds === 'inline') {
    const metaLine = join([date, meta]);
    return (
      <View style={{ marginBottom: t.itemGap }}>
        <View wrap={false} minPresenceAhead={14}>
          {ds === 'inline' ? (
            <Text style={firstStyle}>
              {first}
              {second ? <Text style={[secondStyle, { fontWeight: 400 }]}>{first ? `, ${second}` : second}</Text> : null}
            </Text>
          ) : (
            <>
              {first ? <Text style={firstStyle}>{first}</Text> : null}
              {second ? <Text style={secondStyle}>{second}</Text> : null}
            </>
          )}
          {metaLine ? <Text style={[dateStyle, { marginTop: 0.5 }]}>{metaLine}</Text> : null}
          {urlEl}
        </View>
        {body}
      </View>
    );
  }

  // right
  return (
    <View style={{ marginBottom: t.itemGap }}>
      <View wrap={false} minPresenceAhead={14}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={[firstStyle, { flex: 1, paddingRight: 8 }]}>{first}</Text>
          {date ? <Text style={[dateStyle, { textAlign: 'right' }]}>{date}</Text> : null}
        </View>
        {second || meta ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[secondStyle, { flex: 1, paddingRight: 8 }]}>{second}</Text>
            {meta ? <Text style={[metaStyle, { textAlign: 'right' }]}>{meta}</Text> : null}
          </View>
        ) : null}
        {urlEl}
      </View>
      {body}
    </View>
  );
}

/* ------------------------------------------------------------------------ */
/* Section content renderers                                                 */
/* ------------------------------------------------------------------------ */

export type SkillsMode = 'tags' | 'inline' | 'list' | 'columns' | 'bars' | 'dots';
export type LanguagesMode = 'list' | 'inline' | 'bars' | 'table';

export interface ContentOptions {
  entry?: EntryOptions;
  skills?: SkillsMode;
  skillColumns?: number;
  languages?: LanguagesMode;
  /** Colors for content rendered on dark backgrounds (e.g. sidebars). */
  onDark?: boolean;
  textColor?: string;
  mutedColor?: string;
  tagBg?: string;
  tagColor?: string;
  tagBorder?: string;
  barColor?: string;
  barTrack?: string;
  /** Show "Key achievements" label above achievement bullets. */
  achievementsLabel?: boolean;
  compact?: boolean;
  presentLabel?: string;
}

/** Renders the content (without heading) of any resume section. */
export function SectionContent({ k, data, t, o = {} }: { k: SectionKey; data: ResumeData; t: Theme; o?: ContentOptions }) {
  const text = o.textColor ?? t.text;
  const muted = o.mutedColor ?? t.muted;
  const e: EntryOptions = { ...o.entry };
  if (o.onDark) {
    e.titleColor ??= text;
    e.subtitleColor ??= muted;
    e.dateColor ??= muted;
  }
  const tt: Theme = o.textColor || o.mutedColor ? { ...t, text, muted } : t;

  if (isExtraKey(k)) {
    const sec = data.additional.find((s) => `extra:${s.id}` === k);
    if (!sec) return null;
    const meta = ADDITIONAL_SECTION_META[sec.type];
    const items = sec.items.filter((i) => i.title.trim() || i.description.trim());
    if (meta.compact) {
      return <Text style={{ fontSize: t.fs.base, color: text, lineHeight: t.lh }}>{items.map((i) => i.title).join(', ')}</Text>;
    }
    if (sec.type === 'references') {
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {items.map((i) => (
            <View key={i.id} style={{ width: o.compact ? '100%' : '50%', paddingRight: 10, marginBottom: t.itemGap }} wrap={false}>
              <Text style={{ fontSize: t.fs.base, fontWeight: 700, color: text }}>{i.title}</Text>
              {i.subtitle ? <Text style={{ fontSize: t.fs.small, color: muted }}>{i.subtitle}</Text> : null}
              {i.description ? <Text style={{ fontSize: t.fs.small, color: text, lineHeight: t.lh }}>{i.description}</Text> : null}
            </View>
          ))}
        </View>
      );
    }
    return (
      <View>
        {items.map((i) => (
          <Entry key={i.id} t={tt} title={i.title} subtitle={i.subtitle} date={formatDate(i.date)} url={i.url} o={e}>
            {i.description ? <RichText t={tt} text={i.description} color={text} bullet={e.bullet} /> : null}
          </Entry>
        ))}
      </View>
    );
  }

  switch (k) {
    case 'summary':
      return <Paragraph t={tt} text={data.summary} color={text} />;

    case 'experience':
      return (
        <View>
          {data.experience
            .filter((x) => x.jobTitle.trim() || x.company.trim())
            .map((x) => {
              const resp = toLines(x.responsibilities);
              const ach = toLines(x.achievements);
              return (
                <Entry
                  key={x.id}
                  t={tt}
                  title={x.jobTitle}
                  subtitle={x.company}
                  meta={x.location}
                  date={formatRange(x.startDate, x.endDate, x.current, o.presentLabel)}
                  o={e}
                >
                  {resp.length || ach.length ? (
                    <View>
                      <Bullets t={tt} items={resp} bullet={e.bullet} bulletColor={e.bulletColor} color={text} />
                      {ach.length ? (
                        <View style={{ marginTop: resp.length ? 3 : 0 }}>
                          {o.achievementsLabel !== false && resp.length ? (
                            <Text style={{ fontSize: t.fs.small, fontWeight: 600, color: muted, marginBottom: 1.5 }}>Key achievements</Text>
                          ) : null}
                          <Bullets t={tt} items={ach} bullet={e.bullet} bulletColor={e.bulletColor} color={text} />
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </Entry>
              );
            })}
        </View>
      );

    case 'education':
      return (
        <View>
          {data.education
            .filter((x) => x.degree.trim() || x.institution.trim())
            .map((x) => (
              <Entry
                key={x.id}
                t={tt}
                title={x.degree}
                subtitle={x.institution}
                meta={join([x.location, x.grade])}
                date={formatRange(x.startYear, x.endYear)}
                o={e}
              >
                {x.description ? <RichText t={tt} text={x.description} color={text} bullet={e.bullet} /> : null}
              </Entry>
            ))}
        </View>
      );

    case 'projects':
      return (
        <View>
          {data.projects
            .filter((x) => x.name.trim())
            .map((x) => (
              <Entry key={x.id} t={tt} title={x.name} subtitle={x.technologies} url={x.url} o={{ ...e, subtitleItalic: true, subtitleColor: e.subtitleColor ?? muted }}>
                {x.description ? <RichText t={tt} text={x.description} color={text} bullet={e.bullet} /> : null}
              </Entry>
            ))}
        </View>
      );

    case 'certifications':
      return (
        <View>
          {data.certifications
            .filter((x) => x.name.trim())
            .map((x) =>
              o.compact ? (
                <View key={x.id} style={{ marginBottom: t.itemGap * 0.7 }} wrap={false}>
                  <Text style={{ fontSize: t.fs.base, fontWeight: 600, color: text, lineHeight: 1.3 }}>{x.name}</Text>
                  <Text style={{ fontSize: t.fs.small, color: muted }}>{join([x.issuer, formatDate(x.date)])}</Text>
                </View>
              ) : (
                <Entry key={x.id} t={tt} title={x.name} subtitle={x.issuer} date={formatDate(x.date)} url={x.url} o={{ ...e, subtitleItalic: false }} />
              ),
            )}
        </View>
      );

    case 'languages':
      return <Languages t={tt} data={data} mode={o.languages ?? 'list'} o={o} />;

    case 'skills':
      return <Skills t={tt} data={data} mode={o.skills ?? 'tags'} o={o} />;
  }
}

function Skills({ t, data, mode, o }: { t: Theme; data: ResumeData; mode: SkillsMode; o: ContentOptions }) {
  const skills = data.skills.filter((s) => s.name.trim());
  const text = o.textColor ?? t.text;
  const muted = o.mutedColor ?? t.muted;
  switch (mode) {
    case 'inline':
      return <Text style={{ fontSize: t.fs.base, color: text, lineHeight: t.lh }}>{skills.map((s) => s.name).join('  ·  ')}</Text>;
    case 'list':
      return (
        <View>
          {skills.map((s) => (
            <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2.5 }} wrap={false}>
              <Text style={{ fontSize: t.fs.base, color: text }}>{s.name}</Text>
              {s.level ? <Text style={{ fontSize: t.fs.tiny, color: muted }}>{SKILL_LEVEL_LABELS[s.level]}</Text> : null}
            </View>
          ))}
        </View>
      );
    case 'columns': {
      const cols = o.skillColumns ?? 3;
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {skills.map((s) => (
            <View key={s.id} style={{ width: `${100 / cols}%`, flexDirection: 'row', marginBottom: 2, paddingRight: 6 }} wrap={false}>
              <Text style={{ width: 8, fontSize: t.fs.base, color: o.barColor ?? t.primary }}>•</Text>
              <Text style={{ flex: 1, fontSize: t.fs.base, color: text }}>{s.name}</Text>
            </View>
          ))}
        </View>
      );
    }
    case 'bars':
      return (
        <View>
          {skills.map((s) => (
            <View key={s.id} style={{ marginBottom: 5 }} wrap={false}>
              <Text style={{ fontSize: t.fs.small, color: text, marginBottom: 2 }}>{s.name}</Text>
              {s.level ? (
                <View style={{ height: 3, backgroundColor: o.barTrack ?? (o.onDark ? 'rgba(255,255,255,0.25)' : '#e6e8eb'), borderRadius: 1.5 }}>
                  <View style={{ width: `${(s.level / 5) * 100}%`, height: 3, backgroundColor: o.barColor ?? (o.onDark ? '#ffffff' : t.primary), borderRadius: 1.5 }} />
                </View>
              ) : null}
            </View>
          ))}
        </View>
      );
    case 'dots':
      return (
        <View>
          {skills.map((s) => (
            <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }} wrap={false}>
              <Text style={{ fontSize: t.fs.small, color: text, flex: 1 }}>{s.name}</Text>
              {s.level ? (
                <View style={{ flexDirection: 'row' }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <View
                      key={n}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 2.5,
                        marginLeft: 2,
                        backgroundColor: n <= s.level ? o.barColor ?? (o.onDark ? '#fff' : t.primary) : o.barTrack ?? (o.onDark ? 'rgba(255,255,255,0.25)' : '#dfe2e6'),
                      }}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      );
    case 'tags':
    default:
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: -4 }}>
          {skills.map((s) => (
            <Text
              key={s.id}
              style={{
                fontSize: t.fs.small,
                color: o.tagColor ?? (o.onDark ? '#fff' : t.text),
                backgroundColor: o.tagBg ?? (o.onDark ? 'rgba(255,255,255,0.14)' : t.primarySoft),
                borderWidth: o.tagBorder ? 0.6 : 0,
                borderColor: o.tagBorder ?? 'transparent',
                borderRadius: 2,
                paddingVertical: 2,
                paddingHorizontal: 5,
                marginRight: 4,
                marginBottom: 4,
              }}
            >
              {s.name}
            </Text>
          ))}
        </View>
      );
  }
}

const LEVEL_SCORE: Record<string, number> = {
  native: 5, fluent: 5, 'c2': 5, 'c1': 4, 'professional working': 4, 'b2': 4, 'b1': 3, conversational: 3, 'a2': 2, basic: 2, 'a1': 1,
};
function langScore(p: string): number {
  const k = p.toLowerCase();
  for (const key of Object.keys(LEVEL_SCORE)) if (k.startsWith(key)) return LEVEL_SCORE[key];
  return 0;
}

function Languages({ t, data, mode, o }: { t: Theme; data: ResumeData; mode: LanguagesMode; o: ContentOptions }) {
  const langs = data.languages.filter((l) => l.language.trim());
  const text = o.textColor ?? t.text;
  const muted = o.mutedColor ?? t.muted;
  if (mode === 'inline')
    return (
      <Text style={{ fontSize: t.fs.base, color: text, lineHeight: t.lh }}>
        {langs.map((l, i) => (
          <Text key={l.id}>
            {i ? '   ·   ' : ''}
            <Text style={{ fontWeight: 600 }}>{l.language}</Text>
            {l.proficiency ? <Text style={{ color: muted }}> ({l.proficiency})</Text> : null}
          </Text>
        ))}
      </Text>
    );
  if (mode === 'bars')
    return (
      <View>
        {langs.map((l) => {
          const sc = langScore(l.proficiency);
          return (
            <View key={l.id} style={{ marginBottom: 5 }} wrap={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={{ fontSize: t.fs.small, color: text }}>{l.language}</Text>
                <Text style={{ fontSize: t.fs.tiny, color: muted }}>{l.proficiency}</Text>
              </View>
              {sc ? (
                <View style={{ height: 3, backgroundColor: o.barTrack ?? (o.onDark ? 'rgba(255,255,255,0.25)' : '#e6e8eb'), borderRadius: 1.5 }}>
                  <View style={{ width: `${(sc / 5) * 100}%`, height: 3, backgroundColor: o.barColor ?? (o.onDark ? '#fff' : t.primary), borderRadius: 1.5 }} />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  if (mode === 'table')
    return (
      <View>
        {langs.map((l) => (
          <View key={l.id} style={{ flexDirection: 'row', marginBottom: 2.5 }} wrap={false}>
            <Text style={{ width: '40%', fontSize: t.fs.base, fontWeight: 600, color: text }}>{l.language}</Text>
            <Text style={{ flex: 1, fontSize: t.fs.base, color: muted }}>{l.proficiency}</Text>
          </View>
        ))}
      </View>
    );
  return (
    <View>
      {langs.map((l) => (
        <View key={l.id} style={{ marginBottom: 3 }} wrap={false}>
          <Text style={{ fontSize: t.fs.base, color: text, lineHeight: 1.3 }}>
            <Text style={{ fontWeight: 600 }}>{l.language}</Text>
            {l.proficiency ? <Text style={{ color: muted }}>{`  –  ${l.proficiency}`}</Text> : null}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Small "Page X of Y" footer that only shows on multi-page resumes. */
export function PageFooter({ t, name, color }: { t: Theme; name?: string; color?: string }) {
  return (
    <Text
      fixed
      style={{ position: 'absolute', bottom: Math.max(12, t.margin * 0.45), left: t.margin, right: t.margin, fontSize: t.fs.tiny, color: color ?? t.faint, textAlign: 'right' }}
      render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${name ? `${name}  ·  ` : ''}${pageNumber} / ${totalPages}` : '')}
    />
  );
}
