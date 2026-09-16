/* eslint-disable react-refresh/only-export-components */
import dayjs from "dayjs";
import type { ReactNode } from "react";
import brand from "../../../theme/brand";

/**
 * The company's ID card, drawn from one description of a person.
 *
 * A pure function of `(person, company, options)` returning a front and a
 * back, so the same code draws the card that gets printed and the preview on
 * the settings screen — a preview that showed anything other than the real
 * output would be worse than none at all.
 *
 * Laid out at 54 × 86 mm, the standard CR80 card in portrait.
 */

export type IdCardPerson = {
  name: string;
  code?: string;
  role: string;
  photo?: string;
  phone?: string;
  dateOfBirth?: string;
  department?: string;
  group?: string;
  departmentLabel?: string;
  groupLabel?: string;
  validUntil?: string;
  blood?: string;
  email?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  nationalId?: string;
  joinedOn?: string;
  /** Anything the record keeps that has no row of its own. */
  extra?: { label: string; value?: string }[];
};

export type IdCardCompany = {
  name?: string;
  shortName?: string;
  tagline?: string;
  logo?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  licenceNo?: string;
  idCardNote?: string;
};

/**
 * The knobs an office can turn on top of a design.
 *
 * Deliberately few: a colour, which rows to print, whether the QR appears, and
 * the words on the back. Anything more and this stops being "pick a card" and
 * becomes a layout editor — which is what the five designs exist to avoid.
 */
/**
 * Everything the card can print about a person, front or back.
 *
 * One list, not two. A field is not "a front field" or "a back field" by
 * nature — the office decides where it goes, and the same field may be wanted
 * in either place, so the side is a setting rather than a property of the
 * field. `name` is absent on purpose: a card without a name on the front is not
 * an ID card, so it is not offered as a choice.
 */
/**
 * How the QR is filled in.
 *
 *  - `id`      the identifier alone — what a door scanner or a spreadsheet wants
 *  - `details` the rows switched on for the card, as readable text, so any
 *              phone camera shows the record without an app or a network
 *  - `url`     a link built from a pattern, for a company that has a
 *              verification page: `{code}` and `{id}` are substituted
 */
export type QrMode = "id" | "details" | "url";

export type CardField =
  | "idNo"
  | "role"
  | "dateOfBirth"
  | "department"
  | "group"
  | "phone"
  | "blood"
  | "email"
  | "guardian"
  | "address"
  | "nationalId"
  | "joinedOn"
  | "validUntil"
  | "licence";

const asDate = (v?: string) => (v ? dayjs(v).format("DD MMM YYYY") : undefined);

/**
 * How each field is labelled and where its value comes from.
 *
 * The card, the settings screen and the QR all read this one array, so a field
 * added here appears in all three at once and cannot appear in one without the
 * others.
 */
export const CARD_FIELDS: {
  key: CardField;
  label: string;
  value: (p: IdCardPerson, i: IdCardCompany) => string | undefined;
}[] = [
  { key: "idNo", label: "ID No", value: (p) => p.code },
  { key: "role", label: "Role", value: (p) => p.role },
  { key: "dateOfBirth", label: "Date of Birth", value: (p) => asDate(p.dateOfBirth) },
  { key: "department", label: "Patch", value: (p) => p.department },
  { key: "group", label: "Type", value: (p) => p.group },
  { key: "phone", label: "Mobile", value: (p) => p.phone },
  { key: "blood", label: "Blood Group", value: (p) => p.blood },
  { key: "email", label: "Email", value: (p) => p.email },
  {
    key: "guardian",
    label: "Guardian",
    value: (p) => [p.guardianName, p.guardianPhone].filter(Boolean).join(" · ") || undefined,
  },
  { key: "address", label: "Address", value: (p) => p.address },
  { key: "nationalId", label: "National ID", value: (p) => p.nationalId },
  { key: "joinedOn", label: "Admitted On", value: (p) => asDate(p.joinedOn) },
  { key: "validUntil", label: "Valid Until", value: (p) => asDate(p.validUntil) },
  { key: "licence", label: "Licence", value: (_p, i) => i.licenceNo },
];

/**
 * The record decides two of these labels.
 *
 * An agent's "patch" is a set of areas and a staff member's is a department, so
 * the caller passes the word that fits the person rather than the card
 * insisting on one.
 */
const labelFor = (f: { key: CardField; label: string }, p: IdCardPerson) =>
  f.key === "department"
    ? p.departmentLabel || f.label
    : f.key === "group"
      ? p.groupLabel || f.label
      : f.label;

