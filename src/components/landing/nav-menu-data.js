import { Building, Building2, Calculator, Hammer, Headset, Home, Hotel, KeyRound, MapPin, MessageCircle, Ruler, Wallet } from "lucide-react"
import { site, whatsappLink } from "@/config/site"
import { localities } from "@/data/localities"
import { projects } from "@/data/projects"
import { formatCompactINR } from "@/lib/format"
import { statusOptions } from "@/lib/project-filters"

// The header's mega-menu panels, built from the site's own data so every count
// and price matches what the filters will show.

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`
const fromPrice = (list) => (list.length ? `from ${formatCompactINR(Math.min(...list.map((p) => p.priceMin)))}` : "")

function statusItem(value, icon, description) {
  const matching = projects.filter((project) => project.status === value)
  return {
    key: `status-${value}`,
    icon,
    title: statusOptions.find((option) => option.value === value).label,
    description,
    meta: plural(matching.length, "project"),
    filters: { status: value },
    section: "projects",
  }
}

const possessionYears = projects
  .filter((project) => project.possession)
  .map((project) => Number(project.possession.slice(-4)))

function bhkItem(bhk, icon) {
  const matching = projects.filter((project) => (bhk >= 5 ? project.bhk.some((b) => b >= 5) : project.bhk.includes(bhk)))
  const price = fromPrice(matching)
  return {
    key: `bhk-${bhk}`,
    icon,
    title: bhk >= 5 ? "5+ BHK" : `${bhk} BHK`,
    description: price.charAt(0).toUpperCase() + price.slice(1),
    meta: plural(matching.length, "project"),
    filters: { bhk },
    section: "projects",
  }
}

export const menus = [
  {
    value: "projects",
    label: "Projects",
    columns: [
      {
        label: "Possession",
        items: [
          statusItem("ready", KeyRound, "Completed homes you can move into now."),
          statusItem(
            "under-construction",
            Hammer,
            `Pay in stages; handover ${Math.min(...possessionYears)}–${Math.max(...possessionYears)}.`
          ),
        ],
      },
      {
        label: "Size",
        items: [bhkItem(2, Home), bhkItem(3, Building), bhkItem(4, Building2), bhkItem(5, Hotel)],
      },
    ],
    footer: {
      note: `${plural(projects.length, "RERA-registered project")} across Ahmedabad and Gandhinagar`,
      link: { label: "Browse all projects", filters: {}, section: "projects" },
    },
  },
  {
    value: "localities",
    label: "Localities",
    columns: [0, 1].map((column) => ({
      label: column === 0 ? "West Ahmedabad" : "Towards Gandhinagar",
      items: localities.slice(column * 4, column * 4 + 4).map((locality) => ({
        key: `area-${locality.id}`,
        icon: MapPin,
        title: locality.name,
        description: locality.note,
        meta: plural(locality.projects, "project"),
        filters: { area: locality.id },
        section: "projects",
      })),
    })),
    footer: {
      note: "Pick an area to see its projects",
      link: { label: "All localities", section: "localities" },
    },
  },
  {
    value: "calculators",
    label: "Calculators",
    columns: [
      {
        label: "Plan your budget",
        items: [
          { key: "calc-emi", icon: Calculator, title: "EMI calculator", description: "Monthly instalment, interest and total cost.", calc: "emi", section: "calculator" },
          { key: "calc-budget", icon: Wallet, title: "Affordability", description: "How much home your income comfortably supports.", calc: "budget", section: "calculator" },
          { key: "calc-area", icon: Ruler, title: "Area converter", description: "Square feet, square yards (gaj) and square metres.", calc: "area", section: "calculator" },
        ],
      },
      {
        label: "Next step",
        items: [
          { key: "loan-expert", icon: Headset, title: "Talk to a loan expert", description: "Bring your numbers; we'll compare lenders with you.", enquiry: "Home loan" },
          {
            key: "whatsapp",
            icon: MessageCircle,
            title: "WhatsApp us",
            description: "Send your budget and area; we reply with options.",
            external: whatsappLink(`Hi ${site.name}, I'd like help planning my home budget.`),
          },
        ],
      },
    ],
    footer: {
      note: "No login, no signup. Your numbers stay in the link.",
      link: { label: "Open calculators", section: "calculator" },
    },
  },
]
