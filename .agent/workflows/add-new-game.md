---
description: How to add a new game while maintaining SEO and site integrity
---

To add a new game to the Arcade Hub, follow these steps:

1. **Create the game folder**: Create a new directory for the game (e.g., `[game-name]-frontend`).
2. **Add SEO metadata**: Ensure the game's `index.html` contains:
    - `<title>` with " | Arcade Hub" suffix.
    - `<meta name="description">` and `<meta name="keywords">`.
    - `<link rel="canonical">` point to the live URL.
    - `og:*` and `twitter:*` tags using `https://arcadehubplay.com/favicon.png` as the image.
    - Google Analytics script matching other pages.
3. **Update Sitemap**: Open `sitemap.xml` and add a new `<url>` block for the game's `index.html`.
4. **Update Homepage**: Add a new game card to the `.games-grid` in the root `index.html`.
5. **Update About Us**: Open `about.html` and add the new game `span` to the `.game-list-horizontal` and increment the total games count under `.stats-bar`.
6. **Announce in News**: Add a new entry to `updates.html` and `index.html`.
7. **Deploy**: Stage, commit, and push all changes.
