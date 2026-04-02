# SEO Checklist: Adding a New Game

When adding a new game to Arcade Hub, follow these steps to ensure it ranks well and integrates correctly:

## 1. Game Header (<head>)
Add the following meta tags to the game's `index.html`:
```html
<title>Game Name | Arcade Hub</title>
<meta name="description" content="Description of the game and how to play.">
<meta name="keywords" content="game-name, tags, arcade hub">
<link rel="canonical" href="https://arcadehubplay.com/[folder-name]/index.html">

<!-- Social Sharing (Open Graph) -->
<meta property="og:title" content="Game Name | Arcade Hub">
<meta property="og:description" content="Description of the game.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://arcadehubplay.com/[folder-name]/index.html">
<meta property="og:image" content="https://arcadehubplay.com/favicon.png">

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="Game Name | Arcade Hub">
<meta name="twitter:description" content="Description of the game.">
<meta name="twitter:image" content="https://arcadehubplay.com/favicon.png">
```

## 2. Update Sitemap (sitemap.xml)
Add a new `<url>` entry at the end of the `sitemap.xml` file:
```xml
<url>
    <loc>https://arcadehubplay.com/[folder-name]/index.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
</url>
```

## 3. Homepage (index.html)
Add a new game card to the `.games-grid` section in the root `index.html`.

## 4. News Section (updates.html)
Add a new `<article>` entry to the `updates.html` file to announce the release.

## 5. Verify & Push
- Run `git add .`
- Run `git commit -m "Added [Game Name] and updated SEO/Sitemap"`
- Run `git push`
