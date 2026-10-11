<script lang="ts">
  import { Page, Text } from "../primitives";
  import Anatomy from "./parquet/Anatomy.svelte";
  import FileLayout from "./parquet/FileLayout.svelte";
</script>

<Page title="Parquet, from the bytes up" showTime>
  <div class="flex flex-col gap-8">
    <Text type="paragraph" size="sm" color="black">
      Parquet is the file format under most of the modern data stack. Spark,
      DuckDB, Snowflake, and every lakehouse table you've touched read and write
      it. Before getting into how it squeezes data down, it's worth seeing what
      one actually looks like on disk.
    </Text>

    <FileLayout />

    <Text type="heading" size="2xl" color="black">The parts</Text>

    <Text type="paragraph" size="sm" color="black">
      Zoomed in, every Parquet file is the same set of nested pieces. Click any
      of them to stop on it.
    </Text>

    <Anatomy />

    <Text type="paragraph" size="sm" color="black">
      Next: what happens inside those pages. Dictionary encoding, run-length
      encoding, and bit-packing.
    </Text>
  </div>
</Page>
