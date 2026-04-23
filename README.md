# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Dev auto-seeding on app startup

The dashboard can auto-seed Firebase sessions every time the app boots (dev/test only).

Set these environment variables:

1. Frontend (`.env` for Vite): `VITE_SEED_ON_STARTUP=true`
2. Flask API environment: `SEED_ON_STARTUP=true`

How it works:

1. `src/main.jsx` calls `runAutoSeedOnStartup()` before rendering the app.
2. That function calls `POST /api/dev/seed-startup` on Flask.
3. Flask (admin SDK) deletes only previously auto-seeded records (`seedMeta.source === "startup-auto-v1"`) and reseeds:
   - Weekday sessions across last 30 days and next 7 days
   - About 2 sessions/day/classroom in class-hour slots
   - At least one live in-progress session per classroom on every startup

Production safety:

- Frontend seeding call is skipped when `import.meta.env.PROD` is true.
- Flask endpoint returns 403 unless `SEED_ON_STARTUP=true` and environment is not production.

## Advanced Admin Dashboard

This project now includes an enterprise-style Admin Dashboard under `/admin` with:

- **Global Command Center** (`/admin`) with real-time room status cards and KPI tiles
- **Drill-down Navigation** (`/admin/drilldown/*`) for Campus → Building → Room → Session → Student
- **Classroom Control Panel** (`/admin/rooms/:roomId`) for sensor charts and device controls
- **Session Timeline Replay** (`/admin/sessions/:sessionId/timeline`) with play/pause, scrub, and filters
- **Incident Center** (`/admin/incidents`) for assignment, resolution, and notes
- **Attendance Intelligence** (`/admin/attendance-intelligence`) for lateness/early-exit trends
- **System Health Dashboard** (`/admin/ops-health`) for uptime, API performance, and event delays
- **Rule Engine** (`/admin/rules`) for IF/THEN automation rule management and simulation
- **Audit Logs** (`/admin/audit`) with searchable before/after action history

### Admin architecture

- `src/services/adminApi.js` — API integration layer for all admin modules
- `src/services/adminSocket.js` — WebSocket client with reconnect + topic subscribe
- `src/stores/useAdminDashboardStore.js` — centralized admin state store hook for real-time/shared state
- `src/hooks/useAdminResource.js` — standard loading/error/data fetch lifecycle
- `src/hooks/useAdminRealtime.js` — reusable WebSocket subscription hook
- `src/components/admin/**` — reusable admin cards, badges, charts, and module components
- `src/pages/admin/**` — route-level module pages

### Environment variables

- `VITE_ADMIN_WS_URL` — WebSocket endpoint (optional; falls back to API base transform)
- `VITE_ADMIN_LIVE_API=true` — enable live `/api/admin/*` calls (default is mock-first to avoid CORS/no-endpoint failures)
- `VITE_ADMIN_USE_MOCK=true` — force mock mode for admin APIs
- `VITE_ADMIN_FALLBACK_TO_MOCK=false` — disable fallback (default fallback is enabled)
- `VITE_ADMIN_REALTIME=true` — enable WebSocket realtime client
