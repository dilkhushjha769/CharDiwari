'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  DollarSign,
  MapPin,
  Image as ImageIcon,
  Film,
  Video,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Upload,
  RefreshCw,
  Eye,
  Save,
  HelpCircle,
  Bed,
  Bath,
  Maximize2,
  Car,
  ShieldCheck,
  Navigation,
  Globe,
  Waves,
  Zap,
  Tag,
  Dumbbell,
  Building,
  Flower2,
  Trees,
  Footprints,
  Baby,
  Camera,
  BatteryCharging,
  Home,
  Check,
  Compass,
  Phone,
  Mail,
  User,
  Search,
  FileCheck,
} from 'lucide-react';
import Footer from '@/components/Footer';
import { parseVideoUrl } from '@/lib/video';

// Dynamically import PropertyMapPicker with SSR disabled for MapLibre GL
const PropertyMapPicker = dynamic(
  () => import('@/components/admin/PropertyMapPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[380px] rounded-3xl bg-stone-100 flex items-center justify-center border border-stone-200">
        <div className="flex flex-col items-center gap-2 text-stone-500">
          <RefreshCw className="w-6 h-6 animate-spin text-stone-600" />
          <span className="text-xs font-semibold">Loading Interactive Map...</span>
        </div>
      </div>
    ),
  }
);

// Real amenities with authentic architectural & facility icons (No sparkles, no AI icons)
const LUXURY_AMENITIES = [
  { id: 'pool', label: 'Swimming Pool', icon: Waves, color: 'text-blue-600' },
  { id: 'gym', label: 'Gymnasium & Fitness', icon: Dumbbell, color: 'text-stone-700' },
  { id: 'clubhouse', label: 'Clubhouse', icon: Building, color: 'text-stone-700' },
  { id: 'spa', label: 'Spa & Wellness', icon: Flower2, color: 'text-purple-600' },
  { id: 'garden', label: 'Private Garden', icon: Trees, color: 'text-emerald-600' },
  { id: 'jogging', label: 'Walking Trail', icon: Footprints, color: 'text-stone-700' },
  { id: 'kids-play', label: "Children's Play Area", icon: Baby, color: 'text-orange-600' },
  { id: 'security', label: '24×7 Security', icon: ShieldCheck, color: 'text-emerald-700' },
  { id: 'power-backup', label: 'Power Backup', icon: Zap, color: 'text-stone-800' },
  { id: 'parking', label: 'Covered Parking', icon: Car, color: 'text-stone-800' },
  { id: 'cctv', label: 'CCTV Surveillance', icon: Camera, color: 'text-stone-600' },
  { id: 'ev', label: 'EV Charging Bays', icon: BatteryCharging, color: 'text-teal-600' },
];

// Pre-defined Property Types (broker-friendly)
const PROPERTY_TYPES = [
  'Luxury Villa & Estate',
  'Architectural Apartment',
  'Penthouse / Sky Villa',
  'Independent Floor / Duplex',
  'Heritage Haveli & Estate',
  'Farmhouse / Country Estate',
  'Waterfront Residence',
  'Commercial / Boutique Office',
  'Residential Plot / Land',
];

// Indian Luxury Cities
const MAJOR_CITIES = [
  'Gurugram',
  'Mumbai',
  'Goa',
  'Ahmedabad',
  'Delhi NCR',
  'Bengaluru',
  'Kasauli Hills',
  'Alibaug',
  'Ludhiana',
  'Jaipur',
  'Hyderabad',
  'Pune',
  'Kolkata',
  'Chennai',
];

// Possession Status Options (Clean dropdown)
const POSSESSION_OPTIONS = [
  'Ready to Move',
  'Under Construction',
  'New Launch / Pre-Launch',
  'Possession in 2026',
  'Possession in 2027',
  'Possession in 2028',
  'Possession in 2029+',
];

// The 9 Step-by-Step Sections with Real Icons including Contact & Review
const STEPS = [
  { id: 1, key: 'contact', title: 'Seller & Contact Info', short: 'Contact', icon: User, desc: 'Mobile phone, name & seller verification' },
  { id: 2, key: 'overview', title: 'Basic Overview', short: 'Overview', icon: Home, desc: 'Property title, city, type & possession' },
  { id: 3, key: 'pricing', title: 'Pricing & Terms', short: 'Pricing', icon: DollarSign, desc: 'Price, negotiable terms & rent' },
  { id: 4, key: 'specs', title: 'Specifications', short: 'Specs', icon: Maximize2, desc: 'BHK, size, bedrooms & bathrooms' },
  { id: 5, key: 'media', title: 'Photos & Video', short: 'Photos', icon: Film, desc: 'Cover image, gallery & walkthrough' },
  { id: 6, key: 'map', title: 'Location & Map', short: 'Map', icon: MapPin, desc: 'Interactive map & landmark distances' },
  { id: 7, key: 'amenities', title: 'Amenities & Details', short: 'Amenities', icon: Building2, desc: 'Selected amenities & summary' },
  { id: 8, key: 'faqs', title: 'Curated FAQs & Highlights', short: 'FAQs', icon: HelpCircle, desc: 'Buyer questions & selling points' },
  { id: 9, key: 'review', title: 'Review & Verify', short: 'Review', icon: CheckCircle2, desc: 'Review summary & send for admin review' },
];

// Price parser to convert "₹5.50 Cr" -> 5.5
function parsePriceToCrores(priceStr) {
  if (!priceStr || typeof priceStr !== 'string') return 0;
  const clean = priceStr.toLowerCase().replace(/,/g, '').trim();

  const crMatch = clean.match(/([\d.]+)\s*(cr|crore)/i);
  if (crMatch) return parseFloat(crMatch[1]) || 0;

  const lakhMatch = clean.match(/([\d.]+)\s*(lakh|lac|l)/i);
  if (lakhMatch) {
    const val = parseFloat(lakhMatch[1]);
    return val ? parseFloat((val / 100).toFixed(4)) : 0;
  }

  const numMatch = clean.match(/([\d.]+)/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (val < 100) return val;
    if (val >= 10000000) return parseFloat((val / 10000000).toFixed(4));
    if (val >= 100000) return parseFloat((val / 10000000).toFixed(4));
  }
  return 0;
}

