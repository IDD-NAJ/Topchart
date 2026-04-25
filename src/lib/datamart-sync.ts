import { sql, sqlUnsafe } from "@/lib/db";
import { getDataPackages, getNetworkDisplayName, type DatamartNetworkCode } from "@/lib/datamart";

const NETWORK_CODES: DatamartNetworkCode[] = ["YELLO", "TELECEL", "AT_PREMIUM"];

const DATAMART_TO_DB_NETWORK: Record<string, string> = {
  YELLO: "MTN",
  TELECEL: "Telecel",
  AT_PREMIUM: "AirtelTigo",
  AT: "AirtelTigo",
  at: "AirtelTigo",
};

const NETWORK_NAMES_TO_UUID: Record<string, string> = {
  MTN: "a1b2c3d4-0001-0000-0000-000000000001",
  VODAFONE: "a1b2c3d4-0002-0000-0000-000000000002",
  TELECEL: "a1b2c3d4-0002-0000-0000-000000000002",
  AIRTELTIGO: "a1b2c3d4-0003-0000-0000-000000000003",
};

async function getNetworkUuidMap(): Promise<Record<string, string>> {
  try {
    const rows = await sql`SELECT id, name FROM networks`;
    const map: Record<string, string> = {};
    for (const row of rows as any[]) {
      const name = String(row.name || "").toUpperCase();
      map[name] = String(row.id);
    }
    return map;
  } catch {
    return NETWORK_NAMES_TO_UUID;
  }
}

function normalizeCategoryKey(value: unknown): string {
  return String(value || "").trim().toUpperCase();
}

export async function getLastSuccessfulSync(): Promise<{ syncedAt: string | null; hoursAgo: number | null; syncedCount: number }> {
  try {
    const [row] = await sql`
      SELECT config_value FROM system_config WHERE config_key = 'datamart_last_sync'
    ` as Array<{ config_value: string }>;
    if (!row) return { syncedAt: null, hoursAgo: null, syncedCount: 0 };
    const parsed = JSON.parse(row.config_value || "{}");
    if (!parsed.success || !parsed.syncedAt) return { syncedAt: null, hoursAgo: null, syncedCount: 0 };
    const hoursAgo = (Date.now() - new Date(parsed.syncedAt).getTime()) / (1000 * 60 * 60);
    return { syncedAt: parsed.syncedAt, hoursAgo: Math.round(hoursAgo * 10) / 10, syncedCount: parsed.syncedCount || 0 };
  } catch {
    return { syncedAt: null, hoursAgo: null, syncedCount: 0 };
  }
}

export interface SyncResult {
  syncedCount: number;
  errorCount: number;
  errors: string[];
  priceChanges: Array<{ bundleId: string; oldPrice: number; newPrice: number }>;
  deactivatedCount: number;
  syncedAt: string;
  lastSuccessfulSyncAt: string | null;
}

export interface SyncOptions {
  force?: boolean;
  networks?: DatamartNetworkCode[];
}

type ColumnMap = {
  bundleId: string;
  bundleNetworkId: string;
  bundleCategoryId: string;
  bundleName: string;
  bundleSizeMb: string;
  bundleValidityHours: string;
  bundlePrice: string;
  bundlePriceOverride: string;
  bundleMarkupPercent: string;
  bundleIsPopular: string;
  bundleIsActive: string;
  bundleIsFeatured: string;
  bundleDatamartPlanId: string;
  bundleDatamartPlanType: string;
  bundleSyncedAt: string;
  bundleUpdatedAt: string;
  categoryId: string;
  categoryNetworkId: string;
  categoryName: string;
  categoryIsActive: string;
  categorySortOrder: string;
  categoryUpdatedAt: string;
  bundleIdIsUuid: boolean;
  categoryIdIsUuid: boolean;
  bundleCategoryIdIsUuid: boolean;
};