/** The fields switched on for one side, in catalogue order. */
export const rowsFor = (
  side: Partial<Record<CardField, boolean>> | undefined,
  person: IdCardPerson,
  company: IdCardCompany
) =>
  CARD_FIELDS.filter((f) => side?.[f.key])
    .map((f) => ({ label: labelFor(f, person), value: f.value(person, company) }))
    .filter((r): r is { label: string; value: string } => !!r.value);

export type IdCardOptions = {
  accent?: string;
  showPhoto?: boolean;
  /** Rows printed on the front, under the name. */
  fields?: Partial<Record<CardField, boolean>>;
  /** Rows printed on the back, above the terms. */
  backFields?: Partial<Record<CardField, boolean>>;
  showSignature?: boolean;
  showQr?: boolean;
  qrMode?: QrMode;
  qrUrlPattern?: string;
  /** One line per term. Empty falls back to the standard four. */
  terms?: string[];
};

export const DEFAULT_OPTIONS: Required<Omit<IdCardOptions, "terms" | "qrUrlPattern">> & {
  terms: string[];
  qrUrlPattern: string;
} = {
  accent: brand.primary,
  showPhoto: true,
  // What the company's printed card carries today. Everything else in the
  // catalogue is off, so the card out of the box is the card they already
  // issue — the switches change it, they do not have to be undone first.
  fields: {
    blood: true,
    group: true,
    department: true,
    phone: true,
  },
  backFields: {},
  showSignature: true,
  // Off. The card the company prints has no QR on it, so a card produced
  // here matches it until somebody asks for one.
  showQr: false,
  qrMode: "details",
  qrUrlPattern: "",
  terms: [],
};

/**
 * The card's accent.
 *
 * A single colour now. It used to derive a dark shade and a lime partner too,
 * for the sweeps that were drawn in code — those come from the company's own
 * frame artwork since, so deriving colours nothing reads was just a colour
 * system with no consumers.
 */
const palette = (options?: IdCardOptions) => ({
  base: options?.accent || DEFAULT_OPTIONS.accent,
});

/**
 * One design. The union is kept as a type rather than dropped so a stored
 * setting that still names an old layout is a compile-time question here and a
 * silent fallback at runtime, instead of an unrenderable card.
 */
export type TemplateKey = "company";

export const ID_CARD_TEMPLATES: {
  key: TemplateKey;
  name: string;
  hint: string;
}[] = [
  {
    key: "company",
    name: "Company Card",
    hint: "The company's printed card — waves, round photo, two signatures",
  },
];

/**
 * What each group starts on.
 *
 * One layout for all three, in the brand navy. The layouts used to differ
 * per group on the theory that a card should be recognisable across a room —
 * but the company prints one card, and three designs meant three things to
 * update every time the logo or the address changed. The role is printed on the
 * card, which is what actually distinguishes them.
 *
 * The accent is still per group, so an office that wants agents in a
 * different colour can set it in Settings → ID Cards without a second design.
 */
export const DEFAULT_BY_AUDIENCE: Record<
  string,
  { template: TemplateKey; accent: string }
> = {
  agent: { template: "company", accent: brand.primary },
  employee: { template: "company", accent: brand.primary },
};

/** The starting point for one group: its design plus the shared defaults. */
export const defaultsFor = (audience: string): IdCardOptions => ({
  ...DEFAULT_OPTIONS,
  accent: DEFAULT_BY_AUDIENCE[audience]?.accent ?? DEFAULT_OPTIONS.accent,
  fields: { ...DEFAULT_OPTIONS.fields },
  backFields: { ...DEFAULT_OPTIONS.backFields },
});

export const templateFor = (audience: string): TemplateKey =>
  DEFAULT_BY_AUDIENCE[audience]?.template ?? "company";

export const CARD_W = "54mm";
export const CARD_H = "86mm";

const BRAND = brand.primary;
const INK = "#0f172a";



const Photo = ({
  person,
  size,
  round = true,
  ring = BRAND,
  options,
}: {
  person: IdCardPerson;
  size: string;
  round?: boolean;
  ring?: string;
  options?: IdCardOptions;
}) =>
  options?.showPhoto === false ? null : (
  <div
    className={`grid place-items-center overflow-hidden bg-white ${
      round ? "rounded-full" : "rounded-md"
    }`}
    style={{ height: size, width: size, border: `0.7mm solid ${ring}` }}
  >
    {/* The same stand-in the staff table uses, so a card for somebody with
        no photo on file still looks like a card rather than a blank disc. */}
    <img
      src={person.photo || "/assets/default_image.png"}
      alt=""
      className="h-full w-full object-cover"
    />
  </div>
  );

