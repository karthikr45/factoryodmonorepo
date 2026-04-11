# FactoryOS

**Manufacturing operations + finance platform for SMB manufacturers in India.**

FactoryOS is a multi-tenant SaaS connecting factory owners, staffing agencies, and chartered accountants. Every business operation automatically creates an accounting entry — so the books write themselves.

---

## Monorepo structure

```
factoryos/
├── apps/
│   ├── web/          # Next.js 14 (factory / agency / ca / auth portals)
│   ├── mobile/       # Expo SDK 51 (owner / floor / worker)
│   ├── api/          # NestJS 10 backend
│   └── ai/           # Python FastAPI (OCR, insights, assistant)
├── packages/
│   ├── types/        # @repo/types — shared TS interfaces + enums
│   ├── validators/   # @repo/validators — shared Zod schemas
│   ├── database/     # @repo/database — Prisma schema + client
│   └── config/       # @repo/config — tsconfig, eslint, tailwind
├── turbo.json        # Turborepo pipeline
├── pnpm-workspace.yaml
└── package.json
```

---

## Tech stack

| Layer        | Tooling                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| Web          | Next.js 14, Tailwind, shadcn/ui, NextAuth v5, TanStack Query, Zustand   |
| Mobile       | Expo SDK 51, Expo Router v3, NativeWind v4, MMKV, TanStack Query        |
| API          | NestJS 10, Prisma, PostgreSQL, Redis, Socket.IO, Bull, Passport JWT     |
| AI           | Python 3.11, FastAPI, Anthropic Claude API, Tesseract OCR, Pandas       |
| Infra        | Vercel · Railway · Supabase · Upstash · EAS Build · GitHub Actions      |

---

## Prerequisites

- Node.js >= 20
- pnpm >= 9 (`npm i -g pnpm`)
- Python >= 3.11 (for `apps/ai`)
- Docker (optional, for local Postgres/Redis)

---

## Quickstart

```bash
# 1. Install all JS deps
pnpm install

# 2. Copy env and fill in values
cp .env.example .env

# 3. Generate Prisma client
pnpm db:generate

# 4. Run migrations (needs real DATABASE_URL)
pnpm db:migrate

# 5. Start everything in dev
pnpm dev
```

Run individual apps:

```bash
pnpm --filter @factoryos/web dev       # Next.js on :3000
pnpm --filter @factoryos/api dev       # NestJS on :4000
pnpm --filter @factoryos/mobile dev    # Expo Metro on :8081
```

For the Python AI service:

```bash
cd apps/ai
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## Multi-tenancy

Every table has `orgId`. Every Prisma query **must** filter by the current user's `orgId`. Enforced at three levels:

1. NestJS `OrgIsolationGuard` injects `orgId` from the JWT.
2. Service methods receive `orgId` as a mandatory parameter — never from request body.
3. Supabase Row Level Security policies at the database level as a final defense.

---

## Auth

Phone + OTP only. OTP delivered via Twilio SMS. JWT access (15m) + refresh (30d) stored in httpOnly cookies on web and Expo SecureStore on mobile.

---

## Money & Dates

- All monetary values stored as **integer paise** (₹1 = 100 paise). Never floats.
- Dates stored **UTC**, displayed **IST** (Asia/Kolkata).
- Phone numbers stored with `+91` country code.
- GSTIN stored uppercase and validated on input.

---

## Scripts

| Command           | Description                           |
| ----------------- | ------------------------------------- |
| `pnpm dev`        | Run all apps in parallel              |
| `pnpm build`      | Build all apps and packages           |
| `pnpm lint`       | Lint entire monorepo                  |
| `pnpm typecheck`  | Typecheck entire monorepo             |
| `pnpm test`       | Run all test suites                   |
| `pnpm db:generate`| Regenerate Prisma client              |
| `pnpm db:migrate` | Apply pending migrations              |
| `pnpm db:seed`    | Seed demo data                        |

---

## License

Proprietary © FactoryOS. All rights reserved.
