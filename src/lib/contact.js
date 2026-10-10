// Contact details used across the site (the same number the home page and
// navbar already use).
export const PHONE = { display: '+91 98765 43210', href: '+919876543210' };
export const WHATSAPP = '919876543210';

export function whatsappLink(message) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}
