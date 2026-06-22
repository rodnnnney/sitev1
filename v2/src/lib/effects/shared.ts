/** Shared constants + helpers for the beat-reactive player effects. */

// Beat-intensity thresholds (intensities come from <song>.beats.json).
export const BEAT_MIN_INTENSITY = 0.12; // below this, a beat triggers nothing
export const DROP_INTENSITY = 0.45; // "drop" → screen flash + extra shake kick

// Rave strobe palette; ACCENT is the calm single-colour fallback.
export const RAVE = [
  "#ff2d95",
  "#00e5ff",
  "#7cff00",
  "#ffe600",
  "#ff5e00",
  "#2200ff",
];
export const ACCENT = ["var(--color-accent)"];

export const reduceMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/** Per-effect on/off toggle, persisted in localStorage. */
export const loadFx = (k: string, def = true): boolean => {
  try {
    const v = localStorage.getItem(k);
    return v === null ? def : v === "1";
  } catch {
    return def;
  }
};

export const saveFx = (k: string, v: boolean) => {
  try {
    localStorage.setItem(k, v ? "1" : "0");
  } catch {
    /* ignore */
  }
};
