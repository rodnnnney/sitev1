import { ACCENT, loadFx, reduceMotion, saveFx } from "./shared";

/**
 * "Word replacing" — wraps every visible page word in a fixed-width span
 * (data-w = the original word) so beats can recolour and swap the text in/out
 * without ever reflowing the page, then restore it.
 */
export class WordsFx {
  enabled = $state(loadFx("fx-words"));

  // Scramble context, refreshed each frame by the player: `palette` colours the
  // swapped words, `sources` are the words to swap in (the line being sung, else
  // the whole song's lyrics). null falls back to the page's own words.
  palette: readonly string[] = ACCENT;
  sources: string[] | null = null;

  #words: HTMLElement[] | null = null;
  #pool: string[] = [];
  #lit = new Set<HTMLElement>();
  #clearTimer: ReturnType<typeof setTimeout> | null = null;

  setEnabled(v: boolean) {
    this.enabled = v;
    saveFx("fx-words", v);
  }

  #collect(): HTMLElement[] {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const p = node.parentElement;
          if (!p || !node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
          if (
            p.closest(
              "[data-no-rave],[aria-hidden='true'],script,style,button",
            )
          )
            return NodeFilter.FILTER_REJECT;
          if (p.classList.contains("rave-w")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );
    const textNodes: Text[] = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

    const words: HTMLElement[] = [];
    this.#pool = [];
    for (const tn of textNodes) {
      const frag = document.createDocumentFragment();
      for (const part of (tn.textContent ?? "").split(/(\s+)/)) {
        if (part === "") continue;
        if (/^\s+$/.test(part)) {
          frag.append(part);
        } else {
          const s = document.createElement("span");
          s.className = "rave-w";
          s.textContent = part;
          s.dataset.w = part;
          frag.append(s);
          words.push(s);
          this.#pool.push(part);
        }
      }
      tn.replaceWith(frag);
    }

    // Lock each word's footprint to its original width (one batched measure) so
    // swapping in a different-length word never reflows the page (true per-word
    // wrapping would re-flow the paragraph every beat). A longer swap is clipped
    // to the original box instead of spilling over and overlapping neighbours.
    const widths = words.map((w) => w.getBoundingClientRect().width);
    words.forEach((w, i) => {
      w.style.display = "inline-block";
      w.style.width = `${widths[i]}px`;
      w.style.textAlign = "center";
      w.style.whiteSpace = "nowrap";
      w.style.overflow = "hidden";
    });
    return words;
  }

  // Re-wrap if uncollected or the cached spans were swapped out (navigation).
  #ensure(): HTMLElement[] {
    if (!this.#words || !this.#words[0]?.isConnected)
      this.#words = this.#collect();
    return this.#words;
  }

  clear() {
    for (const w of this.#lit) {
      w.style.color = "";
      if (w.dataset.w !== undefined) w.textContent = w.dataset.w;
    }
    this.#lit.clear();
  }

  /** Recolour + text-swap a fraction of the page's words. No auto-restore. */
  scramble(frac: number, palette: readonly string[] = this.palette) {
    this.clear();
    const words = this.#ensure();
    if (!words.length) return;
    const src = this.sources?.length ? this.sources : this.#pool;
    if (!src.length) return;
    const count = Math.ceil(words.length * frac);
    for (let k = 0; k < count; k++) {
      const w = words[(Math.random() * words.length) | 0];
      w.style.color = palette[(Math.random() * palette.length) | 0];
      w.textContent = src[(Math.random() * src.length) | 0];
      this.#lit.add(w);
    }
  }

  /** Per-beat flicker; auto-restores after 200ms so words don't stay scrambled. */
  pulse(intensity: number) {
    if (!this.enabled || reduceMotion()) return;
    this.scramble(0.04 + intensity * 0.06);
    if (this.#clearTimer) clearTimeout(this.#clearTimer);
    this.#clearTimer = setTimeout(() => this.clear(), 200);
  }

  /** Cancel the pending auto-restore — the flash strobe drives the words now. */
  takeover() {
    if (this.#clearTimer) clearTimeout(this.#clearTimer);
  }

  reset() {
    if (this.#clearTimer) clearTimeout(this.#clearTimer);
    this.clear();
  }
}
