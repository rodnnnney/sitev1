<script lang="ts">
  import { Text, Page, Button } from "./primitives";

  let { path }: { path: string } = $props();

  function goBack() {
    if (history.length > 1) history.back();
    else location.href = "/";
  }
</script>

<Page title="404" label="not found" showTime>
  <Text size="sm" color="black">
    Nothing lives at <span class="text-accent">{path}</span> — either it never existed
    or a link rotted.
  </Text>

  <div class="flex items-center gap-2">
    <Button onclick={goBack}>← go back</Button>
    <Button variant="surface" href="/">home</Button>
  </div>
</Page>
