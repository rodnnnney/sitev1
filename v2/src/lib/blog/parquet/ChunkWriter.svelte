<script lang="ts">
  import { Text } from "../../primitives";
  import { StepClock } from "./clock.svelte";
  import StepControls from "./StepControls.svelte";
  import { CODES, DICT, DICT_BYTES, ENCODED_BYTES, PAGE, PAGES, PLAIN_BYTES, VALUES, pageDesc } from "./chunk";

  const firstSeen = (i: number) => VALUES.indexOf(VALUES[i]) === i;

  const S = { Arrive0: 0, Width: 1, Pack: 2, Held: 3, Arrive1: 4, Rle: 5, Close: 6 } as const;
  const VALUE_MS = [1200, 800]; // per value, page 0 / page 1

  const STEPS = [
    {
      title: "values arrive",
      ms: PAGE * VALUE_MS[0],
      body: "Each value is looked up in the dictionary. A new one gets the next index; a repeat reuses its index. Only that index goes into the page buffer, as a plain 32-bit int.",
    },
    {
      title: "page full: bit width",
      ms: 6000,
      body: "The buffer reaches the page size (8 values here, ~1 MB in practice) and flushes. 3 dictionary entries means indexes 0 to 2, which fit in 2 bits. (parquet-go encodes here, at flush; parquet-java encodes each code as it arrives. Same bytes either way.)",
    },
    {
      title: "bit-pack",
      ms: 10000,
      body: "Nothing repeats 8 times, so no RLE. Bit-packing keeps the same values and just shrinks the type: the largest is 2, so int32 becomes a 2-bit int, packed end to end. 32 bytes become 2.",
    },
    {
      title: "page held in memory",
      ms: 6000,
      body: "Flushing a page doesn't write anything to disk. The encoded page waits in memory until the whole row group is full; the dictionary page has to go first, and the dictionary may still grow.",
    },
    {
      title: "more values",
      ms: PAGE * VALUE_MS[1],
      body: "Paris eight times. Every lookup hits entry 1, so the dictionary doesn't change, and the buffer fills with the same code.",
    },
    {
      title: "page full: RLE",
      ms: 9000,
      body: "Eight identical codes in a row: instead of packing them, RLE stores the run once, as a count and a value. Two bytes for eight values.",
    },
    {
      title: "row group flush",
      ms: 10000,
      body: "This is the only time anything hits disk. In a real file, pages keep piling up until the row group reaches ~128 MB; here it's after two. Now the dictionary is final, so it's written first, then the held pages: the column chunk.",
    },
  ];

  function longestRun(c: number[]) {
    let best = 0;
    for (let i = 0, run = 0; i < c.length; i++) {
      run = i > 0 && c[i] === c[i - 1] ? run + 1 : 1;
      best = Math.max(best, run);
    }
    return best;
  }

  const clock = new StepClock(STEPS.map((s) => s.ms));
  const step = $derived(clock.step);
  const into = $derived(clock.into);

  // Which value is being handled right now (-1 when none), and how many are done.
  const current = $derived(
    step === S.Arrive0
      ? Math.floor(into / VALUE_MS[0])
      : step === S.Arrive1
        ? PAGE + Math.floor(into / VALUE_MS[1])
        : -1,
  );
  const done = $derived(current >= 0 ? current : step < S.Arrive1 ? PAGE : VALUES.length);
  // The second half of a value's slot is when its code lands in the buffer.
  const landed = $derived(
    current >= 0 && (into % VALUE_MS[step === S.Arrive0 ? 0 : 1]) / VALUE_MS[step === S.Arrive0 ? 0 : 1] > 0.5,
  );

  const dictSize = $derived(new Set(VALUES.slice(0, current >= 0 ? current + 1 : done)).size);
  const pageNo = $derived(step < S.Held ? 0 : 1);
  const buffer = $derived.by(() => {
    if (step === S.Held || step === S.Close) return [];
    const start = pageNo * PAGE;
    const end = current >= 0 ? current + (landed ? 1 : 0) : start + PAGE;
    return CODES.slice(start, end);
  });
  const held = $derived(
    step >= S.Held && step < S.Close ? (step === S.Rle && into > STEPS[S.Rle].ms * 0.6 ? [0, 1] : [0]) : [],
  );
</script>

