import { z } from "zod"

// Slugs must match the live vitalspace.in URLs exactly (/ahmedabad/{locality}/{project}),
// so links and search rankings carry over. Lowercase words joined by hyphens.
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words joined by hyphens")

const range = z.tuple([z.number().positive(), z.number().positive()]).refine(([low, high]) => low <= high)

export const projectSchema = z
  .object({
    id: slug,
    name: z.string().min(1),
    developer: z.string().min(1),
    locality: slug,
    bhk: z.array(z.number().int().positive()).min(1),
    carpetSqft: range,
    priceMin: z.number().positive(),
    priceMax: z.number().positive(),
    status: z.enum(["ready", "under-construction", "new-launch"]),
    possession: z.string().nullable(),
    rera: z.string().min(1),
  })
  .refine((project) => project.priceMin <= project.priceMax, "priceMin is above priceMax")

// Every field is optional: a missing one hides its section on the page.
export const projectDetailSchema = z.object({
  description: z.string().min(1).optional(),
  highlights: z.array(z.string().min(1)).optional(),
  amenities: z.array(slug).optional(),
  towers: z
    .array(
      z.object({
        name: z.string().min(1),
        bhk: z.string().min(1),
        unitsPerFloor: z.number().int().positive(),
        lifts: z.number().int().positive(),
        floors: z.string().min(1),
      })
    )
    .optional(),
  address: z.string().min(1).optional(),
  nearby: z
    .array(
      z.object({
        type: z.enum(["school", "hospital", "mall", "metro", "railway", "airport"]),
        name: z.string().min(1),
        km: z.number().positive(),
      })
    )
    .optional(),
  totalUnits: z.number().int().positive().optional(),
  siteAreaSqyd: z.number().positive().optional(),
  launched: z.string().min(1).optional(),
})
