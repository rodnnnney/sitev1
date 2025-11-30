<script lang="ts">
	import { onMount } from 'svelte';

	let contributionsUrl = '';
	let loading = true;
	let totalCommits = 0;
	let currentYear = new Date().getFullYear();

	async function fetchCommitCount() {
		try {
			// Fetch from our secure API route
			const response = await fetch('/api/github-contributions');

			if (response.ok) {
				const data = await response.json();
				totalCommits = data.totalContributions;
				currentYear = data.year;
			} else {

				totalCommits = 965;
			}
		} catch (error) {
			console.error('Failed to fetch commit count:', error);
			totalCommits = 965;
		}
	}

	onMount(async () => {
		contributionsUrl = `https://ghchart.rshah.org/rodnnnney`;
		await fetchCommitCount();
		loading = false;
	});
</script>

<div class="github-contributions">
	{#if loading}
		<div class="loading">
			<div class="h-24 w-full animate-pulse rounded-lg bg-gray-700"></div>
		</div>
	{:else}
		<div class="contributions-container">
			<div class="mb-3 flex items-center justify-between">
				<h3 class="text-sm sm:text-base" style="font-family: 'PP Editorial New', serif; font-weight: 400;">GitHub Activity</h3>
				{#if totalCommits > 0}
					<div class="text-right">


					</div>
				{/if}
			</div>
			<div class="contributions-chart">
				<img
					src={contributionsUrl}
					alt="GitHub Contributions"
					class="w-full rounded-lg"
					on:error={() => {
						// Fallback if the service is down
						contributionsUrl =
							'https://github-readme-stats.vercel.app/api?username=rodnnnney&show_icons=true&theme=dark&hide_border=true';
					}}
				/>
			</div>
			<p class="mt-2 text-xs text-gray-400">
				Syncs daily • <span class="commit-highlight">{totalCommits+1}</span> <em>commits</em>
			</p>
		</div>
	{/if}
</div>

<style>
	.contributions-chart img {
		filter: brightness(0.9) contrast(1.1);
		transition: all 0.3s ease;
	}

	.contributions-chart:hover img {
		filter: brightness(1) contrast(1.2);
		transform: scale(1.02);
	}

	.loading {
		padding: 1rem;
	}

	.commit-highlight {
		color: #22c55e;
		font-style: italic;
		text-decoration: underline;
	}
</style>
