import { reduceMotion } from "../../effects/shared";

/**
 * Drives a stepped animation off one clock: plays while on screen, loops, and
 * can be paused or jumped. Attach `observe` and `run` to the figure element.
 */
export class StepClock {
  elapsed = $state(0);
  playing = $state(!reduceMotion());
  visible = $state(false);
  readonly starts: number[];
  readonly total: number;

  constructor(readonly durations: number[]) {
    this.starts = durations.map((_, i) => durations.slice(0, i).reduce((t, d) => t + d, 0));
    this.total = durations.reduce((t, d) => t + d, 0);
  }

  get step() {
    return Math.max(0, this.starts.findLastIndex((t) => this.elapsed >= t));
  }

  /** ms into the current step */
  get into() {
    return this.elapsed - this.starts[this.step];
  }

  /** 0..1 fill for step i's progress segment */
  fill(i: number) {
    const s = this.step;
    return i < s ? 1 : i > s ? 0 : this.into / this.durations[s];
  }

  jump = (i: number, pause = false) => {
    this.elapsed = this.starts[i];
    if (pause) this.playing = false;
  };

  toggle = () => (this.playing = !this.playing);

  restart = () => {
    this.elapsed = 0;
    this.playing = true;
  };

  observe = (node: HTMLElement) => {
    const io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(node);
    return () => io.disconnect();
  };

  run = () => {
    if (!this.playing || !this.visible) return;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      // rAF's timestamp can predate the performance.now() taken when starting,
      // so the first delta can be negative; never run the clock backwards.
      this.elapsed = (this.elapsed + Math.max(0, now - last)) % this.total;
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  };
}
