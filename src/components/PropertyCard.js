'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Bath, Bed, MapPin, Maximize2 } from 'lucide-react';
import SavePropertyButton from '@/components/SavePropertyButton';
import { trackSearchResultClicked } from '@/lib/analytics';

// One property in a grid: on the home page and under "Similar properties".
// `price` is the sale or rent price to show, depending on the search mode.
export default function PropertyCard({ property, price, position = 0, searchContext = {} }) {
  const propertySlug = property.slug || property.id;
  const propertyUrl = `/property/${propertySlug}`;

  return (
    <div
      className="group relative bg-white dark:bg-stone-50 rounded-3xl border border-stone-200/90 dark:hover:border-stone-300 overflow-hidden shadow-sm hover:shadow-xl transition-[box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between cursor-pointer"
    >
      {/* Full-card stretched Link: Clicking ANYWHERE on the card opens property details */}
      <Link
        href={propertyUrl}
        onClick={() => {
          trackSearchResultClicked(property, position, searchContext);
        }}
        className="absolute inset-0 z-10 rounded-3xl focus:outline-none focus:ring-2 focus:ring-stone-900/15"
        aria-label={`View details for ${property.title}`}
        prefetch={true}
      />

      <div>
        {/* Property Image with Badge */}
        <div className="light-scope relative aspect-4/3 w-full overflow-hidden bg-stone-100 dark:bg-neutral-800">
          <Image
            src={property.image}
            alt={property.title}
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:scale-[1.03]"
          />
          <div className="absolute top-4 left-4 flex gap-2 z-10 pointer-events-none">
            <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-semibold text-stone-900 shadow-sm">
              {property.badge}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-700 text-white text-xs font-medium shadow-sm">
              {property.tag}
            </span>
          </div>

          {/* Shortlist / Favorite Heart Button (z-20 ensures it stays above the card link) */}
          <div className="absolute top-4 right-4 z-20">
            <SavePropertyButton property={property} />
          </div>

          <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10 pointer-events-none">
            <span className="px-3.5 py-1.5 rounded-xl bg-stone-900/90 backdrop-blur-md text-white font-serif font-bold text-lg tabular-nums shadow-sm">
              {property.price_on_demand ? 'Price on Request' : price}
            </span>
            {property.is_negotiable && (
              <span className="px-2 py-1 rounded-lg bg-amber-500/90 backdrop-blur-md text-stone-950 font-sans font-bold text-[10px] uppercase tracking-wider shadow-sm">
                Negotiable
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-6">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
            <MapPin className="w-3.5 h-3.5 text-stone-400" />
            <span>{property.location}</span>
          </div>
          <h3 className="text-xl font-semibold text-stone-900 text-balance mb-2 group-hover:text-stone-700 transition-colors">
            {property.title}
          </h3>
          <p className="text-xs text-stone-600 font-normal leading-relaxed text-pretty mb-6">{property.description}</p>

          {/* Bed, Bath, Sqft specs */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs font-medium text-stone-600 tabular-nums">
            <div className="flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-stone-400" />
              <span>{property.beds}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-stone-400" />
              <span>{property.baths}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4 text-stone-400" />
              <span>{property.area}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Button */}
      <div className="p-6 pt-0">
        <div
          className="w-full py-3 rounded-xl bg-stone-50 group-hover:bg-stone-900 group-hover:text-white dark:hover:bg-stone-200 dark:hover:text-stone-900 text-stone-900 text-xs font-semibold transition-[background-color,color,border-color,scale] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] focus-ring flex items-center justify-center gap-2 border border-stone-200/80 group-hover:border-transparent active:scale-[0.98]"
        >
          <span>View Property Details</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
