<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Text, type TextSize } from '../Text'

  let {
    title,
    label,
    lead,
    titleSize = 'lg',
    contentClass = 'flex flex-col gap-8',
    children,
  }: {
    title: string
    label?: string
    lead?: string
    /** Title is capped at a restrained size by default for consistency. */
    titleSize?: TextSize
    /** Override the spacing of the content area per page. */
    contentClass?: string
    children?: Snippet
  } = $props()
</script>

<main class="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-12 px-6 py-20">
  <!-- Title block — same position on every page -->
  <header class="flex flex-col gap-2">
    {#if label}
      <Text type="label" size="xs" color="muted">{label}</Text>
    {/if}
    <Text type="heading" size={titleSize} color="black" animate animateOnHover>
      {title}
    </Text>
    {#if lead}
      <Text type="paragraph" size="sm" color="muted">{lead}</Text>
    {/if}
  </header>

  <div class={contentClass}>
    {@render children?.()}
  </div>
</main>
