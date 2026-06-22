import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FlashFx } from './flash.svelte'
import { WordsFx } from './words.svelte'

// A WordsFx with a known page + lyric source so we can watch the strobe drive
// word swaps in lockstep with the flash.
function wordsFixture(enabled: boolean) {
  document.body.innerHTML =
    '<p>one two three four five six seven eight nine ten</p>'
  const w = new WordsFx()
  w.setEnabled(enabled)
  w.sources = ['SWAP']
  return w
}

const swapped = () =>
  Array.from(document.querySelectorAll('.rave-w')).some(
    (w) => w.textContent === 'SWAP',
  )

describe('effects/FlashFx', () => {
  let fx: FlashFx
  let overlay: HTMLElement

  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0) // deterministic scramble picks
    fx = new FlashFx()
    overlay = document.createElement('div')
    overlay.style.opacity = '0'
    fx.el = overlay
    document.body.appendChild(overlay)
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('is disabled by default (flashing is opt-in for photosensitivity)', () => {
    expect(new FlashFx().enabled).toBe(false)
  })

  it('persists the enabled flag', () => {
    fx.setEnabled(true)
    expect(localStorage.getItem('fx-flash')).toBe('1')
    expect(new FlashFx().enabled).toBe(true)
  })

  it('does nothing on a non-rave track', () => {
    fx.setEnabled(true)
    const words = wordsFixture(true)
    fx.drop(0.6, words, /* rave */ false)
    expect(overlay.style.opacity).toBe('0')
    expect(swapped()).toBe(false)
  })

  it('does nothing when both flash and words are disabled', () => {
    fx.setEnabled(false)
    const words = wordsFixture(false)
    fx.drop(0.6, words, true)
    expect(overlay.style.opacity).toBe('0')
    expect(swapped()).toBe(false)
  })

  it('strobes the overlay opacity when flashing is enabled', () => {
    fx.setEnabled(true)
    const words = wordsFixture(false)
    fx.drop(0.6, words, true)
    expect(parseFloat(overlay.style.opacity)).toBeGreaterThan(0)
  })

  it('drives word swaps even when only the words effect is on (no flashing)', () => {
    fx.setEnabled(false)
    const words = wordsFixture(true)
    fx.drop(0.6, words, true)
    expect(swapped()).toBe(true)
  })

  it('takes over the words timer so the per-beat auto-restore does not fight it', () => {
    fx.setEnabled(true)
    const words = wordsFixture(true)
    const takeover = vi.spyOn(words, 'takeover')
    fx.drop(0.6, words, true)
    expect(takeover).toHaveBeenCalled()
  })

  it('clears the overlay and restores words after the final pulse', () => {
    fx.setEnabled(true)
    const words = wordsFixture(true)
    fx.drop(0.6, words, true)
    // Run the whole strobe sequence to completion.
    vi.runAllTimers()
    expect(overlay.style.opacity).toBe('0')
    expect(swapped()).toBe(false)
  })

  it('reset() cancels an in-flight strobe and hides the overlay', () => {
    fx.setEnabled(true)
    const words = wordsFixture(true)
    fx.drop(0.6, words, true)
    fx.reset()
    expect(overlay.style.opacity).toBe('0')
    // The cancelled generation must not resurrect the overlay on later ticks.
    vi.runAllTimers()
    expect(overlay.style.opacity).toBe('0')
  })

  it('a new drop supersedes the previous generation (no overlap)', () => {
    fx.setEnabled(true)
    const words = wordsFixture(true)
    fx.drop(0.6, words, true)
    expect(() => {
      fx.drop(0.8, words, true) // bumps #gen; old ticks become no-ops
      vi.runAllTimers()
    }).not.toThrow()
    expect(overlay.style.opacity).toBe('0')
  })

  it('respects reduced motion', () => {
    ;(globalThis as any).setReduceMotion(true)
    fx.setEnabled(true)
    const words = wordsFixture(true)
    fx.drop(0.6, words, true)
    expect(overlay.style.opacity).toBe('0')
    expect(swapped()).toBe(false)
  })
})
