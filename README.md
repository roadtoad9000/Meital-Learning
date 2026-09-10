# Meital's Math Quest 🧮

An adaptive, mastery-based math tutor for Meital, modeled on the
[Alpha School](https://alpha.school) learning methodology and aligned to the
[Massachusetts Curriculum Framework for Mathematics](https://www.doe.mass.edu/frameworks/current.html).

**It teaches, it doesn't just quiz.** Every level opens with a lesson — the idea,
the method, and a worked example you step through — before a single question is
asked.

No install, no account, no server. A single static web app that runs entirely in
the browser and saves progress on the device.

## The core idea: find the real gaps, then fill them

Alpha's tutor "identifies missing prerequisites and gives each student the lesson
they actually need, **even if that means fifth-grade material for a seventh
grader**." That is the model here.

Meital is *starting* 7th grade, so testing her on 7th grade content would mostly
measure what she hasn't been taught yet. Instead:

1. **Placement searches downward.** For each strand it binary-searches the
   prerequisite ladder to find the highest level she can actually do — dropping
   into Grade 6, 5, or 4 material as needed. ~13–18 questions, and there's a
   **"Haven't learned this yet"** button so she never has to guess.
2. **Anything she already knows is skipped.** No grinding through material she's
   demonstrated.
3. **Everything above that gets taught**, lowest gap first — because a Grade 5
   gap will sabotage Grade 7 work until it's closed.

## The teaching flow

Each level runs: **Lesson → Guided practice → Practice to mastery.**

- **Lesson** — the idea in plain language, the method as numbered steps, and a
  worked example revealed one step at a time.
- **Practice** — with a **💡 Hint** button (re-shows the method) and
  **📖 Show the lesson again**, always available.
- **A wrong answer is a teaching moment**, not a scold: it shows the full worked
  solution for *that* problem plus a reminder of the method, then hands her a
  fresh one.
- **Mastery is demonstrated, not guessed:** 4 correct in a row. Progress shows as
  pips so she can see how close she is. Mastering a level unlocks the next one.

## The ladder — 33 levels, Grades 4 → 7

| Strand | Levels | Spans |
| --- | --- | --- |
| 🔟 Whole Numbers | Multi-digit multiplication → division | G4–5 |
| 🍕 Fractions & Decimals | Equivalent fractions → negative fractions | G4–7 |
| 🌡️ Negative Numbers | Absolute value → multiplying/dividing integers | G6–7 |
| ⚖️ Ratios & Percents | Ratios → percent applications, scale drawings | G6–7 |
| 🧮 Expressions & Equations | Order of operations → inequalities | G5–7 |
| 📐 Geometry | Area of rectangles → surface area & composite figures | G4–7 |
| 🎲 Data & Probability | Mean/median/range → compound probability | G6–7 |

Every question is **procedurally generated**, so practice never runs out and
never repeats exactly.

## Motivation (the Alpha-style layer)

- **Points** scale with grade level, plus a streak bonus for consecutive correct answers.
- **Daily streak** 🔥 for practicing on consecutive days.
- **17 badges** — strand champions, "Grade 5/6/7 Cleared", Comeback Kid (mastering
  something missed on placement), and more.
- **🧸 Squish Collection** — mastering a level earns a collectible squishy (she's
  deep in a Nee Doh phase). Tap them; they squish.
- **Rewards Shop** — points buy real-world rewards a parent configures.

## For parents

**Parent Zone → "Where She Actually Is"** shows the **knowledge grade** per strand:
the highest grade fully mastered. Anything below Grade 7 is a real gap the app is
actively teaching. Below that, a per-level table with status, attempts and accuracy.

Also in Parent Zone: add/remove rewards, mark redemptions fulfilled, set the daily
goal, back up/restore progress, and reset.

## Running it on iPad / iPhone

It's an installable **PWA** — works offline once loaded, gets a home screen icon,
opens full-screen.

1. **Host it.** GitHub Pages (Settings → Pages → deploy from this branch) works if
   the repo is public; on a free plan a private repo can't use Pages, so
   [Netlify Drop](https://app.netlify.com/drop) is the easy alternative — drag the
   folder on, get a URL, code stays private.
2. **On her device**, open the URL in **Safari**.
3. **Share → Add to Home Screen → Add.**
4. After the first load it works **with no wifi or data**.

### Running locally

```bash
cd Meital-Learning
python3 -m http.server 8080
# then open http://localhost:8080
```

To try it on her iPad over the same wifi, find your computer's IP
(`ipconfig getifaddr en0` on a Mac) and visit `http://THAT-IP:8080`. Note that
offline mode only activates over HTTPS or localhost, so the LAN address won't cache.

## Customizing

- **Rewards / daily goal / reset**: Parent Zone.
- **Moving between devices**: Parent Zone → Backup & Transfer (progress is saved
  per-device in `localStorage`, and never leaves the device).
- **Adding levels**: each is one entry in `js/curriculum.js` with a `lesson`
  (idea, steps, worked examples) and a `gen()` question generator. Add it to the
  right strand in ladder order and everything else — gating, placement, the map —
  picks it up automatically.

## Files

```
index.html          Page shell
manifest.json       PWA manifest
sw.js               Service worker (offline support)
css/styles.css      All styling (light/dark, mobile-first)
js/curriculum.js    The 33-level ladder: lessons + question generators
js/storage.js       localStorage persistence
js/engine.js        Placement search, prerequisite gating, mastery, points, badges
js/ui.js            Lesson view, practice flow, dashboard, map, parent zone
js/main.js          Bootstrap
```
