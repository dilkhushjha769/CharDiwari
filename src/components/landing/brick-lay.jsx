"use client"

import { motion, useReducedMotion } from "motion/react"
import { useSyncExternalStore } from "react"

// Lays the contact band's brick courses from the bottom up, once. It sits
// inside the masked pattern, so it only paints where the brick lines are: it
// starts by covering them in the band's own brick colour and slides up out of
// the band. Its soft edge starts below the band, so no line shows before the
// reveal.
//
// Without JavaScript it renders nothing, so the bricks are simply there. If the
// band is already on screen when the page loads (/#contact), or the visitor
// prefers reduced motion, it isn't rendered either: the pattern just shows.
// (MotionConfig's reducedMotion doesn't cover a raw `transform` value.)

let decided = null // "animate" | "static", fixed for the page's life

function getMode() {
  if (decided === null) {
    const band = document.getElementById("contact")
    const box = band?.getBoundingClientRect()
    const onScreen = box ? box.top < window.innerHeight && box.bottom > 0 : true
    decided = onScreen ? "static" : "animate"
  }
  return decided
}

const subscribe = () => () => {}
const getServerMode = () => "static"

export function BrickLay() {
  const mode = useSyncExternalStore(subscribe, getMode, getServerMode)
  const reduceMotion = useReducedMotion()
  if (mode !== "animate" || reduceMotion) return null

  return (
    <motion.span
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-[120%] bg-linear-to-t from-transparent from-0% to-primary to-17%"
      initial={{ transform: "translateY(0%)" }}
      whileInView={{ transform: "translateY(-100%)" }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
    />
  )
}
