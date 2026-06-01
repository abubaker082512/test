# Website Structure (BetPK‑Clone)

- Frontend: React (Next.js) SPA with server-side routing for SEO and fast loads.
- Backend/API: Node.js (Next API routes or separate Express) in the same Next.js app for simplicity, plus mock endpoints for initial data.
- Pages
  - / (Home) – header, hero, promo banner, game grid, bottom navigation
  - /games (optional) – catalog view (not required for MVP, can route from home)
  - /profile (requires auth; placeholder for future)
- Components
  - NavBar, GameCard, CategoryTabs (optional), PlayerWalletPanel (placeholder)
- API Routes (mock for MVP)
  - /api/games – returns sample game data (to be replaced with RapidAPI integration)
- Assets
  - Public assets directory for logos, icons (to be added)
