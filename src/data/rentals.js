// Rental listings, entered as the listing agent sent them. Fields the listing
// didn't state (carpet vs super built-up, floor, possession year) are left out
// rather than guessed. confirm: area type and floor with the agent.
export const officeRentals = [
  {
    id: "rashmi-prime-office",
    building: "Rashmi Prime",
    location: "Ambli T Junction",
    locality: "ambli",
    areaSqft: 742,
    furnishing: "Fully furnished",
    cabins: 1,
    workstations: 8,
    washrooms: 1,
    rentMonthly: 45000,
    rentExtras: "property tax",
    possession: "1st week of October",
    // Furniture work is in progress; the image is the building render, not the office.
    interiorPhotos: false,
    listedBy: { agency: "Dwelling Desire", person: "Gaurang Vaishnav", phone: "9978639986" },
  },
]
