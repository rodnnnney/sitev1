<script lang="ts">
  import { Check, Link } from "lucide-svelte";
  import { onDestroy } from "svelte";
  import { toast } from "../primitives";

  let copied = $state(false);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  onDestroy(() => {
    if (resetTimer) clearTimeout(resetTimer);
  });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copied = true;
      toast.success("Link copied");
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        copied = false;
      }, 1500);
    } catch {
      toast.error("Couldn't copy link");
    }
  }
</script>

<button
  type="button"
  onclick={copyLink}
  data-no-rave
  class="inline-flex items-center text-muted transition-colors hover:text-ink"
  aria-label="copy link"
>
  {#if copied}
    <Check class="size-3.5" aria-hidden="true" />
  {:else}
    <Link class="size-3.5" aria-hidden="true" />
  {/if}
</button>
