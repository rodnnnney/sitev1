<script lang="ts">
  import { Text, Page } from "./primitives";
  import { triggerShake } from "./shake";
  import { debugStore } from "./debugStore";

  let shakeAmp = $state(14); // shake amplitude in px
</script>

<Page title="rodney shen" showTime>
  <Text size="sm" color="black"
    >Hey there, I'm Rodney, I'm originally from <span class="text-accent"
      >Chengdu/Ottawa</span
    >
    and now based out of <span class="text-accent">NYC</span>. Currently, I'm
    putting school on pause (sorry mom) to maximize shareholder value at <span class="text-accent">TextQL</span>.<br
    /><br />

    Previously, I went deep into the crypto rabbit hole, internted at a few cool
    startups, founded the blockchain club at my school and even spoke at
    Consensus HK 2025.
  </Text>

  {#if $debugStore}
    <div class="flex items-center gap-3 font-mono text-xs text-muted">
      <button
        onclick={() => triggerShake(shakeAmp)}
        class="transition-colors hover:text-accent"
      >
        shake
      </button>
      <input
        type="range"
        min="2"
        max="48"
        bind:value={shakeAmp}
        class="h-1 w-32 cursor-pointer accent-accent"
        aria-label="shake intensity"
      />
      <span class="tabular-nums">{shakeAmp}</span>
    </div>
  {/if}
</Page>
