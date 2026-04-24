# LTD2 Coach

> Blitz-style build advisor for [Legion TD 2](https://legiontd2.com/) — recommends optimal fighter builds per wave based on your rolls, economy, and opponent's send.

**Status:** 🚧 Scaffold — Milestone 0 complete. See [Roadmap](#roadmap) below.

---

## What is this?

LTD2 Coach helps Legion TD 2 players build better during the ~25 second window between waves. Two delivery modes:

1. **Web planner** — manually input your game state, get TOP 3 recommended builds with positioning.
2. **Desktop overlay** (later) — reads the game's log file and shows real-time recommendations automatically, like Blitz for League of Legends.

Built on top of the [official Legion TD 2 API](https://developer.legiontd2.com/) with permission-first approach: no memory reading, no input automation, no data the player can't already see.

---

## Monorepo layout

```
ltd2-coach/
├── apps/
│   ├── web/              Next.js 14 frontend (M3)
│   ├── api/              Fastify backend + Postgres + Redis (M1)
│   └── overlay/          Electron desktop overlay (M5)
├── packages/
│   ├── shared/           Shared types and constants
│   ├── engine/           Pure recommendation engine — isomorphic (M2)
│   └── ltd2-client/      Typed client for official LTD2 API (M1)
├── scripts/              Data sync, log capture, migrations
├── docker-compose.yml    Local Postgres + Redis
├── turbo.json            Turborepo pipeline
└── pnpm-workspace.yaml   pnpm workspaces
```

---

## Tech stack

| Layer      | Choice                                                |
| ---------- | ----------------------------------------------------- |
| Language   | TypeScript (strict mode, `noUncheckedIndexedAccess`)  |
| Runtime    | Node 20 LTS                                           |
| Monorepo   | pnpm workspaces + Turborepo                           |
| Frontend   | Next.js 14 (App Router), Tailwind, shadcn/ui, Zustand |
| Backend    | Fastify, Drizzle ORM, PostgreSQL 16, Redis 7          |
| Desktop    | Electron 30+ (M5)                                     |
| Testing    | Vitest                                                |
| Formatting | Prettier + ESLint 9 (flat config) + Husky pre-commit  |

---

## Quickstart

### Prerequisites

- **Node 20+** — use `nvm use` (reads `.nvmrc`)
- **pnpm 9+** — `npm install -g pnpm`
- **Docker + Docker Compose** — for local Postgres & Redis
- **LTD2 API key** — request at [developer.legiontd2.com](https://developer.legiontd2.com/)

### Setup

```bash
# 1. Clone and install
git clone <your-repo-url> ltd2-coach
cd ltd2-coach
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env and paste your LTD2_API_KEY

# 3. Start local infrastructure
pnpm db:up

# 4. (after M1 is done) Sync static game data
pnpm sync:data

# 5. (after M1/M3 is done) Run everything in dev mode
pnpm dev
```

### Useful scripts

```bash
pnpm dev              # Start all apps in dev mode (turbo parallel)
pnpm build            # Build all apps and packages
pnpm test             # Run all tests
pnpm lint             # Lint everything
pnpm type-check       # TypeScript check across monorepo
pnpm format           # Prettier --write on everything
pnpm db:up            # Start Postgres + Redis via Docker
pnpm db:down          # Stop containers
pnpm db:logs          # Tail container logs
pnpm sync:data        # Fetch units/waves/mercs from LTD2 API into Postgres
pnpm clean            # Remove all build artifacts + node_modules
```

### Working on a single package

```bash
pnpm --filter @ltd2-coach/engine test
pnpm --filter @ltd2-coach/web dev
pnpm --filter @ltd2-coach/api run sync:data
```

---

## Environment variables

All configuration lives in `.env` (see `.env.example` for full list). Never commit `.env`.

Key variables:

| Variable              | Purpose                             |
| --------------------- | ----------------------------------- |
| `LTD2_API_KEY`        | Auth for official Legion TD 2 API   |
| `DATABASE_URL`        | Postgres connection string          |
| `REDIS_URL`           | Redis connection string             |
| `API_PORT`            | Fastify port (default `3001`)       |
| `NEXT_PUBLIC_API_URL` | Where the web app looks for the API |

For production, set these in your hosting provider's dashboard (Vercel, Railway, Fly.io). Never in code, never in git history.

---

## Roadmap

| Milestone | Scope                                                           | Status     |
| --------- | --------------------------------------------------------------- | ---------- |
| **M0**    | Monorepo scaffold, tooling, Docker infra                        | ✅ Done    |
| **M1**    | LTD2 API client + Postgres schema + data sync                   | 🚧 Next    |
| **M2**    | Pure recommendation engine (damage/survival/value/meta scoring) | ⏳ Planned |
| **M3**    | Next.js web planner (manual input → TOP 3 builds)               | ⏳ Planned |
| **M4**    | **Launch checkpoint** — Reddit/Discord, feedback, partnerships  | ⏳ Manual  |
| **M5**    | Electron overlay + log parser (real-time mode)                  | ⏳ Planned |
| **M6**    | ML re-ranking (once 50k+ games collected)                       | ⏳ Future  |

Each milestone has its own prompt prepared for Claude Code. Run them sequentially, one session per milestone.

---

## Compliance & ethics

LTD2 Coach is an **assistive tool, not a cheat**. Hard rules:

- ❌ No reading the game's process memory
- ❌ No automating mouse/keyboard input
- ❌ No access to information the player can't already see (opponent rolls, secret info)
- ✅ Only reads public game log files (with user consent)
- ✅ Only uses the official LTD2 API and publicly aggregated community stats
- ✅ Open about what it does and how it works

Not affiliated with AutoAttack Games. Built with gratitude to the community — especially [Drachbot](https://drach.bot/) for the statistics ecosystem.

---

## Contributing

Not open for external contributions yet — still pre-launch. Once M3 ships, see `CONTRIBUTING.md` (will be added).

Before committing, Husky runs `lint-staged` which formats changed files. If the hook blocks you, run `pnpm format` and re-commit.

---

## License

TBD — will be decided before M3 public launch. Likely AGPL-3.0 or similar copyleft to keep the project free for players.
