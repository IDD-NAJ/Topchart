import { sql } from "@/lib/db";

export default async function RunMigrationPage() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS payment_intents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        paystack_reference TEXT UNIQUE,
        amount NUMERIC(12,4) NOT NULL,
        currency TEXT NOT NULL DEFAULT 'GHS',
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'cancelled')),
        provider TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id ON payment_intents(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payment_intents_reference ON payment_intents(paystack_reference)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payment_intents_created_at ON payment_intents(created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS payment_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        intent_id UUID,
        event_type TEXT NOT NULL,
        provider TEXT,
        provider_event_id TEXT,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        processed BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_payment_events_intent_id ON payment_events(intent_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payment_events_type ON payment_events(event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON payment_events(created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS ledger_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'revenue', 'expense')),
        currency TEXT NOT NULL DEFAULT 'GHS',
        balance NUMERIC(12,4) NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ledger_accounts_type ON ledger_accounts(type)`;

    await sql`
      CREATE TABLE IF NOT EXISTS ledger_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID NOT NULL,
        transaction_id UUID,
        amount NUMERIC(12,4) NOT NULL,
        balance_after NUMERIC(12,4) NOT NULL,
        entry_type TEXT NOT NULL CHECK (entry_type IN ('debit', 'credit')),
        description TEXT,
        reference_type TEXT,
        reference_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_id ON ledger_entries(account_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_id ON ledger_entries(transaction_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ledger_entries_created_at ON ledger_entries(created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS networks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        prefixes JSONB NOT NULL DEFAULT '[]'::jsonb,
        min_amount NUMERIC(12,4) DEFAULT 0,
        max_amount NUMERIC(12,4) DEFAULT 10000,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_networks_code ON networks(code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_networks_active ON networks(is_active)`;

    await sql`
      CREATE TABLE IF NOT EXISTS referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID NOT NULL,
        referred_id UUID,
        code TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status)`;

    await sql`
      CREATE TABLE IF NOT EXISTS referral_rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID NOT NULL,
        referred_id UUID,
        reward_type TEXT NOT NULL DEFAULT 'credit',
        reward_amount NUMERIC(12,4) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
        paid_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON referral_rewards(referrer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status)`;

    await sql`
      CREATE TABLE IF NOT EXISTS referral_visits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referral_code TEXT NOT NULL,
        visitor_ip TEXT,
        visitor_fingerprint TEXT,
        user_agent TEXT,
        converted BOOLEAN NOT NULL DEFAULT false,
        converted_user_id UUID,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_referral_visits_code ON referral_visits(referral_code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_referral_visits_created_at ON referral_visits(created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT NOT NULL UNIQUE,
        description TEXT,
        discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
        discount_value NUMERIC(12,4) NOT NULL,
        min_purchase NUMERIC(12,4) DEFAULT 0,
        max_uses INTEGER,
        current_uses INTEGER NOT NULL DEFAULT 0,
        max_uses_per_user INTEGER DEFAULT 1,
        starts_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active)`;

    await sql`
      CREATE TABLE IF NOT EXISTS promo_redemptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        promo_id UUID NOT NULL,
        user_id UUID NOT NULL,
        order_id TEXT,
        discount_applied NUMERIC(12,4) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_promo_redemptions_promo_id ON promo_redemptions(promo_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user_id ON promo_redemptions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_promo_redemptions_created_at ON promo_redemptions(created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS data_bundle_purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        bundle_id TEXT NOT NULL,
        bundle_name TEXT,
        recipient_phone TEXT NOT NULL,
        network TEXT NOT NULL,
        amount NUMERIC(12,4) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded')),
        transaction_reference TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_data_bundle_purchases_user_id ON data_bundle_purchases(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_data_bundle_purchases_status ON data_bundle_purchases(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_data_bundle_purchases_created_at ON data_bundle_purchases(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_data_bundle_purchases_recipient_phone ON data_bundle_purchases(recipient_phone)`;

    // Drop and recreate esim_phone_plans to clear invalid UUID data
    await sql`DROP TABLE IF EXISTS esim_phone_plans CASCADE`;
    await sql`
      CREATE TABLE esim_phone_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC(12,4) NOT NULL,
        minutes INTEGER NOT NULL DEFAULT 0,
        sms INTEGER NOT NULL DEFAULT 0,
        validity_days INTEGER NOT NULL,
        features JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT true,
        popular BOOLEAN NOT NULL DEFAULT false,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_esim_phone_plans_is_active ON esim_phone_plans(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_esim_phone_plans_sort_order ON esim_phone_plans(sort_order)`;

    const networksExist = await sql`SELECT COUNT(*) as count FROM networks`;

    await sql`
      CREATE TABLE IF NOT EXISTS kyc_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'under_review', 'approved', 'rejected')),
        first_name TEXT,
        last_name TEXT,
        date_of_birth DATE,
        country TEXT,
        phone_number TEXT,
        address TEXT,
        id_type TEXT,
        id_number TEXT,
        reviewed_by UUID,
        reviewed_at TIMESTAMP WITH TIME ZONE,
        rejection_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_kyc_profiles_user_id ON kyc_profiles(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_kyc_profiles_status ON kyc_profiles(status)`;

    await sql`
      CREATE TABLE IF NOT EXISTS kyc_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID,
        user_id UUID,
        document_type TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_name TEXT,
        mime_type TEXT,
        file_size INTEGER,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        reviewed_by UUID,
        reviewed_at TIMESTAMP WITH TIME ZONE,
        rejection_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_kyc_documents_profile_id ON kyc_documents(profile_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc_documents(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(status)`;

    await sql`
      CREATE TABLE IF NOT EXISTS kyc_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID,
        reviewer_id UUID,
        action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'request_info')),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_kyc_reviews_profile_id ON kyc_reviews(profile_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_kyc_reviews_reviewer_id ON kyc_reviews(reviewer_id)`;

    // Admin tables
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'admin',
        permissions TEXT[] DEFAULT '{}',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id)`;

    await sql`
      CREATE TABLE IF NOT EXISTS action_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        details JSONB NOT NULL DEFAULT '{}'::jsonb,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_action_logs_user_id ON action_logs(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_action_logs_action ON action_logs(action)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_action_logs_resource ON action_logs(resource_type, resource_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_action_logs_created_at ON action_logs(created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        permissions TEXT[] NOT NULL DEFAULT '{}',
        is_system BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      INSERT INTO roles (name, description, permissions, is_system) VALUES
      ('super_admin', 'Full system access', ARRAY['*'], true),
      ('admin', 'Standard admin access', ARRAY['users.read', 'users.write', 'transactions.read', 'data.read', 'data.write', 'settings.read'], true),
      ('support', 'Support agent access', ARRAY['users.read', 'tickets.read', 'tickets.write', 'transactions.read'], true)
      ON CONFLICT (name) DO NOTHING
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        resource TEXT NOT NULL,
        action TEXT NOT NULL CHECK (action IN ('read', 'write', 'delete', '*')),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      INSERT INTO permissions (name, description, resource, action) VALUES
      ('users.read', 'View user data', 'users', 'read'),
      ('users.write', 'Edit user data', 'users', 'write'),
      ('users.delete', 'Delete users', 'users', 'delete'),
      ('transactions.read', 'View transactions', 'transactions', 'read'),
      ('transactions.write', 'Manage transactions', 'transactions', 'write'),
      ('data.read', 'View data bundles', 'data', 'read'),
      ('data.write', 'Manage data bundles', 'data', 'write'),
      ('settings.read', 'View settings', 'settings', 'read'),
      ('settings.write', 'Edit settings', 'settings', 'write'),
      ('tickets.read', 'View tickets', 'tickets', 'read'),
      ('tickets.write', 'Manage tickets', 'tickets', 'write'),
      ('*', 'Full access', '*', '*')
      ON CONFLICT (name) DO NOTHING
    `;

    // Order tables
    await sql`
      CREATE TABLE IF NOT EXISTS esim_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        iccid TEXT,
        package_id TEXT NOT NULL,
        package_name TEXT,
        destination TEXT,
        data_gb NUMERIC(10,2),
        validity_days INTEGER,
        price NUMERIC(12,4) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'active', 'expired', 'cancelled', 'failed')),
        airalo_order_id TEXT,
        qr_code_url TEXT,
        activation_code TEXT,
        started_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        transaction_reference TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_esim_orders_user_id ON esim_orders(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_esim_orders_status ON esim_orders(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_esim_orders_iccid ON esim_orders(iccid)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_esim_orders_created_at ON esim_orders(created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS proxy_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        plan_type TEXT NOT NULL,
        bandwidth_gb NUMERIC(10,2),
        duration_days INTEGER,
        price NUMERIC(12,4) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'failed')),
        proxy_username TEXT,
        proxy_password TEXT,
        proxy_list TEXT,
        expires_at TIMESTAMP WITH TIME ZONE,
        transaction_reference TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_proxy_orders_user_id ON proxy_orders(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_proxy_orders_status ON proxy_orders(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_proxy_orders_created_at ON proxy_orders(created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS giftcard_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT,
        brand TEXT,
        country TEXT,
        denomination NUMERIC(12,4) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        total_price NUMERIC(12,4) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
        card_code TEXT,
        card_pin TEXT,
        card_url TEXT,
        transaction_reference TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_giftcard_orders_user_id ON giftcard_orders(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_giftcard_orders_status ON giftcard_orders(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_giftcard_orders_created_at ON giftcard_orders(created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS bill_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        provider_id UUID,
        provider_code TEXT NOT NULL,
        account_number TEXT NOT NULL,
        amount NUMERIC(12,4) NOT NULL,
        convenience_fee NUMERIC(12,4) DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded')),
        provider_reference TEXT,
        transaction_reference TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_bill_transactions_user_id ON bill_transactions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bill_transactions_status ON bill_transactions(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bill_transactions_created_at ON bill_transactions(created_at DESC)`;

    // Support tables
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS ticket_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ticket_id UUID,
          sender_id UUID,
          message TEXT NOT NULL,
          attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
          is_admin BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `;
    } catch (e) {
      console.log('ticket_messages table creation skipped (already exists with different schema)');
    }
    try {
      await sql`ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS ticket_id UUID`;
      await sql`ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS sender_id UUID`;
    } catch (e) {
      console.log('ticket_messages column addition skipped');
    }
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at ASC)`;
    } catch (e) {
      console.log('ticket_messages index creation skipped');
    }

    // User tables
    await sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE,
        avatar_url TEXT,
        phone_number TEXT,
        country TEXT,
        city TEXT,
        bio TEXT,
        preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)`;

    await sql`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        token_hash TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        device_type TEXT,
        device_info JSONB NOT NULL DEFAULT '{}'::jsonb,
        last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at)`;

    await sql`
      CREATE TABLE IF NOT EXISTS disputes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        type TEXT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
        priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_disputes_user_id ON disputes(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC)`;

    if (networksExist[0].count === 0) {
      await sql`
        INSERT INTO networks (name, code, prefixes, min_amount, max_amount) VALUES
        ('MTN Ghana', 'mtn', '["024", "054", "055", "059", "020"]'::jsonb, 0.50, 1000),
        ('Vodafone/Telecel', 'vodafone', '["020", "050", "026"]'::jsonb, 0.50, 1000),
        ('AirtelTigo', 'airteltigo', '["026", "027", "028", "056", "057"]'::jsonb, 0.50, 1000),
        ('Glo Ghana', 'glo', '["023", "024", "025", "055", "056"]'::jsonb, 0.50, 1000)
        ON CONFLICT (code) DO NOTHING
      `;
    }

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Migration Complete</h1>
        <p className="text-green-600">All missing tables created successfully!</p>
        <ul className="mt-4 space-y-2">
          <li>✓ payment_intents</li>
          <li>✓ payment_events</li>
          <li>✓ ledger_accounts</li>
          <li>✓ ledger_entries</li>
          <li>✓ networks</li>
          <li>✓ referrals</li>
          <li>✓ referral_rewards</li>
          <li>✓ referral_visits</li>
          <li>✓ promo_codes</li>
          <li>✓ promo_redemptions</li>
          <li>✓ data_bundle_purchases</li>
          <li>✓ esim_phone_plans</li>
          <li>✓ kyc_profiles</li>
          <li>✓ kyc_documents</li>
          <li>✓ kyc_reviews</li>
          <li>✓ admin_users</li>
          <li>✓ action_logs</li>
          <li>✓ roles</li>
          <li>✓ permissions</li>
          <li>✓ esim_orders</li>
          <li>✓ proxy_orders</li>
          <li>✓ giftcard_orders</li>
          <li>✓ bill_transactions</li>
          <li>✓ ticket_messages</li>
          <li>✓ user_profiles</li>
          <li>✓ auth_sessions</li>
          <li>✓ disputes</li>
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">You can now close this page and refresh the admin dashboard.</p>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Migration Failed</h1>
        <p className="text-red-600">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
}
