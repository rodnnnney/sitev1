<script lang="ts">
	import { projects, images } from '$lib/utils/consts';
	import {  fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import Header from '$lib/components/header.svelte';

	let currentImageIndex = 0;
	let interval: number;
	let visible = false;

	onMount(() => {
		visible = true;
		interval = setInterval(() => {
			currentImageIndex = (currentImageIndex + 1) % images.length;
		}, 5000);

		return () => {
			clearInterval(interval);
		};
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
			<h1 class="text-3xl">Projects</h1>
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
							<div class="h-64 w-full bg-neutral-700/50"></div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
	/>
</svelte:head>

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
