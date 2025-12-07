
# Copilot Instructions for `boxbook`

## 🏗️ Architecture & Layering
- **App Router**: Split into `src/app/(public-pages)` and `src/app/(protected-pages)`. Protected pages use `src/app/(protected-pages)/layout.tsx` for auth gating via `getCurrentUserContext()`.
- **API Controllers**: Located in `src/app/api/**/route.ts`. Only parse/validate input, call matching service in `src/server/api/*.api.ts`, and shape HTTP responses.
- **Services & Repositories**: Business logic in `src/server/services`. Data access, selection, and pagination in `src/server/repositories`, which map Prisma models to DTOs from `src/server/types`.
- **Validation**: All input must be validated using Zod schemas in `src/server/schemas`. Never trust raw request data.
- **Result Type**: All service methods return `Result<T>` (`src/server/types/result.ts`).

## 🔐 Authentication & Session Health
- **NextAuth v5**: Configured in `src/server/auth/config.ts`. JWT callbacks re-validate users every 10 minutes using `UserRepository`.
- **Auth Helpers**: Use `src/server/lib/auth.ts` (`getCurrentUserContext`, `withRole`, `withPermission`) for all RBAC/session checks. Do not roll your own.
- **Session Monitoring**: Client components use `src/components/auth/session-health-monitor.tsx` and hooks in `src/hooks` for periodic session checks.

## 🧭 Frontend Patterns
- **UI Primitives**: Use Shadcn (`src/components/ui`) and select HeroUI widgets. Compose with `cn` from `@/lib/utils`.
- **Forms**: Use `react-hook-form` + Zod resolver. Surface errors via `FormMessage` components. See `LoginForm` for reference.
- **Maps/Geocoding**: Use `src/components/maps/interactive-leaflet-map.tsx` and update related helpers in `src/lib/form-persistence.ts` for address flows.
- **Dashboards**: Widgets in `src/components/dashboard/**` expect DTOs from repositories, not raw Prisma entities.

## 🗄️ Data & External Services
- **Prisma**: Client in `src/server/db/client.ts`. Migrations in `prisma/migrations`, seeds in `prisma/seed.ts` (see `SEED_DATA_GUIDE.md`).
- **External Integrations**: Geospatial, payments, Cloudinary handled via dedicated repositories (e.g., `PropertyRepository`). Add new DB access only in repositories.
- **Env Vars**: Validated in `src/env.js` using `@t3-oss/env-nextjs`. All new envs must be added here.

## 🧪 Developer Workflows
- **Dev Start**: `npm run dev -- --turbo`. For local Postgres: `./start-database.sh` (WSL recommended), then `npm run db:push && npm run db:seed`.
- **Testing**: Lint/typecheck: `npm run check`. Build/test: `npm run test:build` after `npm run build`. API smoke tests: `npm run test:api` (requires seeded properties).
- **TypeScript**: Strict mode, path alias `@/*`. Use absolute imports.
- **ESLint**: Flat config in `eslint.config.js`. Most rules are `warn`, not `error`. Avoid new `any` types.

## 🩺 Debugging & Observability
- **Logging**: Emoji logging (`🔍`, `❌`, `✅`) is intentional. Keep style for grepping logs.
- **Session Cleanup**: Use `/api/auth/validate-session`, `/api/auth/clear-session`, `/api/auth/emergency-reset` for login loop/debugging. Reuse utilities, don't rewrite.
- **Public Property Flows**: Update repository mappers (`getPublicPropertyDetail`) and integration tests (`__tests__/integration/api/public-property-detail.test.js`) when changing public property logic.

## 🚀 Contribution Checklist
- New features: Schema (Zod) → Controller → Service → Repository, each with targeted logging.
- Update docs/seeds in `docs/*.md` when data shapes change.
- Dashboards must respect role-based filtering (see `PropertyService.canManageProperty`).
- Document non-trivial flows in `IMPLEMENTATION_SUMMARY.md` or `IMPROVEMENTS_SUMMARY.md`.
