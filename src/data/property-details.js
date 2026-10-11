// SAMPLE detail data for the property pages, keyed by slug. Highlights,
// amenities and nearby distances are placeholders until each listing's real
// details arrive. A missing field simply hides its section.
//
// Map fields: coordinates are the LOCALITY centre (locationPrecision
// 'approximate'), never a specific building. viewerDefault picks the first
// mode of the neighbourhood viewer ('3d' or 'map'). streetView is filled in by
// a one-off check against the Street View metadata endpoint once there's an
// API key; commuteClaims holds the builder's advertised times, e.g.
// [{ to: 'Cyber City', minutes: 15 }].

export const propertyDetails = {
  'the-courtyard-villa': {
    // Locality centre, not the building (sample).
    coordinates: { lat: 28.406, lng: 77.093 },
    locationPrecision: 'approximate',
    viewerDefault: '3d',
    streetView: false,
    commuteClaims: [],
    highlights: ['Private swimming pool', 'Open central courtyard', 'Natural stone and wood finishes'],
    amenities: ['pool', 'garden', 'gym', 'clubhouse', 'security', 'power-backup', 'parking', 'cctv'],
    nearby: [
      { type: 'metro', name: 'Sector 55–56 Rapid Metro', km: 3.2 },
      { type: 'hospital', name: 'Medanta – The Medicity', km: 9.5 },
      { type: 'school', name: 'The Shri Ram School, Aravali', km: 6.8 },
      { type: 'mall', name: 'Worldmark, Sector 65', km: 4.1 },
      { type: 'airport', name: 'Indira Gandhi International Airport', km: 24 },
    ],
  },
  'the-mountain-villa': {
    // Locality centre, not the building (sample).
    coordinates: { lat: 30.901, lng: 76.965 },
    locationPrecision: 'approximate',
    viewerDefault: 'map',
    streetView: false,
    commuteClaims: [],
    highlights: ['Himalayan valley views', 'Indoor sun deck', 'Pine forest setting'],
    amenities: ['garden', 'jogging', 'security', 'power-backup', 'parking'],
    nearby: [
      { type: 'mall', name: 'Kasauli Mall Road', km: 2.5 },
      { type: 'hospital', name: 'Kasauli Military Hospital', km: 3 },
      { type: 'railway', name: 'Kalka railway station', km: 36 },
      { type: 'airport', name: 'Chandigarh Airport', km: 68 },
    ],
  },
  'the-garden-villa': {
    // Locality centre, not the building (sample).
    coordinates: { lat: 18.744, lng: 72.868 },
    locationPrecision: 'approximate',
    viewerDefault: 'map',
    streetView: false,
    commuteClaims: [],
    highlights: ['Among coconut groves', 'Eco-friendly build', 'Minutes from Awas beach'],
    amenities: ['pool', 'garden', 'security', 'power-backup', 'parking'],
    nearby: [
      { type: 'beach', name: 'Awas Beach', km: 1.2 },
      { type: 'jetty', name: 'Mandwa Jetty (ferry to Mumbai)', km: 9 },
      { type: 'hospital', name: 'Alibaug Civil Hospital', km: 14 },
      { type: 'mall', name: 'Alibaug market', km: 13 },
    ],
  },
  'the-courtyard-apartment': {
    // Locality centre, not the building (sample).
    coordinates: { lat: 23.039, lng: 72.511 },
    locationPrecision: 'approximate',
    viewerDefault: '3d',
    streetView: false,
    commuteClaims: [],
    highlights: ['Clay lattice screens', 'Landscaped courtyard garden', 'Prime Bodakdev address'],
    amenities: ['gym', 'clubhouse', 'garden', 'kids-play', 'security', 'power-backup', 'parking', 'cctv'],
    nearby: [
      { type: 'mall', name: 'Sindhu Bhavan Road', km: 1.1 },
      { type: 'school', name: 'Delhi Public School, Bopal', km: 7.5 },
      { type: 'hospital', name: 'Zydus Hospital', km: 3.4 },
      { type: 'metro', name: 'Thaltej metro station', km: 3.8 },
      { type: 'airport', name: 'Sardar Vallabhbhai Patel International Airport', km: 18 },
    ],
  },
  'the-horizon-penthouse': {
    // Locality centre, not the building (sample).
    coordinates: { lat: 19.0105, lng: 72.8145 },
    locationPrecision: 'approximate',
    viewerDefault: '3d',
    streetView: false,
    commuteClaims: [],
    highlights: ['Sea-facing sky villa', 'Private terrace', 'Double-height living room'],
    amenities: ['pool', 'gym', 'clubhouse', 'spa', 'security', 'power-backup', 'parking', 'cctv'],
    nearby: [
      { type: 'mall', name: 'Phoenix Palladium', km: 3.5 },
      { type: 'hospital', name: 'Breach Candy Hospital', km: 5.8 },
      { type: 'railway', name: 'Mahalaxmi railway station', km: 3.9 },
      { type: 'airport', name: 'Chhatrapati Shivaji Maharaj International Airport', km: 14 },
    ],
  },
  'the-palm-villa': {
    // Locality centre, not the building (sample).
    coordinates: { lat: 15.596, lng: 73.766 },
    locationPrecision: 'approximate',
    viewerDefault: 'map',
    streetView: false,
    commuteClaims: [],
    highlights: ['Indo-Portuguese design', 'Shaded palm garden', 'Private plunge pool'],
    amenities: ['pool', 'garden', 'security', 'power-backup', 'parking'],
    nearby: [
      { type: 'beach', name: 'Anjuna Beach', km: 4.5 },
      { type: 'mall', name: 'Mapusa market', km: 6 },
      { type: 'hospital', name: 'Asilo Hospital, Mapusa', km: 6.5 },
      { type: 'airport', name: 'Manohar International Airport, Mopa', km: 29 },
    ],
  },
};

export function propertyDetail(slug) {
  return propertyDetails[slug] ?? {};
}
