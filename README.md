# 🕹️ Arcade Hub

A high-performance retro and cyber-arcade gaming platform built entirely in the browser with HTML5, CSS3, and modern vanilla JavaScript. Includes **Sonora**, a persistent background music player and playlist manager that streams across all games and pages without interruption.

---

## 🌟 Key Features
- **20+ Instant Browser Games**: Retro Racer, Cyber Survivor, Neon Trivia, Space Shooter, Dino Runner, Flappy, Snake, Neon Dice, and more.
- **Sonora Music Engine**: Background music playback, custom playlist creator, YouTube link streamer, and persistent floating mini-player across the entire site.
- **Progressive Web App (PWA)**: Installable on Android, iOS, Windows, and macOS with offline gameplay support.
- **Zero Registration & Zero Ads**: Instant play with client-side local storage for achievements and high scores.
- **Universal Input**: Seamless automatic switching between Desktop keyboard (`WASD`, Arrows, Space) and Mobile touch/swipe controls.

---

## 📖 Development & Contribution Guidelines

> **IMPORTANT**: If you are developing new games, modifying existing screens, or fixing bugs in this repository, **you MUST follow our strict development rules and design system**.
>
> 👉 **Read the full developer guide here: [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md)**

### Key Rules at a Glance:
1. **Vanilla Web Only**: No heavyweight frameworks (No React, Vue, Angular, or bundlers).
2. **Cyberpunk Neon Aesthetics**: Maintain the deep-space background (`#070a13`), neon purple (`#8b5cf6`), cyber cyan (`#00f5ff`), and glassmorphism styling across all pages.
3. **Mobile-First & Touch Targets**: All screens must be tested down to 360px width with minimum 44x44px touch targets.
4. **Single Audio Stream**: Never instantiate duplicate YouTube players or audio streams when navigating between Sonora and games.
5. **Cache-Busting Discipline**: Always bump query versions on script tags and increment `CACHE_NAME` in `sw.js` before deploying to Cloudflare Pages.

---

## 🚀 Deployment

The project is hosted on **Cloudflare Pages**. 
- Edge routing and security headers are configured in [`_headers`](_headers).
- Service Worker caching is managed in [`sw.js`](sw.js).
