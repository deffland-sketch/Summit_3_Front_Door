# Decisions

One line per technical decision, newest at the bottom. Product questions live in QUESTIONS.md.

- TypeScript pinned to 5.9 instead of the Vite template's 7.0 preview, so Vitest, tsx, and editor tooling behave predictably.
- Vite 8 + Tailwind v4 via `@tailwindcss/vite`; brand tokens live in `src/index.css` `@theme` and dark mode flips semantic tokens under `[data-theme="dark"]`.
- React Router 8 (`react-router` package) with routes `/s/:studentId/*`, `/m/:mentorId/*`, `/x/:adultId/*`, `/l/*` per Spec 9.
- Vitest runs unit tests from `src/**` and `seed/**`; Playwright runs `e2e/**` against `vite preview` on port 4173 (preinstalled Chromium at `/opt/pw-browsers`).
- `npm test` is unit tests only; `npm run test:e2e` runs Playwright separately so the pre-commit check stays fast.
- Lint is oxlint (Vite 8 template default); `npm run build` runs `tsc -b` with `strict` on before `vite build`.
- Path alias `@/` maps to `src/`.
- CI is one GitHub Actions job: `npm ci`, `npm run build`, `npm test`.
- Vercel deploy is static with an SPA rewrite in `vercel.json`.
