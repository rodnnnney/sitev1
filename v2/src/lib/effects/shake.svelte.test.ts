import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ShakeFx } from './shake.svelte'

// ShakeFx.beat() routes through triggerShake(), which writes --shake-amp onto
// #shake-root — so we read that var back to assert the computed amplitude.
const amp = (root: HTMLElement) =>
  parseFloat(root.style.getPropertyValue('--shake-amp'))

describe('effects/ShakeFx', () => {
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

  it('is enabled by default (fx-shake defaults on)', () => {
    expect(new ShakeFx().enabled).toBe(true)
  })

  it('does nothing while disabled', () => {
    const fx = new ShakeFx()
    fx.setEnabled(false)
    fx.beat(0.5)
    expect(root.classList.contains('beat-shake')).toBe(false)
  })

  it('persists the enabled flag through setEnabled', () => {
    const fx = new ShakeFx()
    fx.setEnabled(false)
    expect(localStorage.getItem('fx-shake')).toBe('0')
    // A freshly constructed instance reads the persisted value.
    expect(new ShakeFx().enabled).toBe(false)
  })

  it('amplitude = base + intensity*range for a normal beat', () => {
    new ShakeFx().beat(0.2) // 2 + 0.2*20 = 6
    expect(amp(root)).toBeCloseTo(6, 5)
  })

  it('adds the drop boost once intensity crosses DROP_INTENSITY', () => {
    new ShakeFx().beat(0.5) // 2 + 0.5*20 + 7 = 19
    expect(amp(root)).toBeCloseTo(19, 5)
  })

  it('scales the amplitude by the scale argument (mobile drop is gentler)', () => {
    new ShakeFx().beat(0.5, 0.25) // 19 * 0.25
    expect(amp(root)).toBeCloseTo(4.75, 5)
  })
})
