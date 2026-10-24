<script lang="ts">
  import { Page, Text } from "../primitives";
  import Anatomy from "./parquet/Anatomy.svelte";
  import ChunkWriter from "./parquet/ChunkWriter.svelte";
  import Comparison from "./parquet/Comparison.svelte";
  import QueryPrune from "./parquet/QueryPrune.svelte";
  import FileLayout from "./parquet/FileLayout.svelte";
</script>

<Page title="Parquet" showTime>
  <div class="flex flex-col gap-8">
    <Text type="paragraph" size="sm" color="black">
      If there is one file format that has laid the foundation for the modern
      data stack, it would be Parquet. The idea originates from a paper
      published in 2010 at Google that proposed a columnar storage format for
      data in the cloud. Like many research papers that come out of Google, it
      intentionally/unintentionally shaped the future of data storage. Today,
      Parquet is file format of choice for big data companies in the world.
      Excluding the major cloud providers, some of the most successful companies
      such as Snowflake, Databricks and Palantir are built on top of Parquet.
      Their combined fortunes sum up to around ~$800 billion dollars as of Oct
      23 2026. Here is a deeper dive into the internals on how Parquet is built
      and solves the problem of data storage and retrieval at the largest of
      scales.
    </Text>

    <FileLayout />

    <Text type="heading" size="2xl" color="black">The parts</Text>

    <Text type="paragraph" size="sm" color="black">
      Zoomed in, every Parquet file is the same set of nested pieces. Click any
      of them to stop on it.
    </Text>

    <Anatomy />

    <Text type="heading" size="2xl" color="black">Writing a column chunk</Text>

    <Text type="paragraph" size="sm" color="black">
      Here's one column being written. Watch where each value goes: the
      dictionary, the page buffer, and finally the bytes on disk.
    </Text>

    <ChunkWriter />

    <Text type="heading" size="2xl" color="black">Before and after</Text>

    <Text type="paragraph" size="sm" color="black">
      The same sixteen values, as they came in and as they ended up on disk.
    </Text>

    <Comparison />

    <Text type="heading" size="2xl" color="black">Querying it</Text>

    <Text type="paragraph" size="sm" color="black">
      What's the average temperature in Lima, counting only readings above 30°?
    </Text>

    <QueryPrune />

    <Text type="footnote" size="xs" color="muted">
      A caveat on that comparison: it isn't how you'd use an OLTP database like
      Postgres. Those are built for reading and writing individual rows, usually
      through an index, and real tables have dozens of columns, not three.
      Aggregating one column across a whole table is analytics work, and the
      warehouses built for it store data by column too.
    </Text>
  </div>
</Page>
