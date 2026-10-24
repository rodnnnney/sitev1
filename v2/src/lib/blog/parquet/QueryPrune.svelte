<script lang="ts">
  import { flip } from "svelte/animate";
  import { crossfade, fade } from "svelte/transition";
  import { X } from "lucide-svelte";
  import { reduceMotion } from "../../effects/shared";
  import { Text } from "../../primitives";
  import { StepClock } from "./clock.svelte";
  import StepControls from "./StepControls.svelte";

  // The 1 GB file from above: 8 row groups × (city 0.4 MB, temp 4 MB in 4 pages,
  // description 124 MB). Written in time order, so temp clusters by row group.
  const CITY = "Lima";
  const LIMIT = 30;
  const MB = 1024 * 1024;
  const FILE_BYTES = 1024 * MB;
  const FOOTER_BYTES = 5 * 1024 + 8;
  const DICT_PAGE_BYTES = 70;
  const PAGE_INDEX_BYTES = 200; // per temp chunk
  const CITY_BYTES = 0.4 * MB;
  const TEMP_PAGE_BYTES = MB;

  type Rg = { dict: string[]; pages: [number, number][] }; // pages: temp [min, max]
  const RGS: Rg[] = [
    { dict: ["Oslo", "Paris", "Cairo", "Lima", "Tokyo"], pages: [[-8, 6], [-5, 9], [-2, 12], [0, 11]] },
    { dict: ["Lima", "Oslo", "Tokyo", "Cairo", "Paris"], pages: [[1, 14], [3, 18], [2, 15], [4, 17]] },
    { dict: ["Oslo", "Paris", "Tokyo", "Cairo"], pages: [[9, 22], [12, 26], [14, 31], [11, 24]] },
    { dict: ["Lima", "Oslo", "Tokyo", "Cairo", "Paris"], pages: [[14, 24], [19, 29], [22, 36], [17, 27]] },
    { dict: ["Tokyo", "Paris", "Oslo", "Cairo"], pages: [[18, 30], [21, 34], [25, 38], [20, 33]] },
    { dict: ["Cairo", "Lima", "Paris", "Tokyo", "Oslo"], pages: [[20, 33], [15, 26], [12, 25], [10, 22]] },
    { dict: ["Paris", "Lima", "Oslo", "Cairo", "Tokyo"], pages: [[6, 19], [4, 16], [2, 14], [1, 13]] },
    { dict: ["Cairo", "Oslo", "Lima", "Paris", "Tokyo"], pages: [[-3, 10], [-6, 8], [-4, 9], [-7, 7]] },
  ];
  // A few rows from each page that gets read; values stay within that page's min/max.
  const INSIDE: { rg: number; page: number; rows: [string, number][] }[] = [
    {
      rg: 3,
      page: 2,
      rows: [["Lima", 31.2], ["Oslo", 33.5], ["Lima", 28.4], ["Paris", 35.0], ["Lima", 34.1], ["Cairo", 36.0], ["Tokyo", 22.0], ["Lima", 30.6]],
    },
    {
      rg: 5,
      page: 0,
      rows: [["Cairo", 33.0], ["Lima", 32.4], ["Lima", 20.0], ["Oslo", 25.1], ["Lima", 26.8], ["Tokyo", 31.7], ["Paris", 24.3], ["Lima", 30.9]],
    },
  ];
  const matches = (city: string, t: number) => city === CITY && t > LIMIT;
  const hits = INSIDE.flatMap((p) => p.rows.filter(([c, t]) => matches(c, t)).map(([, t]) => t));
  const answer = (hits.reduce((a, b) => a + b, 0) / hits.length).toFixed(1);

  const max = (rg: Rg) => Math.max(...rg.pages.map((p) => p[1]));
  const min = (rg: Rg) => Math.min(...rg.pages.map((p) => p[0]));

  const S = { Question: 0, Footer: 1, Stats: 2, Dict: 3, PageIndex: 4, Read: 5, Inside: 6, Compare: 7 } as const;
  const STEPS = [
    {
      title: "the file",
      ms: 5000,
      body: "8 row groups of city, temp and description. So far the reader knows nothing about what's inside.",
    },
    {
      title: "footer",
      ms: 6000,
      body: "Read the last 8 bytes, then the ~5 KB footer. Now the reader knows where every chunk is and every chunk's min and max, without touching any data.",
    },
    {
      title: "row group stats",
      ms: 7000,
      body: `In 4 row groups the hottest reading is ${LIMIT}° or less, so nothing there can match. They're skipped, and it cost nothing: the stats were already in the footer.`,
    },
    {
      title: "dictionaries",
      ms: 8000,
      body: `For the 4 left, read only city's dictionary page, ~70 bytes each. Two don't contain '${CITY}' at all, so those row groups are skipped too.`,
    },
    {
      title: "page index",
      ms: 7000,
      body: `In the last 2, read the page index: the lowest and highest temp on each page. Only one page in each has a max above ${LIMIT}°.`,
    },
    {
      title: "read",
      ms: 7000,
      body: "Fetch just those temp pages and the city values for them. description, 124 MB in every row group, is never read.",
    },
    {
      title: "inside the pages",
      ms: 10000,
      body: `Only now does the reader decode actual values: the rows in those two pages, temp and the matching city values. Keep rows that are ${CITY} and above ${LIMIT}°, average them, done.`,
    },
    {
      title: "compare",
      ms: 9000,
      body: "A row database with no index on these columns reads every row, every column. An index would help it, but you'd build and maintain one per column you filter on. Parquet writes stats, dictionaries and page indexes for every column, as part of the file.",
    },
  ];

  const clock = new StepClock(STEPS.map((s) => s.ms));
  const step = $derived(clock.step);

  // What the reader knows about each row group by now.
  const statsSkip = (rg: Rg) => step >= S.Stats && max(rg) <= LIMIT;
  const dictRead = (rg: Rg) => step >= S.Dict && max(rg) > LIMIT;
  const dictSkip = (rg: Rg) => dictRead(rg) && !rg.dict.includes(CITY);
  const alive = (rg: Rg) => max(rg) > LIMIT && rg.dict.includes(CITY);
  const pageKept = (rg: Rg, p: number) => alive(rg) && rg.pages[p][1] > LIMIT;

  // Skipped row groups fly into a tray; the rest reflow and grow, so the
  // fewer that survive, the more of their insides there's room to show.
  const instant = reduceMotion();
  // Jumping several steps (or looping back to the start) would send many tiles
  // flying at once; snap instead, and animate only step-by-step changes.
  let jumpy = false;
  let lastStep = 0;
  $effect.pre(() => {
    jumpy = Math.abs(step - lastStep) > 1;
    lastStep = step;
  });
  const dur = (ms: number) => (instant || jumpy ? 0 : ms);
  const [send, receive] = crossfade({ fallback: (n) => fade(n, { duration: dur(300) }) });
  const skipped = (rg: Rg) => statsSkip(rg) || dictSkip(rg);
  // Keep rejected groups in place during the stats step so the cutoff is clear.
  const inTray = (rg: Rg) => step > S.Stats && skipped(rg);
  const active = $derived(RGS.map((rg, g) => ({ rg, g })).filter(({ rg }) => !inTray(rg)));
  const tray = $derived(RGS.map((rg, g) => ({ rg, g })).filter(({ rg }) => inTray(rg)));
  const remaining = $derived(RGS.filter((rg) => !skipped(rg)).length);
  const cols = $derived(
    active.length > 4 ? "grid-cols-2 sm:grid-cols-4" : active.length > 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2",
  );
  const inside = (g: number) => INSIDE.find((p) => p.rg === g);

  const survivors = RGS.filter((rg) => max(rg) > LIMIT);
  const finalists = RGS.filter(alive);
  const keptPages = finalists.reduce((n, rg) => n + rg.pages.filter((p) => p[1] > LIMIT).length, 0);

  const readBytes = $derived(
    (step >= S.Footer ? FOOTER_BYTES : 0) +
      (step >= S.Dict ? survivors.length * DICT_PAGE_BYTES : 0) +
      (step >= S.PageIndex ? finalists.length * PAGE_INDEX_BYTES : 0) +
      (step >= S.Read ? finalists.length * CITY_BYTES + keptPages * TEMP_PAGE_BYTES : 0),
  );
  // The row database just keeps scanning, and has read it all by the comparison.
  const rowDbBytes = $derived(Math.min(1, clock.elapsed / clock.starts[S.Compare]) * FILE_BYTES);

  function size(n: number) {
    if (n < 1024) return `${Math.round(n)} B`;
    if (n < MB) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * MB) return `${(n / MB).toFixed(1)} MB`;
    return `${(n / (1024 * MB)).toFixed(1)} GB`;
  }

  function note(rg: Rg): string {
    if (statsSkip(rg)) return `hottest ${max(rg)}°`;
    if (dictSkip(rg)) return `no ${CITY}`;
    return "";
  }
