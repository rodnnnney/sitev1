<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { Text } from "../Text";
  import Debug from "./Debug.svelte";
  import { debugStore } from "../../debugStore";
  import {
    deviceType,
    initBreakpointListener,
    initScrollListener,
  } from "../../deviceStore";
  import { isDebugEnabled } from "../../utils";

  let { children, path } = $props<{ children?: Snippet; path: string }>();

  let homeLink: HTMLAnchorElement | null = $state(null);
  let blogLink: HTMLAnchorElement | null = $state(null);
  let componentsLink: HTMLAnchorElement | null = $state(null);
  let navEl: HTMLElement | null = $state(null);
  let indicatorStyle = $state("top: 0px; height: 0px;");

  const isBlogPath = (p: string) => p === "/blog" || p.startsWith("/blog/");

  const updateIndicator = () => {
    const activeLink =
      path === "/" ? homeLink : isBlogPath(path) ? blogLink : componentsLink;
    if (activeLink && navEl) {
      const linkRect = activeLink.getBoundingClientRect();
      const navRect = navEl.getBoundingClientRect();
      indicatorStyle = `top: ${linkRect.top - navRect.top}px; height: ${linkRect.height}px;`;
    }
  };

  $effect(() => {
    // Re-measure whenever the path or link refs change.
    path;
    homeLink;
    blogLink;
    componentsLink;
    navEl;
    updateIndicator();
  });

  $effect(() => {
    const onPop = () => {
      debugStore.set(isDebugEnabled());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  });

  onMount(() => {
    const stopBreakpoints = initBreakpointListener();
    const stopScroll = initScrollListener();
    return () => {
      stopBreakpoints();
      stopScroll();
    };
  });
</script>

{#if $debugStore}
  <Debug />
{/if}

<div class="relative min-h-screen">
  {#if $deviceType === "desktop"}
    <!-- Desktop sidebar: fixed at 1/8 -->
    <aside
      class="fixed top-0 left-[12.5%] z-10 h-screen w-[12.5%] border-r border-line px-4 py-20"
    >
      <nav bind:this={navEl} class="relative flex flex-col gap-0 text-right">
        <!-- Animated active indicator -->
        <div
          class="absolute -right-3 top-0 w-0.5 bg-accent transition-all duration-300 ease-out"
          style={indicatorStyle}
        ></div>

        <Text
          type="paragraph"
          size="sm"
          color={path === "/" ? "accent" : "black"}
          links={path !== "/"}
          class="w-full"
        >
          <a
            bind:this={homeLink}
            href="/"
            class={path === "/" ? "no-underline" : ""}>home</a
          >
        </Text>

        <Text
          type="paragraph"
          size="sm"
          color={isBlogPath(path) ? "accent" : "black"}
          links={!isBlogPath(path)}
          class="w-full"
        >
          <a
            bind:this={blogLink}
            href="/blog"
            class={isBlogPath(path) ? "no-underline" : ""}>blog</a
          >
        </Text>

        {#if $debugStore}
          <Text
            type="paragraph"
            size="sm"
            color={path === "/xyz" ? "accent" : "black"}
            links={path !== "/xyz"}
            class="w-full"
          >
            <a
              bind:this={componentsLink}
              href="/xyz"
              class={path === "/xyz" ? "no-underline" : ""}>components</a
            >
          </Text>
        {/if}
      </nav>
    </aside>
  {:else}
    <!-- Mobile/Tablet top nav -->
    <nav
      class="fixed top-0 left-0 right-0 z-10 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-4 backdrop-blur"
    >
      <div class="flex items-center gap-4">
        <Text
          type="paragraph"
          size="sm"
          color={path === "/" ? "accent" : "black"}
          links={path !== "/"}
        >
          <a href="/" class={path === "/" ? "no-underline" : ""}>home</a>
        </Text>

        <Text
          type="paragraph"
          size="sm"
          color={isBlogPath(path) ? "accent" : "black"}
          links={!isBlogPath(path)}
        >
          <a href="/blog" class={isBlogPath(path) ? "no-underline" : ""}>blog</a
          >
        </Text>

        {#if $debugStore}
          <Text
            type="paragraph"
            size="sm"
            color={path === "/xyz" ? "accent" : "black"}
            links={path !== "/xyz"}
          >
            <a href="/xyz" class={path === "/xyz" ? "no-underline" : ""}
              >components</a
            >
          </Text>
        {/if}
      </div>
    </nav>
  {/if}

  <!-- Main content: centered as if there's no sidebar -->
  <div class="relative {$deviceType === 'desktop' ? 'pt-0' : 'pt-16'}">
    {@render children?.()}
  </div>
</div>
