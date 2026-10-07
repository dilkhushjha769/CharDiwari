import assert from "node:assert/strict"
import { afterEach, test } from "node:test"
import { watchTheme } from "./skyline-colors.js"

// Minimal stand-ins for the browser globals watchTheme uses.
const observers = []

class FakeMutationObserver {
  constructor(callback) {
    this.callback = callback
    this.connected = false
    observers.push(this)
  }
  observe(target, options) {
    this.connected = true
    this.options = options
  }
  disconnect() {
    this.connected = false
  }
}

function setupDom() {
  const classes = new Set()
  globalThis.MutationObserver = FakeMutationObserver
  globalThis.document = { documentElement: { classList: { contains: (name) => classes.has(name) } } }
  // Simulates <html class> changing, which notifies every connected observer.
  const setClasses = (...names) => {
    classes.clear()
    names.forEach((name) => classes.add(name))
    observers.filter((observer) => observer.connected).forEach((observer) => observer.callback([]))
  }
  return setClasses
}

afterEach(() => {
  observers.length = 0
  delete globalThis.MutationObserver
  delete globalThis.document
})

test("fires only when the dark class flips, not on other <html> class changes", () => {
  const setClasses = setupDom()
  let calls = 0
  watchTheme(() => calls++)

  setClasses("lenis", "lenis-scrolling") // Lenis toggles classes while scrolling
  assert.equal(calls, 0)
  setClasses("lenis", "dark")
  assert.equal(calls, 1)
  setClasses("dark", "lenis-smooth")
  assert.equal(calls, 1)
  setClasses("lenis")
  assert.equal(calls, 2)
})

test("observes only the class attribute of <html>", () => {
  setupDom()
  watchTheme(() => {})
  assert.equal(observers.length, 1)
  assert.deepEqual(observers[0].options, { attributes: true, attributeFilter: ["class"] })
})

test("unsubscribe disconnects the observer, so nothing fires after cleanup", () => {
  const setClasses = setupDom()
  let calls = 0
  const stop = watchTheme(() => calls++)

  stop()
  assert.equal(observers[0].connected, false)
  setClasses("dark")
  assert.equal(calls, 0)
})
