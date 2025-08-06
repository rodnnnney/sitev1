<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { images, projects, experiences, blogs, rodney, bangers } from '$lib/utils/consts';
	import { Github, Twitter } from 'lucide-svelte';
	import Header from '$lib/components/header.svelte';
	import GitHubContributions from '$lib/components/GitHubContributions.svelte';

	let currentImageIndex = 0;
	let interval: number;
	let currentProjectIndex = 0;
	let interval1: number;
	let isLoading = true;

	// Job title rotation
	const jobTitles = [
		'intern of Technical Staff',
		'intern of Recruiting Staff',
		'intern of Growth Staff',
		'intern of Waste Disposal Staff',
		'intern of Acting Staff',
		'intern of Design Staff'
	];
	let currentJobTitleIndex = 0;
	let jobTitleInterval: number;

	// Animation timing constants
	const BASE_DELAY = 1000;
	const DELAY_INCREMENT = 100;

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

		jobTitleInterval = setInterval(() => {
			currentJobTitleIndex = (currentJobTitleIndex + 1) % jobTitles.length;
		}, 2500);

		return () => {
			clearInterval(interval);
			clearInterval(interval1);
			clearInterval(jobTitleInterval);
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
		</div>
	</div>
{:else}
	<div transition:fly={{ y: -50, duration: 800, delay: BASE_DELAY + DELAY_INCREMENT * 15 }}
	class="lg:mb-18">
		<Header />
	</div>
	<div
		class="bg-f1eee9 flex min-h-screen w-full p-2 text-white sm:p-3 lg:h-screen lg:overflow-hidden lg:p-4"
		transition:fade={{ duration: 800 }}
	>
		<div
			class="mx-auto grid h-full w-full max-w-7xl grid-cols-1 items-center gap-2 sm:gap-3 lg:grid-cols-3 lg:gap-4"
			transition:fly={{ y: -30, duration: 1000, delay: 600 }}
		>
			<!-- Left Column -->
			<div
				class="flex h-full flex-col space-y-2 pt-6 sm:space-y-2"
				transition:fly={{ x: -50, y: -20, duration: 1000, delay: BASE_DELAY }}
			>
				<!-- Profile Card -->
				<div
					class="rounded-lg bg-neutral-800 p-2 shadow-sm sm:p-3"
					transition:fly={{
						x: -30,
						y: -30,
						duration: 800,
						delay: BASE_DELAY + DELAY_INCREMENT * 3
					}}
				>
					<div class="flex items-center">
						<div class="flex w-full flex-row justify-between">
							<div class="font-mono text-sm font-bold sm:text-base">Education</div>
						</div>
					</div>
					<div class="mt-2 flex flex-row items-start sm:mt-3">
						<img
							src="/logo.jpg"
							alt="Carleton"
							class="mt-1 mr-2 h-6 w-6 rounded-full object-cover sm:h-8 sm:w-8"
						/>
						<div class="flex flex-col">
							<p class="text-xs font-semibold sm:text-sm">Computer Science @ Carleton University</p>
							<div class="mt-1 mb-1 w-full border-b border-gray-300"></div>
							<p class="text-left text-xs text-gray-500">
								🤏 close to dropping out - Exp Grad 2027
							</p>
						</div>
					</div>
				</div>

				<div
					class="rounded-lg bg-neutral-800 p-2 shadow-sm sm:p-3"
					transition:fly={{ x: -30, y: 30, duration: 800, delay: BASE_DELAY }}
				>
					<h3 class="mb-2 font-mono text-sm font-bold sm:mb-3 sm:text-base">About Me</h3>

					<div class="flex-row-2 flex">
						<p class="text-left text-xs text-gray-300 sm:text-sm">
							I'm Rodney, I'm passionate about building cool tech that advances society. Currently,
							I'm bouncing between Toronto/NYC/Ottawa.
							<br /><br />
							In the fall, I'll be joining <a href="https://textql.com/">TextQL</a> as an intern of
							technical staff where I will be building data science agents.
							<br /><br />
							At Carleton, I founded
							<a class="underline" href="https://carletonblockchain.ca/">Carleton Blockchain</a>. We
							grew it from 0-200 club members in ~1 semester hosting 6 unforgettable events. I also
							racked up ~1k in parking tickets.
						</p>
					</div>
				</div>

				<!-- GitHub Contributions Card -->
				<div
					class="rounded-lg bg-neutral-800 p-2 shadow-sm sm:p-3"
					transition:fly={{ x: -30, y: 30, duration: 800, delay: BASE_DELAY + DELAY_INCREMENT * 2 }}
				>
					<GitHubContributions />
				</div>

				<!-- Contact Me Card -->
				<div
					class="rounded-lg bg-neutral-800 p-2 shadow-sm sm:p-3"
					transition:fly={{ x: -30, y: 30, duration: 800, delay: BASE_DELAY + DELAY_INCREMENT * 1 }}
				>
					<h3 class="mb-2 font-mono text-sm font-bold sm:mb-3 sm:text-base">Contact Me</h3>

					<div class="space-y-2 sm:space-y-3">
						<!-- Twitter/X -->
						<a
							href="https://x.com/992rodney"
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center space-x-2 rounded-md p-2 transition-colors hover:bg-neutral-700"
						>
							<i class="fab fa-twitter text-gray-400"></i>
							<span class="text-xs text-gray-300 sm:text-sm">992rodney</span>
						</a>

						<!-- GitHub -->
						<a
							href="https://github.com/rodnnnney"
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center space-x-2 rounded-md p-2 transition-colors hover:bg-neutral-700"
						>
							<i class="fab fa-github text-gray-400"></i>
							<span class="text-xs text-gray-300 sm:text-sm">rodnnnney</span>
						</a>
					</div>
				</div>
			</div>

			<!-- Middle Column -->
			<div
				class="flex h-full flex-col space-y-2 sm:space-y-2"
				transition:fly={{ y: -30, duration: 1000, delay: BASE_DELAY + DELAY_INCREMENT * 2 }}
			>
				<!-- Blogs Card -->
				<div
					class="relative rounded-lg bg-neutral-800 p-2 shadow-sm sm:p-3"
					transition:fly={{ y: -30, duration: 800, delay: BASE_DELAY + DELAY_INCREMENT * 4 }}
				>
					<div class="flex flex-row justify-between">
						<h3 class="mb-2 font-mono text-sm font-bold sm:mb-3 sm:text-base">Blogs</h3>
					</div>

					<div class="space-y-2 sm:space-y-3">
						{#each blogs as blog}
							<a href="/blogs/{blog.link}" class="block">
								<div
									class="border-b border-neutral-700 pb-2 transition-colors hover:bg-neutral-700 sm:pb-3"
								>
									<h4 class="text-xs font-semibold sm:text-sm">{blog.title}</h4>
									<p class="text-xs text-gray-400">{blog.date}</p>
									<p class="mt-1 text-xs text-gray-300">{blog.excerpt}</p>
								</div>
							</a>
						{/each}
					</div>
				</div>

				<!-- Song Marquee -->
				<div
					class="overflow-hidden rounded-lg bg-neutral-800 p-1 shadow-sm"
					transition:fly={{ y: 30, duration: 800, delay: BASE_DELAY + DELAY_INCREMENT * 8 }}
				>
					<div class="animate-marquee flex flex-row gap-1 whitespace-nowrap">
						{#each bangers as banger}
							<a class="flex-shrink-0 transition-opacity hover:opacity-75" href={banger.link}>
								<div class="relative h-12 w-12 sm:h-16 sm:w-16">
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
								<div class="relative h-12 w-12 sm:h-16 sm:w-16">
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

				<div
					class="relative min-h-128"
					transition:fly={{
						y: 30,
						duration: 800,
						delay: BASE_DELAY + DELAY_INCREMENT * 9
					}}
				>
					{#each projects as project, i}
						{#if i === currentProjectIndex}
							<a href={project.link} target="_blank" class="transition-opacity hover:opacity-95">
								<img
									src={project.src}
									alt={project.name}
									class="absolute inset-0 h-full w-full rounded-lg object-cover"
									transition:fade={{ duration: 750 }}
								/>
							</a>
						{/if}
					{/each}

					<!-- Navigation buttons for projects -->
					<button
						class="absolute top-1/2 left-2 z-20 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white transition-all hover:scale-105 hover:bg-black/40"
						on:click={prevProject}
						aria-label="Previous project"
					>
						<i class="fas fa-chevron-left text-sm"></i>
					</button>
					<button
						class="absolute top-1/2 right-2 z-20 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white transition-all hover:scale-105 hover:bg-black/40"
						on:click={nextProject}
						aria-label="Next project"
					>
						<i class="fas fa-chevron-right text-sm"></i>
					</button>

					<!-- Progress Indicator -->
					<div class="absolute bottom-3 left-1/2 flex -translate-x-1/2 space-x-2">
						{#each projects as _, i}
							<div
								class="h-1 w-8 rounded-full transition-colors duration-300 {i ===
								currentProjectIndex
									? 'bg-white'
									: 'bg-white/50'}"
							></div>
						{/each}
					</div>

					<div class="absolute top-0 left-0 flex justify-center space-x-2 p-2 sm:p-4">
						{#each projects as project, i}
							{#if i === currentProjectIndex}
								<div class="flex flex-col">
									<div class="text-sm font-bold text-black sm:text-lg">{project.name}</div>
									<div class="text-xs text-black sm:text-sm">{project.description}</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			</div>

			<!-- Right Column -->
			<div
				class="relative flex h-full flex-col space-y-2 pt-4 sm:space-y-2"
				transition:fly={{ x: 50, y: -20, duration: 1000, delay: BASE_DELAY + DELAY_INCREMENT * 2 }}
			>
				<!-- Experience Card -->
				<div
					class="flex-shrink-0 rounded-lg bg-neutral-800 p-2 shadow-sm sm:p-3"
					transition:fly={{ x: 30, y: -30, duration: 800, delay: BASE_DELAY + DELAY_INCREMENT * 5 }}
				>
					<h3 class="mb-2 font-mono text-sm font-bold sm:mb-3 sm:text-base">Experience</h3>
					<div
						class="custom-scrollbar max-h-[180px] space-y-2 overflow-y-auto sm:max-h-[140px] sm:space-y-3"
					>
						{#each experiences as exp}
							<a class="flex flex-col" href={exp.link} rel="noopener noreferrer">
								<div class="flex flex-row items-center">
									<img
										src={exp.logo}
										alt=""
										class="mt-1 mr-2 h-6 w-6 rounded-md object-cover sm:h-8 sm:w-8"
									/>
									<div>
										{#if exp.company === 'TextQL'}
											<h4 class="relative overflow-hidden text-xs font-semibold sm:text-sm">
												{#key currentJobTitleIndex}
													<span
														class="absolute inset-0 flex items-center"
														in:fade={{ duration: 300, delay: 150 }}
														out:fade={{ duration: 300 }}
													>
														{jobTitles[currentJobTitleIndex].charAt(0).toUpperCase() +
															jobTitles[currentJobTitleIndex].slice(1)}
													</span>
												{/key}
												<!-- Invisible placeholder to maintain layout -->
												<span class="invisible">
													{jobTitles[0].charAt(0).toUpperCase() + jobTitles[0].slice(1)}
												</span>
											</h4>
										{:else}
											<h4 class="text-xs font-semibold sm:text-sm">{exp.title}</h4>
										{/if}
										<p class="text-xs text-gray-400">{exp.company} • {exp.period}</p>
									</div>
								</div>
								<div class="mt-1 border-b border-neutral-700 pb-2">
									<p class="text-xs text-gray-300 sm:text-sm">{exp.description}</p>
								</div>
							</a>
						{/each}
					</div>
				</div>

				<div
					class="relative min-h-128"
					transition:fly={{
						x: 30,
						y: 30,
						duration: 800,
						delay: BASE_DELAY + DELAY_INCREMENT * 7
					}}
				>
					<img
						src="/apples.webp"
						alt="apple images"
						class="absolute top-2 right-2 z-10 h-8 w-8 sm:h-10 sm:w-10"
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
						class="absolute top-1/2 left-2 z-20 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white transition-all hover:scale-105 hover:bg-black/40"
						on:click={prevImage}
						aria-label="Previous image"
					>
						<i class="fas fa-chevron-left text-sm"></i>
					</button>
					<button
						class="absolute top-1/2 right-2 z-20 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white transition-all hover:scale-105 hover:bg-black/40"
						on:click={nextImage}
						aria-label="Next image"
					>
						<i class="fas fa-chevron-right text-sm"></i>
					</button>

					<div class="absolute bottom-3 left-1/2 flex -translate-x-1/2 space-x-2">
						{#each images as _, i}
							<div
								class="h-1 w-8 rounded-full transition-colors duration-300 {i === currentImageIndex
									? 'bg-white'
									: 'bg-white/50'}"
							></div>
						{/each}
					</div>

					<div class="absolute top-2 left-2 flex justify-center space-x-2">
						{#each images as image, i}
							{#if i === currentImageIndex}
								<div class="text-bold text-xs text-white">{image.description}</div>
							{/if}
						{/each}
					</div>
				</div>

				<div
					class="absolute right-0 bottom-2 left-0 text-center font-mono text-xs text-white sm:bottom-4 lg:hidden"
				>
					Check out my other <a href="https://cu-webring.org/" target="_blank" class="underline"
						>cracked friends</a
					>
				</div>
			</div>
		</div>
	</div>

	<div
		class="text-grey-400 absolute bottom-2 left-1/2 z-50 hidden -translate-x-1/2 transform font-mono text-xs text-white sm:bottom-4 lg:block"
		transition:fly={{ y: -30, duration: 1000, delay: BASE_DELAY + DELAY_INCREMENT * 12 }}
	>
		Check out my other <a href="https://cu-webring.org/" target="_blank" class="italic underline"
			>cracked friends</a
		>
	</div>
{/if}

<style>
	:global(body) {
		background: #1a1a1a url('/wave_gradient.png') no-repeat center center fixed;
		background-size: cover;
		background-image:
			url('/wave_gradient.png'),
			radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0),
			radial-gradient(circle at 5px 5px, rgba(255, 255, 255, 0.03) 1px, transparent 0);
		background-size:
			cover,
			10px 10px,
			20px 20px;
		background-position:
			center center,
			0 0,
			5px 5px;
		background-repeat: no-repeat, repeat, repeat;
		background-attachment: fixed;
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
		font-family: 'Courier New', Courier, monospace;
		font-size: 12px;
		line-height: 1;
		white-space: pre;
		font-display: block;
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	.ascii-art pre {
		margin: 0;
		padding: 0;
		font-family: inherit;
		text-rendering: inherit;
		-webkit-font-smoothing: inherit;
		-moz-osx-font-smoothing: inherit;
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
</style>