function NewPropertyPageContent({ isPublicPortal = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  // Admin auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Multi-step Wizard State: 1 to 7
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [property, setProperty] = useState({
    // Seller Contact (Step 1)
    seller_name: '',
    seller_phone: '',
    seller_email: '',
    seller_role: 'owner', // 'owner' | 'agent' | 'builder'
    whatsapp_consent: true,
    preferred_contact: 'anytime',

    title: '',
    slug: '',
    type: 'Luxury Villa & Estate',
    mode: 'both', // 'buy' | 'rent' | 'both'
    tag: 'Available',
    badge: 'Verified Property',
    builder: 'Studio Lotus',
    possession: 'Ready to Move',
    status: 'published',
    rera_id: '',

    // Pricing
    price: '₹5.50 Cr',
    price_num: 5.5,
    price_on_demand: false,
    is_negotiable: false,
    rent_price: '₹2.80 Lakh/mo',
    rent_price_num: 2.8,
    maintenance_charges: '₹12,000/mo',
    booking_amount: '₹10,00,000',

    // Specs
    bhk: '4 BHK',
    beds: '4 Beds',
    baths: '5 Baths',
    area: '4,800 sq.ft',
    carpet_area: '4,200 sq.ft',
    furnishing: 'Semi-Furnished',
    facing: 'North-East',
    floor_info: 'Ground + 2 Floors',
    parking: '3 Covered Bays',

    // Media
    min_images_required: 3,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        caption: 'Central Courtyard',
      },
      {
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Infinity Pool',
      },
      {
        url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Master Suite',
      },
    ],
    video_url: 'https://youtu.be/e1cwjeP5Ofs',

    // Location & Landmarks
    location: 'Golf Course Extension, Sector 66',
    locality: 'Sector 66',
    city: 'Gurugram',
    state: 'Haryana',
    coordinates: { lat: 28.409, lng: 77.0658 },
    nearby: [
      { type: 'metro', name: 'Sector 55–56 Rapid Metro', km: 4.2, time: '8 mins' },
      { type: 'hospital', name: 'Medanta – The Medicity', km: 6.5, time: '12 mins' },
      { type: 'mall', name: 'M3M Urbana & Promenade', km: 2.1, time: '5 mins' },
      { type: 'school', name: 'The Heritage School', km: 3.8, time: '7 mins' },
      { type: 'airport', name: 'Indira Gandhi International Airport (T3)', km: 22.4, time: '35 mins' },
    ],

    // Highlights & Description
    description:
      'An exceptional contemporary estate crafted with indigenous stone masonry, expansive floor-to-ceiling facades, private infinity pool, and a serene central courtyard sanctuary.',
    highlights: [
      'Private infinity swimming pool with sun deck',
      'Open landscaped central courtyard with water cascade',
      'Italian Statuario marble and bespoke teakwood finishes',
      'Smart home automation and climate control',
    ],
    amenities: ['pool', 'gym', 'clubhouse', 'garden', 'security', 'power-backup', 'parking', 'cctv'],

    // FAQs
    faqs: [
      {
        question: 'What is the price of this property and are terms negotiable?',
        answer:
          'This residence is listed at ₹5.50 Cr. Pricing terms are open for confidential negotiation for qualified buyers.',
      },
      {
        question: 'What is the possession timeline and RERA registration status?',
        answer:
          'The property is certified Ready to Move, with an unconditional Occupancy Certificate (OC) in hand.',
      },
      {
        question: 'How do I schedule a confidential private walkthrough?',
        answer:
          'Tap "Book a Free Visit" or connect directly via WhatsApp. Accompanied private tours are arranged at your convenience.',
      },
    ],
  });

  // UI state
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showAdvancedSlug, setShowAdvancedSlug] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  // Tracking & Submission state
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [trackingQuery, setTrackingQuery] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingResults, setTrackingResults] = useState(null);
  const [trackingError, setTrackingError] = useState('');
  const [submittedSubmission, setSubmittedSubmission] = useState(null);

  // New item states
  const [newHighlight, setNewHighlight] = useState('');
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');
  const [newNearby, setNewNearby] = useState({ name: '', type: 'metro', km: '', time: '' });
  const [selectedNearbyIndex, setSelectedNearbyIndex] = useState(null);

  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Check admin session & allow public sellers
  useEffect(() => {
    let ignore = false;
    fetch('/api/admin/me')
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        if (data?.authenticated) {
          setIsAdminLoggedIn(true);
          setAdminUser(data.admin);
        } else {
          setIsAdminLoggedIn(false);
          if (!isPublicPortal) {
            router.replace('/admin');
          }
        }
      })
      .catch(() => {
        if (!ignore) {
          setIsAdminLoggedIn(false);
          if (!isPublicPortal) {
            router.replace('/admin');
          }
        }
      })
      .finally(() => {
        if (!ignore) setAuthLoading(false);
      });

    // Auto-fill logged-in customer info if available
    try {
      const stored = localStorage.getItem('chardiwari_auth_session') || localStorage.getItem('dwarkesh_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u) {
          setProperty((prev) => ({
            ...prev,
            seller_name: prev.seller_name || u.name || '',
            seller_email: prev.seller_email || u.email || '',
            seller_phone: prev.seller_phone || u.phone || '',
          }));
        }
      }
    } catch (_) {}

    return () => {
      ignore = true;
    };
  }, []);

  // Load existing property if in Edit mode
  useEffect(() => {
    if (!editId || !isAdminLoggedIn) return;

    fetch(`/api/admin/properties/${editId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.property) {
          const p = data.property;
          setProperty((prev) => ({
            ...prev,
            ...p,
            id: p.id,
            price_on_demand: Boolean(p.price_on_demand || p.priceOnDemand),
            is_negotiable: Boolean(p.is_negotiable || p.isNegotiable),
            gallery: Array.isArray(p.gallery || p.media_gallery)
              ? (p.gallery || p.media_gallery).map((img) =>
                  typeof img === 'string' ? { url: img, caption: '' } : img
                )
              : prev.gallery,
            nearby: Array.isArray(p.nearby) && p.nearby.length > 0 ? p.nearby : prev.nearby,
            faqs: Array.isArray(p.faqs) && p.faqs.length > 0 ? p.faqs : prev.faqs,
            amenities: Array.isArray(p.amenities) && p.amenities.length > 0 ? p.amenities : prev.amenities,
            highlights: Array.isArray(p.highlights) && p.highlights.length > 0 ? p.highlights : prev.highlights,
            coordinates: p.coordinates || prev.coordinates,
          }));
        }
      })
      .catch((err) => {
        console.error('Failed to load edit property:', err);
      });
  }, [editId, isAdminLoggedIn]);

  // Title change & auto-slug
  const handleTitleChange = (val) => {
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-');

    setProperty((prev) => ({
      ...prev,
      title: val,
      slug: editId ? prev.slug : slug,
    }));
  };

  // Price change
  const handlePriceChange = (val) => {
    const num = parsePriceToCrores(val);
    setProperty((prev) => ({
      ...prev,
      price: val,
      price_num: num || prev.price_num,
    }));
  };

  // Step transitions
  const goToNextStep = () => {
    // Validation before leaving step 1 (Seller Contact)
    if (currentStep === 1) {
      if (!property.seller_name?.trim()) {
        alert('Please enter your full name as the seller / contact person.');
        return;
      }
      const cleanPhone = (property.seller_phone || '').replace(/[^\d]/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        alert('Please enter a valid 10-digit mobile number for administrative verification.');
        return;
      }
    }
    // Validation before leaving step 2 (Overview)
    if (currentStep === 2) {
      if (!property.title.trim()) {
        alert('Please enter a Property Name/Title.');
        return;
      }
      if (!property.location.trim()) {
        alert('Please enter Locality & Area.');
        return;
      }
    }
    // Validation before leaving step 3 (Pricing)
    if (currentStep === 3) {
      if (!property.price_on_demand && !property.price.trim()) {
        alert('Please enter a Quoted Price or select Price on Demand.');
        return;
      }
    }

    if (currentStep < 9) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  // Upload handlers
  const handleCoverUpload = async (file) => {
    if (!file) return;
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'properties');

      const uploadUrl = isAdminLoggedIn ? '/api/admin/upload' : '/api/properties/upload';
      const res = await fetch(uploadUrl, { method: 'POST', body: formData });
      const data = await res.json();
      const finalUrl = data.url || data.media?.url;
      if (res.ok && finalUrl) {
        setProperty((prev) => ({ ...prev, image: finalUrl }));
      } else {
        alert(data.error || 'Upload failed.');
      }
    } catch (err) {
      alert('Failed to upload image.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleGalleryUpload = async (file) => {
    if (!file) return;
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'properties');

      const uploadUrl = isAdminLoggedIn ? '/api/admin/upload' : '/api/properties/upload';
      const res = await fetch(uploadUrl, { method: 'POST', body: formData });
      const data = await res.json();
      const finalUrl = data.url || data.media?.url;
      if (res.ok && finalUrl) {
        setProperty((prev) => ({
          ...prev,
          gallery: [...prev.gallery, { url: finalUrl, caption: `View ${prev.gallery.length + 1}` }],
        }));
      } else {
        alert(data.error || 'Upload failed.');
      }
    } catch (err) {
      alert('Failed to upload gallery image.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleVideoUpload = async (file) => {
    if (!file) return;
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'properties');

      const uploadUrl = isAdminLoggedIn ? '/api/admin/upload' : '/api/properties/upload';
      const res = await fetch(uploadUrl, { method: 'POST', body: formData });
      const data = await res.json();
      const finalUrl = data.url || data.media?.url;
      if (res.ok && finalUrl) {
        setProperty((prev) => ({ ...prev, video_url: finalUrl }));
      } else {
        alert(data.error || 'Upload failed.');
      }
    } catch (err) {
      alert('Failed to upload video.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Auto-Geocode from Address
  const handleGeocodeAddress = async () => {
    if (!property.location && !property.city) {
      alert('Please enter a location or city first.');
      return;
    }
    setGeocodingLoading(true);
    const query = `${property.location}, ${property.city}`;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.[0]) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setProperty((prev) => ({ ...prev, coordinates: { lat, lng } }));
          return;
        }
      }
      alert('Could not pinpoint coordinates automatically. You can click on the map directly to place the pin.');
    } catch (err) {
      alert('Geocoding service unavailable. You can click on the map to place the pin.');
    } finally {
      setGeocodingLoading(false);
    }
  };

  // Prepopulate standard city landmarks
  const handlePrepopulateLandmarks = () => {
    const city = property.city || 'Gurugram';
    const presets = [
      { type: 'metro', name: `${city} Central Rapid Metro Station`, km: 2.8, time: '6 mins' },
      { type: 'airport', name: `International Airport Terminal`, km: 24.5, time: '35 mins' },
      { type: 'hospital', name: `Apollo / Fortis Multi-Specialty Hospital`, km: 4.6, time: '10 mins' },
      { type: 'mall', name: `The Promenade Luxury Mall & High Street`, km: 1.9, time: '4 mins' },
      { type: 'school', name: `The Heritage International School`, km: 3.2, time: '8 mins' },
    ];
    setProperty((prev) => ({ ...prev, nearby: presets }));
  };

  // Preload Standard FAQs
  const handlePreloadFaqs = () => {
    const title = property.title || 'this residence';
    const priceText = property.price_on_demand ? 'Price on Request' : property.price;
    const isNeg = property.is_negotiable ? ' Terms are negotiable upon formal registration of interest.' : '';

    const standardFaqs = [
      {
        question: `What is the price of ${title}?`,
        answer: `${title} is listed at ${priceText}.${isNeg} Contact our dedicated relationship manager for payment schedules and site floor plans.`,
      },
      {
        question: `What is the exact location and connectivity?`,
        answer: `The property is situated at ${property.location}, ${property.city}. It enjoys immediate connectivity to key arterial corridors and lifestyle hubs.`,
      },
      {
        question: `Is ${title} ready to move or under construction?`,
        answer: `The property status is currently "${property.possession}". Handover and possession certificates are fully documented.`,
      },
      {
        question: `What are the bedroom and area specifications?`,
        answer: `It features ${property.beds} and ${property.baths} spanning a generous carpet area of ${property.area}.`,
      },
      {
        question: `How can I arrange a private site visit?`,
        answer: `Tap "Book a Free Visit" or connect on WhatsApp. We provide private, chauffeured viewings seven days a week at zero convenience charge.`,
      },
    ];

    setProperty((prev) => ({ ...prev, faqs: standardFaqs }));
  };

  // Add Landmark
  const handleAddNearby = (e) => {
    e.preventDefault();
    if (!newNearby.name || !newNearby.km) return;
    setProperty((prev) => ({
      ...prev,
      nearby: [
        ...prev.nearby,
        {
          ...newNearby,
          km: parseFloat(newNearby.km),
          time: newNearby.time || `${Math.round(parseFloat(newNearby.km) * 2.5)} mins`,
        },
      ],
    }));
    setNewNearby({ name: '', type: 'metro', km: '', time: '' });
  };

  // Add Highlight
  const handleAddHighlight = (e) => {
    e.preventDefault();
    if (!newHighlight.trim()) return;
    setProperty((prev) => ({
      ...prev,
      highlights: [...prev.highlights, newHighlight.trim()],
    }));
    setNewHighlight('');
  };

  // Add FAQ
  const handleAddFaq = (e) => {
    e.preventDefault();
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    setProperty((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: newFaqQ.trim(), answer: newFaqA.trim() }],
    }));
    setNewFaqQ('');
    setNewFaqA('');
  };

  // Toggle Amenity
  const handleToggleAmenity = (id) => {
    setProperty((prev) => {
      const exists = prev.amenities.includes(id);
      return {
        ...prev,
        amenities: exists ? prev.amenities.filter((a) => a !== id) : [...prev.amenities, id],
      };
    });
  };

  // Tracking handler for checking review status
  const handlePerformTrack = async (searchVal = null) => {
    const q = (searchVal !== null ? searchVal : trackingQuery).trim();
    if (!q) {
      setTrackingError('Please enter a phone number or submission reference.');
      return;
    }

    setTrackingLoading(true);
    setTrackingError('');
    setTrackingResults(null);

    try {
      const res = await fetch(`/api/properties/track?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to look up tracking details.');
      }
      setTrackingResults(data.properties || []);
    } catch (err) {
      setTrackingError(err.message || 'Error looking up listing status.');
    } finally {
      setTrackingLoading(false);
    }
  };

  // Save handler (supports both direct admin publishing and seller submission for review)
  const handleSaveProperty = async (statusOverride = null) => {
    setSaveLoading(true);
    setSaveMessage({ text: '', type: '' });

    // Validation for Seller Contact
    if (!isAdminLoggedIn || !editId) {
      if (!property.seller_name?.trim()) {
        setSaveMessage({ text: 'Please enter seller / contact full name.', type: 'error' });
        setSaveLoading(false);
        setCurrentStep(1);
        return;
      }
      const cleanPhone = (property.seller_phone || '').replace(/[^\d]/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        setSaveMessage({ text: 'Please enter a valid 10-digit mobile number.', type: 'error' });
        setSaveLoading(false);
        setCurrentStep(1);
        return;
      }
    }

    if (!property.title) {
      setSaveMessage({ text: 'Please enter a property title.', type: 'error' });
      setSaveLoading(false);
      setCurrentStep(2);
      return;
    }
    if (!property.location) {
      setSaveMessage({ text: 'Please enter a property location or address.', type: 'error' });
      setSaveLoading(false);
      setCurrentStep(2);
      return;
    }
    if (!property.price_on_demand && !property.price) {
      setSaveMessage({ text: 'Please enter a price or select "Price on Demand".', type: 'error' });
      setSaveLoading(false);
      setCurrentStep(3);
      return;
    }

    const totalImages = (property.image ? 1 : 0) + (property.gallery?.length || 0);
    if (totalImages < (property.min_images_required || 3)) {
      setSaveMessage({
        text: `Minimum ${property.min_images_required || 3} images are required (Cover + Gallery). Currently you have ${totalImages}.`,
        type: 'error',
      });
      setSaveLoading(false);
      setCurrentStep(5);
      return;
    }

    // If regular user (seller), submit for review to admin
    if (!isAdminLoggedIn) {
      try {
        const payload = {
          seller: {
            name: property.seller_name.trim(),
            phone: property.seller_phone.trim(),
            email: (property.seller_email || '').trim(),
            role: property.seller_role || 'owner',
            whatsapp_consent: property.whatsapp_consent !== false,
            preferred_contact: property.preferred_contact || 'anytime',
          },
          property: {
            ...property,
            status: 'pending_review',
          },
        };

        const res = await fetch('/api/properties/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setSaveMessage({ text: data.error || 'Failed to submit property.', type: 'error' });
          return;
        }

        // Store reference in localStorage for instant tracking
        try {
          const prevRefs = JSON.parse(localStorage.getItem('my_property_submissions') || '[]');
          prevRefs.unshift({
            ref: data.submission_ref,
            id: data.property_id,
            title: property.title,
            phone: property.seller_phone,
            date: new Date().toISOString(),
          });
          localStorage.setItem('my_property_submissions', JSON.stringify(prevRefs.slice(0, 10)));
        } catch (_) {}

        setSubmittedSubmission(data);
        window.scrollTo({ top: 80, behavior: 'smooth' });
      } catch (err) {
        setSaveMessage({ text: 'Error connecting to submission service.', type: 'error' });
      } finally {
        setSaveLoading(false);
      }
      return;
    }

    // If authenticated admin, save/publish directly
    const finalStatus = statusOverride || property.status || 'published';
    const payload = {
      ...property,
      status: finalStatus,
      price_num: property.price_num || parsePriceToCrores(property.price),
      media_gallery: property.gallery,
    };

    try {
      const url = editId ? `/api/admin/properties/${editId}` : '/api/admin/properties';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveMessage({ text: data.error || 'Failed to save property.', type: 'error' });
        return;
      }

      setSaveMessage({
        text: editId ? 'Property updated successfully!' : 'Property published successfully!',
        type: 'success',
      });

      setTimeout(() => {
        router.push('/admin');
      }, 1200);
    } catch (err) {
      setSaveMessage({ text: 'Error connecting to database service.', type: 'error' });
    } finally {
      setSaveLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl h-16 flex items-center px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/dwarkesh-logo-transparent.png"
              alt="Dwarkesh"
              width={1024}
              height={551}
              className="h-8 w-auto max-w-[50px] object-contain drop-shadow-xs"
            />
            <span className="font-serif font-bold tracking-[0.14em] text-black text-sm uppercase">Dwarkesh</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 text-stone-700">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Opening Listing Suite...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalUploadedImages = (property.image ? 1 : 0) + (property.gallery?.length || 0);
  const minRequired = property.min_images_required || 3;
  const imageRequirementMet = totalUploadedImages >= minRequired;
  const activeStepObj = STEPS.find((s) => s.id === currentStep) || STEPS[0];

  return (
    <div className="min-h-screen bg-stone-50/50 dark:bg-white text-stone-900 flex flex-col font-sans selection:bg-stone-900 selection:text-white">
      {/* Top Header Bar */}
      <header className="border-b border-stone-200/90 bg-white/95 backdrop-blur-xl sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href={isPublicPortal ? '/' : (isAdminLoggedIn ? '/admin' : '/')}
              className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition flex items-center gap-1.5 text-xs font-semibold shrink-0"
              title={isPublicPortal ? 'Return to Home' : (isAdminLoggedIn ? 'Return to Admin Portfolio' : 'Return to Home')}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{isPublicPortal ? 'Home' : (isAdminLoggedIn ? 'Portfolio' : 'Home')}</span>
            </Link>

            <span className="h-4 w-px bg-stone-200 hidden sm:block" />

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-serif font-bold text-stone-900 text-sm sm:text-base tracking-tight truncate max-w-[150px] xs:max-w-[200px] sm:max-w-xs">
                {editId
                  ? `Edit: ${property.title || 'Listing'}`
                  : isPublicPortal
                  ? 'Post Your Property'
                  : isAdminLoggedIn
                  ? 'New Property Listing'
                  : 'Post Your Property'}
              </span>
              {!isPublicPortal && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                    isAdminLoggedIn && property.status === 'published'
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-700 border border-stone-200'
                  }`}
                >
                  {isAdminLoggedIn && property.status === 'published' ? 'Live' : 'Under Review'}
                </span>
              )}
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Track Status */}
            <Link
              href="/track"
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-stone-200 hover:border-stone-900 bg-white text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              title="Track submitted listing review status"
            >
              <Search className="w-3.5 h-3.5 text-stone-600" />
              <span>Track</span>
            </Link>

            {/* Preview button - visible on desktop for inspection, hidden on small mobile to prevent header blowout */}
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="hidden sm:flex px-3 py-1.5 rounded-xl border border-stone-200 hover:border-stone-900 bg-white text-stone-800 text-xs font-semibold items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Preview buyer card"
            >
              <Eye className="w-3.5 h-3.5 text-stone-600" />
              <span>{showLivePreview ? 'Hide' : 'Preview'}</span>
            </button>

            {isAdminLoggedIn && !isPublicPortal ? (
              <>
                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={() => handleSaveProperty('draft')}
                  className="hidden md:inline-flex px-3.5 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition cursor-pointer"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={() => handleSaveProperty('published')}
                  className="px-3 sm:px-4 py-1.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {saveLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{editId ? 'Save' : 'Publish'}</span>
                    </>
                  )}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Multi-Step Suite Content */}
      <main className="max-w-5xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-6 flex-1 pb-28 sm:pb-12">
        {/* Step Progress Bar & Stepper Tabs */}
        <div className="mb-5 sm:mb-6 bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-3">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Step {currentStep} of 9
              </span>
              <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                {activeStepObj.title}
              </h2>
            </div>
            <div className="text-xs text-stone-500 font-medium hidden sm:block">
              {activeStepObj.desc}
            </div>
          </div>

          {/* Mobile Step Compact Indicator */}
          <div className="sm:hidden pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-600 mb-2">
              <span>{activeStepObj.title}</span>
              <span className="font-mono text-stone-400">Step {currentStep} of 9</span>
            </div>
            <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-stone-900 h-full transition-all duration-300"
                style={{ width: `${(currentStep / 9) * 100}%` }}
              />
            </div>
          </div>

          {/* Stepper Tabs - Desktop 9-Column Grid */}
          <div className="hidden sm:grid sm:grid-cols-9 gap-1.5 pt-1">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isCurrent = currentStep === step.id;
              const isPast = currentStep > step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                    isCurrent
                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                      : isPast
                      ? 'bg-stone-100 text-stone-800 border-stone-200 hover:bg-stone-200'
                      : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100 hover:text-stone-800'
                  }`}
                  title={step.title}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isCurrent ? 'text-white' : isPast ? 'text-stone-800' : 'text-stone-400'
                    }`}
                  />
                  <span className="text-[11px] font-medium truncate w-full text-center">
                    {step.short}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Save Message */}
        {saveMessage.text && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs flex items-center gap-2.5 shadow-xs ${
              saveMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border border-rose-200 text-rose-900'
            }`}
          >
            {saveMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span className="font-medium">{saveMessage.text}</span>
          </div>
        )}

        {/* Live Marketplace Card Preview Drawer */}
        {showLivePreview && (
          <div className="mb-6 p-6 rounded-3xl bg-white border border-stone-200 shadow-sm animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
                <Eye className="w-4 h-4 text-stone-800" />
                <span>Buyer Card Preview</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLivePreview(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-medium cursor-pointer"
              >
                Close Preview
              </button>
            </div>

            <div className="max-w-sm mx-auto bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-md">
              <div className="relative aspect-4/3 w-full bg-stone-100">
                <img
                  src={property.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'}
                  alt={property.title || 'Preview'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3.5 left-3.5 flex gap-1.5 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-semibold text-stone-900 shadow-xs">
                    {property.badge || 'Verified Property'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-700 text-white text-xs font-medium shadow-xs">
                    {property.tag || 'Available'}
                  </span>
                </div>
                <div className="absolute bottom-3.5 left-3.5 flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-xl bg-stone-900/90 backdrop-blur-md text-white font-serif font-bold text-base tabular-nums shadow-xs">
                    {property.price_on_demand ? 'Price on Request' : property.price}
                  </span>
                  {property.is_negotiable && (
                    <span className="px-2 py-1 rounded-lg bg-stone-900/90 backdrop-blur-md text-white font-bold text-[10px] uppercase tracking-wider shadow-xs border border-white/20">
                      Negotiable
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate">{property.location || 'Location Address'}</span>
                </div>
                <h4 className="text-base font-bold text-stone-900 truncate mb-1">
                  {property.title || 'Property Title'}
                </h4>
                <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-4">
                  {property.description}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs font-medium text-stone-600">
                  <div className="flex items-center gap-1">
                    <Bed className="w-4 h-4 text-stone-400" />
                    <span>{property.beds}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-4 h-4 text-stone-400" />
                    <span>{property.baths}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Maximize2 className="w-4 h-4 text-stone-400" />
                    <span>{property.area}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submission Confirmation Screen (for regular sellers) */}
        {submittedSubmission && (
          <div className="mb-8 p-6 sm:p-10 rounded-3xl bg-white border border-emerald-200 shadow-sm animate-fade-in text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
              Awaiting Admin Review
            </span>
            <h2 className="text-2xl font-serif font-bold text-stone-900 mt-3 mb-2">
              Property Submitted Successfully!
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed mb-6">
              Thank you, <strong>{property.seller_name}</strong>. Your property <strong>&ldquo;{property.title}&rdquo;</strong> has been received by our editorial verification desk. We will review the details and connect with you shortly.
            </p>

            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 mb-6 text-left max-w-md mx-auto space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Your Submission Reference
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-base sm:text-lg font-bold text-stone-900 select-all">
                  {submittedSubmission.submission_ref}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(submittedSubmission.submission_ref);
                    alert('Submission reference copied to clipboard!');
                  }}
                  className="px-3 py-1 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Copy ID
                </button>
              </div>
              <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200/80">
                Registered Contact: <span className="font-semibold text-stone-800">+91 {property.seller_phone}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/track?ref=${encodeURIComponent(submittedSubmission.submission_ref)}`}
                className="w-full sm:w-auto px-6 py-3 bg-stone-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Track Status on Live Dashboard ↗</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmittedSubmission(null);
                  setCurrentStep(1);
                  setProperty({
                    title: '',
                    slug: '',
                    price: '',
                    price_num: 0,
                    price_on_demand: false,
                    is_negotiable: false,
                    location: '',
                    city: 'Gurugram',
                    type: 'Luxury Villa & Estate',
                    bhk: '4 BHK',
                    beds: '4 Beds',
                    baths: '5 Baths',
                    area: '5,500 sq.ft',
                    image: '',
                    gallery: [],
                    video_url: '',
                    tag: 'Available',
                    badge: 'Verified Property',
                    possession: 'Ready to Move',
                    furnishing: 'Fully Furnished',
                    floor: 'Top Floor / Penthouse',
                    facing: 'North-East',
                    parking: '3 Covered Bays',
                    builder: '',
                    project_size: '2.5 Acres',
                    description: '',
                    highlights: [],
                    amenities: ['pool', 'gym', 'clubhouse', 'security', 'power-backup'],
                    nearby: [],
                    faqs: [],
                    coordinates: { lat: 28.4595, lng: 77.0266 },
                    min_images_required: 3,
                    seller_name: '',
                    seller_phone: '',
                    seller_email: '',
                    seller_role: 'owner',
                    whatsapp_consent: true,
                    preferred_contact: 'anytime',
                  });
                }}
                className="w-full sm:w-auto px-5 py-3 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                Submit Another Property
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: SELLER & CONTACT DETAILS                                          */}
        {/* ========================================================================= */}
        {!submittedSubmission && currentStep === 1 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6 animate-fade-in">
            <div className="border-b border-stone-100 pb-3 sm:pb-4">
              <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                Your Contact Details
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-light">
                Our verification desk and prospective buyers will reach out to you directly on these details.
              </p>
            </div>

            {/* Seller Contact Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Full Name */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Your Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={property.seller_name || ''}
                    onChange={(e) => setProperty({ ...property, seller_name: e.target.value })}
                    placeholder="e.g. Vikram Singhania"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Mobile Phone */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Mobile Number *
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-stone-200 bg-stone-100 text-stone-700 text-xs sm:text-sm font-semibold select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={property.seller_phone || ''}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 10);
                      setProperty({ ...property, seller_phone: digits });
                    }}
                    placeholder="98765 43210"
                    className="w-full px-3.5 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-r-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition font-mono tracking-wide"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Email Address <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={property.seller_email || ''}
                    onChange={(e) => setProperty({ ...property, seller_email: e.target.value })}
                    placeholder="vikram@singhania.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* You are the */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  I am the *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'owner', label: 'Owner' },
                    { id: 'agent', label: 'Agent / Broker' },
                    { id: 'builder', label: 'Builder' },
                  ].map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setProperty({ ...property, seller_role: role.id })}
                      className={`py-2 px-3 rounded-xl border text-center transition cursor-pointer text-xs font-semibold ${
                        (property.seller_role || 'owner') === role.id
                          ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp Toggle */}
              <div className="sm:col-span-1 flex items-end">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700 pb-2">
                  <input
                    type="checkbox"
                    checked={property.whatsapp_consent !== false}
                    onChange={(e) => setProperty({ ...property, whatsapp_consent: e.target.checked })}
                    className="rounded text-stone-900 focus:ring-stone-900 cursor-pointer"
                  />
                  <span>WhatsApp updates on this number</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: BASIC OVERVIEW & DETAILS                                          */}
        {/* ========================================================================= */}
        {!submittedSubmission && currentStep === 2 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6 animate-fade-in">
            <div className="border-b border-stone-100 pb-3 sm:pb-4">
              <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <Home className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800" />
                <span>Property Name, Type, City & Possession</span>
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-light">
                Basic details that appear on the property header and marketplace search cards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
              {/* Property Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Property Name / Title *
                </label>
                <input
                  type="text"
                  required
                  value={property.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. The Courtyard Villa"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition"
                />
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-stone-500">
                  <span>URL link: /property/{property.slug || 'property-name'}</span>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedSlug(!showAdvancedSlug)}
                    className="text-stone-800 hover:underline font-semibold cursor-pointer"
                  >
                    {showAdvancedSlug ? 'Hide custom URL' : 'Edit URL'}
                  </button>
                </div>
                {showAdvancedSlug && (
                  <input
                    type="text"
                    value={property.slug}
                    onChange={(e) => setProperty({ ...property, slug: e.target.value })}
                    className="mt-2 w-full px-3 py-2 bg-stone-100 border border-stone-300 rounded-xl text-xs font-mono text-stone-800"
                    placeholder="custom-slug"
                  />
                )}
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Property Type *
                </label>
                <select
                  value={property.type}
                  onChange={(e) => setProperty({ ...property, type: e.target.value })}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition cursor-pointer"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">City *</label>
                <select
                  value={property.city}
                  onChange={(e) => setProperty({ ...property, city: e.target.value })}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition cursor-pointer"
                >
                  {MAJOR_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Locality */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Locality & Area *
                </label>
                <input
                  type="text"
                  required
                  value={property.location}
                  onChange={(e) => setProperty({ ...property, location: e.target.value })}
                  placeholder="e.g. Golf Course Extension, Sector 66"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition"
                />
              </div>

              {/* Possession Status: CLEAN DROPDOWN (USER REQUIREMENT) */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Possession Status *
                </label>
                <select
                  value={property.possession}
                  onChange={(e) => setProperty({ ...property, possession: e.target.value })}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition cursor-pointer"
                >
                  {POSSESSION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Listing Mode */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Listing For *
                </label>
                <select
                  value={property.mode}
                  onChange={(e) => setProperty({ ...property, mode: e.target.value })}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition cursor-pointer"
                >
                  <option value="both">Both (Sale & Rent)</option>
                  <option value="buy">Sale Only</option>
                  <option value="rent">Rent / Lease Only</option>
                </select>
              </div>

              {/* Developer / Builder */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Developer / Builder
                </label>
                <input
                  type="text"
                  value={property.builder}
                  onChange={(e) => setProperty({ ...property, builder: e.target.value })}
                  placeholder="e.g. Studio Lotus / DLF"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition"
                />
              </div>

              {/* Badge */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Listing Badge / Pill
                </label>
                <input
                  type="text"
                  value={property.badge}
                  onChange={(e) => setProperty({ ...property, badge: e.target.value })}
                  placeholder="Verified Property / Prime Location"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: PRICING & COMMERCIAL TERMS                                        */}
        {/* ========================================================================= */}
        {!submittedSubmission && currentStep === 3 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6 animate-fade-in">
            <div className="border-b border-stone-100 pb-3 sm:pb-4">
              <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800" />
                <span>Pricing, Negotiable Option & Rental Terms</span>
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-light">
                Enter your asking price, and easily toggle Negotiable or Price on Request.
              </p>
            </div>

            {/* Quick Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Negotiable Toggle */}
              <label
                className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition select-none flex items-start gap-3.5 ${
                  property.is_negotiable
                    ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                    : 'bg-stone-50/60 border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={property.is_negotiable}
                  onChange={(e) => setProperty({ ...property, is_negotiable: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-stone-900 flex items-center gap-2">
                    <span>Price is Negotiable</span>
                    {property.is_negotiable && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                        Active Pill
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Adds a &ldquo;Negotiable&rdquo; badge to attract more buyer inquiries.
                  </p>
                </div>
              </label>

              {/* Price on Demand Toggle */}
              <label
                className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition select-none flex items-start gap-3.5 ${
                  property.price_on_demand
                    ? 'bg-stone-100 border-stone-400 shadow-xs'
                    : 'bg-stone-50/60 border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={property.price_on_demand}
                  onChange={(e) => setProperty({ ...property, price_on_demand: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded accent-stone-900 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-stone-900 flex items-center gap-2">
                    <span>Price on Demand / Request</span>
                    {property.price_on_demand && (
                      <span className="px-2 py-0.5 rounded-full bg-stone-900 text-white text-[10px] font-bold">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Hides the number and displays &ldquo;Price on Request&rdquo; on cards.
                  </p>
                </div>
              </label>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Quoted Sale Price *
                </label>
                <input
                  type="text"
                  value={property.price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="e.g. ₹5.50 Cr or ₹85 Lakh"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 font-serif font-bold focus:outline-none focus:border-stone-900 transition"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Auto-detected: ₹{property.price_num} Cr (calculated automatically)
                </p>
              </div>

              {/* Rent Price */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Monthly Rent (if for rent)
                </label>
                <input
                  type="text"
                  value={property.rent_price || ''}
                  onChange={(e) => setProperty({ ...property, rent_price: e.target.value })}
                  placeholder="e.g. ₹2.80 Lakh/mo"
                  className="w-full px-4 py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:border-stone-900 transition"
                />
              </div>

              {/* Maintenance */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Maintenance / Month
                </label>
                <input
                  type="text"
                  value={property.maintenance_charges || ''}
                  onChange={(e) => setProperty({ ...property, maintenance_charges: e.target.value })}
                  placeholder="e.g. ₹12,000 / month"
                  className="w-full px-4 py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:border-stone-900 transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: SPECIFICATIONS                                                    */}
        {/* ========================================================================= */}
        {!submittedSubmission && currentStep === 4 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6 animate-fade-in">
            <div className="border-b border-stone-100 pb-3 sm:pb-4">
              <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800" />
                <span>Property Size, Configuration & Details</span>
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-light">
                BHK, area, bedrooms, bathrooms, and parking slots.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">BHK *</label>
                <select
                  value={property.bhk}
                  onChange={(e) => setProperty({ ...property, bhk: e.target.value })}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition cursor-pointer"
                >
                  <option value="1 BHK">1 BHK</option>
                  <option value="2 BHK">2 BHK</option>
                  <option value="3 BHK">3 BHK</option>
                  <option value="4 BHK">4 BHK</option>
                  <option value="5 BHK">5 BHK</option>
                  <option value="6+ BHK">6+ BHK</option>
                  <option value="Villa">Villa Estate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">Bedrooms *</label>
                <input
                  type="text"
                  value={property.beds}
                  onChange={(e) => setProperty({ ...property, beds: e.target.value })}
                  placeholder="4 Beds"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">Bathrooms *</label>
                <input
                  type="text"
                  value={property.baths}
                  onChange={(e) => setProperty({ ...property, baths: e.target.value })}
                  placeholder="5 Baths"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Property Size / Area *
                </label>
                <input
                  type="text"
                  value={property.area}
                  onChange={(e) => setProperty({ ...property, area: e.target.value })}
                  placeholder="4,800 sq.ft"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">Furnishing</label>
                <select
                  value={property.furnishing}
                  onChange={(e) => setProperty({ ...property, furnishing: e.target.value })}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition cursor-pointer"
                >
                  <option value="Fully Furnished">Fully Furnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">Facing / Vastu</label>
                <select
                  value={property.facing}
                  onChange={(e) => setProperty({ ...property, facing: e.target.value })}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition cursor-pointer"
                >
                  <option value="North-East">North-East</option>
                  <option value="North">North</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="South">South</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">Floor Level</label>
                <input
                  type="text"
                  value={property.floor_info || ''}
                  onChange={(e) => setProperty({ ...property, floor_info: e.target.value })}
                  placeholder="Ground + 2 Floors"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">Parking Bays</label>
                <input
                  type="text"
                  value={property.parking || ''}
                  onChange={(e) => setProperty({ ...property, parking: e.target.value })}
                  placeholder="2 Covered Bays"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: PHOTOS & VIDEO TOUR (MINIMUM 3 PHOTOS)                            */}
        {/* ========================================================================= */}
        {!submittedSubmission && currentStep === 5 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6 animate-fade-in">
            <div className="border-b border-stone-100 pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                  <Film className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800" />
                  <span>Cover Photo, Gallery Photos & Video Walkthrough</span>
                </h3>
                <p className="text-xs text-stone-500 mt-1 font-light">
                  Upload cover photo, gallery images (minimum 3 photos required), and optional video.
                </p>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto">
                <span>Min Requirement: {minRequired} Photos</span>
                <span className={imageRequirementMet ? 'text-emerald-700 font-bold' : 'text-stone-600 font-bold'}>
                  ({totalUploadedImages} uploaded)
                </span>
              </div>
            </div>

            {uploadLoading && (
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-stone-100 border border-stone-200 text-stone-800 text-xs flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 animate-spin text-stone-700" />
                <span>Uploading file securely to storage...</span>
              </div>
            )}

            {/* Cover Photo */}
            <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-stone-50/70 border border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-stone-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-stone-900" />
                  <span>Cover Photo *</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleCoverUpload(f);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLoading}
                    className="px-3 py-1.5 bg-white border border-stone-300 hover:border-stone-900 text-stone-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Cover</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 items-center">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    value={property.image}
                    onChange={(e) => setProperty({ ...property, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition"
                  />
                </div>
                <div className="aspect-video bg-stone-200 rounded-2xl overflow-hidden border border-stone-300 relative shadow-inner">
                  {property.image ? (
                    <img src={property.image} alt="Cover preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                      No cover image
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Gallery Photos */}
            <div className="p-5 rounded-2xl bg-stone-50/70 border border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Gallery Photos ({property.gallery?.length || 0})</span>
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Add interior, terrace, and bedroom views.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={galleryInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleGalleryUpload(f);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploadLoading}
                    className="px-3.5 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Photo</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {property.gallery.map((img, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    <div className="relative aspect-video bg-stone-100">
                      <img src={img.url} alt={`Gallery view ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setProperty((prev) => ({
                            ...prev,
                            gallery: prev.gallery.filter((_, i) => i !== idx),
                          }))
                        }
                        className="absolute top-2 right-2 p-1.5 bg-black/75 hover:bg-rose-700 text-white rounded-lg transition cursor-pointer shadow-xs"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="p-3">
                      <input
                        type="text"
                        value={img.caption || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProperty((prev) => ({
                            ...prev,
                            gallery: prev.gallery.map((g, i) => (i === idx ? { ...g, caption: val } : g)),
                          }));
                        }}
                        placeholder="Caption (e.g. Master Bedroom)"
                        className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:border-stone-900"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Link */}
            <div className="p-5 rounded-2xl bg-stone-50/70 border border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-stone-900 flex items-center gap-2">
                  <Video className="w-4 h-4 text-stone-700" />
                  <span>Video Walkthrough (YouTube or MP4)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleVideoUpload(f);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadLoading}
                    className="px-3 py-1.5 bg-white border border-stone-300 hover:border-stone-900 text-stone-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Video File</span>
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={property.video_url || ''}
                onChange={(e) => setProperty({ ...property, video_url: e.target.value })}
                placeholder="Paste YouTube or Vimeo link e.g. https://youtu.be/..."
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:border-stone-900 transition"
              />

              {property.video_url && (() => {
                const parsedVideo = parseVideoUrl(property.video_url);
                return (
                  <div className="mt-4 aspect-video max-w-md mx-auto bg-black rounded-2xl overflow-hidden border border-stone-300 relative shadow-sm">
                    {parsedVideo?.type === 'youtube' ? (
                      <iframe
                        src={parsedVideo.embedUrl}
                        title="Video Preview"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        key={property.video_url}
                        src={property.video_url}
                        controls
                        playsInline
                        className="w-full h-full object-contain bg-black"
                      />
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: LOCATION & LANDMARK MAP (DISTANCE VISIBLE FROM MAIN HOME)         */}
        {/* ========================================================================= */}
        {!submittedSubmission && currentStep === 6 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6 animate-fade-in">
            <div className="border-b border-stone-100 pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800" />
                  <span>Main Property Location & Distances to Landmarks</span>
                </h3>
                <p className="text-xs text-stone-500 mt-1 font-light">
                  Click on the map to set the home pin. Distances to nearest landmarks are plotted with connecting routes.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGeocodeAddress}
                disabled={geocodingLoading}
                className="w-full sm:w-auto justify-center px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
              >
                <Compass className={`w-3.5 h-3.5 ${geocodingLoading ? 'animate-spin' : ''}`} />
                <span>📍 Locate Pin from Address</span>
              </button>
            </div>

            {/* Interactive Map with Distances from Home */}
            <PropertyMapPicker
              propertyCoords={property.coordinates}
              onCoordsChange={(newCoords) => setProperty((prev) => ({ ...prev, coordinates: newCoords }))}
              propertyTitle={property.title || 'Property'}
              nearbyLocations={property.nearby}
              selectedNearbyIndex={selectedNearbyIndex}
              onSelectNearby={(idx) => setSelectedNearbyIndex(idx)}
            />

            {/* Nearest Landmarks Manager */}
            <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-stone-50/70 border border-stone-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-4">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">
                    Nearest Landmarks ({property.nearby?.length || 0})
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Shown with distance badges on the map and property page.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePrepopulateLandmarks}
                  className="w-full sm:w-auto justify-center px-3 py-1.5 bg-white border border-stone-200 hover:border-stone-900 text-stone-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5 text-stone-700" />
                  <span>Add Major City Landmarks</span>
                </button>
              </div>

              {/* Add Landmark Form */}
              <form onSubmit={handleAddNearby} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
                <div>
                  <select
                    value={newNearby.type}
                    onChange={(e) => setNewNearby({ ...newNearby, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 cursor-pointer"
                  >
                    <option value="metro">Metro Station</option>
                    <option value="airport">Airport</option>
                    <option value="hospital">Hospital</option>
                    <option value="school">School / College</option>
                    <option value="mall">Mall / High Street</option>
                    <option value="beach">Beach / Waterfront</option>
                    <option value="railway">Railway Station</option>
                    <option value="highway">Expressway</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    value={newNearby.name}
                    onChange={(e) => setNewNearby({ ...newNearby, name: e.target.value })}
                    placeholder="Place name (e.g. Sector 55 Metro)"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newNearby.km}
                    onChange={(e) => setNewNearby({ ...newNearby, km: e.target.value })}
                    placeholder="Dist (km)"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-stone-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1 transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </form>

              {/* Landmarks List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {property.nearby?.map((place, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedNearbyIndex(idx)}
                    className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-3 text-xs hover:border-stone-400 transition cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-[10px] font-bold uppercase text-stone-600">
                          {place.type}
                        </span>
                        <span className="font-bold text-stone-800">{place.km} km from Home</span>
                      </div>
                      <p className="font-semibold text-stone-900 truncate">{place.name}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProperty((prev) => ({
                          ...prev,
                          nearby: prev.nearby.filter((_, i) => i !== idx),
                        }));
                      }}
                      className="text-stone-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 7: AMENITIES & DESCRIPTION (REFINED STYLE & REAL ICONS)              */}
        {/* ========================================================================= */}
        {!submittedSubmission && currentStep === 7 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6 animate-fade-in">
            <div className="border-b border-stone-100 pb-3 sm:pb-4">
              <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800" />
                <span>Amenities & Property Narrative</span>
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-light">
                Select luxury amenities with authentic facility icons, and write a summary for buyers.
              </p>
            </div>

            {/* Refined Amenities Grid: Clean borders, soft cards, real icons (NO HEAVY BLACK PILLS) */}
            <div>
              <label className="block text-xs font-bold text-stone-900 mb-2.5 sm:mb-3">
                Luxury Amenities Included (Click to toggle)
              </label>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {LUXURY_AMENITIES.map((amenity) => {
                  const Icon = amenity.icon;
                  const isChecked = property.amenities?.includes(amenity.id);

                  return (
                    <label
                      key={amenity.id}
                      className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border cursor-pointer transition select-none flex items-center justify-between gap-2.5 ${
                        isChecked
                          ? 'bg-stone-50 border-stone-900 text-stone-950 ring-1 ring-stone-900/40 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400 hover:bg-stone-50/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleAmenity(amenity.id)}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`p-1.5 rounded-xl ${isChecked ? 'bg-white border border-stone-200' : 'bg-stone-100'}`}>
                          <Icon className={`w-4 h-4 ${amenity.color}`} />
                        </span>
                        <span className="text-xs font-semibold truncate">{amenity.label}</span>
                      </div>
                      {isChecked && (
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
                          ✓
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                Property Narrative / Description *
              </label>
              <textarea
                rows={4}
                required
                value={property.description}
                onChange={(e) => setProperty({ ...property, description: e.target.value })}
                placeholder="Spacious luxury residence with high ceilings, natural ventilation and curated finishes..."
                className="w-full p-3.5 sm:p-4 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition leading-relaxed"
              />
            </div>

            {/* Highlights */}
            <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-stone-50/70 border border-stone-200">
              <label className="block text-xs font-bold text-stone-900 mb-2">
                Signature Feature Bullets
              </label>
              <form onSubmit={handleAddHighlight} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  placeholder="e.g. Private plunge pool with sea view"
                  className="flex-1 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 sm:py-2.5 bg-stone-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {property.highlights?.map((hl, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-2 text-xs text-stone-800"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{hl}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setProperty((prev) => ({
                          ...prev,
                          highlights: prev.highlights.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-stone-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 8: CURATED BUYER FAQS & HIGHLIGHTS                                   */}
        {/* ========================================================================= */}
        {!submittedSubmission && currentStep === 8 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6 animate-fade-in">
            <div className="border-b border-stone-100 pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800" />
                  <span>Curated Buyer FAQs & Ready to Publish</span>
                </h3>
                <p className="text-xs text-stone-500 mt-1 font-light">
                  Common buyer questions pre-filled with this property&apos;s price, possession, and visit details.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePreloadFaqs}
                className="w-full sm:w-auto justify-center px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
              >
                <HelpCircle className="w-3.5 h-3.5 text-stone-700" />
                <span>Preload Standard 5 FAQs</span>
              </button>
            </div>

            {/* Add Custom FAQ */}
            <form onSubmit={handleAddFaq} className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-stone-50/70 border border-stone-200 space-y-2.5">
              <input
                type="text"
                value={newFaqQ}
                onChange={(e) => setNewFaqQ(e.target.value)}
                placeholder="Question (e.g. Is price negotiable for direct payment?)"
                className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900"
              />
              <textarea
                rows={2}
                value={newFaqA}
                onChange={(e) => setNewFaqA(e.target.value)}
                placeholder="Answer to display..."
                className="w-full p-3 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add FAQ</span>
                </button>
              </div>
            </form>

            {/* FAQs List */}
            <div className="space-y-2.5 sm:space-y-3">
              {property.faqs?.map((faq, idx) => (
                <div key={idx} className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-100 border border-stone-300 text-[10px] flex items-center justify-center font-mono shrink-0">
                        Q{idx + 1}
                      </span>
                      <span>{faq.question}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setProperty((prev) => ({
                          ...prev,
                          faqs: prev.faqs.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-stone-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-stone-600 pl-7 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>

            {/* Pre-Publish Checklist */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-stone-100/80 border border-stone-200 space-y-2">
              <h4 className="text-xs font-bold text-stone-900">Listing Readiness Summary:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-stone-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Title & City Set</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-700">
                  {imageRequirementMet ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-stone-500 shrink-0" />
                  )}
                  <span>{totalUploadedImages} Photos ({minRequired} required)</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{property.nearby?.length || 0} Landmarks on Map</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 9: EXECUTIVE REVIEW & VERIFICATION                                   */}
        {/* ========================================================================= */}
        {!submittedSubmission && currentStep === 9 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 p-4 sm:p-8 shadow-xs space-y-6 sm:space-y-8 animate-fade-in">
            {/* Header */}
            <div className="border-b border-stone-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 uppercase tracking-wider">
                  Final Step &bull; Quality Verification
                </span>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 flex items-center gap-2 mt-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Executive Review &amp; Submit for Editorial Approval</span>
                </h3>
                <p className="text-xs text-stone-500 mt-1 font-light">
                  Please review all verified contact details, specifications, and media. Once submitted, your property is verified by the Dwarkesh Editorial Board and you can track real-time approval status.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLivePreview(true)}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
              >
                <Eye className="w-3.5 h-3.5 text-stone-600" />
                <span>Open Buyer Card Preview</span>
              </button>
            </div>

            {/* Quick Hero Summary Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/80 border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-stone-200 shrink-0 border border-stone-300 relative shadow-xs">
                  {property.image ? (
                    <img
                      src={property.image}
                      alt={property.title || 'Cover'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                      No Cover
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-xs text-[10px] font-bold text-white">
                    {totalUploadedImages} photos
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{property.location || 'Location'}, {property.city}</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-serif font-bold text-stone-900 truncate">
                    {property.title || 'Untitled Property'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm sm:text-base font-serif font-bold text-stone-900">
                      {property.price_on_demand ? 'Price on Request' : property.price || 'Price Not Set'}
                    </span>
                    {property.is_negotiable && (
                      <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 text-[10px] font-bold uppercase tracking-wider">
                        Negotiable
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-stone-900 text-white text-[10px] font-bold">
                      {property.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col items-start md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-stone-200 text-xs text-stone-600 gap-1 shrink-0">
                <span className="text-[11px] font-medium text-stone-500">Contact Person</span>
                <span className="font-bold text-stone-900 text-sm">{property.seller_name || 'Not provided'}</span>
                <span className="font-mono text-xs text-stone-700">+91 {property.seller_phone || '—'}</span>
              </div>
            </div>

            {/* Structured Review Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Block 1: Seller & Verification Info */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                    <User className="w-4 h-4 text-stone-800" />
                    <span>Seller &amp; Contact Verification</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 underline cursor-pointer"
                  >
                    Edit Contact
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-stone-500 block text-[11px]">Seller Name</span>
                    <span className="font-semibold text-stone-900">{property.seller_name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Mobile Phone</span>
                    <span className="font-semibold text-stone-900 font-mono">+91 {property.seller_phone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Email</span>
                    <span className="font-semibold text-stone-900 truncate block">{property.seller_email || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Posting Role</span>
                    <span className="font-semibold text-stone-900 capitalize">{property.seller_role || 'Owner'}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Preferred Time</span>
                    <span className="font-semibold text-stone-900 capitalize">{property.preferred_contact || 'Any time'}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">WhatsApp Alerts</span>
                    <span className="font-semibold text-emerald-700">
                      {property.whatsapp_consent !== false ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Block 2: Fundamental Specs */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                    <Maximize2 className="w-4 h-4 text-stone-800" />
                    <span>Configuration &amp; Layout</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 underline cursor-pointer"
                  >
                    Edit Specs
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-stone-500 block text-[11px]">Configuration</span>
                    <span className="font-semibold text-stone-900">{property.bhk} ({property.beds})</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Carpet Area</span>
                    <span className="font-semibold text-stone-900">{property.area}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Bathrooms</span>
                    <span className="font-semibold text-stone-900">{property.baths}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Possession</span>
                    <span className="font-semibold text-stone-900">{property.possession}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Furnishing</span>
                    <span className="font-semibold text-stone-900">{property.furnishing}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Parking</span>
                    <span className="font-semibold text-stone-900">{property.parking || 'Covered Bays'}</span>
                  </div>
                </div>
              </div>

              {/* Block 3: Media & Virtual Assets */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                    <Film className="w-4 h-4 text-stone-800" />
                    <span>Media &amp; Photos ({totalUploadedImages})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 underline cursor-pointer"
                  >
                    Edit Photos
                  </button>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {property.image && (
                    <img
                      src={property.image}
                      alt="Cover"
                      className="w-16 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
                    />
                  )}
                  {property.gallery?.slice(0, 4).map((g, idx) => (
                    <img
                      key={idx}
                      src={g.url}
                      alt={`Gallery ${idx + 1}`}
                      className="w-16 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
                    />
                  ))}
                  {(property.gallery?.length || 0) > 4 && (
                    <div className="w-16 h-12 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-bold text-stone-600 shrink-0">
                      +{(property.gallery?.length || 0) - 4} more
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-stone-500 flex items-center gap-2">
                  <span>Video Tour:</span>
                  <span className="font-semibold text-stone-800">
                    {property.video_url ? 'Attached Walkthrough' : 'Not Provided'}
                  </span>
                </div>
              </div>

              {/* Block 4: Map & Landmarks */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                    <MapPin className="w-4 h-4 text-stone-800" />
                    <span>Location &amp; Landmarks ({property.nearby?.length || 0})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(6)}
                    className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 underline cursor-pointer"
                  >
                    Edit Map
                  </button>
                </div>
                <div className="text-xs space-y-1.5">
                  <div className="text-stone-700">
                    <span className="text-stone-500">Address: </span>
                    <span className="font-semibold">{property.location}, {property.city}</span>
                  </div>
                  <div className="text-stone-700 font-mono text-[11px]">
                    <span className="text-stone-500 font-sans">Pin: </span>
                    {property.coordinates?.lat?.toFixed(4)}, {property.coordinates?.lng?.toFixed(4)}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {property.nearby?.slice(0, 3).map((nb, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[10px] text-stone-700">
                        {nb.name} ({nb.time || `${nb.km} km`})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Block 5: Selected Amenities */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                  <Building2 className="w-4 h-4 text-stone-800" />
                  <span>Selected Amenities ({property.amenities?.length || 0})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(7)}
                  className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 underline cursor-pointer"
                >
                  Edit Amenities
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {property.amenities?.map((id) => {
                  const am = LUXURY_AMENITIES.find((a) => a.id === id);
                  if (!am) return null;
                  const Icon = am.icon;
                  return (
                    <span
                      key={id}
                      className="px-2.5 py-1 rounded-xl bg-stone-100 border border-stone-200 text-xs font-medium text-stone-800 flex items-center gap-1.5"
                    >
                      <Icon className="w-3.5 h-3.5 text-stone-600" />
                      <span>{am.label}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Editorial Review & Approval Process Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-amber-950 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Dwarkesh Quality Review &amp; Tracking Guarantee</span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed font-light">
                Once submitted, your listing enters our editorial queue under reference ID <span className="font-mono font-bold">DW-SUB-...</span>. Our curation team verifies property documents and coordinates with you on <strong>+91 {property.seller_phone}</strong>. If any adjustments are needed, you will receive clear revision notes and can track approval live anytime.
              </p>
            </div>

            {/* Action Bar inside Review Step */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition cursor-pointer"
              >
                Back to First Step
              </button>

              <button
                type="button"
                disabled={saveLoading}
                onClick={() => handleSaveProperty(isAdminLoggedIn ? 'published' : 'pending_review')}
                className="w-full sm:w-auto px-7 py-3 bg-stone-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition disabled:opacity-50"
              >
                {saveLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting for Review...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{isAdminLoggedIn ? 'Publish Listing to Live Marketplace' : 'Submit Property for Admin Review'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIZARD NAVIGATION BAR: PREVIOUS & NEXT BUTTONS                            */}
        {/* ========================================================================= */}
        {!submittedSubmission && (
          <div className="fixed sm:sticky bottom-0 sm:bottom-4 left-0 right-0 sm:left-auto sm:right-auto z-40 bg-white/95 backdrop-blur-md border-t sm:border border-stone-200 p-3 sm:p-4 sm:rounded-3xl shadow-lg flex items-center justify-between gap-3 max-w-5xl mx-auto w-full">
            <div className="flex-1 sm:flex-initial">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 bg-white text-stone-800 text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Previous</span>
                </button>
              ) : (
                <Link
                  href={isPublicPortal ? '/' : (isAdminLoggedIn ? '/admin' : '/')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 bg-white text-stone-600 text-xs sm:text-sm font-semibold transition flex items-center justify-center"
                >
                  {isPublicPortal ? 'Home' : (isAdminLoggedIn ? 'Portfolio' : 'Home')}
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
              <span className="text-xs text-stone-500 font-medium hidden md:inline">
                Step {currentStep} of 9
              </span>

              {currentStep < 9 ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 bg-stone-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <span>Next: {STEPS[currentStep]?.short || 'Continue'}</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={() => handleSaveProperty(isAdminLoggedIn ? 'published' : 'pending_review')}
                  className="w-full sm:w-auto px-5 sm:px-7 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {saveLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                      <span>{isAdminLoggedIn ? (editId ? 'Save Changes' : 'Publish Listing') : 'Submit for Review'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TRACKING STATUS MODAL (LOOK UP LISTING BY PHONE OR REF)                   */}
        {/* ========================================================================= */}
        {showTrackerModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full p-5 sm:p-7 space-y-4 relative my-8">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-800">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-stone-900">
                      Track Property Review Status
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Check if your listing is Under Review, Approved &amp; Live, or Rejected.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTrackerModal(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center cursor-pointer transition"
                >
                  ✕
                </button>
              </div>

              {/* Search Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePerformTrack();
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={trackingQuery}
                    onChange={(e) => setTrackingQuery(e.target.value)}
                    placeholder="Enter 10-digit phone or DW-SUB-... ref"
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition font-mono"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="px-4 sm:px-5 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {trackingLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
                </button>
              </form>

              {/* Error */}
              {trackingError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{trackingError}</span>
                </div>
              )}

              {/* Results Container */}
              {trackingResults !== null && (
                <div className="space-y-3 pt-1 max-h-[60vh] overflow-y-auto pr-1">
                  {trackingResults.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-stone-50 border border-stone-200 text-stone-600 text-xs space-y-1">
                      <p className="font-semibold text-stone-800">No matching submissions found.</p>
                      <p className="text-[11px] text-stone-500">
                        Please double check the phone number or reference ID.
                      </p>
                    </div>
                  ) : (
                    trackingResults.map((item) => {
                      const isPending = item.status === 'pending_review' || item.status === 'pending';
                      const isPublished = item.status === 'published';
                      const isRejected = item.status === 'rejected';

                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-mono text-[11px] font-bold text-stone-500">
                                  {item.submission_ref}
                                </span>
                                {item.city && (
                                  <span className="text-[11px] text-stone-400">&bull; {item.city}</span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-stone-900">{item.title}</h4>
                            </div>

                            {/* Status Badge */}
                            {isPending && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 shrink-0">
                                <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
                                <span>Under Review</span>
                              </span>
                            )}
                            {isPublished && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Approved &amp; Live</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5 shrink-0">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>Changes Needed / Rejected</span>
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-stone-600 space-y-1">
                            <p className="leading-relaxed">{item.status_description}</p>

                            {/* Specific Rejection Note if rejected */}
                            {isRejected && item.admin_review_note && (
                              <div className="mt-2 p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900 text-xs space-y-1">
                                <div className="font-bold flex items-center gap-1.5 text-rose-950">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                                  <span>Admin Review Feedback:</span>
                                </div>
                                <p className="leading-relaxed">{item.admin_review_note}</p>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                            <span>Price: <strong className="text-stone-800">{item.price}</strong></span>
                            {isPublished && item.live_url && (
                              <Link
                                href={item.live_url}
                                target="_blank"
                                className="font-semibold text-stone-900 hover:underline flex items-center gap-1"
                              >
                                <span>View on Marketplace</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function NewPropertyPage({ isPublicPortal = false }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-stone-500">Opening Suite...</p>
          </div>
        </div>
      }
    >
      <NewPropertyPageContent isPublicPortal={isPublicPortal} />
    </Suspense>
  );
}