const Logo = ({
  company,
  size,
}: {
  company: IdCardCompany;
  size: string;
}) =>
  (
    // No initials box: two grey letters on a card reads as a mistake, and the
    // company's own mark is what a card is recognised by. Falls back to the
    // packaged logo until one is set in Settings → Company.
    <img
      src={company.logo || "/assets/logo.png"}
      alt=""
      className="shrink-0 object-contain"
      style={{ height: size, width: size }}
    />
  );

const Shell = ({
  children,
  background = "#fff",
}: {
  children: ReactNode;
  background?: string;
}) => (
  <div
    style={{ width: CARD_W, height: CARD_H, background }}
    className="relative flex flex-col overflow-hidden rounded-xl shadow-lg"
  >
    {children}
  </div>
);

/* ── The card ───────────────────────────────────────────────────────────── */

type Args = {
  person: IdCardPerson;
  company: IdCardCompany;
  qr?: string;
  options?: IdCardOptions;
};

/**
 * The printed card's green-and-lime border, as artwork.
 *
 * This was drawn in SVG for a while and never quite matched — the sweeps are
 * soft-edged and overlap with a gradient, which is a lot of guesswork in path
 * data and was wrong in a different way each time. The company supplied the
 * real frame instead, so the card now uses it and there is nothing left to
 * approximate.
 *
 * A transparent-centred PNG laid over the card, not a background of the card:
 * `object-fill` stretches it to whatever the card measures rather than cropping
 * it, and everything else on the card renders above it. It is decoration, so it
 * takes no clicks.
 *
 * `mirror` is for the back, where the printed card carries the same frame
 * turned around.
 */
const Frame = ({ mirror = false }: { mirror?: boolean }) => (
  <img
    src="/frame/fram.png"
    alt=""
    aria-hidden
    className="pointer-events-none absolute inset-0 h-full w-full select-none"
    style={{
      objectFit: "fill",
      transform: mirror ? "scaleX(-1)" : undefined,
    }}
  />
);

/**
 * `Label : Value`, left aligned, colons in a column.
 *
 * A grid rather than padded text: the labels are different lengths and the
 * colons have to line up, or the block reads as five unrelated lines. The
 * longest label sets the column, which is why "Patch" sits tight against
 * its colon on the printed card and the rest have a gap.
 *
 * Which rows appear is the office's choice (Settings → ID Cards), so this
 * takes the rows already resolved rather than deciding for itself — the same
 * component then draws the front block and the back block.
 */
