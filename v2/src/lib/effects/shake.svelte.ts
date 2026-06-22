import { triggerShake } from "../shake";
import { DROP_INTENSITY, loadFx, saveFx } from "./shared";

const SHAKE_BASE = 4;
const SHAKE_RANGE = 36;
const DROP_SHAKE_BOOST = 14; // extra kick once a beat crosses the drop threshold

/**
 * "Screen shaking" — jolts the page on each beat, harder on drops. Reduce-motion
 * is honoured in CSS (.beat-shake is disabled there), so this only gates on the
 * user toggle.
 */
export class ShakeFx {
  enabled = $state(loadFx("fx-shake"));

  setEnabled(v: boolean) {
    this.enabled = v;
    saveFx("fx-shake", v);
  }

  beat(intensity: number) {
    if (!this.enabled) return;
    let amp = SHAKE_BASE + intensity * SHAKE_RANGE;
    if (intensity >= DROP_INTENSITY) amp += DROP_SHAKE_BOOST;
    triggerShake(amp);
  }
}
