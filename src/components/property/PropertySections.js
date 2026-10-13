import {
  Baby,
  Building2,
  Camera,
  Car,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  Flower2,
  Footprints,
  ShieldCheck,
  Sparkles,
  Waves,
  Zap,
} from 'lucide-react';
import PropertyLocationSection from './PropertyLocationSection';

// One section of the property page. scroll-mt clears the sticky navbar (65px)
// and section nav (48px); min-w-0 keeps wide content from widening the page.
export function Section({ id, title, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="min-w-0 scroll-mt-[113px] pt-10">
      <h2 id={`${id}-title`} className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight text-balance">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Overview({ property, detail }) {
  return (
    <>
      <p className="max-w-2xl text-base text-stone-600 leading-relaxed text-pretty">{property.description}</p>
      {detail.highlights?.length ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {detail.highlights.map((highlight) => (
            <li
              key={highlight}
              className="flex items-start gap-2.5 rounded-2xl border border-stone-200/90 bg-white dark:bg-stone-50 p-4 text-sm font-medium text-stone-800 shadow-sm"
            >
              <CheckCircle2 className="mt-0.5 w-4 h-4 shrink-0 text-emerald-700" />
              {highlight}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

const amenityList = {
  pool: { label: 'Swimming pool', icon: Waves },
  gym: { label: 'Gymnasium', icon: Dumbbell },
  clubhouse: { label: 'Clubhouse', icon: Building2 },
  spa: { label: 'Spa', icon: Sparkles },
  garden: { label: 'Landscaped garden', icon: Flower2 },
  jogging: { label: 'Walking trail', icon: Footprints },
  'kids-play': { label: "Children's play area", icon: Baby },
  security: { label: '24×7 security', icon: ShieldCheck },
  'power-backup': { label: 'Power backup', icon: Zap },
  parking: { label: 'Covered parking', icon: Car },
  cctv: { label: 'CCTV', icon: Camera },
};

export function Amenities({ amenities }) {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {amenities.map((id) => {
        const amenity = amenityList[id] ?? { label: id, icon: CheckCircle2 };
        const Icon = amenity.icon;
        return (
          <li key={id} className="flex items-center gap-3 rounded-2xl border border-stone-200/90 bg-white dark:bg-stone-50 px-4 py-3.5 text-sm font-medium text-stone-800 shadow-sm">
            <span className="flex w-9 h-9 shrink-0 items-center justify-center rounded-xl bg-stone-50 border border-stone-200/80">
              <Icon className="w-4 h-4 text-stone-700" />
            </span>
            {amenity.label}
          </li>
        );
      })}
    </ul>
  );
}

export function Location({ property, detail }) {
  return <PropertyLocationSection property={property} detail={detail} />;
}

// Answers come from the listing itself, so they never drift from the page.
export function propertyFaqs(property, detail) {
  if (property.faqs && Array.isArray(property.faqs) && property.faqs.length > 0) {
    return property.faqs;
  }
  if (detail?.faqs && Array.isArray(detail.faqs) && detail.faqs.length > 0) {
    return detail.faqs;
  }

  return [
    {
      question: `What is the price of ${property.title}?`,
      answer: `${property.title} is listed at ${property.price} to buy, or ${property.rentPrice} to rent. Prices can change, so confirm the latest figure with our team before visiting.`,
    },
    {
      question: `Where is ${property.title}?`,
      answer: `It is at ${property.location}.${detail.nearby?.length ? ` The nearest listed landmark is ${[...detail.nearby].sort((a, b) => a.km - b.km)[0].name}.` : ''}`,
    },
    {
      question: `How big is ${property.title}?`,
      answer: `It has ${property.beds.toLowerCase()} and ${property.baths.toLowerCase()} across ${property.area}.`,
    },
    {
      question: `Is ${property.title} ready to move in?`,
      answer: property.possession === 'Ready to Move' ? 'Yes, it is ready to move in.' : `It is ${property.possession.toLowerCase()}. Ask us for the expected handover date.`,
    },
    {
      question: 'How do I book a visit?',
      answer: 'Tap "Book a free visit". Sign in once and we arrange the visit with you on WhatsApp, at no cost.',
    },
  ];
}

export function Faqs({ faqs }) {
  return (
    <div className="grid gap-3">
      {faqs.map((faq) => (
        <details key={faq.question} className="group rounded-2xl border border-stone-200/90 bg-white dark:bg-stone-50 shadow-sm open:shadow-md open:border-stone-300">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-stone-900 focus-ring rounded-2xl [&::-webkit-details-marker]:hidden">
            {faq.question}
            <ChevronDown className="w-4 h-4 shrink-0 text-stone-500 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-open:rotate-180" />
          </summary>
          <p className="px-5 pb-5 text-sm text-stone-600 leading-relaxed text-pretty">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
