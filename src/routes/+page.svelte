<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { images, projects, experiences, blog, bangers, bucketURL } from '$lib/utils/consts';
	import Header from '$lib/components/header.svelte';
	import GitHubContributions from '$lib/components/GitHubContributions.svelte';
	import LinkPreview from '$lib/components/LinkPreview.svelte';
	import TextRotator from '$lib/components/TextRotator.svelte';
	import SongTooltip from '$lib/components/SongTooltip.svelte';

	let currentImageIndex = 0;
	let interval: number;
	let currentProjectIndex = 0;
	let interval1: number;
	let ready = false;

	const jobTitles = [
		'Member of Technical Staff',
		'Member of Recruiting Staff',
		'Member of Growth Staff',
		'Member of Waste Disposal Staff',
		'Member of Acting Staff',
		'Member of Design Staff'
	];
	let currentJobTitleIndex = 0;
	let jobTitleInterval: number;

	let BASE_DELAY = 0;
	let DELAY_INCREMENT = 100;
	let isMobile = false;

	let marqueeEl: HTMLElement;
	let marqueePosition = 0;
	let marqueePaused = false;
	let marqueeAnimationId: number;

	// Tooltip state (for songs and blogs)
	let hoveredItem: { title: string; description?: string; image?: string } | null = null;
	let tooltipTriggerEl: HTMLElement | null = null;
	let tooltipPosition: 'above' | 'left' | 'right' = 'above';

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

	function animateMarquee() {
		if (!marqueePaused && marqueeEl) {
			marqueePosition -= 0.2;
			const halfWidth = marqueeEl.scrollWidth / 2;
			if (Math.abs(marqueePosition) >= halfWidth) {
				marqueePosition = 0;
			}
			marqueeEl.style.transform = `translateX(${marqueePosition}px)`;
		}
		marqueeAnimationId = requestAnimationFrame(animateMarquee);
	}

	onMount(() => {
		ready = true;

		isMobile = window.innerWidth < 1024;

		if (isMobile) {
			BASE_DELAY = 300;
			DELAY_INCREMENT = 200;
		}

		interval = setInterval(() => {
			currentImageIndex = (currentImageIndex + 1) % images.length;
		}, 5000);

		interval1 = setInterval(() => {
			currentProjectIndex = (currentProjectIndex + 1) % projects.length;
		}, 10000);

		jobTitleInterval = setInterval(() => {
			currentJobTitleIndex = (currentJobTitleIndex + 1) % jobTitles.length;
		}, 2500);

		// Start marquee animation
		marqueeAnimationId = requestAnimationFrame(animateMarquee);

		return () => {
			clearInterval(interval);
			clearInterval(interval1);
			clearInterval(jobTitleInterval);
			cancelAnimationFrame(marqueeAnimationId);
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
	<link rel="icon" href="{bucketURL}/pfp12.png" type="image/x-icon" />
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

{#if ready}
	<div
		class="flex min-h-screen flex-col md:h-screen md:overflow-hidden"
		transition:fade={{ duration: 800 }}
	>
		<div transition:fly={{ y: -50, duration: 800, delay: BASE_DELAY }} class="flex-shrink-0">
			<Header />
		</div>
		<div class="flex min-h-0 w-full flex-1 items-center justify-center p-2 sm:p-3 lg:p-4">
			<div
				class="mx-auto grid w-full max-w-7xl grid-cols-1 gap-2 sm:gap-3 lg:max-h-[calc(100vh-120px)] lg:grid-cols-3 lg:gap-4"
			>
				<!-- Left Column -->
				<div class="flex flex-col space-y-2 pt-8 sm:space-y-2">
					<!-- Hover hint - desktop only -->
					<p
						class="hidden text-xs text-gray-500 lg:block"
						transition:fly={{ y: -20, duration: 600, delay: BASE_DELAY + DELAY_INCREMENT * 2 }}
					>
						<TextRotator
							staticText="Most things are hoverable - try hovering"
							rotatingWords={[
								'a link*',
								'a card*',
								'a blog*',
								'an image*',
								'a song*',
								'an experience*'
							]}
							interval={2500}
							transitionDuration={600}
						/>
					</p>

					<!-- Profile Card -->
					<div
						class="rounded-lg bg-neutral-800 p-4 shadow-sm"
						transition:fly={{
							x: -30,
							y: -30,
							duration: 800,
							delay: BASE_DELAY + DELAY_INCREMENT * 3
						}}
					>
						<div class="flex items-center">
							<div class="flex w-full flex-row justify-between">
								<h4>Education</h4>
							</div>
						</div>
						<div class="mt-2 flex flex-row items-center sm:mt-3">
							<img
								src={`${bucketURL}/logo.jpg`}
								alt="Carleton"
								class="mr-2 h-6 w-6 rounded-full object-cover sm:h-8 sm:w-8"
							/>
							<p class="text-xs font-medium sm:text-sm">Computer Science @ Carleton University</p>
						</div>
						<div class="mt-2 mb-2 w-full border-b border-gray-300"></div>
						<p class="text-left text-xs">Permanent gap year</p>
					</div>

					<div
						class="rounded-lg bg-neutral-800 p-4 shadow-sm"
						transition:fly={{
							x: -30,
							y: 0,
							duration: 800,
							delay: BASE_DELAY + DELAY_INCREMENT * 2
						}}
					>
						<h4 class="mb-3">About Me</h4>

						<div class="flex-row-2 flex">
							<p class="text-left text-sm">
								I'm Rodney! I'm based in NYC working at <LinkPreview
									href="https://textql.com/"
									position="right">TextQL</LinkPreview
								> as a Member of Technical Staff.
								<br /><br />
								Some areas that interest me are giving agents their own <LinkPreview
									href="https://textql.com/blog/sandcastles">file systems</LinkPreview
								> to execute on in a secure and sandboxed environment.
								<br /><br />
								In a past life, I was deep in crypto, I founded <LinkPreview
									href="https://carletonblockchain.ca/">Carleton Blockchain</LinkPreview
								>, grew it to 200 members, and spoke at <LinkPreview
									href="https://consensus-hongkong2025.coindesk.com/agenda/event/-the-student-movement-universities-as-catalysts-for-web3-innovation-30"
									>Consensus Hong Kong</LinkPreview
								>.
							</p>
						</div>
					</div>

					<!-- GitHub Contributions Card -->
					<div
						class="rounded-lg bg-neutral-800 p-4 shadow-sm"
						transition:fly={{
							x: -50,
							y: 50,
							duration: 800,
							delay: BASE_DELAY + DELAY_INCREMENT * 1
						}}
					>
						<GitHubContributions />
					</div>

					<!-- Contact Icons -->
					<div
						class="flex items-center justify-end space-x-4"
						transition:fly={{
							x: -30,
							y: 30,
							duration: 800,
							delay: BASE_DELAY + DELAY_INCREMENT * 5
						}}
					>
						<LinkPreview
							href="https://x.com/992rodney"
							position="left"
							iconOnly
							customPreview={{
								title: 'Follow me',
								description:
									'My most unhinged takes or insightful technical blogs - follow to find out',
								image: 'https://unavatar.io/twitter/992rodney'
							}}
						>
							<span class="text-gray-400 transition-colors hover:text-white">
								<i class="fab fa-x-twitter text-xl"></i>
							</span>
						</LinkPreview>
						<LinkPreview
							href="https://github.com/rodnnnney"
							position="left"
							iconOnly
							customPreview={{
								title: 'Check out my code',
								description: 'Open source projects, experiments, and random stuff I build',
								image: 'https://github.com/rodnnnney.png'
							}}
						>
							<span class="text-gray-400 transition-colors hover:text-white">
								<i class="fab fa-github text-xl"></i>
							</span>
						</LinkPreview>
					</div>
				</div>

				<!-- Middle Column -->
				<div class="flex flex-col space-y-2 sm:space-y-2">
					<!-- Experience Card -->
					<div
						class="flex-shrink-0 rounded-lg bg-neutral-800 p-4 shadow-sm"
						transition:fly={{ y: -30, duration: 800, delay: BASE_DELAY + DELAY_INCREMENT * 4 }}
					>
						<h4 class="mb-3">Experience</h4>
						<div class="custom-scrollbar max-h-[200px] space-y-3 overflow-y-auto">
							{#each experiences as exp}
								<LinkPreview href={exp.link} variant="block">
									<div class="block rounded-md px-2 py-1 transition-colors hover:bg-neutral-700/50">
										<div class="flex flex-row items-center">
											<img
												src={exp.logo}
												alt=""
												class="mt-1 mr-2 h-8 w-8 rounded-md object-cover"
											/>
											<div>
												{#if exp.company === 'TextQL'}
													<p class="relative overflow-hidden text-sm font-medium">
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
													</p>
												{:else}
													<p class="text-sm font-medium">{exp.title}</p>
												{/if}
												<p class="text-xs text-gray-400">{exp.company} • {exp.period}</p>
											</div>
										</div>
										<div class="mt-1 ml-10">
											<p class="text-sm">{exp.description}</p>
										</div>
									</div>
								</LinkPreview>
							{/each}
						</div>
					</div>

					<div
						class="relative aspect-square"
						transition:fly={{
							y: 30,
							duration: 800,
							delay: BASE_DELAY + DELAY_INCREMENT * 8
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
										<div
											class="text-sm text-black sm:text-lg"
											style="font-family: 'Libre Caslon', serif;"
										>
											{project.name}
										</div>
										<div class="text-xs text-black/70 sm:text-sm">{project.description}</div>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>

				<!-- Right Column -->
				<div class="relative flex flex-col space-y-2 pt-4 sm:space-y-2">
					<!-- Blog Card -->
					<div
						class="relative rounded-lg bg-neutral-800 p-4 shadow-sm"
						transition:fly={{
							x: 30,
							y: -30,
							duration: 800,
							delay: BASE_DELAY + DELAY_INCREMENT * 5
						}}
					>
						<div class="flex flex-row justify-between">
							<h4 class="mb-3">Blog</h4>
						</div>

						<div class="space-y-3">
							{#each blog as post}
								<a
									href="/blog/{post.link}"
									class="block"
									on:mouseenter={(e) => {
										hoveredItem = { title: post.title, description: post.description };
										tooltipTriggerEl = e.currentTarget;
										tooltipPosition = 'left';
									}}
									on:mouseleave={() => {
										hoveredItem = null;
										tooltipTriggerEl = null;
									}}
								>
									<div class="rounded-md px-2 py-1 pb-1 transition-colors hover:bg-neutral-700/50">
										<div class="flex items-center justify-between">
											<p class="text-sm text-white" style="font-family: 'Libre Caslon', serif;">
												{post.title}
											</p>
											<p class="text-xs text-gray-400">{post.date}</p>
										</div>
										<p class="mt-1 text-sm">{post.excerpt}</p>
									</div>
								</a>
							{/each}
						</div>
					</div>

					<!-- Song Marquee -->
					<div
						class="relative overflow-hidden rounded-lg bg-neutral-800 p-1 shadow-sm"
						transition:fly={{ x: 30, y: 0, duration: 800, delay: BASE_DELAY + DELAY_INCREMENT * 6 }}
						on:mouseenter={() => (marqueePaused = true)}
						on:mouseleave={(e) => {
							// Don't unpause if mouse went to a tooltip
							const related = e.relatedTarget as HTMLElement;
							if (related?.closest('[role="tooltip"]')) return;
							marqueePaused = false;
						}}
						role="region"
						aria-label="Song carousel"
					>
						<img
							src="https://pub-6cd5bf10c6f641a28ec9656b861a4fe2.r2.dev/static/spotify.png"
							alt="Spotify"
							class="absolute top-1 right-1 z-10 h-6 w-6"
						/>
						<div bind:this={marqueeEl} class="flex flex-row gap-1 whitespace-nowrap">
							{#each bangers as banger}
								<a
									href={banger.link}
									target="_blank"
									rel="noopener noreferrer"
									class="flex-shrink-0"
									on:mouseenter={(e) => {
										hoveredItem = {
											title: banger.title,
											description:
												banger.artist + (banger.description ? ' · ' + banger.description : '')
										};
										tooltipTriggerEl = e.currentTarget;
										tooltipPosition = 'above';
									}}
									on:mouseleave={() => {
										hoveredItem = null;
										tooltipTriggerEl = null;
									}}
								>
									<div class="relative h-12 w-12 sm:h-16 sm:w-16">
										<img
											src={banger.cover_img}
											alt={banger.title || 'Album cover'}
											class="rounded-lg object-cover grayscale-[65%] transition-[filter] duration-300 hover:grayscale-0"
										/>
									</div>
								</a>
							{/each}
							{#each bangers as banger}
								<a
									href={banger.link}
									target="_blank"
									rel="noopener noreferrer"
									class="flex-shrink-0"
									on:mouseenter={(e) => {
										hoveredItem = {
											title: banger.title,
											description:
												banger.artist + (banger.description ? ' · ' + banger.description : '')
										};
										tooltipTriggerEl = e.currentTarget;
										tooltipPosition = 'above';
									}}
									on:mouseleave={() => {
										hoveredItem = null;
										tooltipTriggerEl = null;
									}}
								>
									<div class="relative h-12 w-12 sm:h-16 sm:w-16">
										<img
											src={banger.cover_img}
											alt={banger.title || 'Album cover'}
											class="rounded-lg object-cover grayscale-[65%] transition-[filter] duration-300 hover:grayscale-0"
										/>
									</div>
								</a>
							{/each}
						</div>
					</div>

					<div
						class="relative aspect-square"
						transition:fly={{
							x: 30,
							y: 30,
							duration: 800,
							delay: BASE_DELAY + DELAY_INCREMENT * 7
						}}
					>
						<img
							src={`${bucketURL}/apples.webp`}
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
									class="h-1 w-8 rounded-full transition-colors duration-300 {i ===
									currentImageIndex
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

					<div class="relative mt-4 mb-2 text-center text-xs text-white lg:hidden">
						Check out my other <LinkPreview href="https://cu-webring.org/"
							>cracked friends</LinkPreview
						>
					</div>
				</div>
			</div>
		</div>
		<div
			class="hidden flex-shrink-0 py-2 text-center text-xs text-white lg:block"
			transition:fly={{ y: -30, duration: 1000, delay: BASE_DELAY + DELAY_INCREMENT * 13 }}
		>
			Check out my other <LinkPreview href="https://cu-webring.org/">cracked friends</LinkPreview>
		</div>
	</div>

	<!-- Tooltip rendered at page level to escape clipping -->
	<SongTooltip
		title={hoveredItem?.title || ''}
		description={hoveredItem?.description || ''}
		image={hoveredItem?.image || ''}
		triggerEl={tooltipTriggerEl}
		visible={!!hoveredItem}
		position={tooltipPosition}
	/>
{/if}

<style>
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
</style>
