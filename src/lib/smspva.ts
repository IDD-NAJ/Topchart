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
  apiError?: boolean;
}

export const SMSPVA_SERVICES: SmspvaService[] = [
  // Social Media
  { code: "opt6",  name: "WhatsApp",      category: "social_media",            baseUsdPrice: 0.15 },
  { code: "opt4",  name: "Telegram",      category: "social_media",            baseUsdPrice: 0.10 },
  { code: "opt11", name: "Facebook",      category: "social_media",            baseUsdPrice: 0.12 },
  { code: "opt3",  name: "Twitter/X",     category: "social_media",            baseUsdPrice: 0.10 },
  { code: "ma",    name: "Instagram",     category: "social_media",            baseUsdPrice: 0.12 },
  { code: "opt1",  name: "Viber",         category: "social_media",            baseUsdPrice: 0.10 },
  { code: "opt2",  name: "WeChat",        category: "social_media",            baseUsdPrice: 0.14 },
  { code: "sc",    name: "Snapchat",      category: "social_media",            baseUsdPrice: 0.12 },
  { code: "dc",    name: "Discord",       category: "social_media",            baseUsdPrice: 0.10 },
  { code: "tn",    name: "Tinder",        category: "social_media",            baseUsdPrice: 0.12 },
  { code: "bm",    name: "Bumble",        category: "social_media",            baseUsdPrice: 0.12 },
  { code: "kk",    name: "KakaoTalk",     category: "social_media",            baseUsdPrice: 0.10 },
  { code: "ln",    name: "Line",          category: "social_media",            baseUsdPrice: 0.10 },
  { code: "pi",    name: "Pinterest",     category: "social_media",            baseUsdPrice: 0.10 },
  { code: "rd",    name: "Reddit",        category: "social_media",            baseUsdPrice: 0.10 },
  { code: "sk",    name: "Skype",         category: "social_media",            baseUsdPrice: 0.10 },
  // Streaming & Entertainment
  { code: "tw",    name: "Twitch",        category: "streaming_entertainment", baseUsdPrice: 0.10 },
  { code: "ti",    name: "TikTok",        category: "streaming_entertainment", baseUsdPrice: 0.12 },
  { code: "nf",    name: "Netflix",       category: "streaming_entertainment", baseUsdPrice: 0.15 },
  { code: "sp",    name: "Spotify",       category: "streaming_entertainment", baseUsdPrice: 0.12 },
  { code: "yt",    name: "YouTube",       category: "streaming_entertainment", baseUsdPrice: 0.12 },
  { code: "hb",    name: "Hulu",          category: "streaming_entertainment", baseUsdPrice: 0.14 },
  { code: "dm",    name: "Disney+",       category: "streaming_entertainment", baseUsdPrice: 0.14 },
  { code: "zu",    name: "Zoom",          category: "streaming_entertainment", baseUsdPrice: 0.12 },
  { code: "cl",    name: "Clubhouse",     category: "streaming_entertainment", baseUsdPrice: 0.10 },
  // Professional Tools
  { code: "go",    name: "Google",        category: "professional_tools",      baseUsdPrice: 0.18 },
  { code: "ms",    name: "Microsoft",     category: "professional_tools",      baseUsdPrice: 0.15 },
  { code: "ya",    name: "Yahoo",         category: "professional_tools",      baseUsdPrice: 0.10 },
  { code: "li",    name: "LinkedIn",      category: "professional_tools",      baseUsdPrice: 0.14 },
  { code: "gh",    name: "GitHub",        category: "professional_tools",      baseUsdPrice: 0.10 },
  { code: "dr",    name: "Dropbox",       category: "professional_tools",      baseUsdPrice: 0.10 },
  { code: "sl",    name: "Slack",         category: "professional_tools",      baseUsdPrice: 0.12 },
  { code: "wk",    name: "WeWork",        category: "professional_tools",      baseUsdPrice: 0.10 },
  { code: "ot",    name: "Any Service",   category: "professional_tools",      baseUsdPrice: 0.08 },
  // E-Commerce & Financial
  { code: "am",    name: "Amazon",        category: "ecommerce_financial",     baseUsdPrice: 0.15 },
  { code: "ub",    name: "Uber",          category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "pp",    name: "PayPal",        category: "ecommerce_financial",     baseUsdPrice: 0.14 },
  { code: "bi",    name: "Binance",       category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "ay",    name: "AliExpress",    category: "ecommerce_financial",     baseUsdPrice: 0.10 },
  { code: "eb",    name: "eBay",          category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "ab",    name: "Airbnb",        category: "ecommerce_financial",     baseUsdPrice: 0.14 },
  { code: "lf",    name: "Lyft",          category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "et",    name: "Etsy",          category: "ecommerce_financial",     baseUsdPrice: 0.10 },
  { code: "ck",    name: "Cash App",      category: "ecommerce_financial",     baseUsdPrice: 0.14 },
  { code: "ve",    name: "Venmo",         category: "ecommerce_financial",     baseUsdPrice: 0.14 },
  { code: "rv",    name: "Revolut",       category: "ecommerce_financial",     baseUsdPrice: 0.14 },
  { code: "wz",    name: "Wise",          category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "cb",    name: "Coinbase",      category: "ecommerce_financial",     baseUsdPrice: 0.14 },
  { code: "ok",    name: "OKX",           category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "by",    name: "Bybit",         category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "sh",    name: "Shopify",       category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "wd",    name: "Wolt/DoorDash", category: "ecommerce_financial",     baseUsdPrice: 0.12 },
];

