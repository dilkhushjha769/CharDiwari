import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { faqs } from "@/data/faqs"

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
}

export function Faq() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <Accordion className="border-t border-border">
        {faqs.map((faq) => (
          <AccordionItem key={faq.question} value={faq.question} className="border-b border-border">
            <AccordionTrigger className="py-5 text-base hover:no-underline">{faq.question}</AccordionTrigger>
            <AccordionContent className="pb-5 text-muted-foreground">
              <p className="max-w-2xl">{faq.answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  )
}
