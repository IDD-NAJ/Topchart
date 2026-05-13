require("dotenv").config({ path: require("path").resolve(__dirname, "../.env.local") });
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const { neon } = require("@neondatabase/serverless");

const SMSPVA_SERVICES = [
  { code: "opt6",  name: "WhatsApp",        category: "social_media",            baseUsdPrice: 0.15 },
  { code: "opt4",  name: "Telegram",        category: "social_media",            baseUsdPrice: 0.10 },
  { code: "opt11", name: "Facebook",        category: "social_media",            baseUsdPrice: 0.12 },
  { code: "opt3",  name: "Twitter/X",       category: "social_media",            baseUsdPrice: 0.10 },
  { code: "ma",    name: "Instagram",       category: "social_media",            baseUsdPrice: 0.12 },
  { code: "opt1",  name: "Viber",           category: "social_media",            baseUsdPrice: 0.10 },
  { code: "opt2",  name: "WeChat",          category: "social_media",            baseUsdPrice: 0.14 },
  { code: "sc",    name: "Snapchat",        category: "social_media",            baseUsdPrice: 0.12 },
  { code: "dc",    name: "Discord",         category: "social_media",            baseUsdPrice: 0.10 },
  { code: "tn",    name: "Tinder",          category: "social_media",            baseUsdPrice: 0.12 },
  { code: "bm",    name: "Bumble",          category: "social_media",            baseUsdPrice: 0.12 },
  { code: "kk",    name: "KakaoTalk",       category: "social_media",            baseUsdPrice: 0.10 },
  { code: "ln",    name: "Line",            category: "social_media",            baseUsdPrice: 0.10 },
  { code: "pi",    name: "Pinterest",       category: "social_media",            baseUsdPrice: 0.10 },
  { code: "rd",    name: "Reddit",          category: "social_media",            baseUsdPrice: 0.10 },
  { code: "sk",    name: "Skype",           category: "social_media",            baseUsdPrice: 0.10 },
  { code: "tw",    name: "Twitch",          category: "streaming_entertainment", baseUsdPrice: 0.10 },
  { code: "ti",    name: "TikTok",          category: "streaming_entertainment", baseUsdPrice: 0.12 },
  { code: "nf",    name: "Netflix",         category: "streaming_entertainment", baseUsdPrice: 0.15 },
  { code: "sp",    name: "Spotify",         category: "streaming_entertainment", baseUsdPrice: 0.12 },
  { code: "yt",    name: "YouTube",         category: "streaming_entertainment", baseUsdPrice: 0.12 },
  { code: "hb",    name: "Hulu",            category: "streaming_entertainment", baseUsdPrice: 0.14 },
  { code: "dm",    name: "Disney+",         category: "streaming_entertainment", baseUsdPrice: 0.14 },
  { code: "zu",    name: "Zoom",            category: "streaming_entertainment", baseUsdPrice: 0.12 },
  { code: "cl",    name: "Clubhouse",       category: "streaming_entertainment", baseUsdPrice: 0.10 },
  { code: "go",    name: "Google",          category: "professional_tools",      baseUsdPrice: 0.18 },
  { code: "ms",    name: "Microsoft",       category: "professional_tools",      baseUsdPrice: 0.15 },
  { code: "ya",    name: "Yahoo",           category: "professional_tools",      baseUsdPrice: 0.10 },
  { code: "li",    name: "LinkedIn",        category: "professional_tools",      baseUsdPrice: 0.14 },
  { code: "gh",    name: "GitHub",          category: "professional_tools",      baseUsdPrice: 0.10 },
  { code: "dr",    name: "Dropbox",         category: "professional_tools",      baseUsdPrice: 0.10 },
  { code: "sl",    name: "Slack",           category: "professional_tools",      baseUsdPrice: 0.12 },
  { code: "wk",    name: "WeWork",          category: "professional_tools",      baseUsdPrice: 0.10 },
  { code: "ot",    name: "Any Service",     category: "professional_tools",      baseUsdPrice: 0.08 },
  { code: "am",    name: "Amazon",          category: "ecommerce_financial",     baseUsdPrice: 0.15 },
  { code: "ub",    name: "Uber",            category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "pp",    name: "PayPal",          category: "ecommerce_financial",     baseUsdPrice: 0.14 },
  { code: "bi",    name: "Binance",         category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "ay",    name: "AliExpress",      category: "ecommerce_financial",     baseUsdPrice: 0.10 },
  { code: "eb",    name: "eBay",            category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "ab",    name: "Airbnb",          category: "ecommerce_financial",     baseUsdPrice: 0.14 },
  { code: "lf",    name: "Lyft",            category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "et",    name: "Etsy",            category: "ecommerce_financial",     baseUsdPrice: 0.10 },
  { code: "ck",    name: "Cash App",        category: "ecommerce_financial",     baseUsdPrice: 0.14 },
  { code: "ve",    name: "Venmo",           category: "ecommerce_financial",     baseUsdPrice: 0.14 },
  { code: "rv",    name: "Revolut",         category: "ecommerce_financial",     baseUsdPrice: 0.14 },
  { code: "wz",    name: "Wise",            category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "cb",    name: "Coinbase",        category: "ecommerce_financial",     baseUsdPrice: 0.14 },
  { code: "ok",    name: "OKX",             category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "by",    name: "Bybit",           category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "sh",    name: "Shopify",         category: "ecommerce_financial",     baseUsdPrice: 0.12 },
  { code: "wd",    name: "Wolt/DoorDash",   category: "ecommerce_financial",     baseUsdPrice: 0.12 },
];

