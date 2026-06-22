-- ============================================================
-- 004_seed_data.sql
-- Inserts required reference / content rows so all pages render
-- real data instead of showing empty state.
-- All inserts use ON CONFLICT DO NOTHING — safe to re-run.
-- Run AFTER 003_core_missing_tables.sql.
-- ============================================================

-- ============================================================
-- service_status — 8 platform services (all enabled by default)
-- ============================================================

INSERT INTO service_status
  (service_key, service_name, description, display_order, icon_name,
   is_enabled, is_coming_soon, is_maintenance)
VALUES
  ('data',           'Data Bundles',   'Mobile data bundle purchases for all networks', 1, 'Wifi',         true, false, false),
  ('airtime',        'Airtime',        'Mobile airtime top-up for all networks',         2, 'Phone',        true, false, false),
  ('verification',   'Verification',   'Temporary phone numbers for SMS verification',  3, 'PhoneCall',    true, false, false),
  ('result_checker', 'Result Checker', 'WAEC, BECE and NOVDEC exam result checking',    4, 'GraduationCap',true, false, false),
  ('esim',           'eSIM',           'US phone numbers and travel data eSIMs',         5, 'Smartphone',   true, false, false),
  ('proxy',          'Proxies',        'Residential, mobile and datacenter proxies',    6, 'Shield',       true, false, false),
  ('giftcards',      'Gift Cards',     'Digital gift cards delivered instantly',        7, 'Gift',         true, false, false),
  ('bills',          'Pay Bills',      'Electricity, TV, water and internet payments',  8, 'CreditCard',   true, false, false)
ON CONFLICT (service_key) DO NOTHING;

-- ============================================================
-- RBAC seed — roles and permissions
-- ============================================================

INSERT INTO roles (name, description, permissions, is_system) VALUES
  ('super_admin', 'Full system access',    ARRAY['*'], true),
  ('admin',       'Standard admin access', ARRAY['users.read','users.write','transactions.read','data.read','data.write','settings.read'], true),
  ('support',     'Support agent access',  ARRAY['users.read','tickets.read','tickets.write','transactions.read'], true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, description, resource, action) VALUES
  ('users.read',        'View user data',        'users',        'read'),
  ('users.write',       'Edit user data',         'users',        'write'),
  ('users.delete',      'Delete users',           'users',        'delete'),
  ('transactions.read', 'View transactions',      'transactions', 'read'),
  ('transactions.write','Manage transactions',    'transactions', 'write'),
  ('data.read',         'View data bundles',      'data',         'read'),
  ('data.write',        'Manage data bundles',    'data',         'write'),
  ('settings.read',     'View settings',          'settings',     'read'),
  ('settings.write',    'Edit settings',          'settings',     'write'),
  ('tickets.read',      'View tickets',           'tickets',      'read'),
  ('tickets.write',     'Manage tickets',         'tickets',      'write'),
  ('*',                 'Full access',            '*',            '*')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- homepage_services
-- ============================================================

INSERT INTO homepage_services (title, description, href, label, icon, priority, is_active) VALUES
  ('Data Bundles',       'Affordable daily, weekly and monthly data packages for every network.',  '/dashboard/data',           'Browse bundles',     'Wifi',         1, true),
  ('Foreign Numbers','Temporary virtual numbers for OTP verification on any platform.',       '/dashboard/verification',   'Get a number',       'PhoneCall',    2, true),
  ('Result Checkers',    'WAEC, BECE and NOVDEC results with your index number.',                  '/dashboard/result-checkers','Check results',      'GraduationCap',3, true),
  ('eSIM',               'Get a US phone number or travel data eSIM for 50+ countries.',           '/dashboard/esim',           'Get eSIM',           'Smartphone',   4, true),
  ('Proxies',            'Residential, mobile and datacenter proxies via 9Proxy.',                 '/dashboard/proxies',        'Get proxies',        'Shield',       5, true),
  ('Gift Cards',         'Digital gift cards for Netflix, Amazon, Steam and more.',                '/dashboard/giftcards',      'Buy gift cards',     'Gift',         6, true),
  ('Pay Bills',          'Electricity, TV, water and internet bill payments.',                     '/dashboard/bills',          'Pay now',            'CreditCard',   7, true),
  ('Reseller Program',   'Earn commissions reselling our services under your own brand.',          '/dashboard/reseller',       'Become a reseller',  'Store',        8, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- homepage_faqs
-- ============================================================

INSERT INTO homepage_faqs (question, answer, priority, is_active) VALUES
  ('How fast is data delivery?',
   'Most orders complete within seconds. Network congestion may occasionally add a short delay.',
   1, true),
  ('What payment methods are supported?',
   'MTN MoMo, Telecel Cash, AirtelTigo Money, Visa, Mastercard, and wallet balance via Paystack.',
   2, true),
  ('How do Foreign Numbers work?',
   'You rent a temporary number; OTP SMS appears in your dashboard in real time.',
   3, true),
  ('Is my wallet balance safe?',
   'Yes. Your wallet is protected by end-to-end encrypted sessions and we never store card details.',
   4, true),
  ('Can I get a refund if a purchase fails?',
   'Absolutely. Failed transactions are automatically reversed to your wallet within seconds.',
   5, true),
  ('Which networks are supported for data bundles?',
   'MTN, Telecel (Vodafone) and AirtelTigo — all major networks in Ghana.',
   6, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- homepage_testimonials
-- ============================================================

INSERT INTO homepage_testimonials (brand, quote, name, role, priority, is_active) VALUES
  ('North Ridge Fintech',
   'Topchart cut our recharge turnaround to seconds. Wallet funding and reporting are exactly what we needed for ops.',
   'Kwame A.', 'Head of Operations', 1, true),
  ('Campus Hub GH',
   'We sell data and airtime to students daily. Reliability and the reseller tools have been excellent.',
   'Ama O.', 'Product Lead', 2, true),
  ('VerifyPro Labs',
   'Foreign Numbers for QA saved us from juggling personal SIMs. Support is responsive.',
   'Kofi M.', 'Engineering Manager', 3, true),
  ('Retail Collective',
   'Airtime and data in one dashboard simplified payouts for our field teams across all regions.',
   'Esi T.', 'Finance Director', 4, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- navigation_links
-- ============================================================

INSERT INTO navigation_links (label, href, description, icon, priority, is_active) VALUES
  ('Overview',              '/dashboard',                'Balances, referrals, and activity',           'LayoutDashboard', 1, true),
  ('Data bundles',          '/dashboard/data',           'Plans for every need',                        'Wifi',            2, true),
  ('Foreign Numbers',  '/dashboard/verification',   'Temporary numbers for SMS codes',             'PhoneCall',       3, true),
  ('Result checkers',       '/dashboard/result-checkers','Exam results and PINs',                       'GraduationCap',   4, true),
  ('eSIM',                  '/dashboard/esim',           'US phone numbers and travel data eSIMs',      'Smartphone',      5, true),
  ('Proxies',               '/dashboard/proxies',        'Residential, mobile and datacenter proxies',  'Shield',          6, true),
  ('Gift Cards',            '/dashboard/giftcards',      'Digital gift cards delivered instantly',      'Gift',            7, true),
  ('Pay Bills',             '/dashboard/bills',          'Electricity, TV, water and internet',         'CreditCard',      8, true),
  ('Reseller',              '/dashboard/reseller',       'Reseller program and tools',                  'Store',           9, true)
ON CONFLICT DO NOTHING;
