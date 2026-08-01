import fs from 'fs';

const filePath = 'src/routes/admin/settings/+page.svelte';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update imports
content = content.replace(
    "import { enhance } from '$app/forms';",
    "import { enhance } from '$app/forms';\n\timport { goto } from '$app/navigation';\n\timport { page } from '$app/stores';"
);

// 2. Replace section scroll state with tab state
const oldStateBlock = `\tlet activeNavSection = $state('sec-notifications');
\tlet highlightedSection = $state<string | null>(null);

\tfunction navigateToSection(secId: string) {
\t\tactiveNavSection = secId;
\t\tconst el = document.getElementById(secId);
\t\tif (el) {
\t\t\tel.scrollIntoView({ behavior: 'smooth', block: 'start' });
\t\t\thighlightedSection = secId;
\t\t\tsetTimeout(() => {
\t\t\t\tif (highlightedSection === secId) {
\t\t\t\t\thighlightedSection = null;
\t\t\t\t}
\t\t\t}, 2500);
\t\t}
\t}

\t// Automatically select the first template once the settings are loaded & track active section on scroll
\t$effect(() => {
\t\tif (!selectedId && data.settings?.length > 0) {
\t\t\tselectedId = data.settings[0].id;
\t\t}

\t\tconst observer = new IntersectionObserver(
\t\t\t(entries) => {
\t\t\t\tfor (const entry of entries) {
\t\t\t\t\tif (entry.isIntersecting) {
\t\t\t\t\t\tactiveNavSection = entry.target.id;
\t\t\t\t\t}
\t\t\t\t}
\t\t\t},
\t\t\t{ threshold: 0.25 }
\t\t);

\t\tconst sec1 = document.getElementById('sec-notifications');
\t\tconst sec2 = document.getElementById('sec-trip-types');
\t\tconst sec3 = document.getElementById('sec-reviews');

\t\tif (sec1) observer.observe(sec1);
\t\tif (sec2) observer.observe(sec2);
\t\tif (sec3) observer.observe(sec3);

\t\treturn () => observer.disconnect();
\t});`;

const newStateBlock = `\tlet activeTab = $state<'notifications' | 'trip-types' | 'reviews'>('notifications');

\t$effect(() => {
\t\tconst tabFromUrl = $page.url.searchParams.get('tab');
\t\tif (tabFromUrl === 'trip-types' || tabFromUrl === 'reviews' || tabFromUrl === 'notifications') {
\t\t\tactiveTab = tabFromUrl;
\t\t} else if (data.activeTab === 'trip-types' || data.activeTab === 'reviews' || data.activeTab === 'notifications') {
\t\t\tactiveTab = data.activeTab;
\t\t}

\t\tif (!selectedId && data.settings?.length > 0) {
\t\t\tselectedId = data.settings[0].id;
\t\t}
\t});

\tfunction switchTab(tab: 'notifications' | 'trip-types' | 'reviews') {
\t\tactiveTab = tab;
\t\tconst url = new URL(window.location.href);
\t\turl.searchParams.set('tab', tab);
\t\tgoto(url.pathname + url.search, { replaceState: true, keepFocus: true, noScroll: true });
\t}`;

content = content.replace(oldStateBlock, newStateBlock);

console.log("Updated script block in page.svelte");
