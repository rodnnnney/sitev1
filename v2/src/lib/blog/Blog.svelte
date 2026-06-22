<script lang="ts">
  import { ArrowUpRight } from 'lucide-svelte';
  import { Page, Text } from '../primitives';
  import { blog, reading } from '../consts';
</script>

<Page title="Blog" showTime contentClass="flex flex-col gap-0">
  <div class="mb-8 border-b border-line"></div>

  <div class="flex flex-col">
    {#each blog as post (post.slug)}
      <a
        href="/blog/{post.slug}"
        class="group grid grid-cols-[5rem_1fr] gap-6 py-6 transition-colors hover:bg-line/20"
      >
        <Text type="label" size="xs" color="muted" class="pt-1"
          >{post.date}</Text
        >
        <div class="flex flex-col gap-2">
          <Text type="heading" size="xl" color="black">{post.title}</Text>
          <Text type="paragraph" size="sm" color="black"
            >{post.description}</Text
          >
        </div>
      </a>
    {/each}
  </div>

  <!-- Other works — external pieces I like, not mine. -->
  <section class="mt-6 flex flex-col">
    <Text type="label" size="xs" color="muted">Worth reading</Text>
    <div class="mt-4 flex flex-col border-t border-line">
      {#each reading as work (work.href)}
        <a
          href={work.href}
          target="_blank"
          rel="noopener noreferrer"
          class="group grid grid-cols-[1fr_auto] items-baseline gap-6 border-b border-line py-5 transition-colors hover:bg-line/20"
        >
          <div class="flex flex-col gap-1">
            <Text type="heading" size="md" color="black">{work.title}</Text>
            <Text type="paragraph" size="sm" color="muted">{work.author}</Text>
          </div>
          <ArrowUpRight
            class="size-4 text-muted transition-colors group-hover:text-accent"
          />
        </a>
      {/each}
    </div>
  </section>
</Page>
