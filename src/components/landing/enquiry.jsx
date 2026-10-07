"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { MessageCircle, Phone } from "lucide-react"
import { createContext, use, useCallback, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Drawer } from "vaul"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { site, whatsappLink } from "@/config/site"
import { useMediaQuery } from "@/hooks/use-media-query"
import { usePauseSmoothScroll } from "@/hooks/use-smooth-scroll"

const EnquiryContext = createContext(null)

export function EnquiryProvider({ children }) {
  const [enquiry, setEnquiry] = useState({ open: false, key: 0, topic: "", message: "" })

  const openEnquiry = useCallback(({ topic = "General enquiry", message = "" } = {}) => {
    setEnquiry((current) => ({ open: true, key: current.key + 1, topic, message }))
  }, [])

  const setOpen = useCallback((open) => {
    setEnquiry((current) => ({ ...current, open }))
  }, [])

  const value = useMemo(() => ({ openEnquiry }), [openEnquiry])

  return (
    <EnquiryContext value={value}>
      {children}
      <EnquiryDrawer enquiry={enquiry} onOpenChange={setOpen} />
    </EnquiryContext>
  )
}

export function useEnquiry() {
  const context = use(EnquiryContext)
  if (!context) throw new Error("useEnquiry must be used inside <EnquiryProvider>")
  return context.openEnquiry
}

export function EnquireButton({ topic, message, children, ...props }) {
  const openEnquiry = useEnquiry()
  return (
    <Button {...props} onClick={() => openEnquiry({ topic, message })}>
      {children}
    </Button>
  )
}

// Both fields stay optional (an empty enquiry is fine); the limits only stop
// absurdly long input from producing a broken WhatsApp link.
const enquirySchema = z.object({
  name: z.string().trim().max(60, "Please keep your name under 60 characters."),
  details: z.string().trim().max(500, "Please keep this under 500 characters."),
})

function EnquiryForm({ topic, message, onSent }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(enquirySchema),
    defaultValues: { name: "", details: message },
  })

  function send({ name, details }) {
    const text = [`Hi ${site.name}${name ? `, I'm ${name}` : ""}.`, `Regarding: ${topic}`, details]
      .filter(Boolean)
      .join("\n")

    window.open(whatsappLink(text), "_blank", "noopener,noreferrer")
    onSent()
    toast.success("WhatsApp is open with your message", {
      description: "Press send there and our team will take it from here.",
    })
  }

  return (
    <form onSubmit={handleSubmit(send)} noValidate className="mt-6 flex flex-1 flex-col gap-4">
      <p className="rounded-lg bg-muted px-3 py-2 text-sm">
        <span className="text-muted-foreground">About: </span>
        {topic}
      </p>
      <div className="grid gap-2">
        <Label htmlFor="enquiry-name">Your name</Label>
        <Input
          id="enquiry-name"
          autoComplete="name"
          className="h-11"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "enquiry-name-error" : undefined}
          {...register("name")}
        />
        {errors.name ? (
          <p id="enquiry-name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="enquiry-details">What are you looking for?</Label>
        <Textarea
          id="enquiry-details"
          rows={4}
          placeholder="e.g. 3 BHK near SG Highway, ready to move, around ₹1.5 Cr"
          aria-invalid={errors.details ? true : undefined}
          aria-describedby={errors.details ? "enquiry-details-error" : undefined}
          {...register("details")}
        />
        {errors.details ? (
          <p id="enquiry-details-error" className="text-sm text-destructive">
            {errors.details.message}
          </p>
        ) : null}
      </div>
      <div className="mt-auto grid gap-2 pt-2">
        <Button type="submit" size="lg" className="h-12 text-base">
          <MessageCircle data-icon="inline-start" />
          Continue on WhatsApp
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="h-11"
          render={<a href={`tel:${site.phone.href}`} />}
          nativeButton={false}
        >
          <Phone data-icon="inline-start" />
          Or call {site.phone.display}
        </Button>
      </div>
    </form>
  )
}

// Move focus into the drawer (onto the panel, so phones don't pop the keyboard).
export function focusPanel(event) {
  event.preventDefault()
  event.currentTarget.focus({ preventScroll: true })
}

function EnquiryDrawer({ enquiry, onOpenChange }) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  usePauseSmoothScroll(enquiry.open)

  return (
    <Drawer.Root
      open={enquiry.open}
      onOpenChange={onOpenChange}
      direction={isDesktop ? "right" : "bottom"}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-overlay" />
        <Drawer.Content
          onOpenAutoFocus={focusPanel}
          className={
            isDesktop
              ? "fixed inset-y-3 right-3 z-50 flex w-[420px] flex-col rounded-2xl bg-background p-6 shadow-xl outline-none"
              : "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl bg-background px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none"
          }
        >
          {!isDesktop && (
            <Drawer.Handle className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />
          )}
          <Drawer.Title className="font-display text-heading font-normal">Talk to an expert</Drawer.Title>
          <Drawer.Description className="mt-1 text-sm text-muted-foreground">
            Share a few details and we&apos;ll continue on WhatsApp. No forms to chase, no spam.
          </Drawer.Description>

          {/* Keyed per opening, so each enquiry starts from its own pre-filled text. */}
          <EnquiryForm
            key={enquiry.key}
            topic={enquiry.topic}
            message={enquiry.message}
            onSent={() => onOpenChange(false)}
          />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
