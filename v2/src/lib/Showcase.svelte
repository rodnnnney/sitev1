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
</script>

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
