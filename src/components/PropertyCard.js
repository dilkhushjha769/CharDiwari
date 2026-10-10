import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Bath, Bed, Heart, MapPin, Maximize2 } from 'lucide-react';

// One property in a grid: on the home page and under "Similar properties".
// `price` is the sale or rent price to show, depending on the search mode.
export default function PropertyCard({ property, price }) {
  return (
    <div className="group bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Property Image with Badge */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100">
          <Image
            src={property.image}
            alt={property.title}
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-semibold text-stone-900 shadow-sm">
              {property.badge}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-700 text-white text-xs font-medium shadow-sm">
              {property.tag}
            </span>
          </div>
          <button
            type="button"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-stone-700 hover:text-rose-600 hover:bg-white transition-colors shadow-sm cursor-pointer"
            aria-label="Save Property"
          >
            <Heart className="w-4 h-4" />
          </button>
          <div className="absolute bottom-4 left-4">
            <span className="px-3.5 py-1.5 rounded-xl bg-stone-900/90 backdrop-blur-md text-white font-serif font-bold text-lg shadow-sm">
              {price}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-6">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
            <MapPin className="w-3.5 h-3.5 text-stone-400" />
            <span>{property.location}</span>
          </div>
          <h3 className="text-xl font-semibold text-stone-900 mb-2 group-hover:text-stone-700 transition-colors">
            {property.title}
          </h3>
          <p className="text-xs text-stone-600 font-normal leading-relaxed mb-6">{property.description}</p>

          {/* Bed, Bath, Sqft specs */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs font-medium text-stone-600">
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
        <Link
          href={`/property/${property.slug}`}
          className="w-full py-3 rounded-xl bg-stone-50 hover:bg-stone-900 hover:text-white text-stone-900 text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-stone-200/80 group-hover:border-transparent active:scale-[0.98]"
        >
          <span>View Property Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
