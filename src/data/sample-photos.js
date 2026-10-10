// SAMPLE PHOTOS: CC0 stock pictures standing in for each project's real photos
// (sources in src/assets/projects/sample/CREDITS.md). They are not of the
// listed projects, and the gallery labels them as samples.
import clubhouse from "@/assets/projects/sample/clubhouse.jpg"
import exteriorBrickCorner from "@/assets/projects/sample/exterior-brick-corner.jpg"
import exteriorCreamTower from "@/assets/projects/sample/exterior-cream-tower.jpg"
import exteriorGreenBalconies from "@/assets/projects/sample/exterior-green-balconies.jpg"
import exteriorGreenGlass from "@/assets/projects/sample/exterior-green-glass.jpg"
import exteriorRedBrick from "@/assets/projects/sample/exterior-red-brick.jpg"
import exteriorWhiteBalconies from "@/assets/projects/sample/exterior-white-balconies.jpg"
import garden from "@/assets/projects/sample/garden.jpg"
import gym from "@/assets/projects/sample/gym.jpg"
import interiorLiving from "@/assets/projects/sample/interior-living.jpg"
import interiorSofa from "@/assets/projects/sample/interior-sofa.jpg"
import jogging from "@/assets/projects/sample/jogging.jpg"
import kidsPlay from "@/assets/projects/sample/kids-play.jpg"
import pool from "@/assets/projects/sample/pool.jpg"
import { projects } from "@/data/projects"

const exteriors = [
  exteriorGreenBalconies,
  exteriorRedBrick,
  exteriorGreenGlass,
  exteriorCreamTower,
  exteriorBrickCorner,
  exteriorWhiteBalconies,
]

// Amenity id (as in project-details.js) -> photo. Amenities without a photo are skipped.
const amenityPhotos = {
  pool: { src: pool, caption: "Swimming pool" },
  gym: { src: gym, caption: "Gymnasium" },
  clubhouse: { src: clubhouse, caption: "Clubhouse" },
  garden: { src: garden, caption: "Garden" },
  jogging: { src: jogging, caption: "Jogging track" },
  "kids-play": { src: kidsPlay, caption: "Children's play area" },
}

const sampleFlat = [
  { src: interiorLiving, caption: "Sample flat: living and dining" },
  { src: interiorSofa, caption: "Sample flat: living room" },
]

// Building first, then the project's own amenities, then the sample flat.
export function projectPhotos(project, detail) {
  const index = projects.findIndex((item) => item.id === project.id)
  const building = { src: exteriors[index % exteriors.length], caption: "Building" }
  const amenities = (detail.amenities ?? []).map((id) => amenityPhotos[id]).filter(Boolean)
  return [building, ...amenities, ...sampleFlat].map((photo) => ({
    ...photo,
    alt: `Sample photo, not of ${project.name}: ${photo.caption.toLowerCase()}`,
  }))
}
