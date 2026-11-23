# Career Radar Morocco

Career Radar is a mobile-first Progressive Web Application (PWA) designed for Moroccan IT students, junior developers, and PFE seekers. It evaluates user technical profiles against real Moroccan tech market data, providing deterministic matching, skill gap analysis, roadmaps, learning resource links, portfolio templates, and offline job tracking.

## Highlights

- **Market-Based Matching**: Matches skills across 121 normalized competencies against 4,774 eligible Moroccan job offers across major cities (Casablanca, Rabat, Marrakech, Tangier, Agadir, Remote).
- **Skill Gap & Point Simulator**: Highlights high-ROI missing competencies and estimates score gain (+X pts).
- **AI Career Planner**: Generates structured 4, 8, or 12-week milestones with offline deterministic generation and optional user-provided Gemini API key (BYOK). Includes continuous milestone adaptation.
- **Learning & Portfolio**: Curated technical documentation links, YouTube search queries, and 5-stage project readiness checklists.
- **Application Tracker**: Kanban application pipeline with follow-up reminders and technical interview question generator.
- **100% Offline-First Architecture**: Built on IndexedDB v3 with localStorage fallback; Service Worker precaching via Workbox; zero backend requirements.
- **Design System**: Warm organic Paw and Co theme (#F7F3EB cream, #2B4233 deep forest, #F2A86F peach).

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Vite 8, vite-plugin-pwa (Workbox offline service worker)
- IndexedDB (custom transactional wrapper)
- Vitest

## Local Setup

```bash
# Install dependencies
npm install

# Start local server
npm run dev

# Run unit tests
npm test

# Build production bundle
npm run build
```

## Deployment Configuration

Configured with `vercel.json` for single-page application routing and caching headers for static datasets.
