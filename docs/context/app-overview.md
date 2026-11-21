# App overview

Flashcard app for learning times tables. React 19 + Vite 7 + Tailwind 4 frontend, Express 5 backend, Prisma 6 on SQLite. See `README.md` for setup basics.

## Layout
- `server.js`: single entry point. Express JSON API under `/api/*`. In development it mounts Vite in middleware mode (one process, port 3000, `npm run dev`). With `NODE_ENV=production` it serves the `dist/` folder built by `npm run build` instead.
- `src/main.jsx` -> `src/App.jsx`: top-level state (mode, level, problems). Shows a welcome dialog (sweetalert2), then a mode picker.
- Modes: `src/MemorizeMode.jsx` (read cards), `src/PracticeMode.jsx` (answer cards, marks mastered), `src/TestingMode.jsx` (scored test, can level up). `src/Header.jsx` and `src/LevelIndicator.jsx` are small display components.
- `src/gifSelector.js`: picks a random celebrate or upset GIF from `public/gifs/`. `src/fireworks.js` and `src/emoji.js` are visual helpers.

## Levels
- There is one user row (id 1) holding `level`. `App.jsx` filters problems by level (level 1 is the first set); passing a test calls `POST /api/user/level` to move to level 2.
- No auth and no multi-user support: `server.js` hardcodes user id 1.

## API (all in `server.js`)
- `GET /api/problems`, `POST /api/problems/:id/score`, `POST /api/problems/:id/attempt` (requires boolean `correct`, 400 otherwise; also bumps the aggregate counters), `GET /api/problems/:id/last5`, `POST /api/problems/:id/mastered`
- `GET /api/user`, `POST /api/user/level`
- `POST /api/test/score`, `GET /api/test/best`
- `POST /api/message/send`: stub that only logs the message; nothing is actually sent.

## Gotchas
- `README.md` says GIFs are named `celebrate1.gif`/`upset1.gif`, but the files in `public/gifs/` are `goodGif*` and `oopsGif*` (two are `.jpg`). `src/gifSelector.js` is the source of truth.
- The API has no input validation beyond `/attempt`; `score` and `mastered` assume the problem id exists.
- No tests exist. `npm run lint` runs ESLint (`eslint.config.js`).
