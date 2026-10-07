// Project counts are SAMPLE figures (taken from vitalspace.in for layout).
// Replace with live counts from the client's listings.
export const localities = [
  { id: "thaltej", name: "Thaltej", projects: 26, note: "Established, central west" },
  { id: "bodakdev", name: "Bodakdev", projects: 14, note: "Premium, close to SG Highway" },
  { id: "ambli", name: "Ambli", projects: 27, note: "Luxury towers and villas" },
  { id: "sindhu-bhavan-road", name: "Sindhu Bhavan Road", projects: 6, note: "Top-end luxury" },
  { id: "gota", name: "Gota", projects: 50, note: "Growing, good value" },
  { id: "jagatpur", name: "Jagatpur", projects: 35, note: "New launches, metro access" },
  { id: "zundal", name: "Zundal", projects: 78, note: "Affordable, near Gandhinagar" },
  { id: "sg-highway", name: "SG Highway", projects: 7, note: "Business corridor" },
]

export function localityName(id) {
  return localities.find((locality) => locality.id === id)?.name ?? id
}
