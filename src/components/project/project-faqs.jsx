import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { localityName } from "@/data/localities"
import { formatNumber, formatPriceRange, formatRange } from "@/lib/format"

// Answers come from the project's own data, so they never drift from the page.
export function projectFaqs(project, detail) {
  const area = localityName(project.locality)
  const [low, high] = project.carpetSqft
  return [
    {
      question: `What is the price of ${project.name}?`,
      answer: `${project.name} is priced at ${formatPriceRange(project.priceMin, project.priceMax)} for ${formatRange(project.bhk, "BHK")} homes of ${formatNumber(low)}–${formatNumber(high)} sq ft carpet area. Prices change, so confirm the current rate with us before visiting.`,
    },
    {
      question: `Is ${project.name} RERA registered?`,
      answer: `Yes. Its GujRERA registration number is ${project.rera}. You can check it on the GujRERA portal (gujrera.gujarat.gov.in).`,
    },
    {
      question: `When is possession of ${project.name}?`,
      answer:
        project.status === "ready"
          ? `${project.name} is ready to move in.`
          : `Possession is promised for ${project.possession}, as registered with GujRERA.`,
    },
    detail.address && {
      question: `Where is ${project.name}?`,
      answer: `${detail.address}, in ${area}.`,
    },
    {
      question: "What costs are there on top of the price?",
      answer:
        "Expect GST on under-construction homes, stamp duty and registration, and usually charges for maintenance deposit, parking, electricity and water connections, and legal work. We give you the full cost sheet before you decide.",
    },
    {
      question: `How do I book a site visit to ${project.name}?`,
      answer: "Tap Enquire, call or WhatsApp us. We arrange the visit and come with you, at no cost.",
    },
  ].filter(Boolean)
}

export function ProjectFaqs({ faqs }) {
  return (
    <Accordion className="border-t border-border">
      {faqs.map((faq) => (
        <AccordionItem key={faq.question} value={faq.question} className="border-b border-border">
          <AccordionTrigger className="py-4 text-base hover:no-underline">{faq.question}</AccordionTrigger>
          <AccordionContent className="pb-4 text-muted-foreground">
            <p className="max-w-2xl">{faq.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
