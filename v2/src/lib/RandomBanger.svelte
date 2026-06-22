<script lang="ts">
  import { Play, Pause, Shuffle, SlidersHorizontal } from "lucide-svelte";
  import { flip } from "svelte/animate";
  import { fade } from "svelte/transition";
  import { bangers, bucketURL } from "./consts";
  import { Text, Modal, Switch, toast } from "./primitives";
  import { triggerShake } from "./shake";

  // MediaElementSource is one-shot per <audio>; HMR would leave a dead graph.
  if (import.meta.hot) import.meta.hot.decline();

  let audio = $state<HTMLAudioElement | null>(null);
  let playing = $state(false);
  let current = $state<(typeof bangers)[number] | null>(null);
  let frame = $state("");
  let position = $state(0);
  let duration = $state(0);
  let bassDb = $state(-60); // live low-end level in dBFS (top-right readout)

  function seek(e: Event) {
    if (!audio) return;
    const t = +(e.target as HTMLInputElement).value;
    audio.currentTime = t;
    position = t;
    // Re-point the forward-only beat cursor to the new playhead.
    beatIdx = beats.findIndex((b) => b.t > t);
    if (beatIdx < 0) beatIdx = beats.length;
  }

  // Karaoke: line-synced lyrics loaded from a .lrc next to the .mp3.
  type Line = { t: number; text: string };
  let lyrics = $state<Line[]>([]);
  let activeLine = $state(-1);
  const LYRIC_OFFSET = 0; // seconds; nudge if a track drifts from its lyrics

  // All lyric words (whole song) — fallback scramble source.
  const lyricPool = $derived(
    lyrics.flatMap((l) => l.text.split(/\s+/)).filter(Boolean),
  );
  // Words from the line being sung right now — the preferred scramble source.
  const nowWords = $derived(
    activeLine >= 0 && lyrics[activeLine]
      ? lyrics[activeLine].text.split(/\s+/).filter(Boolean)
      : [],
  );

  function parseLRC(raw: string): Line[] {
    const out: Line[] = [];
    const stamp = /\[(\d+):(\d+(?:\.\d+)?)\]/g;
    for (const row of raw.split("\n")) {
      const text = row.replace(stamp, "").trim();
      if (!text) continue;
      for (const m of row.matchAll(stamp)) {
        out.push({ t: +m[1] * 60 + parseFloat(m[2]), text });
      }
    }
    return out.sort((a, b) => a.t - b.t);
  }

  async function loadLyrics(song: (typeof bangers)[number]) {
    lyrics = [];
    activeLine = -1;
    const lrcUrl = song.url.replace(/\.mp3$/, ".lrc");
    try {
      const res = await fetch(lrcUrl);
      if (res.ok) lyrics = parseLRC(await res.text());
    } catch {}
  }

  async function loadBeats(song: (typeof bangers)[number]) {
    beats = [];
    beatIdx = 0;
    const url = song.url.replace(/\.mp3$/, ".beats.json");
    try {
      const res = await fetch(url);
      if (res.ok) beats = (await res.json()).beats ?? [];
    } catch {
      /* no beat map — the page just won't shake for this track */
    }
  }

  const view = $derived.by(() => {
    if (!lyrics.length) return [];
    const start = Math.max(0, activeLine - 2);
    return lyrics.slice(start, start + 7).map((l, k) => ({
      ...l,
      i: start + k,
      active: start + k === activeLine,
    }));
  });

  // Bass/energy profile across the whole track — drives the progress meter.
  const ENERGY_BARS = 56;
  const energyBars = $derived.by(() => {
    if (!beats.length || !duration) return [];
    const buckets = new Array(ENERGY_BARS).fill(0);
    for (const b of beats) {
      const idx = Math.min(
        ENERGY_BARS - 1,
        Math.floor((b.t / duration) * ENERGY_BARS),
      );
      if (b.i > buckets[idx]) buckets[idx] = b.i; // peak energy per time-bucket
    }
    return buckets;
  });

  const COLS = 64;
  const HALF = 7;
  const GAIN = 1.2;
  const CURVE = 2.0; // >1 = louder bands reach the top
  const FPS = 24;
  const EASE = 0.3;
  const TIPS = " ▁▂▃▄▅▆▇█";

  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let gain: GainNode | null = null;
  let wave: Uint8Array | null = null;
  let bassAnalyser: AnalyserNode | null = null; // lowpassed tap for dBFS meter
  let bassWave: Float32Array | null = null;
  let smooth = new Array(COLS).fill(0);
  let lastFrame = 0;
  let raf = 0;

  // Beat-driven page shake, played back from a precomputed <name>.beats.json.
  const BEAT_MIN_INTENSITY = 0.12;
  const SHAKE_BASE = 4;
  const SHAKE_RANGE = 36;
  const DROP_INTENSITY = 0.45; // "drop" threshold → flash + kick
  const DROP_SHAKE_BOOST = 14;
  let beats: { t: number; i: number }[] = [];
  let beatIdx = 0;

  let flashEl: HTMLElement | null = null;
  const FADE = 0.4; // play/pause/crossfade ramp duration
  const RAVE = [
    "#ff2d95",
    "#00e5ff",
    "#7cff00",
    "#ffe600",
    "#ff5e00",
    "#2200ff",
  ];
  let strobeGen = 0; // cancels an in-flight strobe when a new drop lands
  let colorTick = 0;

  // Dancing reaction memes — scatter across the screen on a big drop (>= 60%).
  const DANCE_INTENSITY = 0.75;
  const DANCE_COUNT = 10;
  const DANCERS = [
    `${bucketURL}/osaka-spin.gif`,
    `${bucketURL}/anime.gif`,
    `${bucketURL}/reze.gif`,
    `${bucketURL}/dancing-cat.gif`,
  ];

  type Dancer = {
    src: string;
    x: number;
    y: number;
    size: number;
    rot: number;
  };
  let dancers = $state<Dancer[]>([]);
  let danceTimer: ReturnType<typeof setTimeout> | null = null;

  function showDance() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const maxSize = Math.min(W, H) * 0.42;
    const placed: Dancer[] = [];
    for (
      let tries = 0;
      placed.length < DANCE_COUNT && tries < DANCE_COUNT * 40;
      tries++
    ) {
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
        src: DANCERS[(Math.random() * DANCERS.length) | 0],
        x,
        y,
        size,
        rot,
      });
    }
    dancers = placed;
    if (danceTimer) clearTimeout(danceTimer);
    danceTimer = setTimeout(() => (dancers = []), 2600);
  }

  // Wrap page words in spans (data-w = original) so rave can scramble and restore.
  let raveWords: HTMLElement[] | null = null;
  let wordPool: string[] = [];
  const litWords = new Set<HTMLElement>();

  function collectRaveWords() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const p = node.parentElement;
          if (!p || !node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
          if (
            p.closest(
              "[data-no-rave],[aria-hidden='true'],nav,script,style,button",
            )
          )
            return NodeFilter.FILTER_REJECT;
          if (p.classList.contains("rave-w")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );
    const textNodes: Text[] = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

    const words: HTMLElement[] = [];
    wordPool = [];
    for (const tn of textNodes) {
      const frag = document.createDocumentFragment();
      for (const part of (tn.textContent ?? "").split(/(\s+)/)) {
        if (part === "") continue;
        if (/^\s+$/.test(part)) {
          frag.append(part);
        } else {
          const s = document.createElement("span");
          s.className = "rave-w";
          s.textContent = part;
          s.dataset.w = part;
          frag.append(s);
          words.push(s);
          wordPool.push(part);
        }
      }
      tn.replaceWith(frag);
    }

    // Lock each word's footprint to its original width (one batched measure)
    // so swapping in a different-length word never reflows the page. Longer
    // swaps overflow the fixed box instead of pushing neighbours around.
    const widths = words.map((w) => w.getBoundingClientRect().width);
    words.forEach((w, i) => {
      w.style.display = "inline-block";
      w.style.width = `${widths[i]}px`;
      w.style.textAlign = "center";
      w.style.whiteSpace = "nowrap";
      w.style.overflow = "visible";
    });
    return words;
  }

  function ensureRaveWords() {
    // Re-wrap if uncollected or the cached spans were swapped out (navigation).
    if (!raveWords || !raveWords[0]?.isConnected)
      raveWords = collectRaveWords();
    return raveWords;
  }

  let wordClearTimer: ReturnType<typeof setTimeout> | null = null;
  const ACCENT = ["var(--color-accent)"]; // calm palette for non-rave songs
  const reduceMotion = () =>
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  // Per-effect toggles, persisted in localStorage.
  const loadFx = (k: string, def = true) => {
    try {
      const v = localStorage.getItem(k);
      return v === null ? def : v === "1";
    } catch {
      return def;
    }
  };
  let fxShake = $state(loadFx("fx-shake"));
  let fxFlash = $state(loadFx("fx-flash"));
  let fxWords = $state(loadFx("fx-words"));
  let fxDance = $state(loadFx("fx-dance"));
  let fxOpen = $state(false);
  $effect(() => {
    try {
      localStorage.setItem("fx-shake", fxShake ? "1" : "0");
      localStorage.setItem("fx-flash", fxFlash ? "1" : "0");
      localStorage.setItem("fx-words", fxWords ? "1" : "0");
      localStorage.setItem("fx-dance", fxDance ? "1" : "0");
    } catch {
      /* ignore */
    }
  });

  function clearLit() {
    for (const w of litWords) {
      w.style.color = "";
      if (w.dataset.w !== undefined) w.textContent = w.dataset.w;
    }
    litWords.clear();
  }

  function litRandom(
    words: HTMLElement[],
    frac: number,
    palette: readonly string[],
  ) {
    clearLit();
    if (!words.length) return;
    // Scramble into the line being sung now → else the whole song → else page.
    const src = nowWords.length
      ? nowWords
      : lyricPool.length
        ? lyricPool
        : wordPool;
    const count = Math.ceil(words.length * frac);
    for (let k = 0; k < count; k++) {
      const w = words[(Math.random() * words.length) | 0];
      w.style.color = palette[(Math.random() * palette.length) | 0];
      w.textContent = src[(Math.random() * src.length) | 0];
      litWords.add(w);
    }
  }

  // Per-beat word flicker; auto-restores so words don't stay scrambled.
  function pulseWords(intensity: number) {
    if (!fxWords || reduceMotion()) return;
    litRandom(
      ensureRaveWords(),
      0.04 + intensity * 0.06,
      current?.rave ? RAVE : ACCENT,
    );
    if (wordClearTimer) clearTimeout(wordClearTimer);
    wordClearTimer = setTimeout(clearLit, 200);
  }

  function rampGain(to: number, dur = FADE) {
    if (!ctx || !gain) return;
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(to, now + dur);
  }

  function flashDrop(intensity: number) {
    if (!flashEl || !current?.rave || reduceMotion()) return;
    if (!fxFlash && !fxWords) return;
    if (wordClearTimer) clearTimeout(wordClearTimer); // strobe owns the words now

    const peak = Math.min(0.92, 0.55 + intensity * 0.5);
    const words = ensureRaveWords();

    // More strobe pulses on bigger drops.
    const pulses = 3 + Math.round(intensity * 4); // 3..7
    const gen = ++strobeGen;
    let n = 0;
    const tick = () => {
      if (!flashEl || gen !== strobeGen) return;
      if (n >= pulses) {
        flashEl.style.opacity = "0";
        clearLit();
        return;
      }
      if (fxFlash) {
        flashEl.style.background = RAVE[colorTick++ % RAVE.length];
        flashEl.style.opacity = String(peak);
      }
      if (fxWords) litRandom(words, 0.18, RAVE);
      setTimeout(() => {
        if (!flashEl || gen !== strobeGen) return;
        if (fxFlash) flashEl.style.opacity = "0";
        n++;
        setTimeout(tick, 45);
      }, 55);
    };
    tick();
  }

  function setupAudioGraph() {
    if (ctx || !audio) return;
    ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const src = ctx.createMediaElementSource(audio);
    gain = ctx.createGain();
    gain.gain.value = 0; // start silent, fade in on play
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    analyser.minDecibels = -90; // wider dB window — avoids pegging every bin
    analyser.maxDecibels = -10;
    wave = new Uint8Array(analyser.frequencyBinCount);
    src.connect(gain);
    gain.connect(analyser);
    analyser.connect(ctx.destination);

    // Separate lowpass tap (kick/sub only) for a true dBFS bass reading.
    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = "lowpass";
    bassFilter.frequency.value = 150;
    bassAnalyser = ctx.createAnalyser();
    bassAnalyser.fftSize = 1024;
    bassWave = new Float32Array(bassAnalyser.fftSize);
    gain.connect(bassFilter);
    bassFilter.connect(bassAnalyser); // measurement only — not routed to output
  }

  function render(t = 0) {
    raf = requestAnimationFrame(render);
    if (!analyser || !wave) return;
    if (t - lastFrame < 1000 / FPS) return;
    lastFrame = t;

    if (audio) position = audio.currentTime;

    if (lyrics.length && audio) {
      const now = audio.currentTime + LYRIC_OFFSET;
      let idx = -1;
      for (let i = 0; i < lyrics.length && lyrics[i].t <= now; i++) idx = i;
      activeLine = idx;
    }

    // Beat reactions (shake + word flicker + drop flash) are rave-only — calm
    // tracks like Jar Of Love just get the corner waveform and lyrics.
    if (beats.length && audio && current?.rave) {
      const now = audio.currentTime;
      let maxI = 0;
      while (beatIdx < beats.length && beats[beatIdx].t <= now) {
        if (beats[beatIdx].i > maxI) maxI = beats[beatIdx].i;
        beatIdx++;
      }
      if (maxI >= BEAT_MIN_INTENSITY) {
        if (fxShake) {
          let amp = SHAKE_BASE + maxI * SHAKE_RANGE;
          if (maxI >= DROP_INTENSITY) amp += DROP_SHAKE_BOOST;
          triggerShake(amp);
        }
        pulseWords(maxI);
      }
      if (maxI >= DROP_INTENSITY) flashDrop(maxI);
      if (maxI >= DANCE_INTENSITY && fxDance && !reduceMotion()) showDance();
    }

    analyser.getByteFrequencyData(wave);

    // Live bass level: PEAK of the lowpassed signal → dBFS. Peak (not RMS) so
    // kicks visibly pump; fast attack / slow release like a real meter.
    if (bassAnalyser && bassWave) {
      bassAnalyser.getFloatTimeDomainData(bassWave);
      let peak = 0;
      for (let i = 0; i < bassWave.length; i++) {
        const a = Math.abs(bassWave[i]);
        if (a > peak) peak = a;
      }
      const db = peak > 0 ? Math.max(-60, 20 * Math.log10(peak)) : -60;
      bassDb += (db - bassDb) * (db > bassDb ? 0.7 : 0.12);
    }

    const usable = Math.floor(wave.length * 0.7); // lower bins carry most energy
    const step = usable / COLS;
    for (let c = 0; c < COLS; c++) {
      const start = Math.floor(c * step);
      const end = Math.floor((c + 1) * step);
      let sum = 0;
      for (let i = start; i < end; i++) sum += wave[i];
      const avg = sum / (end - start || 1) / 255;
      const target = Math.min(1, Math.pow(avg, CURVE) * GAIN);
      smooth[c] += (target - smooth[c]) * EASE;
    }

    // Top half only — bottom is scaleY(-1) in the template.
    const rows: string[] = [];
    for (let r = 0; r < HALF; r++) {
      const dist = HALF - r;
      let line = "";
      for (let c = 0; c < COLS; c++) {
        const h = smooth[c] * HALF;
        const full = Math.floor(h);
        if (dist <= full) line += "█";
        else if (dist === full + 1)
          line += TIPS[Math.round((h - full) * 8)] ?? " ";
        else line += " ";
      }
      rows.push(line);
    }
    frame = rows.join("\n");
  }

  function startLoop() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(render);
  }

  // Avoid repeating the last couple of tracks so the rotation feels even.
  let recent: (typeof bangers)[number][] = [];
  const RECENT_KEEP = 2;

  function pickRandom() {
    if (bangers.length <= 1) return bangers[0];
    let pool = bangers.filter((b) => !recent.includes(b));
    if (pool.length === 0) pool = bangers.filter((b) => b !== current);
    const next = pool[Math.floor(Math.random() * pool.length)];
    recent.push(next);
    if (recent.length > RECENT_KEEP) recent.shift();
    return next;
  }

  async function attemptPlay(
    song: (typeof bangers)[number],
    attempt = 0,
  ): Promise<void> {
    if (!audio) return;
    audio.src = song.url;
    audio.load();
    gain?.gain.setValueAtTime(0, ctx?.currentTime ?? 0);
    try {
      await audio.play();
      rampGain(1);
      toast.success(song.title, { description: song.artist });
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return; // src swap during pending play()
      // CDN sometimes 404s the first ranged request; retry once.
      if (attempt < 1 && current === song) {
        await new Promise((r) => setTimeout(r, 500));
        return attemptPlay(song, attempt + 1);
      }
      console.error(
        "RandomBanger play failed:",
        err,
        "media error:",
        audio.error,
      );
      toast.error("Couldn't play that one", { description: song.title });
    }
  }

  // Flashing-lights warning: shown once before the first rave track plays.
  let warnOpen = $state(false);
  let pendingSong: (typeof bangers)[number] | null = null;
  let flashAck = $state(false);
  try {
    flashAck = !!localStorage.getItem("banger-flash-ack");
  } catch {
    /* no localStorage — treat as un-acknowledged */
  }

  async function startSong(song: (typeof bangers)[number]) {
    if (!audio) return;
    setupAudioGraph();
    await ctx?.resume();
    // Crossfade: dip the current track out before switching.
    if (playing) {
      rampGain(0, 0.2);
      await new Promise((r) => setTimeout(r, 200));
    }
    current = song;
    loadLyrics(song);
    loadBeats(song);
    await attemptPlay(song);
  }

  async function playRandom() {
    if (!audio) return;
    const song = pickRandom();
    if (song.rave && !flashAck && !reduceMotion()) {
      pendingSong = song;
      warnOpen = true;
      return;
    }
    await startSong(song);
  }

  function confirmWarning() {
    flashAck = true;
    try {
      localStorage.setItem("banger-flash-ack", "1");
    } catch {}
    warnOpen = false;
    if (pendingSong) {
      const s = pendingSong;
      pendingSong = null;
      startSong(s);
    }
  }

  function cancelWarning() {
    warnOpen = false;
    pendingSong = null;
  }

  function toggle() {
    if (!audio) return;
    if (playing) {
      rampGain(0, 0.25);
      setTimeout(() => audio?.pause(), 250);
    } else if (current && !audio.ended) {
      ctx?.resume();
      audio.play();
      rampGain(1);
    } else playRandom();
  }

  $effect(() => () => cancelAnimationFrame(raf));
