import { describe, it, expect, vi } from 'vitest'
import {
  BEAT_MIN_INTENSITY,
  DROP_INTENSITY,
  RAVE,
  ACCENT,
  reduceMotion,
  loadFx,
  saveFx,
} from './shared'

describe('effects/shared — beat thresholds', () => {
  it('defines a sane ordering: nothing < min < drop', () => {
    expect(BEAT_MIN_INTENSITY).toBeGreaterThan(0)
    expect(DROP_INTENSITY).toBeGreaterThan(BEAT_MIN_INTENSITY)
    expect(DROP_INTENSITY).toBeLessThanOrEqual(1)
  })
})

describe('effects/shared — palettes', () => {
  it('RAVE is a multi-colour strobe palette of valid hex colours', () => {
    expect(RAVE.length).toBeGreaterThan(1)
    for (const c of RAVE) expect(c).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('ACCENT is the single calm fallback colour', () => {
    expect(ACCENT).toEqual(['var(--color-accent)'])
  })
})

describe('effects/shared — reduceMotion', () => {
  it('is false when the OS does not request reduced motion', () => {
    ;(globalThis as any).setReduceMotion(false)
    expect(reduceMotion()).toBe(false)
  })

  it('is true when the OS requests reduced motion', () => {
    ;(globalThis as any).setReduceMotion(true)
    expect(reduceMotion()).toBe(true)
  })

  it('falls back to false when matchMedia is unavailable', () => {
    const original = window.matchMedia
    // @ts-expect-error — simulate an environment without matchMedia
    delete window.matchMedia
    expect(reduceMotion()).toBe(false)
    window.matchMedia = original
  })
})

describe('effects/shared — loadFx / saveFx persistence', () => {
  it('returns the default (true) when nothing is stored', () => {
    expect(loadFx('fx-shake')).toBe(true)
  })

  it('honours an explicit default of false', () => {
    expect(loadFx('fx-flash', false)).toBe(false)
  })

  it('round-trips a saved enabled flag', () => {
    saveFx('fx-words', true)
    expect(loadFx('fx-words')).toBe(true)
    expect(localStorage.getItem('fx-words')).toBe('1')
  })

  it('round-trips a saved disabled flag (overriding a true default)', () => {
    saveFx('fx-shake', false)
    expect(loadFx('fx-shake', true)).toBe(false)
    expect(localStorage.getItem('fx-shake')).toBe('0')
  })

  it('treats any non-"1" stored value as off', () => {
    localStorage.setItem('fx-x', 'yes')
    expect(loadFx('fx-x', true)).toBe(false)
  })

  it('falls back to the default when localStorage throws', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked')
      })
    expect(loadFx('fx-shake', true)).toBe(true)
    expect(loadFx('fx-flash', false)).toBe(false)
    spy.mockRestore()
  })
})
