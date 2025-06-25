<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { images, projects, experiences, blogs, rodney, shen, bangers } from '$lib/utils/consts';
	import { Github, Twitter } from 'lucide-svelte';
	
	let currentImageIndex = 0;
	let interval: number;
	let currentProjectIndex = 0;
	let interval1: number;
	let isLoading = true;

	// Navigation functions for images carousel
	function nextImage() {
		currentImageIndex = (currentImageIndex + 1) % images.length;
		resetImageInterval();
	}

	function prevImage() {
		currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
		resetImageInterval();
	}

	function resetImageInterval() {
		clearInterval(interval);
		interval = setInterval(() => {
			currentImageIndex = (currentImageIndex + 1) % images.length;
		}, 5000);
	}

	// Navigation functions for projects carousel
	function nextProject() {
		currentProjectIndex = (currentProjectIndex + 1) % projects.length;
		resetProjectInterval();
	}

	function prevProject() {
		currentProjectIndex = (currentProjectIndex - 1 + projects.length) % projects.length;
		resetProjectInterval();
	}

	function resetProjectInterval() {
		clearInterval(interval1);
		interval1 = setInterval(() => {
			currentProjectIndex = (currentProjectIndex + 1) % projects.length;
		}, 10000);
	}

	onMount(() => {
		setTimeout(() => {
			isLoading = false;
		}, 1000);

		interval = setInterval(() => {
			currentImageIndex = (currentImageIndex + 1) % images.length;
		}, 5000);

		interval1 = setInterval(() => {
			currentProjectIndex = (currentProjectIndex + 1) % projects.length;
		}, 10000);

		return () => {
			clearInterval(interval);
			clearInterval(interval1);
		};
	});
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<title>Rodney Shen</title>
	<link rel="icon" href="/pfp12.png" type="image/x-icon" />
	<meta name="description" content="Rodney Shen's personal website" />
	<meta
		name="keywords"
		content="Rodney Shen, Rodney, Shen, website, personal website, portfolio, blog, projects, experience, about me, contact"
	/>
	<meta name="author" content="Rodney Shen" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="robots" content="index, follow" />
	<meta name="googlebot" content="index, follow" />
</svelte:head>

