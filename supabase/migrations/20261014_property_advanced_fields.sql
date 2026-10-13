-- ====================================================================
-- Dwarkesh Enhanced Property Schema Migration
-- FAQs, Gallery, Nearby Landmarks, Map Coordinates, and Dynamic Pricing
-- ====================================================================

ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS nearby JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS coordinates JSONB DEFAULT '{"lat": 28.4595, "lng": 77.0266}'::jsonb,
    ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS price_on_demand BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS carpet_area VARCHAR(100),
    ADD COLUMN IF NOT EXISTS super_area VARCHAR(100),
    ADD COLUMN IF NOT EXISTS furnishing VARCHAR(100) DEFAULT 'Semi-Furnished',
    ADD COLUMN IF NOT EXISTS facing VARCHAR(100) DEFAULT 'East',
    ADD COLUMN IF NOT EXISTS floor_info VARCHAR(100),
    ADD COLUMN IF NOT EXISTS parking VARCHAR(100),
    ADD COLUMN IF NOT EXISTS rera_id VARCHAR(150),
    ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT,
    ADD COLUMN IF NOT EXISTS brochure_url TEXT,
    ADD COLUMN IF NOT EXISTS maintenance_charges VARCHAR(100),
    ADD COLUMN IF NOT EXISTS booking_amount VARCHAR(100),
    ADD COLUMN IF NOT EXISTS min_images_required INT DEFAULT 3;
