# Meital's Math Quest 🧮

An adaptive, mastery-based 7th grade math practice app for Meital, modeled on the
[Alpha School](https://alpha.school) learning methodology and aligned to the
[Massachusetts Curriculum Framework for Mathematics](https://www.doe.mass.edu/frameworks/current.html), Grade 7.

No install, no account, no server required — it's a single static web app that
runs entirely in the browser and saves progress locally.

## How it works (and how it maps to Alpha School)

| Alpha School idea | This app |
| --- | --- |
| AI tutor picks the right difficulty so students succeed ~80–85% of the time (zone of proximal development) | The adaptive engine picks question difficulty per skill based on current mastery, with some randomness to keep it a little unpredictable and interesting |
| ≥90% mastery required before moving on | Each of 20 skills has a 0–100% mastery score; a skill is "Mastered" at 85%+ and correct/incorrect answers move it up or down |
| Short focused sessions (25-min "Pomodoros") that close a Progress Ring | Practice happens in 8-question "Sprints" per domain; 5 Apple-Watch-style Progress Rings show mastery per math domain |
| "Alpha Bucks" — points redeemable for real rewards | "Points" (💎) are earned per correct answer (more for harder questions and answer streaks), redeemable in the Rewards Shop for rewards a parent configures |
| Guides track motivational levers per student | A Parent Zone lets a grown-up edit rewards, mark redemptions fulfilled, adjust the daily sprint goal, and see a full per-skill progress report |

## The 5 Grade 7 math domains (20 skills total)

Based on the MA Curriculum Framework's four critical areas for Grade 7, split into 5 domains:

- **⚖️ Ratios & Proportional Relationships** — unit rates, proportional relationships, percent problems (tax/tip/discount/growth), scale drawings
- **🔢 The Number System** — adding/subtracting integers, multiplying/dividing integers, operations with fractions & decimals, absolute value
- **🧮 Expressions & Equations** — simplifying expressions, two-step equations, word problems → equations, inequalities
- **📐 Geometry** — circles (area/circumference), area of composite figures, volume & surface area, angle relationships
- **🎲 Statistics & Probability** — mean/median/range, simple probability, compound probability, comparing data sets

Every question is **procedurally generated** with randomized numbers (not a fixed
bank), so practice is effectively unlimited and never repeats exactly.

## The flow

1. **Placement Quiz** (first run only) — one question per skill (20 total) sets a
   starting mastery estimate for every skill.
2. **Dashboard** — shows Meital's level/title, points, streak, today's goal, a
   recommended sprint (auto-picks the domain that needs the most work), and the
   5 mastery rings. Any ring/domain can also be picked manually.
3. **Sprint** — 8 adaptive questions from the chosen domain, weighted toward
   weaker skills. Immediate feedback + worked explanation after every question.
   Confetti + a badge toast on skill mastery.
4. **Progress Report** — a full table of all 20 skills: mastery %, status,
   attempts, accuracy, last practiced.
5. **Rewards Shop** — spend points on rewards a parent has configured.
6. **Parent Zone** — add/remove rewards, mark redemptions fulfilled, set the
   daily sprint goal, view the danger-zone reset.

## Points, streaks & badges

- Points scale with question difficulty (10/20/30 for Warm-Up/On Level/Challenge)
  plus a streak bonus for consecutive correct answers within a sprint.
- Mastering a skill mid-sprint awards a bonus; completing a sprint always earns a
  small participation bonus.
- A daily streak (🔥) increments once per calendar day with at least one
  completed sprint.
- 12 badges include per-domain "Champion" badges, a grand "Grade 7 Math Master"
  badge, streak badges, a "Perfect Sprint" badge, and a "Comeback Kid" badge for
  mastering something that was wrong on the placement quiz.

## Running it on iPad / iPhone

The app is a installable **Progressive Web App** — it works fully offline once
loaded, gets its own home screen icon, and opens full-screen (no Safari
address bar) just like a native app.

1. **Host it somewhere Safari can reach.** Easiest option: enable **GitHub
   Pages** for this repo — go to the repo's **Settings → Pages**, and under
   "Build and deployment" choose **Deploy from a branch**, then pick this
   branch (`claude/meital-math-learning-app-zc6yuo`, or `main` if/once this is
   merged) and the `/ (root)` folder. Save. GitHub gives you a URL like
   `https://<username>.github.io/<repo>/` — that's the link Meital opens on
   her device. (This one step needs a human with repo access — it can't be
   done from here.)
2. **On her iPad/iPhone**, open that URL in **Safari** (must be Safari, not
   Chrome, for the "Add to Home Screen" install step to work).
3. Tap the **Share** icon (square with an arrow) → **Add to Home Screen** →
   **Add**. A "Math Quest" icon now sits on her home screen and opens full
   screen, like any other app.
4. After the first visit, it keeps working **without wifi or data** — every
   file is cached locally, so it's fine in the car, on a plane, or anywhere
   with spotty signal.

You can also just open the hosted URL in mobile Safari directly without
installing it — it works the same either way, installing just makes it feel
more like a real app and skips the browser chrome.

## Running it locally / on desktop

Everything (HTML/CSS/vanilla JS) is self-contained with no build step and no
external dependencies. Just open `index.html` in a browser, or serve the
folder with any static file server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Progress is saved in the browser's `localStorage`, scoped to whatever
device/browser it's opened in — no login, no backend, no data leaves the
device. If Meital uses more than one device (say, her iPad at home and an
iPhone out and about), use **Parent Zone → Backup & Transfer** to download a
backup on one device and restore it on the other to bring progress along.

## Customizing

- **Rewards**: Parent Zone → Manage Rewards. Add/remove anything — screen time,
  treats, allowance, family activities — at whatever point cost feels right.
- **Daily goal**: Parent Zone → Daily Goal (default: 2 sprints/day).
- **Adding more skills/question types**: each skill is one generator function in
  `js/questions.js` (see the `GENERATORS` map at the bottom); add a new entry
  there and to the `SKILLS` array to introduce a new skill.
- **Reset progress**: Parent Zone → Danger Zone (irreversible).

## File structure

```
index.html         Page shell + nav
css/styles.css      All styling (light/dark aware, mobile responsive)
js/questions.js     Procedural question generators for all 20 skills
js/storage.js       localStorage persistence
js/engine.js        Adaptive difficulty, mastery updates, points, badges, levels
js/ui.js            All view rendering + event wiring
js/main.js          Bootstraps the app on page load
```
