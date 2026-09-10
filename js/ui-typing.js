/* Typing app UI. Shares the learner profile, points wallet and rewards with the
   math app — typing practice pays into the same rewards shop. */
(function (root) {
  var T = root.App.Typing;
  var Storage = root.App.Storage;

  var PASS_ACCURACY = 92;   // accuracy gate to advance; deliberately no speed gate
  var api = {};             // wired up by ui.js (shared helpers)
  var drill = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  function tstate(state) {
    if (!state.typing) {
      state.typing = { stageIdx: 0, stages: {}, keyStats: {}, bestWpm: 0, totalChars: 0, sessions: 0 };
    }
    if (!state.typing.stages) state.typing.stages = {};
    if (!state.typing.keyStats) state.typing.keyStats = {};
    return state.typing;
  }

  function stageDone(state, id) {
    var st = tstate(state).stages[id];
    return !!(st && st.completed);
  }

  function currentStageIdx(state) {
    var ts = tstate(state);
    for (var i = 0; i < T.STAGES.length; i++) {
      if (!stageDone(state, T.STAGES[i].id)) return i;
    }
    return T.STAGES.length - 1;
  }

  /* The keys being missed most — this is the "teach what they don't know" signal. */
  function weakKeys(state, limit) {
    var ks = tstate(state).keyStats;
    return Object.keys(ks)
      .filter(function (k) { return ks[k].total >= 4 && (ks[k].correct / ks[k].total) < 0.9; })
      .sort(function (a, b) { return (ks[a].correct / ks[a].total) - (ks[b].correct / ks[b].total); })
      .slice(0, limit || 5);
  }

  // ---------------- placement ----------------
  function renderPlacementIntro() {
    var state = api.getState();
    api.hideNav();
    api.setMain(
      '<div class="card center">' +
      '<div class="big-emoji">⌨️</div>' +
      '<h1>Show us what you\'ve got</h1>' +
      '<p>Type one silly sentence, however you normally type. Two fingers, looking at the keys — whatever. There is no wrong way to do this one.</p>' +
      '<div class="callout">We are not grading you. We just want to see <strong>which keys your fingers already know</strong>, so we can skip all of those and only teach the ones that trip you up.</div>' +
      '<button class="btn" id="tp-go">Let\'s Do It →</button>' +
      '<button class="btn secondary small block mt-2" id="tp-skip">Skip — just start at the beginning</button>' +
      '</div>');
    $('#tp-go').addEventListener('click', function () { startDrill(0, true); });
    $('#tp-skip').addEventListener('click', function () {
      tstate(state).placed = true;
      api.save();
      renderHome();
    });
  }

  function finishPlacement(accuracy, wpm) {
    var state = api.getState();
    var ts = tstate(state);
    var passed = T.stagesPassedFrom(ts.keyStats, 0.9);
    var count = 0;
    Object.keys(passed).forEach(function (id) {
      var rec = ts.stages[id] || { attempts: 0, bestAccuracy: 0, completed: false };
      if (!rec.completed) { rec.completed = true; rec.placed = true; count++; }
      rec.bestAccuracy = Math.max(rec.bestAccuracy, accuracy);
      ts.stages[id] = rec;
    });
    ts.placed = true;
    ts.placementResult = { accuracy: accuracy, wpm: wpm, date: Storage.todayStr() };
    api.save();

    var idx = currentStageIdx(state);
    var stage = T.STAGES[idx];
    var weak = weakKeys(state, 6);

    api.setMain(
      '<div class="card">' +
      '<div class="center"><div class="big-emoji">🔎</div><h1>Here\'s What We Found</h1></div>' +
      '<div class="type-scores">' +
      '<div><span class="ts-num">' + accuracy + '%</span><span class="ts-lab">accuracy</span></div>' +
      '<div><span class="ts-num">' + wpm + '</span><span class="ts-lab">words/min</span></div>' +
      '</div>' +
      (count
        ? '<p class="center">Your fingers already know <strong>' + count + ' level' + (count === 1 ? '' : 's') + '</strong> worth of keys — we\'ll skip straight past those.</p>'
        : '<p class="center">We\'ll start you right at the beginning, which is exactly where most people start. No shame in it at all.</p>') +
      (weak.length
        ? '<div class="callout"><strong>The keys tripping you up:</strong> ' +
          weak.map(function (k) { return '<kbd>' + esc(k) + '</kbd>'; }).join(' ') +
          '<br>These are what we\'ll drill — not the ones you already have.</div>'
        : '') +
      '<div class="lesson-h mt-2">🎯 Starting you here</div>' +
      '<div class="tstage current"><span class="tstage-icon">⌨️</span><span class="tstage-name">' + esc(stage.name) + '</span></div>' +
      T.renderKeyboard({ learned: stage.learned, heat: true, accuracy: ts.keyStats }) +
      '<p class="text-soft center" style="font-size:.82rem">Green keys are solid. Red keys need work. This map updates every time you practise.</p>' +
      '<div class="center mt-2"><button class="btn" id="tp-start">Start Learning →</button></div>' +
      '</div>');
    api.confetti();
    $('#tp-start').addEventListener('click', renderHome);
  }

  // ---------------- home ----------------
  function renderHome() {
    var state = api.getState();
    var ts = tstate(state);
    if (!ts.placed) return renderPlacementIntro();
    if (api.renderNav) api.renderNav('typing');   // drills hide the nav; restore it here
    var idx = currentStageIdx(state);
    var stage = T.STAGES[idx];
    var doneCount = T.STAGES.filter(function (s) { return stageDone(state, s.id); }).length;
    var weak = weakKeys(state, 5);

    var ladder = T.BRANCHES.map(function (br) {
      var inBranch = T.STAGES.filter(function (s) { return s.branch === br.id; });
      var doneIn = inBranch.filter(function (s) { return stageDone(state, s.id); }).length;
      var rows = inBranch.map(function (s) {
        var i = s.index;
        var done = stageDone(state, s.id);
        var cur = i === idx;
        var st = ts.stages[s.id];
        var note = st && st.placed ? 'already knew it' : (st && st.bestAccuracy ? st.bestAccuracy + '% best' : '');
        return '<div class="tstage ' + (done ? 'done' : cur ? 'current' : 'locked') + '"' +
          (done || cur ? ' data-stage="' + i + '"' : '') + '>' +
          '<span class="tstage-icon">' + (done ? '✅' : cur ? '⌨️' : '🔒') + '</span>' +
          '<span class="tstage-name">' + esc(s.name) + '</span>' +
          '<span class="tstage-keys">' + (s.keys.length ? s.keys.map(function (k) { return '<kbd>' + esc(k) + '</kbd>'; }).join('') : '<em>review</em>') + '</span>' +
          '<span class="tstage-note">' + note + '</span></div>';
      }).join('');
      return '<div class="tbranch">' +
        '<div class="tbranch-head"><span>' + br.emoji + ' <strong>' + esc(br.name) + '</strong></span>' +
        '<span class="text-soft">' + doneIn + ' / ' + inBranch.length + '</span></div>' +
        '<div class="tbranch-blurb">' + esc(br.blurb) + '</div>' + rows + '</div>';
    }).join('');

    api.setMain(
      '<div class="grid" style="gap:16px;">' +
      '<div class="card next-up">' +
      '<div class="next-label">⌨️ NEXT TYPING LESSON</div>' +
      '<h2>' + esc(stage.name) + '</h2>' +
      '<p>' + esc(stage.blurb) + '</p>' +
      T.renderKeyboard(stage.keys.length
        ? { nextKey: stage.keys[0], learned: stage.learned, newKeys: stage.keys }
        : { learned: stage.learned }) +   // review level: nothing new to point at
      '<button class="btn block" id="t-start">' + (stageDone(state, stage.id) ? 'Practise Again →' : 'Teach Me These Keys →') + '</button>' +
      '</div>' +

      '<div class="card">' +
      '<div class="section-title"><h2>Your Progress</h2><span class="text-soft">' + doneCount + ' / ' + T.STAGES.length + ' levels</span></div>' +
      '<div class="bar-bg"><span class="bar-fill" style="width:' + Math.round((doneCount / T.STAGES.length) * 100) + '%;background:var(--accent)"></span></div>' +
      (ts.bestWpm ? '<p class="mt-1">Best speed so far: <strong>' + ts.bestWpm + ' words per minute</strong></p>' : '<p class="mt-1 text-soft">Speed comes later — accuracy first.</p>') +
      '</div>' +

      '<div class="card">' +
      '<div class="section-title"><h2>🎯 Your Keyboard Heat Map</h2><span class="text-soft">green = solid, red = needs work</span></div>' +
      '<p>This is exactly what to practise next — the app picks these keys for you automatically.</p>' +
      T.renderKeyboard({ learned: T.STAGES[idx].learned, heat: true, accuracy: ts.keyStats }) +
      (weak.length
        ? '<p class="mt-1">Trickiest keys right now: ' + weak.map(function (k) { return '<kbd>' + esc(k) + '</kbd>'; }).join(' ') + '</p>'
        : '<p class="mt-1 text-soft">Not enough data yet — do a few drills and this will fill in.</p>') +
      '</div>' +

      '<div class="card"><h2>🌳 Your Typing Tree</h2><p>Each branch unlocks the next. You can only move up once the row below is solid.</p><div class="tstage-list">' + ladder + '</div></div>' +
      (api.squishyCollection ? api.squishyCollection() : '') +
      '</div>'
    );
    if (api.wireSquishies) api.wireSquishies(document);

    $('#t-start').addEventListener('click', function () { renderLesson(idx); });
    $all('.tstage[data-stage]').forEach(function (el) {
      el.addEventListener('click', function () { renderLesson(parseInt(el.getAttribute('data-stage'), 10)); });
    });
  }

  // ---------------- lesson (teach the keys before drilling) ----------------
  function renderLesson(idx) {
    var state = api.getState();
    var stage = T.STAGES[idx];
    var demoKey = stage.keys[0] || null;   // review levels teach no new key
    api.hideNav();
    api.setMain(
      '<div class="card lesson">' +
      '<div class="quiz-meta"><span>⌨️ Typing · Level ' + (idx + 1) + '</span></div>' +
      '<h1>' + esc(stage.name) + '</h1>' +
      '<div class="lesson-idea"><div class="lesson-h">💡 The idea</div><p>' + esc(stage.blurb) + '</p></div>' +
      (stage.keys.length
        ? '<div class="lesson-h mt-2">👇 New keys — and the finger that owns each one</div>' +
          '<div class="key-teach">' + stage.keys.map(function (k) {
            var f = T.FINGERS[T.fingerFor(k)];
            return '<div class="key-teach-item" style="border-color:' + f.color + '">' +
              '<div class="key-teach-key" style="background:' + f.color + '">' + esc(k) + '</div>' +
              '<div class="key-teach-finger">' + esc(f.name) + '</div></div>';
          }).join('') + '</div>'
        : '') +
      T.renderKeyboard(demoKey
        ? { nextKey: demoKey, learned: stage.learned, newKeys: stage.keys }
        : { learned: stage.learned }) +
      (demoKey ? T.renderHands(T.fingerFor(demoKey)) : '') +
      '<div class="callout mt-2"><strong>Golden rule:</strong> don\'t look at your hands. Look at the screen. It feels impossible at first and then suddenly it isn\'t. Being slow is completely fine — being accurate is what counts.</div>' +
      '<button class="btn block mt-2" id="t-go">Start Typing →</button>' +
      '<button class="btn secondary small block mt-1" id="t-back">Back</button>' +
      '</div>'
    );
    $('#t-go').addEventListener('click', function () { startDrill(idx); });
    $('#t-back').addEventListener('click', renderHome);
  }

  // ---------------- the drill ----------------
  function startDrill(idx, isPlacement) {
    var state = api.getState();
    var stage = T.STAGES[idx];
    drill = {
      idx: idx,
      stage: stage,
      placement: !!isPlacement,
      text: isPlacement ? T.placementText() : T.drillText(stage, weakKeys(state, 4)),
      pos: 0,
      typed: 0,
      errors: 0,
      startedAt: null,
      perKey: {},
      finished: false
    };
    renderDrill();
  }

  function renderDrill() {
    var stage = drill.stage;
    api.hideNav();
    api.setMain(
      '<div class="card typing-card">' +
      '<div class="quiz-meta"><span>⌨️ ' + (drill.placement ? 'Placement — type it however you like' : esc(stage.name)) + '</span>' +
      '<span class="text-soft" id="t-live"></span></div>' +
      '<div class="type-target" id="t-target"></div>' +
      '<div id="t-kb"></div>' +
      '<div id="t-hands"></div>' +
      '<div class="quiz-actions mt-2">' +
      '<button class="btn secondary small" id="t-restart">↻ Restart line</button>' +
      '<button class="btn secondary small" id="t-quit">Finish</button>' +
      '</div>' +
      '<div class="text-soft mt-1" style="font-size:.8rem">' +
      (drill.placement
        ? 'Type it however you normally would — hunt and peck is completely fine. We are just watching which keys you already know.'
        : 'Tip: if you hit the wrong key nothing moves — just try again. Wrong letters never get typed here, so you can\'t practise a mistake.') +
      '</div>' +
      '</div>'
    );
    paintDrill();
    $('#t-restart').addEventListener('click', function () { startDrill(drill.idx); });
    $('#t-quit').addEventListener('click', function () { finishDrill(false); });
    document.addEventListener('keydown', onKey);
  }

  function paintDrill() {
    var t = drill.text;
    var html = '';
    for (var i = 0; i < t.length; i++) {
      var ch = t[i] === ' ' ? '␣' : esc(t[i]);
      var cls = i < drill.pos ? 'done' : (i === drill.pos ? 'cur' : '');
      html += '<span class="tc ' + cls + '">' + ch + '</span>';
    }
    var el = $('#t-target');
    if (el) el.innerHTML = html;

    var next = t[drill.pos] || '';
    var kb = $('#t-kb');
    if (kb) {
      kb.innerHTML = drill.placement
        // Placement measures what they can ALREADY do, so the keyboard is a plain
        // reference: nothing dimmed (they're using every letter) and no next-key
        // highlight, which would otherwise hand them the answer and inflate the score.
        ? T.renderKeyboard({ learned: T.ALL_KEYS })
        : T.renderKeyboard({ nextKey: next, learned: drill.stage.learned, newKeys: drill.stage.keys });
    }
    var hands = $('#t-hands');
    if (hands) hands.innerHTML = drill.placement ? '' : T.renderHands(T.fingerFor(next));

    var live = $('#t-live');
    if (live) {
      var acc = drill.typed ? Math.round(((drill.typed - drill.errors) / drill.typed) * 100) : 100;
      live.textContent = drill.typed ? (acc + '% accurate') : 'Take your time';
    }
  }

  function onKey(e) {
    if (!drill || drill.finished) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var expected = drill.text[drill.pos];
    if (expected === undefined) return;
    var got = e.key;
    if (got === 'Shift' || got === 'CapsLock' || got === 'Tab' || got === 'Alt') return;
    if (got.length !== 1 && got !== ' ') return;
    e.preventDefault();

    if (!drill.startedAt) drill.startedAt = Date.now();
    drill.typed += 1;
    var key = expected.toLowerCase();
    drill.perKey[key] = drill.perKey[key] || { correct: 0, total: 0 };
    drill.perKey[key].total += 1;

    if (got.toLowerCase() === expected.toLowerCase()) {
      drill.perKey[key].correct += 1;
      drill.pos += 1;
      paintDrill();
      if (drill.pos >= drill.text.length) finishDrill(true);
    } else {
      // Wrong key: do NOT advance. Practising an error cements the error.
      drill.errors += 1;
      var cur = $('.tc.cur');
      if (cur) {
        cur.classList.remove('shake'); void cur.offsetWidth; cur.classList.add('shake');
      }
      var kbKey = $('#t-kb .kb-key[data-key="' + (expected === ' ' ? ' ' : expected.toLowerCase()) + '"]');
      if (kbKey) { kbKey.classList.remove('nudge'); void kbKey.offsetWidth; kbKey.classList.add('nudge'); }
      paintDrill();
    }
  }

  var CHEERS = [
    'Your fingers are learning. Weird, right?',
    'Look at you go.',
    'That was suspiciously good.',
    'Certified keyboard behaviour.',
    'The keyboard fears you now.',
    'Smooth. Buttery, even.'
  ];
  var KIND = [
    'Slow is fine. Slow and correct beats fast and wrong every time.',
    'That is genuinely how everyone starts. Keep going.',
    'Your hands are building a map. Maps take a minute.',
    'Accuracy first — the speed shows up on its own later.'
  ];

  function finishDrill(completed) {
    document.removeEventListener('keydown', onKey);
    if (!drill || drill.finished) return;
    drill.finished = true;

    var state = api.getState();
    var ts = tstate(state);
    var stage = drill.stage;
    var accuracy = drill.typed ? Math.round(((drill.typed - drill.errors) / drill.typed) * 100) : 0;
    var seconds = drill.startedAt ? (Date.now() - drill.startedAt) / 1000 : 0;
    var wpm = seconds > 2 ? Math.round((drill.pos / 5) / (seconds / 60)) : 0;

    // fold per-key stats into the profile so the heat map and drills adapt
    Object.keys(drill.perKey).forEach(function (k) {
      var s = ts.keyStats[k] || { correct: 0, total: 0 };
      s.correct += drill.perKey[k].correct;
      s.total += drill.perKey[k].total;
      ts.keyStats[k] = s;
    });
    ts.totalChars += drill.pos;

    if (drill.placement) {
      api.save();
      return finishPlacement(accuracy, wpm);
    }

    var rec = ts.stages[stage.id] || { attempts: 0, bestAccuracy: 0, completed: false, bestWpm: 0 };
    rec.attempts += 1;
    rec.bestAccuracy = Math.max(rec.bestAccuracy, accuracy);
    rec.bestWpm = Math.max(rec.bestWpm || 0, wpm);

    var passed = completed && accuracy >= PASS_ACCURACY;
    var newlyCompleted = passed && !rec.completed;
    if (passed) rec.completed = true;
    ts.stages[stage.id] = rec;
    if (wpm > (ts.bestWpm || 0) && accuracy >= PASS_ACCURACY) ts.bestWpm = wpm;
    ts.sessions += 1;

    // Points: earned on accurate characters actually typed, so quitting early pays nothing.
    var pts = 0;
    if (completed) {
      pts = Math.round((drill.pos * 0.6) * (accuracy / 100));
      if (newlyCompleted) pts += 120;
      api.addPoints(pts);
    }
    api.save();

    var msg = passed
      ? CHEERS[Math.floor(Math.random() * CHEERS.length)]
      : KIND[Math.floor(Math.random() * KIND.length)];

    api.setMain(
      '<div class="card center">' +
      '<div class="big-emoji">' + (newlyCompleted ? '🎉' : passed ? '⌨️' : '💪') + '</div>' +
      '<h1>' + (newlyCompleted ? 'Level Complete!' : passed ? 'Nice typing!' : 'Good practice') + '</h1>' +
      '<p>' + esc(msg) + '</p>' +
      '<div class="type-scores">' +
      '<div><span class="ts-num">' + accuracy + '%</span><span class="ts-lab">accuracy</span></div>' +
      (stage.speed || wpm ? '<div><span class="ts-num">' + wpm + '</span><span class="ts-lab">words/min</span></div>' : '') +
      '<div><span class="ts-num">+' + pts + '</span><span class="ts-lab">points 💎</span></div>' +
      '</div>' +
      (newlyCompleted && api.newSquishy ? (function () {
        var sq = api.newSquishy();
        return sq ? '<div class="sq-won">' + sq.art + '<div><div class="sq-next-label">NEW SQUISHY!</div>' +
          '<div class="sq-next-name">' + sq.name + '</div>' +
          '<div class="sq-next-tier" style="color:' + sq.color + '">' + sq.tier + '</div></div></div>' : '';
      })() : '') +
      (passed ? '' : '<p class="text-soft">You need ' + PASS_ACCURACY + '% accuracy to unlock the next level. No rush — go as slow as you like.</p>') +
      '<div class="grid grid-2 mt-2">' +
      '<button class="btn" id="t-again">' + (passed ? 'Next Level →' : 'Try Again →') + '</button>' +
      '<button class="btn secondary" id="t-home">Typing Home</button>' +
      '</div></div>'
    );
    if (newlyCompleted) api.confetti();

    $('#t-again').addEventListener('click', function () {
      var next = passed ? Math.min(drill.idx + 1, T.STAGES.length - 1) : drill.idx;
      renderLesson(next);
    });
    $('#t-home').addEventListener('click', renderHome);
  }

  root.App = root.App || {};
  root.App.UITyping = {
    init: function (sharedApi) { api = sharedApi; },
    renderHome: renderHome,
    renderPlacementIntro: renderPlacementIntro,
    tstate: tstate,
    weakKeys: weakKeys,
    currentStageIdx: currentStageIdx,
    stageDone: stageDone,
    PASS_ACCURACY: PASS_ACCURACY,
    cleanup: function () { document.removeEventListener('keydown', onKey); }
  };
})(typeof window !== 'undefined' ? window : global);
