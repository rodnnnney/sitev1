<script lang="ts">
  import {
    Play,
    Pause,
    Shuffle,
    SlidersHorizontal,
    ListMusic,
    ChevronDown,
    Eye,
    EyeOff,
  } from "lucide-svelte";
  import { onMount } from "svelte";
  import { flip } from "svelte/animate";
  import { fade, fly } from "svelte/transition";
  import { backOut, cubicOut } from "svelte/easing";
  import { bangers } from "./consts";
  import { deviceType, scrollDirection } from "./deviceStore";
  import { audioViz } from "./audioStore.svelte";
  import { bangerActive, onBangerPlayRequest } from "./bangerTrigger";
  import { Modal, Switch, Button, Marquee, toast, Tooltip } from "./primitives";
  import { ShakeFx } from "./effects/shake.svelte";
  import { FlashFx } from "./effects/flash.svelte";
  import { WordsFx } from "./effects/words.svelte";
  import { DancersFx } from "./effects/dancers.svelte";
  import {
    ACCENT,
    BEAT_MIN_INTENSITY,
    DROP_INTENSITY,
    RAVE,
    loadFx,
    reduceMotion,
    saveFx,
  } from "./effects/shared";

  // MediaElementSource is one-shot per <audio>; HMR would leave a dead graph.
  if (import.meta.hot) import.meta.hot.decline();

  const shakeFx = new ShakeFx();
  const flashFx = new FlashFx();
  const wordsFx = new WordsFx();
  const dancersFx = new DancersFx();

  const isMobile = $derived($deviceType === "mobile");

  const barHidden = $derived(isMobile && $scrollDirection === "down");

  let navH = $state(56);
  $effect(() => {
    if (!isMobile || !current) return;
    const nav = document.querySelector("nav");
    if (nav) navH = nav.getBoundingClientRect().height;
  });

  let audio = $state<HTMLAudioElement | null>(null);
  let playing = $state(false);
  let current = $state<(typeof bangers)[number] | null>(null);
  let bars = $state<number[]>([]); // waveform column heights, 0..1
  let position = $state(0);
  let duration = $state(0);
  let bassDb = $state(-60); // live low-end level in dBFS (top-right readout)

  function seekTo(t: number) {
    if (!audio) return;
    audio.currentTime = t;
    position = t;
    // Re-point the forward-only beat cursor to the new playhead.
    beatIdx = beats.findIndex((b) => b.t > t);
    if (beatIdx < 0) beatIdx = beats.length;
  }

  function seek(e: Event) {
    seekTo(+(e.target as HTMLInputElement).value);
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
  const currentLyric = $derived(
    activeLine >= 0 && lyrics[activeLine] ? lyrics[activeLine].text : "",
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
    // Desktop has room for a taller karaoke window: a few lines of lead-in and
    // several upcoming lines around the one being sung.
    const start = Math.max(0, activeLine - 3);
    return lyrics.slice(start, start + 12).map((l, k) => ({
      ...l,
      i: start + k,
      active: start + k === activeLine,
    }));
  });

  const COLS = 80; // number of waveform bars
  const GAIN = 1.2;
  const CURVE = 2.0; // >1 = louder bands reach the top
  const FPS = 24;
  const EASE = 0.3;

  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let gain: GainNode | null = null;
  let wave: Uint8Array | null = null;
  let bassAnalyser: AnalyserNode | null = null; // lowpassed tap for dBFS meter
  let bassWave: Float32Array | null = null;
  let smooth = new Array(COLS).fill(0);
  let lastFrame = 0;
  let raf = 0;

  let beats = $state<{ t: number; i: number }[]>([]);
  let beatIdx = 0;

  const FADE = 0.4; // play/pause/crossfade ramp duration
  const TIP_MS = 400;

  let fxOpen = $state(false);
  let listOpen = $state(false);
  const queueTip = $derived(listOpen ? "Collapse queue" : "Open queue");
  // Karaoke visibility (persisted). Word-scramble is the separate wordsFx toggle.
  let showLyrics = $state(loadFx("banger-lyrics", true));

  function setShowLyrics(v: boolean) {
    showLyrics = v;
    saveFx("banger-lyrics", v);
  }

  // Mini-player dock: left + bottom so the queue expands upward.
  // null = CSS bottom-right until first layout/drag adopts concrete coords.
  const DOCK_PAD = 20;
  const DOCK_KEY = "banger-dock";
  let dockEl = $state<HTMLElement | null>(null);
  let dockLeft = $state<number | null>(null);
  let dockBottom = $state<number | null>(null);
  let dragging = $state(false);
  let dockMoved = false;
  let dragOrigin = { px: 0, py: 0, oLeft: 0, oBottom: 0, w: 352, h: 72 };

  try {
    const raw = localStorage.getItem(DOCK_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { left?: unknown; bottom?: unknown };
      if (typeof saved.left === "number" && typeof saved.bottom === "number") {
        dockLeft = saved.left;
        dockBottom = saved.bottom;
      }
    }
  } catch {
    /* private mode / bad JSON */
  }

  function clampDock(left: number, bottom: number, w: number, h: number) {
    const maxL = Math.max(DOCK_PAD, window.innerWidth - w - DOCK_PAD);
    const maxB = Math.max(DOCK_PAD, window.innerHeight - h - DOCK_PAD);
    return {
      left: Math.min(Math.max(DOCK_PAD, left), maxL),
      bottom: Math.min(Math.max(DOCK_PAD, bottom), maxB),
    };
  }

  function saveDock() {
    if (dockLeft == null || dockBottom == null) return;
    try {
      localStorage.setItem(
        DOCK_KEY,
        JSON.stringify({ left: dockLeft, bottom: dockBottom }),
      );
    } catch {
      /* private mode / quota */
    }
  }

  function syncDockFromEl() {
    if (!dockEl || dragging) return;
    const w = dockEl.offsetWidth;
    const h = dockEl.offsetHeight;
    if (dockLeft == null || dockBottom == null) {
      const r = dockEl.getBoundingClientRect();
      dockLeft = r.left;
      dockBottom = window.innerHeight - r.bottom;
      return;
    }
    const next = clampDock(dockLeft, dockBottom, w, h);
    if (next.left !== dockLeft || next.bottom !== dockBottom) {
      dockLeft = next.left;
      dockBottom = next.bottom;
    }
  }

  function onDockPointerDown(e: PointerEvent) {
    if (e.button !== 0 || isMobile) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest("button, input, a, [role='option'], [data-no-drag]")) return;
    if (dockLeft == null || dockBottom == null) syncDockFromEl();
    if (dockLeft == null || dockBottom == null || !dockEl) return;
    dragOrigin = {
      px: e.clientX,
      py: e.clientY,
      oLeft: dockLeft,
      oBottom: dockBottom,
      w: dockEl.offsetWidth,
      h: dockEl.offsetHeight,
    };
    dockMoved = false;
    dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onDockPointerMove(e: PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - dragOrigin.px;
    const dy = e.clientY - dragOrigin.py;
    if (!dockMoved && Math.hypot(dx, dy) < 4) return;
    dockMoved = true;
    const next = clampDock(
      dragOrigin.oLeft + dx,
      dragOrigin.oBottom - dy,
      dragOrigin.w,
      dragOrigin.h,
    );
    dockLeft = next.left;
    dockBottom = next.bottom;
  }

  function onDockPointerUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (dockMoved) saveDock();
  }

  // Reclamp when the dock or viewport changes size (queue open, window resize).
  $effect(() => {
    if (!dockEl || isMobile) return;
    syncDockFromEl();
    const ro = new ResizeObserver(() => syncDockFromEl());
    ro.observe(dockEl);
    const onWin = () => syncDockFromEl();
    window.addEventListener("resize", onWin);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWin);
    };
  });

  // Height + fade + rise; margin tweened so gap doesn't pop at the end.
  function queuePanel(node: HTMLElement, { duration = 380 } = {}) {
    const h = node.getBoundingClientRect().height;
    return {
      duration: reduceMotion() ? 0 : duration,
      easing: cubicOut,
      css: (t: number) =>
        `overflow:hidden;opacity:${t};height:${t * h}px;margin-bottom:${t * 8}px;transform:translateY(${(1 - t) * 10}px);`,
    };
  }

  function rampGain(to: number, dur = FADE) {
    if (!ctx || !gain) return;
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(to, now + dur);
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

    if (beats.length && audio) {
      const now = audio.currentTime;
      let maxI = 0;
      while (beatIdx < beats.length && beats[beatIdx].t <= now) {
        if (beats[beatIdx].i > maxI) maxI = beats[beatIdx].i;
        beatIdx++;
      }
      if (maxI >= BEAT_MIN_INTENSITY) {
        wordsFx.palette = current?.rave ? RAVE : ACCENT;
        wordsFx.sources = nowWords.length
          ? nowWords
          : lyricPool.length
            ? lyricPool
            : null;
        wordsFx.pulse(maxI);
        if (wordsFx.enabled) audioViz.beat(maxI);
        if (current?.rave) {
          if (isMobile) {
            if (maxI >= DROP_INTENSITY) shakeFx.beat(maxI, 0.25);
          } else shakeFx.beat(maxI);
        }
      }
      if (maxI >= DROP_INTENSITY && current?.rave)
        flashFx.drop(maxI, wordsFx, true);
      if (!isMobile) dancersFx.spawn(maxI);
    }

    if (isMobile) return;

    analyser.getByteFrequencyData(wave);

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

    bars = smooth.slice();
  }

  function startLoop() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(render);
  }

  function stopEffects() {
    bassDb = -60;
    wordsFx.reset();
    dancersFx.reset();
    flashFx.reset();
    audioViz.playing = false;
    cancelAnimationFrame(raf);
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
      toast.success("Now playing", {
        description: `${song.title} — ${song.artist}`,
      });
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
    bangerActive.set(true);
    audioViz.rave = !!song.rave;
    loadLyrics(song);
    loadBeats(song);
    await attemptPlay(song);
  }

  async function playSong(song: (typeof bangers)[number]) {
    if (!audio) return;
    if (song.rave && !flashAck && !reduceMotion()) {
      pendingSong = song;
      warnOpen = true;
      return;
    }
    await startSong(song);
  }

  async function playRandom() {
    await playSong(pickRandom());
  }

  async function pickSong(song: (typeof bangers)[number]) {
    if (current === song) {
      toggle();
      return;
    }
    await playSong(song);
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

  onMount(() => {
    const unsub = onBangerPlayRequest(() => toggle());
    return () => {
      unsub();
      bangerActive.set(false);
    };
  });

  $effect(() => () => cancelAnimationFrame(raf));

  // ── Media Session: OS-level controls (lock screen, media keys, AirPods) ──
  const hasMediaSession = () =>
    typeof navigator !== "undefined" && "mediaSession" in navigator;

  function updatePositionState() {
    if (!hasMediaSession() || !audio || !duration || !isFinite(duration)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.min(audio.currentTime, duration),
        playbackRate: audio.playbackRate || 1,
      });
    } catch {
      /* setPositionState is strict about bounds; ignore transient throws */
    }
  }

  // Wire the hardware/OS action buttons once.
  $effect(() => {
    if (!hasMediaSession()) return;
    const ms = navigator.mediaSession;
    ms.setActionHandler("play", () => toggle());
    ms.setActionHandler("pause", () => toggle());
    ms.setActionHandler("nexttrack", () => playRandom());
    ms.setActionHandler("previoustrack", () => seekTo(0)); // restart current
    ms.setActionHandler("seekto", (d) => {
      if (d.seekTime != null) seekTo(d.seekTime);
    });
    return () => {
      for (const a of ["play", "pause", "nexttrack", "previoustrack", "seekto"])
        ms.setActionHandler(a as MediaSessionAction, null);
    };
  });

  // Push track metadata when the song changes. Title stays the site name so
  // browser/OS media chrome doesn't hijack the header with the track.
  $effect(() => {
    if (!current || !hasMediaSession()) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: "rodney shen",
      artist: `${current.title} — ${current.artist}`,
      album: "rodney.lol",
      artwork: [
        {
          src: current.cover || "/default-cover.jpg",
          sizes: "512x512",
          type: "image/jpeg",
        },
      ],
    });
  });

  // Reflect play state into the OS media session (tab title stays "rodney shen").
  $effect(() => {
    if (hasMediaSession())
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  });
</script>

