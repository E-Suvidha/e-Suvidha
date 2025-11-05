e-Suvidha / e-Seva — Frontend (Next.js) + Backend (Node/Express)

This repository contains the frontend application for the e-Suvidha (aka e-Seva) tender and bidding platform. The frontend is a Next.js (app router) application which talks to a Node/Express backend contained in the sibling `backend/` folder of the workspace. This README documents the full project (A–Z): features, architecture, setup, API, developer workflows, scripts, deployment, troubleshooting and contribution guidelines.

## Table of contents

- Project summary
- Key features
- Architecture & folders
- Frontend details (pages, components, lib)
- Backend overview (routes, controllers, models, middleware, scripts)
- API reference (endpoints, request/response shapes)
- Environment variables
- Local development (frontend + backend)
- Scripts, seeding and tests
- Deployment recommendations
- Troubleshooting & common issues
- Security considerations
- Contribution guide
- License & acknowledgements

## Project summary

e-Suvidha is a tender/bidding platform connecting organizations issuing tenders with suppliers/providers who place bids. The system supports public tender browsing, authenticated bidding, user and admin dashboards, notification handling, and an admin area for managing tenders and granting awards.

The repository is organized into two principal parts:

- `frontend/` — Next.js application (React) that provides the user interface for public users, authenticated users, and admins.
- `backend/` — Node.js + Express API (server) that serves JSON endpoints for authentication, tenders, bids, notifications, and user management.

This README lives in `frontend/` and documents the whole project so frontend and backend setup and usage are collocated for developer convenience.

## Key features

- Browse tenders with rich metadata and search/filtering
- User registration (regular & business flows)
- Authentication (JWT / session-based endpoints; admin pin protection for admin pages)
- Create tender (admin flow)
- Place a bid on a tender (authenticated users)
- Dashboard views for users and admins
- Notifications and activity feed
- Recommendation engine for tenders (simple engine in `lib/recommendationEngine.js`)
- Seed scripts and test helpers for local development

## Architecture & folders (quick tour)

Top-level folders in this workspace (relevant to this README):

- `frontend/` — Next.js app
	- `app/` — Next.js App Router pages and layouts
	- `src/components/` — React components used by pages
	- `src/lib/` — small client helpers (API wrapper, recommendation engine)
- `backend/` — Node/Express API
	- `controllers/` — request handlers (auth, bid, tender, notification, user)
	- `models/` — data models (Mongoose or plain JS models depending on DB choice)
	- `routes/` — express routes mapping endpoints to controllers
	- `middleware/` — authentication and other middleware
	- `config/` — DB and configuration setup
	- `scripts/` — helper scripts (seed, test helpers)

Read the file tree in the repository root to discover all files referenced in this README.

## Frontend details

Stack: Next.js (app router), React, CSS modules / global css (see `app/globals.css`). The frontend is structured to separate pages (`app/`) and reusable components (`src/components/`). Key parts:

- `app/` — routing and top-level UI
	- `app/page.js` — Public home page
	- `app/login/page.js` — Login page
	- `app/register/page.js` — Registration flow
	- `app/tenders/[id]/page.js` — Tender detail page (dynamic route)
	- `app/admin/` — Admin area with nested routes (create tender, bids, dashboard)
	- `app/dashboard/` — User dashboard

- `src/components/` — important components
	- `Header.js`, `Footer.js` — global layout elements
	- `TenderCard.js` — compact tender UI used in lists
	- `BidModal.js` — modal to create a bid for a tender
	- `NotificationList.js` — list of notifications
	- `admin/CreateTenderForm.js` — admin-facing create tender form

- `src/lib/api.js` — client API wrapper used by the frontend to call the backend. It centralizes base URL resolution using `NEXT_PUBLIC_API_BASE`.
- `src/lib/recommendationEngine.js` — a lightweight client-side helper to recommend tenders, used by some components.

Auth & guards
- `src/components/auth/AuthGuard.js` protects client routes, and `admin/AdminPinProtection.js` provides an extra admin-pin check for sensitive admin pages.
- Auth state is handled with NextAuth (see `app/api/auth/[...nextauth]/route.js`). The frontend uses the session provider in `providers/SessionProvider.js` to expose session data to components.

Design notes
- The UI uses server components for layout and client components for interactive elements like modal dialogs and forms. Check `app/layout.js` and admin layouts under `app/admin/layout.js`.

## Backend overview

Stack: Node.js, Express (single-file server `index.js`), with modular controllers and routes. Data persistence is in `config/db.js` (connects to MongoDB or any other DB depending on configuration). Models are under `models/`.

Key folders and responsibilities:

