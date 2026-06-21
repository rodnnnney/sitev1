<script lang="ts">
  import type { Snippet } from "svelte";
  import { fade } from "svelte/transition";
  import type { LinkPreviewData } from "../../previewData";

  interface Props {
    href: string;
    preview: LinkPreviewData | undefined;
    children: Snippet;
  }

  let { href, preview, children }: Props = $props();

  let isHovered = $state(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let containerEl: HTMLElement | null = $state(null);
  let tooltipX = $state(0);
  let tooltipY = $state(0);
  let showBelow = $state(false);

  const DELAY = 200;
  const TOOLTIP_WIDTH = 320;
  const TOOLTIP_HEIGHT = 220;
  const PADDING = 16;

  function clearHoverTimeout() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function updatePosition() {
    if (!containerEl) return;
    const rect = containerEl.getBoundingClientRect();

    showBelow = rect.top < TOOLTIP_HEIGHT + PADDING;
    tooltipY = showBelow ? rect.bottom + PADDING : rect.top - PADDING;

    const viewportWidth = window.innerWidth;
    const centerX = rect.left + rect.width / 2;
    tooltipX = Math.max(
      PADDING,
      Math.min(
        viewportWidth - TOOLTIP_WIDTH - PADDING,
        centerX - TOOLTIP_WIDTH / 2
      )
    );
  }

  function handleEnter() {
    clearHoverTimeout();
    updatePosition();
    timeoutId = setTimeout(() => {
      isHovered = true;
    }, DELAY);
  }

  function handleLeave() {
    clearHoverTimeout();
    timeoutId = setTimeout(() => {
      isHovered = false;
    }, 100);
  }
</script>

<span
  bind:this={containerEl}
  class="relative inline-block"
  role="group"
  onmouseenter={handleEnter}
  onmouseleave={handleLeave}
>
  <a
    {href}
    target="_blank"
    rel="noopener noreferrer"
    class="text-accent animated-link"
  >
    {@render children()}
  </a>
  {#if isHovered && preview}
    <div
      transition:fade={{ duration: 150 }}
      class="fixed z-50 w-80 overflow-hidden rounded-lg border border-line bg-paper shadow-[0_4px_20px_-4px_rgba(10,10,10,0.12)]"
      style="left: {tooltipX}px; top: {tooltipY}px; transform: {showBelow
        ? 'translateY(0)'
        : 'translateY(-100%)'};"
      onmouseenter={handleEnter}
      onmouseleave={handleLeave}
      role="tooltip"
    >
      {#if preview.image}
        <img
          src={preview.image}
          alt={preview.title}
          class="h-28 w-full object-cover grayscale"
          onerror={(e) =>
            ((e.currentTarget as HTMLImageElement).style.display = "none")}
        />
      {/if}
      <div class="flex flex-col gap-1 p-3">
        <p class="font-mono text-sm font-medium text-ink">
          {preview.title}
        </p>
        <p class="font-mono text-xs leading-relaxed text-muted">
          {preview.description}
        </p>
      </div>
    </div>
  {/if}
</span>

<style>
  .animated-link {
    color: var(--color-accent);
    text-decoration: none;
    background-image: linear-gradient(var(--color-accent), var(--color-accent));
    background-position: 0% 100%;
    background-size: 0% 0.075em;
    background-repeat: no-repeat;
    transition: background-size 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .animated-link:hover {
    background-size: 100% 0.075em;
  }
</style>
