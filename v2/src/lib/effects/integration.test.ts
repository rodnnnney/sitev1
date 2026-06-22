import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ShakeFx } from './shake.svelte'
import { WordsFx } from './words.svelte'
import { FlashFx } from './flash.svelte'
import {
  ACCENT,
  RAVE,
  BEAT_MIN_INTENSITY,
  DROP_INTENSITY,
} from './shared'

/**
 * Mirrors the per-beat dispatch in RandomBanger.svelte's render() (desktop
 * path): on each detected beat the words flicker + the page shakes, and a big
 * enough drop also fires the flash strobe which takes over the words.
 */
function simulateBeat(
  fx: { shake: ShakeFx; words: WordsFx; flash: FlashFx },
  maxI: number,
  rave: boolean,
) {
  if (maxI >= BEAT_MIN_INTENSITY) {
    fx.words.palette = rave ? RAVE : ACCENT
    fx.words.sources = ['NEON'] // the line being sung (render() supplies this)
    fx.words.pulse(maxI)
    if (rave) fx.shake.beat(maxI)
  }
  if (maxI >= DROP_INTENSITY && rave) fx.flash.drop(maxI, fx.words, true)
}

// Every route renders its content inside #shake-root, alongside the global
// RandomBanger HUD (the fixed player is data-no-rave, the karaoke panel is
// aria-hidden). These fixtures capture that shared shape per page.
const PAGES: Record<string, string> = {
  '/ (Home)': `
    <p>hi i am rodney building things on the internet</p>
    <a href="/blog">read the blog</a>`,
  '/xyz (Showcase)': `
    <h2>showcase</h2>
    <p>a wall of projects and experiments</p>`,
  '/blog (index)': `
    <h1>blog</h1>
    <p>posts about basketball and startups</p>`,
  '/blog/pace-factor (Pacing)': `
    <h1>Pace Factor</h1>
    <p>drawing similarities between Ottawa and New York City</p>`,
  '/not-found (404)': `
    <h1>not found</h1>
    <p>nothing lives at this address</p>`,
}

function mountPage(content: string) {
  document.body.innerHTML = `
    <div id="shake-root">${content}</div>
    <!-- global RandomBanger chrome, shared by every page -->
    <div data-no-rave>now playing — some banger</div>
    <div aria-hidden="true">a synced lyric line</div>`
  return {
    shake: new ShakeFx(),
    words: new WordsFx(),
    flash: (() => {
      const f = new FlashFx()
      const el = document.createElement('div')
      el.style.opacity = '0'
      f.el = el
      document.body.appendChild(el)
      return f
    })(),
  }
}

const root = () => document.getElementById('shake-root')!
const articleSwapped = () =>
  Array.from(root().querySelectorAll('.rave-w')).some(
    (w) => w.textContent !== w.getAttribute('data-w'),
  )

describe('shake + EDM integration across all pages', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0) // deterministic word picks
  })
  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  for (const [name, content] of Object.entries(PAGES)) {
    describe(name, () => {
      it('shakes the page and flickers words on a rave beat, then settles', () => {
        const fx = mountPage(content)
        fx.flash.setEnabled(true)

        simulateBeat(fx, 0.6, /* rave */ true) // a drop

        // The page shook and at least one article word was swapped.
        expect(root().classList.contains('beat-shake')).toBe(true)
        expect(articleSwapped()).toBe(true)
        // The HUD/karaoke chrome is never touched.
        expect(document.querySelector('[data-no-rave] .rave-w')).toBeNull()
        expect(
          document.querySelector('[aria-hidden="true"] .rave-w'),
        ).toBeNull()

        // Everything restores once the beat + strobe windows elapse.
        vi.runAllTimers()
        expect(root().classList.contains('beat-shake')).toBe(false)
        expect(fx.flash.el!.style.opacity).toBe('0')
        expect(articleSwapped()).toBe(false)
      })

      it('does not shake on a non-rave (calm) track', () => {
        const fx = mountPage(content)
        simulateBeat(fx, 0.6, /* rave */ false)
        expect(root().classList.contains('beat-shake')).toBe(false)
        // Words still flicker on calm tracks — just no shake/flash.
        expect(articleSwapped()).toBe(true)
        expect(fx.flash.el!.style.opacity).toBe('0')
      })

      it('a sub-threshold beat triggers nothing', () => {
        const fx = mountPage(content)
        fx.flash.setEnabled(true)
        simulateBeat(fx, BEAT_MIN_INTENSITY - 0.01, true)
        expect(root().classList.contains('beat-shake')).toBe(false)
        expect(articleSwapped()).toBe(false)
        expect(fx.flash.el!.style.opacity).toBe('0')
      })

      it('honours the per-effect toggles (shake off, words off)', () => {
        const fx = mountPage(content)
        fx.shake.setEnabled(false)
        fx.words.setEnabled(false)
        simulateBeat(fx, 0.6, true)
        expect(root().classList.contains('beat-shake')).toBe(false)
        expect(articleSwapped()).toBe(false)
      })
    })
  }

  it('respects reduced motion globally (no shake, no word swaps)', () => {
    ;(globalThis as any).setReduceMotion(true)
    const fx = mountPage(PAGES['/ (Home)'])
    fx.flash.setEnabled(true)
    simulateBeat(fx, 0.6, true)
    // Shake itself isn't gated by reduceMotion in JS (the CSS media query stops
    // the animation), but words + flash are, so no text swap and no strobe.
    expect(articleSwapped()).toBe(false)
    expect(fx.flash.el!.style.opacity).toBe('0')
  })
})
