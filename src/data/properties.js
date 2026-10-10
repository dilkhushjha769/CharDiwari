// The property listings shown on the home page and the property pages.
// Moved here from src/app/page.js unchanged; each also gets a URL slug.
const listings = [
  {
    id: 1,
    tag: 'Available',
    badge: 'Verified Property',
    title: 'The Courtyard Villa',
    location: 'Golf Course Extension, Gurugram',
    city: 'Gurugram',
    type: 'Luxury Villa & Estate',
    possession: 'Ready to Move',
    builder: 'Studio Lotus',
    price: '₹4.80 Cr',
    priceNum: 4.8,
    rentPrice: '₹2.80 Lakh/mo',
    rentPriceNum: 2.8,
    mode: 'both',
    beds: '4 Beds',
    baths: '5 Baths',
    area: '4,800 sq.ft',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    description:
      'Spacious home with an open courtyard, natural stone walls, wooden finish, and a private swimming pool.',
  },
  {
    id: 2,
    tag: 'New Listing',
    badge: 'Hillside Home',
    title: 'The Mountain Villa',
    location: 'Pine Ridge, Kasauli Hills',
    city: 'Kasauli Hills',
    type: 'Luxury Villa & Estate',
    possession: 'Ready to Move',
    builder: 'Morphogenesis',
    price: '₹6.20 Cr',
    priceNum: 6.2,
    rentPrice: '₹3.60 Lakh/mo',
    rentPriceNum: 3.6,
    mode: 'both',
    beds: '5 Beds',
    baths: '6 Baths',
    area: '6,200 sq.ft',
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    description:
      'Modern hill-view villa overlooking the Himalayan valley with a warm indoor sun deck.',
  },
  {
    id: 3,
    tag: 'Available',
    badge: 'Coastal Home',
    title: 'The Garden Villa',
    location: 'Awas Beach Road, Alibaug',
    city: 'Alibaug',
    type: 'Luxury Villa & Estate',
    possession: 'Ready to Move',
    builder: 'Samira Habitats',
    price: '₹5.40 Cr',
    priceNum: 5.4,
    rentPrice: '₹3.10 Lakh/mo',
    rentPriceNum: 3.1,
    mode: 'both',
    beds: '4 Beds',
    baths: '4 Baths',
    area: '5,400 sq.ft',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    description:
      'Eco-friendly modern home surrounded by peaceful coconut groves and green gardens.',
  },
  {
    id: 4,
    tag: 'Exclusive',
    badge: 'Modern Heritage',
    title: 'The Courtyard Apartment',
    location: 'Bodakdev, Ahmedabad',
    city: 'Ahmedabad',
    type: 'Architectural Apartment',
    possession: 'Ready to Move',
    builder: 'HCP Design & Project Management',
    price: '₹3.90 Cr',
    priceNum: 3.9,
    rentPrice: '₹1.90 Lakh/mo',
    rentPriceNum: 1.9,
    mode: 'both',
    beds: '4 Beds',
    baths: '4 Baths',
    area: '4,200 sq.ft',
    image:
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
    description:
      'Modern designer apartment with clay lattice screens and a landscaped courtyard garden.',
  },
  {
    id: 5,
    tag: 'New Listing',
    badge: 'Sea-View Penthouse',
    title: 'The Horizon Penthouse',
    location: 'Worli Sea Face, Mumbai',
    city: 'Mumbai',
    type: 'Penthouse / Sky Villa',
    possession: 'Under Construction',
    builder: 'Hafeez Contractor',
    price: '₹14.50 Cr',
    priceNum: 14.5,
    rentPrice: '₹7.50 Lakh/mo',
    rentPriceNum: 7.5,
    mode: 'both',
    beds: '5 Beds',
    baths: '6 Baths',
    area: '6,800 sq.ft',
    image:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
    description:
      'Luxury sea-view penthouse with high ceilings, private outdoor deck, and Italian marble floors.',
  },
  {
    id: 6,
    tag: 'Available',
    badge: 'Goa Heritage Villa',
    title: 'The Palm Villa',
    location: 'Assagao, North Goa',
    city: 'Goa',
    type: 'Luxury Villa & Estate',
    possession: 'Ready to Move',
    builder: 'Tarun Tahiliani Homes',
    price: '₹7.20 Cr',
    priceNum: 7.2,
    rentPrice: '₹4.20 Lakh/mo',
    rentPriceNum: 4.2,
    mode: 'both',
    beds: '4 Beds',
    baths: '5 Baths',
    area: '5,600 sq.ft',
    image:
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
    description:
      'Restored classic Portuguese-style villa with natural stone walls, private swimming pool, and fruit gardens.',
  },
];

// "The Courtyard Villa" -> "the-courtyard-villa"
const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const properties = listings.map((property) => ({ ...property, slug: slugify(property.title) }));

export function findProperty(slug) {
  return properties.find((property) => property.slug === slug) ?? null;
}
