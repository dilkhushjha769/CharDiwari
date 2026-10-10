import { site } from "@/config/site"
import { SAMPLE_DATA } from "@/data/project-details"
import { projects } from "@/data/projects"
import { projectHref } from "@/lib/project-url"

// Project pages join the sitemap only once they show real listings. Until then
// they're noindex: sample projects with RERA badges mustn't reach search results.
export default function sitemap() {
  const home = { url: site.url, changeFrequency: "weekly", priority: 1 }
  if (SAMPLE_DATA) return [home]
  return [
    home,
    ...projects.map((project) => ({ url: `${site.url}${projectHref(project)}`, changeFrequency: "weekly", priority: 0.8 })),
  ]
}
