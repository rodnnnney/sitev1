<script lang="ts">
  import { Pause, Play, RotateCcw } from "lucide-svelte";
  import type { StepClock } from "./clock.svelte";

  let { clock, labels }: { clock: StepClock; labels: string[] } = $props();
</script>

<div class="flex items-center gap-3">
  <button
    type="button"
    onclick={clock.toggle}
    class="flex size-7 shrink-0 items-center justify-center rounded-sm border border-line text-ink transition-colors hover:border-accent hover:text-accent"
    aria-label={clock.playing ? "Pause animation" : "Play animation"}
  >
    {#if clock.playing}<Pause class="size-3.5" />{:else}<Play class="size-3.5" />{/if}
  </button>

  <div class="flex flex-1 gap-1">
    {#each labels as label, i (label)}
      <!-- Tall hit area around a thin bar; clicking stops on that step. -->
      <button
        type="button"
        onclick={() => clock.jump(i, true)}
        class="group relative flex-1 cursor-pointer py-2.5"
        aria-label="Go to step {i + 1}: {label}"
      >
        <span class="block h-1 overflow-hidden rounded-xs bg-line transition-colors group-hover:bg-blue-200">
          <span class="block h-full bg-accent" style="width: {clock.fill(i) * 100}%"></span>
        </span>
        <span
          class="pointer-events-none absolute bottom-full left-1/2 z-10 -translate-x-1/2 rounded-xs bg-ink px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-paper opacity-0 transition-opacity group-hover:opacity-100"
        >
          {label}
        </span>
      </button>
    {/each}
  </div>

  <button
    type="button"
    onclick={clock.restart}
    class="flex size-7 shrink-0 items-center justify-center rounded-sm text-muted transition-colors hover:text-accent"
    aria-label="Restart animation"
  >
    <RotateCcw class="size-3.5" />
  </button>
</div>
