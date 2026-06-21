<script lang="ts">
  import { ArrowUpRight } from 'lucide-svelte'
  import { Text, Page } from './primitives'
</script>

<Page title="rodney" label="Home">
  <Text type="paragraph" color="muted">
    Minimalist v2. Body text is set in Ioskeley Mono; headers and important
    bits use Geist Pixel and cycle their characters.
  </Text>

  <Text type="important" size="lg" color="accent" animateOnView>
    IMPORTANT 2026
  </Text>

  <a
    href="/xyz"
    class="inline-flex w-fit items-center gap-1 text-sm text-ink underline-offset-4 hover:underline"
  >
    component showcase <ArrowUpRight class="size-4" />
  </a>
</Page>
