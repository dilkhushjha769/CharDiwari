import { OfficeCard } from "@/components/rentals/office-card";
import { OfficeDetail } from "@/components/rentals/office-detail";
import { OfficePlan } from "@/components/rentals/office-plan";
import { officeRentals } from "@/data/rentals";

// Three ways to present one office rental, side by side so the team can pick.
// A review page, not part of the site: kept out of search results.
export async function generateMetadata() {
  return {
    title: "Office listing prototypes | VitalSpace",
    robots: { index: false, follow: false },
  };
}

const options = [
  { id: "card", label: "A", title: "Compact card", note: "Fits a grid next to sale listings.", Component: OfficeCard },
  { id: "detail", label: "B", title: "Full listing page", note: "Big render, facts list, contact up top.", Component: OfficeDetail },
  { id: "plan", label: "C", title: "Blueprint plan", note: "Leads with a drawing of what the space holds, since there are no office photos yet.", Component: OfficePlan },
];

export default function OfficeListingPrototypes() {
  const office = officeRentals[0];

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-16">
      <p className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">Prototypes</p>
      <h1 className="mt-3 font-display text-title font-normal">Office listing: three options</h1>
      <nav aria-label="Options" className="mt-6 flex flex-wrap gap-2">
        {options.map((option) => (
          <a
            key={option.id}
            href={`#${option.id}`}
            className="rounded-full border border-border px-3 py-1.5 text-sm transition-[transform,background-color] duration-150 ease-out-strong hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.97]"
          >
            {option.label} · {option.title}
          </a>
        ))}
      </nav>

      {options.map(({ id, label, title, note, Component }) => (
        <section key={id} id={id} aria-labelledby={`${id}-title`} className="mt-16 border-t border-border pt-8">
          <p className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
            <span className="text-primary">Option {label}</span>
          </p>
          <h2 id={`${id}-title`} className="mt-2 text-xl font-semibold">{title}</h2>
          <p className="mt-1 mb-8 text-sm text-muted-foreground">{note}</p>
          <Component office={office} />
        </section>
      ))}
    </main>
  );
}