- `controllers/` — implement business logic per resource
	- `authController.js` — login, register, token/session management
	- `tenderController.js` — create, list, get tender details
	- `bidController.js` — place bid, list bids for tender
	- `notificationController.js` — create and fetch notifications
	- `userController.js` — profile CRUD, admin actions
- `routes/` — maps endpoints to controllers (`authRoutes.js`, `tenderRoutes.js`, `bidRoutes.js`, `notificationRoutes.js`, `userRoutes.js`)
- `middleware/authMiddleware.js` — enforces authentication and optionally checks admin roles or pins
- `config/db.js` — DB connection and configuration
- `scripts/` — convenient scripts such as `seedTenders.js`, `createTestUsers.js`, and quick API tests (`testPostBid.js`, `testGetTender.js`)

Testing
- There is a `__tests__/` directory in the backend that contains unit/integration tests (run via `npm test` from `backend/`). See `backend/package.json` for test script definitions.

## API reference (high-level)

Base URL: configure via environment variable `NEXT_PUBLIC_API_BASE` (frontend) and `PORT` / `MONGODB_URI` (backend). Example local base: `http://localhost:5000`.

Common endpoints (summary — check `backend/routes/` for exact paths):

- Authentication
	- POST /api/auth/register — register a new user
		- body: { name, email, password, userType, ... }
		- response: { user, token }
	- POST /api/auth/login — log in
		- body: { email, password }
		- response: { user, token }
	- GET /api/auth/me — current user (requires auth)

- Tenders
	- GET /api/tenders — list tenders (filters: search, category, status, pagination)
	- GET /api/tenders/:id — tender details
	- POST /api/tenders — create a tender (admin)
	- PUT /api/tenders/:id — update tender (admin)

- Bids
	- POST /api/bids — place a bid (requires auth)
		- body: { tenderId, amount, proposal, attachments? }
	- GET /api/bids?tenderId=... — list bids for a tender

- Notifications
	- GET /api/notifications — list current user's notifications
	- POST /api/notifications — create notification (internal)

- Users
	- GET /api/users/:id — user profile
	- PUT /api/users/:id — update profile

Authentication: most write endpoints require a valid JWT/Session cookie. The `authMiddleware` checks tokens and attaches user info to `req.user`.

Example request/response shapes

POST /api/bids

Request body:

{
	"tenderId": "6564a1f2...",
	"amount": 125000,
	"proposal": "We can deliver in 30 days",
	"metadata": { "company": "ABC Supplies" }
}

Response (201 Created):

{
	"id": "b5f9...",
	"tenderId": "6564a1f2...",
	"userId": "u9d2...",
	"amount": 125000,
	"proposal": "We can deliver in 30 days",
	"createdAt": "2025-10-08T10:00:00Z"
}

Refer to the backend `routes/` and `controllers/` for exact field names and validations.

## Environment variables

Frontend (create `.env.local` copying from any example file or create):

- NEXT_PUBLIC_API_BASE — e.g. `http://localhost:5000` (frontend uses this to call backend APIs)

Backend (create `.env` or use platform environment settings):

- PORT — default server port (e.g. 5000)
- MONGODB_URI — connection string (if using MongoDB); otherwise configure DB_CONNECTION accordingly
- JWT_SECRET — secret for signing JWTs
- ADMIN_PIN — optional admin PIN used by `AdminPinProtection`

Never commit secrets to version control. Use `.gitignore` to exclude local `.env` files.

## Local development (frontend + backend)

Below are recommended steps to get both frontend and backend running locally.

1) Start the backend

Open a terminal in `backend/` and install dependencies then run the server:

```powershell
cd backend; npm install; npm run dev
```

Typical `backend/package.json` scripts include `dev` (nodemon) and `start`.

Server should start on `http://localhost:5000` (or the port in your `.env`). Verify with the test endpoints or by running `scripts/testGetTender.js`.

2) Start the frontend

Open another terminal in `frontend/`:

```powershell
cd frontend; npm install; npm run dev
```

Frontend will start on the Next.js default (usually `http://localhost:3000`). Ensure `NEXT_PUBLIC_API_BASE` points to your backend (e.g. `http://localhost:5000`).

3) Seed data for a smooth dev experience

In `backend/scripts/` there are helper scripts:

- `createTestUsers.js` — creates test users (admin + suppliers)
- `seedTenders.js` — seeds example tenders

Run them with node after ensuring the backend can connect to the database:

```powershell
cd backend; node scripts/createTestUsers.js; node scripts/seedTenders.js
```

4) Quick API tests

There are tiny test scripts in `backend/scripts/` (`testPostBid.js`, `testGetTender.js`) which demonstrate usage of API endpoints. Use them for smoke tests.

