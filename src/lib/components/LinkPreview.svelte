<script lang="ts">
	import { ExternalLink } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	export let href: string;
	export let position: 'left' | 'right' | 'center' = 'center';
	export let variant: 'inline' | 'block' = 'inline';
	export let customPreview: { title: string; description: string; image?: string } | null = null;
	export let iconOnly: boolean = false;

	let isHovered = false;
	let timeoutId: ReturnType<typeof setTimeout>;
	let preview: { title: string; description: string; image?: string } | null = null;
	let loading = false;
	let fetched = false;
	let containerEl: HTMLElement;
	let tooltipX = 0;
	let tooltipY = 0;
	let showBelow = false;

	async function fetchPreview() {
		if (fetched) return;
		fetched = true;

		if (customPreview?.image) {
			preview = customPreview;
			return;
		}

		loading = true;

		try {
			const res = await fetch(`/api/preview?url=${encodeURIComponent(href)}`);
			const data = await res.json();
			if (!data.error) {
				if (customPreview) {
					preview = {
						title: customPreview.title,
						description: customPreview.description,
						image: data.image
					};
				} else {
					preview = data;
				}
			} else if (customPreview) {
				preview = customPreview;
			}
		} catch (e) {
			console.error('Failed to fetch preview:', e);
			if (customPreview) {
				preview = customPreview;
			}
		} finally {
			loading = false;
		}
	}

	function updateTooltipPosition() {
		if (!containerEl) return;

		const rect = containerEl.getBoundingClientRect();
		const tooltipWidth = variant === 'block' ? 256 : 288;
		const tooltipHeight = variant === 'block' ? 80 : 220;
		const padding = 8;

		// Check if there's enough space above
		showBelow = rect.top < tooltipHeight + padding;

		if (variant === 'block') {
			if (showBelow) {
				tooltipY = rect.bottom + padding;
			} else {
				tooltipY = rect.top - padding;
			}

			if (position === 'left') {
				tooltipX = rect.right - tooltipWidth;
			} else if (position === 'right') {
				tooltipX = rect.left;
			} else {
				tooltipX = rect.left + rect.width / 2 - tooltipWidth / 2;
			}

			const viewportWidth = window.innerWidth;
			if (tooltipX < padding) {
				tooltipX = padding;
			} else if (tooltipX + tooltipWidth > viewportWidth - padding) {
				tooltipX = viewportWidth - tooltipWidth - padding;
			}
		}
	}

	function handleMouseEnter() {
		clearTimeout(timeoutId);
		fetchPreview();
		updateTooltipPosition();
		timeoutId = setTimeout(() => {
			isHovered = true;
		}, variant === 'block' ? 50 : 300);
	}

	function handleMouseLeave() {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			isHovered = false;
		}, 100);
	}

	$: positionClass = {
		left: 'right-0',
		right: 'left-0',
		center: 'left-1/2 -translate-x-1/2'
	}[position];
</script>

{#if variant === 'block'}
<div class="relative flex-shrink-0 group">
	<a
		{href}
		target="_blank"
		rel="noopener noreferrer"
		class="block"
	>
		<slot />
	</a>
	{#if customPreview}
		<div
			class="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[9999] rounded-lg border border-neutral-700 bg-neutral-800 shadow-xl overflow-hidden w-64"
			role="tooltip"
		>
			<div class="p-2">
				<p class="text-xs font-title text-white">{customPreview.title}</p>
				<p class="text-xs mt-0.5 text-[#d0d0d0]">{customPreview.description}</p>
			</div>
		</div>
	{/if}
</div>
{:else}
<span class="relative inline-block" bind:this={containerEl}>
	<a
		{href}
		target="_blank"
		rel="noopener noreferrer"
		class={iconOnly ? "inline-flex items-center" : "text-blue-400 underline hover:text-blue-300"}
		on:mouseenter={handleMouseEnter}
		on:mouseleave={handleMouseLeave}
	>
		<slot />
		{#if !iconOnly}
			<ExternalLink size={10} class="inline" />
		{/if}
	</a>
	{#if isHovered}
		<div
			transition:fade={{ duration: 150 }}
			class="absolute {showBelow ? 'top-full mt-2' : 'bottom-full mb-2'} {positionClass} z-[9999] rounded-lg border border-neutral-700 bg-neutral-800 shadow-xl overflow-hidden w-72"
			on:mouseenter={handleMouseEnter}
			on:mouseleave={handleMouseLeave}
			role="tooltip"
		>
			{#if loading}
				<div class="p-4 text-center">
					<div class="animate-pulse text-gray-400 text-sm">Loading preview...</div>
				</div>
			{:else if preview}
				{#if preview.image}
					<img
						src={preview.image}
						alt={preview.title || ''}
						class="w-full h-32 object-cover"
						on:error={(e: Event) => (e.target as HTMLImageElement).style.display = 'none'}
					/>
				{/if}
				<div class="p-3">
					{#if preview.title}
						<p class="text-sm font-title text-white">{preview.title}</p>
					{/if}
					{#if preview.description}
						<p class="text-xs mt-1 line-clamp-3 text-[#d0d0d0]">{preview.description}</p>
					{/if}
				</div>
			{:else}
				<div class="p-3">
					<p class="text-sm text-gray-400">Preview unavailable</p>
				</div>
			{/if}
		</div>
	{/if}
</span>
{/if}
