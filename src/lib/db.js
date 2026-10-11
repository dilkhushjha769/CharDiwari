import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export const defaultProperties = [
  {
    id: 1,
    tag: 'Available',
    badge: 'Verified Property',
    title: 'The Courtyard Villa',
    slug: 'the-courtyard-villa',
    location: 'Golf Course Extension, Gurugram',
    locality: 'Golf Course Extension',
    city: 'Gurugram',
    state: 'Haryana',
    type: 'Luxury Villa & Estate',
    possession: 'Ready to Move',
    builder: 'Studio Lotus',
    price: '₹4.80 Cr',
    priceNum: 4.8,
    rentPrice: '₹2.80 Lakh/mo',
    rentPriceNum: 2.8,
    mode: 'both',
    beds: '4 Beds',
    bhk: '4 BHK',
    baths: '5 Baths',
    area: '4,800 sq.ft',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    description:
      'Spacious home with an open courtyard, natural stone walls, wooden finish, and a private swimming pool.',
    status: 'published',
    isDeleted: false,
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 2,
    tag: 'New Listing',
    badge: 'Hillside Home',
    title: 'The Mountain Villa',
    slug: 'the-mountain-villa',
    location: 'Pine Ridge, Kasauli Hills',
    locality: 'Pine Ridge',
    city: 'Kasauli Hills',
    state: 'Himachal Pradesh',
    type: 'Luxury Villa & Estate',
    possession: 'Ready to Move',
    builder: 'Morphogenesis',
    price: '₹6.20 Cr',
    priceNum: 6.2,
    rentPrice: '₹3.60 Lakh/mo',
    rentPriceNum: 3.6,
    mode: 'both',
    beds: '5 Beds',
    bhk: '5 BHK',
    baths: '6 Baths',
    area: '6,200 sq.ft',
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    description:
      'Modern hill-view villa overlooking the Himalayan valley with a warm indoor sun deck.',
    status: 'published',
    isDeleted: false,
    createdAt: '2026-01-12T10:00:00.000Z',
  },
  {
    id: 3,
    tag: 'Available',
    badge: 'Coastal Home',
    title: 'The Garden Villa',
    slug: 'the-garden-villa',
    location: 'Awas Beach Road, Alibaug',
    locality: 'Awas Beach Road',
    city: 'Alibaug',
    state: 'Maharashtra',
    type: 'Luxury Villa & Estate',
    possession: 'Ready to Move',
    builder: 'Samira Habitats',
    price: '₹5.40 Cr',
    priceNum: 5.4,
    rentPrice: '₹3.10 Lakh/mo',
    rentPriceNum: 3.1,
    mode: 'both',
    beds: '4 Beds',
    bhk: '4 BHK',
    baths: '4 Baths',
    area: '5,400 sq.ft',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    description:
      'Eco-friendly modern home surrounded by peaceful coconut groves and green gardens.',
    status: 'published',
    isDeleted: false,
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 4,
    tag: 'Exclusive',
    badge: 'Modern Heritage',
    title: 'The Courtyard Apartment',
    slug: 'the-courtyard-apartment',
    location: 'Bodakdev, Ahmedabad',
    locality: 'Bodakdev',
    city: 'Ahmedabad',
    state: 'Gujarat',
    type: 'Architectural Apartment',
    possession: 'Ready to Move',
    builder: 'HCP Design & Project Management',
    price: '₹3.90 Cr',
    priceNum: 3.9,
    rentPrice: '₹1.90 Lakh/mo',
    rentPriceNum: 1.9,
    mode: 'both',
    beds: '4 Beds',
    bhk: '4 BHK',
    baths: '4 Baths',
    area: '4,200 sq.ft',
    image:
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
    description:
      'Modern designer apartment with clay lattice screens and a landscaped courtyard garden.',
    status: 'published',
    isDeleted: false,
    createdAt: '2026-01-18T10:00:00.000Z',
  },
  {
    id: 5,
    tag: 'New Listing',
    badge: 'Sea-View Penthouse',
    title: 'The Horizon Penthouse',
    slug: 'the-horizon-penthouse',
    location: 'Worli Sea Face, Mumbai',
    locality: 'Worli Sea Face',
    city: 'Mumbai',
    state: 'Maharashtra',
    type: 'Penthouse / Sky Villa',
    possession: 'Under Construction',
    builder: 'Hafeez Contractor',
    price: '₹14.50 Cr',
    priceNum: 14.5,
    rentPrice: '₹7.50 Lakh/mo',
    rentPriceNum: 7.5,
    mode: 'both',
    beds: '5 Beds',
    bhk: '5 BHK',
    baths: '6 Baths',
    area: '6,800 sq.ft',
    image:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
    description:
      'Luxury sea-view penthouse with high ceilings, private outdoor deck, and Italian marble floors.',
    status: 'published',
    isDeleted: false,
    createdAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 6,
    tag: 'Available',
    badge: 'Goa Heritage Villa',
    title: 'The Palm Villa',
    slug: 'the-palm-villa',
    location: 'Assagao, North Goa',
    locality: 'Assagao',
    city: 'Goa',
    state: 'Goa',
    type: 'Luxury Villa & Estate',
    possession: 'Ready to Move',
    builder: 'Tarun Tahiliani Homes',
    price: '₹7.20 Cr',
    priceNum: 7.2,
    rentPrice: '₹4.20 Lakh/mo',
    rentPriceNum: 4.2,
    mode: 'both',
    beds: '4 Beds',
    bhk: '4 BHK',
    baths: '5 Baths',
    area: '5,600 sq.ft',
    image:
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
    description:
      'Restored classic Portuguese-style villa with natural stone walls, private swimming pool, and fruit gardens.',
    status: 'published',
    isDeleted: false,
    createdAt: '2026-01-22T10:00:00.000Z',
  },
  {
    id: 7,
    tag: 'Verified',
    badge: 'Prime City Residence',
    title: 'The Imperial Heights',
    slug: 'the-imperial-heights',
    location: 'Sarabha Nagar, Ludhiana',
    locality: 'Sarabha Nagar',
    city: 'Ludhiana',
    state: 'Punjab',
    type: 'Architectural Apartment',
    possession: 'Ready to Move',
    builder: 'Hero Realty',
    price: '₹1.85 Cr',
    priceNum: 1.85,
    rentPrice: '₹75,000/mo',
    rentPriceNum: 0.75,
    mode: 'both',
    beds: '2 Beds',
    bhk: '2 BHK',
    baths: '2 Baths',
    area: '1,850 sq.ft',
    image:
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    description:
      'Bespoke modern 2 BHK apartment in prime Sarabha Nagar with open modular kitchen, wide balconies, and smart home fittings.',
    status: 'published',
    isDeleted: false,
    createdAt: '2026-01-25T10:00:00.000Z',
  },
];

