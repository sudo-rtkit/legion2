# @ltd2-coach/api

Fastify 5 REST API serving Legion TD 2 game data from a Neon PostgreSQL database.

## Quickstart

```bash
# 1. Install deps (from repo root)
pnpm install

# 2. Ensure .env at repo root has:
#    DATABASE_URL=postgresql://...?sslmode=require
#    LTD2_API_KEY=<your key>

# 3. Generate & apply migrations
pnpm --filter @ltd2-coach/api run db:generate
pnpm --filter @ltd2-coach/api run db:migrate

# 4. Seed database from live API
pnpm sync:data

# 5. Start dev server (port 3001)
pnpm --filter @ltd2-coach/api run dev
```

## Scripts

| Script        | Description                                        |
| ------------- | -------------------------------------------------- |
| `dev`         | Dev server with hot-reload (pino-pretty logs)      |
| `build`       | Compile TypeScript to dist/                        |
| `start`       | Run compiled server                                |
| `db:generate` | Generate Drizzle SQL migration from schema changes |
| `db:migrate`  | Apply pending migrations to the database           |
| `sync:data`   | Pull live data from LTD2 API and upsert into DB    |
| `type-check`  | TypeScript type check without emitting             |

## Endpoints

```
GET /health                  → { ok, timestamp, version }
GET /api/units               → Unit[]  (filter: ?legion=&class=)
GET /api/units/:id           → Unit | 404
GET /api/waves               → Wave[]
GET /api/waves/:levelNum     → Wave | 404
GET /api/legions             → Legion[]
GET /api/legions/:id         → Legion | 404
GET /api/patches/current     → { version, releasedAt }
GET /api/damage-matrix       → { attackType, armorType, multiplier }[]
```

## Database schema

Drizzle ORM + postgres-js driver. Migrations are stored in `./drizzle/`. Schema source: `src/db/schema.ts`.

> **Damage matrix values** are seeded from community data. Verify against
> https://legiontd2.fandom.com/wiki/Damage_Type — rows marked `?` in sync.ts need confirmation.

## Environment variables

| Variable       | Required        | Description                                         |
| -------------- | --------------- | --------------------------------------------------- |
| `DATABASE_URL` | yes             | Neon PostgreSQL connection string (sslmode=require) |
| `LTD2_API_KEY` | yes (sync only) | LTD2 API key for `sync:data`                        |
| `PORT`         | no              | HTTP port (default 3001)                            |
| `NODE_ENV`     | no              | `production` disables pino-pretty                   |