<audio
  bind:this={audio}
  crossorigin="anonymous"
  onloadedmetadata={() => {
    duration = audio?.duration ?? 0;
    updatePositionState();
  }}
  ontimeupdate={() => {
    position = audio?.currentTime ?? 0;
    updatePositionState();
  }}
  onplay={() => {
    playing = true;
    audioViz.playing = true;
    startLoop();
  }}
  onpause={() => {
    playing = false;
    stopEffects();
  }}
  onended={() => {
    playing = false;
    playRandom();
  }}
  hidden
></audio>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape" && listOpen) listOpen = false;
  }}
/>

<!-- Live bass level (dBFS) — pinned top-right, steady (outside #shake-root). -->
{#if current && !isMobile}
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
    {@render fxRow("karaoke lyrics", showLyrics, setShowLyrics)}
    {@render fxRow("screen shake", shakeFx.enabled, (v) =>
      shakeFx.setEnabled(v),
    )}
    {@render fxRow("screen flashing", flashFx.enabled, (v) =>
      flashFx.setEnabled(v),
    )}
    {@render fxRow("words/components flashing", wordsFx.enabled, (v) =>
      wordsFx.setEnabled(v),
    )}
    {@render fxRow("dancers", dancersFx.enabled, (v) =>
      dancersFx.setEnabled(v),
    )}
  </div>
{/snippet}

{#snippet coverArt(src: string | undefined, box: string)}
  <img
    src={src || "/default-cover.jpg"}
    alt=""
    class="{box} shrink-0 rounded-sm object-cover"
    draggable="false"
  />
{/snippet}

<Modal
  bind:open={warnOpen}
  title="Photosensitivity warning"
  onclose={cancelWarning}
>
  This track flashes and shakes the screen on the beat.
  <span class="text-accent">Screen flashing is off by default</span>; toggle any
  effect below:
  <div class="mt-3">{@render fxToggles()}</div>
  {#snippet actions()}
    <Button variant="surface" onclick={cancelWarning}>not now</Button>
    <Button onclick={confirmWarning}>play anyway</Button>
  {/snippet}
</Modal>

<Modal bind:open={fxOpen} title="Effects">
  <p class="mb-1">Beat-reactive effects on EDM tracks.</p>
  {@render fxToggles()}

  {#snippet actions()}
    <Button onclick={() => (fxOpen = false)}>done</Button>
  {/snippet}
</Modal>

<div
  bind:this={flashFx.el}
  aria-hidden="true"
  class="pointer-events-none fixed inset-0 z-[2]"
  style="opacity: 0; background: radial-gradient(circle at 50% 45%, #ffffff 0%, var(--color-accent) 55%, var(--color-accent) 100%);"
></div>

<!-- mix-blend-multiply drops the transparent-bg gifs into the paper. -->
{#if dancersFx.dancers.length && !isMobile}
  <div
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 z-20"
    transition:fade={{ duration: 150 }}
  >
    {#each dancersFx.dancers as d, i (i)}
      <img
        src={d.src}
        alt=""
        class="absolute object-contain mix-blend-multiply"
        style="left: {d.x}px; top: {d.y}px; width: {d.size}px; height: {d.size}px; transform: translate(-50%, -50%) rotate({d.rot}deg);"
      />
    {/each}
  </div>
{/if}

{#if view.length && !isMobile && showLyrics}
  <div
    aria-hidden="true"
    class="pointer-events-none fixed top-1/2 right-6 z-30 flex max-w-[42vw] -translate-y-1/2 flex-col items-end gap-2 text-right font-mono transition-opacity duration-300"
    class:opacity-40={!playing}
  >
    {#each view as l (l.i)}
      <!-- Lyrics are time-synced, so a click seeks the track to that line.
           pointer-events-auto only on the lines themselves keeps the gaps
           between them click-through (the container stays pointer-events-none). -->
      <button
        type="button"
        animate:flip={{ duration: 400 }}
        transition:fade={{ duration: 250 }}
        onclick={() => seekTo(l.t)}
        title="Jump to this line"
        class="lyric-line pointer-events-auto m-0 cursor-pointer border-0 bg-transparent p-0 text-right text-sm leading-snug hover:opacity-100 {l.active
          ? 'font-medium text-accent'
          : 'text-muted opacity-40'}"
      >
        {l.text}
      </button>
    {/each}
  </div>
{/if}

<!-- Mobile now-singing banner: the desktop karaoke panel has no room on a phone,
     so the current line scrolls as a marquee pinned just under the top nav. -->
{#if isMobile && currentLyric && showLyrics}
  <div
    data-no-rave
    aria-hidden="true"
    class="pointer-events-none fixed inset-x-0 z-[9] overflow-hidden border-b border-line bg-paper/95 px-4 py-1.5 backdrop-blur"
    style="top: {navH}px;"
    transition:fade={{ duration: 200 }}
  >
    <!-- Each new line flies up into place as the old one slides out, mirroring
         the desktop karaoke's line-by-line advance. Keyed on activeLine so even
         a repeated line still animates; absolute layering lets the two lines
         cross without changing the banner's height. -->
    <div class="relative h-4 overflow-hidden">
      {#key activeLine}
        <div
          class="absolute inset-0 flex items-center"
          in:fly={{ y: 14, duration: 350 }}
          out:fly={{ y: -14, duration: 350 }}
        >
          <Marquee
            text={currentLyric}
            speed={28}
            center
            class="w-full font-mono text-xs leading-none text-accent"
          />
        </div>
      {/key}
    </div>
  </div>
{/if}

{#if isMobile}
  {#if current}
    <!-- Spotify-style mini player: only appears once a track is loaded, sliding
         up from the bottom the first time a song starts. The outer wrapper owns
         the entrance transition; the inner bar owns the scroll show/hide so the
         two transforms never fight. -->
    <div
      data-no-rave
      class="pointer-events-none fixed inset-x-0 bottom-0 z-40"
      in:fly={{
        y: 80,
        duration: reduceMotion() ? 0 : 480,
        delay: 90,
        easing: backOut,
      }}
      out:fade={{ duration: 150 }}
    >
      <div
        class="pointer-events-auto border-t border-line bg-paper/95 backdrop-blur transition-transform duration-300 {barHidden
          ? 'translate-y-full'
          : 'translate-y-0'}"
      >
        <div class="flex items-center gap-3 px-4 py-2.5">
          {@render coverArt(current.cover, "size-10")}

          <button
            onclick={toggle}
            class="flex min-w-0 flex-1 flex-col text-left"
            aria-label={playing ? "Pause" : "Play"}
          >
            <Marquee
              text={current.title}
              class="font-mono text-sm font-medium text-ink"
            />
            <span class="truncate font-mono text-xs text-muted">
              {current.artist}
            </span>
          </button>

          <div class="flex shrink-0 items-center gap-4 text-muted">
            <Tooltip content="Play another" delay={TIP_MS}>
              <button
                onclick={playRandom}
                aria-label="Play another"
                class="transition-colors hover:text-accent"
              >
                <Shuffle size={18} />
              </button>
            </Tooltip>
            <Tooltip content={playing ? "Pause" : "Play"} delay={TIP_MS}>
              <button
                onclick={toggle}
                aria-label={playing ? "Pause" : "Play"}
                class="text-ink transition-colors hover:text-accent"
              >
                {#if playing}
                  <Pause size={22} />
                {:else}
                  <Play size={22} />
                {/if}
              </button>
            </Tooltip>
            <Tooltip content="Effects" delay={TIP_MS}>
              <button
                onclick={() => (fxOpen = true)}
                aria-label="Effects"
                class="transition-colors hover:text-accent"
              >
                <SlidersHorizontal size={18} />
              </button>
            </Tooltip>
          </div>
        </div>

        {#if current && duration}
          <!-- Thin progress line; a transparent range overlay makes it seekable. -->
          <div class="relative h-1 w-full">
            <div class="absolute inset-0 bg-line"></div>
            <div
              class="absolute inset-y-0 left-0 bg-accent"
              style="width: {(position / duration) * 100}%;"
            ></div>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={position}
              oninput={seek}
              aria-label="Seek"
              class="absolute inset-x-0 bottom-0 h-3 w-full cursor-pointer opacity-0"
            />
          </div>
        {/if}
      </div>
    </div>
  {/if}
{:else}
  <!-- Desktop mini player (YouTube / Spotify corner style): compact dock with
       optional queue panel that expands upward. Drag the chrome (not buttons)
       to park it anywhere; position persists. -->
  <div
    bind:this={dockEl}
    data-no-rave
    class="pointer-events-auto fixed z-40 flex w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col items-stretch gap-0"
    class:cursor-grabbing={dragging}
    class:cursor-grab={!dragging}
    style="{dockLeft != null && dockBottom != null
      ? `left:${dockLeft}px;bottom:${dockBottom}px;right:auto;top:auto;`
      : 'right:1.25rem;bottom:1.25rem;left:auto;top:auto;'}{dragging
      ? 'touch-action:none;'
      : ''}"
    onpointerdown={onDockPointerDown}
    onpointermove={onDockPointerMove}
    onpointerup={onDockPointerUp}
    onpointercancel={onDockPointerUp}
  >
    {#if bars.length && current}
      <div
        aria-hidden="true"
        in:fly={{ y: 48, duration: reduceMotion() ? 0 : 520, easing: backOut }}
        class="pointer-events-none mb-2 flex h-10 w-full select-none items-center overflow-hidden transition-opacity duration-300"
        class:opacity-25={!playing}
      >
        {#each bars as h, c (c)}
          <div
            class="wave-bar -mr-px w-1 shrink-0"
            style="height: {Math.max(3, h * 100)}%"
          ></div>
        {/each}
      </div>
    {/if}

    {#if listOpen}
      <div
        class="flex max-h-[min(50vh,22rem)] flex-col overflow-hidden rounded-sm border border-line bg-paper/95 font-mono shadow-sm backdrop-blur"
        transition:queuePanel
      >
        <div
          class="flex items-center justify-between border-b border-line px-3 py-2"
        >
          <span class="text-[10px] font-medium tracking-wide text-muted uppercase"
            >queue</span
          >
          <div class="flex items-center gap-2.5 text-muted">
            <Tooltip
              content={showLyrics ? "Hide lyrics" : "Show lyrics"}
              delay={TIP_MS}
            >
              <button
                type="button"
                onclick={() => setShowLyrics(!showLyrics)}
                aria-label={showLyrics ? "Hide lyrics" : "Show lyrics"}
                aria-pressed={showLyrics}
                class="cursor-pointer transition-colors hover:text-accent"
              >
                {#if showLyrics}
                  <Eye size={13} />
                {:else}
                  <EyeOff size={13} />
                {/if}
              </button>
            </Tooltip>
            <Tooltip content={queueTip} delay={TIP_MS}>
              <button
                type="button"
                onclick={() => (listOpen = false)}
                aria-label={queueTip}
                class="cursor-pointer transition-colors hover:text-accent"
              >
                <ChevronDown size={14} />
              </button>
            </Tooltip>
          </div>
        </div>
        <ul
          data-no-drag
          class="overflow-y-auto py-1"
          role="listbox"
          aria-label="Songs"
        >
          {#each bangers as song (song.url)}
            {@const active = current === song}
            <li>
              <button
                type="button"
                role="option"
                aria-selected={active}
                onclick={() => pickSong(song)}
                class="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-line/40 {active
                  ? 'bg-line/50 text-accent'
                  : 'text-ink'}"
              >
                {@render coverArt(song.cover, "size-8")}
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-xs font-medium"
                    >{song.title}</span
                  >
                  <span class="block truncate text-[10px] text-muted"
                    >{song.artist}</span
                  >
                </span>
                {#if active && playing}
                  <span
                    class="size-1.5 shrink-0 rounded-full bg-accent"
                    aria-hidden="true"
                  ></span>
                {/if}
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <div
      class="overflow-hidden rounded-sm border border-line bg-paper/95 font-mono shadow-sm backdrop-blur select-none"
      in:fly={{
        y: 48,
        duration: reduceMotion() ? 0 : 520,
        easing: backOut,
      }}
    >
      <div class="flex items-center gap-2.5 px-2.5 py-2">
        <Tooltip content={queueTip} delay={TIP_MS}>
          <button
            type="button"
            onclick={() => (listOpen = !listOpen)}
            aria-label={queueTip}
            aria-expanded={listOpen}
            class="shrink-0 cursor-pointer transition-transform hover:opacity-90"
          >
            <span class="pointer-events-none block">
              {@render coverArt(current?.cover, "size-11")}
            </span>
          </button>
        </Tooltip>

        <div class="flex min-w-0 flex-1 flex-col text-left">
          {#if current}
            <Marquee
              text={current.title}
              class="text-xs font-medium text-ink"
            />
            <span class="truncate text-[10px] text-muted">{current.artist}</span>
          {:else}
            <span class="text-xs font-medium text-ink">Play a song</span>
            <span class="truncate text-[10px] text-muted">drag me · pick from queue</span>
          {/if}
        </div>

        <div class="flex shrink-0 items-center gap-2.5 text-muted">
          <Tooltip content={queueTip} delay={TIP_MS}>
            <button
              type="button"
              onclick={() => (listOpen = !listOpen)}
              aria-label={queueTip}
              aria-expanded={listOpen}
              class="cursor-pointer transition-colors hover:text-accent"
              class:text-accent={listOpen}
            >
              <ListMusic size={14} />
            </button>
          </Tooltip>
          <Tooltip content="Play another" delay={TIP_MS}>
            <button
              type="button"
              onclick={playRandom}
              aria-label="Play another"
              class="cursor-pointer transition-colors hover:text-accent"
            >
              <Shuffle size={14} />
            </button>
          </Tooltip>
          <Tooltip content={playing ? "Pause" : "Play"} delay={TIP_MS}>
            <button
              type="button"
              onclick={toggle}
              aria-label={playing ? "Pause" : "Play"}
              class="cursor-pointer text-ink transition-colors hover:text-accent"
            >
              {#if playing}
                <Pause size={14} />
              {:else}
                <Play size={14} />
              {/if}
            </button>
          </Tooltip>
          <Tooltip content="Effects" delay={TIP_MS}>
            <button
              type="button"
              onclick={() => (fxOpen = true)}
              aria-label="Effects"
              class="cursor-pointer transition-colors hover:text-accent"
            >
              <SlidersHorizontal size={14} />
            </button>
          </Tooltip>
        </div>
      </div>

      {#if current && duration}
        <div data-no-drag class="relative h-1 w-full bg-line">
          <div
            class="absolute inset-y-0 left-0 bg-accent"
            style="width: {(position / duration) * 100}%;"
          ></div>
          <input
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={position}
            oninput={seek}
            aria-label="Seek"
            class="absolute inset-x-0 -top-1 h-3 w-full cursor-pointer opacity-0"
          />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* 5-band vertical blue gradient for waveform bars: lightest on the centre
     line, densest at the tips (mirrored). Set once here instead of as a long
     inline style on ~80 bars every animation frame. Token-driven via the
     accent colour (a CSS var + alpha needs color-mix). */
  .wave-bar {
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--color-accent) 100%, transparent) 0 10%,
      color-mix(in srgb, var(--color-accent) 85%, transparent) 10% 20%,
      color-mix(in srgb, var(--color-accent) 70%, transparent) 20% 30%,
      color-mix(in srgb, var(--color-accent) 55%, transparent) 30% 40%,
      color-mix(in srgb, var(--color-accent) 40%, transparent) 40% 60%,
      color-mix(in srgb, var(--color-accent) 55%, transparent) 60% 70%,
      color-mix(in srgb, var(--color-accent) 70%, transparent) 70% 80%,
      color-mix(in srgb, var(--color-accent) 85%, transparent) 80% 90%,
      color-mix(in srgb, var(--color-accent) 100%, transparent) 90% 100%
    );
  }

  /* Karaoke lines get the same animated link underline as the Text `links`
     style (see Text.svelte .text-link-animate): an accent bar that wipes in
     from the left on hover. Driven by background-size so it never reflows. */
  .lyric-line {
    background-image: linear-gradient(var(--color-accent), var(--color-accent));
    background-position: 0% 100%;
    background-size: 0% 0.075em;
    background-repeat: no-repeat;
    /* All of this line's transitions live here so nothing overrides the others:
       colour/opacity fade as the active line moves (keeps the downward
       progression smooth), and the underline wipes in on hover. The vertical
       slide between lines is handled separately by Svelte's animate:flip. */
    transition:
      color 0.5s,
      opacity 0.5s,
      background-size 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .lyric-line:hover {
    background-size: 100% 0.075em;
  }
</style>
