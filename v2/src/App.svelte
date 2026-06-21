<script lang="ts">
  import Home from "./lib/Home.svelte";
  import Showcase from "./lib/Showcase.svelte";
  import { Layout } from "./lib/primitives";

  let path = $state(window.location.pathname);

  function onClick(e: MouseEvent) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

    const url = new URL(anchor.href);
    if (url.origin !== location.origin) return; // external link

    e.preventDefault();
    if (url.pathname !== path) {
      history.pushState({}, "", url.pathname + url.search + url.hash);
      path = url.pathname;
      window.scrollTo(0, 0);
    }
  }

  $effect(() => {
    const onPop = () => (path = location.pathname);
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPop);
    };
  });
</script>

<Layout {path}>
  {#if path === "/xyz"}
    <Showcase />
  {:else}
    <Home />
  {/if}
</Layout>
