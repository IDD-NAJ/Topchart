import { sql } from "@/lib/db";
import { getDataPackages, getNetworkDisplayName, type DatamartNetworkCode } from "@/lib/datamart";

const NETWORK_CODES: DatamartNetworkCode[] = ["YELLO", "TELECEL", "AT_PREMIUM"];

const DATAMART_TO_DB_NETWORK: Record<string, string> = {
  YELLO: "MTN",
  TELECEL: "VODAFONE",
  AT_PREMIUM: "AIRTELTIGO",
  AT: "AIRTELTIGO",
  at: "AIRTELTIGO",
};

function normalizeCategoryKey(value: unknown): string {
  return String(value || "").trim().toUpperCase();
}

export interface SyncResult {
  syncedCount: number;
  errorCount: number;
  errors: string[];
  priceChanges: Array<{ bundleId: string; oldPrice: number; newPrice: number }>;
  syncedAt: string;
}

export interface SyncOptions {
  force?: boolean;
  networks?: DatamartNetworkCode[];
}

type SyncSchema = {
  bundleIdIsUuid: boolean;
  categoryIdIsUuid: boolean;
  bundleCategoryIdIsUuid: boolean;
};

function isUuidType(value: unknown): boolean {
  return String(value || "").toLowerCase() === "uuid";
}

function isUuidValue(value: unknown): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

async function ensureColumns(): Promise<SyncSchema> {
  const [bundlesTable] = await sql`
    SELECT to_regclass('public.data_bundles') as table_name
  `;
  const [categoriesTable] = await sql`
    SELECT to_regclass('public.data_bundle_categories') as table_name
  `;

  if (!bundlesTable?.table_name || !categoriesTable?.table_name) {
    throw new Error("Required tables data_bundles and data_bundle_categories are missing. Run database migrations first.");
  }

  await sql`
    ALTER TABLE data_bundle_categories
    ADD COLUMN IF NOT EXISTS network VARCHAR(50),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  `;

  await sql`
    ALTER TABLE data_bundles
    ADD COLUMN IF NOT EXISTS category_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS network VARCHAR(50),
    ADD COLUMN IF NOT EXISTS size_mb INTEGER,
    ADD COLUMN IF NOT EXISTS validity_hours INTEGER DEFAULT 2160,
    ADD COLUMN IF NOT EXISTS datamart_plan_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS datamart_plan_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_data_bundles_network_plan_lookup
    ON data_bundles(network_id, datamart_plan_id, datamart_plan_type)
  `;

  const [bundleIdColumn] = await sql`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'data_bundles' AND column_name = 'id'
    LIMIT 1
  `;

  const [bundleCategoryIdColumn] = await sql`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'data_bundles' AND column_name = 'category_id'
    LIMIT 1
  `;

  const [categoryIdColumn] = await sql`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'data_bundle_categories' AND column_name = 'id'
    LIMIT 1
  `;

  return {
    bundleIdIsUuid: isUuidType(bundleIdColumn?.data_type),
    categoryIdIsUuid: isUuidType(categoryIdColumn?.data_type),
    bundleCategoryIdIsUuid: isUuidType(bundleCategoryIdColumn?.data_type),
  };
}