// In-memory query cache for instant autocomplete responses with TTL
const searchCache = new Map();
const SEARCH_CACHE_TTL_MS = 60 * 1000;
const MAX_SEARCH_CACHE_ITEMS = 300;

function clearSearchCache() {
  searchCache.clear();
}

function getFromSearchCache(key) {
  const item = searchCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    searchCache.delete(key);
    return null;
  }
  return item.data;
}

function saveToSearchCache(key, data) {
  if (searchCache.size >= MAX_SEARCH_CACHE_ITEMS) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
  searchCache.set(key, {
    data,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  });
}

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      otps: [],
      rateLimits: {},
      properties: defaultProperties,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

function readDb() {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    let dirty = false;
    if (!data.properties || !Array.isArray(data.properties) || data.properties.length === 0) {
      data.properties = defaultProperties;
      dirty = true;
    }
    if (dirty) {
      writeDb(data);
    }
    return data;
  } catch (err) {
    console.error('Error reading DB, resetting structure:', err);
    return { users: [], otps: [], rateLimits: {}, properties: defaultProperties };
  }
}

function writeDb(data) {
  ensureDbFile();
  const tmpFile = `${DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
  clearSearchCache();
}

// User operations
export function findUserByEmail(email) {
  if (!email) return null;
  const db = readDb();
  const normalized = email.toLowerCase().trim();
  return db.users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export function findUserById(id) {
  if (!id) return null;
  const db = readDb();
  return db.users.find((u) => u.id === id) || null;
}

export function createUser({ email, name, passwordHash = null, provider = 'credentials', avatarUrl = null }) {
  const db = readDb();
  const normalized = email.toLowerCase().trim();

  const existing = db.users.find((u) => u.email.toLowerCase() === normalized);
  if (existing) {
    throw new Error('User already exists');
  }

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    email: normalized,
    name: name?.trim() || normalized.split('@')[0],
    passwordHash,
    provider,
    avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || normalized)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDb(db);
  return newUser;
}

export function updateUser(id, updates) {
  const db = readDb();
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  db.users[index] = {
    ...db.users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeDb(db);
  return db.users[index];
}

export function updateUserPassword(email, newPasswordHash) {
  const db = readDb();
  const normalized = email.toLowerCase().trim();
  const index = db.users.findIndex((u) => u.email.toLowerCase() === normalized);
  if (index === -1) return null;

  db.users[index].passwordHash = newPasswordHash;
  db.users[index].updatedAt = new Date().toISOString();
  writeDb(db);
  return db.users[index];
}

// OTP Operations
export function saveOtp({ email, type, otpHash, tempSignupData = null, expiresAt }) {
  const db = readDb();
  const normalized = email.toLowerCase().trim();

  // Remove existing OTP for this email & type
  db.otps = db.otps.filter((o) => !(o.email.toLowerCase() === normalized && o.type === type));

  const otpRecord = {
    id: `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normalized,
    type, // 'signup' | 'reset'
    otpHash,
    tempSignupData,
    attempts: 0,
    maxAttempts: 5,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  db.otps.push(otpRecord);
  writeDb(db);
  return otpRecord;
}

