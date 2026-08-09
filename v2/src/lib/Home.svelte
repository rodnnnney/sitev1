<script module lang="ts">
  let cachedPush = "";
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { ArrowUpRight } from "lucide-svelte";
  import { Text, Page, Button, HoverPreview } from "./primitives";
  import { triggerShake } from "./shake";
  import { debugStore } from "./debugStore";
  import { requestBangerPlay } from "./bangerTrigger";
  import ContributionGraph from "./ContributionGraph.svelte";

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
  <Text size="sm" color="black"
    >I'm Rodney. I was born in
    <HoverPreview
      title="Chengdu"
      description="Where I was born — Sichuan, spicy food, and the start of the story."
      >Chengdu</HoverPreview
    >, moved to
    <HoverPreview
      title="Ottawa"
      description="Moved here at 4. Quieter pace, cold winters, the place that raised me."
      >Ottawa</HoverPreview
    >
    when I was 4, and now based out of
    <HoverPreview
      title="NYC"
      description="Current base. High-pace city — more possessions per game, for better or worse."
      >NYC</HoverPreview
    >. Currently, I'm taking some
    <HoverPreview
      title="Gap year"
      description="School on pause so I can ship infra and data work at a startup."
      >time off</HoverPreview
    >
    school to work on messy infra and data problems at
    <HoverPreview
      title="TextQL"
      description="The startup I work at — messy infra and data problems, every day."
      href="https://textql.com"
      >TextQL</HoverPreview
    >.<br /><br />

    Previously, I was fascinated by crypto, I interned at a few crypto startups
    working on decentralized physical infrastructure and stablecoins. I founded
    the blockchain club at my school and even spoke at
    <HoverPreview
      title="Consensus Hong Kong 2025"
      description="Spoke there with the blockchain club I founded at school."
      href="https://consensus.coindesk.com/"
      >Consensus HK 2025</HoverPreview
    >.
  </Text>

  <Text size="sm" color="black" links data-no-rave>
    Stick around, let me
    <HoverPreview
      title="A song"
      description="Picks a random track from my playlist and plays it."
      onclick={requestBangerPlay}
      >play you a song</HoverPreview
    >.
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
