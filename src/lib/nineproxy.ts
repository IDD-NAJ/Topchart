import { getConfig } from "@/lib/config";

const API_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

export enum ProxyType {
  Residential = 1,
  Mobile = 2,
  Datacenter = 3,
}

export enum SessionType {
  Rotation = 1,
  Sticky = 2,
}

export interface ProxyConnectionConfig {
  id: number;
  user_id: number;
  server_id: number;
  proxy_type: number;
  country_code: string | null;
  city_code: string | null;
  state_code: string | null;
  isp_code: string | null;
  start_port: number;
  end_port: number;
  is_keep: number;
  is_random_ip: number;
  session_time: string;
  created_at: number;
  updated_at: number;
}

export interface CreateProxyConnectionResult {
  success: boolean;
  message: string;
  result: ProxyConnectionConfig;
}

export interface ListProxyConnectionsResult {
  success: boolean;
  message: string;
  result: {
    items: ProxyConnectionConfig[];
    total_items: number;
    total_pages: number;
  };
}

export interface DeleteProxyConnectionsResult {
  success: boolean;
  message: string;
  result: unknown;
}

export interface AccountInfo {
  id: number;
  email: string;
  username: string;
  email_verified: boolean;
  _2fa_enabled: boolean;
  wallet_balance: number;
}

export interface IPBalanceItem {
  plan_id: number;
  amount: number;
}

export interface TrafficBalanceItem {
  id: number;
  amount: number;
  active_at: number;
  expires_in: number;
  expires_at: number;
  status: number;
  plan_name: string;
  original_amount: string;
  receive_method: number;
  traffic_type: number;
  created_at: number;
  updated_at: number;
}

export interface BalanceData {
  ip_data: IPBalanceItem[];
  traffic_data: TrafficBalanceItem[];
}

