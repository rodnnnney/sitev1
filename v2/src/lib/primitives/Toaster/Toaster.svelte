<script lang="ts">
  import { Toaster as Sonner } from "svelte-sonner";

  type Props = ConstructorParameters<typeof Sonner>[0]["props"] extends infer P
    ? P
    : Record<string, unknown>;

  let { ...props }: Props = $props();
</script>

<Sonner
  position="top-right"
  closeButton
  toastOptions={{
    classes: {
      toast:
        "!font-mono !bg-paper !text-ink !border !border-line !rounded-md !shadow-[0_8px_30px_-6px_rgba(10,10,10,0.18)]",
      title: "!font-mono !text-sm !font-medium !text-ink",
      description: "!font-mono !text-xs !text-muted",
      actionButton: "!bg-accent !text-paper !font-mono !text-xs !rounded-sm",
      cancelButton: "!bg-line !text-ink !font-mono !text-xs !rounded-sm",
      closeButton: "!bg-paper !text-muted !border !border-line",
    },
  }}
  {...props}
/>
