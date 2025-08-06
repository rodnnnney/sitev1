<script lang="ts">
	import { blogs, projects } from '$lib/utils/consts';
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
	<div class="mx-auto max-w-6xl p-4 sm:p-8 lg:p-12">
		<nav class="mb-8 flex items-center space-x-2 text-sm text-white">
			<a href="/">Home</a>
			<span>/</span>
			<a href="/projects" class="text-white transition-colors">Projects</a>
		</nav>

		<div class="mb-8 flex flex-row items-end justify-start">
			<h1 class="text-3xl font-bold">Projects</h1>
		</div>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
			{#each projects as project, i}
				<div class="block">
					{#if visible}
						<a
							href={project.link}
							target="_blank"
							rel="noopener noreferrer"
							class="block"
							in:fly={{
								y: 50,
								duration: 800,
								delay: i * 100,
								easing: quintOut
							}}
						>
							<div
								class="group relative overflow-hidden rounded-lg bg-neutral-800 shadow-lg transition-colors hover:bg-neutral-700"
							>
								<img src={project.src} alt={project.name} class="h-64 w-full object-cover" />
								<div
									class="absolute inset-0 flex items-center justify-center bg-white/20 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
								>
									<p class="px-4 text-center text-left text-black">{project.description}</p>
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
