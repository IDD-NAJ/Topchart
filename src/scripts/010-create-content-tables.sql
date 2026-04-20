-- Migration 010: Create content management tables for careers page
-- Tables: jobs, perks

-- Jobs table for career listings
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    location VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Full-time', 'Part-time', 'Contract', 'Internship')),
    department VARCHAR(50) NOT NULL,
    description TEXT,
    requirements TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Perks table for career benefits
CREATE TABLE IF NOT EXISTS perks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon_name VARCHAR(50) NOT NULL DEFAULT 'Star',
    color_gradient VARCHAR(100) NOT NULL DEFAULT 'from-gray-500/20 to-gray-500/5',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_sort_order ON jobs(sort_order);
CREATE INDEX IF NOT EXISTS idx_perks_is_active ON perks(is_active);
CREATE INDEX IF NOT EXISTS idx_perks_sort_order ON perks(sort_order);

-- Trigger for updated_at on jobs
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_jobs_updated_at();

-- Seed default perks data (matching current hardcoded values)
INSERT INTO perks (title, description, icon_name, color_gradient, sort_order, is_active) VALUES
('Health Benefits', 'Comprehensive health and wellness coverage for you and your family.', 'Heart', 'from-rose-500/20 to-rose-500/5', 1, TRUE),
('Fast Growth', 'Work on high-impact problems in a rapidly scaling fintech startup.', 'Zap', 'from-amber-500/20 to-amber-500/5', 2, TRUE),
('Remote Friendly', 'Flexible work arrangements with a remote-first culture for most roles.', 'Globe', 'from-blue-500/20 to-blue-500/5', 3, TRUE),
('Learning Budget', 'Annual budget for courses, conferences, and professional development.', 'GraduationCap', 'from-emerald-500/20 to-emerald-500/5', 4, TRUE),
('Great Team', 'Join a diverse team of talented ians building for Africa and beyond.', 'Users', 'from-indigo-500/20 to-indigo-500/5', 5, TRUE),
('Equity', 'Share in the upside of what we are building with an equity package.', 'Shield', 'from-teal-500/20 to-teal-500/5', 6, TRUE)
ON CONFLICT DO NOTHING;

-- Seed default jobs data (matching current hardcoded values)
INSERT INTO jobs (title, location, type, department, description, requirements, is_active, sort_order) VALUES
('Senior Full Stack Engineer', 'Accra,  / Remote', 'Full-time', 'Engineering', 
 'Lead engineering initiatives across our entire stack, from frontend React components to backend API design and database optimization.', 
 ARRAY['5+ years experience with React and Node.js', 'Experience with PostgreSQL and database design', 'Strong understanding of TypeScript'], 
 TRUE, 1),

('Product Designer', 'Accra, ', 'Full-time', 'Design', 
 'Create beautiful, intuitive interfaces for our web and mobile applications. Work closely with engineering to ship polished features.', 
 ARRAY['3+ years of product design experience', 'Proficiency in Figma', 'Portfolio demonstrating strong UI/UX skills'], 
 TRUE, 2),

('Customer Success Lead', 'Accra, ', 'Full-time', 'Operations', 
 'Build and lead our customer support team, develop support processes, and ensure our users have an exceptional experience.', 
 ARRAY['4+ years in customer success or support', 'Experience building teams from scratch', 'Excellent communication skills'], 
 TRUE, 3)
ON CONFLICT DO NOTHING;