export function getOtp(email, type) {
  const db = readDb();
  const normalized = email.toLowerCase().trim();
  return db.otps.find((o) => o.email.toLowerCase() === normalized && o.type === type) || null;
}

export function incrementOtpAttempt(email, type) {
  const db = readDb();
  const normalized = email.toLowerCase().trim();
  const record = db.otps.find((o) => o.email.toLowerCase() === normalized && o.type === type);
  if (!record) return null;

  record.attempts = (record.attempts || 0) + 1;
  writeDb(db);
  return record;
}

export function deleteOtp(email, type) {
  const db = readDb();
  const normalized = email.toLowerCase().trim();
  db.otps = db.otps.filter((o) => !(o.email.toLowerCase() === normalized && o.type === type));
  writeDb(db);
}

// Rate Limiting Persistence
export function getRateLimitRecord(key) {
  const db = readDb();
  return db.rateLimits?.[key] || null;
}

export function setRateLimitRecord(key, record) {
  const db = readDb();
  if (!db.rateLimits) db.rateLimits = {};
  db.rateLimits[key] = record;
  writeDb(db);
}

export function clearRateLimitRecord(key) {
  const db = readDb();
  if (db.rateLimits && db.rateLimits[key]) {
    delete db.rateLimits[key];
    writeDb(db);
  }
}

// -------------------------------------------------------------
// Property Operations & Production Search Autocomplete Engine
// -------------------------------------------------------------

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Normalizes query string and tokenizes into search terms
 */
function normalizeQuery(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\t\n]+/g, ' ');
}

/**
 * Calculates search relevance score (0 = no match, up to 100+ = perfect match)
 * Supports exact match, prefix match, word-boundary match, and token-level multiword match.
 */
function calculateSearchScore(text, normalizedQuery, queryTokens) {
  if (!text || !normalizedQuery) return 0;
  const lower = String(text).toLowerCase().trim();

  // 1. Exact match
  if (lower === normalizedQuery) return 100;

  // 2. Starts with entire query
  if (lower.startsWith(normalizedQuery)) return 85;

  // 3. Word-level prefix matches
  const words = lower.split(/[\s,.\-–—/()]+/).filter(Boolean);
  const anyWordStartsWith = words.some((w) => w.startsWith(normalizedQuery));
  if (anyWordStartsWith) return 75;

  // 4. Multi-token partial word matching: every token matches the beginning of some word
  if (queryTokens.length > 1) {
    const allTokensMatchWords = queryTokens.every((token) =>
      words.some((w) => w.startsWith(token) || w.includes(token))
    );
    if (allTokensMatchWords) return 65;
  }

  // 5. Substring match
  const subIdx = lower.indexOf(normalizedQuery);
  if (subIdx !== -1) {
    // Earlier occurrences get slightly higher weight
    return Math.max(40, 55 - Math.min(subIdx, 20));
  }

  // 6. Token matching: check how many tokens match substrings
  let matchedTokensCount = 0;
  for (const token of queryTokens) {
    if (lower.includes(token)) matchedTokensCount++;
  }
  if (matchedTokensCount === queryTokens.length) {
    return 35;
  }

  return 0;
}

