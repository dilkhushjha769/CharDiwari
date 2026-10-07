import { Plus } from "lucide-react"
import { Fragment, Suspense } from "react"
import { cn } from "@/lib/utils"
import { HeroSearch, HeroSearchFallback } from "./hero-search"
import { HeroSkyline } from "./hero-skyline"

const headline = "Your next home, without the chakkar."
const ACCENT_WORD = "chakkar."

// Drawing registration marks at the corners of the hero content.
const cornerMarks = ["-top-3 -left-3", "-top-3 -right-3", "-bottom-3 -left-3", "-bottom-3 -right-3"]

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="bg-blueprint pointer-events-none absolute inset-0 -z-20 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
      />
      <HeroSkyline />
      <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-16 sm:px-6 md:pt-24 md:pb-28">
        <div className="relative">
          {cornerMarks.map((position) => (
            <Plus
              key={position}
              aria-hidden="true"
              className={cn("absolute hidden size-3 text-muted-foreground/50 md:block", position)}
            />
          ))}
          <p className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
            Ahmedabad · Gandhinagar · RERA verified
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-display font-normal text-balance">
            {headline.split(" ").map((word, index) => (
              <Fragment key={index}>
                <span
                  className={cn("hero-word", word === ACCENT_WORD && "text-primary italic")}
                  style={{ "--i": index }}
                >
                  {word}
                </span>{" "}
              </Fragment>
            ))}
          </h1>
          <p className="mt-5 max-w-xl text-lead text-pretty text-muted-foreground">
            Verified, RERA-registered homes and one local expert to guide you from the first
            search to getting your keys.
          </p>
          <div className="mt-8 md:mt-10">
            <Suspense fallback={<HeroSearchFallback />}>
              <HeroSearch />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  )
}
