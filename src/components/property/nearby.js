import { GraduationCap, Hospital, MapPin, Plane, Ship, ShoppingBag, Train, TrainFront, Umbrella } from 'lucide-react';

// One icon and one colour per kind of nearby place, shared by the Nearby list
// and the map's routes, so a place looks the same in both.
const icons = {
  school: GraduationCap,
  hospital: Hospital,
  mall: ShoppingBag,
  metro: TrainFront,
  railway: Train,
  airport: Plane,
  beach: Umbrella,
  jetty: Ship,
};

const colors = {
  school: '#d97706',
  hospital: '#e11d48',
  mall: '#7c3aed',
  metro: '#0284c7',
  railway: '#4f46e5',
  airport: '#2563eb',
  beach: '#0891b2',
  jetty: '#0d9488',
};

export const nearbyColor = (type) => colors[type] ?? '#57534e';

export function NearbyIcon({ type, ...props }) {
  const Icon = icons[type] ?? MapPin;
  return <Icon {...props} />;
}
