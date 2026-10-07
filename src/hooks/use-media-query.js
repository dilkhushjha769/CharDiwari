"use client"

import { useCallback, useSyncExternalStore } from "react"

// `serverValue` is used during prerendering and the first client render.
export function useMediaQuery(query, serverValue = false) {
  const subscribe = useCallback(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", onChange)
      return () => list.removeEventListener("change", onChange)
    },
    [query]
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue
  )
}