function formatPropertySuggestion(p) {
  return {
    id: `prop-${p.id}`,
    type: 'property',
    title: p.title,
    subtitle: `${p.locality || p.location}${p.builder ? ` • ${p.builder}` : ''}`,
    slug: p.slug,
    price: p.price,
    rentPrice: p.rentPrice,
    propertyType: p.type,
    badge: p.bhk || p.beds || 'Verified',
    image: p.image || null,
    city: p.city,
    location: p.location,
    bhk: p.bhk,
    beds: p.beds,
    builder: p.builder,
    mode: p.mode,
  };
}

/**
 * Get all active properties with optional filter criteria
 */
export function getAllProperties(filters = {}) {
  const db = readDb();
  let list = (db.properties || []).filter((p) => !p.isDeleted && p.status === 'published');

  if (filters.city && filters.city !== 'All Cities') {
    const cityLower = filters.city.toLowerCase();
    list = list.filter(
      (p) =>
        p.city.toLowerCase() === cityLower ||
        p.location.toLowerCase().includes(cityLower)
    );
  }

  if (filters.mode && filters.mode !== 'both' && filters.mode !== 'all') {
    list = list.filter((p) => p.mode === 'both' || p.mode === filters.mode);
  }

  if (filters.type && filters.type !== 'All Types' && filters.type !== 'Property Type') {
    list = list.filter((p) => p.type === filters.type);
  }

  if (filters.bhk && filters.bhk !== 'All BHK' && filters.bhk !== 'BHK') {
    if (filters.bhk === '5+ BHK') {
      list = list.filter((p) => parseInt(p.beds) >= 5);
    } else {
      const num = filters.bhk.split(' ')[0];
      list = list.filter((p) => p.beds?.includes(num) || p.bhk?.includes(num));
    }
  }

  return list;
}

export function findPropertyById(id) {
  const db = readDb();
  return (db.properties || []).find((p) => p.id === Number(id) && !p.isDeleted) || null;
}

export function findPropertyBySlug(slug) {
  const db = readDb();
  return (db.properties || []).find((p) => p.slug === slug && !p.isDeleted) || null;
}

