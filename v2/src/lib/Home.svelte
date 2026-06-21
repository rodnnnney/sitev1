<script lang="ts">
  import { ArrowUpRight } from 'lucide-svelte'
  import Text from './Text.svelte'
</script>

<main class="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-8 px-6">
  <!-- Pixel header: scrambles in on load + re-scrambles on hover -->
  <Text type="heading" size="3xl" color="black" animate animateOnHover>
    rodney
  </Text>

  <Text type="paragraph" color="muted">
    Minimalist v2. Body text is set in Ioskeley Mono; headers and important
    bits use Geist Pixel and cycle their characters.
  </Text>

  <!-- Important text that scrambles when it scrolls into view -->
  <Text type="important" size="lg" color="accent" animateOnView>
    IMPORTANT 2026
  </Text>

  <a
    href="/xyz"
    class="inline-flex w-fit items-center gap-1 text-sm text-ink underline-offset-4 hover:underline"
  >
    component showcase <ArrowUpRight class="size-4" />
  </a>
</main>
