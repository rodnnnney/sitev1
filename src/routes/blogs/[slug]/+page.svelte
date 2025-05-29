<script lang="ts">
    import { page } from '$app/stores';
    import { blogs } from '$lib/utils/consts';
    
    // Get the current blog post based on the slug
    $: currentBlog = blogs.find(blog => 
      blog.title.toLowerCase().replace(/\s+/g, '-') === $page.params.slug
    );
  </script>
  
  <div class="min-h-screen bg-neutral-900 text-white p-8">
    <div class="max-w-4xl mx-auto">
      {#if currentBlog}
        <article class="bg-neutral-800 rounded-lg p-8 shadow-lg">
          <header class="mb-8">
            <h1 class="text-3xl font-bold mb-4">{currentBlog.title}</h1>
            <p class="text-gray-400">{currentBlog.date}</p>
            <div class="mt-4 p-4 bg-yellow-500/20 rounded-lg">
              <p class="text-yellow-400 font-medium">🚧 This is a work in progress 🚧</p>
            </div>
          </header>
          
          <div class="prose prose-invert max-w-none">
            <p class="text-gray-300">{currentBlog.excerpt}</p>
            <!-- Add more content sections here -->
          </div>
        </article>
      {:else}
        <div class="text-center">
          <h1 class="text-2xl font-bold">Blog post not found</h1>
          <p class="text-gray-400 mt-4">The blog post you're looking for doesn't exist.</p>
        </div>
      {/if}
    </div>
  </div>
  
  <style>
    :global(.prose) {
      max-width: 65ch;
      color: #e5e5e5;
    }
    
    :global(.prose p) {
      margin-top: 1.25em;
      margin-bottom: 1.25em;
    }
  </style> 