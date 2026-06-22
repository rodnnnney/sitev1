let beatTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Jolt the whole page once. `amplitude` (px) scales the shake — pass a bigger
 * value for harder beat drops. Drives the --shake-amp CSS var used by the
 * beat-shake keyframes in app.css.
 */
export function triggerShake(amplitude = 5) {
  if (typeof document === 'undefined') return;
  // Shake the page content, not the whole body, so fixed HUD stays steady.
  const b = document.getElementById('shake-root') ?? document.body;
  b.style.setProperty('--shake-amp', `${amplitude}px`);
  b.style.setProperty('--shake-scale', String(1 + Math.min(0.045, amplitude / 700)));
  b.classList.remove('beat-shake');
  void b.offsetWidth; // force reflow so the animation restarts
  b.classList.add('beat-shake');
  if (beatTimer) clearTimeout(beatTimer);
  beatTimer = setTimeout(() => b.classList.remove('beat-shake'), 220);
}
