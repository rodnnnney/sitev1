// Offline beat-map generator. Decodes each mp3 in public/songs, isolates the
// low end (kick/bass), detects onsets via energy flux with an adaptive
// threshold, and writes a <name>.beats.json next to it:
//   { duration, beats: [{ t, i }] }   // t = seconds, i = intensity 0..1
//
// Run:  bun scripts/generate-beats.mjs
import decode from "audio-decode";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SONGS_DIR = join(dirname(fileURLToPath(import.meta.url)), "../public/songs");
const FILES = ["desire", "jar-of-love", "rock-ur-world"];

const HOP_MS = 10; // analysis resolution (100 frames/sec)
const LP_CUTOFF = 200; // Hz — keep kick/bass, drop the rest
const MIN_GAP_MS = 120; // min spacing between detected beats
const THRESH_MULT = 1.5; // flux must exceed local average by this factor
const WINDOW = 20; // frames each side for the local average (~±200ms)

// One-pole lowpass to isolate the low end before measuring energy.
function lowpass(samples, sr, cutoff) {
  const dt = 1 / sr;
  const rc = 1 / (2 * Math.PI * cutoff);
  const alpha = dt / (rc + dt);
  const out = new Float32Array(samples.length);
  let y = 0;
  for (let i = 0; i < samples.length; i++) {
    y += alpha * (samples[i] - y);
    out[i] = y;
  }
  return out;
}

function analyze(buffer) {
  const sr = buffer.sampleRate;
  const x = buffer.channelData[0]; // mono is enough for beat timing
  const low = lowpass(x, sr, LP_CUTOFF);

  const hop = Math.max(1, Math.floor((sr * HOP_MS) / 1000));
  const frames = Math.floor(low.length / hop);

  // Per-frame low-end energy (mean square).
  const energy = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    const start = f * hop;
    for (let i = 0; i < hop; i++) {
      const s = low[start + i];
      sum += s * s;
    }
    energy[f] = sum / hop;
  }

  // Positive energy flux = how much louder this frame got than the last.
  const flux = new Float32Array(frames);
  for (let f = 1; f < frames; f++) flux[f] = Math.max(0, energy[f] - energy[f - 1]);

  const energyMax = Math.max(...energy) || 1;
  const minGap = Math.ceil(MIN_GAP_MS / HOP_MS);
  const beats = [];
  let lastBeat = -minGap;

  for (let f = 1; f < frames - 1; f++) {
    // Local average flux around this frame -> adaptive threshold.
    let sum = 0,
      n = 0;
    for (let k = f - WINDOW; k <= f + WINDOW; k++) {
      if (k >= 0 && k < frames) (sum += flux[k]), n++;
    }
    const localAvg = sum / n;

    const isPeak = flux[f] > flux[f - 1] && flux[f] >= flux[f + 1];
    if (
      isPeak &&
      flux[f] > localAvg * THRESH_MULT &&
      flux[f] > energyMax * 0.02 && // ignore near-silence
      f - lastBeat >= minGap
    ) {
      lastBeat = f;
      beats.push({
        t: +((f * hop) / sr).toFixed(3),
        i: +Math.min(1, energy[f] / energyMax).toFixed(3), // hit loudness 0..1
      });
    }
  }

  return { duration: +(low.length / sr).toFixed(2), beats };
}

for (const name of FILES) {
  const mp3 = join(SONGS_DIR, `${name}.mp3`);
  const audio = await decode(await readFile(mp3));
  const result = analyze(audio);
  await writeFile(
    join(SONGS_DIR, `${name}.beats.json`),
    JSON.stringify(result),
  );
  const avg =
    result.beats.reduce((s, b) => s + b.i, 0) / (result.beats.length || 1);
  console.log(
    `${name}: ${result.beats.length} beats over ${result.duration}s, avg intensity ${avg.toFixed(2)}`,
  );
}
