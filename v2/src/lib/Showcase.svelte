<script lang="ts">
  import Text from './Text.svelte'
  import {
    textSizeStyles,
    textColorStyles,
    textTypeStyles,
    type TextSize,
    type TextColor,
    type TextType,
  } from './text.css'

  // Derive every option straight from the style maps so this stays in sync.
  const sizes = Object.keys(textSizeStyles) as TextSize[]
  const colors = Object.keys(textColorStyles) as TextColor[]
  const types = Object.keys(textTypeStyles) as TextType[]

  // Bump to remount the animation demos (replay the scramble).
  let replayKey = $state(0)
</script>

<main class="mx-auto flex max-w-3xl flex-col gap-16 px-6 py-20">
  <header class="flex flex-col gap-2">
    <Text type="heading" size="2xl" color="black">COMPONENTS</Text>
    <Text type="paragraph" color="muted" size="sm">
      Every option of the internal base components. /xyz
    </Text>
  </header>

  <!-- ── Text: types ─────────────────────────────────────── -->
  <section class="flex flex-col gap-4">
    <Text type="label" size="xs" color="muted">Text · type</Text>
    <div class="flex flex-col gap-3 border-t border-neutral-200 pt-4">
      {#each types as type (type)}
        <div class="grid grid-cols-[7rem_1fr] items-baseline gap-4">
          <Text type="label" size="xs" color="muted">{type}</Text>
          <Text {type} size="lg" color="black">The quick brown fox 123</Text>
        </div>
      {/each}
    </div>
  </section>

  <!-- ── Text: sizes ─────────────────────────────────────── -->
  <section class="flex flex-col gap-4">
    <Text type="label" size="xs" color="muted">Text · size</Text>
    <div class="flex flex-col gap-3 border-t border-neutral-200 pt-4">
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
    <div class="flex flex-col gap-3 border-t border-neutral-200 pt-4">
      {#each colors as color (color)}
        <div
          class="grid grid-cols-[7rem_1fr] items-baseline gap-4 rounded px-2 py-1"
          class:bg-neutral-900={color === 'white'}
        >
          <Text type="label" size="xs" color="muted">{color}</Text>
          <Text type="paragraph" size="lg" {color}>Sample text 123</Text>
        </div>
      {/each}
    </div>
  </section>

  <!-- ── Text: animations ────────────────────────────────── -->
  <section class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <Text type="label" size="xs" color="muted">Text · scramble animation</Text>
      <button
        onclick={() => (replayKey += 1)}
        class="font-mono text-xs text-violet-600 underline-offset-4 hover:underline"
      >
        replay
      </button>
    </div>
    <div class="flex flex-col gap-3 border-t border-neutral-200 pt-4">
      {#key replayKey}
        <div class="grid grid-cols-[10rem_1fr] items-baseline gap-4">
          <Text type="label" size="xs" color="muted">animate (on mount)</Text>
          <Text type="heading" size="xl" color="black" animate>ON MOUNT</Text>
        </div>
        <div class="grid grid-cols-[10rem_1fr] items-baseline gap-4">
          <Text type="label" size="xs" color="muted">animateOnView</Text>
          <Text type="heading" size="xl" color="black" animateOnView>ON VIEW</Text>
        </div>
      {/key}
      <div class="grid grid-cols-[10rem_1fr] items-baseline gap-4">
        <Text type="label" size="xs" color="muted">animateOnHover</Text>
        <Text type="heading" size="xl" color="black" animateOnHover>HOVER ME</Text>
      </div>
      <div class="grid grid-cols-[10rem_1fr] items-baseline gap-4">
        <Text type="label" size="xs" color="muted">paragraph (full charset)</Text>
        <Text type="paragraph" size="lg" color="black" animateOnHover>
          hover for symbols too
        </Text>
      </div>
    </div>
  </section>

  <a
    href="/"
    class="font-mono text-sm text-neutral-900 underline-offset-4 hover:underline"
  >
    ← back
  </a>
</main>
