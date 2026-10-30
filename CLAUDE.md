# Study Quest — Tori's interactive study guides

Offline kid PWA (no build step, no dependencies). One engine; each homework study guide is a data file in `units/`.
Run: `node server.mjs 5243` → http://localhost:5243 (launch entry `study-quest` in `C:\Users\Terre\.claude\launch.json`).

## Adding next week's homework (the main recurring job)
Terrell sends photos of a study guide and says "add this to Study Quest". Do this:

1. **Transcribe the guide exactly.** Read every Q/A pair and every "standard" paragraph. Note the test date.
   Answers must match the teacher's wording — the test is graded against the guide, not against Wikipedia.
   If the guide is historically thin or one-sided, don't "correct" it in the answers; just never use the
   true-but-unlisted fact as a *wrong* choice (see the Three Sisters note in the Cherokee unit).
2. **Read the standards for what the test asks her to DO.** "State 3 similarities", "give examples",
   "explain why" = open response → those become `say` prompts with a grown-up checklist. Recognition games
   alone do not prepare her for a blank line.
3. **Copy `units/2026-11-06-cherokee-creek.js`** to `units/<test-date>-<topic>.js` and replace the content:
   - `facts` — one per Q/A. `a` = the study-card answer (teacher's words); `right` + 3 `wrong` = quiz
     choices (short, 2nd-grade reading level; one silly distractor is fine). `group` keys into `groups`
     (colors + icons for the chip); `std` keys into `standards`.
   - `sorts` — any "which one is it?" structure in the guide (A vs B vs Both, Then vs Now, category sorts).
     Bins come from `groups` unless the sort has its own `binDefs`. `why` adds a sentence after placing.
   - `say` — open-response prompts: `prompt`, `frame` (sentence starter shown as a hint), `points`
     (what a grown-up should listen for), `need` (how many points = test-ready).
   - `stations` — the home-screen games in order. Types: `learn`, `quiz`, `sort` (with `sort: '<key>'`),
     `map` (with `map: 'georgia'`, `explore` text per region, `questions` with accepted region ids), `say`.
     Drop stations that don't fit the content; a math unit might be just learn + quiz + say.
4. **Register it:** import + add to the list in `units/index.js`, add the file to `SHELL` in `sw.js`, and
   bump `VERSION` in `sw.js`. The home screen opens the unit with the nearest upcoming test by default;
   older units stay available under "Other study guides".
5. **Verify** in the browser: play every station start to finish (the `window.__sq.unit()` hook gives the
   answers for scripted play-throughs), then delegate to `ux-auditor`. Then redeploy (push to `main`).

New mode types go in `app.js` → `MODES`. New maps go in `maps/` and get registered in `MAPS`.
Use 🏾 skin-tone modifiers on any person/hand emoji. Avoid person emoji standing in for Native people.

## Files
- `app.js` — router, home, the five game modes, results, grown-up view. Progress in localStorage `sq:<unitId>`.
- `audio.js` — synthesized SFX + speechSynthesis read-aloud (everything is read aloud when sound is on).
- `maps/georgia.js` — simplified Georgia outline + Mountains / Piedmont / Coastal Plain, `regionAt(x, y)`.
- `units/` — one file per study guide + `index.js` list.
- `sw.js` — offline cache (shell + all units + Google Fonts). Only on HTTPS or localhost.
