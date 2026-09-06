<script lang="ts">
  import { Page, Text } from "./primitives";
  import { likes } from "./consts";
  import { sortLikes } from "./likesSort";

  const sorted = sortLikes(likes);
</script>

<Page title="Inconclusive list of things I like" showTime>
  <ol class="list-decimal space-y-1 pl-5">
    {#each sorted as item (item)}
      <li>
        <Text size="sm" color="black">{item}</Text>
      </li>
    {/each}
  </ol>
</Page>
