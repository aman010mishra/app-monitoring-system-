# AppMonitor

A full-stack application monitoring platform (Datadog-style) with real-time metrics, alerting, and user management.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/monitor-dashboard run dev` — run the dashboard (port 23893)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + WebSocket (`ws`) broadcasting every 3s
- Storage: JSON file store (`artifacts/api-server/data/`) — no database by design
- Frontend: React + Vite, Tailwind CSS v4, shadcn/ui, Recharts, Wouter, TanStack Query
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/`)
- Generated hooks: `lib/api-client-react/src/generated/api.ts`

## Where things live

- `artifacts/api-server/src/routes/` — all API route handlers
- `artifacts/api-server/src/lib/store.ts` — JSON file-based data store
- `artifacts/api-server/data/` — seed data JSON files (users, alerts, servers)
- `artifacts/monitor-dashboard/src/pages/` — all dashboard pages
- `artifacts/monitor-dashboard/src/contexts/AuthContext.tsx` — auth state + token management
- `artifacts/monitor-dashboard/src/hooks/useWebSocket.ts` — live metrics WebSocket hook
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks

## Architecture decisions

- JSON file storage (user rejected PostgreSQL) — data persists in `data/*.json` files
- Auth token: base64(`id:email:timestamp`) stored in `localStorage` as `am_token`
- Token attached via `setAuthTokenGetter` from `@workspace/api-client-react` custom-fetch
- WebSocket broadcasts live metrics every 3s on `/ws` path
- Dark mode forced via `document.documentElement.classList.add("dark")` in `main.tsx`

## Product

- **Dashboard** — system-wide overview with live metrics, status banners, and alert feed
- **APM** — response times (avg, P95), error rate, apdex, throughput, per-endpoint breakdown
- **Infrastructure** — CPU/memory/disk gauges, server fleet table, resource history charts
- **User Experience** — active sessions, page load times, bounce rate, frontend error log
- **Business** — DAU/WAU, conversion rate, revenue, signups, churn
- **Alerts** — filterable alert list with one-click acknowledgement
- **Admin** — full user CRUD with role/permission management (admin-only)

## Demo credentials

- Admin: `admin@appmonitor.io` / `admin123`
- Operator: `operator@appmonitor.io` / `operator123`

## User preferences

- JSON file storage only, no PostgreSQL/Drizzle
- Dark theme by default (Datadog-style dark slate palette)

## Gotchas

- After editing `lib/api-spec/openapi.yaml`, run codegen: `pnpm --filter @workspace/api-spec run codegen`
- Hooks with no path params take 1 argument only: `useGetApmSummary({ query: {...} })`, not 2
- WebSocket connects to `{protocol}://{host}{BASE_URL}/ws` — handled automatically in `useWebSocket.ts`
- Run `pnpm run typecheck:libs` before leaf artifact checks when changing lib packages

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
