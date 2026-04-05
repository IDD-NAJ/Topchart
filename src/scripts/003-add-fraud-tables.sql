-- Fraud Alerts Table
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES reseller_profiles(id),
    user_id UUID REFERENCES users(id),
    alert_type VARCHAR(50),
    severity VARCHAR(20),
    description TEXT,
    evidence JSONB,
    status VARCHAR(20) DEFAULT 'open',
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS reseller_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES reseller_profiles(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Rate Limiting Table
CREATE TABLE IF NOT EXISTS rate_limit_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES reseller_profiles(id),
    action_type VARCHAR(50),
    violation_count INTEGER,
    time_window VARCHAR(20),
    blocked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Suspicious Transactions
CREATE TABLE IF NOT EXISTS suspicious_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID,
    reseller_id UUID REFERENCES reseller_profiles(id),
    reason VARCHAR(100),
    confidence_score DECIMAL(3,2),
    auto_blocked BOOLEAN DEFAULT false,
    admin_reviewed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_reseller ON fraud_alerts(reseller_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_reseller ON reseller_audit_logs(reseller_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_reseller ON suspicious_transactions(reseller_id);
