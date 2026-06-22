<script lang="ts">
  import { onMount } from "svelte";
  import {
    Text,
    Page,
    Button,
    toast,
    textSizeStyles,
    textColorStyles,
    textTypeStyles,
    type TextSize,
    type TextColor,
    type TextType,
  } from "./primitives";
  import { deviceType } from "./deviceStore";

  // Derive every option straight from the style maps so this stays in sync.
  const sizes = Object.keys(textSizeStyles) as TextSize[];
  const colors = Object.keys(textColorStyles) as TextColor[];
  const types = Object.keys(textTypeStyles) as TextType[];

  const buttonVariants = [
    "solid",
    "classic",
    "soft",
    "surface",
    "outline",
    "ghost",
  ] as const;
  const buttonSizes = ["xs", "sm", "md", "lg", "xl"] as const;

  // Bump to remount the animation demos (replay the scramble).
  let replayKey = $state(0);

  // Two-column demo row: stacked on mobile, label + content on wider screens.
  const rowGrid = (cols = "7rem") =>
    `grid items-baseline gap-4 ${
      $deviceType === "mobile" ? "grid-cols-1" : `grid-cols-[${cols}_1fr]`
    }`;

  // The site's one hue, plus the semantic roles it plugs into.
  const blueSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  const palette = ["paper", "ink", "muted", "line", "accent"];

  // Resolve each token's hex once mounted so the labels never drift from app.css.
  let hexes = $state<Record<string, string>>({});
  onMount(() => {
    const cs = getComputedStyle(document.documentElement);
    const read = (n: string) => cs.getPropertyValue(`--color-${n}`).trim();
    const next: Record<string, string> = {};
    for (const s of blueSteps) next[`blue-${s}`] = read(`blue-${s}`);
    for (const p of palette) next[p] = read(p);
    hexes = next;
  });
</script>

<Page
  title="Components"
  lead="Every option of the internal base components."
  contentClass="flex flex-col gap-16"
