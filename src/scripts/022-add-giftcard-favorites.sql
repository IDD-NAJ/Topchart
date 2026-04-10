-- Giftcard Favorites Table
-- Stores user's favorite gift card products

CREATE TABLE giftcard_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reloadly_product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(100) NOT NULL,
    logo_url TEXT,
    price_ghs DECIMAL(12, 2),
    currency VARCHAR(3),
    category VARCHAR(50),
    country_code VARCHAR(3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, reloadly_product_id)
);

-- Indexes for performance
CREATE INDEX idx_giftcard_favorites_user_id ON giftcard_favorites(user_id);
CREATE INDEX idx_giftcard_favorites_product_id ON giftcard_favorites(reloadly_product_id);
