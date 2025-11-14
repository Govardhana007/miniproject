// Simple movie review app using localStorage

const movies = [
    { id: 'm1', title: 'The Conjuring: Last Rites', year: 2023, poster: './The-Conjuring-Last-Rites-English.jpg', description: 'A chilling supernatural horror.' },
    { id: 'm2', title: 'Nobody 2', year: 2024, poster: './Nobody-2-English.jpg', description: 'High-octane action sequel.' },
    { id: 'm3', title: 'The-Fantastic-Four-First-Steps', year: 2023, poster: './The-Fantastic-Four-First-Steps-English.jpg', description: 'Sci-fi exploration at its best.' },
    { id: 'm4', title: 'F1-The-Movie', year: 2020, poster: './F1-The-Movie-English.jpg', description: 'A mystery that keeps you guessing.' }
];

// Poster candidate pool (can be replaced with real image URLs).
// Note: automated fetching from Google is not performed here; if you want actual Google images,
// provide the exact image URLs or place images in the project folder and update the list below.
const posterCandidates = [
    // placeholders that look like posters; replace these with real poster URLs when available
    'https://via.placeholder.com/300x450/111827/ffffff?text=Latest+Movie+1',
    'https://via.placeholder.com/300x450/1f2937/ffb86b?text=Latest+Movie+2',
    'https://via.placeholder.com/300x450/0b3d91/ffffff?text=Latest+Movie+3',
    'https://via.placeholder.com/300x450/7b2cbf/ffffff?text=Latest+Movie+4',
    'https://via.placeholder.com/300x450/2a9d8f/ffffff?text=Latest+Movie+5',
    'https://via.placeholder.com/300x450/e76f51/ffffff?text=Latest+Movie+6',
    'https://via.placeholder.com/300x450/023e8a/ffffff?text=Latest+Movie+7',
    'https://via.placeholder.com/300x450/ff006e/ffffff?text=Latest+Movie+8',
    'https://via.placeholder.com/300x450/0f172a/ffffff?text=Latest+Movie+9',
    'https://via.placeholder.com/300x450/264653/ffffff?text=Latest+Movie+10',
    'https://via.placeholder.com/300x450/8ac926/ffffff?text=Latest+Movie+11',
    'https://via.placeholder.com/300x450/ffbe0b/111827?text=Latest+Movie+12'
];

// If true, the scroll will use random unique posters from posterCandidates (no repeats).
// Set to false to use the posters from the `movies` array instead.
const useRandomScrollPosters = true;

// Optional: use The Movie Database (TMDB) to fetch real poster images.
// To enable, get an API key from https://www.themoviedb.org/ and paste it below.
// The script will fall back to posterCandidates if no key is provided or fetching fails.
const TMDB_API_KEY = '';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

/**
 * Fetch poster URLs from TMDB (popular/now_playing) until we have at least `count` unique posters.
 * Returns an array of poster URLs (strings). Falls back to empty array on error.
 */