export function createProperty(propertyData) {
  const db = readDb();
  const nextId = (db.properties || []).reduce((max, p) => Math.max(max, p.id || 0), 0) + 1;
  const newProp = {
    ...propertyData,
    id: nextId,
    slug: propertyData.slug || slugify(propertyData.title),
    status: propertyData.status || 'published',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.properties.push(newProp);
  writeDb(db);
  return newProp;
}

export function updateProperty(id, updates) {
  const db = readDb();
  const index = (db.properties || []).findIndex((p) => p.id === Number(id));
  if (index === -1) return null;

  db.properties[index] = {
    ...db.properties[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeDb(db);
  return db.properties[index];
}

export function deleteProperty(id) {
  const db = readDb();
  const index = (db.properties || []).findIndex((p) => p.id === Number(id));
  if (index === -1) return false;

  db.properties[index].isDeleted = true;
  db.properties[index].updatedAt = new Date().toISOString();
  writeDb(db);
  return true;
}

/**
 * Production Autocomplete Search Engine
 * Dynamic, database-driven suggestion generator grouping results by:
 * - Locations (city, locality, neighborhood, area)
 * - Properties (real listings with title, location, price, type, thumbnail)
 * - Property Types (Apartment, Villa, Penthouse, etc. from DB)
 * - Relevant Attributes (BHK configurations, Buy/Rent, etc.)
 */
export function searchPropertiesAutocomplete({
  query = '',
  city = '',
  mode = '',
  limit = 10,
}) {
  const normalizedQuery = normalizeQuery(query);
  const cacheKey = `${normalizedQuery}|${(city || '').toLowerCase()}|${(mode || '').toLowerCase()}|${limit}`;

  // Instant TTL cache hit
  const cached = getFromSearchCache(cacheKey);
  if (cached) return cached;

  const db = readDb();
  const allProps = (db.properties || []).filter(
    (p) => !p.isDeleted && p.status === 'published'
  );

  // Filter properties by search mode if provided
  const props = allProps.filter((p) => {
    if (mode && mode !== 'both' && mode !== 'all') {
      if (p.mode !== 'both' && p.mode !== mode) return false;
    }
    return true;
  });

  // Empty query: Return popular database-backed suggestions for initial focus
  if (!normalizedQuery) {
    const popularLocationMap = new Map();
    props.forEach((p) => {
      if (p.city && !popularLocationMap.has(p.city)) {
        popularLocationMap.set(p.city, {
          id: `loc-city-${slugify(p.city)}`,
          type: 'location',
          title: p.city,
          subtitle: p.state ? `${p.state}, India` : 'India',
          badge: 'City',
          city: p.city,
          location: p.city,
          count: 1,
        });
      } else if (p.city) {
        popularLocationMap.get(p.city).count++;
      }
    });

    const popularTypeMap = new Map();
    props.forEach((p) => {
      if (p.type && !popularTypeMap.has(p.type)) {
        popularTypeMap.set(p.type, {
          id: `type-${slugify(p.type)}`,
          type: 'propertyType',
          title: p.type,
          subtitle: 'Property Type',
          badge: p.type.split('/')[0].trim(),
          count: 1,
        });
      } else if (p.type) {
        popularTypeMap.get(p.type).count++;
      }
    });

    const popularLocations = Array.from(popularLocationMap.values())
      .map((l) => ({ ...l, subtitle: `${l.count} verified ${l.count === 1 ? 'property' : 'properties'}` }))
      .slice(0, 4);

    const popularTypes = Array.from(popularTypeMap.values())
      .map((t) => ({ ...t, subtitle: `${t.count} verified ${t.count === 1 ? 'listing' : 'listings'}` }))
      .slice(0, 3);

    const featuredHomes = props.slice(0, 3).map(formatPropertySuggestion);

    const categories = [];
    if (popularLocations.length > 0) {
      categories.push({
        id: 'locations',
        label: 'Locations',
        items: popularLocations,
      });
    }
    if (popularTypes.length > 0) {
      categories.push({
        id: 'types',
        label: 'Property types',
        items: popularTypes,
      });
    }
    if (featuredHomes.length > 0) {
      categories.push({
        id: 'properties',
        label: 'Properties',
        items: featuredHomes,
      });
    }

    const result = {
      query: '',
      total: categories.reduce((sum, c) => sum + c.items.length, 0),
      categories,
    };
    saveToSearchCache(cacheKey, result);
    return result;
  }

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  // 1. EXTRACT AND SCORE LOCATIONS
  const locationMap = new Map();
  props.forEach((p) => {
    // City
    if (p.city) {
      const cityKey = `city:${p.city.toLowerCase()}`;
      if (!locationMap.has(cityKey)) {
        locationMap.set(cityKey, {
          id: `loc-city-${slugify(p.city)}`,
          type: 'location',
          title: p.city,
          subtitle: p.state ? `${p.state}, India` : 'India',
          badge: 'City',
          city: p.city,
          location: p.city,
          count: 0,
        });
      }
      locationMap.get(cityKey).count++;
    }

    // Locality
    if (p.locality) {
      const locKey = `loc:${p.locality.toLowerCase()}`;
      if (!locationMap.has(locKey)) {
        locationMap.set(locKey, {
          id: `loc-area-${slugify(p.locality)}`,
          type: 'location',
          title: p.locality,
          subtitle: p.city ? `${p.city}, ${p.state || 'India'}` : 'Locality',
          badge: 'Locality',
          city: p.city,
          location: p.location || p.locality,
          count: 0,
        });
      }
      locationMap.get(locKey).count++;
    }

    // Full Location (e.g. Golf Course Extension, Gurugram)
    if (p.location && p.location !== p.city && p.location !== p.locality) {
      const fullKey = `full:${p.location.toLowerCase()}`;
      if (!locationMap.has(fullKey)) {
        locationMap.set(fullKey, {
          id: `loc-full-${slugify(p.location)}`,
          type: 'location',
          title: p.location,
          subtitle: p.city ? `Area in ${p.city}` : 'Area',
          badge: 'Area',
          city: p.city,
          location: p.location,
          count: 0,
        });
      }
      locationMap.get(fullKey).count++;
    }
  });

  const matchingLocations = [];
  for (const loc of locationMap.values()) {
    const scoreTitle = calculateSearchScore(loc.title, normalizedQuery, queryTokens);
    const scoreSub = loc.subtitle ? calculateSearchScore(loc.subtitle, normalizedQuery, queryTokens) * 0.75 : 0;
    const finalScore = Math.max(scoreTitle, scoreSub);
    if (finalScore > 0) {
      matchingLocations.push({
        ...loc,
        subtitle: `${loc.count} ${loc.count === 1 ? 'property' : 'properties'} • ${loc.subtitle}`,
        score: finalScore,
      });
    }
  }
  matchingLocations.sort((a, b) => b.score - a.score || b.count - a.count);

  // 2. EXTRACT AND SCORE PROPERTY TYPES
  const typeMap = new Map();
  props.forEach((p) => {
    if (p.type) {
      const key = p.type.toLowerCase();
      if (!typeMap.has(key)) {
        typeMap.set(key, {
          id: `type-${slugify(p.type)}`,
          type: 'propertyType',
          title: p.type,
          subtitle: 'Verified Property Category',
          badge: 'Property Type',
          count: 0,
        });
      }
      typeMap.get(key).count++;
    }
  });

  const matchingTypes = [];
  for (const t of typeMap.values()) {
    const score = calculateSearchScore(t.title, normalizedQuery, queryTokens);
    if (score > 0) {
      matchingTypes.push({
        ...t,
        subtitle: `${t.count} verified ${t.count === 1 ? 'listing' : 'listings'} available`,
        score,
      });
    }
  }
  matchingTypes.sort((a, b) => b.score - a.score || b.count - a.count);

  // 3. EXTRACT AND SCORE ATTRIBUTES (BHK, Rent/Sale, Possession)
  const matchingAttributes = [];
  const bhkMap = new Map();
  props.forEach((p) => {
    const bhk = p.bhk || (p.beds ? `${parseInt(p.beds)} BHK` : null);
    if (bhk) {
      const key = bhk.toLowerCase();
      if (!bhkMap.has(key)) {
        bhkMap.set(key, {
          id: `attr-bhk-${slugify(bhk)}`,
          type: 'attribute',
          attributeType: 'bhk',
          title: bhk,
          subtitle: 'Bedrooms Configuration',
          badge: 'BHK Plan',
          count: 0,
        });
      }
      bhkMap.get(key).count++;
    }
  });

  for (const b of bhkMap.values()) {
    const isBhkQuery =
      normalizedQuery.includes('bhk') ||
      normalizedQuery.includes('bed') ||
      /^[0-9](\s*bhk|\s*bed)?$/i.test(normalizedQuery);
    const numPart = b.title.split(' ')[0];
    let score = calculateSearchScore(b.title, normalizedQuery, queryTokens);

    if (isBhkQuery && (normalizedQuery.includes(numPart) || b.title.toLowerCase().startsWith(normalizedQuery))) {
      score = Math.max(score, 90);
    }

    if (score > 0) {
      matchingAttributes.push({
        ...b,
        subtitle: `${b.count} available ${b.count === 1 ? 'home' : 'homes'}`,
        score,
      });
    }
  }

  // Rent / Buy mode attributes matching
  if (normalizedQuery.includes('rent') || normalizedQuery.includes('lease')) {
    const rentCount = props.filter((p) => p.mode === 'both' || p.mode === 'rent').length;
    if (rentCount > 0) {
      matchingAttributes.push({
        id: 'attr-mode-rent',
        type: 'attribute',
        attributeType: 'mode',
        mode: 'rent',
        title: 'Properties for Rent',
        subtitle: `${rentCount} verified rental homes`,
        badge: 'For Rent',
        count: rentCount,
        score: 95,
      });
    }
  }

  if (normalizedQuery.includes('buy') || normalizedQuery.includes('sale')) {
    const buyCount = props.filter((p) => p.mode === 'both' || p.mode === 'buy').length;
    if (buyCount > 0) {
      matchingAttributes.push({
        id: 'attr-mode-buy',
        type: 'attribute',
        attributeType: 'mode',
        mode: 'buy',
        title: 'Properties for Sale',
        subtitle: `${buyCount} verified homes for sale`,
        badge: 'For Sale',
        count: buyCount,
        score: 95,
      });
    }
  }

  matchingAttributes.sort((a, b) => b.score - a.score);

  // 4. SCORE REAL PROPERTY LISTINGS (Multiword & Cross-Field)
  const matchingProperties = [];
  props.forEach((p) => {
    const titleScore = calculateSearchScore(p.title, normalizedQuery, queryTokens) * 1.3;
    const builderScore = p.builder ? calculateSearchScore(p.builder, normalizedQuery, queryTokens) * 1.15 : 0;
    const locScore = calculateSearchScore(p.location, normalizedQuery, queryTokens) * 1.0;
    const cityScore = calculateSearchScore(p.city, normalizedQuery, queryTokens) * 0.9;
    const typeScore = calculateSearchScore(p.type, normalizedQuery, queryTokens) * 0.85;
    const bhkScore = p.bhk ? calculateSearchScore(p.bhk, normalizedQuery, queryTokens) * 0.8 : 0;
    const descScore = p.description ? calculateSearchScore(p.description, normalizedQuery, queryTokens) * 0.4 : 0;

    // Composite text matching across all searchable fields
    const compositeText = [
      p.title,
      p.location,
      p.locality,
      p.city,
      p.type,
      p.builder,
      p.bhk,
      p.beds,
      p.mode === 'both' ? 'rent buy sale' : (p.mode === 'rent' ? 'rent' : 'buy sale'),
      p.description,
    ]
      .filter(Boolean)
      .join(' ');

    const compositeScore = calculateSearchScore(compositeText, normalizedQuery, queryTokens) * 1.1;

    // If query has multiple tokens and every token is present somewhere in composite fields
    const allTokensFound =
      queryTokens.length > 1 &&
      queryTokens.every((token) => compositeText.toLowerCase().includes(token));
    const multiTokenScore = allTokensFound ? 70 : 0;

    const maxScore = Math.max(
      titleScore,
      builderScore,
      locScore,
      cityScore,
      typeScore,
      bhkScore,
      descScore,
      compositeScore,
      multiTokenScore
    );

    if (maxScore > 0) {
      matchingProperties.push({
        ...formatPropertySuggestion(p),
        score: maxScore,
      });
    }
  });
  matchingProperties.sort((a, b) => b.score - a.score);

  // Dynamic relevance sorting: The category with the highest matching score appears FIRST
  const candidateCategories = [
    {
      id: 'properties',
      label: 'Properties',
      items: matchingProperties.slice(0, 4),
      maxScore: matchingProperties.length > 0 ? Math.max(...matchingProperties.map((i) => i.score || 0)) : 0,
    },
    {
      id: 'types',
      label: 'Property types',
      items: matchingTypes.slice(0, 3),
      maxScore: matchingTypes.length > 0 ? Math.max(...matchingTypes.map((i) => i.score || 0)) : 0,
    },
    {
      id: 'locations',
      label: 'Locations',
      items: matchingLocations.slice(0, 3),
      maxScore: matchingLocations.length > 0 ? Math.max(...matchingLocations.map((i) => i.score || 0)) : 0,
    },
    {
      id: 'attributes',
      label: 'Configurations',
      items: matchingAttributes.slice(0, 2),
      maxScore: matchingAttributes.length > 0 ? Math.max(...matchingAttributes.map((i) => i.score || 0)) : 0,
    },
  ];

  const categories = candidateCategories
    .filter((c) => c.items.length > 0)
    .sort((a, b) => b.maxScore - a.maxScore)
    .map(({ maxScore, ...rest }) => rest);

  const total = categories.reduce((sum, c) => sum + c.items.length, 0);

  const result = {
    query: normalizedQuery,
    total,
    categories,
  };

  saveToSearchCache(cacheKey, result);
  return result;
}

