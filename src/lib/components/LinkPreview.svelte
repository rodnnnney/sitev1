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

	async function fetchPreview() {
		if (fetched) return;
		fetched = true;

		// If customPreview has all data including image, use it directly
		if (customPreview?.image) {
			preview = customPreview;
			return;
		}

		loading = true;

		try {
			const res = await fetch(`/api/preview?url=${encodeURIComponent(href)}`);
			const data = await res.json();
			if (!data.error) {
				// If customPreview is set, use custom title/description but keep fetched image
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
		if (containerEl && variant === 'block') {
			const rect = containerEl.getBoundingClientRect();
			tooltipY = rect.top - 8;
			if (position === 'left') {
				tooltipX = rect.right - 288;
			} else if (position === 'right') {
				tooltipX = rect.left;
			} else {
				tooltipX = rect.left + rect.width / 2 - 144;
			}
		}
	}

	function handleMouseEnter() {
		clearTimeout(timeoutId);
		fetchPreview();
		updateTooltipPosition();
		timeoutId = setTimeout(() => {
			isHovered = true;
		}, 300);
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
<div
	class="relative"
	bind:this={containerEl}
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
	role="button"
	tabindex="0"
	on:keydown={(e) => e.key === 'Enter' && window.open(href, '_blank')}
>
	<a
		{href}
		target="_blank"
		rel="noopener noreferrer"
		class="block"
	>
		<slot />
	</a>
	{#if isHovered}
		<div
			transition:fade={{ duration: 150 }}
			class="fixed z-[9999] rounded-lg border border-neutral-700 bg-neutral-800 shadow-xl overflow-hidden w-72"
			style="left: {tooltipX}px; top: {tooltipY}px; transform: translateY(-100%);"
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
</div>
{:else}
<span class="relative inline-block">
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
			class="absolute bottom-full {positionClass} mb-2 z-[9999] rounded-lg border border-neutral-700 bg-neutral-800 shadow-xl overflow-hidden w-72"
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
