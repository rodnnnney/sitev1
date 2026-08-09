<script lang="ts">
  import type { Snippet } from "svelte";
  import { onDestroy, tick } from "svelte";
  import { cubicOut } from "svelte/easing";
  import { scale } from "svelte/transition";

  type Side = "top" | "bottom" | "left" | "right";

  let {
    content,
    delay = 1500,
    /** Preferred side; `auto` picks the roomiest fit and stays in the viewport. */
    side = "auto",
    children,
  }: {
    content: string;
    delay?: number;
    side?: Side | "auto";
    children: Snippet;
  } = $props();

  let open = $state(false);
  let placed: Side = $state("top");
  let left = $state(0);
  let top = $state(0);
  let root: HTMLSpanElement | null = $state(null);
  let tipEl: HTMLSpanElement | null = $state(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const tipId = `tip-${Math.random().toString(36).slice(2, 9)}`;
  const GAP = 6;
  const PAD = 8;

  onDestroy(() => clearTimeout(timer));

  /** Render tips under <body> so overflow/stacking parents can't clip them. */
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  function coordsFor(side: Side, r: DOMRect, tw: number, th: number) {
    switch (side) {
      case "top":
        return { left: r.left + r.width / 2 - tw / 2, top: r.top - GAP - th };
      case "bottom":
        return { left: r.left + r.width / 2 - tw / 2, top: r.bottom + GAP };
      case "left":
        return { left: r.left - GAP - tw, top: r.top + r.height / 2 - th / 2 };
      case "right":
        return { left: r.right + GAP, top: r.top + r.height / 2 - th / 2 };
    }
  }

  function overflow(side: Side, r: DOMRect, tw: number, th: number) {
    const { left: x, top: y } = coordsFor(side, r, tw, th);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return (
      Math.max(0, PAD - x) +
      Math.max(0, x + tw + PAD - vw) +
      Math.max(0, PAD - y) +
      Math.max(0, y + th + PAD - vh)
    );
  }

  function clamp(x: number, y: number, tw: number, th: number) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      left: Math.min(Math.max(PAD, x), Math.max(PAD, vw - tw - PAD)),
      top: Math.min(Math.max(PAD, y), Math.max(PAD, vh - th - PAD)),
    };
  }

  function pickSide(r: DOMRect, tw: number, th: number): Side {
    if (side !== "auto") return side;
    const order: Side[] = ["top", "bottom", "right", "left"];
    let best: Side = "top";
    let bestScore = Infinity;
    for (const s of order) {
      const score = overflow(s, r, tw, th);
      if (score < bestScore) {
        bestScore = score;
        best = s;
        if (score === 0) break;
      }
    }
    return best;
  }

  function place(tw = 140, th = 28) {
    if (!root) return;
    const r = root.getBoundingClientRect();
    placed = pickSide(r, tw, th);
    const raw = coordsFor(placed, r, tw, th);
    const next = clamp(raw.left, raw.top, tw, th);
    left = next.left;
    top = next.top;
  }

  async function refine() {
    await tick();
    if (!tipEl || !root) return;
    // offset* ignores the intro scale transform so we place against true size.
    place(tipEl.offsetWidth || 140, tipEl.offsetHeight || 28);
  }

  function scheduleOpen() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      place();
      open = true;
      refine();
    }, delay);
  }

  function scheduleClose() {
    clearTimeout(timer);
    open = false;
  }

  const origin = $derived(
    placed === "top"
      ? "bottom center"
      : placed === "bottom"
        ? "top center"
        : placed === "left"
          ? "center right"
          : "center left",
  );
</script>

<span
  role="group"
  class="relative inline"
  bind:this={root}
  aria-describedby={open ? tipId : undefined}
  onmouseenter={scheduleOpen}
  onmouseleave={scheduleClose}
  onfocusin={scheduleOpen}
  onfocusout={scheduleClose}
>
  {@render children()}
</span>

{#if open && content}
  <span
    use:portal
    class="pointer-events-none fixed z-[9999]"
    style="left: {left}px; top: {top}px;"
  >
    <span
      bind:this={tipEl}
      id={tipId}
      role="tooltip"
      data-no-rave
      transition:scale={{
        duration: 90,
        start: 0.92,
        opacity: 0,
        easing: cubicOut,
      }}
      class="block w-max max-w-56 rounded-sm border border-line bg-paper px-2 py-1 font-mono text-[11px] leading-snug text-ink shadow-sm"
      style="transform-origin: {origin};"
    >
      {content}
    </span>
  </span>
{/if}
