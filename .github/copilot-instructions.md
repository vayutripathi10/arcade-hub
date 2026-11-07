# Arcade Hub — AI Assistant & Developer Instructions

When working on this codebase, you must strictly adhere to the project's architecture, design language, and rules outlined in [DEVELOPMENT_GUIDELINES.md](../DEVELOPMENT_GUIDELINES.md).

## Critical Directives

1. **Tech Stack Integrity**:
   - Pure Vanilla Web: HTML5, CSS3, Modern ES6+ JavaScript.
   - Do NOT introduce frameworks (React, Vue, Tailwind, Angular, Next.js) or build step bundlers (Vite, Webpack) unless explicitly instructed.
2. **Design Language**:
   - Cyberpunk Neon Glassmorphism: Deep space background (`#070a13`, `#0b0f19`), Neon Purple (`#8b5cf6`), Neon Cyan (`#00f5ff`), Neon Emerald (`#10b981`).
   - Card glassmorphism: `backdrop-filter: blur(12px)`, translucent borders (`rgba(139, 92, 246, 0.3)`).
   - Never use generic white backgrounds or unstyled native browser inputs.
3. **Mobile-First & Responsiveness**:
   - Every single layout change must be 100% responsive down to 360px viewport width with zero horizontal overflow (`overflow-x: hidden`).
   - Touch targets must be at least 44x44px.
4. **Sonora Music Engine & Audio Architecture**:
   - **Zero Double Audio**: Never instantiate more than one YouTube player or audio stream at once.
   - Background Hub browsing is managed via Sonora's in-app overlay (`#sonora-hub-overlay` with `index.html?in_sonora=1`).
   - `shared/global-sonora.js` must NEVER create `#arcade-global-sonora` if running inside an iframe (`window.self !== window.top`), or if `in_sonora=1` is present, or if Sonora is active elsewhere (`sonora_tab_active`).
5. **Deployment & Cache Management**:
   - Whenever editing a `.js` or `.css` file, bump its query string in HTML tags (e.g. `?v=...`).
   - Always increment `CACHE_NAME` in `sw.js` (e.g. `arcade-hub-cache-v312` -> `v313`).
   - In `_headers`, never set `/shared/*.js` to a 1-year cache. Keep it `max-age=0, must-revalidate`.
   - Never allow any line in `_headers` to exceed 2,000 characters.
