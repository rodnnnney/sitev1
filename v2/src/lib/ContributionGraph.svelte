<script lang="ts">
  import { onMount } from "svelte";
  import { Text } from "./primitives";

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

  // Busiest day in the range, so intensity scales to this account's activity.
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

  // Accent ramp; index 0 (empty days) uses the hairline colour.
  const LEVELS = [
    "bg-line",
    "bg-accent/30",
    "bg-accent/55",
    "bg-accent/80",
    "bg-accent",
  ];

  // One column per week, padded to 7 rows so partial first/last weeks align
  // (null = a weekday outside the range, rendered transparent).
  const columns = $derived(
    data?.weeks.map((w) => {
      const col: (Day | null)[] = Array(7).fill(null);
      for (const d of w.contributionDays) col[d.weekday] = d;
      return col;
    }) ?? [],
  );
</script>

{#if data}
  <div class="flex flex-col gap-2">
    <div class="flex items-baseline justify-between">
      <Text type="label" size="xs" color="muted">contributions</Text>
      <Text type="label" size="xs" color="muted">
        {data.totalContributions} in the last year
      </Text>
    </div>

    <!-- Scrolls within itself on narrow screens; the page never scrolls x. -->
    <div class="overflow-x-auto">
      <div class="flex w-max gap-[3px]">
        {#each columns as col, w (w)}
          <div class="flex flex-col gap-[3px]">
            {#each col as day, wd (wd)}
              <div
                class="h-2.5 w-2.5 rounded-[2px] {day
                  ? LEVELS[level(day.contributionCount)]
                  : ''}"
                title={day
                  ? `${day.contributionCount} on ${day.date}`
                  : undefined}
              ></div>
            {/each}
          </div>
        {/each}
      </div>
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
