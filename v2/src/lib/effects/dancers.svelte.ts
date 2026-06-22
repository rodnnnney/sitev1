import { bucketURL } from "../consts";
import { loadFx, reduceMotion, saveFx } from "./shared";

export type Dancer = {
  src: string;
  x: number;
  y: number;
  size: number;
  rot: number;
};

const DANCE_INTENSITY = 0.6; // min drop intensity to spawn any dancers
const DANCE_MIN = 3; // dancers at the threshold
const DANCE_MAX = 16; // dancers at full intensity
const SRCS = [
  `${bucketURL}/osaka-spin.gif`,
  `${bucketURL}/anime.gif`,
  `${bucketURL}/reze.gif`,
  `${bucketURL}/dancing-cat.gif`,
];

/**
 * "Anime dancing" — scatters non-overlapping reaction gifs across the screen on
 * a big drop, then clears them after a beat or two.
 */
export class DancersFx {
  enabled = $state(loadFx("fx-dance"));
  dancers = $state<Dancer[]>([]);
  #timer: ReturnType<typeof setTimeout> | null = null;

  setEnabled(v: boolean) {
    this.enabled = v;
    saveFx("fx-dance", v);
  }

  spawn(intensity: number) {
    if (!this.enabled || intensity < DANCE_INTENSITY || reduceMotion()) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const maxSize = Math.min(W, H) * 0.42;
    // Scale the count by how far into the dance range the drop reaches.
    const t = Math.min(1, (intensity - DANCE_INTENSITY) / (1 - DANCE_INTENSITY));
    const count = Math.round(DANCE_MIN + t * (DANCE_MAX - DANCE_MIN));
    const placed: Dancer[] = [];
    for (let tries = 0; placed.length < count && tries < count * 40; tries++) {
      const size = Math.min(90 + Math.random() * 130, maxSize);
      const rot = -18 + Math.random() * 36;
      const rad = (rot * Math.PI) / 180;
      const half =
        (size / 2) * (Math.abs(Math.cos(rad)) + Math.abs(Math.sin(rad)));
      if (W <= 2 * half || H <= 2 * half) continue;
      const x = half + Math.random() * (W - 2 * half);
      const y = half + Math.random() * (H - 2 * half);
      const r = size / 2;
      if (!placed.every((p) => Math.hypot(p.x - x, p.y - y) >= p.size / 2 + r))
        continue;
      placed.push({
        src: SRCS[(Math.random() * SRCS.length) | 0],
        x,
        y,
        size,
        rot,
      });
    }
    this.dancers = placed;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => (this.dancers = []), 2600);
  }

  reset() {
    if (this.#timer) clearTimeout(this.#timer);
    this.dancers = [];
  }
}