## Scripts and tests

Typical scripts (look in each `package.json` for the definitive list):

- `npm run dev` — run dev server (frontend: next dev; backend: nodemon)
- `npm run build` / `npm run start` — build & start production server
- `npm test` — run backend tests in `__tests__`

Testing guidance:

- Backend tests are likely using Jest / Supertest. Run `cd backend && npm test`.
- Frontend unit tests (if present) will run with `cd frontend && npm test`.

## Deployment recommendations

Frontend

- Deploy the Next.js `frontend/` to Vercel for the simplest flow. Set environment variable `NEXT_PUBLIC_API_BASE` to your backend production URL.

Backend

- Deploy the `backend/` to a Node host: Render, Heroku, Railway, or a VM. Ensure environment variables (PORT, MONGODB_URI, JWT_SECRET) are configured.
- Use process managers (PM2) or containerization (Docker) for production deployments.

Production considerations

- Use HTTPS for all endpoints.
- Configure CORS to allow the frontend origin.
- Add rate-limiting and request validation for write endpoints.

## Troubleshooting & common issues

- 500 error on API calls: Inspect backend logs. Ensure DB is reachable and credentials are right (MONGODB_URI).
- CORS blocked requests: Ensure backend has CORS configured to allow requests from the frontend origin or set to allow `http://localhost:3000` in development.
- Wrong API base: If frontend requests 404, confirm `NEXT_PUBLIC_API_BASE` in `.env.local`.
- Auth failures: Check that JWT_SECRET matches what was used to create tokens; ensure cookies are sent if using cookies.
- Seed scripts failing: Make sure DB connection is correct and the server is not holding locks.

Quick debugging tips

- Use browser DevTools Network tab to inspect failing requests and responses.
- Use `curl` or `HTTPie` to reproduce backend API calls from the terminal.
- Check `backend/logs` (if present) or the terminal where backend is running for stack traces.

## Security considerations

- Never commit secrets. Use environment variables and secret stores in production.
- Use HTTPS and secure cookies for sessions in production.
- Validate and sanitize all inputs server-side. The controllers should validate numbers, strings and required fields.
- Rate-limit authentication endpoints to prevent brute-force attacks.

## Contribution guide

If you'd like to contribute:

1. Fork the repository and create a feature branch
2. Follow existing code style (ESLint + Prettier where configured)
3. Add tests for backend logic where appropriate
4. Run linters and tests locally before opening a PR

Coding conventions

- Frontend: Modern React patterns (server components for layout, client components for interactivity). Keep components small and focused.
- Backend: Keep controllers thin — business logic can be moved to services if it grows.

Reporting issues

- Create GitHub issues with a reproducible case, desired behavior, and any error logs.

## Useful file map (selected)

- frontend/
	- `app/page.js` — Public home
	- `app/login/page.js`, `app/register/page.js` — auth pages
	- `app/tenders/[id]/page.js` — tender detail
	- `src/components/` — UI components (Header, Footer, TenderCard, BidModal, NotificationList)
	- `src/lib/api.js` — API wrapper used across the frontend

- backend/
	- `index.js` — Express server bootstrap
	- `config/db.js` — DB connection
	- `routes/*.js` — route definitions
	- `controllers/*.js` — controller logic
	- `models/*.js` — data models
	- `middleware/authMiddleware.js` — auth enforcement
	- `scripts/` — seeding and helper scripts

## Maintenance & next-step suggestions

- Add request/response documentation (OpenAPI / Swagger) to the backend for machine-readable API docs.
- Add E2E tests (Cypress) to validate user flows like register -> login -> bid -> notification.
- Add CI to run linters and tests on PRs.

## A quick try-it checklist

1. In one terminal run the backend dev server:

```powershell
cd backend; npm install; npm run dev
```

2. In another terminal run the frontend dev server:

```powershell
cd frontend; npm install; npm run dev
```

3. Open `http://localhost:3000` and `http://localhost:5000` to verify both services are up.

4. Seed sample data (optional):

```powershell
cd backend; node scripts/createTestUsers.js; node scripts/seedTenders.js
```

## License & acknowledgements

This project does not include an explicit license file. Add a `LICENSE` at the repository root to clarify licensing.

Thanks to Next.js and the open-source libraries that make this stack productive.

---

If you'd like, I can also:

- add a minimal `frontend/.env.local.example` and `backend/.env.example` with recommended variables,
- generate an OpenAPI spec skeleton for the backend routes,
- or create a short CONTRIBUTING.md and CODE_OF_CONDUCT.md for this repo.

Tell me which of the above you'd like next and I will implement it.