export async function syncDatamartPlans(options: SyncOptions = {}): Promise<SyncResult> {
  const { force = false, networks } = options;
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const targetNetworkCodes = networks && networks.length > 0 ? networks : NETWORK_CODES;

  console.log("[DataMart Sync] Starting", { requestId, force, networks: targetNetworkCodes });

  const schema = await ensureColumns();

  let syncedCount = 0;
  let errorCount = 0;
  const errors: string[] = [];
  const priceChanges: SyncResult["priceChanges"] = [];

  let categoryRows: any[];
  try {
    categoryRows = await sql`SELECT id, network, name FROM data_bundle_categories`;
  } catch {
    categoryRows = await sql`SELECT id, name FROM data_bundle_categories`;
  }
  const categoryMap: Record<string, string> = {};
  for (const row of categoryRows) {
    const id = String(row.id || "");
    const networkKey = normalizeCategoryKey(row.network);
    const nameKey = normalizeCategoryKey(row.name);
    if (networkKey) categoryMap[networkKey] = id;
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
      const displayName = getNetworkDisplayName(code);
      const dbNetworkCode = DATAMART_TO_DB_NETWORK[code];
      const categoryName = `${dbNetworkCode} Data Bundles`;
      const normalizedNetworkKey = normalizeCategoryKey(dbNetworkCode);
      const normalizedNameKey = normalizeCategoryKey(categoryName);

      let categoryId = categoryMap[normalizedNetworkKey] || categoryMap[normalizedNameKey];
      if (!categoryId) {
        try {
          if (schema.categoryIdIsUuid) {
            const catResult = await sql`
              INSERT INTO data_bundle_categories (network, name, updated_at)
              VALUES (${dbNetworkCode}, ${categoryName}, NOW())
              ON CONFLICT (name) DO UPDATE SET network = EXCLUDED.network, updated_at = NOW()
              RETURNING id
            `;
            categoryId = catResult[0]?.id;
          } else {
            const catId = `cat_${dbNetworkCode.toLowerCase()}`;
            const catResult = await sql`
              INSERT INTO data_bundle_categories (id, network, name, updated_at)
              VALUES (${catId}, ${dbNetworkCode}, ${categoryName}, NOW())
              ON CONFLICT (id) DO UPDATE SET network = EXCLUDED.network, name = EXCLUDED.name, updated_at = NOW()
              RETURNING id
            `;
            categoryId = catResult[0]?.id;
          }
        } catch {
          const [existingCategory] = await sql`
            SELECT id
            FROM data_bundle_categories
            WHERE UPPER(COALESCE(network, '')) = ${normalizedNetworkKey}
               OR UPPER(COALESCE(name, '')) = ${normalizedNameKey}
            LIMIT 1
          `;
          categoryId = existingCategory?.id;
        }
        if (categoryId) {
          categoryMap[normalizedNetworkKey] = categoryId;
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
            schema.bundleCategoryIdIsUuid && !isUuidValue(categoryId) ? null : categoryId;

          if (!categoryId) {
            errorCount++;
            errors.push(`Missing category for network ${dbNetworkCode}`);
            continue;
          }

          const [existingPlan] = await sql`
            SELECT id, price
            FROM data_bundles
            WHERE network_id = ${dbNetworkCode}
              AND datamart_plan_id = ${datamartPlanId}
              AND (
                datamart_plan_type = ${datamartPlanType}
                OR datamart_plan_type IS NULL
                OR datamart_plan_type = ''
              )
            LIMIT 1
          `;

          if (force) {
            if (existingPlan?.id) {
              await sql`DELETE FROM data_bundles WHERE id = ${existingPlan.id}`;
            }
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
            await sql`
              UPDATE data_bundles
              SET
                network_id = ${dbNetworkCode},
                network = ${dbNetworkCode},
                category_id = ${categoryIdForBundle},
                name = ${planName},
                size_mb = ${mb},
                validity_hours = ${validityHours},
                price = ${providerPrice},
                is_popular = false,
                is_active = ${isActive},
                datamart_plan_id = ${datamartPlanId},
                datamart_plan_type = ${datamartPlanType},
                synced_at = NOW(),
                updated_at = NOW()
              WHERE id = ${existingPlan.id}
            `;
          } else if (schema.bundleIdIsUuid) {
            await sql`
              INSERT INTO data_bundles (network_id, network, category_id, name, size_mb, validity_hours, price, is_popular, is_active, datamart_plan_id, datamart_plan_type, synced_at, updated_at)
              VALUES (${dbNetworkCode}, ${dbNetworkCode}, ${categoryIdForBundle}, ${planName}, ${mb}, ${validityHours}, ${providerPrice}, false, ${isActive}, ${datamartPlanId}, ${datamartPlanType}, NOW(), NOW())
            `;
          } else {
            await sql`
              INSERT INTO data_bundles (id, network_id, network, category_id, name, size_mb, validity_hours, price, is_popular, is_active, datamart_plan_id, datamart_plan_type, synced_at, updated_at)
              VALUES (${bundleId}, ${dbNetworkCode}, ${dbNetworkCode}, ${categoryIdForBundle}, ${planName}, ${mb}, ${validityHours}, ${providerPrice}, false, ${isActive}, ${datamartPlanId}, ${datamartPlanType}, NOW(), NOW())
              ON CONFLICT (id) DO UPDATE SET
                network_id = EXCLUDED.network_id,
                network = EXCLUDED.network,
                category_id = EXCLUDED.category_id,
                name = EXCLUDED.name,
                size_mb = EXCLUDED.size_mb,
                validity_hours = EXCLUDED.validity_hours,
                price = EXCLUDED.price,
                is_popular = EXCLUDED.is_popular,
                is_active = EXCLUDED.is_active,
                datamart_plan_id = EXCLUDED.datamart_plan_id,
                datamart_plan_type = EXCLUDED.datamart_plan_type,
                synced_at = NOW(),
                updated_at = NOW()
            `;
          }

          syncedCount++;
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

  const syncedAt = new Date().toISOString();
  const duration = Date.now() - startTime;

  try {
    await sql`
      INSERT INTO system_config (config_key, config_value, updated_at)
      VALUES ('datamart_last_sync', ${JSON.stringify({ syncedCount, errorCount, syncedAt, duration, priceChanges: priceChanges.length })}, NOW())
      ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = NOW()
    `;
  } catch {
    console.warn("[DataMart Sync] Failed to update sync status in system_config");
  }

  console.log("[DataMart Sync] Completed", { requestId, syncedCount, errorCount, priceChanges: priceChanges.length, duration });

  return {
    syncedCount,
    errorCount,
    errors: errors.slice(0, 20),
    priceChanges,
    syncedAt,
  };
}
