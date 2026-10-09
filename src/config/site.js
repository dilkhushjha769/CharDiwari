// Business details shown across the site. Values marked "confirm" came from the
// public vitalspace.in site and must be checked with the client before launch.
export const site = {
  name: "VitalSpace",
  legalName: "Vital Space Management Pvt. Ltd.",
  url: "https://vitalspace.in",
  email: "info@vitalspace.in",
  phone: { display: "+91 99984 70000", href: "+919998470000" },
  // confirm: the public site posts property enquiries to a different WhatsApp
  // number (+91 97129 79979). The plan is one number for everything.
  whatsapp: "919998470000",
  address: {
    street:
      "1316-1317, Shilp Epitome, Sindhubhavan Marg, Behind Rajpath-Rangoli Road, Opp. Orbit, Bodakdev",
    city: "Ahmedabad",
    region: "Gujarat",
    postalCode: "380059",
  },
  // confirm: registration number as shown on vitalspace.in.
  rera: {
    number: "AG/GJ/AHMEDABAD/AHMEDABAD CITY/AUDA/AA00842/160429R2",
    portal: "https://gujrera.gujarat.gov.in/",
  },
}

// Indicative Gujarat purchase costs, as a fraction of the property price.
// confirm: current rates with the client before launch.
export const purchaseCosts = {
  stampDuty: 0.049,
  registration: 0.01,
}

export function whatsappLink(message) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`
}
