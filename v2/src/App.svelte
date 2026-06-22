<script lang="ts">
  import { tick } from "svelte";
  import Home from "./lib/Home.svelte";
  import NotFound from "./lib/NotFound.svelte";
  import Showcase from "./lib/Showcase.svelte";
  import { Blog, Pacing } from "./lib/blog";
  import { Layout, Toaster } from "./lib/primitives";
  import RandomBanger from "./lib/RandomBanger.svelte";
  import { reduceMotion } from "./lib/effects/shared";

  let path = $state(window.location.pathname);

  // Crossfade between routes via the View Transitions API where supported —
  // pure progressive enhancement: unsupported browsers (and reduced-motion
  // users) just get the instant swap.
  function go(to: string) {
    const swap = () => {
      path = to;
      window.scrollTo(0, 0);
      return tick(); // let Svelte paint the new route before the snapshot
    };
    if (document.startViewTransition && !reduceMotion()) {
      document.startViewTransition(swap);
    } else {
      swap();
    }
  }

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
      go(url.pathname);
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

<div id="shake-root">
  <Layout {path}>
    {#if path === "/"}
      <Home />
    {:else if path === "/xyz"}
      <Showcase />
    {:else if path === "/blog"}
      <Blog />
    {:else if path === "/blog/pace-factor"}
      <Pacing />
    {:else}
      <NotFound {path} />
    {/if}
  </Layout>
</div>

<RandomBanger />
<Toaster />
