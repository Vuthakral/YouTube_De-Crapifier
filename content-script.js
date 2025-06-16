console.log("YouTube De-Crapifier initializing...");

// Hiding shorts from the homepage.
function removeShorts() {
	const shorts = [...document.querySelectorAll('ytd-rich-section-renderer')];
	for (const el of shorts) {
		if (el.innerText.toLowerCase().includes('shorts')) {
			el.style.display = 'none';
		}
	}
}

// Hiding the banner ads on the homepage for stuff like politics, sports, and etc.
function removePromoSections() {
	const banners = [...document.querySelectorAll('ytd-rich-section-renderer')];
	for (const el of banners) {
		if (
			el.innerText.toLowerCase().match(/(news|sports|elections|vote|playable|trending|podcasts)/)
		) {
			el.style.display = 'none';
		}
	}
}

// Setting homepage to show six items per row like it used to be.
function fixGridLayout() {
	const grid = document.querySelector('ytd-rich-grid-renderer');
	if (grid) {
		grid.style.setProperty('--ytd-rich-grid-items-per-row', '6');
		console.log("<YouTube De-Crapifier> Grid layout updated");
	}
}

// Removing any automatic mixes, trackers, and etc from homepage.
function cleanLinks() {
	const links = document.querySelectorAll('a[href*="/watch"]');
	for (const a of links) {
		try {
			const absoluteUrl = new URL(a.getAttribute('href'), location.origin);
			let changed = false;

			if (absoluteUrl.searchParams.has('si')) {
				absoluteUrl.searchParams.delete('si');
				changed = true;
			}

			if (absoluteUrl.searchParams.has('start_radio')) {
				absoluteUrl.searchParams.delete('start_radio');
				changed = true;
			}
			
			if (absoluteUrl.searchParams.has('pp')) {
				absoluteUrl.searchParams.delete('pp');
				changed = true;
			}

			const listParam = absoluteUrl.searchParams.get('list');
			if (listParam && listParam.startsWith('RD')) {
				absoluteUrl.searchParams.delete('list');
				changed = true;
			}

			if (changed) {
				// Write back the cleaned relative URL only (pathname + search)
				a.setAttribute('href', absoluteUrl.pathname + absoluteUrl.search);
			}
		} catch (err) {
			console.warn("[YTDC] Failed to clean URL:", a.href);
		}
	}
}

// Remove the annoying overlay recommendations & channel icon at the end of a video that often just interrupts the ending of a video.
function removeEndscreen() {
	const style = document.createElement('style');
	style.textContent = `
		.ytp-ce-element,
		.ytp-ce-element-drawer {
			display: none !important;
		}
	`;
	document.head.appendChild(style);
}

function runAll() {
	removeShorts();
	removePromoSections();
	fixGridLayout();
	cleanLinks();
	removeEndscreen();
}

// Initial run
runAll();

function cleanUrlParams(url) {
	const u = new URL(url, location.origin);

	if (u.searchParams.get('list')?.startsWith('RD')) {
		u.searchParams.delete('list');
	}
	u.searchParams.delete('si');
	u.searchParams.delete('start_radio');
	u.searchParams.delete('pp');

	return u.origin + u.pathname + u.search;
}

function installHoverCleaner() {
	document.body.addEventListener('mouseover', e => {
		const link = e.target.closest('a[href*="/watch"]');
		if (!link || link.dataset.ytdcCleaned) return;

		const dirtyHref = link.getAttribute('href');
		const cleanHref = cleanUrlParams(dirtyHref);
		if (dirtyHref !== cleanHref) {
			link.setAttribute('href', cleanHref);
			link.dataset.ytdcCleaned = "true";
		}
	}, { capture: true });
	
	document.body.addEventListener('click', (e) => {
	const link = e.target.closest('a[href*="/watch"]');
	if (!link) return;

	const dirty = link.href;
	const clean = cleanUrlParams(dirty);

	if (dirty !== clean) {
		e.preventDefault();
		e.stopImmediatePropagation();

		// Create and click a new clean <a> manually
		const a = document.createElement('a');
		a.href = clean;
		a.style.display = 'none';
		document.body.appendChild(a);
		a.click();
		a.remove();
	}
	}, { capture: true });
}

function watchShareInput() {
	const observer = new MutationObserver(() => {
		const input = document.getElementById('share-url');
		if (!input) return;

		const current = input.value;
		const cleaned = cleanUrlParams(current);

		if (current !== cleaned) {
			input.value = cleaned;

			// Also select it so the user can copy it easily
			input.select();
		}
	});

	observer.observe(document.body, { childList: true, subtree: true });
	
	document.addEventListener('input', (e) => {
	if (e.target?.id === 'share-url') {
		const input = e.target;
		const cleaned = cleanUrlParams(input.value);
		if (input.value !== cleaned) input.value = cleaned;
	}
});
}


// Re-run whenever new elements are added (YouTube is dynamic)
const observer = new MutationObserver(() => {
	runAll();
	installHoverCleaner();
	watchShareInput();
});
observer.observe(document.body, { childList: true, subtree: true });

console.log("YouTube De-Crapifier observer is now active.");