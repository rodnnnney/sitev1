<script lang="ts">
    import { blogs, projects } from '$lib/utils/consts';
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { onMount } from 'svelte';
  
    let visible = false;
    
    onMount(() => {
      visible = true;
    });
  </script>
  
  <div class="min-h-screen text-white p-12">
    <nav class="flex items-center space-x-2 text-sm text-white mb-8">
      <a href="/">Home</a>
      <span>/</span>
      <a href="/projects" class="text-white transition-colors">Projects</a>
    </nav>
  
    <div class="flex flex-row items-end justify-start mb-8">
      <h1 class="text-3xl font-bold">Projects</h1>

    </div>
  
    <div class="px-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        {#each projects as project, i}
          <div class="block">
            {#if visible}
              <a 
                href={project.link} target="_blank" rel="noopener noreferrer"
                class="block"
                in:fly={{ 
                  y: 50, 
                  duration: 800, 
                  delay: i * 100,
                  easing: quintOut 
                }}
              >
                <div class="bg-neutral-800 rounded-lg overflow-hidden shadow-lg hover:bg-neutral-700 transition-colors relative group">
                  <img 
                    src={project.src} 
                    alt={project.name}
                    class="w-full h-64 object-cover"
                  />
                  <div class="absolute inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p class="text-black text-center px-4 text-left">{project.description}</p>
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