import { sql } from "@/lib/db";

export type ProviderName = "datamart" | "hubnet";
export type ProviderType = "data_bundle" | "airtime" | "bill_payment";

export interface ProviderConfig {
  id: string;
  providerName: ProviderName;
  providerType: ProviderType;
  isEnabled: boolean;
  isPrimary: boolean;
  isFallback: boolean;
  priority: number;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const providerCache = {
  data: null as ProviderConfig[] | null,
  expiresAt: 0 as number,
  TTL: 5 * 60 * 1000,
};

function isCacheValid(): boolean {
  return providerCache.data !== null && Date.now() < providerCache.expiresAt;
}

async function refreshCache(): Promise<void> {
  try {
    const rows = await sql`
      SELECT id, provider_name, provider_type, is_enabled, is_primary, is_fallback, priority, config, created_at, updated_at
      FROM data_providers
      WHERE provider_type = 'data_bundle'
      ORDER BY priority ASC
    ` as Array<{
      id: string;
      provider_name: string;
      provider_type: string;
      is_enabled: boolean;
      is_primary: boolean;
      is_fallback: boolean;
      priority: number;
      config: Record<string, unknown>;
      created_at: Date;
      updated_at: Date;
    }>;

    providerCache.data = rows.map(row => ({
      id: row.id,
      providerName: row.provider_name as ProviderName,
      providerType: row.provider_type as ProviderType,
      isEnabled: row.is_enabled,
      isPrimary: row.is_primary,
      isFallback: row.is_fallback,
      priority: row.priority,
      config: row.config || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    providerCache.expiresAt = Date.now() + providerCache.TTL;
  } catch (error) {
    console.error("[Provider Config] Failed to refresh cache:", error);
  }
}

export async function getAllProviders(): Promise<ProviderConfig[]> {
  if (!isCacheValid()) {
    await refreshCache();
  }
  return providerCache.data || [];
}

export async function getProviderByName(providerName: ProviderName): Promise<ProviderConfig | null> {
  const providers = await getAllProviders();
  return providers.find(p => p.providerName === providerName) || null;
}

export async function getPrimaryProvider(): Promise<ProviderConfig | null> {
  const providers = await getAllProviders();
  return providers.find(p => p.isEnabled && p.isPrimary) || null;
}

export async function getFallbackProvider(): Promise<ProviderConfig | null> {
  const providers = await getAllProviders();
  return providers.find(p => p.isEnabled && p.isFallback) || null;
}

export async function getEnabledProviders(): Promise<ProviderConfig[]> {
  const providers = await getAllProviders();
  return providers.filter(p => p.isEnabled);
}

export async function invalidateCache(): Promise<void> {
  providerCache.data = null;
  providerCache.expiresAt = 0;
}

export async function updateProviderConfig(
  providerName: ProviderName,
  updates: Partial<Omit<ProviderConfig, "id" | "providerName" | "providerType" | "createdAt" | "updatedAt">>
): Promise<ProviderConfig | null> {
  try {
    if (updates.isPrimary !== undefined && updates.isPrimary) {
      await sql`UPDATE data_providers SET is_primary = false WHERE provider_type = 'data_bundle'`;
    }
    if (updates.isFallback !== undefined && updates.isFallback) {
      await sql`UPDATE data_providers SET is_fallback = false WHERE provider_type = 'data_bundle'`;
    }

    const result = await sql`
      UPDATE data_providers
      SET 
        is_enabled = COALESCE(${updates.isEnabled}, is_enabled),
        is_primary = COALESCE(${updates.isPrimary}, is_primary),
        is_fallback = COALESCE(${updates.isFallback}, is_fallback),
        priority = COALESCE(${updates.priority}, priority),
        config = COALESCE(${updates.config !== undefined ? sql`${updates.config}::jsonb` : null}, config),
        updated_at = NOW()
      WHERE provider_name = ${providerName}
      RETURNING id, provider_name, provider_type, is_enabled, is_primary, is_fallback, priority, config, created_at, updated_at
    ` as Array<{
      id: string;
      provider_name: string;
      provider_type: string;
      is_enabled: boolean;
      is_primary: boolean;
      is_fallback: boolean;
      priority: number;
      config: Record<string, unknown>;
      created_at: Date;
      updated_at: Date;
    }>;

    await invalidateCache();

    if (result.length === 0) return null;

    return {
      id: result[0].id,
      providerName: result[0].provider_name as ProviderName,
      providerType: result[0].provider_type as ProviderType,
      isEnabled: result[0].is_enabled,
      isPrimary: result[0].is_primary,
      isFallback: result[0].is_fallback,
      priority: result[0].priority,
      config: result[0].config || {},
      createdAt: result[0].created_at,
      updatedAt: result[0].updated_at,
    };
  } catch (error) {
    console.error("[Provider Config] Failed to update provider:", error);
    return null;
  }
}

export async function addProvider(provider: Omit<ProviderConfig, "id" | "createdAt" | "updatedAt">): Promise<ProviderConfig | null> {
  try {
    const result = await sql`
      INSERT INTO data_providers (provider_name, provider_type, is_enabled, is_primary, is_fallback, priority, config)
      VALUES (${provider.providerName}, ${provider.providerType}, ${provider.isEnabled}, ${provider.isPrimary}, ${provider.isFallback}, ${provider.priority}, ${provider.config}::jsonb)
      RETURNING id, provider_name, provider_type, is_enabled, is_primary, is_fallback, priority, config, created_at, updated_at
    ` as Array<{
      id: string;
      provider_name: string;
      provider_type: string;
      is_enabled: boolean;
      is_primary: boolean;
      is_fallback: boolean;
      priority: number;
      config: Record<string, unknown>;
      created_at: Date;
      updated_at: Date;
    }>;

    if (result.length === 0) return null;

    await invalidateCache();
    return {
      id: result[0].id,
      providerName: result[0].provider_name as ProviderName,
      providerType: result[0].provider_type as ProviderType,
      isEnabled: result[0].is_enabled,
      isPrimary: result[0].is_primary,
      isFallback: result[0].is_fallback,
      priority: result[0].priority,
      config: result[0].config || {},
      createdAt: result[0].created_at,
      updatedAt: result[0].updated_at,
    };
  } catch (error) {
    console.error("[Provider Config] Failed to add provider:", error);
    return null;
  }
}

export async function deleteProvider(providerName: ProviderName): Promise<boolean> {
  try {
    await sql`DELETE FROM data_providers WHERE provider_name = ${providerName}`;
    await invalidateCache();
    return true;
  } catch (error) {
    console.error("[Provider Config] Failed to delete provider:", error);
    return false;
  }
}
