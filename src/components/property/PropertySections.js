import {
  ArrowUpRight,
  Baby,
  Building2,
  Camera,
  Car,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  Flower2,
  Footprints,
  GraduationCap,
  Hospital,
  MapPin,
  Plane,
  ShieldCheck,
  Ship,
  ShoppingBag,
  Sparkles,
  Train,
  TrainFront,
  Umbrella,
  Waves,
  Zap,
} from 'lucide-react';

// One section of the property page. scroll-mt clears the sticky navbar (65px)
// and section nav (48px); min-w-0 keeps wide content from widening the page.
export function Section({ id, title, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="min-w-0 scroll-mt-[113px] pt-10">
      <h2 id={`${id}-title`} className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Overview({ property, detail }) {
  return (
    <>
      <p className="max-w-2xl text-base text-stone-600 leading-relaxed">{property.description}</p>
      {detail.highlights?.length ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {detail.highlights.map((highlight) => (
            <li
              key={highlight}
              className="flex items-start gap-2.5 rounded-2xl border border-stone-200/90 bg-white p-4 text-sm font-medium text-stone-800 shadow-sm"
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
          <li key={id} className="flex items-center gap-3 rounded-2xl border border-stone-200/90 bg-white px-4 py-3.5 text-sm font-medium text-stone-800 shadow-sm">
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

const nearbyIcons = {
  school: GraduationCap,
  hospital: Hospital,
  mall: ShoppingBag,
  metro: TrainFront,
  railway: Train,
  airport: Plane,
  beach: Umbrella,
  jetty: Ship,
};

export function Location({ property, detail }) {
  const nearby = [...(detail.nearby ?? [])].sort((a, b) => a.km - b.km);
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="rounded-3xl border border-stone-200/90 bg-stone-50/70 p-6">
        <p className="flex items-start gap-2 text-sm font-semibold text-stone-900">
          <MapPin className="mt-0.5 w-4 h-4 shrink-0 text-stone-500" />
          {property.location}
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.title}, ${property.location}`)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-900 hover:text-white transition-colors"
        >
          Directions on Google Maps
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
      {nearby.length ? (
        <ul className="divide-y divide-stone-100 rounded-3xl border border-stone-200/90 bg-white shadow-sm">
          {nearby.map((place) => {
            const Icon = nearbyIcons[place.type] ?? MapPin;
            return (
              <li key={place.name} className="flex items-center gap-3 px-5 py-3.5 text-sm">
                <Icon className="w-4 h-4 shrink-0 text-stone-400" />
                <span className="flex-1 text-stone-800">{place.name}</span>
                <span className="text-xs font-semibold text-stone-500 tabular-nums">{place.km} km</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

// Answers come from the listing itself, so they never drift from the page.
export function propertyFaqs(property, detail) {
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
        <details key={faq.question} className="group rounded-2xl border border-stone-200/90 bg-white shadow-sm open:shadow-md">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-stone-900 outline-none focus-visible:ring-2 focus-visible:ring-stone-900 rounded-2xl [&::-webkit-details-marker]:hidden">
            {faq.question}
            <ChevronDown className="w-4 h-4 shrink-0 text-stone-500 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-open:rotate-180" />
          </summary>
          <p className="px-5 pb-5 text-sm text-stone-600 leading-relaxed">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
