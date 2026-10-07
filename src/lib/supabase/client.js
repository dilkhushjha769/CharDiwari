import { createBrowserClient } from '@supabase/ssr';

// Default Supabase project URL & Anon key configuration
// These can be supplied via .env.local:
// NEXT_PUBLIC_SUPABASE_URL=...
// NEXT_PUBLIC_SUPABASE_ANON_KEY=...
export const DEFAULT_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const DEFAULT_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let cachedClient = null;
let lastUsedConfig = '';

/**
 * Get active Supabase configuration (checks environment first, then localStorage in browser)
 */
export function getSupabaseConfig() {
  let url = DEFAULT_SUPABASE_URL;
  let anonKey = DEFAULT_SUPABASE_ANON_KEY;

  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('supabase_project_url');
    const localKey = localStorage.getItem('supabase_anon_key');
    if (localUrl && localKey) {
      url = localUrl;
      anonKey = localKey;
    }
  }

  const isConfigured = Boolean(
    url && 
    anonKey && 
    url.startsWith('https://') && 
    !url.includes('your-project-id') &&
    anonKey.length > 20
  );

  return { url, anonKey, isConfigured };
}

/**
 * Saves custom Supabase configuration to localStorage for client-side persistence
 */
export function setSupabaseConfig(url, anonKey) {
  if (typeof window !== 'undefined') {
    if (url && anonKey) {
      localStorage.setItem('supabase_project_url', url.trim());
      localStorage.setItem('supabase_anon_key', anonKey.trim());
    } else {
      localStorage.removeItem('supabase_project_url');
      localStorage.removeItem('supabase_anon_key');
    }
    cachedClient = null; // Invalidate client cache
  }
}

/**
 * Returns a configured Supabase client for browser usage
 */
export function getSupabaseClient() {
  const { url, anonKey, isConfigured } = getSupabaseConfig();

  const configKey = `${url}:${anonKey}`;
  if (cachedClient && lastUsedConfig === configKey) {
    return { client: cachedClient, isConfigured };
  }

  // If not configured with a real project, we use a placeholder client or return null
  const clientUrl = isConfigured ? url : (url || 'https://placeholder-project.supabase.co');
  const clientKey = isConfigured ? anonKey : (anonKey || 'placeholder-anon-key-00000000000000000000000000000000000000');

  try {
    cachedClient = createBrowserClient(clientUrl, clientKey);
    lastUsedConfig = configKey;

    // Synchronize session cookie for middleware/proxy and route guards
    if (typeof window !== 'undefined' && cachedClient) {
      cachedClient.auth.onAuthStateChange((event, session) => {
        if (session) {
          document.cookie = 'chardiwari_session=true; path=/; max-age=604800; SameSite=Lax';
        } else if (event === 'SIGNED_OUT') {
          document.cookie = 'chardiwari_session=; path=/; max-age=0; SameSite=Lax';
        }
      });
    }

    return { client: cachedClient, isConfigured };
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return { client: null, isConfigured: false, error: err };
  }
}
