# braylees_times_table

## Development

- Install deps: `npm install`
- Start dev server: `npm run dev` (Express + Vite middleware on :3000)

## Last-5 Attempt Tracking

The app records each answer attempt per problem and displays “X out of the last 5 correct” in Practice and Testing modes.

Schema changes:

- Adds an `Attempt` table (`problemId`, `isCorrect`, `createdAt`).

Apply to the local SQLite DB:

- Option A: `npx prisma migrate dev -n add_attempts`
- Option B: `npx prisma db push` (no history)

Restart the dev server after applying.

## Celebrate/Upset GIFs

Place your GIFs in `public/gifs/` with names:

- `celebrate1.gif`, `celebrate2.gif`, `celebrate3.gif`
- `upset1.gif`, `upset2.gif`, `upset3.gif`

Edit `src/gifSelector.js` if you use different names.
