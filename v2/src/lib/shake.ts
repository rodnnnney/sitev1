let beatTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Jolt the whole page once. `amplitude` (px) scales the shake — pass a bigger
 * value for harder beat drops. Drives the --shake-amp CSS var used by the
 * beat-shake keyframes in app.css.
 */
export function triggerShake(amplitude = 5) {
  if (typeof document === 'undefined') return;
  const b = document.body;
  b.style.setProperty('--shake-amp', `${amplitude}px`);
  b.classList.remove('beat-shake');
  void b.offsetWidth; // force reflow so the animation restarts
  b.classList.add('beat-shake');
  if (beatTimer) clearTimeout(beatTimer);
  beatTimer = setTimeout(() => b.classList.remove('beat-shake'), 220);
}
