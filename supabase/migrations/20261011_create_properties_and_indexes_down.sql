-- ====================================================================
-- Dwarkesh Real Estate Properties & Search Optimization Rollback (Down Migration)
-- ====================================================================

-- 1. Drop RLS Policies
DROP POLICY IF EXISTS "Public properties are viewable by everyone" ON public.properties;

-- 2. Drop Indexes
DROP INDEX IF EXISTS public.idx_properties_title_trgm;
DROP INDEX IF EXISTS public.idx_properties_location_trgm;
DROP INDEX IF EXISTS public.idx_properties_city_trgm;
DROP INDEX IF EXISTS public.idx_properties_builder_trgm;

DROP INDEX IF EXISTS public.idx_properties_title_lower_prefix;
DROP INDEX IF EXISTS public.idx_properties_city_lower_prefix;
DROP INDEX IF EXISTS public.idx_properties_locality_lower_prefix;
DROP INDEX IF EXISTS public.idx_properties_type_lower_prefix;
DROP INDEX IF EXISTS public.idx_properties_builder_lower_prefix;

DROP INDEX IF EXISTS public.idx_properties_city;
DROP INDEX IF EXISTS public.idx_properties_type;
DROP INDEX IF EXISTS public.idx_properties_bhk;
DROP INDEX IF EXISTS public.idx_properties_mode;
DROP INDEX IF EXISTS public.idx_properties_status;
DROP INDEX IF EXISTS public.idx_properties_slug;

-- 3. Drop Properties Table
DROP TABLE IF EXISTS public.properties;

-- 4. Note: pg_trgm extension can be kept if used elsewhere, or dropped conditionally:
-- DROP EXTENSION IF EXISTS pg_trgm;
