import { Plus } from "lucide-react"
import { Fragment, Suspense } from "react"
import { cn } from "@/lib/utils"
import { HeroBackdrop } from "./hero-backdrop"
import { HeroSearch, HeroSearchFallback } from "./hero-search"

const headline = "Your next home, without the चक्कर."
const ACCENT_WORD = "चक्कर."

// Drawing registration marks framing the left edge of the hero copy.
const cornerMarks = ["-top-3 -left-3", "-bottom-3 -left-3"]

export function Hero() {
  return (
    // Pulled up under the transparent header so the two read as one piece. The
    // grid fades in below the bar, so the nav links never sit on grid lines.
    <section id="top" className="relative isolate -mt-16 overflow-hidden pt-16 [--hero-photo:min(66vw,30rem)]">
      <div
        aria-hidden="true"
        className="bg-blueprint pointer-events-none absolute inset-0 -z-20 [mask-image:linear-gradient(to_bottom,transparent_3rem,black_8rem,black_55%,transparent)]"
      />
      <HeroBackdrop />
      <div className="mx-auto w-full max-w-6xl px-4 pt-[calc(var(--hero-photo)-0.5rem)] pb-16 sm:px-6 md:pb-28 lg:pt-24">
        <div className="relative">
          {cornerMarks.map((position) => (
            <Plus
              key={position}
              aria-hidden="true"
              className={cn("absolute hidden size-3 text-muted-foreground/50 md:block", position)}
            />
          ))}
          {/* Two pieces that wrap cleanly on narrow phones; the green dot marks the
              "verified" claim it belongs to. */}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase sm:tracking-[0.16em]">
            <span>Ahmedabad · Gandhinagar</span>
            <span className="inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
              RERA verified
            </span>
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-display font-normal text-balance">
            {headline.split(" ").map((word, index) => (
              <Fragment key={index}>
                <span
                  lang={word === ACCENT_WORD ? "hi" : undefined}
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