export interface SubUser {
  id: number;
  user_name: string;
  status: number;
  use_key: number;
  usage_cap: number;
  data_used: number;
  ip_usage_cap: number;
  ip_used: number;
  note: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateSubUserResult {
  success: boolean;
  message: string;
  result: SubUser;
}

export interface ListSubUsersResult {
  success: boolean;
  message: string;
  result: {
    items: SubUser[];
    total_items: number;
    total_pages: number;
  };
}

interface NineProxyResponse<T> {
  success: boolean;
  message: string;
  result: T;
}

function getClientConfig() {
  const config = getConfig();
  if (!config.nineproxy) {
    throw new Error("9Proxy not configured. Set NINEPROXY_API_KEY in your environment.");
  }
  return config.nineproxy;
}

async function nineProxyFetch<T>(
  path: string,
  options: RequestInit & { skipRetry?: boolean } = {}
): Promise<NineProxyResponse<T>> {
  const { skipRetry, ...fetchOptions } = options;
  const config = getClientConfig();
  const url = `${config.baseUrl}${path}`;

  let lastError: Error | null = null;
  const maxAttempts = skipRetry ? 1 : MAX_RETRIES;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort("9Proxy API timeout"), API_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          ...fetchOptions.headers,
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "application/json",
          ...(fetchOptions.body ? { "Content-Type": "application/json" } : {}),
        },
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        throw new Error("9Proxy API authentication failed. Check your API key.");
      }

      if (response.status === 403) {
        const body = await response.text().catch(() => "");
        throw new Error(`9Proxy API permission denied: ${body.slice(0, 200)}. Check your API key permissions and account balance.`);
      }

      if (response.status >= 500 || response.status === 429) {
        if (skipRetry || attempt >= maxAttempts - 1) {
          const body = await response.text().catch(() => "");
          throw new Error(`9Proxy API error ${response.status}: ${body.slice(0, 200)}`);
        }
        const delay = RETRY_BASE_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`9Proxy API error ${response.status}: ${body.slice(0, 200)}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "9Proxy API returned unsuccessful response");
      }

      return data as NineProxyResponse<T>;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("9Proxy API request timed out", { cause: err });
      }

      const isRetryable =
        err instanceof Error &&
        (/fetch failed|network|ECONNREFUSED|ETIMEDOUT/i.test(err.message));

      if (isRetryable && !skipRetry && attempt < maxAttempts - 1) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        lastError = err;
        continue;
      }

      throw err;
    }
  }

  throw lastError || new Error("9Proxy API request failed after retries");
}

export async function createProxyConnection(params: {
  proxyType: ProxyType;
  countryCode?: string;
  cityCode?: string;
  stateCode?: string;
  ispCode?: string;
  quantity: number;
  sessionType?: SessionType;
  sessionTime?: number;
}): Promise<CreateProxyConnectionResult> {
  const body: Record<string, unknown> = {
    proxy_type: params.proxyType,
    quantity: params.quantity,
    session_type: params.sessionType ?? SessionType.Rotation,
  };

  if (params.countryCode) body.country_code = params.countryCode;
  if (params.cityCode) body.city_code = params.cityCode;
  if (params.stateCode) body.state_code = params.stateCode;
  if (params.ispCode) body.isp_code = params.ispCode;
  if (params.sessionTime) body.session_time = params.sessionTime;

  return nineProxyFetch<ProxyConnectionConfig>(
    "/client/v1/proxy-connection/create",
    {
      method: "POST",
      body: JSON.stringify(body),
      skipRetry: true,
    }
  );
}

export async function listProxyConnections(params?: {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "desc" | "asc";
}): Promise<ListProxyConnectionsResult> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.sort) searchParams.set("sort", params.sort);
  if (params?.order) searchParams.set("order", params.order);

  const qs = searchParams.toString();
  const path = `/client/v1/proxy-connection/get-list${qs ? `?${qs}` : ""}`;

  return nineProxyFetch<{
    items: ProxyConnectionConfig[];
    total_items: number;
    total_pages: number;
  }>(path);
}

export async function deleteProxyConnections(startPorts: number[]): Promise<DeleteProxyConnectionsResult> {
  return nineProxyFetch<unknown>("/client/v1/proxy-connection/delete", {
    method: "DELETE",
    body: JSON.stringify({ start_port: startPorts }),
    skipRetry: true,
  });
}

export async function getAccountInfo(): Promise<NineProxyResponse<AccountInfo>> {
  return nineProxyFetch<AccountInfo>("/client/v1/account/get-info");
}

export async function getBalanceData(): Promise<NineProxyResponse<BalanceData>> {
  return nineProxyFetch<BalanceData>("/client/v1/account/get-balance-data");
}

export async function createSubUser(params: {
  userName: string;
  password: string;
  status?: number;
  note?: string;
  trafficUsageCap?: number;
  ipUsageCap?: number;
}): Promise<CreateSubUserResult> {
  const body: Record<string, unknown> = {
    user_name: params.userName,
    password: params.password,
    status: params.status ?? 1,
  };

  if (params.note) body.note = params.note;
  if (params.trafficUsageCap) body.usage_cap = params.trafficUsageCap;
  if (params.ipUsageCap !== undefined) body.ip_usage_cap = params.ipUsageCap;

  return nineProxyFetch<SubUser>("/client/v1/user-pass/create", {
    method: "POST",
    body: JSON.stringify(body),
    skipRetry: true,
  });
}

export async function listSubUsers(params?: {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "desc" | "asc";
  keyword?: string;
}): Promise<ListSubUsersResult> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.sort) searchParams.set("sort", params.sort);
  if (params?.order) searchParams.set("order", params.order);
  if (params?.keyword) searchParams.set("keyword", params.keyword);

  const qs = searchParams.toString();
  const path = `/client/v1/user-pass/get-list${qs ? `?${qs}` : ""}`;

  return nineProxyFetch<{
    items: SubUser[];
    total_items: number;
    total_pages: number;
  }>(path);
}

export function isNineProxyConfigured(): boolean {
  try {
    const config = getConfig();
    return config.nineproxy !== null;
  } catch {
    return false;
  }
}

export const PROXY_TYPE_LABELS: Record<ProxyType, string> = {
  [ProxyType.Residential]: "Residential",
  [ProxyType.Mobile]: "Mobile",
  [ProxyType.Datacenter]: "Datacenter",
};

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  [SessionType.Rotation]: "Rotation",
  [SessionType.Sticky]: "Sticky",
};
