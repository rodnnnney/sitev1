<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { Text, type TextSize } from "../Text";
  import { deviceType } from "../../deviceStore";
  import { getRouteLabel } from "../../utils";

  let {
    title,
    label,
    lead,
    titleSize = "lg",
    contentClass = "flex flex-col gap-8",
    showTime = false,
    children,
  }: {
    title: string;
    /** Override the dynamic route label shown above the title. */
    label?: string;
    lead?: string;
    /** Title is capped at a restrained size by default for consistency. */
    titleSize?: TextSize;
    /** Override the spacing of the content area per page. */
    contentClass?: string;
    /** Show the current Eastern Time in military format next to the title. */
    showTime?: boolean;
    children?: Snippet;
  } = $props();

  let currentPath = $state(window.location.pathname);

  $effect(() => {
    const onPop = () => (currentPath = window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  });

  const derivedLabel = $derived(label ?? getRouteLabel(currentPath));

  let timeString = $state("");

  const updateTime = () => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).formatToParts(new Date());
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
    ? 'px-4 py-12'
    : 'px-6 py-20'}"
>
  <!-- Title block — same position on every page -->
  <header class="flex flex-col">
    {#if derivedLabel}
      <Text type="label" size="xs" color="muted" class="leading-none"
        >{derivedLabel}</Text
      >
    {/if}
    <div
      class="flex justify-between gap-1 {$deviceType === 'mobile'
        ? 'flex-col items-start'
        : 'flex-row items-end'}"
    >
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
        <div class="flex items-end gap-1">
          <Text type="label" size="xs" color="muted" animate duration={200}>
            {timeString}
          </Text>
        </div>
      {/if}
    </div>
    {#if lead}
      <Text type="paragraph" size="sm" color="muted" class="mt-2">{lead}</Text>
    {/if}
  </header>

  <div class={contentClass}>
    {@render children?.()}
  </div>
</main>
