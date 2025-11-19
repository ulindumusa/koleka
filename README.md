# Koleka Crowdfunding Demo

Multi-page, container-friendly crowdfunding experience inspired by Kickstarter/Indiegogo — complete with a modern marketing site, explore directory, project detail view, creator onboarding, and simulated MTN MoMo pledges. Everything runs in memory for quick demos (no database, no real payments).

## Features

- Landing page with hero stats, trending campaigns, and product storytelling
- Explore page with search & sort controls for live campaigns
- Project detail page with progress visuals, recent pledges, and demo MoMo checkout
- Launch page with guided project creation form (instant in-memory publishing)
- Demo signup that keeps the profile locally in your browser (localStorage)
- MTN MoMo pledge simulation to showcase the payment flow
- Container-ready Node.js + Express server serving static HTML/CSS/JS assets

## Pages

| Path | Purpose |
| ---- | ------- |
| `/` | Marketing hero page with stats, trending highlights, product pillars |
| `/projects` | Directory of all campaigns with search + sort controls |
| `/project?id=<uuid>` | Individual project detail, story, progress, and pledge form |
| `/create` | Guided form to launch a new project |
| `/signup` | Demo profile creation (persists to browser storage) |
| `/404` | Custom not-found fallback |

## Tech Stack

- Node.js 20 (Express)
- Vanilla JS modules per page (no frameworks)
- In-memory data stores (reset on server restart or page reload)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| POST | /api/signup | Demo signup: { name, email } |
| GET | /api/projects | List all projects |
| GET | /api/projects/:id | Get one project + pledges |
| POST | /api/projects | Create project: { title, description, goal, ownerName?, ownerEmail? } |
| POST | /api/projects/:id/fund | Simulated payment: { phone, amount } |

## Local Development

Install dependencies and run the dev server with automatic reload:

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

### Dev workflow tips

- `/js/common.js` centralises API helpers, formatting, and nav/auth UI wiring.
- Each page has a dedicated module under `/js/*` (e.g. `home.js`, `projects.js`).
- Styles live in `/html/styles.css`; tweak variables at the top for quick theming.
- All data is in memory — restarting the server or refreshing clears new projects/pledges.

## Production Run

```bash
npm ci --omit=dev
npm start
```

## Container Build

```bash
docker build -t koleka-demo .
docker run --rm -p 3000:3000 koleka-demo
```

Visit http://localhost:3000.

## Data Model (In-Memory)

```js
user: { id, name, email, createdAt }
project: { id, title, description, goal, raised, ownerName, ownerEmail, createdAt }
pledge: { id, projectId, amount, phone, timestamp }
```

## Notes & Limitations

- No persistence: Everything resets when the server restarts.
- Payments are simulated only; there is no MTN MoMo API integration.
- Security is intentionally minimal for demo purposes.
- Minimal mobile nav (desktop-first) — add a hamburger nav if you need production parity.
- This UI uses vanilla JS modules; add a build step if you want to transpile for legacy browsers.

## Next Steps (Possible Enhancements)

- Integrate real payment provider or MoMo sandbox
- Add user authentication (sessions/JWT)
- Persist data in a database (PostgreSQL, MongoDB, etc.)
- Add image uploads for projects
- Paginate project listing and add search
- Expand marketing site with more storytelling sections and testimonials
- Introduce creator/backer dashboards with analytics

---
Made for a fast clickable proof-of-concept.
