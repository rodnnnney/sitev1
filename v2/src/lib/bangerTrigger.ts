import { writable } from "svelte/store";

/** Current track for home “now playing” copy; null when idle. */
export const bangerNow = writable<{ title: string; artist: string } | null>(
  null,
);

type Handler = () => void;
let handler: Handler | null = null;

/** RandomBanger registers its toggle/play handler here. Returns unsubscribe. */
export function onBangerPlayRequest(fn: Handler): () => void {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}

/** Home (or anyone) calls this to trigger the same action as the old secret button. */
export function requestBangerPlay(): void {
  handler?.();
}
