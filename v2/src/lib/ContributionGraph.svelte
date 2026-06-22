<script lang="ts">
  import { onMount } from "svelte";
  import { Text } from "./primitives";
  import { audioViz } from "./audioStore.svelte";

  type Day = { date: string; contributionCount: number; weekday: number };
  type Week = { contributionDays: Day[] };
  type Calendar = { totalContributions: number; weeks: Week[] };

  let data = $state<Calendar | null>(null);
  let failed = $state(false);

  onMount(async () => {
    try {
      const res = await fetch("/api/contributions");
      if (!res.ok) throw new Error(String(res.status));
      data = (await res.json()) as Calendar;
    } catch {
      failed = true;
    }
  });

  const max = $derived(
    data
      ? Math.max(
          1,
          ...data.weeks.flatMap((w) =>
            w.contributionDays.map((d) => d.contributionCount),
          ),
        )
      : 1,
  );

  // 0 = no contributions; 1..4 = increasing intensity (quartiles of `max`).
  function level(count: number): number {
    if (count <= 0) return 0;
    const r = count / max;
    if (r <= 0.25) return 1;
    if (r <= 0.5) return 2;
    if (r <= 0.75) return 3;
    return 4;
  }

  const LEVELS = [
    "bg-line",
    "bg-accent/30",
    "bg-accent/55",
    "bg-accent/80",
    "bg-accent",
  ];

  const year = $derived(
    data?.weeks.at(-1)?.contributionDays.at(-1)?.date.slice(0, 4) ?? "",
  );

  const columns = $derived(
    data?.weeks.map((w) => {
      const col: (Day | null)[] = Array(7).fill(null);
      for (const d of w.contributionDays) col[d.weekday] = d;
      return col;
    }) ?? [],
  );

  const prefersReduced =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

  // Rave flicker: on each beat of a rave track, splash a small fraction of the
  // squares with random palette colours, then restore — the same tasteful pulse
  // the page's words do (see WordsFx.pulse).
  const RAVE = [
    "#ff2d95",
    "#00e5ff",
    "#7cff00",
    "#ffe600",
    "#ff5e00",
    "#2200ff",
  ];

  let cellColors = $state<Record<number, string>>({});
  let clearTimer: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    const seq = audioViz.seq; // tracked → re-runs once per beat
    const total = columns.length * 7;
    if (
      prefersReduced ||
      !audioViz.playing ||
      !audioViz.rave ||
      !seq ||
      !total
    ) {
      if (Object.keys(cellColors).length) cellColors = {};
      return;
    }
    // Scale the splash with how hard the beat hits — quiet beats flip a few
    // squares, loud drops light up a big chunk of the grid.
    const count = Math.ceil(total * (0.03 + audioViz.intensity * 0.32));
    const next: Record<number, string> = {};
    for (let k = 0; k < count; k++) {
      next[(Math.random() * total) | 0] =
        RAVE[(Math.random() * RAVE.length) | 0];
    }
    cellColors = next;
    if (clearTimer) clearTimeout(clearTimer);
    clearTimer = setTimeout(() => (cellColors = {}), 200);
  });

  // Clear the restore timer on unmount.
  $effect(() => () => {
    if (clearTimer) clearTimeout(clearTimer);
  });

  const cellStyle = (w: number, wd: number): string => {
    const c = cellColors[w * 7 + wd];
    return c ? `background-color: ${c};` : "";
  };

  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const ordinal = (n: number) => {
    const t = n % 100;
    if (t >= 11 && t <= 13) return "th";
    return ["th", "st", "nd", "rd"][n % 10] ?? "th";
  };
  function label(day: Day): string {
    // Parse the parts directly so the date never shifts across timezones.
    const [, m, d] = day.date.split("-").map(Number);
    const n = day.contributionCount;
    const count =
      n === 0 ? "No contributions" : `${n} contribution${n === 1 ? "" : "s"}`;
    return `${count} on ${MONTHS[m - 1]} ${d}${ordinal(d)}.`;
  }

  let wrap = $state<HTMLDivElement | null>(null);
  let tip = $state<{ text: string; x: number; y: number } | null>(null);

  function showTip(e: MouseEvent, day: Day) {
    if (!wrap || day.contributionCount === 0) return; // no tooltip for empty days
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    const text = label(day);
    // Clamp the centred tooltip so it never spills past the graph's edges
    // (width estimated from the mono text + horizontal padding).
    const half = (text.length * 7.2 + 16) / 2;
    const center = r.left - w.left + r.width / 2;
    tip = {
      text,
      x: Math.max(half + 2, Math.min(center, w.width - half - 2)),
      y: r.top - w.top,
    };
  }
  const hideTip = () => (tip = null);

  // Touch: tap a square shows its tooltip; tapping anywhere off a square
  // dismisses it, since touch has no hover/mouseleave.
  $effect(() => {
    const onDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest("[data-cell]")) hideTip();
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  });
</script>

{#if data}
  <div class="flex flex-col gap-2">
    <div class="flex items-baseline justify-between">
      <Text type="label" size="xs" color="muted">contributions</Text>
      <Text type="label" size="xs" color="muted">
        {data.totalContributions} in {year}
      </Text>
    </div>

    <div bind:this={wrap} class="relative">
      <div class="overflow-x-auto" onscroll={hideTip}>
        <div class="flex w-max gap-[3px]">
          {#each columns as col, w (w)}
            <div class="flex flex-col gap-[3px]">
              {#each col as day, wd (wd)}
                {#if day}
                  <div
                    data-cell
                    role="gridcell"
                    tabindex="-1"
                    class="h-2.5 w-2.5 rounded-[2px] transition-colors duration-75 {LEVELS[
                      level(day.contributionCount)
                    ]}"
                    style={cellStyle(w, wd)}
                    onmouseenter={(e) => showTip(e, day)}
                    onmouseleave={hideTip}
                    onclick={(e) => showTip(e, day)}
                  ></div>
                {:else}
                  <div class="h-2.5 w-2.5 rounded-[2px]"></div>
                {/if}
              {/each}
            </div>
          {/each}
        </div>
      </div>

      {#if tip}
        <div
          class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-ink px-2 py-1 font-mono text-xs whitespace-nowrap text-paper"
          style="left: {tip.x}px; top: {tip.y - 6}px;"
        >
          {tip.text}
        </div>
      {/if}
    </div>

    <div class="flex items-center justify-end gap-1">
      <Text type="label" size="xs" color="muted">less</Text>
      {#each LEVELS as c (c)}
        <div class="h-2.5 w-2.5 rounded-[2px] {c}"></div>
      {/each}
      <Text type="label" size="xs" color="muted">more</Text>
    </div>
  </div>
{:else if failed}
  <Text type="paragraph" size="xs" color="muted">
    couldn't load contributions
  </Text>
{/if}