async function main() {
  let connectionString =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL ||
    "";

  if (!connectionString) {
    console.error("ERROR: No DATABASE_URL found in .env.local");
    process.exit(1);
  }

  // DDL requires the direct (non-pooler) connection — same as migrate.js
  connectionString = connectionString
    .replace(/-pooler/g, "")
    .replace(/[&?]channel_binding=[^&]*/g, "")
    .replace(/[&?]pooler_timeout=[^&]*/g, "")
    .replace(/&&/g, "&").replace(/\?&/g, "?").replace(/[?&]$/, "")
    .trim();

  const sql = neon(connectionString);

  console.log("Step 1 — Creating smspva_services table...");
  await sql`
    CREATE TABLE IF NOT EXISTS smspva_services (
      service_code      TEXT PRIMARY KEY,
      name              TEXT NOT NULL,
      category          TEXT NOT NULL DEFAULT 'professional_tools',
      base_usd_price    NUMERIC(10,4) NOT NULL DEFAULT 0.10,
      is_active         BOOLEAN NOT NULL DEFAULT TRUE,
      markup_percentage NUMERIC(6,2) NOT NULL DEFAULT 40,
      picture_url       TEXT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_smspva_services_active   ON smspva_services(is_active)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_smspva_services_category ON smspva_services(category)`;
  console.log("  OK Table ready");

  console.log("\nStep 2 — Seeding " + SMSPVA_SERVICES.length + " services...");
  let inserted = 0;
  for (const svc of SMSPVA_SERVICES) {
    const rows = await sql`
      INSERT INTO smspva_services (service_code, name, category, base_usd_price)
      VALUES (${svc.code}, ${svc.name}, ${svc.category}, ${svc.baseUsdPrice})
      ON CONFLICT (service_code) DO UPDATE
        SET name           = EXCLUDED.name,
            category       = EXCLUDED.category,
            base_usd_price = EXCLUDED.base_usd_price,
            updated_at     = NOW()
      RETURNING (xmax = 0) AS was_inserted
    `;
    if (rows[0] && rows[0].was_inserted) inserted++;
    process.stdout.write(".");
  }

  const total = await sql`SELECT COUNT(*) AS cnt FROM smspva_services`;
  console.log("\n  " + inserted + " new rows inserted");
  console.log("  " + total[0].cnt + " total services in DB");
  console.log("\nDone!");
}

main().catch(function(err) {
  console.error("Seed failed:", err.message || err);
  process.exit(1);
});
