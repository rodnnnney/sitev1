<script lang="ts">
  import { Play, Pause, Shuffle } from "lucide-svelte";
  import { flip } from "svelte/animate";
  import { fade } from "svelte/transition";
  import { bangers } from "./consts";
  import { toast } from "./primitives";
  import { triggerShake } from "./shake";

  // MediaElementSource is one-shot per <audio>; HMR would leave a dead graph.
  if (import.meta.hot) import.meta.hot.decline();

  let audio = $state<HTMLAudioElement | null>(null);
  let playing = $state(false);
  let current = $state<(typeof bangers)[number] | null>(null);
  let frame = $state("");
  let position = $state(0); // seconds into the track
  let duration = $state(0);

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
    } catch {
      /* no lyrics for this track — fine */
    }
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

  // The window of lines shown (a couple above the active one, several below).
  const view = $derived.by(() => {
    if (!lyrics.length) return [];
    const start = Math.max(0, activeLine - 2);
    return lyrics
      .slice(start, start + 7)
      .map((l, k) => ({ ...l, i: start + k, active: start + k === activeLine }));
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
  let wave: Uint8Array | null = null;
  let smooth = new Array(COLS).fill(0);
  let lastFrame = 0;
  let raf = 0;

  // Beat-driven page shake, played back from a precomputed <name>.beats.json.
  const BEAT_MIN_INTENSITY = 0.12; // ignore micro-onsets
  const SHAKE_BASE = 3; // px at the faintest beat
  const SHAKE_RANGE = 28; // extra px scaled by beat intensity (drops hit hard)
  let beats: { t: number; i: number }[] = [];
  let beatIdx = 0;

  function setupAudioGraph() {
    if (ctx || !audio) return;
    ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const src = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    analyser.minDecibels = -90; // wider dB window — avoids pegging every bin
    analyser.maxDecibels = -10;
    wave = new Uint8Array(analyser.frequencyBinCount);
    src.connect(analyser);
    analyser.connect(ctx.destination);
  }

  function render(t = 0) {
    raf = requestAnimationFrame(render);
    if (!analyser || !wave) return;
    if (t - lastFrame < 1000 / FPS) return;
    lastFrame = t;

    if (audio) position = audio.currentTime;

    // Advance the karaoke highlight to the latest line at/under the playhead.
    if (lyrics.length && audio) {
      const now = audio.currentTime + LYRIC_OFFSET;
      let idx = -1;
      for (let i = 0; i < lyrics.length && lyrics[i].t <= now; i++) idx = i;
      activeLine = idx;
    }

    // Fire page shakes from the precomputed beat map, scaled by intensity so
    // drops hit hard and soft kicks barely nudge. Collapse beats that fall in
    // the same frame down to their strongest one.
    if (beats.length && audio) {
      const now = audio.currentTime;
      let maxI = 0;
      while (beatIdx < beats.length && beats[beatIdx].t <= now) {
        if (beats[beatIdx].i > maxI) maxI = beats[beatIdx].i;
        beatIdx++;
      }
      if (maxI >= BEAT_MIN_INTENSITY) triggerShake(SHAKE_BASE + maxI * SHAKE_RANGE);
    }

    analyser.getByteFrequencyData(wave);

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

  let recent: (typeof bangers)[number][] = []; // played this cycle; avoids repeats

  function pickRandom() {
    if (bangers.length === 1) return bangers[0];
    // Prefer songs not yet played this cycle; once all are played, start a fresh
    // cycle but exclude the one just played so it never repeats back-to-back.
    let pool = bangers.filter((b) => !recent.includes(b));
    if (pool.length === 0) pool = bangers.filter((b) => b !== current);
    const next = pool[Math.floor(Math.random() * pool.length)];
    recent = recent.length >= bangers.length ? [next] : [...recent, next];
    return next;
  }

  async function attemptPlay(
    song: (typeof bangers)[number],
    attempt = 0,
  ): Promise<void> {
    if (!audio) return;
    audio.src = song.url;
    audio.load();
    try {
      await audio.play();
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

  async function playRandom() {
    if (!audio) return;
    setupAudioGraph();
    await ctx?.resume();
    const song = pickRandom();
    current = song;
    loadLyrics(song);
    loadBeats(song);
    await attemptPlay(song);
  }

  function toggle() {
    if (!audio) return;
    if (playing) audio.pause();
    else if (current && !audio.ended) {
      ctx?.resume();
      audio.play();
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
    cancelAnimationFrame(raf);
  }}
  onended={() => {
    playing = false;
    cancelAnimationFrame(raf);
  }}
  hidden
></audio>

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
      <button
        onclick={toggle}
        class="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-accent"
      >
        {#if playing}
          <Pause size={12} />
        {:else}
          <Play size={12} />
        {/if}
        <span class="truncate">
          {current
            ? `${current.title} — ${current.artist}`
            : "play a random song i like"}
        </span>
      </button>

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
    </div>

    {#if current && duration}
      <input
        type="range"
        min="0"
        max={duration}
        step="0.1"
        value={position}
        oninput={seek}
        aria-label="Seek"
        class="h-1 w-44 cursor-pointer accent-accent"
      />
    {/if}
  </div>
</div>
