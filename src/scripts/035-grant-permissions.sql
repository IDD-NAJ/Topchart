-- Grant permissions to authenticator role for transactions and related tables
-- Run this in Neon SQL Editor with the owner role

-- Transactions table
GRANT ALL ON TABLE transactions TO authenticator;
GRANT USAGE, SELECT ON SEQUENCE IF EXISTS transactions_id_seq TO authenticator;

-- Data bundle tables
GRANT ALL ON TABLE data_bundle_categories TO authenticator;
GRANT ALL ON TABLE data_bundles TO authenticator;

-- Auth sessions
GRANT ALL ON TABLE auth_sessions TO authenticator;

-- Users
GRANT ALL ON TABLE users TO authenticator;

-- Wallets
GRANT ALL ON TABLE wallets TO authenticator;

-- Accounts
GRANT ALL ON TABLE accounts TO authenticator;

-- Verification tables
GRANT ALL ON TABLE verification_services TO authenticator;
GRANT ALL ON TABLE verification_numbers TO authenticator;
GRANT ALL ON TABLE verification_sms TO authenticator;

-- Favorites
GRANT ALL ON TABLE favorites TO authenticator;

-- System config
GRANT ALL ON TABLE system_config TO authenticator;

-- App settings
GRANT ALL ON TABLE app_settings TO authenticator;

-- Referral tables
GRANT ALL ON TABLE referral_links TO authenticator;
GRANT ALL ON TABLE referral_visits TO authenticator;
GRANT ALL ON TABLE referral_rewards TO authenticator;

-- Service status
GRANT ALL ON TABLE service_status TO authenticator;

-- Homepage media
GRANT ALL ON TABLE homepage_media TO authenticator;

-- Content tables
GRANT ALL ON TABLE content_posts TO authenticator;
GRANT ALL ON TABLE content_faqs TO authenticator;
GRANT ALL ON TABLE content_jobs TO authenticator;
GRANT ALL ON TABLE content_perks TO authenticator;
GRANT ALL ON TABLE press_mentions TO authenticator;

-- Fraud alerts
GRANT ALL ON TABLE fraud_alerts TO authenticator;

-- Blog
GRANT ALL ON TABLE blog_posts TO authenticator;

-- Reseller tables
GRANT ALL ON TABLE reseller_profiles TO authenticator;
GRANT ALL ON TABLE reseller_applications TO authenticator;

-- Ledger
GRANT ALL ON TABLE ledger_accounts TO authenticator;
GRANT ALL ON TABLE ledger_entries TO authenticator;

-- Payment events
GRANT ALL ON TABLE payment_events TO authenticator;
GRANT ALL ON TABLE payment_intents TO authenticator;

-- eSIM tables
GRANT ALL ON TABLE esim_orders TO authenticator;
GRANT ALL ON TABLE esim_products TO authenticator;

-- Gift card tables
GRANT ALL ON TABLE giftcard_orders TO authenticator;

-- Proxy tables
GRANT ALL ON TABLE proxy_orders TO authenticator;

-- Promo tables
GRANT ALL ON TABLE promo_codes TO authenticator;
GRANT ALL ON TABLE promo_redemptions TO authenticator;

-- Migrations tracking
GRANT ALL ON TABLE _migrations TO authenticator;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticator;