>
  {#snippet swatch(name: string, key: string, main = false)}
    <div class="flex flex-col gap-1.5">
      <div
        class="h-12 w-full rounded-sm border {main
          ? 'border-accent ring-2 ring-accent ring-offset-2 ring-offset-paper'
          : 'border-line'}"
        style="background-color: var(--color-{key})"
      ></div>
      <Text type="label" size="xs" color={main ? "accent" : "black"}>
        {name}{main ? " · main" : ""}
      </Text>
      <Text type="label" size="xs" color="muted">{hexes[key] ?? "—"}</Text>
    </div>
  {/snippet}

  <!-- ── Color: blue scale ───────────────────────────────── -->
  <section class="flex flex-col gap-4">
    <div class="flex items-baseline justify-between">
      <Text type="label" size="xs" color="muted">Color · blue scale</Text>
      <Text type="label" size="xs" color="muted">
        main brand blue · #2200FF (#20F) · blue-500 · accent
      </Text>
    </div>
    <div
      class="grid grid-cols-5 gap-3 border-t border-line pt-4 sm:grid-cols-10"
    >
      {#each blueSteps as s (s)}
        {@render swatch(`blue-${s}`, `blue-${s}`, s === 500)}
      {/each}
    </div>
  </section>

  <!-- ── Color: palette ──────────────────────────────────── -->
  <section class="flex flex-col gap-4">
    <Text type="label" size="xs" color="muted">Color · palette</Text>
    <div class="grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-5">
      {#each palette as p (p)}
        {@render swatch(p, p)}
      {/each}
    </div>
  </section>

  <!-- ── Text: types ─────────────────────────────────────── -->
  <section class="flex flex-col gap-4">
    <Text type="label" size="xs" color="muted">Text · type</Text>
    <div class="flex flex-col gap-3 border-t border-line pt-4">
      {#each types as type (type)}
        <div class={rowGrid()}>
          <Text type="label" size="xs" color="muted">{type}</Text>
          <Text {type} size="lg" color="black">The quick brown fox 123</Text>
        </div>
      {/each}
    </div>
  </section>

  <!-- ── Text: sizes ─────────────────────────────────────── -->
  <section class="flex flex-col gap-4">
    <Text type="label" size="xs" color="muted">Text · size</Text>
    <div class="flex flex-col gap-3 border-t border-line pt-4">
      {#each sizes as size (size)}
        <div class={rowGrid()}>
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
          class="{rowGrid()} rounded-sm px-2 py-1"
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
      <div class={rowGrid("10rem")}>
        <Text type="label" size="xs" color="muted">links</Text>
        <Text type="paragraph" size="lg" color="black" links>
          Hover over <a href="/">this link</a> to see the underline.
        </Text>
      </div>
    </div>
  </section>

  <!-- ── Button: variants ────────────────────────────────── -->
  <section class="flex flex-col gap-4">
    <Text type="label" size="xs" color="muted">Button · variant</Text>
    <div class="flex flex-wrap items-center gap-3 border-t border-line pt-4">
      {#each buttonVariants as v (v)}
        <Button variant={v}>{v}</Button>
      {/each}
    </div>
  </section>

  <!-- ── Button: size ────────────────────────────────────── -->
  <section class="flex flex-col gap-4">
    <Text type="label" size="xs" color="muted">Button · size</Text>
    <div class="flex flex-wrap items-center gap-3 border-t border-line pt-4">
      {#each buttonSizes as s (s)}
        <Button size={s}>{s}</Button>
      {/each}
    </div>
  </section>

  <!-- ── Button: state & link ────────────────────────────── -->
  <section class="flex flex-col gap-4">
    <Text type="label" size="xs" color="muted">Button · state & link</Text>
    <div class="flex flex-wrap items-center gap-3 border-t border-line pt-4">
      <Button variant="surface" href="/xyz">as link</Button>
      <Button disabled>disabled</Button>
      <Button variant="surface" disabled>disabled</Button>
    </div>
  </section>

  <!-- ── Toaster (sonner) ────────────────────────────────── -->
  <section class="flex flex-col gap-4">
    <Text type="label" size="xs" color="muted">Toaster · sonner</Text>
    <div class="flex flex-wrap gap-2 border-t border-line pt-4">
      <Button
        variant="surface"
        size="sm"
        onclick={() =>
          toast("Saved", { description: "Your changes are live." })}
      >
        default
      </Button>
      <Button
        variant="surface"
        size="sm"
        onclick={() => toast.success("Deployed to production")}
      >
        success
      </Button>
      <Button
        variant="surface"
        size="sm"
        onclick={() => toast.error("Something went wrong")}
      >
        error
      </Button>
      <Button
        variant="surface"
        size="sm"
        onclick={() =>
          toast("Undo last action?", {
            action: { label: "Undo", onClick: () => toast("Reverted") },
          })}
      >
        with action
      </Button>
      <Button
        variant="surface"
        size="sm"
        onclick={() =>
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
            loading: "Uploading…",
            success: "Uploaded",
            error: "Upload failed",
          })}
      >
        promise
      </Button>
    </div>
  </section>

  <!-- ── Text: animations ────────────────────────────────── -->
  <section class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <Text type="label" size="xs" color="muted">Text · scramble animation</Text
      >
      <Button variant="ghost" size="sm" onclick={() => (replayKey += 1)}>
        replay
      </Button>
    </div>
    <div class="flex flex-col gap-3 border-t border-line pt-4">
      {#key replayKey}
        <div class={rowGrid("10rem")}>
          <Text type="label" size="xs" color="muted">animate (on mount)</Text>
          <Text type="heading" size="xl" color="black" animate>ON MOUNT</Text>
        </div>
        <div class={rowGrid("10rem")}>
          <Text type="label" size="xs" color="muted">animateOnView</Text>
          <Text type="heading" size="xl" color="black" animateOnView
            >ON VIEW</Text
          >
        </div>
      {/key}
      <div class={rowGrid("10rem")}>
        <Text type="label" size="xs" color="muted">animateOnHover</Text>
        <Text type="heading" size="xl" color="black" animateOnHover
          >HOVER ME</Text
        >
      </div>
      <div class={rowGrid("10rem")}>
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
