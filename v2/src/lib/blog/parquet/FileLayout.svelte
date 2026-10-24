<script lang="ts">
  import { reduceMotion } from "../../effects/shared";
  import { Text } from "../../primitives";
  import { StepClock } from "./clock.svelte";
  import StepControls from "./StepControls.svelte";
  import {
    COLS,
    ELEMENTS,
    GROUPS,
    OFFSETS,
    ROWS,
    STAGE_COUNT,
    Stage,
    cityCode,
    frames,
    type El,
  } from "./layout";

  const STEPS = [
    {
      title: "a table",
      ms: 3000,
      body: "Eight rows, three columns. This is how you picture the data.",
    },
    {
      title: "as a csv",
      ms: 5500,
      body: "On disk a file is one long run of bytes. CSV writes it row by row, so every temp is wedged between a city and a description. Reading one column means reading all of them.",
    },
    {
      title: "row groups",
      ms: 4000,
      body: "Parquet first cuts the rows into row groups. Real files use ~128 MB each; here it's 4 rows.",
    },
    {
      title: "column chunks",
      ms: 5500,
      body: "Inside each row group, each column is written in one contiguous run: a column chunk. Values of the same type sit next to each other, which is what makes them compress so well.",
    },
    {
      title: "pages",
      ms: 6000,
      body: "Chunks are split into pages (~1 MB), each with a small header. city also gets a dictionary page: each distinct name stored once, so the data only holds small codes.",
    },
    {
      title: "the footer",
      ms: 6600,
      body: "Last comes the footer: the schema plus the byte offset of every chunk. It goes at the end because offsets are only known once the data is written. Then its length, and PAR1 again.",
    },
    {
      title: "reading one column",
      ms: 6000,
      body: "To get avg(temp), a reader fetches the last 8 bytes (1), then the footer (2), then jumps straight to the two temp chunks (3). Everything else is never touched.",
    },
  ];
  const PTR_MS = 1000; // footer stage: time spent on each chunk pointer

  const instant = reduceMotion();
  const clock = new StepClock(STEPS.map((s) => s.ms));

  let W = $state(0);
  const stage = $derived(clock.step as Stage);
  const into = $derived(clock.into);
  const all = $derived(W > 0 ? frames(W) : []);
  const frame = $derived(all[stage]);

  const ptr = $derived(stage === Stage.Footer ? Math.floor(into / PTR_MS) % (GROUPS.length * COLS.length) : -1);
  const ptrG = $derived(Math.floor(ptr / COLS.length));
  const ptrCol = $derived(COLS[ptr % COLS.length]);

  function lit(el: El): boolean {
    if (ptr < 0) return false;
    if (el.kind === "ptr") return el.g === ptrG && el.col === ptrCol;
    return (
      (el.kind === "cell" || el.kind === "header" || el.kind === "dict" || el.kind === "chunkBox") &&
      el.g === ptrG &&
      el.col === ptrCol
    );
  }

  function label(el: El): string {
    switch (el.kind) {
      case "cell": {
        const row = ROWS[el.r!];
        if (el.col === "description") return row.description;
        if (el.col === "temp") return row.temp.toFixed(1);
        return stage >= Stage.Pages ? String(cityCode(el.r!)) : row.city;
      }
      case "colLabel":
        return el.col!;
      case "rgLabel": {
        const rows = GROUPS[el.g!];
        return `row group ${el.g} · rows ${rows[0]}–${rows[rows.length - 1]}`;
      }
      case "magic":
        return "PAR1";
      case "len":
        return "len";
      case "header":
        return "h";
      case "dict":
        return "dict";
      case "footer":
        return stage >= Stage.Footer ? "" : "footer";
      case "schema":
        return "schema  city:string  temp:float  description:string";
      case "ptr":
        return `rg${el.g} ${el.col} @${OFFSETS[`${el.g}-${el.col}`]}`;
      case "badge":
        return String(el.n);
      case "rgBox":
        return "";
      case "chunkBox":
        return stage >= Stage.Chunks ? `${el.col} chunk` : "";
    }
  }

  // Light tints keep the three columns apart; strong blue is saved for highlights.
  const COL_STYLE: Record<string, string> = {
    city: "bg-blue-50 border-blue-100",
    temp: "bg-blue-100 border-blue-200",
    description: "bg-paper border-line",
  };

  function style(el: El): string {
    switch (el.kind) {
      case "cell":
        return `${COL_STYLE[el.col!]} border text-ink rounded-xs justify-center tabular-nums`;
      case "colLabel":
        return "justify-center text-muted";
      case "rgLabel":
        return "text-ink font-medium";
      case "magic":
      case "len":
      case "header":
        return "border border-line bg-paper text-muted rounded-xs justify-center";
      case "dict":
        return "border border-blue-100 bg-blue-50 text-ink rounded-xs justify-center";
      case "footer":
        return "border border-line bg-paper text-muted rounded-xs justify-center";
      case "schema":
        return "text-muted whitespace-nowrap overflow-hidden";
      case "ptr":
        return "border border-line bg-paper text-ink rounded-xs justify-center tabular-nums whitespace-nowrap";
      case "badge":
        return "bg-accent text-paper rounded-full justify-center text-[10px] font-medium z-[2]";
      case "rgBox":
        return "border border-line rounded-xs";
      case "chunkBox":
        return "bg-line/40 rounded-xs text-muted";
    }
  }

  const ms = (n: number) => (instant ? 0 : n);
</script>

<figure {@attach clock.observe} {@attach clock.run} class="flex flex-col gap-4 rounded-sm border border-line p-4">
  <StepControls {clock} labels={STEPS.map((s) => s.title)} />

  <div class="flex min-h-20 flex-col gap-1.5">
    <Text type="label" size="xs" color="accent">{stage + 1}/{STAGE_COUNT} · {STEPS[stage].title}</Text>
    {#key stage}
      <p class="caption font-mono text-sm leading-relaxed text-ink">{STEPS[stage].body}</p>
    {/key}
  </div>

  <!-- Decorative: the caption above says what each step shows. -->
  <div
    bind:clientWidth={W}
    aria-hidden="true"
    class="relative w-full"
    style="height: {frame?.height ?? 0}px; transition: height {ms(700)}ms cubic-bezier(.65,0,.35,1)"
  >
    {#if frame}
      {#each ELEMENTS as el, i (el.id)}
        {@const b = frame.boxes[el.id]}
        <div
          class="absolute flex overflow-hidden px-1 font-mono text-[11px] leading-none {el.kind === 'chunkBox' ? 'items-start pt-1' : 'items-center'} {style(
            el,
          )} {lit(el) ? 'outline-2 outline-offset-1 outline-accent' : ''}"
          style="left:{b.x}px; top:{b.y}px; width:{b.w}px; height:{b.h}px; opacity:{b.o};
            transition-property: left, top, width, height, opacity, background-color, color;
            transition-duration: {ms(700)}ms, {ms(700)}ms, {ms(700)}ms, {ms(700)}ms, {ms(400)}ms, 300ms, 300ms;
            transition-timing-function: cubic-bezier(.65,0,.35,1);
            transition-delay: {ms((i % 24) * 10)}ms;"
        >
          {label(el)}
        </div>
      {/each}
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
