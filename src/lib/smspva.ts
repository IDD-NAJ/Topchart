import { getSmspvaApiKey } from "@/lib/env";

const SMSPVA_BASE = "https://smspva.com/priemnik.php";

export interface SmspvaService {
  code: string;
  name: string;
  category: string;
  baseUsdPrice: number;
  pictureUrl?: string;
}

export interface SmspvaCountry {
  code: string;
  name: string;
  flag: string;
}

export interface SmspvaAvailability {
  count: number;
  costUsd?: number;
}

export const SMSPVA_SERVICES: SmspvaService[] = [
  { code: "opt6",  name: "WhatsApp",   category: "social_media",            baseUsdPrice: 0.15 },
  { code: "opt4",  name: "Telegram",   category: "social_media",            baseUsdPrice: 0.10 },
  { code: "opt11", name: "Facebook",   category: "social_media",            baseUsdPrice: 0.12 },
  { code: "opt3",  name: "Twitter/X",  category: "social_media",            baseUsdPrice: 0.10 },
  { code: "ma",    name: "Instagram",  category: "social_media",            baseUsdPrice: 0.12 },
  { code: "opt1",  name: "Viber",      category: "social_media",            baseUsdPrice: 0.10 },
  { code: "opt2",  name: "WeChat",     category: "social_media",            baseUsdPrice: 0.14 },
  { code: "sc",    name: "Snapchat",   category: "social_media",            baseUsdPrice: 0.12 },
  { code: "ti",    name: "TikTok",     category: "streaming_entertainment", baseUsdPrice: 0.12 },
  { code: "dc",    name: "Discord",    category: "social_media",            baseUsdPrice: 0.10 },
  { code: "tn",    name: "Tinder",     category: "social_media",            baseUsdPrice: 0.12 },
  { code: "go",    name: "Google",     category: "professional_tools",      baseUsdPrice: 0.18 },
  { code: "ms",    name: "Microsoft",  category: "professional_tools",      baseUsdPrice: 0.15 },
  { code: "ya",    name: "Yahoo",      category: "professional_tools",      baseUsdPrice: 0.10 },
  { code: "li",    name: "LinkedIn",   category: "professional_tools",      baseUsdPrice: 0.14 },
  { code: "am",    name: "Amazon",     category: "ecommerce_financial",     baseUsdPrice: 0.15 },
  { code: "ub",    name: "Uber",       category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "pp",    name: "PayPal",     category: "ecommerce_financial",     baseUsdPrice: 0.14 },
  { code: "bi",    name: "Binance",    category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "ay",    name: "AliExpress", category: "ecommerce_financial",     baseUsdPrice: 0.10 },
  { code: "nf",    name: "Netflix",    category: "streaming_entertainment", baseUsdPrice: 0.15 },
  { code: "sp",    name: "Spotify",    category: "streaming_entertainment", baseUsdPrice: 0.12 },
  { code: "ot",    name: "Any Service",category: "professional_tools",      baseUsdPrice: 0.08 },
];

