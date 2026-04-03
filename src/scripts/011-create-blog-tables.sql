-- Migration 011: Create blog content tables
-- Tables: blog_categories, posts

-- Blog categories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    color_class VARCHAR(100) NOT NULL DEFAULT 'bg-muted text-muted-foreground',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT,
    author VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    gradient VARCHAR(100) NOT NULL DEFAULT 'from-gray-500/30 to-gray-500/5',
    icon_color VARCHAR(50) NOT NULL DEFAULT 'bg-gray-500/20 text-gray-600',
    published_at TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_is_published ON posts(is_published);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);

-- Trigger for updated_at on posts
CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_posts_updated_at();

-- Seed default blog categories (matching current hardcoded values)
INSERT INTO blog_categories (name, color_class, sort_order) VALUES
('Product Updates', 'bg-amber-500/10 text-amber-700 dark:text-amber-400', 1),
('Security', 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', 2),
('Company News', 'bg-blue-500/10 text-blue-700 dark:text-blue-400', 3)
ON CONFLICT DO NOTHING;

-- Seed default blog posts (matching current hardcoded values)
INSERT INTO posts (slug, title, excerpt, author, category_id, gradient, icon_color, published_at, is_published) VALUES
('new-data-bundles-2026', 
 'Expanding our Network: New Data Bundles for 2026', 
 'We are excited to announce a range of new, more affordable data bundles across all networks.', 
 'Product Team',
 (SELECT id FROM blog_categories WHERE name = 'Product Updates'),
 'from-amber-500/30 via-orange-400/20 to-amber-500/5',
 'bg-amber-500/20 text-amber-600',
 NOW(),
 TRUE),

('security-best-practices', 
 'Securing your Transactions: Best Practices', 
 'Learn how to keep your Topchart account and transactions secure with these simple tips.', 
 'Security Team',
 (SELECT id FROM blog_categories WHERE name = 'Security'),
 'from-emerald-500/30 via-teal-400/20 to-emerald-500/5',
 'bg-emerald-500/20 text-emerald-600',
 NOW() - INTERVAL '5 days',
 TRUE),

('500k-users-milestone', 
 'Topchart Reaches 500,000 Users in Ghana', 
 'A major milestone in our journey to build the ultimate digital infrastructure for Ghana.', 
 'Press Office',
 (SELECT id FROM blog_categories WHERE name = 'Company News'),
 'from-blue-500/30 via-indigo-400/20 to-blue-500/5',
 'bg-blue-500/20 text-blue-600',
 NOW() - INTERVAL '10 days',
 TRUE)
ON CONFLICT DO NOTHING;
