# Movie Review Mini Project

This is a simple movie review site built with HTML, CSS and JavaScript for a college web technologies mini project.

What is included
- `index.html` — simple login page (guest access redirects to the site)
- `home.html` — main movie listing and review UI
- `style.css` — styles for login and movie pages
- `script.js` — client-side logic (renders movies, handles reviews, stores reviews in localStorage)

How to run
1. Open `index.html` in your browser (double-click or use a local server).
2. Click Submit (or "Continue as guest") — you'll be taken to `home.html`.
3. Search movies, click "View" to see reviews, or click "Add Review" to submit a review.

Notes and assumptions
- Reviews are saved to browser localStorage; they are persistent per browser but not shared across machines.
- Movie posters use placeholder images. Replace `poster` URLs in `script.js` with real images if available.

Next steps (optional)
- Add user authentication and per-user reviews.
- Add movie detail pages and backend persistence.
- Allow editing/deleting reviews.
