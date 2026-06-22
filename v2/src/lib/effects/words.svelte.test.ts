import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { WordsFx } from './words.svelte'

const raveWords = () => Array.from(document.querySelectorAll<HTMLElement>('.rave-w'))
const texts = () => raveWords().map((w) => w.textContent)

/** Force a deterministic word→color→source pick per scramble iteration. */
function mockRandom(...seq: number[]) {
  const spy = vi.spyOn(Math, 'random')
  for (const v of seq) spy.mockReturnValueOnce(v)
  spy.mockReturnValue(seq.at(-1) ?? 0)
  return spy
}

describe('effects/WordsFx — collecting & wrapping page words', () => {
  it('wraps each visible word in a fixed .rave-w span, preserving spacing', () => {
    document.body.innerHTML = '<p>hello world foo</p>'
    new WordsFx().scramble(0) // collect without swapping
    expect(texts()).toEqual(['hello', 'world', 'foo'])
    // The paragraph still reads the same — only whitespace text nodes remain
    // between the spans, so nothing reflows.
    expect(document.querySelector('p')!.textContent).toBe('hello world foo')
  })

  it('records each word on data-w so it can be restored later', () => {
    document.body.innerHTML = '<p>alpha beta</p>'
    new WordsFx().scramble(0)
    expect(raveWords().map((w) => w.dataset.w)).toEqual(['alpha', 'beta'])
  })

  it('locks each word to its measured width so a swap never reflows', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 42,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    document.body.innerHTML = '<p>word</p>'
    new WordsFx().scramble(0)
    const span = raveWords()[0]
    expect(span.style.width).toBe('42px')
    expect(span.style.display).toBe('inline-block')
    expect(span.style.textAlign).toBe('center')
    expect(span.style.whiteSpace).toBe('nowrap')
  })

  // Regression: clip-path promotes the span to its own composited layer, so a
  // text swap stops painting while #shake-root is mid-shake. overflow:hidden
  // clips the same way but repaints normally. See words.svelte.ts.
  it('clips overflow with overflow:hidden, NOT clip-path (paints during shake)', () => {
    document.body.innerHTML = '<p>word</p>'
    new WordsFx().scramble(0)
    const span = raveWords()[0]
    expect(span.style.overflow).toBe('hidden')
    expect(span.style.clipPath).toBe('')
  })
})

