<script module lang="ts">
  const TIME_FMT = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import CopyLink from "../../blog/CopyLink.svelte";
  import { Text, type TextSize } from "../Text";
  import { deviceType } from "../../deviceStore";
  import { getRouteCrumbs, type RouteCrumb } from "../../utils";

  let {
    title,
    label,
    lead,
    titleSize = "xl",
    contentClass = "flex flex-col gap-8",
    showTime = false,
    children,
  }: {
    title: string;
    label?: string;
    lead?: string;
    titleSize?: TextSize;
    contentClass?: string;
    showTime?: boolean;
    children?: Snippet;
  } = $props();

  let currentPath = $state(window.location.pathname);

  $effect(() => {
    const onPop = () => (currentPath = window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  });

  const crumbs = $derived<RouteCrumb[]>(
    label ? [{ label, href: null }] : getRouteCrumbs(currentPath),
  );

  // Parent crumb for nested routes (e.g. back to /writing from a post).
  const backHref = $derived(crumbs.findLast((c) => c.href)?.href ?? null);

  let timeString = $state("");

  const updateTime = () => {
    const parts = TIME_FMT.formatToParts(new Date());
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? "";
    timeString = `${part("hour")}:${part("minute")}:${part("second")} ${part("timeZoneName")}`;
  };

  onMount(() => {
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  });
</script>

<main
  class="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-12 {$deviceType ===
  'mobile'
    ? 'px-4 pt-12 pb-28'
    : 'px-6 py-20'}"
>
  <header class="flex flex-col">
    {#if backHref}
      <a
        href={backHref}
        class="mb-6 w-fit font-mono text-xs text-muted transition-colors hover:text-ink"
      >
        ← back
      </a>
    {/if}
    <div class="flex items-baseline justify-between gap-3">
      {#if crumbs.length > 0}
        <Text type="label" size="xs" color="muted" class="leading-none">
          <span class="inline-flex items-baseline gap-1.5">
            {#each crumbs as crumb, i (crumb.label + (crumb.href ?? ""))}
              {#if i > 0}<span class="tracking-normal">/</span>{/if}
              {#if crumb.href}
                <a
                  href={crumb.href}
                  class="transition-colors hover:text-ink"
                >{crumb.label}</a
                >
              {:else}
                <span>{crumb.label}</span>
              {/if}
            {/each}
          </span>
        </Text>
      {:else}
        <span></span>
      {/if}
      {#if showTime}
        <Text type="label" size="xs" color="muted" class="leading-none"
          >New York City, NY</Text
        >
      {/if}
    </div>
    <div class="flex flex-row items-baseline justify-between gap-2">
      <Text
        type="heading"
        size={titleSize}
        color="black"
        animate
        animateOnHover
        class="leading-tight"
      >
        {title}
      </Text>
      {#if showTime}
        <Text
          type="label"
          size="xs"
          color="muted"
          animate
          duration={200}
          class="shrink-0"
        >
          {timeString}
        </Text>
      {/if}
    </div>
    {#if lead}
      <Text type="paragraph" size="sm" color="muted" class="mt-2">{lead}</Text>
    {/if}
  </header>

  <div class={contentClass}>
    {@render children?.()}
  </div>

  {#if backHref}
    <div class="mt-12 flex justify-end">
      <CopyLink />
    </div>
  {/if}
</main>
