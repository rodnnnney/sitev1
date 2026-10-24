<script lang="ts">
  import { Text } from "../../primitives";
  import { StepClock } from "./clock.svelte";
  import StepControls from "./StepControls.svelte";

  type Key =
    | "file"
    | "magic"
    | "rowgroup"
    | "chunk"
    | "dict"
    | "page"
    | "header"
    | "levels"
    | "values"
    | "footer"
    | "schema"
    | "colmeta"
    | "len";

  const PARTS: { key: Key; name: string; size: string; body: string }[] = [
    {
      key: "file",
      name: ".parquet file",
      size: "MBs to GBs",
      body: "One self-contained file: the data plus everything needed to read it. It starts and ends with PAR1, and its index lives at the end.",
    },
    {
      key: "magic",
      name: "PAR1",
      size: "4 B, at both ends",
      body: "Magic bytes. Readers check them to know the file is Parquet, and the trailing copy shows the write wasn't cut off halfway.",
    },
    {
      key: "rowgroup",
      name: "row group",
      size: "~128 MB",
      body: "A horizontal slice of rows. Every column is split at the same row boundaries. Engines hand whole row groups to workers, and min/max stats let them skip whole row groups.",
    },
    {
      key: "chunk",
      name: "column chunk",
      size: "one per column, per row group",
      body: "All of one column's values for one row group, stored back to back. A query that doesn't touch this column never reads these bytes.",
    },
    {
      key: "dict",
      name: "dictionary page",
      size: "optional, always first",
      body: "Each distinct value stored once. The data pages after it hold small integer codes instead of the values. Writers fall back to plain values if it grows too big.",
    },
    {
      key: "page",
      name: "data page",
      size: "~1 MB",
      body: "The unit of encoding and compression. A reader decompresses and decodes one page at a time.",
    },
    {
      key: "header",
      name: "page header",
      size: "tens of bytes",
      body: "A small Thrift struct: page type, compressed and uncompressed size, value count, encoding. The page body starts right after it.",
    },
    {
      key: "levels",
      name: "rep / def levels",
      size: "a few bits per value",
      body: "Small integers recording where the nulls are and how nested lists line up. A required, non-nested column has none.",
    },
    {
      key: "values",
      name: "values",
      size: "most of the file",
      body: "The non-null values, encoded (plain, dictionary codes, delta) and then compressed with snappy or zstd.",
    },
    {
      key: "footer",
      name: "footer",
      size: "KBs",
      body: "The file's index, written last, as one Thrift struct (FileMetaData). Readers read it before anything else; nothing else in the file points anywhere.",
    },
    {
      key: "schema",
      name: "schema",
      size: "one entry per column",
      body: "Column names, physical types and logical types (BYTE_ARRAY annotated as STRING), and whether each is required, optional or repeated.",
    },
    {
      key: "colmeta",
      name: "column chunk metadata",
      size: "one per column, per row group",
      body: "Where the chunk starts, how big it is, its encodings and codec, and min/max/null counts. Offsets let a reader seek straight to temp; stats let it skip row groups that can't match a WHERE clause.",
    },
    {
      key: "len",
      name: "footer length",
      size: "4 B",
      body: "How long the footer is. A reader reads the last 8 bytes (this plus PAR1), then exactly that many bytes before them.",
    },
  ];

  // meta: format overhead (magic, lengths, headers). dim: a summary of more of the same.
  // bytes drives the share bar: how much of its parent this part takes up.
  type Node = {
    key?: Key;
    label: string;
    note?: string;
    /** omitted for footer fields: no bar */
    bytes?: number;
    kind?: "meta" | "dim";
    children?: Node[];
  };

  // A 1 GB file written with parquet-java's defaults: 128 MB row groups, ~1 MB
  // pages. Three columns: city (5 distinct), temp (float), description (text).
  const MB = 1024 * 1024;
  const RG_BYTES = 128 * MB;
  const CITY = 0.4 * MB;
  const TEMP = 4 * MB;
  const rowGroup = (g: number): Node => ({
    key: "rowgroup",
    label: `row group ${g}`,
    note: "~1M rows · 128 MB",
    bytes: RG_BYTES,
    children:
      g > 0
        ? undefined
        : [
            {
              key: "chunk",
              label: "column chunk: city",
              note: "0.4 MB",
              bytes: CITY,
              children: [
                { key: "dict", label: "dictionary page", note: "5 values · 70 B", bytes: 70 },
                {
                  key: "page",
                  label: "data page",
                  note: "0.4 MB",
                  bytes: CITY - 70,
                  children: [
                    { key: "header", label: "page header", note: "~60 B", bytes: 60, kind: "meta" },
                    { key: "levels", label: "rep / def levels", note: "none", bytes: 0, kind: "meta" },
                    { key: "values", label: "values", note: "3-bit codes · 0.4 MB", bytes: CITY - 130 },
                  ],
                },
              ],
            },
            { label: "column chunk: temp", note: "~4 pages · 4 MB", bytes: TEMP },
            { label: "column chunk: description", note: "~124 pages · 124 MB", bytes: RG_BYTES - CITY - TEMP },
          ],
  });

  const PARTS_OF_FILE: Node[] = [
      { key: "magic", label: "PAR1", note: "4 B", bytes: 4, kind: "meta" },
      ...Array.from({ length: 8 }, (_, g) => rowGroup(g)),
      { label: "page indexes", note: "~40 KB", bytes: 40 * 1024, kind: "meta" },
      {
        key: "footer",
        label: "footer (FileMetaData)",
        note: "~5 KB",
        bytes: 5 * 1024,
        children: [
          { key: "schema", label: "schema", note: "city: string · temp: float · description: string", kind: "meta" },
          { label: "num_rows", note: "8000000", kind: "meta" },
          {
            label: "row_groups[0]",
            note: "1000000 rows · 128 MB",
            children: [
              { key: "colmeta", label: "city", note: 'offset 4 · 0.4 MB · "Cairo"–"Tokyo"', kind: "meta" },
              { label: "temp", note: "offset 419434 · 4 MB · -12.4–41.7", kind: "meta" },
              { label: "description", note: "offset 4613738 · 124 MB", kind: "meta" },
            ],
          },
          { label: "row_groups[1..7]", note: "same, different offsets", kind: "dim" },
        ],
      },
      { key: "len", label: "footer length", note: "4 B", bytes: 4, kind: "meta" },
      { key: "magic", label: "PAR1", note: "4 B", bytes: 4, kind: "meta" },
  ];

  const TREE: Node = {
    key: "file",
    label: "weather.parquet",
    note: "1 GB",
    bytes: PARTS_OF_FILE.reduce((t, n) => t + (n.bytes ?? 0), 0),
    children: PARTS_OF_FILE,
  };

  const clock = new StepClock(PARTS.map((p) => (p.key === "footer" ? 6000 : 4500)));
  const part = $derived(PARTS[clock.step]);

  const select = (key: Key) => clock.jump(PARTS.findIndex((p) => p.key === key), true);
