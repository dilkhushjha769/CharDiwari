'use client';

import { useState } from 'react';

// Area is listed in sq ft; the toggle only changes how it's shown.
const units = [
  { id: 'sqft', label: 'Sq.Ft', perSqft: 1 },
  { id: 'yard', label: 'Sq.Yd', perSqft: 1 / 9 },
  { id: 'meter', label: 'Sq.M', perSqft: 1 / 10.7639 },
];

const indian = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

function Fact({ label, children }) {
  return (
    <div className="bg-white dark:bg-stone-50 px-5 py-4">
      <dt className="font-mono text-[10px] tracking-[0.14em] uppercase text-stone-500">{label}</dt>
      <dd className="mt-1 text-sm sm:text-base font-semibold text-stone-900 tabular-nums">{children}</dd>
    </div>
  );
}

export default function KeyFacts({ property }) {
  const [unit, setUnit] = useState('sqft');
  const sqft = Number(String(property.area).replace(/[^\d.]/g, ''));
  const active = units.find((item) => item.id === unit);

  return (
    <div className="rounded-3xl border border-stone-200/90 bg-white dark:bg-stone-50 shadow-sm overflow-hidden">
      {/* A 1px gap over stone-200 draws the rules between cells. */}
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-stone-200/80">
        <Fact label="Bedrooms">{property.beds}</Fact>
        <Fact label="Bathrooms">{property.baths}</Fact>
        <Fact label={`Area (${active.label})`}>{indian.format(sqft * active.perSqft)}</Fact>
        <Fact label="Type">{property.type}</Fact>
        <Fact label="Possession">{property.possession}</Fact>
        <Fact label="Builder">{property.builder}</Fact>
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 px-5 py-3">
        <p className="text-xs text-stone-500 text-pretty">Built-up area as listed.</p>
        <div role="group" aria-label="Area unit" className="flex rounded-full border border-stone-200 bg-stone-50 p-0.5">
          {units.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={unit === item.id}
              onClick={() => setUnit(item.id)}
              className="min-h-9 px-3 rounded-full text-xs font-semibold text-stone-600 cursor-pointer focus-ring transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-stone-900 active:scale-[0.97] aria-pressed:bg-stone-900 aria-pressed:text-white"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
