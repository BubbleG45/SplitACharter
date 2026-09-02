import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
	if (!browser) return 'dark';
	
	try {
		const stored = localStorage.getItem('theme') as Theme | null;
		if (stored === 'dark' || stored === 'light') {
			return stored;
		}
	} catch (e) {}
	
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const initialTheme = getInitialTheme();
const themeStore = writable<Theme>(initialTheme);

if (browser) {
	try {
		document.documentElement.setAttribute('data-theme', initialTheme);
	} catch (e) {}
}

export const theme = {
	subscribe: themeStore.subscribe,
	set: (newTheme: Theme) => {
		if (browser) {
			try {
				document.documentElement.setAttribute('data-theme', newTheme);
				localStorage.setItem('theme', newTheme);
			} catch (e) {}
		}
		themeStore.set(newTheme);
	},
	toggle: () => {
		themeStore.update((current) => {
			const next: Theme = current === 'dark' ? 'light' : 'dark';
			if (browser) {
				try {
					document.documentElement.setAttribute('data-theme', next);
					localStorage.setItem('theme', next);
				} catch (e) {}
			}
			return next;
		});
	}
};
