const NEON_DB_URL = "postgresql://authenticator:npg_y9jdOAHcW6BP@ep-divine-frog-ahe05se1-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function checkAndFixDB() {
  const { Pool } = await import("@neondatabase/serverless");
  const pool = new Pool({ connectionString: NEON_DB_URL });
  
  try {
    console.log("Checking database tables and permissions...\n");
    
    // Check if tables exist
    const tables = await pool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    console.log("Existing tables:", tables.rows.map(r => r.tablename).join(", "));
    
    // Check data_bundle_categories columns and constraints
    const catCols = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'data_bundle_categories'
      ORDER BY ordinal_position
    `);
    console.log("\ndata_bundle_categories columns:");
    catCols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type} (${r.is_nullable})`));

    // Check constraints on data_bundle_categories
    const catConstraints = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = 'public.data_bundle_categories'::regclass
    `);
    console.log("\ndata_bundle_categories constraints:");
    catConstraints.rows.forEach(r => console.log(`  ${r.conname} (${r.contype}): ${r.def}`));

    // Check networks table
    const networks = await pool.query(`SELECT * FROM networks LIMIT 10`);
    console.log("\nnetworks table rows:");
    networks.rows.forEach(r => console.log(`  ${r.id}: ${r.name} (${r.slug})`));
    
    // Check data_bundles columns
    const bundleCols = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'data_bundles'
      ORDER BY ordinal_position
    `);
    console.log("\ndata_bundles columns:");
    bundleCols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type} (${r.is_nullable})`));
    
    // Check verification_services columns
    const verCols = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'verification_services'
      ORDER BY ordinal_position
    `);
    console.log("\nverification_services columns:");
    verCols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
    
    // Check app_settings columns
    const appCols = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'app_settings'
      ORDER BY ordinal_position
    `);
    console.log("\napp_settings columns:");
    appCols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
    
    // Check existing categories
    const categories = await pool.query(`SELECT * FROM data_bundle_categories LIMIT 10`);
    console.log("\nExisting categories:", categories.rows.length);
    categories.rows.forEach(r => console.log(`  ${r.id}: ${r.name} (${r.network})`));
    
    // Check existing bundles
    const bundles = await pool.query(`SELECT count(*) as cnt FROM data_bundles`);
    console.log("\nExisting bundles count:", bundles.rows[0]?.cnt);
    
    // Try GRANT commands
    console.log("\nAttempting GRANT commands...");
    const grantStatements = [
      "GRANT ALL ON TABLE data_bundle_categories TO authenticator",
      "GRANT ALL ON TABLE data_bundles TO authenticator",
      "GRANT ALL ON TABLE verification_services TO authenticator",
      "GRANT ALL ON TABLE verification_numbers TO authenticator",
      "GRANT ALL ON TABLE verification_sms TO authenticator",
      "GRANT ALL ON TABLE app_settings TO authenticator",
      "GRANT ALL ON TABLE system_config TO authenticator",
      "GRANT USAGE ON SCHEMA public TO authenticator",
    ];
    
    for (const stmt of grantStatements) {
      try {
        await pool.query(stmt);
        console.log(`  ✓ ${stmt}`);
      } catch (err) {
        console.log(`  ✗ ${stmt} - ${err?.message}`);
      }
    }
    
    console.log("\nDone!");
  } catch (error) {
    console.error("Error:", error?.message);
  } finally {
    await pool.end();
  }
}

checkAndFixDB();
