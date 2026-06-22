import { afterEach, beforeEach, vi } from 'vitest'

// jsdom doesn't implement matchMedia. The effects call it through
// `reduceMotion()` (with optional chaining), so default every query to
// "no match" — i.e. prefers-reduced-motion is OFF unless a test opts in.
function setReduceMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

// Exposed so a test can flip reduced-motion on for a single case.
;(globalThis as unknown as { setReduceMotion: typeof setReduceMotion }).setReduceMotion =
  setReduceMotion

beforeEach(() => {
  localStorage.clear()
  setReduceMotion(false)
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
  document.head.innerHTML = ''
})
