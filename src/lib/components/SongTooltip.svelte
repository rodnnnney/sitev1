<script lang="ts">
	export let title: string;
	export let description: string = '';
	export let image: string = '';
	export let triggerEl: HTMLElement | null = null;
	export let visible: boolean = false;
	export let position: 'above' | 'left' | 'right' = 'above';

	let tooltipEl: HTMLDivElement;
	let x = 0;
	let y = 0;

	$: if (visible && triggerEl) {
		const rect = triggerEl.getBoundingClientRect();
		if (position === 'left') {
			x = rect.left - 8;
			y = rect.top + rect.height / 2;
		} else if (position === 'right') {
			x = rect.right + 8;
			y = rect.top + rect.height / 2;
		} else {
			x = rect.left + rect.width / 2;
			y = rect.top - 8;
		}
	}

	$: transformClass =
		position === 'left'
			? '-translate-x-full -translate-y-1/2'
			: position === 'right'
				? '-translate-y-1/2'
				: '-translate-x-1/2 -translate-y-full';
</script>

{#if visible}
	<div
		bind:this={tooltipEl}
		class="pointer-events-none fixed z-[99999] overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800 shadow-xl {transformClass}"
		class:w-64={!image}
		class:w-72={image}
		style="left: {x}px; top: {y}px;"
		role="tooltip"
	>
		{#if image}
			<img src={image} alt={title} class="h-32 w-full object-cover" />
		{/if}
		<div class="p-2">
			<p class="font-title text-xs text-white">{title}</p>
			{#if description}
				<p class="mt-0.5 text-xs text-[#d0d0d0]">{description}</p>
			{/if}
		</div>
	</div>
{/if}
