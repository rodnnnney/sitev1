<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { Text, type TextSize } from "../Text";
  import { deviceType } from "../../deviceStore";

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

  let dateString = $state("");
  let timeString = $state("");

  const updateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString("en-CA", {
      timeZone: "America/New_York",
    });
    const time = now.toLocaleTimeString("en-US", {
      timeZone: "America/New_York",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const zone = now
      .toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        timeZoneName: "short",
      })
      .split(" ")
      .pop();
    timeString = `${time} ${zone}`;
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
    {#if label}
      <Text type="label" size="xs" color="muted" class="leading-none"
        >{label}</Text
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
          <Text type="label" size="xs" color="muted">{dateString}</Text>
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
