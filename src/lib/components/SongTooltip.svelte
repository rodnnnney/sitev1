<script lang="ts">
	import { onMount } from 'svelte';

	export let title: string;
	export let description: string;
	export let triggerEl: HTMLElement | null = null;
	export let visible: boolean = false;

	let tooltipEl: HTMLDivElement;
	let x = 0;
	let y = 0;

	$: if (visible && triggerEl && tooltipEl) {
		const rect = triggerEl.getBoundingClientRect();
		x = rect.left + rect.width / 2;
		y = rect.top - 8;
	}
</script>

{#if visible}
	<div
		bind:this={tooltipEl}
		class="fixed z-[99999] rounded-lg border border-neutral-700 bg-neutral-800 shadow-xl overflow-hidden w-64 -translate-x-1/2 -translate-y-full pointer-events-none"
		style="left: {x}px; top: {y}px;"
		role="tooltip"
	>
		<div class="p-2">
			<p class="text-xs font-title text-white">{title}</p>
			<p class="text-xs mt-0.5 text-[#d0d0d0]">{description}</p>
		</div>
	</div>
{/if}
