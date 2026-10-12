-- ====================================================================
-- Dwarkesh Anonymous-to-Authenticated User Activity Migration
-- ====================================================================

-- 1. Create User Activity Table
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- NULL for anonymous activity, set to Supabase user ID upon signup/login
    visitor_id VARCHAR(100) NOT NULL, -- First-party anonymous visitor identifier
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('view', 'search', 'shortlist', 'contact')),
    property_id INTEGER REFERENCES public.properties(id) ON DELETE SET NULL,
    property_slug VARCHAR(255),
    property_title VARCHAR(255),
    property_location VARCHAR(255),
    property_price VARCHAR(100),
    property_image TEXT,
    category_name VARCHAR(100),
    search_query TEXT,
    search_filters JSONB DEFAULT '{}'::jsonb,
    contact_method VARCHAR(50), -- 'whatsapp' | 'phone' | 'enquiry'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for High-Performance Activity Feeds & Migration Lookups
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id 
    ON public.user_activity(user_id, activity_type, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_visitor_id 
    ON public.user_activity(visitor_id, activity_type, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_created_at 
    ON public.user_activity(created_at DESC);

-- 3. Unique Constraints for Clean Deduplication
-- When a user views or shortlists a property multiple times, updated_at is refreshed without duplicate cards
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_user_prop
    ON public.user_activity (user_id, property_id, activity_type)
    WHERE user_id IS NOT NULL AND property_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_visitor_prop
    ON public.user_activity (visitor_id, property_id, activity_type)
    WHERE user_id IS NULL AND property_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_user_search
    ON public.user_activity (user_id, lower(search_query), activity_type)
    WHERE user_id IS NOT NULL AND activity_type = 'search';

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_visitor_search
    ON public.user_activity (visitor_id, lower(search_query), activity_type)
    WHERE user_id IS NULL AND activity_type = 'search';

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can view only their own activity
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity;
CREATE POLICY "Users can view own activity"
    ON public.user_activity FOR SELECT
    USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
        (user_id IS NULL)
    );

-- Policy 2: Allow inserting activity
DROP POLICY IF EXISTS "Allow inserting activity" ON public.user_activity;
CREATE POLICY "Allow inserting activity"
    ON public.user_activity FOR INSERT
    WITH CHECK (TRUE);

-- Policy 3: Users can update their own activity
DROP POLICY IF EXISTS "Users can update own activity" ON public.user_activity;
CREATE POLICY "Users can update own activity"
    ON public.user_activity FOR UPDATE
    USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
        (user_id IS NULL)
    );

-- Policy 4: Users can delete their own activity
DROP POLICY IF EXISTS "Users can delete own activity" ON public.user_activity;
CREATE POLICY "Users can delete own activity"
    ON public.user_activity FOR DELETE
    USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
