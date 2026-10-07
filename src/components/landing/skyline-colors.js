// Theme colours for the WebGL skyline. THREE.Color can't parse oklch(), so each
// token is resolved to sRGB by painting one pixel on a shared 1×1 canvas.

let probe = null

function probeContext() {
  if (!probe) {
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    probe = canvas.getContext("2d", { willReadFrequently: true })
  }
  return probe
}

// Returns the token as a 0xRRGGBB number, ready for `material.color.setHex()`.
export function readThemeColor(cssVar) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()
  const context = probeContext()
  context.clearRect(0, 0, 1, 1)
  context.fillStyle = "#000"
  context.fillStyle = value // an unparseable value leaves the black fallback
  context.fillRect(0, 0, 1, 1)
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data
  return (r << 16) | (g << 8) | b
}

// Calls `onChange` only when the theme flips. <html> classes also change while
// Lenis scrolls, so the dark flag is compared instead of reacting to every mutation.
export function watchTheme(onChange) {
  const root = document.documentElement
  let isDark = root.classList.contains("dark")
  const observer = new MutationObserver(() => {
    const next = root.classList.contains("dark")
    if (next === isDark) return
    isDark = next
    onChange()
  })
  observer.observe(root, { attributes: true, attributeFilter: ["class"] })
  return () => observer.disconnect()
}
