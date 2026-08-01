import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
	if (!browser) return 'dark';
	
	const stored = localStorage.getItem('theme') as Theme | null;
	if (stored === 'dark' || stored === 'light') {
		return stored;
	}
	
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const themeStore = writable<Theme>(getInitialTheme());

if (browser) {
	themeStore.subscribe((value) => {
		document.documentElement.setAttribute('data-theme', value);
		localStorage.setItem('theme', value);
	});
}

export const theme = {
	subscribe: themeStore.subscribe,
	set: (newTheme: Theme) => {
		themeStore.set(newTheme);
	},
	toggle: () => {
		themeStore.update((current) => (current === 'dark' ? 'light' : 'dark'));
	}
};