export const SMSPVA_COUNTRIES: SmspvaCountry[] = [
  { code: "br",  name: "Brazil",         flag: "🇧🇷" },
  { code: "mx",  name: "Mexico",         flag: "🇲🇽" },
  { code: "ar",  name: "Argentina",      flag: "🇦🇷" },
  { code: "co",  name: "Colombia",       flag: "🇨🇴" },
  { code: "cl",  name: "Chile",          flag: "🇨🇱" },
  { code: "pe",  name: "Peru",           flag: "🇵🇪" },
  { code: "ve",  name: "Venezuela",      flag: "🇻🇪" },
  { code: "ru",  name: "Russia",         flag: "🇷🇺" },
  { code: "gb",  name: "United Kingdom", flag: "🇬🇧" },
  { code: "de",  name: "Germany",        flag: "🇩🇪" },
  { code: "fr",  name: "France",         flag: "🇫🇷" },
  { code: "es",  name: "Spain",          flag: "🇪🇸" },
  { code: "it",  name: "Italy",          flag: "🇮🇹" },
  { code: "nl",  name: "Netherlands",    flag: "��🇱" },
  { code: "se",  name: "Sweden",         flag: "🇸🇪" },
  { code: "no",  name: "Norway",         flag: "🇳🇴" },
  { code: "fi",  name: "Finland",        flag: "🇫🇮" },
  { code: "pl",  name: "Poland",         flag: "🇵🇱" },
  { code: "ua",  name: "Ukraine",        flag: "🇺🇦" },
  { code: "ro",  name: "Romania",        flag: "��🇴" },
  { code: "be",  name: "Belgium",        flag: "🇧🇪" },
  { code: "ch",  name: "Switzerland",    flag: "🇨🇭" },
  { code: "at",  name: "Austria",        flag: "🇦🇹" },
  { code: "dk",  name: "Denmark",        flag: "🇩🇰" },
  { code: "cz",  name: "Czech Republic", flag: "🇨🇿" },
  { code: "hu",  name: "Hungary",        flag: "🇭🇺" },
  { code: "gr",  name: "Greece",         flag: "��🇷" },
  { code: "pt",  name: "Portugal",       flag: "🇵🇹" },
  { code: "kz",  name: "Kazakhstan",     flag: "🇰🇿" },
  { code: "uz",  name: "Uzbekistan",     flag: "🇺🇿" },
  { code: "am",  name: "Armenia",        flag: "🇦🇲" },
  { code: "az",  name: "Azerbaijan",     flag: "🇦🇿" },
  { code: "ge",  name: "Georgia",        flag: "🇬🇪" },
  { code: "in",  name: "India",          flag: "🇮🇳" },
  { code: "cn",  name: "China",          flag: "🇨🇳" },
  { code: "jp",  name: "Japan",          flag: "🇯🇵" },
  { code: "kr",  name: "South Korea",    flag: "🇰🇷" },
  { code: "id",  name: "Indonesia",      flag: "🇮🇩" },
  { code: "ph",  name: "Philippines",    flag: "🇵🇭" },
  { code: "th",  name: "Thailand",       flag: "🇹🇭" },
  { code: "vn",  name: "Vietnam",        flag: "🇻🇳" },
  { code: "my",  name: "Malaysia",       flag: "🇲🇾" },
  { code: "sg",  name: "Singapore",      flag: "🇸🇬" },
  { code: "pk",  name: "Pakistan",       flag: "🇵🇰" },
  { code: "bd",  name: "Bangladesh",     flag: "🇧🇩" },
  { code: "ae",  name: "UAE",            flag: "🇦🇪" },
  { code: "sa",  name: "Saudi Arabia",   flag: "🇸🇦" },
  { code: "tr",  name: "Turkey",         flag: "🇹🇷" },
  { code: "il",  name: "Israel",         flag: "🇮🇱" },
  { code: "eg",  name: "Egypt",          flag: "🇪🇬" },
  { code: "ng",  name: "Nigeria",        flag: "🇳🇬" },
  { code: "za",  name: "South Africa",   flag: "🇿🇦" },
  { code: "ke",  name: "Kenya",          flag: "🇰🇪" },
  { code: "gh",  name: "Ghana",          flag: "🇬🇭" },
  { code: "ma",  name: "Morocco",        flag: "🇲🇦" },
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

/**
 * SMSPVA v2 API: Fetch operators/services for a country
 * https://docs.smspva.com/#tag/activation_v2_all_methods/paths/~1activation~1operators~1%7Bcountry%7D/get
 */
export interface SmspvaV2Operator {
  id: number;
  name: string;
  count: number;
}

export interface SmspvaV2OperatorsResponse {
  status: "success" | "error";
  operators?: SmspvaV2Operator[];
  error?: string;
}

async function smspvaV2Get(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const apiKey = getSmspvaApiKey();
  if (!apiKey) throw new Error("SMSPVA API key not configured");

  const baseUrl = "https://api.smspva.com/v2";
  const query = new URLSearchParams({ ...params, apikey: apiKey }).toString();
  const url = query ? `${baseUrl}${endpoint}?${query}` : `${baseUrl}${endpoint}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`SMSPVA v2 HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export async function getSmspvaV2Operators(
  country: string
): Promise<{ ok: true; data: SmspvaV2Operator[] } | { ok: false; error: string }> {
  try {
    const response = await smspvaV2Get(`/activation/operators/${country}`);
    if (response.status === "success" && Array.isArray(response.operators)) {
      return {
        ok: true,
        data: response.operators,
      };
    }
    return {
      ok: false,
      error: response.error || `Failed to fetch operators for ${country}`,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function getSmspvaV2ServicePrice(
  country: string,
  service: string | number
): Promise<{ ok: true; data: { service: string | number; price: number; count?: number } } | { ok: false; error: string }> {
  try {
    const response = await smspvaV2Get(`/activation/serviceprice/${country}/${service}`);
    if (response.status === "success" && response.price !== undefined) {
      return {
        ok: true,
        data: {
          service,
          price: parseFloat(String(response.price)),
          count: response.count ? parseInt(String(response.count), 10) : undefined,
        },
      };
    }
    return {
      ok: false,
      error: response.error || `Failed to fetch price for ${service} in ${country}`,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function getSmspvaV2Number(
  country: string,
  service: string | number
): Promise<
  { ok: true; data: { number_id: string; number: string; operator: string } } | 
  { ok: false; error: string; code?: string }
> {
  try {
    const response = await smspvaV2Get(`/activation/number/${country}/${service}`);
    if (response.status === "success" && response.number_id) {
      return {
        ok: true,
        data: {
          number_id: String(response.number_id),
          number: String(response.number),
          operator: String(response.operator || ""),
        },
      };
    }
    const errorCode = response.status === "error" ? "provider_error" : undefined;
    return {
      ok: false,
      error: response.error || `Failed to get number for ${service} in ${country}`,
      code: errorCode,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function getSmspvaV2SMS(
  orderid: string
): Promise<
  { ok: true; sms: string; text: string } | 
  { ok: true; pending: true } | 
  { ok: false; error: string }
> {
  try {
    const response = await smspvaV2Get(`/activation/sms/${orderid}`);
    if (response.status === "success") {
      if (response.sms) {
        return { ok: true, sms: String(response.sms), text: String(response.text || response.sms) };
      }
      if (String(response.status) === "pending" || !response.sms) {
        return { ok: true, pending: true };
      }
    }
    return {
      ok: false,
      error: response.error || `Failed to get SMS for order ${orderid}`,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function getSmspvaNumber(
  service: string,
  country: string
): Promise<{ ok: true; data: SmspvaNumberResult } | { ok: false; error: string; responseCode?: string }> {
  try {
    const json = await smspvaGet({ metod: "get_number", service, country });
    const responseCode = String(json?.response ?? "");
    if (responseCode !== "1") {
      const isApiError = responseCode === "error" || responseCode === "";
      const fallback = isApiError
        ? "Number request failed — please check provider configuration"
        : `Number request failed (code ${responseCode})`;
      return { ok: false, error: json?.msg || fallback, responseCode };
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
    const response = String(json?.response ?? "");
    if (response === "1") {
      return {
        count: parseInt(String(json.count ?? "0"), 10) || 0,
        costUsd: json.cost ? parseFloat(String(json.cost)) : undefined,
      };
    }
    const isProviderError = response === "error" || json?.error_msg;
    return { count: 0, apiError: isProviderError ? true : undefined };
  } catch {
    return { count: 0, apiError: true };
  }
}

export function calculateSmspvaPrice(
  baseUsdPrice: number,
  usdToGhsRate: number,
  markupPercent: number
): number {
  return parseFloat((baseUsdPrice * usdToGhsRate * (1 + markupPercent / 100)).toFixed(2));
}
