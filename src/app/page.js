import { Suspense } from "react";
import { Calculator, CalculatorFallback } from "@/components/landing/calculator/calculator";
import { ContactCta } from "@/components/landing/contact-cta";
import { EnquiryProvider } from "@/components/landing/enquiry";
import { Faq } from "@/components/landing/faq";
import {
  FeaturedProjects,
  FeaturedProjectsFallback,
} from "@/components/landing/featured-projects";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Localities } from "@/components/landing/localities";
import { MobileActionBar } from "@/components/landing/mobile-action-bar";
import { Reveal } from "@/components/landing/reveal";
import { SectionHeading } from "@/components/landing/section-heading";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { TrustStrip } from "@/components/landing/trust-strip";

export default function Home() {
  return (
    <EnquiryProvider>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <TrustStrip />

        <section id="projects" className="py-16 md:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <SectionHeading
              index="01"
              label="Projects"
              title="Handpicked projects"
              text="RERA-registered, visited by our team, and priced the way they actually sell."
            />
            <Suspense fallback={<FeaturedProjectsFallback />}>
              <FeaturedProjects />
            </Suspense>
          </div>
        </section>

        <div className="border-t border-border">
          <Localities />
        </div>

        <section id="calculator" className="relative isolate bg-muted/30 py-16 md:py-24">
          <div
            aria-hidden="true"
            className="bg-blueprint pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]"
          />
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <SectionHeading
              index="03"
              label="Plan your budget"
              title="From search to keys, with you all the way"
              text="One expert, three simple steps. Plan your budget below before you visit."
            />
            <HowItWorks />
            <div className="mt-14">
              <Reveal>
                <h3 className="font-display text-heading font-normal">Plan your budget</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quick estimates. No login, no signup.
                </p>
              </Reveal>
              <div className="mt-6">
                <Suspense fallback={<CalculatorFallback />}>
                  <Calculator />
                </Suspense>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="py-16 md:py-24">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[1fr_2fr]">
            <SectionHeading
              index="04"
              label="FAQ"
              title="Questions buyers ask us"
              text="Straight answers. Ask us anything else on WhatsApp."
              className="mb-0"
            />
            <Faq />
          </div>
        </section>

        <ContactCta />
      </main>
      <SiteFooter />
      <MobileActionBar />
    </EnquiryProvider>
  );
}
