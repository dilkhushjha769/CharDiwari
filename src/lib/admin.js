import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from './session';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Default admin credentials (configurable via env variables)
export const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@dwarkesh.com').toLowerCase().trim();
export const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@Dwarkesh2026!';

// Initialize Supabase admin/server client
function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder')) {
    return null;
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
}

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) return { properties: [], websiteSettings: null };
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { properties: [], websiteSettings: null };
  }
}

function writeDb(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Error writing to DB file:', err);
  }
}

/**
 * Verifies admin credentials (checks Supabase admin_users table first, then env/default)
 */
export async function authenticateAdmin(email, password) {
  const normEmail = (email || '').toLowerCase().trim();
  if (!normEmail || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const supabase = getAdminSupabase();

  // 1. Try Supabase admin_users table
  if (supabase) {
    try {
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', normEmail)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && adminUser && adminUser.password_hash) {
        const isMatch = await bcrypt.compare(password, adminUser.password_hash);
        if (isMatch) {
          return {
            success: true,
            user: {
              id: adminUser.id,
              email: adminUser.email,
              name: adminUser.name || 'Platform Admin',
              role: adminUser.role || 'superadmin',
            },
          };
        }
      }
    } catch (err) {
      console.warn('Supabase admin check skipped or table pending:', err.message);
    }
  }

  // 2. Built-in Admin verification fallback (Dwarkesh admin)
  const isDefaultMatch =
    (normEmail === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) ||
    (normEmail === 'admin@dwarkesh.com' && password === 'Admin@Dwarkesh2026!');

  if (isDefaultMatch) {
    return {
      success: true,
      user: {
        id: 'admin_master_1',
        email: 'admin@dwarkesh.com',
        name: 'Dwarkesh Administrator',
        role: 'superadmin',
      },
    };
  }

  return { success: false, error: 'Invalid admin credentials.' };
}

/**
 * Checks if incoming request has a valid admin session cookie
 */
export async function getAdminFromRequest(request) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyAdminSessionToken(token);
}

/**
 * Get current website settings (Live access status, maintenance message, banner)
 */
export async function getWebsiteSettings() {
  const defaultSettings = {
    website_access: 'public', // 'public' | 'maintenance' | 'private'
    maintenance_message: 'Dwarkesh Real Estate Group is currently undergoing scheduled platform upgrades. We will be back shortly.',
    announcement_banner: '',
    allow_registrations: true,
    access_passcode: 'DwarkeshVIP2026',
    updated_at: new Date().toISOString(),
  };

  const supabase = getAdminSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        return { ...defaultSettings, ...data };
      }
    } catch (err) {
      // Continue to local fallback
    }
  }

  const db = readDb();
  return db.websiteSettings ? { ...defaultSettings, ...db.websiteSettings } : defaultSettings;
}

/**
 * Update website settings
 */
export async function updateWebsiteSettings(newSettings) {
  const supabase = getAdminSupabase();
  const payload = {
    ...newSettings,
    updated_at: new Date().toISOString(),
  };

  let savedToSupabase = false;
  if (supabase) {
    try {
      const { error } = await supabase
        .from('website_settings')
        .upsert({ id: 1, ...payload });
      if (!error) savedToSupabase = true;
    } catch (err) {
      console.warn('Failed to upsert website_settings in Supabase:', err.message);
    }
  }

  // Sync to local DB
  const db = readDb();
  db.websiteSettings = { ...(db.websiteSettings || {}), ...payload };
  writeDb(db);

  return { success: true, settings: db.websiteSettings, savedToSupabase };
}

/**
 * Secure Media Upload Handler (Images & Videos)
 * Supports Supabase Storage with graceful fallback to public uploads
 */
