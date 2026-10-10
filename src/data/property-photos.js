// Gallery photos for a property page: the listing's own photo first, then
// representative stock photos (CC0, see src/assets/properties/CREDITS.md) for
// the amenities it has, then two interiors. Representative photos are labelled
// as such on the page.
import clubhouse from '@/assets/properties/clubhouse.jpg';
import garden from '@/assets/properties/garden.jpg';
import gym from '@/assets/properties/gym.jpg';
import interiorLiving from '@/assets/properties/interior-living.jpg';
import interiorSofa from '@/assets/properties/interior-sofa.jpg';
import jogging from '@/assets/properties/jogging.jpg';
import kidsPlay from '@/assets/properties/kids-play.jpg';
import pool from '@/assets/properties/pool.jpg';

const amenityPhotos = {
  pool: { src: pool, caption: 'Swimming pool' },
  gym: { src: gym, caption: 'Gymnasium' },
  clubhouse: { src: clubhouse, caption: 'Clubhouse' },
  garden: { src: garden, caption: 'Garden' },
  jogging: { src: jogging, caption: 'Walking trail' },
  'kids-play': { src: kidsPlay, caption: "Children's play area" },
};

const interiors = [
  { src: interiorLiving, caption: 'Living and dining' },
  { src: interiorSofa, caption: 'Living room' },
];

export function propertyPhotos(property, detail) {
  const listing = {
    src: property.image,
    caption: property.title,
    alt: `${property.title}, ${property.location}`,
    representative: false,
  };
  const representative = [
    ...(detail.amenities ?? []).map((id) => amenityPhotos[id]).filter(Boolean),
    ...interiors,
  ].map((photo) => ({
    ...photo,
    alt: `Representative photo, not of ${property.title}: ${photo.caption.toLowerCase()}`,
    representative: true,
  }));
  return [listing, ...representative];
}
