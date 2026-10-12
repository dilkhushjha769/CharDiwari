# PostHog Warehouse Source Setup

Created 0 of 1 detected sources in PostHog. The Supabase credential prompt was cancelled, so the source needs browser setup.

## Changes made

- Confirmed that `SUPABASE_URL` and `DATABASE_URL` are not set in the project's environment files.
- No application code or environment configuration was changed.
- Supabase was not created in PostHog because no database credentials were provided.

## Files created

- `posthog-warehouse-report.md` — this setup report.

## Manual step

Open [PostHog’s Supabase source setup](https://eu.i.posthog.com/project/303531/data-warehouse/new-source?kind=Supabase&utm_source=wizard&utm_campaign=warehouse-source) and enter the Supabase database connection details. Use the Session pooler connection and the database password, not an anon/service-role key.
