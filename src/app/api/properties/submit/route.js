import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { saveAdminProperty } from '@/lib/admin';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) return { properties: [], propertySubmissions: [] };
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { properties: [], propertySubmissions: [] };
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

// Slugify helper
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Coordinate fallbacks by city
const CITY_COORDINATES = {
  gurugram: { lat: 28.4595, lng: 77.0266 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  goa: { lat: 15.2993, lng: 74.124 },
  'delhi ncr': { lat: 28.6139, lng: 77.209 },
  delhi: { lat: 28.6139, lng: 77.209 },
  noida: { lat: 28.5355, lng: 77.391 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  pune: { lat: 18.5204, lng: 73.8567 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  alibaug: { lat: 18.6414, lng: 72.8722 },
  'kasauli hills': { lat: 30.9013, lng: 76.9649 },
  kasauli: { lat: 30.9013, lng: 76.9649 },
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { seller = {}, property = {} } = body;

    // 1. Validate required seller contact fields
    const sellerName = (seller.name || '').trim();
    const rawPhone = (seller.phone || '').trim();
    const cleanPhone = rawPhone.replace(/[^\d+]/g, '');

    if (!sellerName) {
      return NextResponse.json(
        { error: 'Your name is required so our team knows who to address.' },
        { status: 400 }
      );
    }

    if (!cleanPhone || cleanPhone.replace(/[^\d]/g, '').length < 10) {
      return NextResponse.json(
        { error: 'A valid 10-digit mobile phone number is required to review your listing.' },
        { status: 400 }
      );
    }

    // 2. Validate property information
    const propCity = (property.city || '').trim();
    const propLocality = (property.locality || property.location || '').trim();
    const propType = (property.type || 'Luxury Villa & Estate').trim();
    const propPrice = (property.price || '').trim();

    if (!propCity) {
      return NextResponse.json({ error: 'Please specify the city where the property is located.' }, { status: 400 });
    }

    if (!propLocality) {
      return NextResponse.json({ error: 'Please specify the locality, sector, or address.' }, { status: 400 });
    }

    if (!propPrice && !property.price_on_demand) {
      return NextResponse.json({ error: 'Please specify the expected price or rent.' }, { status: 400 });
    }

    // 3. Assemble titles and location
    const defaultTitle = `${property.bhk ? property.bhk + ' ' : ''}${propType} in ${propLocality}, ${propCity}`;
    const title = (property.title || '').trim() || defaultTitle;
    const fullLocation = property.location
      ? property.location.includes(propCity) ? property.location : `${property.location}, ${propCity}`
      : property.address
      ? `${property.address}, ${propLocality}, ${propCity}`
      : `${propLocality}, ${propCity}`;

    // Generate submission reference
    const submissionRef = `DW-SUB-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();

    const db = readDb();
    const existingProps = db.properties || [];
    const newId = existingProps.length
      ? Math.max(...existingProps.map((p) => Number(p.id) || 0)) + 1
      : 1001;

    const baseSlug = slugify(title);
    const slug = `${baseSlug}-${newId}`;

    // Get city coordinate defaults
    const cityKey = propCity.toLowerCase();
    const coords = CITY_COORDINATES[cityKey] || { lat: 28.4595, lng: 77.0266 };

    // Default luxury imagery if none uploaded
    const images = Array.isArray(property.images) && property.images.length > 0
      ? property.images
      : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'];

    const heroImage = property.image || images[0];

    // Structured property record
    const propertyRecord = {
      id: newId,
      slug,
      submission_ref: submissionRef,
      title,
      price: property.price_on_demand ? 'Price on Request' : propPrice,
      price_num: Number(property.price_num) || 0,
      priceNum: Number(property.price_num) || 0,
      rent_price: property.rent_price || '',
      rentPrice: property.rent_price || '',
      mode: property.purpose === 'rent' ? 'rent' : 'buy',
      type: propType,
      location: fullLocation,
      locality: propLocality,
      city: propCity,
      state: property.state || '',
      possession: property.possession || 'Ready to Move',
      builder: property.builder || sellerName,
      beds: property.beds || property.bhk || '3 BHK',
      bhk: property.bhk || '3 BHK',
      baths: property.baths || '3 Baths',
      area: property.area || '2,400 sq.ft',
      carpet_area: property.carpet_area || '',
      super_area: property.area || '',
      furnishing: property.furnishing || 'Semi-Furnished',
      facing: property.facing || 'East',
      floor_info: property.floor_info || '',
      parking: property.parking || 'Covered Parking',
      tag: 'Under Review',
      badge: 'Owner Submission',
      image: heroImage,
      gallery: Array.isArray(property.gallery) && property.gallery.length > 0 ? property.gallery : images,
      media_gallery: Array.isArray(property.gallery) && property.gallery.length > 0 ? property.gallery : images,
      video_url: property.video_url || '',
      description: property.description || '',
      amenities: Array.isArray(property.amenities) ? property.amenities : [],
      highlights: Array.isArray(property.highlights) && property.highlights.length > 0 ? property.highlights : [
        `${propType} in prime ${propLocality}`,
        property.furnishing ? `${property.furnishing} condition` : 'Prime luxury finish',
        property.possession ? property.possession : 'Immediate registration',
      ],
      nearby: Array.isArray(property.nearby) ? property.nearby : [],
      faqs: Array.isArray(property.faqs) ? property.faqs : [],
      coordinates: property.coordinates && property.coordinates.lat ? property.coordinates : coords,
      maintenance_charges: property.maintenance_charges || '',
      booking_amount: property.booking_amount || '',
      rera_id: property.rera_id || '',
      is_negotiable: Boolean(property.is_negotiable),
      price_on_demand: Boolean(property.price_on_demand),
      status: 'pending_review', // IMPORTANT: pending review by admin
      seller: {
        name: sellerName,
        phone: cleanPhone,
        email: (seller.email || '').trim(),
        role: seller.role || 'owner',
        whatsapp_consent: seller.whatsapp_consent !== false,
        preferred_contact: seller.preferred_contact || 'anytime',
      },
      seller_name: sellerName,
      seller_phone: cleanPhone,
      seller_email: (seller.email || '').trim(),
      seller_role: seller.role || 'owner',
      created_at: nowIso,
      updated_at: nowIso,
      submitted_at: nowIso,
    };

    // 4. Save into db.properties & db.propertySubmissions
    existingProps.unshift(propertyRecord);
    db.properties = existingProps;

    if (!Array.isArray(db.propertySubmissions)) {
      db.propertySubmissions = [];
    }
    db.propertySubmissions.unshift({
      submission_ref: submissionRef,
      property_id: newId,
      status: 'pending_review',
      submitted_at: nowIso,
      seller: propertyRecord.seller,
      property: {
        id: newId,
        title,
        price: propertyRecord.price,
        location: fullLocation,
        city: propCity,
        locality: propLocality,
        type: propType,
        images,
      },
    });

    writeDb(db);

    // 5. Try syncing to Supabase if available (graceful fallback)
    try {
      await saveAdminProperty(propertyRecord);
    } catch (syncErr) {
      console.warn('Note: Supabase sync deferred for property submission:', syncErr.message);
    }

    return NextResponse.json({
      success: true,
      submission_ref: submissionRef,
      property_id: newId,
      property: {
        id: newId,
        title: propertyRecord.title,
        price: propertyRecord.price,
        location: propertyRecord.location,
        status: propertyRecord.status,
      },
      message: 'Property successfully submitted for admin review.',
    });
  } catch (error) {
    console.error('Error submitting property for review:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while submitting your property.' },
      { status: 500 }
    );
  }
}
