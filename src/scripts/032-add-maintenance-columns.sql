ALTER TABLE service_status
  ADD COLUMN IF NOT EXISTS is_maintenance BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS maintenance_message TEXT DEFAULT 'This service is temporarily under maintenance. Please check back shortly.';

CREATE INDEX IF NOT EXISTS idx_service_status_is_maintenance ON service_status(is_maintenance);
