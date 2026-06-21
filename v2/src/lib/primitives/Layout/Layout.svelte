<script lang="ts">
  import type { Snippet } from "svelte";
  import { Text } from "../Text";
  import Debug from "./Debug.svelte";
  import { debugStore } from "../../debugStore";

  let { children, path } = $props<{ children?: Snippet; path: string }>();

  let homeLink: HTMLAnchorElement | null = $state(null);
  let componentsLink: HTMLAnchorElement | null = $state(null);
  let navEl: HTMLElement | null = $state(null);
  let indicatorStyle = $state("top: 0px; height: 0px;");

  const updateIndicator = () => {
    const activeLink = path === "/" ? homeLink : componentsLink;
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
    componentsLink;
    navEl;
    updateIndicator();
  });

  $effect(() => {
    const onPop = () => {
      debugStore.set(new URLSearchParams(window.location.search).has("debug"));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  });
</script>

{#if $debugStore}
  <Debug />
{/if}

<div class="relative min-h-screen">
  <!-- Fixed sidebar: starts at 1/8, doesn't push content -->
  <aside
    class="fixed top-0 left-[12.5%] z-10 h-screen w-[12.5%] border-r border-line px-4 py-20"
  >
    <nav
      bind:this={navEl}
      class="relative flex flex-col gap-2 text-right"
    >
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
          class={path === "/" ? "no-underline" : ""}>home</a>
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
            class={path === "/xyz" ? "no-underline" : ""}>components</a>
        </Text>
      {/if}
    </nav>
  </aside>

  <!-- Main content: centered as if there's no sidebar -->
  <div class="relative">
    {@render children?.()}
  </div>
</div>
