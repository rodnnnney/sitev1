<script lang="ts">
  import {
    Play,
    Pause,
    Shuffle,
    SlidersHorizontal,
    Music,
  } from "lucide-svelte";
  import { flip } from "svelte/animate";
  import { fade, fly } from "svelte/transition";
  import { backOut } from "svelte/easing";
  import { bangers } from "./consts";
  import { deviceType, scrollDirection } from "./deviceStore";
  import { audioViz } from "./audioStore.svelte";
  import { Text, Modal, Switch, Button, toast } from "./primitives";
  import { ShakeFx } from "./effects/shake.svelte";
  import { FlashFx } from "./effects/flash.svelte";
  import { WordsFx } from "./effects/words.svelte";
  import { DancersFx } from "./effects/dancers.svelte";
  import {
    ACCENT,
    BEAT_MIN_INTENSITY,
    DROP_INTENSITY,
    RAVE,
    reduceMotion,
  } from "./effects/shared";

  // MediaElementSource is one-shot per <audio>; HMR would leave a dead graph.
  if (import.meta.hot) import.meta.hot.decline();

  const shakeFx = new ShakeFx();
  const flashFx = new FlashFx();
  const wordsFx = new WordsFx();
  const dancersFx = new DancersFx();

  const isMobile = $derived($deviceType === "mobile");

  const barHidden = $derived(isMobile && $scrollDirection === "down");

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
    // Desktop has room for a taller karaoke window: a few lines of lead-in and
    // several upcoming lines around the one being sung.
    const start = Math.max(0, activeLine - 3);
    return lyrics.slice(start, start + 12).map((l, k) => ({
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

  let beats = $state<{ t: number; i: number }[]>([]);
  let beatIdx = 0;

  const FADE = 0.4; // play/pause/crossfade ramp duration

  let fxOpen = $state(false);

  let waveEl = $state<HTMLElement | null>(null);
  let waveW = $state(0);
  $effect(() => {
    if (!waveEl) return;
    const ro = new ResizeObserver((e) => (waveW = e[0].contentRect.width));
    ro.observe(waveEl);
    return () => ro.disconnect();
  });

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

    // Beat reactions (shake + word flicker + drop flash + dancers) are rave-only
    // — calm tracks like Jar Of Love just get the corner waveform and lyrics.
    if (beats.length && audio && current?.rave) {
      const now = audio.currentTime;
      let maxI = 0;
      while (beatIdx < beats.length && beats[beatIdx].t <= now) {
        if (beats[beatIdx].i > maxI) maxI = beats[beatIdx].i;
        beatIdx++;
      }
      if (maxI >= BEAT_MIN_INTENSITY) {
        // Refresh the word-scramble context for this frame: scramble into the
        // line being sung now → else the whole song → else the page's words.
        wordsFx.palette = current?.rave ? RAVE : ACCENT;
        wordsFx.sources = nowWords.length
          ? nowWords
          : lyricPool.length
            ? lyricPool
            : null;
        shakeFx.beat(maxI);
        wordsFx.pulse(maxI);
        if (wordsFx.enabled) audioViz.beat(maxI);
      }
      if (maxI >= DROP_INTENSITY) flashFx.drop(maxI, wordsFx, !!current?.rave);
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
    audioViz.rave = !!song.rave;
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
    audioViz.playing = true;
    startLoop();
  }}
  onpause={() => {
    playing = false;
    stopEffects();
  }}
  onended={() => {
    playing = false;
    stopEffects();
  }}
  hidden
></audio>

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
    {@render fxRow("screen shake", shakeFx.enabled, (v) =>
      shakeFx.setEnabled(v),
    )}
    {@render fxRow("screen flashing", flashFx.enabled, (v) =>
      flashFx.setEnabled(v),
    )}
    {@render fxRow("word flashing", wordsFx.enabled, (v) =>
      wordsFx.setEnabled(v),
    )}
    {@render fxRow("dancers", dancersFx.enabled, (v) =>
      dancersFx.setEnabled(v),
    )}
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

{#if view.length && !isMobile}
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
          <!-- Cover art, with a music glyph as the fallback. -->
          {#if current.cover}
            <img
              src={current.cover}
              alt=""
              class="size-10 shrink-0 rounded-sm object-cover"
            />
          {:else}
            <div
              class="grid size-10 shrink-0 place-items-center rounded-sm bg-line/50 text-accent"
            >
              <Music size={18} />
            </div>
          {/if}

          <button
            onclick={toggle}
            class="flex min-w-0 flex-1 flex-col text-left"
            aria-label={playing ? "Pause" : "Play"}
          >
            <span class="truncate font-mono text-sm font-medium text-ink">
              {current.title}
            </span>
            <span class="truncate font-mono text-xs text-muted">
              {current.artist}
            </span>
          </button>

          <div class="flex shrink-0 items-center gap-4 text-muted">
            <button
              onclick={playRandom}
              aria-label="Play another"
              class="transition-colors hover:text-accent"
            >
              <Shuffle size={18} />
            </button>
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
            <button
              onclick={() => (fxOpen = true)}
              aria-label="Effects"
              class="transition-colors hover:text-accent"
            >
              <SlidersHorizontal size={18} />
            </button>
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
  {:else}
    <!-- Easter egg: before anything plays, the player is just a quiet prompt. -->
    <div
      data-no-rave
      out:fade={{ duration: 150 }}
      class="fixed right-4 bottom-4 z-40 font-mono text-xs transition-all duration-300 {barHidden
        ? 'pointer-events-none translate-y-16 opacity-0'
        : 'pointer-events-auto translate-y-0 opacity-100'}"
    >
      <Text type="paragraph" size="xs" color="muted" links class="leading-none">
        <a
          href="#"
          role="button"
          onclick={(e) => {
            e.preventDefault();
            toggle();
          }}
        >
          I wonder what this button does🤔
        </a>
      </Text>
    </div>
  {/if}
{:else}
  <div
    data-no-rave
    class="pointer-events-none fixed right-5 bottom-5 z-40 flex flex-col items-end gap-2"
  >
    <!-- The large ASCII sound wave stays above the player. -->
    {#if frame}
      <div
        bind:this={waveEl}
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

    {#if current}
      <!-- Structured player card, mirroring the mobile bar's layout. Width is
           matched to the soundwave above it (falls back to w-64 pre-measure). -->
      <div
        class="pointer-events-auto flex w-64 flex-col gap-2 rounded-sm border border-line bg-paper/95 px-3 py-2.5 font-mono backdrop-blur"
        style={waveW ? `width: ${waveW}px` : undefined}
      >
        <div class="flex items-center gap-3">
          {#if current.cover}
            <img
              src={current.cover}
              alt=""
              class="size-10 shrink-0 rounded-sm object-cover"
            />
          {:else}
            <div
              class="grid size-10 shrink-0 place-items-center rounded-sm bg-line/50 text-accent"
            >
              <Music size={18} />
            </div>
          {/if}

          <button
            onclick={toggle}
            class="flex min-w-0 flex-1 flex-col text-left"
            aria-label={playing ? "Pause" : "Play"}
          >
            <span class="truncate text-xs font-medium text-ink">
              {current.title}
            </span>
            <span class="truncate text-[10px] text-muted">
              {current.artist}
            </span>
          </button>

          <div class="flex shrink-0 items-center gap-3 text-muted">
            <button
              onclick={playRandom}
              aria-label="Play another"
              class="transition-colors hover:text-accent"
            >
              <Shuffle size={14} />
            </button>
            <button
              onclick={toggle}
              aria-label={playing ? "Pause" : "Play"}
              class="text-ink transition-colors hover:text-accent"
            >
              {#if playing}
                <Pause size={18} />
              {:else}
                <Play size={18} />
              {/if}
            </button>
            <button
              onclick={() => (fxOpen = true)}
              aria-label="Effects"
              class="transition-colors hover:text-accent"
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </div>

        {#if duration}
          <!-- Energy meter: per-bucket beat intensity, filled to the playhead.
               A transparent range input on top handles seek/keyboard. -->
          <div class="relative h-5 w-full">
            <div class="flex h-full items-center gap-px">
              {#each energyBars as v, i (i)}
                <div
                  class="flex-1 transition-colors"
                  style="height: {Math.max(12, v * 100)}%; background: {(i +
                    0.5) /
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
    {:else}
      <!-- Nothing playing yet: keep the quiet easter-egg prompt. -->
      <div class="pointer-events-auto font-mono text-xs">
        <Text
          type="paragraph"
          size="xs"
          color="muted"
          links
          class="leading-none"
        >
          <a
            href="#"
            role="button"
            onclick={(e) => {
              e.preventDefault();
              toggle();
            }}
          >
            I wonder what this button does🤔
          </a>
        </Text>
      </div>
    {/if}
  </div>
{/if}
