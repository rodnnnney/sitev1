<script lang="ts">
  import { blogs } from '$lib/utils/consts';
</script>

<div class="min-h-screen bg-neutral-900 text-white p-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-8">Shower Thoughts</h1>
    
    <div class="space-y-8">
      {#each blogs as blog}
        <a href="/blogs/{blog.title.toLowerCase().replace(/\s+/g, '-')}" class="block">
          <div class="bg-neutral-800 rounded-lg p-6 shadow-lg hover:bg-neutral-700 transition-colors">
            <h2 class="text-xl font-semibold mb-2">{blog.title}</h2>
            <p class="text-sm text-gray-400 mb-4">{blog.date}</p>
            <p class="text-gray-300">{blog.excerpt}</p>
          </div>
        </a>
      {/each}
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style> 