<script lang="ts">
  import { tick } from "svelte";
  import Home from "./lib/Home.svelte";
  import NotFound from "./lib/NotFound.svelte";
  import Showcase from "./lib/Showcase.svelte";
  import Monkey from "./lib/Monkey.svelte";
  import { Blog, MoreBubbles, Pacing } from "./lib/blog";
  import { Layout, Toaster } from "./lib/primitives";
  import RandomBanger from "./lib/RandomBanger.svelte";
  import { reduceMotion } from "./lib/effects/shared";

  function toWritingPath(p: string) {
    if (p === "/blog" || p.startsWith("/blog/")) {
      return "/writing" + p.slice("/blog".length);
    }
    return p;
  }

  const initialPath = toWritingPath(window.location.pathname);
  let path = $state(initialPath);
  if (initialPath !== window.location.pathname) {
    history.replaceState(
      {},
      "",
      initialPath + window.location.search + window.location.hash,
    );
  }

  function go(to: string) {
    const next = toWritingPath(to);
    const swap = () => {
      path = next;
      window.scrollTo(0, 0);
      return tick();
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
    const next = toWritingPath(url.pathname);
    if (next !== path) {
      history.pushState({}, "", next + url.search + url.hash);
      go(next);
    }
  }

  $effect(() => {
    const onPop = () => {
      const next = toWritingPath(location.pathname);
      if (next !== location.pathname) {
        history.replaceState({}, "", next + location.search + location.hash);
      }
      path = next;
    };
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPop);
    };
  });
</script>

<div id="shake-root" class="relative z-[1]">
  <Layout {path}>
    {#if path === "/"}
      <Home />
    {:else if path === "/xyz"}
      <Showcase />
    {:else if path === "/writing"}
      <Blog />
    {:else if path === "/writing/pace-factor"}
      <Pacing />
    {:else if path === "/writing/more-bubbles"}
      <MoreBubbles />
    {:else if path === "/monkey"}
      <Monkey />
    {:else}
      <NotFound {path} />
    {/if}
  </Layout>
</div>

<RandomBanger />
<Toaster />