function isUuidValue(value: unknown): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function pickCol(preferred: string[], available: string[]): string {
  for (const c of preferred) {
    const match = available.find(a => a.toLowerCase() === c.toLowerCase());
    if (match) return match;
  }
  return preferred[0];
}

async function detectColumnNames(): Promise<ColumnMap> {
  const bundleCols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'data_bundles'
    ORDER BY ordinal_position
  `;

  const categoryCols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'data_bundle_categories'
    ORDER BY ordinal_position
  `;

  const bundleColNames = (bundleCols as any[]).map(r => r.column_name);
  const categoryColNames = (categoryCols as any[]).map(r => r.column_name);

  const bundleColType: Record<string, string> = {};
  for (const r of bundleCols as any[]) {
    bundleColType[r.column_name.toLowerCase()] = r.data_type;
  }
  const categoryColType: Record<string, string> = {};
  for (const r of categoryCols as any[]) {
    categoryColType[r.column_name.toLowerCase()] = r.data_type;
  }

  const bundleIdCol = pickCol(["id"], bundleColNames);
  const bundleNetworkIdCol = pickCol(["network_id", "networkId"], bundleColNames);
  const bundleCategoryIdCol = pickCol(["category_id", "categoryId"], bundleColNames);
  const bundleNameCol = pickCol(["name"], bundleColNames);
  const bundleSizeMbCol = pickCol(["size_mb", "sizeMb"], bundleColNames);
  const bundleValidityHoursCol = pickCol(["validity_hours", "validityHours"], bundleColNames);
  const bundlePriceCol = pickCol(["price"], bundleColNames);
  const bundlePriceOverrideCol = pickCol(["price_override", "priceOverride"], bundleColNames);
  const bundleMarkupPercentCol = pickCol(["markup_percent", "markupPercent"], bundleColNames);
  const bundleIsPopularCol = pickCol(["is_popular", "isPopular"], bundleColNames);
  const bundleIsActiveCol = pickCol(["is_active", "isActive"], bundleColNames);
  const bundleIsFeaturedCol = pickCol(["is_featured", "isFeatured"], bundleColNames);
  const bundleDatamartPlanIdCol = pickCol(["datamart_plan_id", "datamartPlanId"], bundleColNames);
  const bundleDatamartPlanTypeCol = pickCol(["datamart_plan_type", "datamartPlanType"], bundleColNames);
  const bundleSyncedAtCol = pickCol(["synced_at", "syncedAt"], bundleColNames);
  const bundleUpdatedAtCol = pickCol(["updated_at", "updatedAt"], bundleColNames);

  const categoryIdCol = pickCol(["id"], categoryColNames);
  const categoryNetworkIdCol = pickCol(["network_id", "networkId", "network"], categoryColNames);
  const categoryNameCol = pickCol(["name"], categoryColNames);
  const categoryIsActiveCol = pickCol(["is_active", "isActive"], categoryColNames);
  const categorySortOrderCol = pickCol(["sort_order", "sortOrder"], categoryColNames);
  const categoryUpdatedAtCol = pickCol(["updated_at", "updatedAt"], categoryColNames);

  const bundleIdIsUuid = (bundleColType[bundleIdCol.toLowerCase()] || "").toLowerCase() === "uuid";
  const categoryIdIsUuid = (categoryColType[categoryIdCol.toLowerCase()] || "").toLowerCase() === "uuid";
  const bundleCategoryIdIsUuid = (bundleColType[bundleCategoryIdCol.toLowerCase()] || "").toLowerCase() === "uuid";

  console.log("[DataMart Sync] Detected columns:", {
    bundles: { id: bundleIdCol, networkId: bundleNetworkIdCol, categoryId: bundleCategoryIdCol, name: bundleNameCol, sizeMb: bundleSizeMbCol, validityHours: bundleValidityHoursCol, price: bundlePriceCol, datamartPlanId: bundleDatamartPlanIdCol, datamartPlanType: bundleDatamartPlanTypeCol, syncedAt: bundleSyncedAtCol, updatedAt: bundleUpdatedAtCol },
    categories: { id: categoryIdCol, networkId: categoryNetworkIdCol, name: categoryNameCol, isActive: categoryIsActiveCol, sortOrder: categorySortOrderCol, updatedAt: categoryUpdatedAtCol },
    types: { bundleIdIsUuid, categoryIdIsUuid, bundleCategoryIdIsUuid },
  });

  return {
    bundleId: bundleIdCol,
    bundleNetworkId: bundleNetworkIdCol,
    bundleCategoryId: bundleCategoryIdCol,
    bundleName: bundleNameCol,
    bundleSizeMb: bundleSizeMbCol,
    bundleValidityHours: bundleValidityHoursCol,
    bundlePrice: bundlePriceCol,
    bundlePriceOverride: bundlePriceOverrideCol,
    bundleMarkupPercent: bundleMarkupPercentCol,
    bundleIsPopular: bundleIsPopularCol,
    bundleIsActive: bundleIsActiveCol,
    bundleIsFeatured: bundleIsFeaturedCol,
    bundleDatamartPlanId: bundleDatamartPlanIdCol,
    bundleDatamartPlanType: bundleDatamartPlanTypeCol,
    bundleSyncedAt: bundleSyncedAtCol,
    bundleUpdatedAt: bundleUpdatedAtCol,
    categoryId: categoryIdCol,
    categoryNetworkId: categoryNetworkIdCol,
    categoryName: categoryNameCol,
    categoryIsActive: categoryIsActiveCol,
    categorySortOrder: categorySortOrderCol,
    categoryUpdatedAt: categoryUpdatedAtCol,
    bundleIdIsUuid,
    categoryIdIsUuid,
    bundleCategoryIdIsUuid,
  };
}

