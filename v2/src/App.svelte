<script lang="ts">
  import Home from './lib/Home.svelte'
  import Showcase from './lib/Showcase.svelte'

  // Minimal dependency-free routing. Vite's dev server does SPA fallback,
  // so hitting /xyz directly serves index.html and this resolves it.
  let path = $state(window.location.pathname)

  $effect(() => {
    const onPop = () => (path = window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  })
</script>

{#if path === '/xyz'}
  <Showcase />
{:else}
  <Home />
{/if}
