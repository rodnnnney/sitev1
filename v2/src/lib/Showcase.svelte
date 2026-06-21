<script lang="ts">
  import {
    Text,
    Page,
    textSizeStyles,
    textColorStyles,
    textTypeStyles,
    type TextSize,
    type TextColor,
    type TextType,
  } from "./primitives";

  // Derive every option straight from the style maps so this stays in sync.
  const sizes = Object.keys(textSizeStyles) as TextSize[];
  const colors = Object.keys(textColorStyles) as TextColor[];
  const types = Object.keys(textTypeStyles) as TextType[];

  // Bump to remount the animation demos (replay the scramble).
  let replayKey = $state(0);

  let showGrid = $state(new URLSearchParams(window.location.search).get("debug") === "2");

  // Re-check when query string changes via back/forward navigation.
  $effect(() => {
    const onPop = () => {
      showGrid = new URLSearchParams(window.location.search).get("debug") === "2";
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

  <main class="min-w-0">
    <Page
      title="Components"
      label="/xyz"
      lead="Every option of the internal base components."
      contentClass="flex flex-col gap-16"
    >
      <!-- ── Text: types ─────────────────────────────────────── -->
      <section class="flex flex-col gap-4">
        <Text type="label" size="xs" color="muted">Text · type</Text>
        <div class="flex flex-col gap-3 border-t border-line pt-4">
          {#each types as type (type)}
            <div class="grid grid-cols-[7rem_1fr] items-baseline gap-4">
              <Text type="label" size="xs" color="muted">{type}</Text>
              <Text {type} size="lg" color="black">The quick brown fox 123</Text
              >
            </div>
          {/each}
        </div>
      </section>

      <!-- ── Text: sizes ─────────────────────────────────────── -->
      <section class="flex flex-col gap-4">
        <Text type="label" size="xs" color="muted">Text · size</Text>
        <div class="flex flex-col gap-3 border-t border-line pt-4">
          {#each sizes as size (size)}
            <div class="grid grid-cols-[7rem_1fr] items-baseline gap-4">
              <Text type="label" size="xs" color="muted">{size}</Text>
              <Text type="paragraph" {size} color="black">Sample text 123</Text>
            </div>
          {/each}
        </div>
      </section>

      <!-- ── Text: colors ────────────────────────────────────── -->
      <section class="flex flex-col gap-4">
        <Text type="label" size="xs" color="muted">Text · color</Text>
        <div class="flex flex-col gap-3 border-t border-line pt-4">
          {#each colors as color (color)}
            <div
              class="grid grid-cols-[7rem_1fr] items-baseline gap-4 rounded px-2 py-1"
              class:bg-ink={color === "white"}
            >
              <Text type="label" size="xs" color="muted">{color}</Text>
              <Text type="paragraph" size="lg" {color}>Sample text 123</Text>
            </div>
          {/each}
        </div>
      </section>

      <!-- ── Text: links ─────────────────────────────────────── -->
      <section class="flex flex-col gap-4">
        <Text type="label" size="xs" color="muted">Text · links</Text>
        <div class="flex flex-col gap-3 border-t border-line pt-4">
          <div class="grid grid-cols-[10rem_1fr] items-baseline gap-4">
            <Text type="label" size="xs" color="muted">links</Text>
            <Text type="paragraph" size="lg" color="black" links>
              Hover over <a href="/">this link</a> to see the underline.
            </Text>
          </div>
        </div>
      </section>

      <!-- ── Text: animations ────────────────────────────────── -->
      <section class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <Text type="label" size="xs" color="muted"
            >Text · scramble animation</Text
          >
          <button
            onclick={() => (replayKey += 1)}
            class="font-mono text-xs text-accent underline-offset-4 hover:underline"
          >
            replay
          </button>
        </div>
        <div class="flex flex-col gap-3 border-t border-line pt-4">
          {#key replayKey}
            <div class="grid grid-cols-[10rem_1fr] items-baseline gap-4">
              <Text type="label" size="xs" color="muted"
                >animate (on mount)</Text
              >
              <Text type="heading" size="xl" color="black" animate
                >ON MOUNT</Text
              >
            </div>
            <div class="grid grid-cols-[10rem_1fr] items-baseline gap-4">
              <Text type="label" size="xs" color="muted">animateOnView</Text>
              <Text type="heading" size="xl" color="black" animateOnView
                >ON VIEW</Text
              >
            </div>
          {/key}
          <div class="grid grid-cols-[10rem_1fr] items-baseline gap-4">
            <Text type="label" size="xs" color="muted">animateOnHover</Text>
            <Text type="heading" size="xl" color="black" animateOnHover
              >HOVER ME</Text
            >
          </div>
          <div class="grid grid-cols-[10rem_1fr] items-baseline gap-4">
            <Text type="label" size="xs" color="muted"
              >paragraph (full charset)</Text
            >
            <Text type="paragraph" size="lg" color="black" animateOnHover>
              hover for symbols too
            </Text>
          </div>
        </div>
      </section>
    </Page>
  </main>
</div>
