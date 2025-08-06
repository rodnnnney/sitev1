<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, ArrowRight, FileText, Code, Briefcase, Home } from 'lucide-svelte';
	import { blogs, projects, experiences } from '$lib/utils/consts';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let searchOpen = false;
	let searchInput: HTMLInputElement;
	let searchQuery = '';
	let selectedIndex = 0;
	let resultsContainer: HTMLDivElement;
	let selectedElement: HTMLElement | null = null;

	// Create search index
	const searchItems = [
		// Blogs
		...blogs.map((blog) => ({
			type: 'blog',
			title: blog.title,
			description: blog.excerpt,
			url: `/blogs/${blog.link}`,
			date: blog.date
		})),
		// Projects
		...projects.map((project) => ({
			type: 'project',
			title: project.name,
			description: project.description,
			url: project.link,
			date: null
		})),
		// Experiences
		...experiences.map((exp) => ({
			type: 'experience',
			title: `${exp.title} at ${exp.company}`,
			description: exp.description,
			url: exp.link,
			date: exp.period
		})),
		// Static pages
		{ type: 'page', title: 'Home', description: 'Main landing page', url: '/', date: null },
		{ type: 'page', title: 'Blogs', description: 'All blog posts', url: '/blogs', date: null },
		{ type: 'page', title: 'Projects', description: 'All projects', url: '/projects', date: null }
	];

	// Preview items - only show these 3 when no search query
	const previewItems = [
		// Blog
		...blogs
			.map((blog) => ({
				type: 'blog',
				title: blog.title,
				description: blog.excerpt,
				url: `/blogs/${blog.link}`,
				date: blog.date
			}))
			.slice(0, 1), // Take first blog
		// RizzKhalifa project
		...projects
			.filter((project) => project.name === 'RizzKhalifa')
			.map((project) => ({
				type: 'project',
				title: project.name,
				description: project.description,
				url: project.link,
				date: null
			})),
		// TextQL experience
		...experiences
			.filter((exp) => exp.company === 'TextQL')
			.map((exp) => ({
				type: 'experience',
				title: `${exp.title} at ${exp.company}`,
				description: exp.description,
				url: exp.link,
				date: exp.period
			}))
	];

	$: filteredResults = searchQuery.trim()
		? searchItems
				.filter(
					(item) =>
						item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
						item.description.toLowerCase().includes(searchQuery.toLowerCase())
				)
				.slice(0, 8)
		: previewItems;

	function toggleSearch() {
		searchOpen = !searchOpen;
		if (searchOpen) {
			setTimeout(() => {
				searchInput?.focus();
				selectedIndex = 0;
				scrollToSelected();
			}, 100);
			// Don't prevent body scroll
		} else {
			searchQuery = '';
			selectedIndex = 0;
		}
	}

	function scrollToSelected() {
		if (resultsContainer) {
			selectedElement = resultsContainer.querySelector(
				`[data-index="${selectedIndex}"]`
			) as HTMLElement;
			if (selectedElement) {
				selectedElement.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});
			}
		}
	}

	function handleSearchKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, filteredResults.length - 1);
			setTimeout(scrollToSelected, 50);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
			setTimeout(scrollToSelected, 50);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			if (filteredResults[selectedIndex]) {
				navigateToResult(filteredResults[selectedIndex]);
			}
		}
	}

	function navigateToResult(result: (typeof searchItems)[0]) {
		searchOpen = false;
		searchQuery = '';
		selectedIndex = 0;

		if (result.url.startsWith('http')) {
			window.open(result.url, '_blank');
		} else {
			goto(result.url);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
			event.preventDefault();
			toggleSearch();
		}
		if ((event.metaKey || event.ctrlKey) && event.key === 'h') {
			event.preventDefault();
			goto('/');
		}
		if (event.key === 'Escape' && searchOpen) {
			searchOpen = false;
			searchQuery = '';
			selectedIndex = 0;
		}
	}

	function getTypeColor(type: string) {
		switch (type) {
			case 'blog':
				return 'background-color: #93c5fd; border-color: #2563eb; color: #1e40af;'; // Light blue
			case 'project':
				return 'background-color: #c4b5fd; border-color: #7c3aed; color: #5b21b6;'; // Light purple
			case 'experience':
				return 'background-color: #f9a8d4; border-color: #ec4899; color: #be185d;'; // Light pink
			case 'page':
				return 'background-color: #d1d5db; border-color: #6b7280; color: #374151;'; // Light gray
			default:
				return 'background-color: #d1d5db; border-color: #6b7280; color: #374151;'; // Light gray
		}
	}

	function getTypeIcon(type: string) {
		switch (type) {
			case 'blog':
				return FileText;
			case 'project':
				return Code;
			case 'experience':
				return Briefcase;
			case 'page':
				return Home;
			default:
				return Home;
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<header class="hidden w-full bg-transparent lg:block">
	<div class="mx-auto max-w-7xl px-4 py-2 lg:px-0 lg:pt-6">
		<nav class="flex items-center justify-between">
			<!-- Left side - Name -->
			<div class="flex items-center space-x-3">
				<a
					href="/"
					class="font-mono text-lg font-bold text-white transition-colors hover:text-gray-300 sm:text-xl"
				>
					Rodney Shen
				</a>
				{#if $page.url.pathname !== '/'}
					<span class="hidden text-xs text-gray-500 sm:inline">⌘ + H</span>
				{/if}
			</div>

			<!-- Right side - Navigation and Search -->
			<div class="flex items-center space-x-6">
				<div class="hidden items-center space-x-6 sm:flex">
					<a
						href="/blogs"
						class="nav-link relative text-lg text-white transition-all duration-300 hover:text-gray-300"
					>
						Blogs
					</a>
					<a
						href="/projects"
						class="nav-link relative text-lg text-white transition-all duration-300 hover:text-gray-300"
					>
						Projects
					</a>
				</div>

				<!-- Search Button -->
				<button
					on:click={toggleSearch}
					class="flex items-center space-x-2 rounded-md border border-gray-600 bg-gray-800/50 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-700/50"
				>
					<Search size={14} />
					<!-- <span class="hidden sm:inline">Search</span> -->
					<span class="hidden text-xs text-gray-500 sm:inline">⌘ + K</span>
				</button>
			</div>
		</nav>
	</div>

	<!-- Search Modal -->
	{#if searchOpen}
		<div
			class="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-16 lg:pt-20"
			style="background: linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.9) 50%, rgba(0,0,0,0.8) 100%);"
			on:click={toggleSearch}
			on:keydown={(e) => e.key === 'Escape' && toggleSearch()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div
				class="mx-4 w-full max-w-2xl"
				on:click|stopPropagation
				on:keydown={(e) => {
					if (e.key === 'Escape') {
						toggleSearch();
					} else {
						e.stopPropagation();
					}
				}}
				role="none"
			>
				<div
					class="overflow-hidden rounded-xl border border-gray-700/50 shadow-2xl backdrop-blur-xl"
					style="background: linear-gradient(135deg, rgba(10,10,10,0.95) 0%, rgba(30,30,30,0.95) 50%, rgba(10,10,10,0.95) 100%)"
				>
					<!-- Search Input -->
					<div class="flex items-center border-b border-gray-700/50 px-6 py-4">
						<Search size={20} class="mr-3 text-gray-400" />
						<input
							bind:this={searchInput}
							bind:value={searchQuery}
							on:keydown={handleSearchKeydown}
							type="text"
							placeholder="Search blogs, projects, experiences..."
							class="w-full bg-transparent text-lg text-white placeholder-gray-500 outline-none"
						/>
						<div class="ml-3 rounded border border-gray-600 px-2 py-1 text-xs text-gray-500">
							ESC
						</div>
					</div>

					<!-- Search Results -->
					<div class="relative max-h-96 overflow-y-auto" bind:this={resultsContainer}>
						<!-- Animated Background -->
						{#if selectedElement && selectedIndex >= 0}
							<div
								class="pointer-events-none absolute rounded-lg bg-gradient-to-r from-gray-600/20 to-gray-700/30 transition-all duration-300 ease-out"
								style="
									top: {selectedElement.offsetTop + 8}px;
									left: 8px;
									width: {selectedElement.offsetWidth - 16}px;
									height: {selectedElement.offsetHeight - 16}px;
								"
							></div>
						{/if}

						{#if filteredResults.length > 0}
							{#each filteredResults as result, index}
								<button
									class="relative w-full px-6 py-4 text-left transition-all duration-200 ease-out hover:bg-transparent focus:bg-transparent focus:outline-none"
									data-index={index}
									on:click={() => navigateToResult(result)}
									on:mouseenter={() => {
										selectedIndex = index;
										scrollToSelected();
									}}
								>
									<div class="relative z-10">
										<div class="flex items-center justify-between">
											<div class="flex-1">
												<div class="flex items-center space-x-3">
													<svelte:component
														this={getTypeIcon(result.type)}
														size={14}
														class="text-gray-400"
													/>
													<h3 class="font-medium text-white">{result.title}</h3>
												</div>
												<p class="mt-1 text-sm text-gray-400">{result.description}</p>
												{#if result.date}
													<p class="mt-1 text-xs text-gray-500">{result.date}</p>
												{/if}
											</div>
											<ArrowRight size={16} class="ml-4 text-gray-500" />
										</div>
									</div>
								</button>
							{/each}
						{:else if searchQuery.trim()}
							<div class="px-6 py-8 text-center">
								<p class="text-gray-400">No results found for "{searchQuery}"</p>
							</div>
						{:else}
							<div class="relative px-6 py-4">
								<p class="mb-3 text-xs font-medium tracking-wide text-gray-500 uppercase">
									Quick Access
								</p>

								<!-- Animated Background for Quick Access -->
								{#if selectedElement && selectedIndex >= 0}
									<div
										class="pointer-events-none absolute rounded-lg bg-gradient-to-r from-gray-600/20 to-gray-700/30 transition-all duration-300 ease-out"
										style="
											top: {selectedElement.offsetTop - 16}px;
											left: 12px;
											width: {selectedElement.offsetWidth - 24}px;
											height: {selectedElement.offsetHeight}px;
										"
									></div>
								{/if}

								{#each filteredResults as result, index}
									<button
										class="relative w-full rounded-md px-4 py-3 text-left transition-all duration-200 ease-out hover:bg-transparent focus:bg-transparent focus:outline-none"
										data-index={index}
										on:click={() => navigateToResult(result)}
										on:mouseenter={() => {
											selectedIndex = index;
											scrollToSelected();
										}}
									>
										<div class="relative z-10">
											<div class="flex items-center justify-between">
												<div class="flex items-center space-x-3">
													<svelte:component
														this={getTypeIcon(result.type)}
														size={12}
														class="text-gray-400"
													/>
													<span class="text-sm text-white">{result.title}</span>
												</div>
												<ArrowRight size={14} class="text-gray-500" />
											</div>
										</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Footer -->
					<div class="border-t border-gray-700/50 px-6 py-3">
						<div class="flex items-center justify-between text-xs text-gray-500">
							<div class="flex items-center space-x-4">
								<span class="flex items-center space-x-1">
									<kbd class="rounded border border-gray-600 px-1.5 py-0.5">↑↓</kbd>
									<span>Navigate</span>
								</span>
								<span class="flex items-center space-x-1">
									<kbd class="rounded border border-gray-600 px-1.5 py-0.5">↵</kbd>
									<span>Select</span>
								</span>
								<span class="flex items-center space-x-1">
									<kbd class="rounded border border-gray-600 px-1.5 py-0.5">⌘H</kbd>
									<span>Home</span>
								</span>
							</div>
							<span>⌘K to search</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</header>

<style>
	.nav-link::after {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 50%;
		width: 0;
		height: 2px;
		background: linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6);
		transition: all 0.3s ease-out;
		border-radius: 1px;
		box-shadow: 0 0 8px rgba(96, 165, 250, 0);
		transform: translateX(-50%);
	}

	.nav-link:hover::after {
		width: 100%;
		box-shadow: 0 0 12px rgba(96, 165, 250, 0.6);
	}
</style>
