<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    textSizeStyles,
    textColorStyles,
    textDefaultStyles,
    textTypeStyles,
    textTypeIsPixel,
    textHiddenMeasureStyles,
    SCRAMBLE_CHARS_PIXEL,
    SCRAMBLE_CHARS_FULL,
    type TextSize,
    type TextColor,
    type TextType,
  } from './text.css';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLParagraphElement> {
    size?: TextSize;
    color?: TextColor;
    children?: Snippet;
    type?: TextType;
    animate?: boolean;
    /** Trigger scramble animation when element enters viewport */
    animateOnView?: boolean;
    animateOnHover?: boolean;
    animationSpeed?: number;
    /** Total animation duration in ms - overrides animationSpeed to ensure consistent timing regardless of text length */
    duration?: number;
    cyclesPerChar?: number;
    hovered?: boolean;
    /** IntersectionObserver threshold for animateOnView (0-1) */
    viewThreshold?: number;
    /** Charset used while scrambling. Defaults to a pixel-safe set for heading/important, full set otherwise. */
    chars?: string;
  }

  let {
    size = 'md',
    color = 'black',
    children,
    class: className,
    type = 'paragraph',
    animate = false,
    animateOnView = false,
    animateOnHover = false,
    animationSpeed = 15,
    duration = 800,
    cyclesPerChar = 3,
    hovered = false,
    viewThreshold = 0.1,
    chars,
    ...rest
  }: Props = $props();

  const charset = $derived(
    chars ?? (textTypeIsPixel[type] ? SCRAMBLE_CHARS_PIXEL : SCRAMBLE_CHARS_FULL)
  );

  let intervalId: ReturnType<typeof setInterval> | undefined = undefined;
  let displayText = $state('');
  let isAnimating = $state(false);
  let hiddenEl: HTMLSpanElement | null = $state(null);
  let containerEl: HTMLParagraphElement | null = $state(null);
  let viewObserver: IntersectionObserver | null = null;

  const randomChar = () => charset[Math.floor(Math.random() * charset.length)];

  const getScrambledSuffix = (text: string, startIdx: number) => {
    let suffix = '';
    for (let i = startIdx; i < text.length; i++) {
      suffix += text[i] === ' ' ? ' ' : randomChar();
    }
    return suffix;
  };

  const startAnimation = () => {
    const text = hiddenEl?.textContent ?? '';
    if (!text) {
      isAnimating = false;
      return;
    }

    clearInterval(intervalId);
    isAnimating = true;
    let currentIndex = 0;
    let cycleCount = 0;

    // Calculate speed: if duration is set, compute interval to finish in that time.
    // Total ticks = cyclesPerChar+1 per non-space char, +1 per space.
    const nonSpaceChars = text.replace(/\s/g, '').length;
    const totalTicks = nonSpaceChars * (cyclesPerChar + 1) + (text.length - nonSpaceChars);
    const speed = duration ? Math.max(1, Math.floor(duration / totalTicks)) : animationSpeed;

    displayText = getScrambledSuffix(text, 0);

    intervalId = setInterval(() => {
      if (currentIndex >= text.length) {
        clearInterval(intervalId);
        isAnimating = false;
        return;
      }

      const targetChar = text[currentIndex];

      if (targetChar === ' ') {
        displayText = text.slice(0, currentIndex + 1) + getScrambledSuffix(text, currentIndex + 1);
        currentIndex++;
        cycleCount = 0;
        return;
      }

      if (cycleCount < cyclesPerChar) {
        displayText = text.slice(0, currentIndex) + randomChar() + getScrambledSuffix(text, currentIndex + 1);
        cycleCount++;
      } else {
        displayText = text.slice(0, currentIndex + 1) + getScrambledSuffix(text, currentIndex + 1);
        currentIndex++;
        cycleCount = 0;
      }
    }, speed);
  };

  const handleMouseEnter = () => {
    if (animateOnHover) {
      startAnimation();
    }
  };

  $effect(() => {
    if (hovered && animateOnHover) {
      startAnimation();
    }
  });

  onMount(() => {
    if (animate) {
      startAnimation();
    }

    if (animateOnView && containerEl) {
      viewObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              startAnimation();
              viewObserver?.unobserve(entry.target);
            }
          });
        },
        { threshold: viewThreshold }
      );
      viewObserver.observe(containerEl);
    }
  });

  onDestroy(() => {
    clearInterval(intervalId);
    viewObserver?.disconnect();
  });
</script>

{#if animate || animateOnView || animateOnHover}
  <span
    bind:this={hiddenEl}
    aria-hidden="true"
    class="{textSizeStyles[size]} {textTypeStyles[type]} {textHiddenMeasureStyles}"
  >
    {@render children?.()}
  </span>
{/if}

<p
  bind:this={containerEl}
  class="{textSizeStyles[size]} {textColorStyles[color]} {textDefaultStyles} {textTypeStyles[type]} {className ?? ''}"
  onmouseenter={handleMouseEnter}
  {...rest}
>
  {#if isAnimating}
    {displayText}
  {:else}
    {@render children?.()}
  {/if}
</p>
