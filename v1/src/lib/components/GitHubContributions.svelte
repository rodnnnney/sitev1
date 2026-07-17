<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	let contributionsUrl = '';
	let loading = true;
	let totalCommits = 0;

	const WEEKS = 53;
	const DAYS = 7;
	const FALLBACK_COMMITS = 965;

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
			const response = await fetch('/api/github-contributions');
			if (!response.ok) {
				totalCommits = FALLBACK_COMMITS;
				return;
			}
			const data = await response.json();
			totalCommits = data.totalContributions;
		} catch (error) {
			console.error('Failed to fetch commit count:', error);
			totalCommits = FALLBACK_COMMITS;
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
			</div>
			<div class="contributions-chart">
				<img
					src={contributionsUrl}
					alt="GitHub Contributions"
					class="w-full rounded-lg"
					on:error={() => {
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
		animation: cell-pulse 1.5s ease-in-out infinite;
	}

	.loading-cell.level-0 {
		--c0: #0e1117;
		--c1: #1a2332;
	}
	.loading-cell.level-1 {
		--c0: #1a3a5c;
		--c1: #2b6cb0;
	}
	.loading-cell.level-2 {
		--c0: #2563a8;
		--c1: #3b82f6;
	}
	.loading-cell.level-3 {
		--c0: #3b82f6;
		--c1: #60a5fa;
	}

	@keyframes cell-pulse {
		0%,
		100% {
			background: var(--c0);
		}
		50% {
			background: var(--c1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.loading-cell {
			animation: none;
			background: var(--c0);
		}
	}

	.commit-highlight {
		color: #22c55e;
		font-style: italic;
		text-decoration: underline;
	}
</style>
