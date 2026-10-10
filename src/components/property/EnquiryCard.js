import { MessageCircle, Phone } from 'lucide-react';
import { PHONE, whatsappLink } from '@/lib/contact';
import BookVisitButton from './BookVisitButton';

const secondary =
  'flex flex-1 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-900 outline-none transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-stone-900 hover:text-white active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-stone-900';

function enquiryMessage(property) {
  return `Hi Dwarkesh, I'm interested in ${property.title}, ${property.location} (${property.price}).`;
}

// Desktop: stays in view beside the details (below the navbar and section
// nav). No motion: it's always there while reading.
export function EnquiryCard({ property }) {
  return (
    <aside
      aria-label="Enquire"
      className="sticky top-[129px] hidden lg:block rounded-3xl border border-stone-200/90 bg-white p-6 shadow-sm"
    >
      <p className="text-[10px] font-semibold tracking-[0.14em] text-stone-500 uppercase">Price</p>
      <p className="mt-1 font-serif text-3xl font-bold text-stone-900">{property.price}</p>
      <p className="mt-1 text-xs text-stone-500">or {property.rentPrice} to rent</p>
      <BookVisitButton property={property} className="mt-6 h-12 w-full" />
      <div className="mt-2 flex gap-2">
        <a href={`tel:${PHONE.href}`} className={`${secondary} h-11`}>
          <Phone className="w-3.5 h-3.5" />
          Call
        </a>
        <a href={whatsappLink(enquiryMessage(property))} target="_blank" rel="noreferrer" className={`${secondary} h-11`}>
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </a>
      </div>
      <p className="mt-5 flex items-center gap-2 text-xs text-stone-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
        Verified listing · free site visit
      </p>
    </aside>
  );
}

// Phones and tablets: thumb-reachable actions pinned to the bottom.
export function MobileActionBar({ property }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/80 bg-white/95 backdrop-blur-md px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="mx-auto flex max-w-xl gap-2">
        <a href={`tel:${PHONE.href}`} aria-label="Call" className={`${secondary} h-12 max-w-14`}>
          <Phone className="w-4 h-4" />
        </a>
        <a
          href={whatsappLink(enquiryMessage(property))}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
          className={`${secondary} h-12 max-w-14`}
        >
          <MessageCircle className="w-4 h-4" />
        </a>
        <BookVisitButton property={property} className="h-12 flex-1" />
      </div>
    </div>
  );
}
