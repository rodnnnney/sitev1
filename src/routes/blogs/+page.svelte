<script lang="ts">
  import { blogs } from '$lib/utils/consts';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { onMount } from 'svelte';

  let visible = false;
  
  onMount(() => {
    visible = true;
  });
</script>

<div class="min-h-screen text-white p-12">
  <nav class="flex items-center space-x-2 text-sm text-gray-400 mb-8">
    <a href="/" class="hover:text-white transition-colors">Home</a>
    <span>/</span>
    <a href="/blogs" class="text-white transition-colors">Blogs</a>
  </nav>

  <h1 class="text-3xl font-bold mb-8 text-left flex justify-start">Blogs</h1>

  <div class="max-w-6xl mx-auto px-8">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      {#each blogs as blog, i}
        <div class="block">
          {#if visible}
            <a 
              href="/blogs/{blog.link}" 
              class="block"
              in:fly={{ 
                y: 50, 
                duration: 800, 
                delay: i * 100,
                easing: quintOut 
              }}
            >
              <div class="bg-neutral-800 rounded-lg overflow-hidden shadow-lg hover:bg-neutral-700 transition-colors">
                <img 
                  src={blog.cover_img} 
                  alt={blog.title}
                  class="w-full h-48 object-cover"
                />
                <div class="p-6">
                  <h2 class="text-xl font-semibold mb-2">{blog.title}</h2>
                  <p class="text-sm text-gray-400 mb-4">{blog.date}</p>
                  <p class="text-gray-300">{blog.excerpt}</p>
                </div>
              </div>
            </a>
          {:else}
            <div class="bg-neutral-800/50 rounded-lg overflow-hidden shadow-lg">
              <div class="w-full h-48 bg-neutral-700/50"></div>
              <div class="p-6">
                <div class="h-6 bg-neutral-700/50 rounded w-3/4 mb-2"></div>
                <div class="h-4 bg-neutral-700/50 rounded w-1/4 mb-4"></div>
                <div class="h-4 bg-neutral-700/50 rounded w-full"></div>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  @keyframes pulse {
    0%, 100% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.7;
    }
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style> 