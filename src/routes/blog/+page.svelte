<script lang="ts">
	import { blog } from '$lib/utils/consts';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import Header from '$lib/components/header.svelte';

	let visible = false;

	onMount(() => {
		visible = true;
	});
</script>

<Header />

<div class="min-h-screen text-white">
	<div class="mx-auto max-w-6xl p-12 px-40">
		<nav class="mb-8 flex items-center space-x-2 text-sm text-white">
			<a href="/">Home</a>
			<span>/</span>
			<a href="/blog" class="text-white transition-colors">Blog</a>
		</nav>

		<h1 class="mb-8 flex justify-start text-left text-3xl">Blog</h1>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
			{#each blog as blog, i}
				<div class="block">
					{#if visible}
						<a
							href="/blog/{blog.link}"
							class="block"
							in:fly={{
								y: 50,
								duration: 800,
								delay: i * 100,
								easing: quintOut
							}}
						>
							<div
								class="overflow-hidden rounded-lg bg-neutral-800 shadow-lg transition-colors hover:bg-neutral-700"
							>
								<img src={blog.cover_img} alt={blog.title} class="h-48 w-full object-cover" />
								<div class="p-6">
									<h2 class="mb-2 text-xl font-semibold">{blog.title}</h2>
									<p class="mb-4 text-sm text-gray-400">{blog.date}</p>
									<p class="text-gray-300">{blog.excerpt}</p>
								</div>
							</div>
						</a>
					{:else}
						<div class="overflow-hidden rounded-lg bg-neutral-800/50 shadow-lg">
							<div class="h-48 w-full bg-neutral-700/50"></div>
							<div class="p-6">
								<div class="mb-2 h-6 w-3/4 rounded bg-neutral-700/50"></div>
								<div class="mb-4 h-4 w-1/4 rounded bg-neutral-700/50"></div>
								<div class="h-4 w-full rounded bg-neutral-700/50"></div>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	@keyframes pulse {
		0%,
		100% {
			opacity: 0.5;
		}
		50% {
			opacity: 0.7;
		}
	}
</style>
