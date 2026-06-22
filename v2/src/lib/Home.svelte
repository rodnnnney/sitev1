<script module lang="ts">
  // Cached across mounts so navigating away and back doesn't refetch the repo.
  let cachedPush = "";
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { ArrowUpRight } from "lucide-svelte";
  import { Text, Page, Button } from "./primitives";
  import { triggerShake } from "./shake";
  import { debugStore } from "./debugStore";
  import ContributionGraph from "./ContributionGraph.svelte";

  let shakeAmp = $state(14); // shake amplitude in px

  const LINKS = [
    { label: "x (twitter)", href: "https://x.com/992rodney" },
    { label: "github", href: "https://github.com/rodnnnney" },
    { label: "linkedin", href: "https://www.linkedin.com/in/rodneyshenn" },
  ];

  // Last push date of the site's repo (dd/mm/yy), cached across remounts.
  let lastPushed = $state(cachedPush);
  onMount(async () => {
    if (lastPushed) return;
    try {
      const res = await fetch("https://api.github.com/repos/rodnnnney/sitev1");
      if (!res.ok) return;
      const { pushed_at } = (await res.json()) as { pushed_at: string };
      // pushed_at is "YYYY-MM-DD…"; parse the parts directly (no timezone drift).
      const [y, m, d] = pushed_at.slice(0, 10).split("-");
      lastPushed = cachedPush = `${d}/${m}/${y.slice(2)}`;
    } catch {
      /* rate-limited or offline — just omit the timestamp */
    }
  });
</script>

<Page title="rodney shen" showTime>
  <Text size="sm" color="black"
    >Hey there, I'm Rodney, I'm originally from <span class="text-accent"
      >Chengdu/Ottawa</span
    >
    and now based out of <span class="text-accent">NYC</span>. Currently, I'm
    putting school on "pause" (sorry mom) to maximize shareholder value at
    <span class="text-accent">TextQL</span>.<br /><br />

    Previously, I went deep into the crypto rabbit hole, internted at a few cool
    startups, founded the blockchain club at my school and even spoke at
    <span class="text-accent">Consensus HK 2025</span>.
  </Text>

  <ContributionGraph />

  <div class="flex items-end justify-between">
    <Text type="paragraph" size="xs" color="black" links class="leading-none">
      {#each LINKS as l, i (l.href)}
        {#if i > 0}/{/if}
        <a
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-0.5"
          >{l.label}<ArrowUpRight size={11} /></a
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
