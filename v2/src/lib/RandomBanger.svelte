<script lang="ts">
  import { Play, Pause, Shuffle, SlidersHorizontal } from "lucide-svelte";
  import { flip } from "svelte/animate";
  import { fade } from "svelte/transition";
  import { bangers } from "./consts";
  import { Text, Modal, Switch, toast } from "./primitives";
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

  // Current song's lyric words — the preferred scramble source (see litRandom).
  const lyricPool = $derived(
    lyrics.flatMap((l) => l.text.split(/\s+/)).filter(Boolean),
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
    return lyrics.slice(start, start + 7).map((l, k) => ({
      ...l,
      i: start + k,
      active: start + k === activeLine,
    }));
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
  let smooth = new Array(COLS).fill(0);
  let lastFrame = 0;
  let raf = 0;

  // Beat-driven page shake, played back from a precomputed <name>.beats.json.
  const BEAT_MIN_INTENSITY = 0.12; // ignore micro-onsets
  const SHAKE_BASE = 4; // px at the faintest beat
  const SHAKE_RANGE = 36; // extra px scaled by beat intensity
  const DROP_INTENSITY = 0.45; // a beat this strong is a "drop" -> flash + kick
  const DROP_SHAKE_BOOST = 14; // extra px of shake on a drop
  let beats: { t: number; i: number }[] = [];
  let beatIdx = 0;

  // Ambient immersion.
  let flashEl: HTMLElement | null = null; // full-screen drop-flash overlay
  const FADE = 0.4; // seconds for play/pause/crossfade ramps

  // Rave strobe colours, cycled per pulse on each drop.
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

  // During a drop, random words flash accent AND scramble to a random word,
  // then snap back. Wrap every page word in a span once; each span keeps its
  // original text in data-w so we can restore it.
  let raveWords: HTMLElement[] | null = null;
  let wordPool: string[] = []; // the page's own words (fallback scramble source)
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
          s.dataset.w = part; // original, for restore
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

  // Per-effect toggles, persisted. Each gates one rave effect independently.
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
  let fxOpen = $state(false); // settings panel visibility
  $effect(() => {
    try {
      localStorage.setItem("fx-shake", fxShake ? "1" : "0");
      localStorage.setItem("fx-flash", fxFlash ? "1" : "0");
      localStorage.setItem("fx-words", fxWords ? "1" : "0");
    } catch {
      /* ignore */
    }
  });

  function clearLit() {
    for (const w of litWords) {
      w.style.color = "";
      if (w.dataset.w !== undefined) w.textContent = w.dataset.w; // restore word
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
    // Prefer the song's lyric words; fall back to the page's own words.
    const src = lyricPool.length ? lyricPool : wordPool;
    const count = Math.ceil(words.length * frac);
    for (let k = 0; k < count; k++) {
      const w = words[(Math.random() * words.length) | 0];
      w.style.color = palette[(Math.random() * palette.length) | 0];
      w.textContent = src[(Math.random() * src.length) | 0]; // scramble
      litWords.add(w);
    }
  }

  // Subtle per-beat word flicker (fires on every beat, all songs). Restores
  // shortly after so words don't stay scrambled through a quiet stretch.
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
    // Rave-only, and only the sub-effects the user has left enabled.
    if (!flashEl || !current?.rave || reduceMotion()) return;
    if (!fxFlash && !fxWords) return;
    if (wordClearTimer) clearTimeout(wordClearTimer); // strobe owns the words now

    const peak = Math.min(0.92, 0.55 + intensity * 0.5);
    const words = ensureRaveWords();

    // Rapid colour-cycling strobe — more pulses for bigger drops.
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
      if (fxWords) litRandom(words, 0.18, RAVE); // full palette, each pulse
      setTimeout(() => {
        if (!flashEl || gen !== strobeGen) return;
        if (fxFlash) flashEl.style.opacity = "0"; // off phase
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
          if (maxI >= DROP_INTENSITY) amp += DROP_SHAKE_BOOST; // extra kick on drops
          triggerShake(amp);
        }
        pulseWords(maxI); // flicker/scramble a few words on every beat (gated)
      }
      if (maxI >= DROP_INTENSITY) flashDrop(maxI); // big drop -> full strobe
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

  function pickRandom() {
    if (bangers.length <= 1) return bangers[0];
    // Truly random each time — only avoid repeating the song just played.
    let next = current;
    while (next === current) {
      next = bangers[Math.floor(Math.random() * bangers.length)];
    }
    return next;
  }

  async function attemptPlay(
    song: (typeof bangers)[number],
    attempt = 0,
  ): Promise<void> {
    if (!audio) return;
    audio.src = song.url;
    audio.load();
    gain?.gain.setValueAtTime(0, ctx?.currentTime ?? 0); // start silent
    try {
      await audio.play();
      rampGain(1); // fade in
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
      rampGain(0, 0.25); // fade out, then pause
      setTimeout(() => audio?.pause(), 250);
    } else if (current && !audio.ended) {
      ctx?.resume();
      audio.play(); // onplay fades back in
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
    if (wordClearTimer) clearTimeout(wordClearTimer);
    clearLit();
    cancelAnimationFrame(raf);
  }}
  onended={() => {
    playing = false;
    if (wordClearTimer) clearTimeout(wordClearTimer);
    clearLit();
    cancelAnimationFrame(raf);
  }}
  hidden
></audio>

<!-- Flashing-lights warning, shown once before the first EDM/rave track. -->
<Modal
  bind:open={warnOpen}
  title="Flashing lights ahead"
  onclose={cancelWarning}
>
  Heads up — this track might set off strobe flashes and some screen shake on
  the beat. If you're sensitive to flashing lights, maybe sit this one out — or
  flip on your device's <span class="text-ink">reduce motion</span> setting and
  the effects stay off.
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

<!-- Effects config: toggle each rave effect independently. -->
<Modal bind:open={fxOpen} title="Effects">
  {#snippet fxRow(label: string, on: boolean, set: (v: boolean) => void)}
    <div class="flex w-full items-center justify-between py-2 text-sm text-ink">
      <span>{label}</span>
      <Switch checked={on} onCheckedChange={set} aria-label={label} />
    </div>
  {/snippet}

  <p class="mb-1">Beat-reactive effects on EDM tracks.</p>
  <div class="flex flex-col">
    {@render fxRow("screen shake", fxShake, (v) => (fxShake = v))}
    {@render fxRow("screen flashing", fxFlash, (v) => (fxFlash = v))}
    {@render fxRow("word flashing", fxWords, (v) => (fxWords = v))}
  </div>

  {#snippet actions()}
    <button
      onclick={() => (fxOpen = false)}
      class="rounded-sm bg-accent px-3 py-1.5 font-mono text-xs text-paper transition-opacity hover:opacity-90"
    >
      done
    </button>
  {/snippet}
</Modal>

<!-- Drop flash: white-hot burst on big drops (opacity driven via .animate()). -->
<div
  bind:this={flashEl}
  aria-hidden="true"
  class="pointer-events-none fixed inset-0 z-[2]"
  style="opacity: 0; background: radial-gradient(circle at 50% 45%, #ffffff 0%, var(--color-accent) 55%, var(--color-accent) 100%);"
></div>

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
