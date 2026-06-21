<script lang="ts">
  import type { Snippet } from "svelte";
  import { Text } from "../Text";
  import Debug from "./Debug.svelte";

  let { children } = $props<{ children?: Snippet }>();

  let currentPath = $state(window.location.pathname);
  let showGrid = $state(
    new URLSearchParams(window.location.search).has("debug"),
  );

  $effect(() => {
    const onPop = () => {
      currentPath = window.location.pathname;
      showGrid = new URLSearchParams(window.location.search).has("debug");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  });
</script>

{#if showGrid}
  <Debug onClose={() => (showGrid = false)} />
{/if}

<div class="relative min-h-screen">
  <!-- Fixed sidebar: starts at 1/8, doesn't push content -->
  <aside
    class="fixed top-0 left-[12.5%] z-10 h-screen w-[12.5%] border-r border-line px-4 py-20"
  >
    <nav class="flex flex-col gap-2">
      {#if currentPath === "/"}
        <Text type="paragraph" size="sm" color="accent">
          <a href="/" class="no-underline">| home</a>
        </Text>
      {:else}
        <Text type="paragraph" size="sm" color="black" links>
          <a href="/">home</a>
        </Text>
      {/if}
      {#if currentPath === "/xyz"}
        <Text type="paragraph" size="sm" color="accent">
          <a href="/xyz" class="no-underline">| components</a>
        </Text>
      {:else}
        <Text type="paragraph" size="sm" color="black" links>
          <a href="/xyz">components</a>
        </Text>
      {/if}
    </nav>
  </aside>

  <!-- Main content: centered as if there's no sidebar -->
  <div class="relative">
    {@render children?.()}
  </div>
</div>
