<script module lang="ts">
  let cachedPush = "";
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { ArrowUpRight } from "lucide-svelte";
  import { Text, Page, Button } from "./primitives";
  import { triggerShake } from "./shake";
  import { debugStore } from "./debugStore";
  import { bangerNow, requestBangerPlay } from "./bangerTrigger";
  import Landscapes from "./Landscapes.svelte";

  let shakeAmp = $state(14);

  const LINKS = [
    { label: "x (twitter)", href: "https://x.com/992rodney" },
    { label: "github", href: "https://github.com/rodnnnney" },
    { label: "email", href: "mailto:rodneyshenn@gmail.com" },
  ];

  let lastPushed = $state(cachedPush);
  onMount(async () => {
    if (lastPushed) return;
    try {
      const res = await fetch("https://api.github.com/repos/rodnnnney/sitev1");
      if (!res.ok) return;
      const { pushed_at } = (await res.json()) as { pushed_at: string };
      const [y, m, d] = pushed_at.slice(0, 10).split("-");
      lastPushed = cachedPush = `${d}/${m}/${y.slice(2)}`;
    } catch {}
  });
</script>

<Page title="rodney shen" showTime>
  <Text size="sm" color="black" links
    >I'm an engineer in NYC, taking some time off school to work at TextQL. I'm
    interested in <span class="text-accent">big data</span> and
    <span class="text-accent">efficient compute allocation</span>. Before that I
    worked with stablecoins.

    <br /><br />

    I've lived in Ottawa, Toronto, and Chengdu. I
    <a href="/likes" class="text-accent">like</a> to run, read, and cook.
  </Text>

  <Landscapes />

  {#if $bangerNow}
    <Text size="sm" color="black" data-no-rave>
      Now playing:
      <span class="text-accent">{$bangerNow.title}</span> by {$bangerNow.artist}
    </Text>
  {:else}
    <Text size="sm" color="black" links data-no-rave>
      <button type="button" class="text-accent" onclick={requestBangerPlay}
        >Play a song</button
      >.
    </Text>
  {/if}

  <div class="flex items-end justify-between">
    <Text type="paragraph" size="xs" color="black" links class="leading-none">
      {#each LINKS as l, i (l.href)}
        {#if i > 0}/{/if}
        <a
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          class="whitespace-nowrap"
          >{l.label}<ArrowUpRight
            size={11}
            class="ml-0.5 inline align-middle"
          /></a
        >
      {/each}
    </Text>
    {#if lastPushed}
      <div class="flex flex-col items-end gap-0.5 text-right">
        <Text type="label" size="xs" color="black">last updated</Text>
        <Text type="label" size="xs" color="black">{lastPushed}</Text>
      </div>
    {/if}
  </div>

  {#if $debugStore}
    <div class="flex items-center gap-3 font-mono text-xs text-muted">
      <Button variant="ghost" size="sm" onclick={() => triggerShake(shakeAmp)}>
        shake
      </Button>
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
