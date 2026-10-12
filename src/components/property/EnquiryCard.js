'use client';

import { Phone } from 'lucide-react';
import { PHONE, whatsappLink } from '@/lib/contact';
import BookVisitButton from './BookVisitButton';
import SavePropertyButton from '@/components/SavePropertyButton';
import {
  trackContactAgentClicked,
  trackPhoneNumberClicked,
  trackWhatsAppClicked,
} from '@/lib/analytics';

/**
 * Official WhatsApp vector logo
 */
function WhatsAppIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

const callBtn =
  'flex flex-1 items-center justify-center gap-2 rounded-full border border-blue-600 bg-blue-600 text-xs font-semibold text-white outline-none transition-[scale,background-color,border-color] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-blue-700 hover:border-blue-700 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-blue-600 shadow-xs cursor-pointer';

const whatsappBtn =
  'flex flex-1 items-center justify-center gap-2 rounded-full border border-[#25D366] bg-[#25D366] text-xs font-semibold text-white outline-none transition-[scale,background-color,border-color] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#20ba59] hover:border-[#20ba59] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#25D366] shadow-xs cursor-pointer';

function enquiryMessage(property) {
  return `Hi Dwarkesh, I'm interested in ${property.title}, ${property.location} (${property.price}).`;
}

// Desktop: stays in view beside the details (below the navbar and section
// nav). No motion: it's always there while reading.
export function EnquiryCard({ property }) {
  const handleCallClick = () => {
    trackContactAgentClicked(property, 'phone');
    trackPhoneNumberClicked(property, PHONE.href);
  };

  const handleWhatsAppClick = () => {
    trackContactAgentClicked(property, 'whatsapp');
    trackWhatsAppClicked(property, 'enquiry');
  };

  return (
    <aside
      aria-label="Enquire"
      className="sticky top-[129px] hidden lg:block rounded-3xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-stone-300 dark:bg-stone-50"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-stone-500">Price</p>
          <p className="mt-1 font-serif text-3xl font-bold text-stone-900 tabular-nums">{property.price}</p>
          <p className="mt-1 text-xs text-stone-500">or {property.rentPrice} to rent</p>
        </div>
        <SavePropertyButton property={property} />
      </div>

      <BookVisitButton property={property} className="mt-6 h-12 w-full" />
      <div className="mt-2.5 flex gap-2">
        <a
          href={`tel:${PHONE.href}`}
          onClick={handleCallClick}
          className={`${callBtn} h-11`}
        >
          <Phone className="w-3.5 h-3.5 fill-current" />
          <span>Call</span>
        </a>
        <a
          href={whatsappLink(enquiryMessage(property))}
          target="_blank"
          rel="noreferrer"
          onClick={handleWhatsAppClick}
          className={`${whatsappBtn} h-11`}
        >
          <WhatsAppIcon className="w-4 h-4" />
          <span>WhatsApp</span>
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
  const handleCallClick = () => {
    trackContactAgentClicked(property, 'phone');
    trackPhoneNumberClicked(property, PHONE.href);
  };

  const handleWhatsAppClick = () => {
    trackContactAgentClicked(property, 'whatsapp');
    trackWhatsAppClicked(property, 'enquiry');
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/80 bg-white/95 backdrop-blur-md px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="mx-auto flex max-w-xl gap-2 items-center">
        <SavePropertyButton property={property} className="h-12 w-12 shrink-0 border border-stone-200" />
        <a
          href={`tel:${PHONE.href}`}
          onClick={handleCallClick}
          aria-label="Call"
          className={`${callBtn} h-12 max-w-14`}
        >
          <Phone className="w-4 h-4 fill-current" />
        </a>
        <a
          href={whatsappLink(enquiryMessage(property))}
          target="_blank"
          rel="noreferrer"
          onClick={handleWhatsAppClick}
          aria-label="WhatsApp"
          className={`${whatsappBtn} h-12 max-w-14`}
        >
          <WhatsAppIcon className="w-4 h-4" />
        </a>
        <BookVisitButton property={property} className="h-12 flex-1" />
      </div>
    </div>
  );
}
