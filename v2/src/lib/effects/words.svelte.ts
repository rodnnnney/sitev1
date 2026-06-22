import { ACCENT, loadFx, reduceMotion, saveFx } from "./shared";

/** Wrap page words in fixed-width spans (data-w) so beats can swap/restore without reflow. */
export class WordsFx {
  enabled = $state(loadFx("fx-words"));

  // Set each frame by the player: palette colours swaps; sources = lyric words (null → page words).
  palette: readonly string[] = ACCENT;
  sources: string[] | null = null;

  #words: HTMLElement[] | null = null;
  #pool: string[] = [];
  #lit = new Set<HTMLElement>();
  #clearTimer: ReturnType<typeof setTimeout> | null = null;
  #fontsHooked = false;

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

    this.#lockWidths(words);
    this.#hookFonts();
    return words;
  }

  // overflow, not clip-path: clip-path composites the span and blocks repaints during #shake-root shake.
  #lockWidths(words: HTMLElement[]) {
    for (const w of words) w.style.width = "";
    const widths = words.map((w) => w.getBoundingClientRect().width);
    words.forEach((w, i) => {
      w.style.display = "inline-block";
      w.style.width = `${widths[i]}px`;
      w.style.textAlign = "center";
      w.style.whiteSpace = "nowrap";
      w.style.overflow = "hidden";
    });
  }

  // font-display: swap can lock widths to the fallback before Ioskeley loads (prod-only).
  #hookFonts() {
    if (this.#fontsHooked || !document.fonts?.ready) return;
    this.#fontsHooked = true;
    document.fonts.ready.then(() => {
      if (!this.#words?.length) return;
      this.clear(); // measure originals, not in-flight swaps
      this.#lockWidths(this.#words);
    });
  }

  // Re-wrap after navigation if cached spans were detached.
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

  /** No auto-restore — caller or pulse handles timing. */
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

  /** Auto-restores after 200ms. */
  pulse(intensity: number) {
    if (!this.enabled || reduceMotion()) return;
    this.scramble(0.04 + intensity * 0.06);
    if (this.#clearTimer) clearTimeout(this.#clearTimer);
    this.#clearTimer = setTimeout(() => this.clear(), 200);
  }

  /** Cancel auto-restore; flash strobe owns word timing. */
  takeover() {
    if (this.#clearTimer) clearTimeout(this.#clearTimer);
  }

  reset() {
    if (this.#clearTimer) clearTimeout(this.#clearTimer);
    this.clear();
  }
}
