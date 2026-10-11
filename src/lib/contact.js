// Contact details used across the site (the same number the home page and
// navbar already use).
export const PHONE = { display: '+91 98765 43210', href: '+919876543210' };
export const WHATSAPP = '919876543210';

export function whatsappLink(message) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

// Lets the visitor pick who to send it to (family, a friend), unlike
// whatsappLink, which goes to our number.
export function whatsappShareLink(message) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
