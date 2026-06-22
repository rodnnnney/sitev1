// Beat signal published by RandomBanger so other components (the contribution
// graph) can react in lockstep with the page's rave effects.
class AudioViz {
  playing = $state(false);
  rave = $state(false); // is the current track a rave (EDM) track?
  // `seq` bumps once per detected beat; `intensity` carries that beat's level.
  seq = $state(0);
  intensity = $state(0);

  beat(intensity: number) {
    this.intensity = intensity;
    this.seq++;
  }
}

export const audioViz = new AudioViz();
