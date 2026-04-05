-- Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(50),
    target_id VARCHAR(50),
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Error Logs Table
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT,
    stack TEXT,
    context JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Slow Query Logs Table
CREATE TABLE IF NOT EXISTS slow_query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT,
    duration_ms INTEGER,
    table_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON admin_audit_logs(target_table);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_slow_query_logs_table ON slow_query_logs(table_name);
