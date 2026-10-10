import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EMICalculator from '@/components/EMICalculator';
import PropertyCard from '@/components/PropertyCard';
import PropertyGallery from '@/components/property/PropertyGallery';
import KeyFacts from '@/components/property/KeyFacts';
import SectionNav from '@/components/property/SectionNav';
import { EnquiryCard, MobileActionBar } from '@/components/property/EnquiryCard';
import { Amenities, Faqs, Location, Overview, Section, propertyFaqs } from '@/components/property/PropertySections';
import { findProperty, properties } from '@/data/properties';
import { propertyDetail } from '@/data/property-details';
import { propertyPhotos } from '@/data/property-photos';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://char-diwari.vercel.app';
const CRORE = 1e7;
// The EMI calculator's loan slider tops out at ₹3 Cr.
const MAX_LOAN = 3 * CRORE;

// Wait for the slug before streaming, so an unknown one returns a real 404
// (inside a Suspense boundary the 200 status would already be sent). Every
// listed property is prerendered, so navigating to one is still instant.
export const instant = false;

export function generateStaticParams() {
  return properties.map((property) => ({ slug: property.slug }));
}

async function load(params) {
  const { slug } = await params;
  const property = findProperty(slug);
  if (!property) notFound();
  return { property, detail: propertyDetail(slug) };
}

export async function generateMetadata({ params }) {
  const { property } = await load(params);
  const title = `${property.title}, ${property.location} — ${property.price} | Dwarkesh`;
  return {
    title,
    description: property.description,
    alternates: { canonical: `${SITE_URL}/property/${property.slug}` },
    openGraph: { type: 'website', title, description: property.description, images: [property.image] },
  };
}

// Same city first, then the closest price; never the property itself.
function similarTo(property, count = 3) {
  return properties
    .filter((item) => item.slug !== property.slug)
    .map((item) => ({ item, sameCity: item.city === property.city ? 0 : 1, gap: Math.abs(item.priceNum - property.priceNum) }))
    .sort((a, b) => a.sameCity - b.sameCity || a.gap - b.gap)
    .slice(0, count)
    .map(({ item }) => item);
}

function jsonLd(value) {
  return { __html: JSON.stringify(value).replace(/</g, '\\u003c') };
}

export default async function PropertyPage({ params }) {
  const { property, detail } = await load(params);
  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans">
      <Navbar />
      <PropertyContent property={property} detail={detail} />
      <Footer />
    </div>
  );
}

function PropertyContent({ property, detail }) {
  const url = `${SITE_URL}/property/${property.slug}`;
  const faqs = propertyFaqs(property, detail);
  const loan = Math.min(Math.round((property.priceNum * CRORE * 0.8) / 500000) * 500000, MAX_LOAN);

  const sections = [
    { id: 'overview', label: 'Overview' },
    detail.amenities?.length && { id: 'amenities', label: 'Amenities' },
    { id: 'location', label: 'Location' },
    { id: 'emi-calculator', label: 'EMI' },
    { id: 'faqs', label: 'FAQs' },
  ].filter(Boolean);

  const listingLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    url,
    image: property.image,
    description: property.description,
    offers: { '@type': 'Offer', price: Math.round(property.priceNum * CRORE), priceCurrency: 'INR' },
    about: {
      '@type': 'Residence',
      name: property.title,
      address: { '@type': 'PostalAddress', streetAddress: property.location, addressLocality: property.city, addressCountry: 'IN' },
    },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: property.city, item: `${SITE_URL}/#collection` },
      { '@type': 'ListItem', position: 3, name: property.title, item: url },
    ],
  };
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(listingLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqLd)} />

      <main className="pb-28 lg:pb-0">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
              <li><Link href="/" className="hover:text-stone-900 transition-colors">Home</Link></li>
              <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
              <li><Link href="/#collection" className="hover:text-stone-900 transition-colors">{property.city}</Link></li>
              <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
              <li aria-current="page" className="font-semibold text-stone-900">{property.title}</li>
            </ol>
          </nav>

          <div className="mt-5">
            <PropertyGallery title={property.title} photos={propertyPhotos(property, detail)} />
          </div>

          <header className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-900 shadow-sm">
                  {property.badge}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-700 text-white text-xs font-medium shadow-sm">{property.tag}</span>
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-serif text-stone-900 tracking-tight text-balance">
                {property.title}
              </h1>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-stone-500">
                <MapPin className="w-4 h-4 text-stone-400" />
                {property.location} · by {property.builder}
              </p>
            </div>
            <div className="shrink-0 lg:hidden">
              <span className="inline-block px-4 py-2 rounded-2xl bg-stone-900 text-white font-serif font-bold text-2xl shadow-sm">
                {property.price}
              </span>
              <p className="mt-1 text-xs text-stone-500">or {property.rentPrice} to rent</p>
            </div>
          </header>

          <div className="mt-6">
            <KeyFacts property={property} />
          </div>
        </div>

        {/* The nav and every section it links to share this wrapper, so it stays stuck throughout. */}
        <div className="mt-10">
          <SectionNav sections={sections} />

          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0 pb-12">
              <Section id="overview" title={`About ${property.title}`}>
                <Overview property={property} detail={detail} />
              </Section>
              {detail.amenities?.length ? (
                <Section id="amenities" title="Amenities">
                  <Amenities amenities={detail.amenities} />
                </Section>
              ) : null}
              <Section id="location" title="Location and nearby">
                <Location property={property} detail={detail} />
              </Section>
            </div>
            <div className="pt-10">
              <EnquiryCard property={property} />
            </div>
          </div>

          {/* Its own section (id="emi-calculator", with top padding) is the link target. */}
          <EMICalculator initialLoanAmount={loan} />

          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-16">
            <p className="mt-4 text-center text-xs text-stone-500">
              The calculator starts at 80% of the price{loan === MAX_LOAN ? ', up to its ₹3 Cr maximum' : ''}.
            </p>
            <div className="max-w-4xl">
              <Section id="faqs" title={`Questions about ${property.title}`}>
                <Faqs faqs={faqs} />
              </Section>
            </div>

            <section aria-labelledby="similar-title" className="mt-16 pt-10 border-t border-stone-200/80">
              <h2 id="similar-title" className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight">
                Similar properties
              </h2>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {similarTo(property).map((item) => (
                  <PropertyCard key={item.slug} property={item} price={item.price} />
                ))}
              </div>
            </section>

            <p className="mt-12 text-xs text-stone-400 text-pretty">
              Prices, areas and amenities are indicative and must be confirmed before booking. Photos marked
              &ldquo;Representative photo&rdquo; show the kind of amenity, not this property.
            </p>
          </div>
        </div>
      </main>
      <MobileActionBar property={property} />
    </>
  );
}