{#snippet cell(text: string, cls = "")}
  <span
    class="inline-flex h-7 min-w-8 items-center justify-center rounded-xs border px-1.5 font-mono text-[11px] tabular-nums transition-colors duration-300 {cls}"
    >{text}</span
  >
{/snippet}

{#snippet row(label: string)}
  <span class="w-24 shrink-0 pt-1.5 font-mono text-[11px] text-muted">{label}</span>
{/snippet}

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

  <div class="flex flex-col gap-3">
    <!-- incoming values -->
    <div class="flex gap-3">
      {@render row("incoming")}
      <div class="flex flex-wrap gap-1">
        {#each VALUES as v, i (i)}
          {@render cell(
            v,
            i === current
              ? "border-accent text-accent bg-blue-50"
              : i < done
                ? "border-line text-muted opacity-40"
                : "border-line text-ink",
          )}
          {#if i === PAGE - 1}<span class="w-2"></span>{/if}
        {/each}
      </div>
    </div>

    <!-- dictionary -->
    <div class="flex gap-3">
      {@render row("dictionary")}
      <div class="flex flex-wrap gap-1">
        {#each DICT.slice(0, dictSize) as d, i (d)}
          {@const hit = current >= 0 && CODES[current] === i}
          {@const added = hit && firstSeen(current)}
          <span
            class="dict-entry inline-flex h-7 items-center gap-1.5 rounded-xs border px-1.5 font-mono text-[11px] transition-colors duration-300
              {added ? 'border-accent bg-blue-100 text-accent' : hit ? 'border-accent text-accent' : 'border-line text-ink'}"
          >
            <span class="text-muted">{i}</span>{d}
          </span>
        {/each}
        {#if current >= 0}
          <span class="self-center pl-1 font-mono text-[11px] text-accent">
            {firstSeen(current) ? `${VALUES[current]}: new → ${CODES[current]}` : `${VALUES[current]}: hit → ${CODES[current]}`}
          </span>
        {/if}
      </div>
    </div>

    <!-- page buffer -->
    <div class="flex gap-3">
      {@render row("page buffer")}
      <div class="flex flex-wrap items-center gap-1">
        {#each buffer as c, i (i)}
          <span class="code-in">{@render cell(String(c), "border-blue-200 bg-blue-50 text-ink")}</span>
        {/each}
        {#each Array(PAGE - buffer.length) as _, i (i)}
          {@render cell("", "border-dashed border-line")}
        {/each}
        <span class="pl-1 font-mono text-[11px] text-muted"
          >{buffer.length}/{PAGE} · int32 each · {buffer.length} × 4 B = {buffer.length * 4} B</span
        >
      </div>
    </div>

    <!-- encoder: only busy at flush time -->
    <div class="flex gap-3">
      {@render row("encoder")}
      <div class="min-h-16 flex-1 font-mono text-[11px] leading-relaxed">
        {#if step === S.Width}
          {@const p = PAGES[0]}
          <div>dictionary has {dictSize} entries → largest index {dictSize - 1} = 0b{(dictSize - 1).toString(2)}</div>
          <div class="text-accent">bit width = {p.bw} bits per code</div>
          <div class="text-muted">the other {32 - p.bw} bits of every int32 in the buffer are always 0</div>
        {:else if step === S.Pack}
          {@const p = PAGES[0]}
          <div class="text-muted">int32 → int{p.bw}: same values, {p.bw} bits each</div>
          <div class="mt-1.5 flex items-center gap-2">
            <span class="flex">
              {#each p.codes as c, i (i)}
                <span class="flex flex-col items-center border-y border-l border-blue-200 bg-blue-50 px-1 last:border-r">
                  <span class="text-[9px] text-muted">{c}</span>
                  {c.toString(2).padStart(p.bw, "0")}
                </span>
              {/each}
            </span>
            <span class="text-muted">{p.codes.length * p.bw} bits = <span class="text-accent">{(p.codes.length * p.bw) / 8} B</span> (was 32 B)</span>
          </div>
        {:else if step === S.Rle}
          {@const p = PAGES[1]}
          <div class="text-muted">{p.codes.length} × the same code → store it once</div>
          <div class="mt-1.5 flex items-center gap-2">
            <span class="flex gap-px">
              {#each p.codes as c, i (i)}
                {@render cell(String(c), "border-blue-200 bg-blue-50 text-ink")}
              {/each}
            </span>
            <span class="text-muted">→</span>
            {@render cell(`${p.codes.length} × ${p.codes[0]}`, "border-accent bg-blue-50 text-accent")}
          </div>
        {:else}
          <span class="text-muted">waiting for a full page</span>
        {/if}
      </div>
    </div>

    <!-- pages held in memory -->
    <div class="flex gap-3">
      {@render row("in memory")}
      <div class="flex flex-wrap gap-1">
        {#each held as p (p)}
          {@render cell(`page ${p} · ${pageDesc(p)}`, "border-line text-ink")}
        {:else}
          <span class="pt-1.5 font-mono text-[11px] text-muted">empty: pages wait here for the row group</span>
        {/each}
      </div>
    </div>

    <!-- column chunk on disk -->
    <div class="flex gap-3">
      {@render row("on disk")}
      <div class="flex flex-1 flex-col gap-1.5">
        {#if step === S.Close}
          <div class="flex flex-wrap gap-1">
            {@render cell(`dictionary page · ${DICT.join(" ")} · ${DICT_BYTES} B`, "border-accent bg-blue-50 text-accent")}
            {#each PAGES as p, i (i)}
              {@render cell(`data page ${i} · ${pageDesc(i)}`, "border-line text-ink")}
            {/each}
          </div>
          <span class="font-mono text-[11px] text-muted">
            {VALUES.length} strings: {PLAIN_BYTES} B plain → {ENCODED_BYTES} B encoded (not counting page headers)
          </span>
        {:else}
          <span class="pt-1.5 font-mono text-[11px] text-muted">nothing until the row group flushes (~128 MB)</span>
        {/if}
      </div>
    </div>
  </div>
</figure>

<style>
  .caption {
    animation: caption-in 400ms ease-out;
  }
  .code-in {
    animation: caption-in 250ms ease-out;
  }
  @keyframes caption-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .caption,
    .code-in {
      animation: none;
    }
  }
</style>