export const SMSPVA_COUNTRIES: SmspvaCountry[] = [
  { code: "0",   name: "United States",  flag: "🇺🇸" },
  { code: "55",  name: "Brazil",         flag: "🇧🇷" },
  { code: "52",  name: "Mexico",         flag: "🇲🇽" },
  { code: "54",  name: "Argentina",      flag: "🇦🇷" },
  { code: "57",  name: "Colombia",       flag: "🇨🇴" },
  { code: "56",  name: "Chile",          flag: "🇨🇱" },
  { code: "51",  name: "Peru",           flag: "🇵🇪" },
  { code: "58",  name: "Venezuela",      flag: "🇻🇪" },
  { code: "7",   name: "Russia",         flag: "🇷🇺" },
  { code: "44",  name: "United Kingdom", flag: "🇬🇧" },
  { code: "49",  name: "Germany",        flag: "🇩🇪" },
  { code: "33",  name: "France",         flag: "🇫🇷" },
  { code: "34",  name: "Spain",          flag: "🇪🇸" },
  { code: "39",  name: "Italy",          flag: "🇮�" },
  { code: "31",  name: "Netherlands",    flag: "�🇱" },
  { code: "46",  name: "Sweden",         flag: "🇸🇪" },
  { code: "47",  name: "Norway",         flag: "🇳🇴" },
  { code: "358", name: "Finland",        flag: "🇫🇮" },
  { code: "48",  name: "Poland",         flag: "🇵🇱" },
  { code: "380", name: "Ukraine",        flag: "🇺🇦" },
  { code: "40",  name: "Romania",        flag: "�🇴" },
  { code: "32",  name: "Belgium",        flag: "��" },
  { code: "41",  name: "Switzerland",    flag: "🇨🇭" },
  { code: "43",  name: "Austria",        flag: "🇦🇹" },
  { code: "45",  name: "Denmark",        flag: "🇩🇰" },
  { code: "420", name: "Czech Republic", flag: "🇨�" },
  { code: "36",  name: "Hungary",        flag: "🇭🇺" },
  { code: "30",  name: "Greece",         flag: "�🇷" },
  { code: "351", name: "Portugal",       flag: "🇵🇹" },
  { code: "7k",  name: "Kazakhstan",     flag: "🇰🇿" },
  { code: "998", name: "Uzbekistan",     flag: "🇺🇿" },
  { code: "374", name: "Armenia",        flag: "🇦🇲" },
  { code: "994", name: "Azerbaijan",     flag: "🇦🇿" },
  { code: "995", name: "Georgia",        flag: "��" },
  { code: "91",  name: "India",          flag: "🇮🇳" },
  { code: "86",  name: "China",          flag: "🇨🇳" },
  { code: "81",  name: "Japan",          flag: "��" },
  { code: "82",  name: "South Korea",    flag: "🇰🇷" },
  { code: "62",  name: "Indonesia",      flag: "🇮🇩" },
  { code: "63",  name: "Philippines",    flag: "🇵🇭" },
  { code: "66",  name: "Thailand",       flag: "🇹🇭" },
  { code: "84",  name: "Vietnam",        flag: "🇻🇳" },
  { code: "60",  name: "Malaysia",       flag: "��" },
  { code: "65",  name: "Singapore",      flag: "��" },
  { code: "92",  name: "Pakistan",       flag: "��" },
  { code: "880", name: "Bangladesh",     flag: "🇧🇩" },
  { code: "971", name: "UAE",            flag: "��" },
  { code: "966", name: "Saudi Arabia",   flag: "🇸🇦" },
  { code: "90",  name: "Turkey",         flag: "🇹🇷" },
  { code: "972", name: "Israel",         flag: "��" },
  { code: "20",  name: "Egypt",          flag: "🇪🇬" },
  { code: "234", name: "Nigeria",        flag: "🇳🇬" },
  { code: "27",  name: "South Africa",   flag: "🇿🇦" },
  { code: "254", name: "Kenya",          flag: "🇰🇪" },
  { code: "233", name: "Ghana",          flag: "🇬🇭" },
  { code: "212", name: "Morocco",        flag: "🇲🇦" },
];

export interface SmspvaNumberResult {
  id: number;
  number: string;
  countryCode: string;
  fullNumber: string;
}

export interface SmspvaSmsResult {
  pending: false;
  sms: string;
  text: string;
}

export type SmspvaSmsResponse =
  | { ok: true; data: SmspvaSmsResult }
  | { ok: true; pending: true }
  | { ok: false; error: string };

async function smspvaGet(params: Record<string, string>): Promise<any> {
  const apiKey = getSmspvaApiKey();
  if (!apiKey) throw new Error("SMSPVA API key not configured");

  const query = new URLSearchParams({ ...params, apikey: apiKey }).toString();
  const url = `${SMSPVA_BASE}?${query}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`SMSPVA HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function getSmspvaNumber(
  service: string,
  country: string
): Promise<{ ok: true; data: SmspvaNumberResult } | { ok: false; error: string }> {
  try {
    const json = await smspvaGet({ metod: "get_number", service, country });
    if (String(json?.response) !== "1") {
      return { ok: false, error: json?.msg || `SMSPVA get_number failed (response=${json?.response})` };
    }
    const id = parseInt(json.id, 10);
    const number = String(json.number);
    const countryCode = String(json.CountryCode || "");
    return {
      ok: true,
      data: { id, number, countryCode, fullNumber: `${countryCode}${number}` },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function getSmspvaSMS(
  id: number,
  service: string
): Promise<SmspvaSmsResponse> {
  try {
    const json = await smspvaGet({ metod: "get_sms", id: String(id), service });
    const response = String(json?.response);
    if (response === "2") return { ok: true, pending: true };
    if (response === "1") {
      return {
        ok: true,
        data: {
          pending: false,
          sms: String(json.sms || ""),
          text: String(json.text || json.sms || ""),
        },
      };
    }
    return { ok: false, error: json?.msg || `SMSPVA get_sms failed (response=${response})` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function banSmspvaNumber(
  id: number,
  service: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const json = await smspvaGet({ metod: "ban", id: String(id), service });
    if (String(json?.response) === "1") return { ok: true };
    return { ok: false, error: json?.msg || `SMSPVA ban failed (response=${json?.response})` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function getSmspvaCountAvailable(
  service: string,
  country: string
): Promise<SmspvaAvailability> {
  try {
    const json = await smspvaGet({ metod: "get_count_new", service, country });
    if (String(json?.response) !== "1") {
      return { count: 0 };
    }
    return {
      count: parseInt(String(json.count ?? "0"), 10) || 0,
      costUsd: json.cost ? parseFloat(String(json.cost)) : undefined,
    };
  } catch {
    return { count: 0 };
  }
}

export function calculateSmspvaPrice(
  baseUsdPrice: number,
  usdToGhsRate: number,
  markupPercent: number
): number {
  return parseFloat((baseUsdPrice * usdToGhsRate * (1 + markupPercent / 100)).toFixed(2));
}