{#if isLoading}
	<div class="loading-screen" transition:fade={{ duration: 1000 }}>
		<div class="ascii-art">
			<pre class="rodney">{rodney}</pre>
			<pre class="shen">{shen}</pre>
		</div>
	</div>
{:else}
	<div
		class="bg-f1eee9 flex min-h-screen items-center justify-center p-8 text-white"
		transition:fade={{ duration: 800 }}
	>
		<div
			class="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 md:grid-cols-3"
			transition:fly={{ y: -50, duration: 1200, delay: 800 }}
		>
			<!-- Left Column -->
			<div class="mt-24 space-y-6" transition:fly={{ y: -50, duration: 1200, delay: 1000 }}>
				<!-- Profile Card -->
				<div
					class="rounded-lg bg-neutral-800 p-6 shadow-sm"
					transition:fly={{ y: -30, duration: 1000, delay: 1100 }}
				>
					<div class="flex items-center">
						<div class="flex w-full flex-row justify-between">
							<div class="font-mono text-xl font-bold">Rodney Shen</div>

							<div class="flex gap-4">
								<a href="https://github.com/rodnnnney" target="_blank">
									<Github size={24} class="invert" />
								</a>
								<a href="https://x.com/992rodney" target="_blank">
									<Twitter size={24} class="invert" />
								</a>
							</div>
						</div>
					</div>
					<div class="mt-4 flex flex-row items-start">
						<img
							src="/logo.jpg"
							alt="Carleton"
							class="mt-2 mr-2 h-10 w-10 rounded-full object-cover"
						/>
						<div class="flex flex-col">
							<p class="font-semibold">Computer Science @ Carleton University</p>
							<div class="mt-1 mb-1 w-full border-b border-gray-300"></div>
							<p class="text-left text-xs text-black text-gray-500">
								🤏 close to dropping out (sorry mom!)
							</p>
						</div>
					</div>
				</div>

				<!-- HAND -->
				<div class="bg-neutral" transition:fly={{ y: -30, duration: 1000, delay: 1200 }}>
					<div class="w-full object-cover">
						<img src="/hand.png" alt="" class="h-full w-full rounded-lg object-cover" />
					</div>
				</div>
				<!-- About Card -->
				<div
					class="rounded-lg bg-neutral-800 p-6 shadow-sm"
					transition:fly={{ y: -30, duration: 1000, delay: 1300 }}
				>
					<h3 class="mb-4 font-mono text-xl font-bold">About Me</h3>

					<div class="flex-row-2 flex">
						<p class="text-left text-sm text-gray-300">
							I'm Rodney, I'm passionate about building cool tech that advances society. Currently,
							I'm bouncing between Toronto/NYC/Ottawa.
							<br /><br />
							At Carleton, I racked up ~1k in parking tickets and founded the blockchain club. We grew
							it from 0-200 in ~1 semester hosting 6 unforgettable events.
							<br /><br />
							Outside of school and work, I like to clear my head with runs, listen to music, hang out
							with friends and travel the world.
						</p>
					</div>
				</div>
			</div>

			<!-- Middle Column -->
			<div class="space-y-6" transition:fly={{ y: -50, duration: 1200, delay: 1200 }}>
				<!-- Blogs Card -->
				<div
					class="rounded-lg bg-neutral-800 p-6 shadow-sm relative"
					transition:fly={{ y: -30, duration: 1000, delay: 1300 }}
				>
					<div class="flex flex-row justify-between">
						<h3 class="mb-4 font-mono text-xl font-bold">Blogs</h3>
						<a href="/blogs" class="text-sm text-white absolute top-4 mt-4 right-4 z-30 bg-gradient-to-r from-neutral-800 to-gray-800 rounded-md px-3 border border-gray-500 rainbow-border">View All</a>
					</div>
					
					<div class="space-y-4">
						{#each blogs as blog}
							<a href="/blogs/{blog.link}" class="block">
								<div
									class="border-b border-neutral-700 pb-4 transition-colors hover:bg-neutral-700"
								>
									<h4 class="text-md font-semibold">{blog.title}</h4>
									<p class="text-sm text-sm text-gray-400">{blog.date}</p>
									<p class="mt-2 text-sm text-gray-300">{blog.excerpt}</p>
								</div>
							</a>
						{/each}
					</div>
				</div>

				<!-- Song Marquee -->
				<div
					class="overflow-hidden rounded-lg bg-neutral-800 p-2 shadow-sm"
					transition:fly={{ y: -30, duration: 1000, delay: 1500 }}
				>
					<div class="animate-marquee flex flex-row gap-2 whitespace-nowrap">
						{#each bangers as banger}
							<a class="flex-shrink-0 transition-opacity hover:opacity-75" href={banger.link}>
								<div class="relative h-18 w-18">
									<img
										src={banger.cover_img}
										alt={banger.title || 'Album cover'}
										class="rounded-lg object-cover"
									/>
								</div>
							</a>
						{/each}
						{#each bangers as banger}
							<a class="flex-shrink-0 transition-opacity hover:opacity-75" href={banger.link}>
								<div class="relative h-18 w-18">
									<img
										src={banger.cover_img}
										alt={banger.title || 'Album cover'}
										class="rounded-lg object-cover"
									/>
								</div>
							</a>
						{/each}
					</div>
				</div>

				<div class="relative h-128" transition:fly={{ y: -30, duration: 1000, delay: 1400 }}>
					<img
						src="/apples.webp"
						alt="apple images"
						class="absolute top-4 right-4 z-1000 h-12 w-12"
					/>

					{#each images as image, i}
						{#if i === currentImageIndex}
							<img
								src={image.src}
								alt={image.alt}
								class="absolute h-full w-full rounded-lg object-cover"
								transition:fade={{ duration: 500 }}
							/>
						{/if}
					{/each}

					<!-- Navigation buttons for images -->
					<button
						class="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full p-2 text-white transition-all hover:scale-105"
						on:click={prevImage}
						aria-label="Previous image"
					>
						<i class="fas fa-chevron-left"></i>
					</button>
					<button
						class="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full p-2 text-white transition-all hover:scale-105"
						on:click={nextImage}
						aria-label="Next image"
					>
						<i class="fas fa-chevron-right"></i>
					</button>

					<div class="absolute right-0 bottom-4 left-0 flex justify-center space-x-2">
						{#each images as _, i}
							<div
								class="h-1 w-10 rounded-full transition-colors duration-300"
								class:bg-white={i === currentImageIndex}
								class:bg-gray-500={i !== currentImageIndex}
							></div>
						{/each}
					</div>

					<div class="absolute top-5 left-5 flex justify-center space-x-2">
						{#each images as image, i}
							{#if i === currentImageIndex}
								<div class="text-bold text-sm text-white">{image.description}</div>
							{/if}
						{/each}
					</div>
				</div>
			</div>

			<!-- Right Column -->
			<div class="space-y-6" transition:fly={{ y: -100, duration: 1200, delay: 1400 }}>
				<!-- Experience Card -->
				<div
					class="rounded-lg bg-neutral-800 p-6 shadow-sm"
					transition:fly={{ y: -50, duration: 1000, delay: 1700 }}
				>
					<h3 class="mb-4 font-mono text-xl font-bold">Experience</h3>
					<div class="custom-scrollbar max-h-[300px] space-y-4 overflow-y-auto">
						{#each experiences as exp}
							<div class="flex flex-col">
								<div class="flex flex-row items-center">
									<img src={exp.logo} alt="" class="mt-2 mr-2 h-10 w-10 object-cover" />
									<div>
										<h4 class="font-semibold">{exp.title}</h4>
										<p class="text-sm text-gray-400">{exp.company} • {exp.period}</p>
									</div>
								</div>
								<div class="mt-2 border-b border-neutral-700 pb-4">
									<p class="text-gray-300">{exp.description}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="relative h-112" transition:fly={{ y: -30, duration: 1000, delay: 1600 }}>
					<a href="/projects" class="text-sm text-black absolute top-4 right-4 z-30 bg-gradient-to-r from-neutral-400 to-gray-200 rounded-md px-3 border border-gray-400 rainbow-border">View All</a>
					{#each projects as project, i}
						{#if i === currentProjectIndex}
							<a href={project.link} target="_blank" class="transition-opacity hover:opacity-95">
								<img
									src={project.src}
									alt={project.name}
									class="absolute rounded-lg object-cover"
									transition:fade={{ duration: 750 }}
								/>
							</a>
						{/if}
					{/each}

					<!-- Navigation buttons for projects -->
					<button
						class="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full p-2 text-white transition-all hover:scale-105"
						on:click={prevProject}
						aria-label="Previous project"
					>
						<i class="fas fa-chevron-left"></i>
					</button>
					<button
						class="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full p-2 text-white transition-all hover:scale-105"
						on:click={nextProject}
						aria-label="Next project"
					>
						<i class="fas fa-chevron-right"></i>
					</button>

					<!-- Progress Indicator -->
					<div class="absolute right-0 bottom-4 left-0 flex justify-center space-x-2">
						{#each projects as _, i}
							<div
								class="h-1 w-10 rounded-full transition-colors duration-300"
								class:bg-white={i === currentProjectIndex}
								class:bg-gray-500={i !== currentProjectIndex}
							></div>
						{/each}
					</div>

					<div class="absolute top-0 left-0 flex justify-center space-x-2 p-4">
						{#each projects as project, i}
							{#if i === currentProjectIndex}
								<div class="flex flex-col">
									<div class="text-lg font-bold text-black">{project.name}</div>
									<div class="text-sm text-black">{project.description}</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>
				<div class="text-center text-white text-lg text-xs font-mono mt-12 md:hidden">
					Check out my other <a href="https://cu-webring.org/" target="_blank" class="underline">cracked friends</a> 
				</div>
			
			</div>
		</div>
	</div>
	
	<!-- Hi text after all content -->
	
<!-- Hi text positioned absolutely for desktop -->
<div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xs text-grey-400 font-mono z-50 hidden md:block" transition:fly={{ y: -30, duration: 1000, delay: 3000 }}>
	Check out my other <a href="https://cu-webring.org/" target="_blank" class="underline italic">cracked friends</a> 
</div>
{/if}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont, 
			'Segoe UI',
			Roboto,
			sans-serif;
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		background: #1a1a1a url('/bg.jpeg') no-repeat center center fixed;
		background-size: cover;
	}

	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
		opacity: 0;
	}

	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
		border-radius: 3px;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: transparent;
		border-radius: 3px;
	}

	.custom-scrollbar:hover::-webkit-scrollbar-thumb {
		background: #ababab;
	}

	.custom-scrollbar:focus::-webkit-scrollbar-thumb {
		background: #ababab;
	}

	.loading-screen {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;
		background-color: #1a1a1a;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		gap: 2rem;
	}

	.ascii-art {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		color: white;
		font-family: monospace;
		font-size: 12px;
		line-height: 1;
		white-space: pre;
	}

	.ascii-art pre {
		margin: 0;
		padding: 0;
	}

	@keyframes marquee {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}

	.animate-marquee {
		animation: marquee 20s linear infinite;
	}


	.rainbow-border {
		transition: all 0.3s ease;
	}

	.rainbow-border:hover {
		transform: scale(1.02);
	}

	.svg-draw-bg {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		z-index: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		opacity: 0.25;
	}
	.svg-bg-img {
		width: 80vw;
		height: auto;
		max-width: 830px;
		max-height: 587px;
		display: block;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		user-select: none;
	}
	.svg-draw-overlay {
		width: 80vw;
		height: auto;
		max-width: 830px;
		max-height: 587px;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		user-select: none;
	}
	.svg-draw-rect {
		stroke-dasharray: 2834;
		stroke-dashoffset: 2834;
		animation: draw-rect 2.5s cubic-bezier(0.77,0,0.175,1) 0.5s forwards;
	}
	@keyframes draw-rect {
		to {
			stroke-dashoffset: 0;
		}
	}
</style>