async function fetchTMDBPosters(count = 8) {
    if (!TMDB_API_KEY) return [];
    const urls = new Set();
    const endpoints = [
        `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
        `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`
    ];
    try {
        for (const ep of endpoints) {
            const res = await fetch(ep);
            if (!res.ok) continue;
            const data = await res.json();
            (data.results || []).forEach(m => {
                if (m.poster_path) urls.add(TMDB_IMAGE_BASE + m.poster_path);
            });
            if (urls.size >= count) break;
        }
    } catch (e) {
        console.warn('TMDB fetch failed', e);
        return [];
    }
    return Array.from(urls).slice(0, count);
}

/**
 * Return an array of poster URLs to use in the scroll. Prefers TMDB when API key is set.
 */
async function getRandomPosterURLs(count = 8) {
    // try TMDB first
    if (TMDB_API_KEY) {
        const tmdb = await fetchTMDBPosters(count);
        if (tmdb && tmdb.length >= Math.min(count, 4)) return tmdb; // accept if at least a few results
    }
    // fallback: pick unique random from posterCandidates
    return pickUniqueRandom(posterCandidates, Math.min(count, posterCandidates.length));
}

// key for localStorage
const REVIEWS_KEY = 'movie_reviews_v1';

function loadReviews() {
    try { return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || {}; }
    catch (e) { return {}; }
}

function saveReviews(reviews) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

function getAverageRating(reviewsForMovie) {
    if (!reviewsForMovie || reviewsForMovie.length === 0) return null;
    const sum = reviewsForMovie.reduce((s, r) => s + Number(r.rating), 0);
    return (sum / reviewsForMovie.length).toFixed(1);
}

function renderMovies(filter = '') {
    const grid = document.getElementById('movie-grid');
    grid.innerHTML = '';
    const reviews = loadReviews();
    const q = filter.trim().toLowerCase();

    movies.filter(m => m.title.toLowerCase().includes(q)).forEach(m => {
        const card = document.createElement('article');
        card.className = 'card';
        const movieReviews = reviews[m.id] || [];
        const avg = getAverageRating(movieReviews);

        const starsHTML = renderStars(avg);

        card.innerHTML = `
            <img src="${m.poster}" alt="${m.title} poster">
            <div class="card-body">
                <h3 class="card-title">${m.title}</h3>
                <div class="card-meta">${m.year}</div>
                <div class="rating"> 
                    <span class="score" data-target="${avg ? avg : ''}">${avg ? avg : '—'}</span>
                    <small>${movieReviews.length} review(s)</small>
                </div>
                <div class="stars">${starsHTML}</div>
                <div class="card-actions">
                    <button class="btn secondary" data-action="view" data-id="${m.id}">View</button>
                    <button class="btn primary" data-action="review" data-id="${m.id}">Add Review</button>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
    // animate numeric averages after render
    animateAverages();
}

/* Render star HTML based on average (1-decimal or null) */
function renderStars(avg) {
    const max = 5;
    if (!avg) {
        return Array.from({ length: max }).map(() => `<span class="star">☆</span>`).join('');
    }
    const numeric = Math.round(Number(avg));
    return Array.from({ length: max }).map((_, i) => (i < numeric ? `<span class="star filled">★</span>` : `<span class="star">☆</span>`)).join('');
}

/* animate all score numbers (from 0 to target) */
function animateAverages() {
    const els = document.querySelectorAll('.score[data-target]');
    els.forEach(el => {
        const target = parseFloat(el.getAttribute('data-target'));
        if (!isFinite(target)) return;
        animateNumber(el, 0, target, 700);
    });
}

/* --- Movie scroll: populate a horizontal marquee-style track and make it loop --- */
function createScrollItem(m) {
    const item = document.createElement('div');
    item.className = 'scroll-item';
    item.innerHTML = `
        <img src="${m.poster}" alt="${m.title} poster" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
        <div class="released">Released: ${m.year}</div>
    `;
    // subtle hover pop
    item.addEventListener('mouseenter', () => item.style.transform = 'translateY(-6px) scale(1.02)');
    item.addEventListener('mouseleave', () => item.style.transform = 'translateY(0) scale(1)');
    return item;
}

async function renderScroll() {
    const track = document.getElementById('scroll-track');
    if (!track) return;
    track.innerHTML = '';
    // create items
    let items;
    if (useRandomScrollPosters) {
        const count = Math.max(6, Math.min(posterCandidates.length, 10)); // show between 6 and 10 posters
        // get poster URLs (prefer TMDB if API key provided)
        const urlsPromise = getRandomPosterURLs(count);
        // since renderScroll may be called synchronously from init(), support awaiting here
        // but if getRandomPosterURLs returns a promise, await it.
        // (we'll handle async by making init() await renderScroll)
        // create item elements from URLs
        const urls = await urlsPromise;
        items = urls.map((url, i) => createScrollItem({ poster: url, title: `Latest ${i + 1}`, year: new Date().getFullYear() }));
    } else {
        items = movies.map(m => createScrollItem(m));
    }
    // append two copies to allow seamless 50% translation
    items.forEach(it => track.appendChild(it));
    items.forEach(it => track.appendChild(it.cloneNode(true)));
    // calculate duration based on total width (approx) or number of items
    const duration = Math.max(12, items.length * 4); // seconds
    track.style.setProperty('--scroll-duration', duration + 's');
    track.setAttribute('data-animate', 'true');
}

/* pick n unique random items from an array */
function pickUniqueRandom(arr, n) {
    const copy = arr.slice();
    const out = [];
    n = Math.min(n, copy.length);
    for (let i = 0; i < n; i++) {
        const idx = Math.floor(Math.random() * copy.length);
        out.push(copy.splice(idx, 1)[0]);
    }
    return out;
}

/* animate number into element with one decimal */
function animateNumber(el, from, to, duration) {
    const start = performance.now();
    function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const value = from + (to - from) * t;
        el.textContent = value.toFixed(1);
        if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

/* small toast message */
function showToast(text, ms = 3000) {
    // remove existing toast if present
    const existing = document.querySelector('.toast');
    if (existing) {
        // fade out and remove immediately
        existing.style.opacity = '0';
        existing.style.transform = 'translateX(-50%) translateY(8px)';
        existing.addEventListener('transitionend', () => existing.remove(), { once: true });
    }

    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    document.body.appendChild(t);
    // Force paint then ensure visible (some browsers need explicit inline styles)
    // Start visible
    requestAnimationFrame(() => {
        t.style.opacity = '1';
        t.style.transform = 'translateX(-50%) translateY(0)';
    });

    // schedule hide after ms (default 3000ms)
    setTimeout(() => {
        // trigger fade/slide out using the CSS transition
        t.style.opacity = '0';
        t.style.transform = 'translateX(-50%) translateY(8px)';
        // remove after transition completes
        t.addEventListener('transitionend', () => {
            if (t && t.parentNode) t.parentNode.removeChild(t);
        }, { once: true });
    }, ms);
}

function openModal(forMovieId = null) {
    const modal = document.getElementById('review-modal');
    modal.setAttribute('aria-hidden', 'false');
    populateMovieSelect(forMovieId);
}

function closeModal() {
    const modal = document.getElementById('review-modal');
    modal.setAttribute('aria-hidden', 'true');
    document.getElementById('review-form').reset();
}

function populateMovieSelect(selectedId = null) {
    const select = document.getElementById('movie-select');
    select.innerHTML = '';
    movies.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id; opt.textContent = `${m.title} (${m.year})`;
        if (m.id === selectedId) opt.selected = true;
        select.appendChild(opt);
    });
}