function col(name: string): string {
  return `"${name}"`;
}

export async function syncDatamartPlans(options: SyncOptions = {}): Promise<SyncResult> {
  const { force = false, networks } = options;
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const targetNetworkCodes = networks && networks.length > 0 ? networks : NETWORK_CODES;

  console.log("[DataMart Sync] Starting", { requestId, force, networks: targetNetworkCodes });

  const c = await detectColumnNames();
  const networkUuidMap = await getNetworkUuidMap();

  console.log("[DataMart Sync] Network UUID map:", networkUuidMap);

  let syncedCount = 0;
  let errorCount = 0;
  let deactivatedCount = 0;
  const errors: string[] = [];
  const priceChanges: SyncResult["priceChanges"] = [];
  const syncedPlanKeys: Set<string> = new Set();

  let lastSuccessfulSyncAt: string | null = null;
  try {
    const [syncStatus] = await sql`
      SELECT config_value FROM system_config WHERE config_key = 'datamart_last_sync'
    `;
    if (syncStatus) {
      const parsed = JSON.parse((syncStatus as any).config_value || "{}");
      if (parsed.syncedCount > 0) lastSuccessfulSyncAt = parsed.syncedAt;
    }
  } catch {}

  let categoryRows: any[];
  try {
    categoryRows = await sqlUnsafe(
      `SELECT ${col(c.categoryId)} as id, ${col(c.categoryName)} as name FROM data_bundle_categories`
    );
  } catch (catErr: any) {
    console.warn("[DataMart Sync] Category fetch failed:", catErr?.message || catErr);
    categoryRows = [];
  }
  const categoryMap: Record<string, string> = {};
  for (const row of categoryRows) {
    const id = String(row.id || "");
    const nameKey = normalizeCategoryKey(row.name);
    if (nameKey) categoryMap[nameKey] = id;
  }

  for (const code of targetNetworkCodes) {
    try {
      const plansResult = await getDataPackages(code);
      if (!plansResult.success || !plansResult.data) {
        errorCount++;
        errors.push(`Failed to fetch packages for ${code}: ${plansResult.error}`);
        continue;
      }

      const packages_ = plansResult.data;
      if (packages_.length === 0) {
        console.warn(`[DataMart Sync] API returned 0 packages for ${code} — skipping to protect existing DB data`);
        errorCount++;
        errors.push(`API returned empty packages for ${code} — DB data preserved`);
        continue;
      }
      const displayName = getNetworkDisplayName(code);
      const dbNetworkCode = DATAMART_TO_DB_NETWORK[code];
      const networkUuid = networkUuidMap[dbNetworkCode.toUpperCase()];
      if (!networkUuid) {
        errorCount++;
        errors.push(`No network UUID found for ${dbNetworkCode}`);
        continue;
      }
      const categoryName = `${dbNetworkCode} Data Bundles`;
      const normalizedNameKey = normalizeCategoryKey(categoryName);

      let categoryId = categoryMap[normalizedNameKey];
      if (!categoryId) {
        try {
          if (c.categoryIdIsUuid) {
            const catResult = await sqlUnsafe(
              `INSERT INTO data_bundle_categories (${col(c.categoryNetworkId)}, ${col(c.categoryName)}, ${col(c.categorySortOrder)}, ${col(c.categoryIsActive)}, ${col(c.categoryUpdatedAt)}) VALUES ($1, $2, 0, true, NOW()) ON CONFLICT (${col(c.categoryName)}) DO UPDATE SET ${col(c.categoryNetworkId)} = EXCLUDED.${col(c.categoryNetworkId)}, ${col(c.categoryUpdatedAt)} = NOW() RETURNING ${col(c.categoryId)} as id`,
              [networkUuid, categoryName]
            ) as Array<{id: string}>;
            categoryId = catResult[0]?.id;
          } else {
            const catId = `cat_${dbNetworkCode.toLowerCase()}`;
            const catResult = await sqlUnsafe(
              `INSERT INTO data_bundle_categories (${col(c.categoryId)}, ${col(c.categoryNetworkId)}, ${col(c.categoryName)}, ${col(c.categorySortOrder)}, ${col(c.categoryIsActive)}, ${col(c.categoryUpdatedAt)}) VALUES ($1, $2, $3, 0, true, NOW()) ON CONFLICT (${col(c.categoryId)}) DO UPDATE SET ${col(c.categoryName)} = EXCLUDED.${col(c.categoryName)}, ${col(c.categoryUpdatedAt)} = NOW() RETURNING ${col(c.categoryId)} as id`,
              [catId, networkUuid, categoryName]
            ) as Array<{id: string}>;
            categoryId = catResult[0]?.id;
          }
        } catch (catErr: any) {
          console.warn("[DataMart Sync] Category insert failed:", catErr?.message || catErr);
          try {
            const [existingCategory] = await sqlUnsafe(
              `SELECT ${col(c.categoryId)} as id FROM data_bundle_categories WHERE UPPER(COALESCE(${col(c.categoryName)}, '')) = $1 LIMIT 1`,
              [normalizedNameKey]
            ) as Array<{id: string}>;
            categoryId = existingCategory?.id;
          } catch (lookupErr: any) {
            console.warn("[DataMart Sync] Category lookup failed:", lookupErr?.message || lookupErr);
          }
        }
        if (categoryId) {
          categoryMap[normalizedNameKey] = categoryId;
        }
      }

      for (const pkg of packages_) {
        try {
          const mb = parseInt(pkg.mb, 10);
          const providerPrice = parseFloat(pkg.price);
          if (!Number.isFinite(mb) || mb <= 0 || !Number.isFinite(providerPrice) || providerPrice <= 0) {
            errorCount++;
            errors.push(`Invalid package payload for ${code}_${pkg.capacity}GB`);
            continue;
          }
          const planName = `${pkg.capacity}GB ${displayName}`;
          const bundleId = `dm_${code}_${pkg.capacity}gb`;
          const validityHours = 90 * 24;
          const isActive = Boolean(pkg.inStock);
          const datamartPlanId = String(pkg.capacity);
          const datamartPlanType = "capacity";
          const categoryIdForBundle =
            c.bundleCategoryIdIsUuid && !isUuidValue(categoryId) ? null : categoryId;

          if (!categoryId) {
            errorCount++;
            errors.push(`Missing category for network ${dbNetworkCode}`);
            continue;
          }

          const [existingPlan] = await sqlUnsafe(
            `SELECT ${col(c.bundleId)} as id, ${col(c.bundlePrice)} as price FROM data_bundles WHERE ${col(c.bundleNetworkId)} = $1 AND ${col(c.bundleDatamartPlanId)} = $2 AND (${col(c.bundleDatamartPlanType)} = $3 OR ${col(c.bundleDatamartPlanType)} IS NULL OR ${col(c.bundleDatamartPlanType)} = '') LIMIT 1`,
            [networkUuid, datamartPlanId, datamartPlanType]
          ) as Array<{id: string; price: number}>;

          if (force && existingPlan?.id) {
            await sqlUnsafe(`DELETE FROM data_bundles WHERE ${col(c.bundleId)} = $1`, [existingPlan.id]);
          }

          if (!force && existingPlan) {
            if (Number(existingPlan.price) !== providerPrice) {
              priceChanges.push({
                bundleId: String(existingPlan.id || bundleId),
                oldPrice: Number(existingPlan.price),
                newPrice: providerPrice,
              });
            }
          }

          if (!force && existingPlan?.id) {
            await sqlUnsafe(
              `UPDATE data_bundles SET ${col(c.bundleNetworkId)} = $1, ${col(c.bundleCategoryId)} = $2, ${col(c.bundleName)} = $3, ${col(c.bundleSizeMb)} = $4, ${col(c.bundleValidityHours)} = $5, ${col(c.bundlePrice)} = $6, ${col(c.bundleIsPopular)} = false, ${col(c.bundleIsActive)} = $7, ${col(c.bundleDatamartPlanId)} = $8, ${col(c.bundleDatamartPlanType)} = $9, ${col(c.bundleUpdatedAt)} = NOW() WHERE ${col(c.bundleId)} = $10`,
              [networkUuid, categoryIdForBundle, planName, mb, validityHours, providerPrice, isActive, datamartPlanId, datamartPlanType, existingPlan.id]
            );
          } else if (c.bundleIdIsUuid) {
            await sqlUnsafe(
              `INSERT INTO data_bundles (${col(c.bundleNetworkId)}, ${col(c.bundleCategoryId)}, ${col(c.bundleName)}, ${col(c.bundleSizeMb)}, ${col(c.bundleValidityHours)}, ${col(c.bundlePrice)}, ${col(c.bundleIsPopular)}, ${col(c.bundleIsActive)}, ${col(c.bundleDatamartPlanId)}, ${col(c.bundleDatamartPlanType)}, ${col(c.bundleUpdatedAt)}) VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8, $9, NOW())`,
              [networkUuid, categoryIdForBundle, planName, mb, validityHours, providerPrice, isActive, datamartPlanId, datamartPlanType]
            );
          } else {
            await sqlUnsafe(
              `INSERT INTO data_bundles (${col(c.bundleId)}, ${col(c.bundleNetworkId)}, ${col(c.bundleCategoryId)}, ${col(c.bundleName)}, ${col(c.bundleSizeMb)}, ${col(c.bundleValidityHours)}, ${col(c.bundlePrice)}, ${col(c.bundleIsPopular)}, ${col(c.bundleIsActive)}, ${col(c.bundleDatamartPlanId)}, ${col(c.bundleDatamartPlanType)}, ${col(c.bundleUpdatedAt)}) VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, $9, $10, NOW()) ON CONFLICT (${col(c.bundleId)}) DO UPDATE SET ${col(c.bundleNetworkId)} = EXCLUDED.${col(c.bundleNetworkId)}, ${col(c.bundleCategoryId)} = EXCLUDED.${col(c.bundleCategoryId)}, ${col(c.bundleName)} = EXCLUDED.${col(c.bundleName)}, ${col(c.bundleSizeMb)} = EXCLUDED.${col(c.bundleSizeMb)}, ${col(c.bundleValidityHours)} = EXCLUDED.${col(c.bundleValidityHours)}, ${col(c.bundlePrice)} = EXCLUDED.${col(c.bundlePrice)}, ${col(c.bundleIsPopular)} = EXCLUDED.${col(c.bundleIsPopular)}, ${col(c.bundleIsActive)} = EXCLUDED.${col(c.bundleIsActive)}, ${col(c.bundleDatamartPlanId)} = EXCLUDED.${col(c.bundleDatamartPlanId)}, ${col(c.bundleDatamartPlanType)} = EXCLUDED.${col(c.bundleDatamartPlanType)}, ${col(c.bundleUpdatedAt)} = NOW()`,
              [bundleId, networkUuid, categoryIdForBundle, planName, mb, validityHours, providerPrice, isActive, datamartPlanId, datamartPlanType]
            );
          }

          syncedCount++;
          syncedPlanKeys.add(`${networkUuid}:${datamartPlanId}:${datamartPlanType}`);
        } catch (planError) {
          errorCount++;
          errors.push(`Failed to sync ${code}_${pkg.capacity}GB: ${planError instanceof Error ? planError.message : String(planError)}`);
        }
      }
    } catch (networkError) {
      errorCount++;
      errors.push(`Failed to process ${code}: ${networkError instanceof Error ? networkError.message : String(networkError)}`);
    }
  }

  if (syncedCount > 0) {
    try {
      const activePlanKeys = await sqlUnsafe(
        `SELECT ${col(c.bundleId)} as id, ${col(c.bundleNetworkId)} as nid, ${col(c.bundleDatamartPlanId)} as pid, ${col(c.bundleDatamartPlanType)} as ptype FROM data_bundles WHERE COALESCE(${col(c.bundleIsActive)}, true) = true`
      ) as Array<{id: string; nid: string; pid: string; ptype: string}>;
      for (const plan of activePlanKeys) {
        const key = `${plan.nid}:${plan.pid}:${plan.ptype || ""}`;
        if (!syncedPlanKeys.has(key)) {
          try {
            await sqlUnsafe(
              `UPDATE data_bundles SET ${col(c.bundleIsActive)} = false, ${col(c.bundleUpdatedAt)} = NOW() WHERE ${col(c.bundleId)} = $1`,
              [plan.id]
            );
            deactivatedCount++;
          } catch {}
        }
      }
      if (deactivatedCount > 0) {
        console.log(`[DataMart Sync] Deactivated ${deactivatedCount} plans no longer in API`);
      }
    } catch (deactErr: any) {
      console.warn("[DataMart Sync] Could not deactivate stale plans:", deactErr?.message || deactErr);
    }
  }

  const syncedAt = new Date().toISOString();
  const duration = Date.now() - startTime;
  const wasSuccess = syncedCount > 0;

  try {
    await sql`
      INSERT INTO system_config (config_key, config_value, updated_at)
      VALUES ('datamart_last_sync', ${JSON.stringify({ syncedCount, errorCount, syncedAt, duration, priceChanges: priceChanges.length, deactivatedCount, success: wasSuccess })}, NOW())
      ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = NOW()
    `;
  } catch {
    console.warn("[DataMart Sync] Failed to update sync status in system_config");
  }

  if (wasSuccess) {
    lastSuccessfulSyncAt = syncedAt;
  }

  console.log("[DataMart Sync] Completed", { requestId, syncedCount, errorCount, priceChanges: priceChanges.length, duration });

  return {
    syncedCount,
    errorCount,
    errors: errors.slice(0, 20),
    priceChanges,
    deactivatedCount,
    syncedAt,
    lastSuccessfulSyncAt,
  };
}
