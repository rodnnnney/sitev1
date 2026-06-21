<script lang="ts">
  import type { Snippet } from "svelte";
  import { Text } from "../Text";

  let { children } = $props<{ children?: Snippet }>();

  let showGrid = $state(
    new URLSearchParams(window.location.search).get("debug") === "2",
  );

  $effect(() => {
    const onPop = () => {
      showGrid =
        new URLSearchParams(window.location.search).get("debug") === "2";
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  });
</script>

{#if showGrid}
  <div class="pointer-events-none fixed inset-0 z-50 flex">
    {#each [1, 2, 3, 4, 5, 6, 7] as i}
      <div
        class="absolute top-0 h-full w-px bg-accent/30"
        style="left: {i * 12.5}%"
      ></div>
    {/each}
  </div>
{/if}

<div class="grid min-h-screen grid-cols-[1fr_7fr]">
  <!-- Sidebar: 1/8 width -->
  <aside class="sticky top-0 h-screen border-r border-line px-4 py-6">
    <nav class="flex flex-col gap-4">
      <Text type="label" size="xs" color="muted">navigation</Text>
      <div class="flex flex-col gap-2">
        <Text type="paragraph" size="sm" color="black" links>
          <a href="/">home</a>
        </Text>
        <Text type="paragraph" size="sm" color="black" links>
          <a href="/xyz">components</a>
        </Text>
      </div>
    </nav>
  </aside>

  <!-- Main content: 7/8 width -->
  <main class="min-w-0">
    {@render children?.()}
  </main>
</div>
