"use client"

import { motion, useReducedMotion } from "motion/react"

const EASE_OUT = [0.23, 1, 0.32, 1]

// Fades content up once as it scrolls into view. With reduced motion it only fades.
export function Reveal({ children, className, delay = 0 }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: reduceMotion ? "translateY(0px)" : "translateY(16px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  )
}
