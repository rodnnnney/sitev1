import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { triggerShake } from './shake'

describe('shake — triggerShake', () => {
  let root: HTMLElement

  beforeEach(() => {
    vi.useFakeTimers()
    root = document.createElement('div')
    root.id = 'shake-root'
    document.body.appendChild(root)
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('shakes #shake-root, not the whole body, so the fixed HUD stays steady', () => {
    triggerShake(10)
    expect(root.classList.contains('beat-shake')).toBe(true)
    expect(document.body.classList.contains('beat-shake')).toBe(false)
  })

  it('drives the --shake-amp CSS var from the amplitude argument', () => {
    triggerShake(18)
    expect(root.style.getPropertyValue('--shake-amp')).toBe('18px')
  })

  it('scales harder beats up but caps the zoom at 1.045', () => {
    triggerShake(7) // 1 + 7/700 = 1.01
    expect(parseFloat(root.style.getPropertyValue('--shake-scale'))).toBeCloseTo(
      1.01,
      4,
    )
    triggerShake(10_000) // would be huge, but clamps
    expect(parseFloat(root.style.getPropertyValue('--shake-scale'))).toBeCloseTo(
      1.045,
      4,
    )
  })

  it('removes the class after the animation window so it can re-fire', () => {
    triggerShake(10)
    expect(root.classList.contains('beat-shake')).toBe(true)
    vi.advanceTimersByTime(220)
    expect(root.classList.contains('beat-shake')).toBe(false)
  })

  it('restarts cleanly on a rapid second beat (class re-applied)', () => {
    triggerShake(10)
    vi.advanceTimersByTime(100) // mid-animation
    triggerShake(15)
    expect(root.classList.contains('beat-shake')).toBe(true)
    expect(root.style.getPropertyValue('--shake-amp')).toBe('15px')
    // The first beat's pending removal must not strip the class early.
    vi.advanceTimersByTime(150) // 250ms since first beat, 150ms since second
    expect(root.classList.contains('beat-shake')).toBe(true)
    vi.advanceTimersByTime(80) // now 230ms since second beat
    expect(root.classList.contains('beat-shake')).toBe(false)
  })

  it('falls back to <body> when #shake-root is absent', () => {
    root.remove()
    expect(() => triggerShake(5)).not.toThrow()
    expect(document.body.classList.contains('beat-shake')).toBe(true)
  })

  it('uses a default amplitude when called with no argument', () => {
    triggerShake()
    expect(root.style.getPropertyValue('--shake-amp')).toBe('5px')
  })
})
