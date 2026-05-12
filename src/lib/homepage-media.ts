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
export type HomepageMediaStatus = "active" | "inactive" | "archived";

export const SECTION_LABELS: Record<HomepageSection, string> = {
  hero: "Hero",
  header: "Header",
  logo: "Logos",
  banner: "Banners",
  background: "Backgrounds",
  footer: "Footer",
};

export const SLOT_OPTIONS: Record<HomepageSection, Array<{ value: string; label: string; allowsMultiple?: boolean }>> = {
  hero: [
    { value: "hero_background", label: "Homepage Hero Background" },
    { value: "hero_overlay_video", label: "Hero Overlay Video", allowsMultiple: true },
    { value: "faq_hero_background", label: "FAQ Hero Background" },
    { value: "about_hero_background", label: "About Hero Background" },
  ],
  header: [
    { value: "header_logo", label: "Header Logo" },
    { value: "header_background", label: "Header Background" },
  ],
  logo: [
    { value: "main_logo", label: "Main Logo" },
    { value: "network_mtn_logo", label: "MTN Logo" },
    { value: "network_telecel_logo", label: "Telecel Logo" },
    { value: "network_airteltigo_logo", label: "AirtelTigo Logo" },
    { value: "partner_logos", label: "Partner Logos", allowsMultiple: true },
  ],
  banner: [
    { value: "promo_banner_1", label: "Promo Banner 1" },
    { value: "promo_banner_2", label: "Promo Banner 2" },
    { value: "developer_community_image", label: "Developer Community Banner" },
  ],
  background: [
    { value: "section_bg_1", label: "Section Background 1" },
    { value: "section_bg_2", label: "Section Background 2" },
    { value: "scale_background_video", label: "Scale Section Background" },
  ],
  footer: [],
};

type LegacySectionMapping = {
  section: HomepageSection;
  slotKey: string;
};

const LEGACY_TO_NEW: Record<string, LegacySectionMapping> = {
  hero_background_video: { section: "hero", slotKey: "hero_background" },
  faq_hero_background: { section: "hero", slotKey: "faq_hero_background" },
  about_hero_background: { section: "hero", slotKey: "about_hero_background" },
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

export function isValidSlotKey(section: HomepageSection, slotKey: string): boolean {
  return SLOT_OPTIONS[section]?.some((slot) => slot.value === slotKey) ?? false;
}

export function getDefaultSlotForSection(section: HomepageSection): string | null {
  return SLOT_OPTIONS[section]?.[0]?.value ?? null;
}

export function allowsMultipleForSlot(section: HomepageSection, slotKey: string): boolean {
  const slot = SLOT_OPTIONS[section]?.find((s) => s.value === slotKey);
  return slot?.allowsMultiple ?? false;
}

export function detectMediaType(file: File): HomepageMediaType {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ["mp4", "webm", "ogg", "mov", "avi"].includes(ext) ? "video" : "image";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