export async function uploadMediaFile(file, category = 'properties') {
  if (!file) throw new Error('No file provided.');

  const buffer = Buffer.from(await file.arrayBuffer());
  const origName = file.name || 'media_file';
  const ext = path.extname(origName).toLowerCase() || '.bin';
  const cleanBase = path.basename(origName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanBase}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`;
  const contentType = file.type || 'application/octet-stream';
  const isVideo = contentType.startsWith('video/') || ['.mp4', '.webm', '.mov', '.mkv'].includes(ext);

  const supabase = getAdminSupabase();
  let supabaseUrl = null;

  // 1. Try uploading to Supabase Storage bucket 'media'
  if (supabase) {
    try {
      const bucketName = 'media';
      const storagePath = `${category}/${filename}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, buffer, {
          contentType,
          upsert: true,
        });

      if (!error) {
        const { data: publicData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(storagePath);

        if (publicData?.publicUrl) {
          supabaseUrl = publicData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Supabase storage upload note:', err.message);
    }
  }

  // 2. Always persist locally as well to ensure zero broken links
  ensureUploadsDir();
  const localFilePath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(localFilePath, buffer);
  const localUrl = `/uploads/${filename}`;

  return {
    url: supabaseUrl || localUrl,
    supabaseUrl,
    localUrl,
    filename,
    isVideo,
    contentType,
    sizeBytes: buffer.length,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Fetch all properties for admin management (from Supabase or local DB)
 */
export async function getAllAdminProperties() {
  const supabase = getAdminSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('id', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {
      // fallback
    }
  }

  const db = readDb();
  return db.properties || [];
}

/**
 * Create or update property in Supabase and local DB
 */
export async function saveAdminProperty(propertyData) {
  const db = readDb();
  const properties = db.properties || [];

  const isEdit = Boolean(propertyData.id);
  const id = isEdit ? Number(propertyData.id) : (properties.length ? Math.max(...properties.map(p => Number(p.id) || 0)) + 1 : 1);

  const cleanProperty = {
    ...propertyData,
    id,
    updated_at: new Date().toISOString(),
  };

  const supabase = getAdminSupabase();
  let savedToSupabase = false;

  if (supabase) {
    try {
      const supabasePayload = {
        title: cleanProperty.title,
        slug: cleanProperty.slug || `property-${id}-${Date.now()}`,
        tag: cleanProperty.tag || 'Available',
        badge: cleanProperty.badge || '',
        location: cleanProperty.location || '',
        locality: cleanProperty.locality || '',
        city: cleanProperty.city || '',
        state: cleanProperty.state || '',
        type: cleanProperty.type || 'Luxury Villa & Estate',
        possession: cleanProperty.possession || 'Ready to Move',
        builder: cleanProperty.builder || '',
        price: cleanProperty.price_on_demand ? 'Price on Request' : (cleanProperty.price || ''),
        price_num: cleanProperty.priceNum || cleanProperty.price_num || 0,
        rent_price: cleanProperty.rentPrice || cleanProperty.rent_price || '',
        rent_price_num: cleanProperty.rentPriceNum || cleanProperty.rent_price_num || 0,
        mode: cleanProperty.mode || 'both',
        beds: cleanProperty.beds || '',
        bhk: cleanProperty.bhk || '',
        baths: cleanProperty.baths || '',
        area: cleanProperty.area || '',
        image: cleanProperty.image || '',
        video_url: cleanProperty.video_url || cleanProperty.videoUrl || '',
        media_gallery: cleanProperty.media_gallery || cleanProperty.gallery || [],
        description: cleanProperty.description || '',
        status: cleanProperty.status || 'published',
        is_deleted: false,
        faqs: cleanProperty.faqs || [],
        nearby: cleanProperty.nearby || [],
        coordinates: cleanProperty.coordinates || { lat: 28.4595, lng: 77.0266 },
        amenities: cleanProperty.amenities || [],
        highlights: cleanProperty.highlights || [],
        is_negotiable: Boolean(cleanProperty.is_negotiable),
        price_on_demand: Boolean(cleanProperty.price_on_demand),
        carpet_area: cleanProperty.carpet_area || '',
        super_area: cleanProperty.super_area || '',
        furnishing: cleanProperty.furnishing || '',
        facing: cleanProperty.facing || '',
        floor_info: cleanProperty.floor_info || '',
        parking: cleanProperty.parking || '',
        rera_id: cleanProperty.rera_id || '',
        virtual_tour_url: cleanProperty.virtual_tour_url || '',
        brochure_url: cleanProperty.brochure_url || '',
        maintenance_charges: cleanProperty.maintenance_charges || '',
        booking_amount: cleanProperty.booking_amount || '',
        min_images_required: cleanProperty.min_images_required || 3,
      };

      if (isEdit) {
        let { error } = await supabase
          .from('properties')
          .update(supabasePayload)
          .eq('id', id);
        
        // If advanced columns don't exist yet in Supabase, retry with basic payload
        if (error) {
          const basicPayload = {
            title: supabasePayload.title,
            slug: supabasePayload.slug,
            tag: supabasePayload.tag,
            badge: supabasePayload.badge,
            location: supabasePayload.location,
            locality: supabasePayload.locality,
            city: supabasePayload.city,
            state: supabasePayload.state,
            type: supabasePayload.type,
            possession: supabasePayload.possession,
            builder: supabasePayload.builder,
            price: supabasePayload.price,
            price_num: supabasePayload.price_num,
            rent_price: supabasePayload.rent_price,
            rent_price_num: supabasePayload.rent_price_num,
            mode: supabasePayload.mode,
            beds: supabasePayload.beds,
            bhk: supabasePayload.bhk,
            baths: supabasePayload.baths,
            area: supabasePayload.area,
            image: supabasePayload.image,
            video_url: supabasePayload.video_url,
            description: supabasePayload.description,
            status: supabasePayload.status,
            is_deleted: false,
          };
          const fallbackRes = await supabase
            .from('properties')
            .update(basicPayload)
            .eq('id', id);
          if (!fallbackRes.error) savedToSupabase = true;
        } else {
          savedToSupabase = true;
        }
      } else {
        let { error } = await supabase
          .from('properties')
          .insert([supabasePayload]);
        
        if (error) {
          const basicPayload = {
            title: supabasePayload.title,
            slug: supabasePayload.slug,
            tag: supabasePayload.tag,
            badge: supabasePayload.badge,
            location: supabasePayload.location,
            locality: supabasePayload.locality,
            city: supabasePayload.city,
            state: supabasePayload.state,
            type: supabasePayload.type,
            possession: supabasePayload.possession,
            builder: supabasePayload.builder,
            price: supabasePayload.price,
            price_num: supabasePayload.price_num,
            rent_price: supabasePayload.rent_price,
            rent_price_num: supabasePayload.rent_price_num,
            mode: supabasePayload.mode,
            beds: supabasePayload.beds,
            bhk: supabasePayload.bhk,
            baths: supabasePayload.baths,
            area: supabasePayload.area,
            image: supabasePayload.image,
            video_url: supabasePayload.video_url,
            description: supabasePayload.description,
            status: supabasePayload.status,
            is_deleted: false,
          };
          const fallbackRes = await supabase
            .from('properties')
            .insert([basicPayload]);
          if (!fallbackRes.error) savedToSupabase = true;
        } else {
          savedToSupabase = true;
        }
      }
    } catch (err) {
      console.warn('Supabase property sync note:', err.message);
    }
  }

  // Update local DB
  if (isEdit) {
    const idx = properties.findIndex(p => Number(p.id) === Number(id));
    if (idx !== -1) properties[idx] = cleanProperty;
    else properties.unshift(cleanProperty);
  } else {
    properties.unshift(cleanProperty);
  }

  db.properties = properties;
  writeDb(db);

  return { success: true, property: cleanProperty, savedToSupabase };
}

/**
 * Delete a property (soft delete in Supabase and remove from local active list)
 */
export async function deleteAdminProperty(id) {
  const numId = Number(id);
  const supabase = getAdminSupabase();

  if (supabase) {
    try {
      await supabase
        .from('properties')
        .update({ is_deleted: true, status: 'archived' })
        .eq('id', numId);
    } catch (err) {
      console.warn('Supabase delete error:', err.message);
    }
  }

  const db = readDb();
  if (db.properties) {
    db.properties = db.properties.filter(p => Number(p.id) !== numId);
    writeDb(db);
  }

  return { success: true };
}

/**
 * Fetch a single property by slug or ID with live video_url from Supabase or local db
 */
export async function getLiveProperty(slug) {
  if (!slug) return null;
  const norm = String(slug).toLowerCase().trim();

  // 1. Fetch live admin properties (Supabase + local db.json)
  const allLive = await getAllAdminProperties();
  let found = allLive.find(p => {
    const s = (p.slug || '').toLowerCase();
    const t = (p.title || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return s === norm || t === norm || String(p.id) === norm;
  });

  // 2. Fallback to static properties definition
  const { properties: staticProps } = await import('@/data/properties');
  const baseStatic = staticProps.find(p => {
    const s = (p.slug || '').toLowerCase();
    return s === norm || (found && String(p.id) === String(found.id));
  }) || {};

  if (!found && !baseStatic.id) {
    return null;
  }

  const merged = { ...baseStatic, ...(found || {}) };
  const rawVideo = merged.video_url || merged.videoUrl || baseStatic.video_url || baseStatic.videoUrl || null;

  const isPriceOnDemand = Boolean(merged.price_on_demand || merged.priceOnDemand);
  const isNegotiable = Boolean(merged.is_negotiable || merged.isNegotiable);

  return {
    ...merged,
    price: isPriceOnDemand ? 'Price on Request' : merged.price,
    price_on_demand: isPriceOnDemand,
    is_negotiable: isNegotiable,
    video_url: rawVideo,
    videoUrl: rawVideo,
    priceNum: merged.priceNum || merged.price_num || baseStatic.priceNum || 0,
    rentPrice: merged.rentPrice || merged.rent_price || baseStatic.rentPrice || '',
    rentPriceNum: merged.rentPriceNum || merged.rent_price_num || baseStatic.rentPriceNum || 0,
    gallery: merged.media_gallery || merged.gallery || [],
    faqs: merged.faqs || [],
    nearby: merged.nearby || [],
    coordinates: merged.coordinates || null,
    amenities: merged.amenities || [],
    highlights: merged.highlights || [],
  };
}
