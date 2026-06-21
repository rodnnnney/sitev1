import { writable } from 'svelte/store'

function isDebug() {
  return new URLSearchParams(window.location.search).has('debug')
}

export const debugStore = writable(isDebug())
