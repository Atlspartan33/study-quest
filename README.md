# Study Quest

Tori's homework study guides as kid games: study cards, quiz, sorts, a Georgia map, and "Say It!" test practice
checked off by a grown-up. Offline PWA, no build step, no dependencies.

- Live: https://atlspartan33.github.io/study-quest/ (GitHub Pages from `main`, repo Atlspartan33/study-quest)
- Install on Android: open the link in Chrome → ⋮ → **Add to Home screen**.
- Run locally: `node server.mjs 5243` → http://localhost:5243
- Add a new study guide: see `CLAUDE.md` (one data file per guide in `units/`). Push to `main` to redeploy and
  bump `VERSION` in `sw.js` so installed copies pick it up.