const CardRows = ({
  rows,
  size = "7.5px",
}: {
  rows: { label: string; value: string }[];
  size?: string;
}) => {
  if (!rows.length) return null;

  return (
    <div className="w-full space-y-[1.4mm]">
      {rows.map((r) => (
        <div
          key={r.label}
          className="grid items-baseline"
          style={{ gridTemplateColumns: "17mm 1.6mm 1fr" }}
        >
          <span
            className="leading-tight"
            style={{ color: INK, fontSize: size }}
          >
            {r.label}
          </span>
          <span
            className="leading-tight"
            style={{ color: INK, fontSize: size }}
          >
            :
          </span>
          <span
            className="break-words leading-tight"
            style={{ color: INK, fontSize: size }}
          >
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * The company block — mark, name, and what it operates under.
 *
 * `nameColor` because the front prints the name in the brand navy and the
 * back prints it in ink. On the front it is branding; on the back it is the
 * address somebody is being asked to post a found card to, and that reads
 * better as plain text.
 */
const Crest = ({
  company,
  logoSize,
  nameSize,
  nameColor,
}: {
  company: IdCardCompany;
  logoSize: string;
  nameSize: string;
  nameColor: string;
}) => {
  const displayName = !company.name || company.name.trim().toLowerCase() === "company"
    ? "Zoom Property"
    : company.name;

  return (
    <div className="flex flex-col items-center text-center">
      <Logo company={company} size={logoSize} />
      <p
        className="mt-[1.2mm] font-black uppercase leading-tight tracking-wide"
        style={{ fontSize: nameSize, color: nameColor }}
      >
        {displayName}
      </p>
      <p
        className="mt-[0.6mm] text-[6.5px] leading-tight font-medium"
        style={{ color: INK }}
      >
        {company.tagline || "National Skill Development Authority (NSDA)"}
      </p>
    </div>
  );
};

/**
 * The company card — the only one.
 *
 * A copy of the card the company already prints, rather than a design of its
 * own: the point is that a card produced here and one produced by the printer
 * are the same object. There used to be five layouts and a picker, which was
 * never a real choice — an ID card is a document a company issues, not a
 * preference, and five designs meant five things to keep in step every time the
 * logo or the address changed.
 *
 * No QR on either face. The printed card has none, and this is the printed card.
 */
const companyCard = ({ person, company: comp, qr, options }: Args) => {
  const c = palette(options);
  const front = [
    { label: "Name", value: person.name },
    ...rowsFor(options?.fields ?? DEFAULT_OPTIONS.fields, person, comp),
  ];
  const back = rowsFor(options?.backFields, person, comp);

  return {
    front: (
      <Shell>
        <Frame />

        <div className="relative flex flex-1 flex-col items-center px-[5mm] pb-[17mm] pt-[6mm]">
          <Crest
            company={comp}
            logoSize="12mm"
            nameSize="10px"
            nameColor={c.base}
          />

          {/* The face gets its own line and overlaps nothing: a card is checked
              by looking at the photo first and reading second. */}
          <div className="mt-[2mm]">
            <Photo person={person} size="20mm" ring={c.base} options={options} />
          </div>

          <div className="mt-[3mm] w-full">
            <CardRows rows={front} />
          </div>
        </div>

        {/* Two signatures, as the printed card carries: the office that issues
            the card and the head who authorises it. They sit over the bottom
            swoosh, which is why the rule and the label are dark rather than
            white — the lime under them is far too light for white type. */}
        {options?.showSignature !== false && (
          <div className="absolute inset-x-0 bottom-[2.5mm] flex items-end justify-between px-[5mm]">
            {["Vice Principal", "Principal"].map((role) => (
              <div key={role} className="w-[18mm] text-center">
                <span
                  className="block border-t"
                  style={{ borderColor: INK }}
                />
                <span
                  className="mt-[0.5mm] block text-[6px]"
                  style={{ color: INK }}
                >
                  {role}
                </span>
              </div>
            ))}
          </div>
        )}
      </Shell>
    ),

    back: (
      <Shell>
        <Frame mirror />

        <div className="relative flex flex-1 flex-col items-center px-[5mm] pb-[17mm] pt-[13mm] text-center">
          <p className="text-[7.5px] italic" style={{ color: INK }}>
            If found please return to:
          </p>

          <div className="mt-[3mm]">
            <Crest
              company={comp}
              logoSize="12mm"
              nameSize="10px"
              nameColor={INK}
            />
          </div>

          {comp.address && (
            <p
              className="mt-[1mm] text-[6.5px] leading-snug"
              style={{ color: INK }}
            >
              {comp.address}
            </p>
          )}

          {back.length > 0 && (
            /* Left aligned, unlike everything else on this side: these are
               label/value pairs and the colons have to line up, which centred
               text cannot do. Smaller than the front, because the front has a
               photo's worth of room and this side does not. */
            <div className="mt-[3mm] w-full text-left">
              <CardRows rows={back} size="6.5px" />
            </div>
          )}

          {options?.showQr && qr && (
            /* The back, not the front: the front is what a person reads, and
               the printed card has no room there. */
            <img
              src={qr}
              alt=""
              className="mt-[3mm]"
              style={{ height: "14mm", width: "14mm" }}
            />
          )}

          <div className="mt-[4mm] space-y-[0.7mm]">
            {options?.terms && options.terms.some((t) => t.trim()) ? (
              options.terms.map((t, i) => (
                <p
                  key={i}
                  className="text-[6.5px] leading-snug"
                  style={{ color: INK }}
                >
                  {t.trim() || "\\u00A0"}
                </p>
              ))
            ) : (
              <>
                {comp.phone && (
                  <>
                    <p className="text-[6.5px]" style={{ color: INK }}>
                      Phone#
                    </p>
                    {/* One number per line. A card is read aloud across a counter,
                        and two numbers run together get misdialled. */}
                    {comp.phone
                      .split(/[,/]/)
                      .map((n) => n.trim())
                      .filter(Boolean)
                      .map((n) => (
                        <p key={n} className="text-[6.5px]" style={{ color: INK }}>
                          {n}
                        </p>
                      ))}
                  </>
                )}
                {comp.email && (
                  <p className="text-[6.5px]" style={{ color: INK }}>
                    E-mail # {comp.email}
                  </p>
                )}
                {comp.website && (
                  <p className="text-[6.5px]" style={{ color: INK }}>
                    Web # {comp.website}
                  </p>
                )}
                {/* No note line. The printed card ends at the website, and an
                    extra "If found, return to the office." under it repeats the
                    heading this whole side already carries. */}
              </>
            )}
          </div>
        </div>
      </Shell>
    ),
  };
};


const RENDERERS: Record<TemplateKey, (a: Args) => { front: ReactNode; back: ReactNode }> =
  { company: companyCard };

/**
 * Draw a card.
 *
 * The template argument is still accepted and still ignored gracefully: an
 * install upgrading from the five-layout version has "classic" or "midnight"
 * saved against each group, and those settings must keep printing a card
 * rather than throwing.
 */
export const renderIdCard = (template: string | undefined, args: Args) =>
  (RENDERERS[template as TemplateKey] ?? companyCard)(args);

/**
 * What the QR encodes.
 *
 * Only the rows the card itself is showing go in: leaving a field out of the
 * print and into the QR would be a hole rather than a setting, since a QR is
 * read by anyone with a phone.
 */
export const qrPayload = (
  person: IdCardPerson,
  company: IdCardCompany,
  options?: IdCardOptions
): string => {
  const o = withDefaults(options);
  if (o.qrMode === "id") return person.code || person.name;

  if (o.qrMode === "url") {
    const pattern = o.qrUrlPattern?.trim();
    if (pattern) {
      return pattern
        .replace(/\{code\}/gi, encodeURIComponent(person.code || ""))
        .replace(/\{id\}/gi, encodeURIComponent(person.code || ""));
    }
    // No pattern set yet — fall through to the details rather than print a QR
    // that resolves to nothing.
  }

  const seen = new Set<string>();
  const rows = [
    ...rowsFor(o.fields, person, company),
    ...rowsFor(o.backFields, person, company),
  ].filter((r) => !seen.has(r.label) && seen.add(r.label));

  return [
    company.name,
    "",
    person.name,
    ...rows.map((r) => `${r.label}: ${r.value}`),
    "",
    company.phone && `Tel: ${company.phone}`,
    company.website,
  ]
    .filter((l): l is string => typeof l === "string")
    .join("\n")
    .trim();
};

/** Merge a saved tweak set over the defaults, so a partial one is still valid. */
export const withDefaults = (
  o?: IdCardOptions,
  audience?: string
): IdCardOptions => {
  const base = audience ? defaultsFor(audience) : DEFAULT_OPTIONS;
  return {
    ...base,
    ...(o ?? {}),
    fields: { ...base.fields, ...(o?.fields ?? {}) },
    backFields: { ...base.backFields, ...(o?.backFields ?? {}) },
  };
};

/** Stand-in data for the settings previews — never shown on a real card. */
/**
 * A stand-in company, for the preview only.
 *
 * The card preview already invents a person; without inventing a company
 * too, the back of the card is blank until every field in Settings -> Company
 * has been filled, and an office judging the design sees a fault that is really
 * an empty form. Merged UNDER the real settings, so anything actually saved
 * wins and only the gaps are filled.
 *
 * Never used when printing a real card: a card that quietly invents a phone
 * number is worse than one that leaves it off.
 */
export const SAMPLE_COMPANY: IdCardCompany = {
  name: "Zoom Property",
  tagline: "Find the address you have been looking for",
  address: "Gulshan Avenue, Dhaka-1212, Bangladesh",
  phone: "+88 01700 000 000, +88 01700 000 001",
  email: "info@zoomproperty.com",
  website: "www.zoomproperty.com",
};


export const SAMPLE_PERSON: Record<string, IdCardPerson> = {
  agent: {
    name: "Nusrat Jahan",
    code: "AGT-2026-002",
    role: "Senior Sales Agent",
    dateOfBirth: "1991-04-08",
    department: "Gulshan, Banani",
    departmentLabel: "PATCH",
    group: "Full-time",
    groupLabel: "TYPE",
    validUntil: "2027-12-31",
    phone: "01912345678",
    blood: "O+",
    email: "nusrat@example.com",
    address: "45/A Banani, Dhaka",
    guardianName: "Md. Hasan",
    guardianPhone: "01612345678",
    nationalId: "0987654321",
    joinedOn: "2024-05-10",
  },
  employee: {
    name: "Rashedul Karim",
    code: "EMP-2026-014",
    role: "Accountant",
    dateOfBirth: "1988-11-23",
    department: "Accounts",
    departmentLabel: "DEPARTMENT",
    group: "Full-time",
    groupLabel: "TYPE",
    validUntil: "2028-12-31",
    phone: "01512345678",
    blood: "A+",
    email: "rashedul@example.com",
    address: "78 Gulshan, Dhaka",
    guardianName: "Kamrul Hasan",
    guardianPhone: "01787654321",
    nationalId: "1122334455",
    joinedOn: "2022-03-15",
  },
};
