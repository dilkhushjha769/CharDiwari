// SAMPLE detail data for the property pages, keyed by slug. Highlights,
// amenities and nearby distances are placeholders until each listing's real
// details arrive. A missing field simply hides its section.
//
// Map fields: coordinates are the LOCALITY centre (locationPrecision
// 'approximate'), never a specific building, taken from OpenStreetMap
// (Nominatim): the locality's place centre, or for a road address such as
// Golf Course Extension, a point on that road. Every point is on land. viewerDefault picks the first
// mode of the neighbourhood viewer ('3d' or 'map'). streetView is filled in by
// a one-off check against the Street View metadata endpoint once there's an
// API key; commuteClaims holds the builder's advertised times, e.g.
// [{ to: 'Cyber City', minutes: 15 }].

export const propertyDetails = {
  'the-courtyard-villa': {
    // Locality centre, not the building (sample).
    coordinates: { lat: 28.409, lng: 77.0658 },
    locationPrecision: 'approximate',
    viewerDefault: '3d',
    streetView: false,
    commuteClaims: [],
    highlights: ['Private swimming pool', 'Open central courtyard', 'Natural stone and wood finishes'],
    amenities: ['pool', 'garden', 'gym', 'clubhouse', 'security', 'power-backup', 'parking', 'cctv'],
    nearby: [
      { type: 'metro', name: 'Sector 55–56 Rapid Metro', km: 6, lat: 28.4234, lng: 77.1051 },
      { type: 'hospital', name: 'Medanta – The Medicity', km: 6.4, lat: 28.43895, lng: 77.04027 },
      { type: 'school', name: 'Manav Rachna International School', km: 4.1, lat: 28.42213, lng: 77.0605 },
      { type: 'mall', name: 'M3M Urbana, Sector 67', km: 2.7, lat: 28.39137, lng: 77.06669 },
      { type: 'airport', name: 'Indira Gandhi International Airport', km: 24.1, lat: 28.55542, lng: 77.08481 },
    ],
  },
  'the-mountain-villa': {
    // Locality centre, not the building (sample).
    coordinates: { lat: 30.8999, lng: 76.962 },
    locationPrecision: 'approximate',
    viewerDefault: 'map',
    streetView: false,
    commuteClaims: [],
    highlights: ['Himalayan valley views', 'Indoor sun deck', 'Pine forest setting'],
    amenities: ['garden', 'jogging', 'security', 'power-backup', 'parking'],
    nearby: [
      { type: 'mall', name: 'Kasauli Mall Road', km: 1.8, lat: 30.9011, lng: 76.9647 },
      { type: 'hospital', name: 'Dr. Virender Mohan Hospital, Dharampur', km: 12.2, lat: 30.90014, lng: 77.01946 },
      { type: 'railway', name: 'Kalka railway station', km: 23.4, lat: 30.83923, lng: 76.93156 },
      { type: 'airport', name: 'Chandigarh Airport', km: 51.2, lat: 30.67419, lng: 76.79099 },
    ],
  },
  'the-garden-villa': {
    // Locality centre, not the building (sample).
    coordinates: { lat: 18.7682, lng: 72.8708 },
    locationPrecision: 'approximate',
    viewerDefault: 'map',
    streetView: false,
    commuteClaims: [],
    highlights: ['Among coconut groves', 'Eco-friendly build', 'Minutes from Awas beach'],
    amenities: ['pool', 'garden', 'security', 'power-backup', 'parking'],
    nearby: [
      { type: 'beach', name: 'Awas Beach', km: 1.4, lat: 18.76606, lng: 72.86456 },
      { type: 'jetty', name: 'Mandwa Jetty (ferry to Mumbai)', km: 7.6, lat: 18.8075, lng: 72.881 },
      { type: 'hospital', name: 'Alibaug Civil Hospital', km: 16, lat: 18.64078, lng: 72.87181 },
      { type: 'mall', name: 'Alibag market', km: 15, lat: 18.6498, lng: 72.8765 },
    ],
  },
  'the-courtyard-apartment': {
    // Locality centre, not the building (sample).
    coordinates: { lat: 23.0446, lng: 72.5173 },
    locationPrecision: 'approximate',
    viewerDefault: '3d',
    streetView: false,
    commuteClaims: [],
    highlights: ['Clay lattice screens', 'Landscaped courtyard garden', 'Prime Bodakdev address'],
    amenities: ['gym', 'clubhouse', 'garden', 'kids-play', 'security', 'power-backup', 'parking', 'cctv'],
    nearby: [
      { type: 'mall', name: 'Sindhu Bhavan Road', km: 3.2, lat: 23.04145, lng: 72.49243 },
      { type: 'school', name: 'Delhi Public School, Bopal', km: 7.8, lat: 23.04196, lng: 72.45751 },
      { type: 'hospital', name: 'Zydus Hospital', km: 2.1, lat: 23.05851, lng: 72.51744 },
      { type: 'metro', name: 'Thaltej metro station', km: 0.8, lat: 23.0497, lng: 72.516 },
      { type: 'airport', name: 'Sardar Vallabhbhai Patel International Airport', km: 17.5, lat: 23.07593, lng: 72.63056 },
    ],
  },
  'the-horizon-penthouse': {
    // Locality centre, not the building (sample).
    coordinates: { lat: 19.0117, lng: 72.8179 },
    locationPrecision: 'approximate',
    viewerDefault: '3d',
    streetView: false,
    commuteClaims: [],
    highlights: ['Sea-facing sky villa', 'Private terrace', 'Double-height living room'],
    amenities: ['pool', 'gym', 'clubhouse', 'spa', 'security', 'power-backup', 'parking', 'cctv'],
    nearby: [
      { type: 'mall', name: 'Phoenix Palladium', km: 3.5, lat: 18.9942, lng: 72.8241 },
      { type: 'hospital', name: 'Breach Candy Hospital', km: 5.3, lat: 18.97257, lng: 72.80427 },
      { type: 'railway', name: 'Mahalaxmi railway station', km: 3.7, lat: 18.98252, lng: 72.82422 },
      { type: 'airport', name: 'Chhatrapati Shivaji Maharaj International Airport', km: 13, lat: 19.09014, lng: 72.86382 },
    ],
  },
  'the-palm-villa': {
    // Locality centre, not the building (sample).
    coordinates: { lat: 15.5981, lng: 73.7722 },
    locationPrecision: 'approximate',
    viewerDefault: 'map',
    streetView: false,
    commuteClaims: [],
    highlights: ['Indo-Portuguese design', 'Shaded palm garden', 'Private plunge pool'],
    amenities: ['pool', 'garden', 'security', 'power-backup', 'parking'],
    nearby: [
      { type: 'beach', name: 'Anjuna Beach', km: 5.5, lat: 15.5761, lng: 73.74018 },
      { type: 'mall', name: 'Mapusa market', km: 5.6, lat: 15.58858, lng: 73.81188 },
      { type: 'hospital', name: 'Asilo Hospital, Mapusa', km: 5.9, lat: 15.59008, lng: 73.81671 },
      { type: 'airport', name: 'Manohar International Airport, Mopa', km: 25.1, lat: 15.73672, lng: 73.86901 },
    ],
  },
  'the-imperial-heights': {
    highlights: ['Sarabha Nagar prime location', 'Modern 2 BHK layout', 'Smart home automation'],
    amenities: ['gym', 'clubhouse', 'garden', 'security', 'power-backup', 'parking', 'cctv'],
    nearby: [
      { type: 'mall', name: 'MBD Neopolis Mall', km: 2.1 },
      { type: 'hospital', name: 'Dayanand Medical College & Hospital', km: 4.5 },
      { type: 'school', name: 'Sacred Heart Convent School', km: 1.8 },
      { type: 'railway', name: 'Ludhiana Junction Railway Station', km: 6.2 },
      { type: 'airport', name: 'Sahnewal Airport', km: 16 },
    ],
  },
};

export function propertyDetail(slug) {
  return propertyDetails[slug] ?? {};
}