</script>

<figure
  {@attach clock.observe}
  {@attach clock.run}
  class="flex flex-col gap-4 rounded-sm border border-line p-4"
>
  <StepControls {clock} labels={STEPS.map((s) => s.title)} />

  <div class="flex min-h-20 flex-col gap-1.5">
    <Text type="label" size="xs" color="accent">{step + 1}/{STEPS.length} · {STEPS[step].title}</Text>
    {#key step}
      <p class="caption font-mono text-sm leading-relaxed text-ink">{STEPS[step].body}</p>
    {/key}
  </div>

  <!-- The file as a map: row groups as tiles, footer along the bottom. -->
  <div class="flex flex-col gap-2 rounded-sm border border-ink/30 p-2 font-mono text-[10px]">
    <div class="flex justify-between px-0.5 text-[11px]">
      <span class="text-ink">weather.parquet · 1 GB</span>
      <span class="text-muted">{remaining} of 8 row groups left</span>
    </div>

    {#if tray.length}
      <div class="flex flex-wrap items-center gap-1" transition:fade={{ duration: dur(200) }}>
        <span class="text-muted">skipped:</span>
        {#each tray as { rg, g } (g)}
          <span
            class="inline-flex items-center gap-1 rounded-xs border border-line px-1 py-0.5 text-muted"
            in:receive={{ key: g, duration: dur(500) }}
            out:send={{ key: g, duration: dur(500) }}
            animate:flip={{ duration: dur(400) }}><X class="size-3 shrink-0" aria-hidden="true" />rg {g} · {note(rg)}</span
          >
        {/each}
      </div>
    {/if}

    <div class="grid gap-2 {cols}">
      {#each active as { rg, g } (g)}
        {@const reading = step >= S.Read && alive(rg)}
        {@const indexed = step >= S.PageIndex && alive(rg)}
        {@const rejected = statsSkip(rg)}
        <div
          class="flex flex-col gap-1.5 rounded-xs border p-1.5 {rejected ? 'border-red-300 bg-red-50' : reading ? 'border-accent' : 'border-line'}"
          in:receive={{ key: g, duration: dur(500) }}
          out:send={{ key: g, duration: dur(500) }}
          animate:flip={{ duration: dur(500) }}
        >
          <div class="flex justify-between">
            <span class="text-ink">row group {g}</span>
            <span class="tabular-nums text-muted {step >= S.Footer ? '' : 'invisible'}">{min(rg)}–{max(rg)}°</span>
          </div>

          {#if rejected}
            <span class="font-semibold text-red-700">Skipped · max {max(rg)}° ≤ {LIMIT}°</span>
          {/if}

          <!-- city: its dictionary, once read -->
          <div class="flex min-h-4 flex-wrap items-center gap-0.5">
            <span class="w-7 shrink-0 text-muted">city</span>
            {#if dictRead(rg)}
              {#each rg.dict as name (name)}
                <span class="rounded-xs px-0.5 {name === CITY ? 'bg-accent text-paper' : 'bg-blue-50 text-ink'}">{name}</span>
              {/each}
            {:else}
              <span class="h-3 flex-1 rounded-xs border border-line"></span>
            {/if}
          </div>

          <!-- temp: 4 page boxes, which open into a list once the page index is read -->
          <div class="flex gap-0.5 {indexed ? 'flex-col' : 'items-center'}">
            <span class="w-7 shrink-0 text-muted">temp</span>
            {#if indexed}
              {#each rg.pages as [lo, hi], p (p)}
                {@const kept = pageKept(rg, p)}
                {@const rows = kept ? inside(g)?.rows : undefined}
                <div
                  class="flex flex-col rounded-xs border px-1.5 py-1 transition-colors duration-300
                    {reading && kept ? 'border-accent bg-blue-50' : kept ? 'border-accent' : 'border-line text-muted'}"
                >
                  <span class="flex justify-between gap-2 tabular-nums {kept ? 'text-accent' : ''}">
                    <span class="inline-flex items-center gap-1">{#if !kept}<X class="size-3 shrink-0" aria-hidden="true" />{/if}page {p}</span>
                    <span>min {lo}° · max {hi}°</span>
                  </span>
                  <!-- the one page that gets opened: a few of its rows -->
                  {#if rows && step >= S.Inside}
                    <div class="mt-1 flex flex-col gap-px border-t border-blue-200 pt-1" transition:fade={{ duration: dur(300) }}>
                      {#each rows as [city, t], i (i)}
                        {@const ok = matches(city, t)}
                        <span class="flex gap-2 rounded-xs px-0.5 {ok ? 'bg-accent text-paper' : 'text-muted'}">
                          <span class="w-9">{city}</span>
                          <span class="w-9 text-right tabular-nums">{t.toFixed(1)}°</span>
                          <span>{ok ? "match" : city !== CITY ? `not ${CITY}` : `≤ ${LIMIT}°`}</span>
                        </span>
                      {/each}
                      <span class="pt-0.5 text-muted">… a real page holds ~250k values</span>
                    </div>
                  {/if}
                </div>
              {/each}
            {:else}
              {#each rg.pages as _, p (p)}
                <span
                  class="relative h-4 flex-1 rounded-xs border {rejected ? 'border-red-300 text-red-700' : 'border-line'}"
                  aria-label={rejected ? `Page ${p} skipped: row group max ${max(rg)}°, at most ${LIMIT}°` : `Page ${p}`}
                >
                  {#if rejected}<X class="absolute inset-0 m-auto size-4" aria-hidden="true" />{/if}
                </span>
              {/each}
            {/if}
          </div>

          <!-- description: the bulk, never read -->
          <div class="flex items-center gap-0.5">
            <span class="w-7 shrink-0 text-muted">desc</span>
            <span class="flex h-4 flex-1 items-center rounded-xs border border-dashed border-line px-1 text-muted">
              124 MB{active.length <= 2 ? " · never read" : ""}
            </span>
          </div>
        </div>
      {/each}
    </div>

    <div
      class="rounded-xs border px-2 py-1 transition-colors duration-300
        {step >= S.Footer ? 'border-accent bg-blue-50 text-accent' : 'border-line text-muted'}"
    >
      footer · where every chunk is + min/max of each · ~5 KB
    </div>
  </div>

  {#if step >= S.Inside}
    <div class="font-mono text-xs text-ink" transition:fade={{ duration: dur(300) }}>
      answer: <span class="text-accent">{answer}°</span>
      <span class="text-muted">· average of the {hits.length} matching readings</span>
    </div>
  {/if}

  <!-- Bytes read so far: Parquet vs a row-store scan -->
  <div class="flex flex-col gap-2 border-t border-line pt-3 font-mono text-[11px]">
    <div class="flex items-center gap-2">
      <span class="w-24 shrink-0 text-ink">parquet</span>
      <div class="h-2 flex-1 rounded-xs bg-line">
        <div class="h-full rounded-xs bg-accent" style="width: max({readBytes ? 2 : 0}px, {(readBytes / FILE_BYTES) * 100}%)"></div>
      </div>
      <span class="w-16 shrink-0 text-right tabular-nums text-accent">{size(readBytes)}</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="w-24 shrink-0 text-ink">row db scan</span>
      <div class="h-2 flex-1 rounded-xs bg-line">
        <div class="h-full rounded-xs bg-blue-300" style="width: {(rowDbBytes / FILE_BYTES) * 100}%"></div>
      </div>
      <span class="w-16 shrink-0 text-right tabular-nums text-ink">{size(rowDbBytes)}</span>
    </div>
    {#if step === S.Compare}
      <span class="text-muted">
        parquet read {size(readBytes)}, <span class="text-accent">~{Math.round(FILE_BYTES / readBytes)}× less</span> than
        scanning every row.
      </span>
    {/if}
  </div>
</figure>

<style>
  .caption {
    animation: caption-in 400ms ease-out;
  }
  @keyframes caption-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .caption {
      animation: none;
    }
  }
</style>