</script>

<audio
  bind:this={audio}
  crossorigin="anonymous"
  onloadedmetadata={() => (duration = audio?.duration ?? 0)}
  ontimeupdate={() => (position = audio?.currentTime ?? 0)}
  onplay={() => {
    playing = true;
    startLoop();
  }}
  onpause={() => {
    playing = false;
    bassDb = -60;
    if (wordClearTimer) clearTimeout(wordClearTimer);
    if (danceTimer) clearTimeout(danceTimer);
    dancers = [];
    clearLit();
    cancelAnimationFrame(raf);
  }}
  onended={() => {
    playing = false;
    bassDb = -60;
    if (wordClearTimer) clearTimeout(wordClearTimer);
    if (danceTimer) clearTimeout(danceTimer);
    dancers = [];
    clearLit();
    cancelAnimationFrame(raf);
  }}
  hidden
></audio>

<!-- Live bass level (dBFS) — pinned top-right, steady (outside #shake-root). -->
{#if current}
  <div
    class="pointer-events-none fixed top-5 right-5 z-40 font-mono text-xs tabular-nums text-accent"
  >
    {bassDb.toFixed(1)} dB
  </div>
{/if}

<!-- One effect-toggle row + the full set; shared by both modals. -->
{#snippet fxRow(label: string, on: boolean, set: (v: boolean) => void)}
  <div class="flex w-full items-center justify-between py-2 text-sm text-ink">
    <span>{label}</span>
    <Switch checked={on} onCheckedChange={set} aria-label={label} />
  </div>
{/snippet}

{#snippet fxToggles()}
  <div class="flex flex-col">
    {@render fxRow("screen shake", fxShake, (v) => (fxShake = v))}
    {@render fxRow("screen flashing", fxFlash, (v) => (fxFlash = v))}
    {@render fxRow("word flashing", fxWords, (v) => (fxWords = v))}
    {@render fxRow("dancers", fxDance, (v) => (fxDance = v))}
  </div>
{/snippet}

<Modal
  bind:open={warnOpen}
  title="Flashing lights ahead"
  onclose={cancelWarning}
>
  Heads up — this track might set off strobe flashes and some screen shake on
  the beat. If you're sensitive to flashing lights, maybe sit this one out — or
  flip on your device's <span class="text-ink">reduce motion</span> setting and
  the effects stay off.
  <div class="mt-3">{@render fxToggles()}</div>
  {#snippet actions()}
    <button
      onclick={cancelWarning}
      class="rounded-sm border border-line bg-paper px-3 py-1.5 font-mono text-xs text-ink transition-colors hover:border-accent hover:text-accent"
    >
      not now
    </button>
    <button
      onclick={confirmWarning}
      class="rounded-sm bg-accent px-3 py-1.5 font-mono text-xs text-paper transition-opacity hover:opacity-90"
    >
      play anyway
    </button>
  {/snippet}
</Modal>

<Modal bind:open={fxOpen} title="Effects">
  <p class="mb-1">Beat-reactive effects on EDM tracks.</p>
  {@render fxToggles()}

  {#snippet actions()}
    <button
      onclick={() => (fxOpen = false)}
      class="rounded-sm bg-accent px-3 py-1.5 font-mono text-xs text-paper transition-opacity hover:opacity-90"
    >
      done
    </button>
  {/snippet}
</Modal>

<div
  bind:this={flashEl}
  aria-hidden="true"
  class="pointer-events-none fixed inset-0 z-[2]"
  style="opacity: 0; background: radial-gradient(circle at 50% 45%, #ffffff 0%, var(--color-accent) 55%, var(--color-accent) 100%);"
></div>

<!-- mix-blend-multiply drops light gif backgrounds into the paper. -->
{#if dancers.length}
  <div
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 z-20"
    transition:fade={{ duration: 150 }}
  >
    {#each dancers as d, i (i)}
      <img
        src={d.src}
        alt=""
        class="absolute object-contain mix-blend-multiply"
        style="left: {d.x}px; top: {d.y}px; width: {d.size}px; height: {d.size}px; transform: translate(-50%, -50%) rotate({d.rot}deg);"
      />
    {/each}
  </div>
{/if}

{#if view.length}
  <div
    aria-hidden="true"
    class="pointer-events-none fixed top-1/2 right-6 z-30 flex max-w-[42vw] -translate-y-1/2 flex-col items-end gap-2 text-right font-mono transition-opacity duration-300"
    class:opacity-40={!playing}
  >
    {#each view as l (l.i)}
      <p
        animate:flip={{ duration: 400 }}
        transition:fade={{ duration: 250 }}
        class="text-sm leading-snug transition-all duration-500 {l.active
          ? 'font-medium text-accent'
          : 'text-muted opacity-40'}"
      >
        {l.text}
      </p>
    {/each}
  </div>
{/if}

<div
  data-no-rave
  class="pointer-events-none fixed right-5 bottom-5 z-40 flex flex-col items-end gap-1.5"
>
  {#if frame}
    <div
      aria-hidden="true"
      class="flex max-w-[40vw] select-none flex-col overflow-hidden text-accent transition-opacity duration-300"
      class:opacity-25={!playing}
    >
      <pre
        class="font-mono text-[8px] leading-[0.8] tracking-tighter">{frame}</pre>
      <pre
        class="font-mono text-[8px] leading-[0.8] tracking-tighter [transform:scaleY(-1)]">{frame}</pre>
    </div>
  {/if}

  <div
    class="pointer-events-auto flex flex-col items-end gap-1.5 font-mono text-xs"
  >
    <div class="flex items-center gap-2">
      {#if current}
        <button
          onclick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          class="text-muted transition-colors hover:text-accent"
        >
          {#if playing}
            <Pause size={12} />
          {:else}
            <Play size={12} />
          {/if}
        </button>
      {/if}

      <Text type="paragraph" size="xs" color="muted" links class="leading-none">
        <a
          href="#"
          role="button"
          onclick={(e) => {
            e.preventDefault();
            toggle();
          }}
        >
          {current
            ? `${current.title} — ${current.artist}`
            : "I wonder what this button does🤔"}
        </a>
      </Text>

      {#if current}
        <button
          onclick={playRandom}
          title="Play another"
          aria-label="Play another"
          class="text-muted transition-colors hover:text-accent"
        >
          <Shuffle size={12} />
        </button>
      {/if}

      <button
        onclick={() => (fxOpen = true)}
        title="Effects"
        aria-label="Effects"
        class="text-muted transition-colors hover:text-accent"
      >
        <SlidersHorizontal size={12} />
      </button>
    </div>

    {#if current && duration}
      <!-- Energy meter: per-bucket beat intensity across the track, filled to
           the playhead. A transparent range input on top handles seek/keyboard. -->
      <div class="relative h-5 w-44">
        <div class="flex h-full items-center gap-px">
          {#each energyBars as v, i (i)}
            <div
              class="flex-1 transition-colors"
              style="height: {Math.max(12, v * 100)}%; background: {(i + 0.5) /
                ENERGY_BARS <=
              position / duration
                ? 'var(--color-accent)'
                : 'var(--color-line)'};"
            ></div>
          {/each}
        </div>
        <input
          type="range"
          min="0"
          max={duration}
          step="0.1"
          value={position}
          oninput={seek}
          aria-label="Seek"
          class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    {/if}
  </div>
</div>
