// SAMPLE DATA for the project detail pages, keyed by project id. Like
// projects.js, every name, number and distance here is a placeholder. While
// it's sample data the detail pages are noindex (see SAMPLE_DATA below).

export const SAMPLE_DATA = true

const towers = (names, { bhk, unitsPerFloor, lifts, floors }) =>
  names.map((name) => ({ name, bhk, unitsPerFloor, lifts, floors }))

export const projectDetails = {
  "aaranya-heights": {
    description:
      "Aaranya Heights is a set of four towers on a quiet internal road in Thaltej, a few minutes from SG Highway. Every home has a deck facing the garden, and the 3 BHK plans keep the kitchen and living room in one open run.",
    highlights: ["Garden-facing deck in every home", "Two lifts per tower core", "Five minutes to SG Highway"],
    amenities: ["gym", "pool", "clubhouse", "garden", "kids-play", "jogging", "security", "power-backup", "parking", "cctv"],
    towers: towers(["A", "B", "C", "D"], { bhk: "3–4 BHK", unitsPerFloor: 4, lifts: 2, floors: "G+14" }),
    address: "Off Thaltej–Shilaj Road, Thaltej, Ahmedabad",
    nearby: [
      { type: "school", name: "Udgam School", km: 2.1 },
      { type: "hospital", name: "Zydus Hospital", km: 3.4 },
      { type: "mall", name: "Iscon Mega Mall", km: 4.2 },
      { type: "metro", name: "Thaltej metro station", km: 1.6 },
      { type: "airport", name: "Ahmedabad airport", km: 19 },
    ],
    totalUnits: 224,
    siteAreaSqyd: 9800,
    launched: "Jan 2025",
  },
  "neelkanth-greens": {
    description:
      "Neelkanth Greens is a ready-to-move society in Gota with compact 2 and 3 BHK homes around a central lawn. It suits buyers who want to move in now without stretching the budget.",
    highlights: ["Ready to move in", "Central lawn and play area", "Near the Gota flyover"],
    amenities: ["garden", "kids-play", "security", "power-backup", "parking", "cctv", "senior-sitout"],
    towers: towers(["A", "B", "C"], { bhk: "2–3 BHK", unitsPerFloor: 4, lifts: 1, floors: "G+7" }),
    address: "Near Vande Mataram Circle, Gota, Ahmedabad",
    nearby: [
      { type: "school", name: "Shanti Asiatic School", km: 2.8 },
      { type: "hospital", name: "Sola Civil Hospital", km: 4.5 },
      { type: "mall", name: "Gota market", km: 1.2 },
      { type: "railway", name: "Chandlodiya railway station", km: 5.6 },
    ],
    totalUnits: 168,
    siteAreaSqyd: 5400,
    launched: "Feb 2021",
  },
  "the-meridian": {
    description:
      "The Meridian is a low-density luxury project in Ambli with two homes per floor, so every apartment gets three open sides. The 5 BHK penthouses have private terraces.",
    highlights: ["Two homes per floor", "Three open sides in every home", "Private terraces on top floors"],
    amenities: ["gym", "pool", "clubhouse", "spa", "garden", "jogging", "banquet", "security", "power-backup", "parking", "cctv", "intercom"],
    towers: towers(["North", "South"], { bhk: "4–5 BHK", unitsPerFloor: 2, lifts: 3, floors: "G+18" }),
    address: "Ambli–Bopal Road, Ambli, Ahmedabad",
    nearby: [
      { type: "school", name: "Anand Niketan, Shilaj", km: 3.2 },
      { type: "hospital", name: "Krishna Shalby Hospital", km: 4.1 },
      { type: "mall", name: "Iscon Ambli Road shops", km: 1.4 },
      { type: "airport", name: "Ahmedabad airport", km: 22 },
    ],
    totalUnits: 72,
    siteAreaSqyd: 6200,
    launched: "Aug 2025",
  },
  "sarthak-residency": {
    description:
      "Sarthak Residency is a mid-size project in Jagatpur, close to the new metro line. The 2 BHK plans are some of the most efficient in the area for their price.",
    highlights: ["Walk to the metro", "Efficient 2 BHK plans", "Rooftop garden"],
    amenities: ["gym", "garden", "kids-play", "indoor-games", "security", "power-backup", "parking", "cctv"],
    towers: towers(["A", "B", "C", "D", "E"], { bhk: "2–3 BHK", unitsPerFloor: 6, lifts: 2, floors: "G+12" }),
    address: "Jagatpur Road, Jagatpur, Ahmedabad",
    nearby: [
      { type: "metro", name: "Gota metro station", km: 1.1 },
      { type: "school", name: "Nirma Vidyavihar", km: 2.6 },
      { type: "hospital", name: "Sola Civil Hospital", km: 5.2 },
    ],
    totalUnits: 360,
    siteAreaSqyd: 11200,
    launched: "Mar 2024",
  },
  "orchid-elan": {
    description:
      "Orchid Elan is a completed project in Bodakdev, a short walk from Judges Bungalow Road. Large 3 and 4 BHK homes with ready interiors in the common areas.",
    highlights: ["Ready to move in", "Prime Bodakdev address", "Double-height entrance lobby"],
    amenities: ["gym", "pool", "clubhouse", "garden", "security", "power-backup", "parking", "cctv", "intercom"],
    towers: towers(["A", "B"], { bhk: "3–4 BHK", unitsPerFloor: 2, lifts: 2, floors: "G+13" }),
    address: "Near Judges Bungalow Road, Bodakdev, Ahmedabad",
    nearby: [
      { type: "school", name: "Delhi Public School, Bopal", km: 6.8 },
      { type: "hospital", name: "Sal Hospital", km: 2.9 },
      { type: "mall", name: "Alpha One Mall", km: 7.4 },
    ],
    totalUnits: 104,
    siteAreaSqyd: 4600,
    launched: "Jun 2020",
  },
  "shaligram-skyline": {
    description:
      "Shaligram Skyline is a ready-to-move project in Zundal, between Ahmedabad and Gandhinagar. It gives the most space per rupee of any project we list.",
    highlights: ["Ready to move in", "Most space for the price", "Easy run to Gandhinagar"],
    amenities: ["garden", "kids-play", "jogging", "security", "power-backup", "parking", "cctv"],
    towers: towers(["A", "B", "C", "D"], { bhk: "2–3 BHK", unitsPerFloor: 4, lifts: 1, floors: "G+10" }),
    address: "Zundal Circle, Zundal, Ahmedabad",
    nearby: [
      { type: "school", name: "Kendriya Vidyalaya, Chandkheda", km: 3.9 },
      { type: "railway", name: "Chandkheda railway station", km: 4.3 },
      { type: "hospital", name: "SMS Hospital", km: 5.1 },
    ],
    totalUnits: 192,
    siteAreaSqyd: 7000,
    launched: "Oct 2020",
  },
  "vrundavan-crest": {
    description:
      "Vrundavan Crest is a top-end tower on Sindhu Bhavan Road with one home per floor in the upper levels. Every home has a private lift lobby.",
    highlights: ["Private lift lobby", "One home per floor above level 10", "Sky lounge"],
    amenities: ["gym", "pool", "clubhouse", "spa", "garden", "banquet", "security", "power-backup", "parking", "cctv", "intercom", "senior-sitout"],
    towers: towers(["Crest"], { bhk: "4–5 BHK", unitsPerFloor: 2, lifts: 4, floors: "G+24" }),
    address: "Sindhu Bhavan Road, Bodakdev, Ahmedabad",
    nearby: [
      { type: "school", name: "Zydus School for Excellence", km: 4.4 },
      { type: "hospital", name: "Zydus Hospital", km: 3.1 },
      { type: "mall", name: "Sindhu Bhavan Road cafés", km: 0.3 },
      { type: "airport", name: "Ahmedabad airport", km: 20 },
    ],
    totalUnits: 38,
    siteAreaSqyd: 3900,
    launched: "Apr 2025",
  },
  "harmony-park": {
    description:
      "Harmony Park is a single-configuration 3 BHK project in Gota with large balconies and a landscaped podium between the towers.",
    highlights: ["All 3 BHK", "Landscaped podium", "Large balconies"],
    amenities: ["gym", "garden", "kids-play", "jogging", "indoor-games", "security", "power-backup", "parking", "cctv"],
    towers: towers(["A", "B", "C"], { bhk: "3 BHK", unitsPerFloor: 4, lifts: 2, floors: "G+12" }),
    address: "SG Highway service road, Gota, Ahmedabad",
    nearby: [
      { type: "metro", name: "Gota metro station", km: 2.4 },
      { type: "school", name: "Shanti Asiatic School", km: 3.1 },
      { type: "hospital", name: "Sola Civil Hospital", km: 3.7 },
    ],
    totalUnits: 144,
    siteAreaSqyd: 5600,
    launched: "Sep 2024",
  },
}
