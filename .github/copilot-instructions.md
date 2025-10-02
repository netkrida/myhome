# Copilot Instructions for `boxbook`

## 📦 Architecture & Layering
- App Router is split into `src/app/(public-pages)` and `src/app/(protected-pages)`; protected pages are wrapped by `src/app/(protected-pages)/layout.tsx` which blocks unauthenticated users via `getCurrentUserContext()`.
- API controllers live under `src/app/api/**/route.ts` and should only parse input, call the matching `src/server/api/*.api.ts` service, and shape the HTTP response.
- Application services (`src/server/api`) wrap domain rules, always return the shared `Result<T>` type (see `src/server/types/result.ts`) and usually run in the `withAuth` helper from `src/server/lib/auth.ts` to enforce RBAC.
- Domain logic belongs in `src/server/services`, while all database access, selection payloads, and pagination live in `src/server/repositories`. Repositories translate Prisma models to DTOs from `src/server/types`.
- Validation starts in `src/server/schemas` (Zod); controllers must not trust raw `request.json()` without round-tripping through these schemas.

## 🔐 Authentication & Session Health
- NextAuth v5 beta is configured in `src/server/auth/config.ts`; JWT callbacks re-validate users every 10 minutes using `UserRepository`. Any change to user state must stay in sync with this logic.
- Use helpers from `src/server/lib/auth.ts` (e.g., `getCurrentUserContext`, `withRole`, `withPermission`) instead of rolling your own auth checks. They centralize session validation, logging, and RBAC enforcement.
- Client components rely on `src/components/auth/session-health-monitor.tsx` and hooks in `src/hooks` for periodic session checks; keep these mounted on long-lived dashboards when adding layouts.

## 🧭 Frontend Patterns
- UI primitives come from Shadcn (`src/components/ui`) plus select HeroUI widgets; compose them with the `cn` helper from `@/lib/utils`.
- Forms use `react-hook-form` with Zod resolvers (see `LoginForm`); stick to this trio and surface errors through `FormMessage` components.
- Maps and geocoding flow through `src/components/maps/interactive-leaflet-map.tsx`; when touching address flows, update both the map component and related persistence helpers in `src/lib/form-persistence.ts`.
- Dashboard widgets typically live in `src/components/dashboard/**` and expect DTOs shaped by repositories, not raw Prisma entities.

## 🗄️ Data & External Services
- Prisma client is initialized in `src/server/db/client.ts`; schema migrations live in `prisma/migrations` and seeded fixtures in `prisma/seed.ts`, documented by `SEED_DATA_GUIDE.md` (includes role-based demo accounts).
- Geospatial data, payment hooks, and Cloudinary uploads surface via dedicated repositories (`PropertyRepository`, `PaymentRepository`, etc.); prefer adding new database access there rather than inside services.
- Environment variables are validated with `@t3-oss/env-nextjs` in `src/env.js`; add every new env to this schema or the build will fail.

## 🧪 Workflows & Tooling
- Start dev with `npm run dev -- --turbo`; if you need a local Postgres, run `./start-database.sh` (WSL recommended on Windows) and then `npm run db:push && npm run db:seed`.
- CI-equivalent checks: `npm run check` (lint + typecheck) and `npm run test:build` after a successful `npm run build`. API smoke tests use the custom runner at `npm run test:api` and expect seeded approved properties.
- TypeScript uses strict mode with path alias `@/*`; when adding files remember to use absolute imports to avoid broken lint rules.
- ESLint is configured via flat config in `eslint.config.js`; follow the existing rule relaxations (numerous `warn`s instead of `error`) and avoid introducing new `any` without justification.

## 🩺 Debugging & Observability
- Verbose emoji logging is intentional across API layers (`🔍`, `❌`, `✅`); keep the style consistent for easier grepping in production logs.
- Session-cleanup endpoints (`/api/auth/validate-session`, `/api/auth/clear-session`, `/api/auth/emergency-reset`) are the first line of defense when debugging login loops—reuse their utilities rather than rewriting cleanup code.
- When adjusting public property flows, mirror changes across repository mappers (`getPublicPropertyDetail`) and integration tests at `__tests__/integration/api/public-property-detail.test.js`.

## 🚀 Contribution Checklist
- For any new feature: schema (Zod) → controller → service → repository, each with targeted logging. Confirm seeds/docs in `docs/*.md` stay accurate when data shapes change.
- Update dashboards to respect role-based filtering (superadmin vs adminkos) by leveraging `PropertyService.canManageProperty` and existing status helpers.
- Document non-trivial flows in the relevant summary markdowns (`IMPLEMENTATION_SUMMARY.md`, `IMPROVEMENTS_SUMMARY.md`) so future agents can follow the historical context.