describe('effects/WordsFx — what gets excluded across pages', () => {
  // Mirrors the global layout: an article inside #shake-root, plus the fixed
  // HUD / player / karaoke that every page carries via RandomBanger.
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="shake-root">
        <p class="article">visible text here</p>
        <button>play me</button>
        <div data-no-rave>player title</div>
        <div aria-hidden="true">lyrics line</div>
        <script>var x = 1</script>
        <style>.a { color: red }</style>
      </div>`
  })

  it('wraps only the real article words, never HUD / a11y / script chrome', () => {
    new WordsFx().scramble(0)
    expect(texts()).toEqual(['visible', 'text', 'here'])
  })

  it('leaves the excluded subtrees untouched', () => {
    new WordsFx().scramble(0)
    expect(document.querySelector('button')!.querySelector('.rave-w')).toBeNull()
    expect(
      document.querySelector('[data-no-rave]')!.querySelector('.rave-w'),
    ).toBeNull()
    expect(
      document.querySelector('[aria-hidden="true"]')!.querySelector('.rave-w'),
    ).toBeNull()
  })
})

describe('effects/WordsFx — scramble / clear', () => {
  beforeEach(() => {
    document.body.innerHTML = '<p>one two three four</p>'
  })

  it('swaps in a source word and recolours the chosen span', () => {
    const fx = new WordsFx()
    fx.palette = ['#ff0000']
    fx.sources = ['SWAP']
    // pick word[0], palette[0], source[0]
    mockRandom(0, 0, 0)
    fx.scramble(0.25) // ceil(4*0.25) = 1 word
    const first = raveWords()[0]
    expect(first.textContent).toBe('SWAP')
    expect(first.dataset.w).toBe('one') // original is preserved
    expect(first.style.color).not.toBe('')
  })

  it('falls back to the page words when no lyric source is set', () => {
    const fx = new WordsFx()
    fx.sources = null
    // word index 0 ("one"), color 0, source index 3 -> pool[3] = "four"
    mockRandom(0, 0, 0.99)
    fx.scramble(0.25)
    expect(raveWords()[0].textContent).toBe('four')
  })

  it('clear() restores every swapped word and clears its colour', () => {
    const fx = new WordsFx()
    fx.sources = ['SWAP']
    mockRandom(0, 0, 0)
    fx.scramble(0.25)
    expect(raveWords()[0].textContent).toBe('SWAP')
    fx.clear()
    expect(texts()).toEqual(['one', 'two', 'three', 'four'])
    expect(raveWords()[0].style.color).toBe('')
  })

  it('re-scrambling restores the previous swap before applying the new one', () => {
    const fx = new WordsFx()
    fx.sources = ['SWAP']
    mockRandom(0, 0, 0) // first scramble hits word[0]
    fx.scramble(0.25)
    mockRandom(0.99, 0, 0) // second scramble hits word[3]
    fx.scramble(0.25)
    // word[0] was restored, word[3] now swapped — only one swap live at a time.
    expect(raveWords()[0].textContent).toBe('one')
    expect(raveWords()[3].textContent).toBe('SWAP')
  })

  it('is a no-op when the page has no eligible words', () => {
    document.body.innerHTML = '<button>only chrome</button>'
    const fx = new WordsFx()
    expect(() => fx.scramble(1)).not.toThrow()
    expect(raveWords()).toHaveLength(0)
  })
})

describe('effects/WordsFx — pulse (per-beat flicker)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML =
      '<p>one two three four five six seven eight nine ten</p>'
  })
  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('does nothing while the effect is disabled', () => {
    const fx = new WordsFx()
    fx.setEnabled(false)
    fx.sources = ['SWAP']
    mockRandom(0, 0, 0)
    fx.pulse(0.5)
    expect(texts()).not.toContain('SWAP')
  })

  it('does nothing when the user prefers reduced motion', () => {
    ;(globalThis as any).setReduceMotion(true)
    const fx = new WordsFx() // enabled by default
    fx.sources = ['SWAP']
    mockRandom(0, 0, 0)
    fx.pulse(0.5)
    expect(texts()).not.toContain('SWAP')
  })

  it('swaps words on a beat, then auto-restores after 200ms', () => {
    const fx = new WordsFx()
    fx.sources = ['SWAP']
    mockRandom(0, 0, 0)
    fx.pulse(0.5)
    expect(texts()).toContain('SWAP')
    vi.advanceTimersByTime(200)
    expect(texts()).not.toContain('SWAP')
  })

  it('takeover() cancels the auto-restore so the strobe can drive the words', () => {
    const fx = new WordsFx()
    fx.sources = ['SWAP']
    mockRandom(0, 0, 0)
    fx.pulse(0.5)
    fx.takeover()
    vi.advanceTimersByTime(500)
    expect(texts()).toContain('SWAP') // still swapped — no auto-restore fired
  })

  it('reset() restores words and cancels any pending auto-restore', () => {
    const fx = new WordsFx()
    fx.sources = ['SWAP']
    mockRandom(0, 0, 0)
    fx.pulse(0.5)
    fx.reset()
    expect(texts()).not.toContain('SWAP')
    vi.advanceTimersByTime(500) // a stray timer would re-clear, but nothing throws
    expect(texts()).not.toContain('SWAP')
  })
})

describe('effects/WordsFx — re-collection after navigation', () => {
  it('re-wraps the new page once the old spans leave the DOM', () => {
    document.body.innerHTML = '<p>old page words</p>'
    const fx = new WordsFx()
    fx.scramble(0)
    expect(texts()).toEqual(['old', 'page', 'words'])

    // SPA navigation swaps the whole subtree — cached spans are now detached.
    document.body.innerHTML = '<p>brand new content here</p>'
    fx.scramble(0)
    expect(texts()).toEqual(['brand', 'new', 'content', 'here'])
  })
})

// Regression (prod-only): the large Ioskeley body font is `font-display: swap`,
// so on a cold network load the first beat can lock widths to the fallback
// font; once the real font lands the boxes are wrong and overflow:hidden clips
// the swap. We re-measure on document.fonts.ready.
describe('effects/WordsFx — re-measures widths after web fonts load', () => {
  it('re-locks word widths once document.fonts.ready resolves', async () => {
    let measured = 10 // fallback-font metrics at first measure
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          width: measured,
          height: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    )

    let resolveReady!: () => void
    const ready = new Promise<void>((r) => (resolveReady = r))
    Object.defineProperty(document, 'fonts', {
      value: { ready },
      configurable: true,
    })

    try {
      document.body.innerHTML = '<p>word</p>'
      const fx = new WordsFx()
      fx.scramble(0) // locks to the fallback width
      const span = raveWords()[0]
      expect(span.style.width).toBe('10px')

      measured = 50 // real font is wider
      resolveReady()
      await ready
      await Promise.resolve() // flush the .then() microtask

      expect(span.style.width).toBe('50px')
    } finally {
      delete (document as unknown as { fonts?: unknown }).fonts
    }
  })

  it('does not throw when document.fonts is unavailable', () => {
    delete (document as unknown as { fonts?: unknown }).fonts
    document.body.innerHTML = '<p>word</p>'
    expect(() => new WordsFx().scramble(0)).not.toThrow()
  })
})
