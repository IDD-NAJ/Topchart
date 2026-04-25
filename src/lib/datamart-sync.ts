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

async function ensureColumns() {
}

export async function syncDatamartPlans(options: SyncOptions = {}): Promise<SyncResult> {
  const { force = false, networks } = options;
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const targetNetworkCodes = networks && networks.length > 0 ? networks : NETWORK_CODES;

  console.log("[DataMart Sync] Starting", { requestId, force, networks: targetNetworkCodes });

  await ensureColumns();

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
        const catId = `cat_${dbNetworkCode.toLowerCase()}`;
        try {
          const catResult = await sql`
            INSERT INTO data_bundle_categories (id, network, name, updated_at)
            VALUES (${catId}, ${dbNetworkCode}, ${categoryName}, NOW())
            ON CONFLICT (id) DO UPDATE SET network = EXCLUDED.network, name = EXCLUDED.name, updated_at = NOW()
            RETURNING id
          `;
          categoryId = catResult[0]?.id;
        } catch {
          const catResult = await sql`
            INSERT INTO data_bundle_categories (id, name, updated_at)
            VALUES (${catId}, ${categoryName}, NOW())
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
            RETURNING id
          `;
          categoryId = catResult[0]?.id;
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

          if (force) {
            await sql`DELETE FROM data_bundles WHERE id = ${bundleId}`;
          }

          if (!force) {
            const [existing] = await sql`
              SELECT price FROM data_bundles WHERE id = ${bundleId}
            `;
            if (existing && Number(existing.price) !== providerPrice) {
              priceChanges.push({
                bundleId,
                oldPrice: Number(existing.price),
                newPrice: providerPrice,
              });
            }
          }

          await sql`
            INSERT INTO data_bundles (id, network_id, category_id, name, size_mb, validity_hours, price, is_popular, is_active, datamart_plan_id, datamart_plan_type, synced_at, updated_at)
            VALUES (${bundleId}, ${dbNetworkCode}, ${categoryId}, ${planName}, ${mb}, ${validityHours}, ${providerPrice}, false, ${isActive}, ${pkg.capacity}, ${"capacity"}, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              size_mb = EXCLUDED.size_mb,
              validity_hours = EXCLUDED.validity_hours,
              price = EXCLUDED.price,
              is_active = EXCLUDED.is_active,
              datamart_plan_id = EXCLUDED.datamart_plan_id,
              datamart_plan_type = EXCLUDED.datamart_plan_type,
              synced_at = NOW(),
              updated_at = NOW()
          `;

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