function handleCardAction(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    if (action === 'review') openModal(id);
    if (action === 'view') showDetails(id);
}

function showDetails(id) {
    const movie = movies.find(m => m.id === id);
    const reviews = loadReviews()[id] || [];
    let details = `Title: ${movie.title}\nYear: ${movie.year}\n\nReviews:\n`;
    if (reviews.length === 0) details += 'No reviews yet.';
    else reviews.forEach(r => { details += `• (${r.rating}) ${r.text}\n`; });
    alert(details);
}

function handleReviewSubmit(e) {
    e.preventDefault();
    const movieId = document.getElementById('movie-select').value;
    const rating = document.getElementById('rating-select').value;
    const text = document.getElementById('review-text').value.trim();
    if (!movieId) return;
    const reviews = loadReviews();
    reviews[movieId] = reviews[movieId] || [];
    reviews[movieId].push({ rating, text, date: new Date().toISOString() });
    saveReviews(reviews);
    closeModal();
    renderMovies(document.getElementById('search').value);
    showToast('Review added — thank you!');
}

async function init() {
    renderMovies();
    await renderScroll();
    // event delegation for movie grid
    document.getElementById('movie-grid').addEventListener('click', handleCardAction);
    document.getElementById('add-review-btn').addEventListener('click', () => openModal());
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('review-form').addEventListener('submit', handleReviewSubmit);
    document.getElementById('search').addEventListener('input', e => renderMovies(e.target.value));

    // keyboard escape to close modal
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

document.addEventListener('DOMContentLoaded', init);
