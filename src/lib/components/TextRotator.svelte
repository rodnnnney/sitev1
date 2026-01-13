<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let staticText: string = '';
	export let rotatingWords: string[] = [];
	export let interval: number = 2500;
	export let transitionDuration: number = 600;

	let displayIndex = 0;
	let animatingOut = false;
	let intervalId: ReturnType<typeof setInterval>;

	$: longestWord = rotatingWords.reduce((a, b) => a.length > b.length ? a : b, '');

	function nextWord() {
		animatingOut = true;

		setTimeout(() => {
			displayIndex = (displayIndex + 1) % rotatingWords.length;
			animatingOut = false;
		}, transitionDuration / 2);
	}

	onMount(() => {
		intervalId = setInterval(nextWord, interval);
	});

	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
	});
</script>

<span class="rotator-container">
	{#if staticText}<span>{staticText}&nbsp;</span>{/if}<span class="rotator-word-container">
		<span class="rotator-sizer">{longestWord}</span>
		<span
			class="rotator-word"
			class:animating-out={animatingOut}
		>
			{rotatingWords[displayIndex]}
		</span>
	</span>
</span>

<style>
	.rotator-container {
		display: inline;
	}

	.rotator-word-container {
		position: relative;
		display: inline-block;
	}

	.rotator-sizer {
		visibility: hidden;
	}

	.rotator-word {
		position: absolute;
		left: 0;
		top: 0;
		transition: opacity 300ms ease;
		opacity: 1;
	}

	.rotator-word.animating-out {
		opacity: 0;
	}
</style>
