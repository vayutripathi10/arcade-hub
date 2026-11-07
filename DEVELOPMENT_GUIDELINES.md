# Arcade Hub & Sonora — Architecture, Design & Development Guidelines

> **Mandatory Developer Guide**: Any human developer, contributor, or AI coding assistant modifying this repository **MUST** strictly adhere to the rules, architectural patterns, and design language described in this document. Do not violate these constraints to ensure project stability, design cohesion, and seamless user experience.

---

## Table of Contents
1. [Core Architectural Philosophy](#1-core-architectural-philosophy)
2. [Visual Design System & UI/UX Standards](#2-visual-design-system--uiux-standards)
3. [Mobile-First & Touch Interaction Rules](#3-mobile-first--touch-interaction-rules)
4. [Sonora Music Hub & Background Audio Architecture](#4-sonora-music-hub--background-audio-architecture)
5. [Adding or Modifying Games](#5-adding-or-modifying-games)
6. [Caching, Service Worker & Cloudflare Deployment](#6-caching-service-worker--cloudflare-deployment)
7. [Code Quality & Dependency Rules](#7-code-quality--dependency-rules)
8. [Pre-Commit / Pre-Deploy Checklist](#8-pre-commit--pre-deploy-checklist)

---

## 1. Core Architectural Philosophy

* **Vanilla Web Standards**: Arcade Hub is intentionally built using pure **HTML5, CSS3, and modern ES6+ JavaScript**. 
  * **NO heavyweight frontend frameworks** (No React, Vue, Angular, Next.js, or heavy bundlers).
  * Fast load times, zero build overhead, and maximum browser longevity are core priorities.
* **Progressive Web App (PWA)**: The platform must function seamlessly as both a responsive web app and an installable desktop/mobile PWA.
* **Offline Resilience**: Essential shell components and games must gracefully handle spotty network connections via Service Worker caching (`sw.js`).

---

## 2. Visual Design System & UI/UX Standards

Arcade Hub follows a distinctive **Cyberpunk / Retro-Arcade Neon Glassmorphism** theme. Any new screen, card, modal, or component must match this visual identity.

### 2.1 Color Palette
* **Deep Space Backgrounds**: `#070a13` (canvas body), `#0b0f19` (main cards/panels), `#0f172a` (slate surfaces).
* **Neon Violet / Purple (Primary Accent)**: `#8b5cf6`, `#7c3aed`, `#6366f1` (buttons, active states, glowing card borders).
* **Cyber Cyan / Electric Blue (Secondary Accent)**: `#00f5ff`, `#06b6d4`, `#38bdf8` (headings, badges, progress rings).
* **Neon Green / Emerald (Success & Play)**: `#10b981`, `#059669` ("Play Now", correct answers, active streak).
* **Neon Pink / Coral (Special & High Energy)**: `#ec4899`, `#f43f5e` (destructive actions, alerts, special badges).
* **Text Colors**: `#ffffff` (primary headings), `#e2e8f0` (body text), `#94a3b8` (subtitles/muted labels).

### 2.2 Glassmorphism & Depth
* Cards and dialogs must use translucent backgrounds with subtle blurs:
  ```css
  background: rgba(14, 12, 24, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(139, 92, 246, 0.3);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(139, 92, 246, 0.15);
  border-radius: 14px;
  ```
* **Never use unstyled browser defaults**: Standard HTML select boxes, buttons, scrollbars, and checkboxes must always be styled with custom neon CSS.

### 2.3 Typography
* Primary fonts: `'DM Sans'`, `'Outfit'`, `'Inter'`, or system sans-serif fallbacks.
* Retro headings: `'Press Start 2P'` (sparingly, for 8-bit game titles or scoreboards).

---

## 3. Mobile-First & Touch Interaction Rules

Every single feature, page, modal, and game **must be tested on mobile viewport widths (360px – 430px)** before shipping.

1. **Zero Horizontal Overflow**:
   - The document body and root containers must never cause horizontal scrolling (`overflow-x: hidden`).
2. **Generous Touch Targets**:
   - All clickable elements (buttons, inputs, links, pills) must have a minimum touch target size of **44x44px** (preferably **48px–54px** for primary mobile actions).
3. **Safe Area Insets**:
   - Account for device notches, camera cutouts, and bottom navigation bars:
     ```css
     padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
     ```
4. **Dual Input Support for Games**:
   - Desktop: Support Keyboard (`WASD`, Arrow Keys, `Space`, `Enter`, `Escape`).
   - Mobile: Support on-screen virtual buttons, swipe gestures, or responsive touch taps. Always hide or adapt virtual controls when a keyboard is detected.
5. **No Sticky Touch Hover / Focus States**:
   - Mobile browsers keep `:hover` and `:focus` states active after a tap. Use `@media (hover: hover)` or explicitly blur buttons on question transitions to prevent sticky green/blue highlights.

---

## 4. Sonora Music Hub & Background Audio Architecture

Sonora is Arcade Hub's integrated music streaming engine. Because browser audio policies and YouTube embeds are fragile, **the following rules are strictly mandatory**:

### 4.1 Single Player Instance & Zero Floating Clutter
* **Never create more than one YouTube player or audio stream at any time.**
* **Mini Player Scoped to Sonora Only**: The video minimize (`🗗 Mini`) feature is strictly designed for `sonora.html` so users can browse playlists within Sonora.
* **Clean Background Playback on Other Pages**: When browsing the Home screen or playing games via Sonora's in-app hub overlay (`#sonora-hub-overlay` with `index.html?in_sonora=1`), **NO floating mini-player is rendered**. Music plays seamlessly in the background, and the top bar displays `← Back to Sonora` | `🎵 Playing in Background`, leaving the entire screen clean and unobstructed for games.

### 4.2 Seamless Navigation Shield (`shared/global-sonora.js`)
* `shared/global-sonora.js` functions strictly as a navigation shield for background playback.
* It ensures clicks on "Back to Sonora" or game exit buttons smoothly switch context without ever interrupting the background YouTube audio.
* It must **NEVER** instantiate floating video players, secondary iframes, or mini widgets on any external page.

### 4.3 Lock Screen & Background Playback
* Sonora maintains an active `navigator.mediaSession` with artwork, title, artist, and handlers (`play`, `pause`, `nexttrack`, `previoustrack`, `seekto`).
* Sonora activates a continuous silent audio bridge (`Audio(getSilentWavUrl())`) when background mode is toggled (`🎧`), preventing mobile browsers from killing the audio pipeline when the tab is hidden.

---

## 5. Adding or Modifying Games

When creating a new game or modifying an existing game in Arcade Hub:

### 5.1 Directory Structure
Each game follows a modular structure:
```
arcade-hub/
  ├── play-[game-name].html        <-- Top-level launcher & HUD wrapper
  ├── [game-name]-frontend/
  │     ├── index.html             <-- Game canvas / gameplay viewport
  │     ├── script.js              <-- Pure game logic
  │     └── style.css              <-- Game-specific styles & animations
```

### 5.2 Hub Navigation & Sonora Protection
* Every game wrapper (`play-[game-name].html`) must include:
  1. Standard Arcade Hub Top Bar with **"← Hub"** button (`#hub-btn` or `.hub-btn`).
  2. PWA setup script: `<script src="shared/pwa-setup.js"></script>`.
* Clicking "Exit" or "Hub" must never destroy the Sonora music session:
  - If running inside Sonora's hub browser, navigation must switch `src="index.html"` inside the parent frame rather than navigating `_top`.

### 5.3 Page Visibility & Game Pause
* All games must listen to the Page Visibility API:
  ```javascript
  document.addEventListener('visibilitychange', () => {
      if (document.hidden && gameState === 'PLAYING') {
          pauseGame();
      }
  });
  ```
* Games must automatically pause audio effects and game loops when backgrounded so device battery is not drained.

### 5.4 Audio & Sound Effects
* Keep game audio volume reasonable (`0.3` – `0.5`) so it does not overpower background Sonora music.
* Provide an on-screen mute/audio toggle in every game.

---

## 6. Caching, Service Worker & Cloudflare Deployment

Arcade Hub is deployed on Cloudflare Pages. Cloudflare aggressively caches static assets. To avoid deployment regressions or users being stuck on stale code:

### 6.1 Cloudflare `_headers` Rules
* **HTML Pages**: Must always revalidate:
  ```
  /*.html
    Cache-Control: public, max-age=0, must-revalidate
  ```
* **Shared Scripts (`/shared/*.js`)**: Must **NEVER** use 1-year cache headers (`max-age=31536000`). They must use:
  ```
  /shared/*.js
    Cache-Control: public, max-age=0, must-revalidate
  ```
* **Content Security Policy (CSP)**:
  - Keep each rule in `_headers` under **2,000 characters** (Cloudflare Pages hard limit). Exceeding this causes deployment error `[code: 100324]`.
  - When embedding external APIs, CDNs, or iframes, explicitly whitelist them in the relevant directive (`frame-src`, `connect-src`, `img-src`).

### 6.2 Cache Busting via Query Strings
* Whenever you update a script or stylesheet referenced in HTML files, bump its query string:
  - In `sonora.html`: `sonora.js?v=25`, `sonora.css?v=25`
  - In `index.html`: `shared/pwa-setup.js?v=321`
  - In `shared/pwa-setup.js`: `shared/global-sonora.js?v=21`

### 6.3 Service Worker Cache Versioning
* Whenever static assets are updated, **bump `CACHE_NAME` in `sw.js`** (Line 1):
  ```javascript
  const CACHE_NAME = 'arcade-hub-cache-v313'; // Increment version number
  ```
* This forces mobile PWAs and returning visitors to discard old caches and fetch the latest code.

---

## 7. Code Quality & Dependency Rules

1. **No External CSS Frameworks**: Do not introduce Bootstrap, Tailwind CDN, or Foundation. Write clean, scoped CSS with CSS variables.
2. **Vanilla JS Preferred**: Avoid pulling in jQuery, Lodash, or React. Use native ES6+ features (`fetch`, `async/await`, `Map`, `Set`, `URLSearchParams`, `MutationObserver`).
3. **Safe Storage Usage**: Always wrap `localStorage` access in `try...catch` blocks to prevent crashes in private/incognito browsing modes.
4. **HTML Escaping**: When rendering dynamic user inputs or playlist titles into the DOM, always sanitize strings with `escapeHtml()` to prevent XSS vulnerabilities.

---

## 8. Pre-Commit / Pre-Deploy Checklist

Before committing or pushing any code to `main`, verify:

- [ ] **Mobile Responsiveness**: Tested in mobile device mode (375px & 412px widths). No horizontal scrollbar.
- [ ] **Touch Targets**: All buttons, links, and game controls are easily tappable with fingers.
- [ ] **Single Audio Stream**: When testing Sonora, confirm that navigating to the home screen or games plays **only ONE audio stream**. No duplicate sounds.
- [ ] **Navigation**: Clicking "Home" and "Back to Sonora" transitions smoothly without page reloads or audio interruption.
- [ ] **Cache Bumps**:
  - [ ] Query version bumped on updated `.js` / `.css` script tags.
  - [ ] `CACHE_NAME` incremented in `sw.js`.
- [ ] **Header Limits**: `_headers` lines verified to be strictly under 2,000 characters.
- [ ] **Clean Console**: Open Developer Tools (`F12`) and confirm zero uncaught JavaScript errors or broken resource requests.
