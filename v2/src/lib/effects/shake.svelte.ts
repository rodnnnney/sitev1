import { triggerShake } from "../shake";
import { DROP_INTENSITY, loadFx, saveFx } from "./shared";

const SHAKE_BASE = 2;
const SHAKE_RANGE = 20;
const DROP_SHAKE_BOOST = 7;

export class ShakeFx {
  enabled = $state(loadFx("fx-shake", true));

  setEnabled(v: boolean) {
    this.enabled = v;
    saveFx("fx-shake", v);
  }

  beat(intensity: number, scale = 1) {
    if (!this.enabled) return;
    let amp = SHAKE_BASE + intensity * SHAKE_RANGE;
    if (intensity >= DROP_INTENSITY) amp += DROP_SHAKE_BOOST;
    triggerShake(amp * scale);
  }
}
