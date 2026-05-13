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

export const SMSPVA_SERVICES: SmspvaService[] = [
  { code: "opt6",  name: "WhatsApp",   category: "social_media",            baseUsdPrice: 0.15 },
  { code: "opt4",  name: "Telegram",   category: "social_media",            baseUsdPrice: 0.10 },
  { code: "opt11", name: "Facebook",   category: "social_media",            baseUsdPrice: 0.12 },
  { code: "opt3",  name: "Twitter/X",  category: "social_media",            baseUsdPrice: 0.10 },
  { code: "ma",    name: "Instagram",  category: "social_media",            baseUsdPrice: 0.12 },
  { code: "go",    name: "Google",     category: "professional_tools",      baseUsdPrice: 0.18 },
  { code: "ms",    name: "Microsoft",  category: "professional_tools",      baseUsdPrice: 0.15 },
  { code: "ya",    name: "Yahoo",      category: "professional_tools",      baseUsdPrice: 0.10 },
  { code: "opt1",  name: "Viber",      category: "social_media",            baseUsdPrice: 0.10 },
  { code: "opt2",  name: "WeChat",     category: "social_media",            baseUsdPrice: 0.14 },
  { code: "am",    name: "Amazon",     category: "ecommerce_financial",     baseUsdPrice: 0.15 },
  { code: "ub",    name: "Uber",       category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "ti",    name: "TikTok",     category: "streaming_entertainment", baseUsdPrice: 0.12 },
  { code: "nf",    name: "Netflix",    category: "streaming_entertainment", baseUsdPrice: 0.15 },
  { code: "ot",    name: "Any Service","category": "professional_tools",     baseUsdPrice: 0.08 },
];

export const SMSPVA_COUNTRIES: SmspvaCountry[] = [
  { code: "0",  name: "United States", flag: "🇺🇸" },
  { code: "7",  name: "Russia",        flag: "🇷🇺" },
  { code: "44", name: "United Kingdom",flag: "🇬🇧" },
  { code: "91", name: "India",         flag: "🇮🇳" },
  { code: "55", name: "Brazil",        flag: "🇧🇷" },
  { code: "49", name: "Germany",       flag: "🇩🇪" },
  { code: "33", name: "France",        flag: "🇫🇷" },
  { code: "34", name: "Spain",         flag: "🇪🇸" },
  { code: "52", name: "Mexico",        flag: "🇲🇽" },
  { code: "62", name: "Indonesia",     flag: "🇮🇩" },
  { code: "63", name: "Philippines",   flag: "🇵🇭" },
  { code: "84", name: "Vietnam",       flag: "🇻🇳" },
  { code: "66", name: "Thailand",      flag: "🇹🇭" },
  { code: "380",name: "Ukraine",       flag: "🇺🇦" },
  { code: "998",name: "Uzbekistan",    flag: "🇺🇿" },
  { code: "7k", name: "Kazakhstan",    flag: "🇰🇿" },
  { code: "86", name: "China",         flag: "🇨🇳" },
  { code: "20", name: "Egypt",         flag: "🇪🇬" },
  { code: "234",name: "Nigeria",       flag: "🇳🇬" },
  { code: "254",name: "Kenya",         flag: "🇰🇪" },
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

export function calculateSmspvaPrice(
  baseUsdPrice: number,
  usdToGhsRate: number,
  markupPercent: number
): number {
  return parseFloat((baseUsdPrice * usdToGhsRate * (1 + markupPercent / 100)).toFixed(2));
}