</script>

{#snippet box(n: Node, parent: number, start: number)}
  {@const active = n.key === part.key}
  <!-- role is "button" whenever tabindex is set; the checker can't see through the ternary -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="flex items-baseline justify-between gap-3 rounded-xs px-2 py-1 font-mono text-xs leading-tight transition-colors duration-300
      {active ? 'bg-blue-100 text-accent' : n.kind ? 'text-muted' : 'text-ink'}
      {n.key ? 'cursor-pointer' : ''} {n.key && !active ? 'hover:bg-blue-50' : ''}"
    role={n.key ? "button" : undefined}
    tabindex={n.key ? 0 : undefined}
    onclick={n.key ? () => select(n.key!) : undefined}
    onkeydown={n.key
      ? (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            select(n.key!);
          }
        }
      : undefined}
  >
    <span class="shrink-0 {n.children ? 'font-medium' : ''} {n.kind === 'dim' ? 'italic' : ''}">{n.label}</span>
    <span class="flex min-w-0 items-baseline gap-2">
      {#if n.note}<span class="truncate text-right tabular-nums {active ? '' : 'text-muted'}" title={n.note}>{n.note}</span>{/if}
      <!-- where this part sits inside its parent: the 8 row groups march across the
           file in eighths; description fills almost all of its row group -->
      <span class="relative h-1.5 w-14 shrink-0 self-center overflow-hidden rounded-xs {parent && n.bytes !== undefined ? 'bg-line' : ''}">
        {#if parent && n.bytes !== undefined}
          <span
            class="absolute inset-y-0 {active ? 'bg-accent' : 'bg-blue-300'}"
            style="left: {(start / parent) * 100}%; width: max({n.bytes ? 1 : 0}px, {(n.bytes / parent) * 100}%)"
          ></span>
        {/if}
      </span>
    </span>
  </div>
  {#if n.children}
    <!-- The guide line marks everything inside this node; it turns blue with it. -->
    <div
      class="ml-3 flex flex-col gap-px border-l pl-3 transition-colors duration-300
        {active ? 'border-accent bg-blue-50/60' : 'border-line'}"
    >
      {#each n.children as c, i (i)}
        {@render box(c, n.bytes ?? 0, n.children.slice(0, i).reduce((t, x) => t + (x.bytes ?? 0), 0))}
      {/each}
    </div>
  {/if}
{/snippet}

<figure
  {@attach clock.observe}
  {@attach clock.run}
  class="flex flex-col gap-4 rounded-sm border border-line p-4"
>
  <StepControls {clock} labels={PARTS.map((p) => p.name)} />

  <div class="flex min-h-28 flex-col gap-1.5">
    <div class="flex flex-wrap items-baseline justify-between gap-x-3">
      <Text type="label" size="xs" color="accent">{clock.step + 1}/{PARTS.length} · {part.name}</Text>
      <Text type="paragraph" size="xs" color="muted">{part.size}</Text>
    </div>
    {#key part.key}
      <p class="caption font-mono text-sm leading-relaxed text-ink">{part.body}</p>
    {/key}
  </div>

  <div class="flex flex-col gap-px">
    {@render box(TREE, 0, 0)}
  </div>
</figure>

<style>
  .caption {
    animation: caption-in 400ms ease-out;
  }
  @keyframes caption-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .caption {
      animation: none;
    }
  }
</style>
