export const HOMEPAGE_SECTIONS = [
  "hero",
  "header",
  "logo",
  "banner",
  "background",
  "footer",
] as const;

export type HomepageSection = (typeof HOMEPAGE_SECTIONS)[number];
export type HomepageMediaType = "image" | "video";
export type HomepageStorageSource = "local" | "supabase";

export const SECTION_LABELS: Record<HomepageSection, string> = {
  hero: "Hero",
  header: "Header",
  logo: "Logos",
  banner: "Banners",
  background: "Backgrounds",
  footer: "Footer",
};

type LegacySectionMapping = {
  section: HomepageSection;
  slotKey: string;
};

const LEGACY_TO_NEW: Record<string, LegacySectionMapping> = {
  hero_background_video: { section: "hero", slotKey: "hero_background" },
  header_logo: { section: "header", slotKey: "header_logo" },
  mtn_logo: { section: "logo", slotKey: "network_mtn_logo" },
  telecel_logo: { section: "logo", slotKey: "network_telecel_logo" },
  airteltigo_logo: { section: "logo", slotKey: "network_airteltigo_logo" },
  developer_community_image: { section: "banner", slotKey: "developer_community_image" },
  scale_background_video: { section: "background", slotKey: "scale_background_video" },
};

const NEW_TO_LEGACY: Record<string, string> = Object.entries(LEGACY_TO_NEW).reduce(
  (acc, [legacy, mapped]) => {
    acc[mapped.slotKey] = legacy;
    return acc;
  },
  {} as Record<string, string>
);

export function isHomepageSection(input: string): input is HomepageSection {
  return HOMEPAGE_SECTIONS.includes(input as HomepageSection);
}

export function inferSectionFromSlotKey(slotKey: string): HomepageSection {
  if (slotKey in NEW_TO_LEGACY) {
    const entry = Object.values(LEGACY_TO_NEW).find((item) => item.slotKey === slotKey);
    if (entry) return entry.section;
  }

  if (slotKey.includes("logo")) return "logo";
  if (slotKey.includes("header")) return "header";
  if (slotKey.includes("hero")) return "hero";
  if (slotKey.includes("background")) return "background";
  if (slotKey.includes("banner")) return "banner";
  return "footer";
}

export function mapLegacySectionKey(
  legacySectionKey: string
): { section: HomepageSection; slotKey: string } {
  return LEGACY_TO_NEW[legacySectionKey] ?? {
    section: inferSectionFromSlotKey(legacySectionKey),
    slotKey: legacySectionKey,
  };
}

export function toLegacySectionKey(slotKey: string): string {
  return NEW_TO_LEGACY[slotKey] ?? slotKey;
}
