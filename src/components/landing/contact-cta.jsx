import { MessageCircle, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { site, whatsappLink } from "@/config/site"
import { BrickLay } from "./brick-lay"
import { EnquireButton } from "./enquiry"
import { Reveal } from "./reveal"

export function ContactCta() {
  return (
    <section id="contact" className="px-4 pb-16 sm:px-6 md:pb-24">
      <Reveal className="relative isolate mx-auto flex w-full max-w-6xl flex-col items-start gap-6 overflow-hidden rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 md:flex-row md:items-center md:justify-between md:py-14">
        {/* Faint running-bond brick courses, a nod to Kahn's brick. */}
        <span aria-hidden="true" className="brick-courses pointer-events-none absolute inset-0 -z-10 bg-primary-foreground/[0.07]">
          <BrickLay />
        </span>
        <div className="max-w-xl">
          <h2 className="font-display text-title font-normal text-balance">Not sure where to start?</h2>
          <p className="mt-3 text-primary-foreground">
            Tell us your budget and where you&apos;d like to live. A local expert will shortlist homes that
            actually fit, with no pressure and no endless calls.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <EnquireButton variant="secondary" size="lg" className="h-12 px-5 text-base" topic="Help finding a home">
            Talk to an expert
          </EnquireButton>
          <Button
            variant="ghost"
            size="lg"
            className="h-12 px-5 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            render={<a href={whatsappLink(`Hi ${site.name}, I'm looking for a home.`)} target="_blank" rel="noreferrer" />}
            nativeButton={false}
          >
            <MessageCircle data-icon="inline-start" />
            WhatsApp
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="h-12 px-5 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            render={<a href={`tel:${site.phone.href}`} />}
            nativeButton={false}
          >
            <Phone data-icon="inline-start" />
            Call
          </Button>
        </div>
      </Reveal>
    </section>
  )
}
