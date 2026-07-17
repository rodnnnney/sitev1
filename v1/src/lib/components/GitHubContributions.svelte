<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	let contributionsUrl = '';
	let loading = true;
	let totalCommits = 0;
	let currentYear = new Date().getFullYear();

	const WEEKS = 53;
	const DAYS = 7;

	// Stable pseudo-levels so the skeleton reads like a real graph, not a flat grid.
	function cellLevel(w: number, d: number): number {
		const n = Math.sin(w * 12.9898 + d * 78.233) * 43758.5453;
		const r = n - Math.floor(n);
		if (r < 0.45) return 0;
		if (r < 0.7) return 1;
		if (r < 0.88) return 2;
		return 3;
	}

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
		<div class="loading" aria-hidden="true" aria-busy="true" transition:fade={{ duration: 180 }}>
			<div class="mb-3 flex items-center justify-between">
				<h4>Github</h4>
			</div>
			<div class="loading-grid">
				{#each Array.from({ length: WEEKS }) as _, w (w)}
					<div class="loading-col">
						{#each Array.from({ length: DAYS }) as _, d (d)}
							<div
								class="loading-cell level-{cellLevel(w, d)}"
								style="animation-delay: {(w * 22 + d * 10)}ms"
							></div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="contributions-container" in:fade={{ duration: 280 }}>
			<div class="mb-3 flex items-center justify-between">
				<h4>Github</h4>
				{#if totalCommits > 0}
					<div class="text-right"></div>
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
				Syncs daily • <span class="commit-highlight">{totalCommits + 1}</span> <em>commits</em>
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
		display: flex;
		flex-direction: column;
	}

	.loading-grid {
		display: flex;
		gap: 3px;
		width: 100%;
		overflow: hidden;
	}

	.loading-col {
		display: flex;
		flex: 1 1 0;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}

	.loading-cell {
		aspect-ratio: 1;
		width: 100%;
		border-radius: 2px;
		animation: cell-pulse-0 1.5s ease-in-out infinite;
	}

	/* Blue cube ramp — close to the loaded chart so the handoff isn't a jump */
	.loading-cell.level-0 {
		animation-name: cell-pulse-0;
	}
	.loading-cell.level-1 {
		animation-name: cell-pulse-1;
	}
	.loading-cell.level-2 {
		animation-name: cell-pulse-2;
	}
	.loading-cell.level-3 {
		animation-name: cell-pulse-3;
	}

	@keyframes cell-pulse-0 {
		0%,
		100% {
			background: #0e1117;
		}
		50% {
			background: #1a2332;
		}
	}
	@keyframes cell-pulse-1 {
		0%,
		100% {
			background: #1a3a5c;
		}
		50% {
			background: #2b6cb0;
		}
	}
	@keyframes cell-pulse-2 {
		0%,
		100% {
			background: #2563a8;
		}
		50% {
			background: #3b82f6;
		}
	}
	@keyframes cell-pulse-3 {
		0%,
		100% {
			background: #3b82f6;
		}
		50% {
			background: #60a5fa;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.loading-cell {
			animation: none;
		}
	}

	.commit-highlight {
		color: #22c55e;
		font-style: italic;
		text-decoration: underline;
	}
</style>
