import { readable } from 'svelte/store';
import { browser } from '$app/environment';

function createMediaQuery(query: string) {
	return readable(false, (set) => {
		if (!browser) return;

		const mediaQuery = window.matchMedia(query);
		set(mediaQuery.matches);

		const handler = (e: MediaQueryListEvent) => set(e.matches);
		mediaQuery.addEventListener('change', handler);

		return () => mediaQuery.removeEventListener('change', handler);
	});
}

export const isMobile = createMediaQuery('(max-width: 768px)');
export const isDesktop = createMediaQuery('(min-width: 769px)');
