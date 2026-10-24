<script lang="ts">
  import { DICT, DICT_BYTES, ENCODED_BYTES, PAGES, PLAIN_BYTES, VALUES, pageDesc } from "./chunk";

  const ratio = (PLAIN_BYTES / ENCODED_BYTES).toFixed(1);
</script>

{#snippet bar(bytes: number, accent: boolean)}
  <div class="flex items-center gap-2">
    <div class="h-2 flex-1 rounded-xs bg-line">
      <div
        class="h-full rounded-xs {accent ? 'bg-accent' : 'bg-blue-300'}"
        style="width: {(bytes / PLAIN_BYTES) * 100}%"
      ></div>
    </div>
    <span class="w-10 text-right font-mono text-xs tabular-nums {accent ? 'text-accent' : 'text-ink'}">{bytes} B</span>
  </div>
{/snippet}

<figure class="flex flex-col gap-4 rounded-sm border border-line p-4">
  <div class="grid gap-4 sm:grid-cols-2">
    <div class="flex flex-col gap-3">
      <span class="font-mono text-[11px] text-muted">incoming · {VALUES.length} strings</span>
      <div class="flex flex-wrap gap-1">
        {#each VALUES as v, i (i)}
          <span
            class="inline-flex h-7 min-w-9 items-center justify-center rounded-xs border border-line px-1 font-mono text-[11px] text-ink"
            >{v}</span
          >
        {/each}
      </div>
      <div class="mt-auto">{@render bar(PLAIN_BYTES, false)}</div>
    </div>

    <div class="flex flex-col gap-3">
      <span class="font-mono text-[11px] text-muted">on disk · 1 column chunk</span>
      <div class="flex flex-col gap-1 font-mono text-[11px]">
        <span class="rounded-xs border border-blue-200 bg-blue-50 px-2 py-1.5 text-ink">
          dictionary page · {DICT.join(" ")} · {DICT_BYTES} B
        </span>
        {#each PAGES as _, i (i)}
          <span class="rounded-xs border border-line px-2 py-1.5 text-ink">data page {i} · {pageDesc(i)}</span>
        {/each}
      </div>
      <div class="mt-auto">{@render bar(ENCODED_BYTES, true)}</div>
    </div>
  </div>

  <figcaption class="flex flex-col gap-1 border-t border-line pt-3 font-mono text-xs leading-relaxed">
    <span><span class="text-accent">{ratio}× smaller</span>, not counting page headers.</span>
    <span class="text-muted">
      The dictionary is a fixed cost, so the gap grows with the data: 1M rows of 5 cities, like the file
      above, is ~9 MB of strings and ~0.4 MB of 3-bit codes.
    </span>
  </figcaption>
</figure>
