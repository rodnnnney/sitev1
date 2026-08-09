<script lang="ts">
  import type { Snippet } from "svelte";
  import { onDestroy } from "svelte";
  import { fade } from "svelte/transition";

  let {
    title,
    description,
    href,
    onclick,
    children,
  }: {
    title: string;
    description: string;
    href?: string;
    onclick?: () => void;
    children: Snippet;
  } = $props();

  let open = $state(false);
  let showBelow = $state(false);
  let root: HTMLSpanElement | null = $state(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  onDestroy(() => {
    clearTimeout(timer);
  });

  /** Touch devices synthesize sticky hover/focus; only tip on fine pointers. */
  function canHover() {
    return window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;
  }

  function scheduleOpen() {
    if (!canHover()) return;
    clearTimeout(timer);
    if (root) {
      const rect = root.getBoundingClientRect();
      showBelow = rect.top < 120;
    }
    timer = setTimeout(() => {
      open = true;
    }, 200);
  }

  function scheduleClose() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      open = false;
    }, 100);
  }
</script>

<span
  role="group"
  class="relative inline"
  bind:this={root}
  onmouseenter={scheduleOpen}
  onmouseleave={scheduleClose}
  onfocusin={scheduleOpen}
  onfocusout={scheduleClose}
>
  {#if href}
    <a
      {href}
      target="_blank"
      rel="noopener noreferrer"
      class="text-accent"
    >
      {@render children()}
    </a>
  {:else if onclick}
    <button type="button" class="text-accent" {onclick}>
      {@render children()}
    </button>
  {:else}
    <span class="text-accent">
      {@render children()}
    </span>
  {/if}

  {#if open}
    <span
      role="tooltip"
      data-no-rave
      transition:fade={{ duration: 120 }}
      class="pointer-events-none absolute left-1/2 z-50 w-max max-w-64 -translate-x-1/2 rounded-sm border border-line bg-paper px-2.5 py-2 font-mono text-xs shadow-sm {showBelow
        ? 'top-full mt-2'
        : 'bottom-full mb-2'}"
    >
      <span class="block text-ink">{title}</span>
      <span class="mt-1 block leading-snug text-muted">{description}</span>
    </span>
  {/if}
</span>
