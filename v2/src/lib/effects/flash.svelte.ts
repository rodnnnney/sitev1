import { RAVE, loadFx, reduceMotion, saveFx } from "./shared";
import type { WordsFx } from "./words.svelte";

/**
 * "Screen flashing" — strobes a full-screen overlay on a big drop, driving the
 * word scramble in lockstep so flashes and word swaps pulse together.
 */
export class FlashFx {
  enabled = $state(loadFx("fx-flash", false));
  el: HTMLElement | null = null;

  #gen = 0;
  #color = 0;

  setEnabled(v: boolean) {
    this.enabled = v;
    saveFx("fx-flash", v);
  }

  drop(intensity: number, words: WordsFx, rave: boolean) {
    if (!this.el || !rave || reduceMotion()) return;
    if (!this.enabled && !words.enabled) return;
    words.takeover(); // the strobe owns the words now

    const el = this.el;
    const peak = Math.min(0.92, 0.55 + intensity * 0.5);
    const pulses = 3 + Math.round(intensity * 4); // 3..7 — more on bigger drops
    const gen = ++this.#gen;
    let n = 0;
    const tick = () => {
      if (!this.el || gen !== this.#gen) return;
      if (n >= pulses) {
        el.style.opacity = "0";
        words.clear();
        return;
      }
      if (this.enabled) {
        el.style.background = RAVE[this.#color++ % RAVE.length];
        el.style.opacity = String(peak);
      }
      if (words.enabled) words.scramble(0.18, RAVE);
      setTimeout(() => {
        if (!this.el || gen !== this.#gen) return;
        if (this.enabled) el.style.opacity = "0";
        n++;
        setTimeout(tick, 45);
      }, 55);
    };
    tick();
  }

  reset() {
    this.#gen++; // cancel any in-flight strobe
    if (this.el) this.el.style.opacity = "0";
  }
}
