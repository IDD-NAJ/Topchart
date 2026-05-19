-- Migration: Create smspva_services and smspva_availability tables
-- Run in Neon SQL Editor with neondb_owner role

-- 1. smspva_services — admin-managed list of international services
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
);

CREATE INDEX IF NOT EXISTS idx_smspva_services_active   ON smspva_services(is_active);
CREATE INDEX IF NOT EXISTS idx_smspva_services_category ON smspva_services(category);

-- 2. smspva_availability — 30-min availability cache (avoids hammering SMSPVA API)
CREATE TABLE IF NOT EXISTS smspva_availability (
  country_code TEXT NOT NULL,
  service_code TEXT NOT NULL,
  count        INTEGER NOT NULL DEFAULT 0,
  cost_usd     NUMERIC(10,4),
  cached_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (country_code, service_code)
);

CREATE INDEX IF NOT EXISTS idx_smspva_availability_cached_at ON smspva_availability(cached_at);

-- 3. Seed all 51 services (upsert — safe to re-run)
INSERT INTO smspva_services (service_code, name, category, base_usd_price) VALUES
  -- Social Media
  ('opt6',  'WhatsApp',       'social_media',            0.15),
  ('opt4',  'Telegram',       'social_media',            0.10),
  ('opt11', 'Facebook',       'social_media',            0.12),
  ('opt3',  'Twitter/X',      'social_media',            0.10),
  ('ma',    'Instagram',      'social_media',            0.12),
  ('opt1',  'Viber',          'social_media',            0.10),
  ('opt2',  'WeChat',         'social_media',            0.14),
  ('sc',    'Snapchat',       'social_media',            0.12),
  ('dc',    'Discord',        'social_media',            0.10),
  ('tn',    'Tinder',         'social_media',            0.12),
  ('bm',    'Bumble',         'social_media',            0.12),
  ('kk',    'KakaoTalk',      'social_media',            0.10),
  ('ln',    'Line',           'social_media',            0.10),
  ('pi',    'Pinterest',      'social_media',            0.10),
  ('rd',    'Reddit',         'social_media',            0.10),
  ('sk',    'Skype',          'social_media',            0.10),
  -- Streaming & Entertainment
  ('tw',    'Twitch',         'streaming_entertainment', 0.10),
  ('ti',    'TikTok',         'streaming_entertainment', 0.12),
  ('nf',    'Netflix',        'streaming_entertainment', 0.15),
  ('sp',    'Spotify',        'streaming_entertainment', 0.12),
  ('yt',    'YouTube',        'streaming_entertainment', 0.12),
  ('hb',    'Hulu',           'streaming_entertainment', 0.14),
  ('dm',    'Disney+',        'streaming_entertainment', 0.14),
  ('zu',    'Zoom',           'streaming_entertainment', 0.12),
  ('cl',    'Clubhouse',      'streaming_entertainment', 0.10),
  -- Professional Tools
  ('go',    'Google',         'professional_tools',      0.18),
  ('ms',    'Microsoft',      'professional_tools',      0.15),
  ('ya',    'Yahoo',          'professional_tools',      0.10),
  ('li',    'LinkedIn',       'professional_tools',      0.14),
  ('gh',    'GitHub',         'professional_tools',      0.10),
  ('dr',    'Dropbox',        'professional_tools',      0.10),
  ('sl',    'Slack',          'professional_tools',      0.12),
  ('wk',    'WeWork',         'professional_tools',      0.10),
  ('ot',    'Any Service',    'professional_tools',      0.08),
  -- E-Commerce & Financial
  ('am',    'Amazon',         'ecommerce_financial',     0.15),
  ('ub',    'Uber',           'ecommerce_financial',     0.12),
  ('pp',    'PayPal',         'ecommerce_financial',     0.14),
  ('bi',    'Binance',        'ecommerce_financial',     0.12),
  ('ay',    'AliExpress',     'ecommerce_financial',     0.10),
  ('eb',    'eBay',           'ecommerce_financial',     0.12),
  ('ab',    'Airbnb',         'ecommerce_financial',     0.14),
  ('lf',    'Lyft',           'ecommerce_financial',     0.12),
  ('et',    'Etsy',           'ecommerce_financial',     0.10),
  ('ck',    'Cash App',       'ecommerce_financial',     0.14),
  ('ve',    'Venmo',          'ecommerce_financial',     0.14),
  ('rv',    'Revolut',        'ecommerce_financial',     0.14),
  ('wz',    'Wise',           'ecommerce_financial',     0.12),
  ('cb',    'Coinbase',       'ecommerce_financial',     0.14),
  ('ok',    'OKX',            'ecommerce_financial',     0.12),
  ('by',    'Bybit',          'ecommerce_financial',     0.12),
  ('sh',    'Shopify',        'ecommerce_financial',     0.12),
  ('wd',    'Wolt/DoorDash',  'ecommerce_financial',     0.12)
ON CONFLICT (service_code) DO UPDATE
  SET name           = EXCLUDED.name,
      category       = EXCLUDED.category,
      base_usd_price = EXCLUDED.base_usd_price,
      updated_at     = NOW();

-- Verify
SELECT category, COUNT(*) AS cnt FROM smspva_services GROUP BY category ORDER BY category;
