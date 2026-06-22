-- Create popup_banners table for managing promotional banners
CREATE TABLE IF NOT EXISTS popup_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR(500),
  link_url VARCHAR(500),
  link_text VARCHAR(100),
  target_type VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'specific', 'segment')),
  target_user_ids JSONB DEFAULT '[]',
  target_segment VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP,
  priority INTEGER NOT NULL DEFAULT 0,
  show_once_per_session BOOLEAN NOT NULL DEFAULT true,
  dismissible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create user_banner_dismissals table to track banner dismissals
CREATE TABLE IF NOT EXISTS user_banner_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  banner_id UUID NOT NULL REFERENCES popup_banners(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, banner_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_popup_banners_active ON popup_banners(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_popup_banners_dates ON popup_banners(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_popup_banners_priority ON popup_banners(priority DESC);
CREATE INDEX IF NOT EXISTS idx_popup_banners_target_type ON popup_banners(target_type);
CREATE INDEX IF NOT EXISTS idx_user_banner_dismissals_user ON user_banner_dismissals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_banner_dismissals_banner ON user_banner_dismissals(banner_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_popup_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_popup_banners_updated_at
  BEFORE UPDATE ON popup_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_popup_banners_updated_at();

-- Add comment to tables
COMMENT ON TABLE popup_banners IS 'Promotional banners that appear on user dashboard when they log in';
COMMENT ON TABLE user_banner_dismissals IS 'Track which users have dismissed which banners';
