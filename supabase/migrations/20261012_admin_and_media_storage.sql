-- ====================================================================
-- Dwarkesh Admin Access, Website Settings & Media Storage Migration
-- ====================================================================

-- 1. Ensure Properties Table Supports Videos & Media Gallery
ALTER TABLE public.properties 
    ADD COLUMN IF NOT EXISTS video_url TEXT,
    ADD COLUMN IF NOT EXISTS media_gallery JSONB DEFAULT '[]'::jsonb;

-- 2. Create Website Settings Table (for live website access toggle & announcement)
CREATE TABLE IF NOT EXISTS public.website_settings (
    id SERIAL PRIMARY KEY,
    website_access VARCHAR(50) DEFAULT 'public' CHECK (website_access IN ('public', 'maintenance', 'private')),
    maintenance_message TEXT DEFAULT 'Dwarkesh Real Estate Group is currently undergoing scheduled platform upgrades. We will be back shortly.',
    announcement_banner TEXT DEFAULT '',
    allow_registrations BOOLEAN DEFAULT TRUE,
    access_passcode VARCHAR(100) DEFAULT 'DwarkeshVIP2026',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default website settings
INSERT INTO public.website_settings (id, website_access, maintenance_message, announcement_banner, allow_registrations)
VALUES (1, 'public', 'Dwarkesh Real Estate Group is currently undergoing scheduled platform upgrades. We will be back shortly.', '', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Create Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) DEFAULT 'Administrator',
    role VARCHAR(50) DEFAULT 'superadmin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default superadmin (Password: Admin@Dwarkesh2026!)
INSERT INTO public.admin_users (email, password_hash, name, role, is_active)
VALUES (
    'admin@dwarkesh.com',
    '$2a$10$89W1hH0U1k6g6G3k8u3uauVn3d4B4Yq2k3e9Z1B696Pq3yGekH7u8',
    'Dwarkesh Admin',
    'superadmin',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- 4. Enable RLS on website_settings and admin_users
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow public to read website_settings (needed to check if site is in maintenance mode)
DROP POLICY IF EXISTS "Public can view website settings" ON public.website_settings;
CREATE POLICY "Public can view website settings" 
    ON public.website_settings FOR SELECT 
    USING (TRUE);

-- 5. Supabase Storage Setup (Buckets: 'media' and 'properties')
-- Note: In Supabase dashboard, ensure the bucket 'media' is created and set to public if public read is desired.
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT (id) DO NOTHING;
