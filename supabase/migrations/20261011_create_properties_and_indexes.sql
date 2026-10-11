-- ====================================================================
-- CharDiwari Real Estate Properties & Search Optimization Migration
-- ====================================================================

-- 1. Enable Trigram Extension for Fast Fuzzy and Substring Searching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    tag VARCHAR(50) DEFAULT 'Available',
    badge VARCHAR(100),
    location VARCHAR(255) NOT NULL,
    locality VARCHAR(150),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    type VARCHAR(100) NOT NULL,
    possession VARCHAR(100) DEFAULT 'Ready to Move',
    builder VARCHAR(150),
    price VARCHAR(50) NOT NULL,
    price_num NUMERIC(10, 2),
    rent_price VARCHAR(50),
    rent_price_num NUMERIC(10, 2),
    mode VARCHAR(20) DEFAULT 'both' CHECK (mode IN ('buy', 'rent', 'both')),
    beds VARCHAR(50),
    bhk VARCHAR(50),
    baths VARCHAR(50),
    area VARCHAR(100),
    image TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. High-Performance Search Indexes
-- Trigram GIN index for partial-word, prefix, and fuzzy searches across titles
CREATE INDEX IF NOT EXISTS idx_properties_title_trgm 
    ON public.properties USING gin (title gin_trgm_ops);

-- Trigram GIN index for location, locality and city search
CREATE INDEX IF NOT EXISTS idx_properties_location_trgm 
    ON public.properties USING gin (location gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_properties_city_trgm 
    ON public.properties USING gin (city gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_properties_builder_trgm 
    ON public.properties USING gin (builder gin_trgm_ops);

-- B-Tree indexes with varchar_pattern_ops for lightning-fast prefix range scans (e.g. lower(col) LIKE 'prefix%')
CREATE INDEX IF NOT EXISTS idx_properties_title_lower_prefix 
    ON public.properties (lower(title) varchar_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_properties_city_lower_prefix 
    ON public.properties (lower(city) varchar_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_properties_locality_lower_prefix 
    ON public.properties (lower(locality) varchar_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_properties_type_lower_prefix 
    ON public.properties (lower(type) varchar_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_properties_builder_lower_prefix 
    ON public.properties (lower(builder) varchar_pattern_ops);

-- Fast B-Tree indexes for discrete filters
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties (city);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties (type);
CREATE INDEX IF NOT EXISTS idx_properties_bhk ON public.properties (bhk);
CREATE INDEX IF NOT EXISTS idx_properties_mode ON public.properties (mode);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties (status, is_deleted);
CREATE INDEX IF NOT EXISTS idx_properties_slug ON public.properties (slug);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active published properties
CREATE POLICY "Public properties are viewable by everyone" 
    ON public.properties FOR SELECT 
    USING (status = 'published' AND is_deleted = FALSE);

-- 5. Seed Real Property Data
INSERT INTO public.properties (
    id, title, slug, tag, badge, location, locality, city, state, type, 
    possession, builder, price, price_num, rent_price, rent_price_num, 
    mode, beds, bhk, baths, area, image, description, status, is_deleted
) VALUES
(
    1, 'The Courtyard Villa', 'the-courtyard-villa', 'Available', 'Verified Property',
    'Golf Course Extension, Gurugram', 'Golf Course Extension', 'Gurugram', 'Haryana', 'Luxury Villa & Estate',
    'Ready to Move', 'Studio Lotus', '₹4.80 Cr', 4.80, '₹2.80 Lakh/mo', 2.80,
    'both', '4 Beds', '4 BHK', '5 Baths', '4,800 sq.ft',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'Spacious home with an open courtyard, natural stone walls, wooden finish, and a private swimming pool.',
    'published', FALSE
),
(
    2, 'The Mountain Villa', 'the-mountain-villa', 'New Listing', 'Hillside Home',
    'Pine Ridge, Kasauli Hills', 'Pine Ridge', 'Kasauli Hills', 'Himachal Pradesh', 'Luxury Villa & Estate',
    'Ready to Move', 'Morphogenesis', '₹6.20 Cr', 6.20, '₹3.60 Lakh/mo', 3.60,
    'both', '5 Beds', '5 BHK', '6 Baths', '6,200 sq.ft',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    'Modern hill-view villa overlooking the Himalayan valley with a warm indoor sun deck.',
    'published', FALSE
),
(
    3, 'The Garden Villa', 'the-garden-villa', 'Available', 'Coastal Home',
    'Awas Beach Road, Alibaug', 'Awas Beach Road', 'Alibaug', 'Maharashtra', 'Luxury Villa & Estate',
    'Ready to Move', 'Samira Habitats', '₹5.40 Cr', 5.40, '₹3.10 Lakh/mo', 3.10,
    'both', '4 Beds', '4 BHK', '4 Baths', '5,400 sq.ft',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    'Eco-friendly modern home surrounded by peaceful coconut groves and green gardens.',
    'published', FALSE
),
(
    4, 'The Courtyard Apartment', 'the-courtyard-apartment', 'Exclusive', 'Modern Heritage',
    'Bodakdev, Ahmedabad', 'Bodakdev', 'Ahmedabad', 'Gujarat', 'Architectural Apartment',
    'Ready to Move', 'HCP Design & Project Management', '₹3.90 Cr', 3.90, '₹1.90 Lakh/mo', 1.90,
    'both', '4 Beds', '4 BHK', '4 Baths', '4,200 sq.ft',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
    'Modern designer apartment with clay lattice screens and a landscaped courtyard garden.',
    'published', FALSE
),
(
    5, 'The Horizon Penthouse', 'the-horizon-penthouse', 'New Listing', 'Sea-View Penthouse',
    'Worli Sea Face, Mumbai', 'Worli Sea Face', 'Mumbai', 'Maharashtra', 'Penthouse / Sky Villa',
    'Under Construction', 'Hafeez Contractor', '₹14.50 Cr', 14.50, '₹7.50 Lakh/mo', 7.50,
    'both', '5 Beds', '5 BHK', '6 Baths', '6,800 sq.ft',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
    'Luxury sea-view penthouse with high ceilings, private outdoor deck, and Italian marble floors.',
    'published', FALSE
),
(
    6, 'The Palm Villa', 'the-palm-villa', 'Available', 'Goa Heritage Villa',
    'Assagao, North Goa', 'Assagao', 'Goa', 'Goa', 'Luxury Villa & Estate',
    'Ready to Move', 'Tarun Tahiliani Homes', '₹7.20 Cr', 7.20, '₹4.20 Lakh/mo', 4.20,
    'both', '4 Beds', '4 BHK', '5 Baths', '5,600 sq.ft',
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
    'Restored classic Portuguese-style villa with natural stone walls, private swimming pool, and fruit gardens.',
    'published', FALSE
),
(
    7, 'The Imperial Heights', 'the-imperial-heights', 'Verified', 'Prime City Residence',
    'Sarabha Nagar, Ludhiana', 'Sarabha Nagar', 'Ludhiana', 'Punjab', 'Architectural Apartment',
    'Ready to Move', 'Hero Realty', '₹1.85 Cr', 1.85, '₹75,000/mo', 0.75,
    'both', '2 Beds', '2 BHK', '2 Baths', '1,850 sq.ft',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    'Bespoke modern 2 BHK apartment in prime Sarabha Nagar with open modular kitchen, wide balconies, and smart home fittings.',
    'published', FALSE
)
ON CONFLICT (id) DO NOTHING;
