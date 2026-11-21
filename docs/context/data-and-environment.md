# Data model and environment

## Schema (`prisma/schema.prisma`)
- Provider: SQLite, URL from the `DATABASE_URL` env var.
- `Problem`: `problem` text (e.g. "3 x 4"), `answer`, `correct`/`incorrect` counters, `mastered` flag.
- `Attempt`: one row per answer (`problemId`, `isCorrect`, `createdAt`), cascade-deleted with its problem, indexed on `(problemId, createdAt)`. Powers the "X out of the last 5" display.
- `User`: single row, `id` defaults to 1, holds `level`.
- `Test`: stored test scores (`score`, `createdAt`, `userId` default 1).

## Migrations and seeding
- One migration in `prisma/migrations/` (`20250816031219_init`), which includes the `Attempt` table. `README.md` describes `npx prisma migrate dev` or `npx prisma db push` for local DBs.
- `npm run seed` runs `prisma/seed.js`: it deletes all `Problem` rows (which cascades to attempts), upserts user 1 (level 1 only when the row is created; an existing user keeps its level, so the seed cannot reset it), then creates the 1x1 through 5x5 problems. Do not run it against a DB whose progress you want to keep.

## Environment
- Only `DATABASE_URL` is used by the app (read by Prisma). Values live in a local `.env`; do not copy or print them.
- `NODE_ENV=production` switches `server.js` to static serving from `dist/`.
- The port is fixed at 3000 in `server.js`.

## Repo quirks
- `.env` and `prisma/dev.db` are tracked in git even though they look local. Treat both as sensitive-by-default: do not paste their contents into docs, PRs or logs, and check before committing changes to either.
- `.gitignore` excludes `node_modules`, `dist` and `src/generated/prisma`.
- No CI workflows, Dockerfile or deploy config exist in the repo.
