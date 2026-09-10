/* UI layer. Teach-first flow: Lesson → guided practice with hints → practice to mastery. */
(function (root) {
  var C = root.App.Curriculum;
  var Engine = root.App.Engine;
  var Storage = root.App.Storage;

  var state = null;
  var mainEl, navEl, headerStatsEl;
  var session = null;
  var diag = null;

  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function save() { Storage.save(state); updateHeaderStats(); }

  function updateHeaderStats() {
    if (!state) { headerStatsEl.innerHTML = ''; return; }
    var p = Storage.getActiveProfile();
    var t = Engine.titleFor(state.lifetimePoints);
    headerStatsEl.innerHTML =
      '<button class="stat-chip learner" id="switch-learner" title="Switch learner">' +
      '<span>' + (p ? p.avatar : '🙂') + '</span><span class="num">' + esc(state.studentName) + '</span><span class="swap">⇄</span></button>' +
      '<div class="stat-chip level"><span>' + t.emoji + '</span><span class="num">' + esc(t.title) + '</span></div>' +
      '<div class="stat-chip points"><span>💎</span><span class="num">' + state.points.toLocaleString() + '</span></div>' +
      '<div class="stat-chip streak"><span>🔥</span><span class="num">' + state.streak.current + '-day streak</span></div>';
    var sw = $('#switch-learner');
    if (sw) sw.addEventListener('click', function () { renderProfilePicker(); });
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2400);
  }

  function confetti() {
    var overlay = document.createElement('div');
    overlay.className = 'confetti-overlay';
    var colors = ['#ff6b6b', '#ffa62b', '#00b894', '#00b8d9', '#6c5ce7', '#ff6b9d'];
    for (var i = 0; i < 50; i++) {
      var p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.left = (Math.random() * 100) + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
      p.style.animationDelay = (Math.random() * 0.4) + 's';
      overlay.appendChild(p);
    }
    document.body.appendChild(overlay);
    setTimeout(function () { overlay.remove(); }, 3200);
  }

  function gradeChip(grade) {
    return '<span class="grade-chip g' + grade + '">Grade ' + grade + '</span>';
  }

  // ---------- nav ----------
  var NAV = [
    { id: 'dashboard', label: '🏠 Home' },
    { id: 'map', label: '🗺️ Skill Map' },
    { id: 'rewards', label: '🎁 Rewards' },
    { id: 'parent', label: '👪 Parent Zone' }
  ];
  function renderNav(active) {
    navEl.classList.remove('hidden');
    navEl.innerHTML = NAV.map(function (n) {
      return '<button class="nav-btn' + (n.id === active ? ' active' : '') + '" data-view="' + n.id + '">' + n.label + '</button>';
    }).join('');
    $all('.nav-btn', navEl).forEach(function (b) {
      b.addEventListener('click', function () { go(b.getAttribute('data-view')); });
    });
  }
  function hideNav() { navEl.classList.add('hidden'); }

  function go(view) {
    if (view === 'dashboard') renderDashboard();
    else if (view === 'map') renderMap();
    else if (view === 'rewards') renderRewards();
    else if (view === 'parent') renderParentGate();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- learner profiles ----------
  function enterApp() {
    state = Storage.load();
    if (!state) return renderProfilePicker();
    updateHeaderStats();
    if (!state.diagnosticDone) renderWelcome(); else renderDashboard();
  }

  function renderProfilePicker() {
    hideNav();
    var profiles = Storage.listProfiles();
    var cards = profiles.map(function (p) {
      var s = Storage.profileSummary(p.id);
      var sub = s.placed ? (s.mastered + ' / ' + s.total + ' levels · 💎 ' + s.points) : 'Not started yet';
      return '<button class="profile-card" data-id="' + p.id + '">' +
        '<span class="profile-avatar">' + p.avatar + '</span>' +
        '<span class="profile-name">' + esc(p.name) + '</span>' +
        '<span class="profile-sub">' + sub + '</span></button>';
    }).join('');
    mainEl.innerHTML =
      '<div class="card center">' +
      '<h1>Who\'s learning?</h1>' +
      '<p class="text-soft">Each person keeps their own progress, lessons and points.</p>' +
      '<div class="profile-grid">' + cards +
      '<button class="profile-card add" id="add-learner"><span class="profile-avatar">➕</span><span class="profile-name">Add learner</span><span class="profile-sub">new profile</span></button>' +
      '</div></div>';
    $all('.profile-card[data-id]', mainEl).forEach(function (btn) {
      btn.addEventListener('click', function () {
        Storage.setActiveId(btn.getAttribute('data-id'));
        enterApp();
      });
    });
    $('#add-learner').addEventListener('click', function () { renderNameEntry(false); });
  }

  function renderNameEntry(isFirst) {
    hideNav();
    mainEl.innerHTML =
      '<div class="card center">' +
      '<div class="big-emoji">👋</div>' +
      '<h1>' + (isFirst ? 'Welcome to Math Quest' : 'Add a learner') + '</h1>' +
      '<p>What name should we use?</p>' +
      '<div class="numeric-input-row" style="max-width:380px;margin:0 auto;">' +
      '<input type="text" id="name-input" placeholder="First name" maxlength="30" autocomplete="off" />' +
      '<button class="btn" id="name-go">Start →</button></div>' +
      (isFirst ? '' : '<button class="btn secondary small mt-2" id="name-cancel">Cancel</button>') +
      '</div>';
    var input = $('#name-input');
    function submit() {
      var name = (input.value || '').trim();
      if (!name) { toast('Please enter a name.'); input.focus(); return; }
      Storage.createProfile(name);
      enterApp();
    }
    $('#name-go').addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    input.focus();
    if (!isFirst) $('#name-cancel').addEventListener('click', function () { renderProfilePicker(); });
  }

  // ---------- welcome ----------
  function renderWelcome() {
    hideNav();
    mainEl.innerHTML =
      '<div class="card welcome-hero">' +
      '<div class="big-emoji">🚀</div>' +
      '<h1>Hi ' + esc(state.studentName) + '!</h1>' +
      '<p>This is your own math tutor. It doesn\'t just quiz you — it <strong>teaches you</strong> each thing first, then practices with you until you\'ve really got it.</p>' +
      '<div class="callout">' +
      '<strong>First, a quick placement.</strong> It starts easy and adjusts to you. Its only job is to find your starting line — so it will keep going until it finds things you <em>haven\'t</em> learned yet. That is completely normal and it is not a test. Nobody is graded on this.' +
      '</div>' +
      '<p class="text-soft">About ' + Engine.diagnosticTotalEstimate() + ' questions, 5 minutes. If you see something you\'ve never been taught, just tap <strong>"Haven\'t learned this yet"</strong> and it moves on.</p>' +
      '<button class="btn" id="start-diag">Find My Starting Line →</button>' +
      '<button class="btn secondary small block mt-2" id="skip-diag">Skip for now — just show me around</button>' +
      '</div>';
    $('#start-diag').addEventListener('click', startDiagnostic);
    $('#skip-diag').addEventListener('click', skipPlacement);
  }

  /* Lets someone browse the app without sitting through placement first.
     Everything simply starts at the bottom of each ladder until they take it. */
  function skipPlacement() {
    state.diagnosticDone = true;
    state.placementSkipped = true;
    save();
    renderDashboard();
  }

  // ---------- placement ----------
  function startDiagnostic() {
    diag = Engine.newDiagnostic();
    renderDiagQuestion();
  }

  function renderDiagQuestion() {
    hideNav();
    var level = Engine.diagnosticCurrentLevel(diag);
    if (!level || diag.done) return finishDiagnostic();
    var q = Engine.questionFor(level.id);
    var strand = Engine.STRAND_MAP[level.strand];
    var est = Engine.diagnosticTotalEstimate();
    var pct = Math.min(95, Math.round((diag.asked / est) * 100));
    mainEl.innerHTML =
      '<div class="card">' +
      '<div class="quiz-meta"><span>' + strand.emoji + ' ' + esc(strand.name) + '</span>' + gradeChip(level.grade) + '</div>' +
      '<div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="question-prompt">' + esc(q.prompt) + '</div>' +
      '<div id="answer-zone"></div>' +
      '<div class="quiz-actions mt-2">' +
      '<button class="btn secondary small" id="not-learned">🤷 Haven\'t learned this yet</button>' +
      '<button class="btn secondary small" id="skip-diag-mid">Skip placement</button>' +
      '</div>' +
      '</div>';

    function proceed(correct) {
      Engine.diagnosticAnswer(diag, correct);
      setTimeout(function () {
        if (diag.done) finishDiagnostic(); else renderDiagQuestion();
      }, 450);
    }
    renderAnswerZone(q, proceed, { mode: 'placement' });
    $('#skip-diag-mid').addEventListener('click', skipPlacement);
    $('#not-learned').addEventListener('click', function () {
      $('#not-learned').disabled = true;
      $('#answer-zone').innerHTML = '<div class="feedback-panel neutral"><div class="feedback-title">👍 Good to know — that just tells us where to start.</div></div>';
      proceed(false);
    });
  }

  function finishDiagnostic() {
    var res = Engine.applyDiagnostic(state, diag);
    save();
    var rows = C.STRANDS.map(function (s) {
      var kg = Engine.knowledgeGrade(state, s.id);
      var cur = Engine.currentLevel(state, s.id);
      return '<div class="place-row">' +
        '<span class="place-strand">' + s.emoji + ' ' + esc(s.name) + '</span>' +
        '<span class="place-next">' + (cur ? 'Starting at: <strong>' + esc(cur.name) + '</strong> ' + gradeChip(cur.grade) : '<strong>All done! 🎉</strong>') + '</span>' +
        '</div>';
    }).join('');
    hideNav();
    mainEl.innerHTML =
      '<div class="card">' +
      '<div class="center"><div class="big-emoji">🗺️</div><h1>Here\'s Your Starting Line</h1></div>' +
      '<p class="center">You already know <strong>' + res.placedCount + '</strong> of the ' + (res.placedCount + res.gapCount) + ' skills in here — so we\'ll skip straight past those. The other <strong>' + res.gapCount + '</strong> are what we\'ll teach you, starting from the easiest.</p>' +
      '<div class="place-list mt-2">' + rows + '</div>' +
      '<div class="callout mt-2">Every one of those starts with a <strong>lesson</strong> — you\'ll never get thrown a question about something you haven\'t been taught.</div>' +
      '<div class="center mt-2"><button class="btn" id="to-dash">Let\'s Go →</button></div>' +
      '</div>';
    $('#to-dash').addEventListener('click', function () { go('dashboard'); });
  }

  // ---------- dashboard ----------
  function renderDashboard() {
    renderNav('dashboard');
    var t = Engine.titleFor(state.lifetimePoints);
    var next = Engine.nextUpLevel(state);
    var goal = state.dailyGoal;

    var strandCards = C.STRANDS.map(function (s) {
      var p = Engine.strandProgress(state, s.id);
      var cur = Engine.currentLevel(state, s.id);
      return '<div class="strand-card" data-strand="' + s.id + '">' +
        '<div class="strand-head"><span>' + s.emoji + '</span> <strong>' + esc(s.name) + '</strong></div>' +
        '<div class="bar-bg"><span class="bar-fill" style="width:' + p.pct + '%;background:' + s.color + '"></span></div>' +
        '<div class="strand-sub">' + p.done + ' / ' + p.total + ' mastered' + (cur ? ' · next: ' + esc(cur.name) : ' · complete 🎉') + '</div>' +
        '</div>';
    }).join('');

    mainEl.innerHTML =
      '<div class="grid" style="gap:16px;">' +
      (state.placementSkipped ?
        '<div class="card callout-card">' +
        '<h3>📍 Placement not done yet</h3>' +
        '<p>Right now every strand starts at the very beginning (Grade 4). Take the 5-minute placement and it will skip ahead to ' + esc(state.studentName) + '\'s real starting point.</p>' +
        '<button class="btn small" id="take-placement">Take the placement →</button>' +
        '</div>' : '') +
      (next ?
        '<div class="card next-up">' +
        '<div class="next-label">📚 NEXT LESSON</div>' +
        '<h2>' + esc(next.name) + ' ' + gradeChip(next.grade) + '</h2>' +
        '<p>' + esc(next.lesson.idea.split('.')[0]) + '.</p>' +
        '<button class="btn block" id="start-next">' + (state.levels[next.id].lessonSeen ? 'Keep Practicing →' : 'Teach Me This →') + '</button>' +
        '</div>'
        :
        '<div class="card center"><div class="big-emoji">🏆</div><h2>Everything mastered!</h2><p>You have finished every level from Grade 4 through Grade 7.</p></div>') +
      '<div class="card">' +
      '<div class="section-title"><h2>Hi ' + esc(state.studentName) + '! ' + t.emoji + '</h2><span class="text-soft">' + esc(t.title) + '</span></div>' +
      '<p>Today\'s goal: <strong>' + goal.sessionsToday + ' / ' + goal.target + '</strong> sessions' + (goal.goalMet ? ' ✅' : '') + '</p>' +
      '</div>' +
      '<div class="card"><h2>Your Skill Strands</h2><div class="strand-grid">' + strandCards + '</div></div>' +
      '<div class="card"><h2>Badges</h2>' + badgeShelf() + '</div>' +
      squishyCollection() +
      '</div>';

    if (state.placementSkipped) {
      $('#take-placement').addEventListener('click', function () {
        state.placementSkipped = false; save(); startDiagnostic();
      });
    }
    if (next) $('#start-next').addEventListener('click', function () { startLevel(next.id); });
    $all('.strand-card', mainEl).forEach(function (c) {
      c.addEventListener('click', function () {
        var cur = Engine.currentLevel(state, c.getAttribute('data-strand'));
        if (cur) startLevel(cur.id); else toast('That strand is fully mastered! 🎉');
      });
    });
    wireSquishies(mainEl);
  }

  // ---------- LESSON ----------
  function startLevel(levelId) {
    var ls = state.levels[levelId];
    session = { levelId: levelId, asked: 0, correct: 0, pointsEarned: 0, combo: 0, mastered: false, missed: false, guidedLeft: Engine.GUIDED_COUNT };
    if (!ls.lessonSeen) renderLesson(levelId, 0);
    else renderQuestion();
  }

  function renderLesson(levelId, exampleStep) {
    hideNav();
    var lv = Engine.LEVEL_MAP[levelId];
    var strand = Engine.STRAND_MAP[lv.strand];
    var ex = lv.lesson.examples[0];
    var shown = Math.min(exampleStep, ex.steps.length);

    var stepsHtml = ex.steps.slice(0, shown).map(function (s, i) {
      return '<div class="work-step"><span class="step-num">' + (i + 1) + '</span><span>' + esc(s) + '</span></div>';
    }).join('');

    var allShown = shown >= ex.steps.length;

    mainEl.innerHTML =
      '<div class="card lesson">' +
      '<div class="quiz-meta"><span>' + strand.emoji + ' ' + esc(strand.name) + '</span>' + gradeChip(lv.grade) + '</div>' +
      '<h1>' + esc(lv.name) + '</h1>' +

      '<div class="lesson-idea"><div class="lesson-h">💡 The idea</div><p>' + esc(lv.lesson.idea) + '</p></div>' +

      '<div class="lesson-h mt-2">📋 How to do it</div>' +
      '<ol class="method-list">' + lv.lesson.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +

      '<div class="worked-example mt-2">' +
      '<div class="lesson-h">✏️ Worked example</div>' +
      '<div class="we-problem">' + esc(ex.problem) + '</div>' +
      '<div id="we-steps">' + stepsHtml + '</div>' +
      (allShown ? '<div class="we-answer">✅ Answer: <strong>' + esc(ex.answer) + '</strong></div>' : '') +
      '</div>' +

      '<div class="mt-2">' +
      (allShown
        ? '<button class="btn block" id="lesson-done">I\'m Ready to Try It →</button>'
        : '<button class="btn block" id="next-step">' + (shown === 0 ? 'Show Me Step 1 →' : 'Next Step →') + '</button>') +
      '</div>' +
      '<button class="btn secondary small block mt-1" id="back-dash">Back to Home</button>' +
      '</div>';

    if (allShown) {
      $('#lesson-done').addEventListener('click', function () {
        state.levels[levelId].lessonSeen = true;
        save();
        var earned = Engine.checkBadges(state, { lessonCompleted: true });
        if (earned.length) announce(earned);
        renderQuestion();
      });
    } else {
      $('#next-step').addEventListener('click', function () { renderLesson(levelId, shown + 1); });
    }
    $('#back-dash').addEventListener('click', function () { go('dashboard'); });
  }

  // ---------- PRACTICE ----------
  function renderQuestion() {
    hideNav();
    var levelId = session.levelId;
    var lv = Engine.LEVEL_MAP[levelId];
    var ls = state.levels[levelId];
    var strand = Engine.STRAND_MAP[lv.strand];
    var q = Engine.questionFor(levelId);
    var guided = session.guidedLeft > 0;

    var pips = '';
    for (var i = 0; i < Engine.MASTERY_STREAK; i++) {
      pips += '<span class="pip' + (i < ls.streak ? ' on' : '') + '"></span>';
    }

    mainEl.innerHTML =
      '<div class="card">' +
      '<div class="quiz-meta">' +
      '<span>' + strand.emoji + ' ' + esc(lv.name) + '</span>' +
      (guided ? '<span class="difficulty-pill d1">Guided</span>' : '') +
      gradeChip(lv.grade) +
      '</div>' +
      '<div class="mastery-track"><span class="mastery-label">' + ls.streak + ' / ' + Engine.MASTERY_STREAK + ' in a row to master</span><span class="pips">' + pips + '</span></div>' +
      '<div class="question-prompt">' + esc(q.prompt) + '</div>' +
      '<div id="answer-zone"></div>' +
      '<div class="quiz-actions mt-2">' +
      '<button class="btn secondary small" id="hint-btn">💡 Hint</button>' +
      '<button class="btn secondary small" id="reteach-btn">📖 Show the lesson again</button>' +
      '<button class="btn secondary small" id="stop-btn">Finish session</button>' +
      '</div>' +
      '<div id="hint-slot"></div>' +
      '</div>';

    renderAnswerZone(q, function (correct) {
      session.asked += 1;
      if (correct) { session.correct += 1; session.combo += 1; }
      else { session.combo = 0; session.missed = true; }
      if (session.guidedLeft > 0) session.guidedLeft -= 1;

      var pts = Engine.pointsForAnswer(lv.grade, correct, session.combo);
      session.pointsEarned += pts;
      Engine.addPoints(state, pts);

      var justMastered = Engine.recordAnswer(state, levelId, correct);
      if (justMastered) session.mastered = true;
      save();

      if (justMastered) { setTimeout(finishSession, 300); return; }
      if (session.asked >= 12) { setTimeout(finishSession, 300); return; }
      renderQuestion();
    }, { mode: 'practice', level: lv, points: Engine.pointsForAnswer(lv.grade, true, session.combo + 1) });

    $('#hint-btn').addEventListener('click', function () {
      $('#hint-slot').innerHTML =
        '<div class="hint-panel"><div class="lesson-h">💡 Remember</div><ol class="method-list">' +
        lv.lesson.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>';
      $('#hint-btn').disabled = true;
    });
    $('#reteach-btn').addEventListener('click', function () { renderLesson(levelId, 99); });
    $('#stop-btn').addEventListener('click', finishSession);
  }

  // ---------- answers ----------
  function renderAnswerZone(q, onAnswered, opts) {
    var zone = $('#answer-zone');
    if (q.type === 'mc') {
      zone.innerHTML = '<div class="mc-grid">' + q.choices.map(function (c, i) {
        return '<button class="mc-choice" data-i="' + i + '">' + esc(c) + '</button>';
      }).join('') + '</div><div id="feedback-slot"></div>';
      $all('.mc-choice', zone).forEach(function (btn) {
        btn.addEventListener('click', function () {
          $all('.mc-choice', zone).forEach(function (b) { b.disabled = true; });
          var correct = parseInt(btn.getAttribute('data-i'), 10) === q.answer;
          btn.classList.add(correct ? 'correct' : 'incorrect');
          if (!correct) $all('.mc-choice', zone)[q.answer].classList.add('correct');
          showFeedback(q, correct, onAnswered, opts);
        });
      });
    } else {
      zone.innerHTML =
        '<div class="numeric-input-row">' +
        '<input type="text" inputmode="decimal" id="numeric-answer" placeholder="Your answer" autocomplete="off" />' +
        '<button class="btn" id="submit-answer">Check ✓</button>' +
        '</div><div id="feedback-slot"></div>';
      var input = $('#numeric-answer');
      function submit() {
        if (input.disabled) return;
        var v = parseFloat((input.value || '').replace(/,/g, ''));
        input.disabled = true; $('#submit-answer').disabled = true;
        showFeedback(q, !isNaN(v) && Math.abs(v - q.answer) <= (q.tolerance || 0.01), onAnswered, opts);
      }
      $('#submit-answer').addEventListener('click', submit);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      input.focus();
    }
  }

  function showFeedback(q, correct, onAnswered, opts) {
    var slot = $('#feedback-slot');
    if (opts.mode === 'placement') {
      slot.innerHTML = '<div class="feedback-panel ' + (correct ? 'correct' : 'neutral') + '"><div class="feedback-title">' +
        (correct ? '✅ Nice!' : '👍 Got it — noted') + '</div></div>';
      onAnswered(correct);
      return;
    }
    // Practice: a miss is a teaching moment, not a scolding.
    var lv = opts.level;
    var hintSlot = $('#hint-slot');
    if (hintSlot) hintSlot.innerHTML = ''; // feedback restates the method; avoid showing it twice
    if (correct) {
      slot.innerHTML =
        '<div class="feedback-panel correct">' +
        '<div class="feedback-title">✅ Correct! <span class="pts">+' + opts.points + ' 💎</span></div>' +
        '<div>' + esc(q.explanation) + '</div>' +
        '<button class="btn small mt-2" id="cont">Continue →</button>' +
        '</div>';
    } else {
      slot.innerHTML =
        '<div class="feedback-panel incorrect">' +
        '<div class="feedback-title">Let\'s walk through it 🤝</div>' +
        '<div class="worked-solution">' + esc(q.explanation) + '</div>' +
        '<div class="reteach-note">Reminder of the method:</div>' +
        '<ol class="method-list">' + lv.lesson.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
        '<button class="btn small mt-2" id="cont">Got it — try another →</button>' +
        '</div>';
    }
    $('#cont').addEventListener('click', function () { onAnswered(correct); });
  }

  // ---------- session summary ----------
  function finishSession() {
    var lv = Engine.LEVEL_MAP[session.levelId];
    var perfect = session.asked > 0 && session.correct === session.asked;
    var dailyBonus = Engine.completeSession(state, {
      levelId: session.levelId, correctCount: session.correct, total: session.asked,
      pointsEarned: session.pointsEarned, mastered: session.mastered
    });
    var badges = Engine.checkBadges(state, {
      anyCorrect: session.correct > 0,
      newlyMastered: session.mastered ? [session.levelId] : [],
      perfectSession: perfect,
      sessionLength: session.asked
    });
    save();

    var nextLv = Engine.nextUpLevel(state);
    hideNav();
    mainEl.innerHTML =
      '<div class="card center">' +
      '<div class="big-emoji">' + (session.mastered ? '🎉' : perfect ? '💯' : '💪') + '</div>' +
      '<h1>' + (session.mastered ? 'Level Mastered!' : 'Nice work!') + '</h1>' +
      (session.mastered ? '<p>You\'ve got <strong>' + esc(lv.name) + '</strong> down — ' + Engine.MASTERY_STREAK + ' correct in a row. A new squishy joined your collection! 🧸</p>'
        : '<p>' + session.correct + ' of ' + session.asked + ' correct on <strong>' + esc(lv.name) + '</strong>. Keep going and you\'ll master it.</p>') +
      '<p style="font-size:1.3rem;font-weight:800;color:var(--accent);">+' + (session.pointsEarned + dailyBonus) + ' points 💎</p>' +
      (dailyBonus ? '<p>🎯 Daily goal bonus included!</p>' : '') +
      (nextLv ? '<p class="text-soft">Up next: ' + esc(nextLv.name) + ' ' + gradeChip(nextLv.grade) + '</p>' : '') +
      '<div class="grid grid-2 mt-2">' +
      (nextLv ? '<button class="btn" id="next-btn">' + (session.mastered ? 'Next Lesson →' : 'Keep Practicing →') + '</button>' : '') +
      '<button class="btn secondary" id="home-btn">Back to Home</button>' +
      '</div></div>';

    if (session.mastered || badges.length) confetti();
    if (badges.length) announce(badges);

    if (nextLv) {
      $('#next-btn').addEventListener('click', function () {
        startLevel(session.mastered ? nextLv.id : session.levelId);
      });
    }
    $('#home-btn').addEventListener('click', function () { go('dashboard'); });
  }

  function announce(badges) {
    badges.forEach(function (b, i) {
      setTimeout(function () { toast('🏅 ' + b.name + ' (+' + b.bonus + ')'); }, i * 900);
    });
  }

  // ---------- skill map ----------
  function renderMap() {
    renderNav('map');
    var html = C.STRANDS.map(function (s) {
      var levels = Engine.strandLevels(s.id);
      var items = levels.map(function (lv) {
        var ls = state.levels[lv.id];
        var status = ls.masteredAt ? 'done' : Engine.isUnlocked(state, lv.id) ? 'current' : 'locked';
        var icon = status === 'done' ? '✅' : status === 'current' ? '📚' : '🔒';
        var note = status === 'done'
          ? (ls.placedByDiagnostic ? 'already knew it' : 'mastered')
          : status === 'current' ? (ls.streak + ' / ' + Engine.MASTERY_STREAK + ' in a row') : 'unlocks after the one above';
        return '<div class="map-level ' + status + '" data-level="' + lv.id + '">' +
          '<span class="map-icon">' + icon + '</span>' +
          '<span class="map-name">' + esc(lv.name) + ' ' + gradeChip(lv.grade) + '</span>' +
          '<span class="map-note">' + note + '</span>' +
          '</div>';
      }).join('');
      return '<div class="card mt-2"><h3>' + s.emoji + ' ' + esc(s.name) + '</h3>' + items + '</div>';
    }).join('');
    mainEl.innerHTML = '<div class="card"><h2>🗺️ Skill Map</h2><p>Every level from Grade 4 to Grade 7. You unlock each one by mastering the one before it — tap the one with 📚 to work on it.</p></div>' + html;
    $all('.map-level.current', mainEl).forEach(function (el) {
      el.addEventListener('click', function () { startLevel(el.getAttribute('data-level')); });
    });
  }

  // ---------- squishies ----------
  var BLOBS = ['42% 58% 63% 37% / 41% 44% 56% 59%', '58% 42% 35% 65% / 55% 40% 60% 45%', '65% 35% 46% 54% / 35% 60% 40% 65%', '40% 60% 55% 45% / 60% 35% 65% 40%', '55% 45% 40% 60% / 45% 60% 35% 65%'];
  var BOOPS = ['Squish squish! 🟣', 'Boop!', '*squoosh*', 'Ooh, satisfying.', 'Neeeee-doh!'];

  function squishyCollection() {
    var earned = C.LEVELS.filter(function (l) { return state.levels[l.id].masteredAt; }).length;
    var cells = C.LEVELS.map(function (lv, i) {
      var s = Engine.STRAND_MAP[lv.strand];
      var got = !!state.levels[lv.id].masteredAt;
      var style = 'border-radius:' + BLOBS[i % BLOBS.length] + (got ? ';background:' + s.color : '');
      return '<div class="squishy-cell">' +
        '<div class="squishy ' + (got ? 'unlocked' : 'locked') + '" data-squishy="' + lv.id + '" style="' + style + '" title="' + esc(got ? lv.name + ' — collected!' : 'Master ' + lv.name + ' to unlock') + '">' +
        (got ? '' : '<span class="squishy-lock">🔒</span>') + '</div></div>';
    }).join('');
    return '<div class="card"><div class="section-title"><h2>🧸 Squish Collection</h2><span class="text-soft">' + earned + ' / ' + C.LEVELS.length + '</span></div>' +
      '<p>Master a level, earn a squishy.</p><div class="squishy-grid">' + cells + '</div></div>';
  }

  function wireSquishies(ctx) {
    $all('.squishy.unlocked', ctx).forEach(function (el) {
      el.addEventListener('click', function () {
        el.classList.remove('squish-pop'); void el.offsetWidth; el.classList.add('squish-pop');
      });
    });
    $all('.squishy.locked', ctx).forEach(function (el) {
      el.addEventListener('click', function () { toast('Master that level to unlock its squishy! 🔒'); });
    });
  }

  function badgeShelf() {
    return '<div class="badge-shelf">' + Engine.BADGES.map(function (b) {
      var got = state.badges.indexOf(b.id) !== -1;
      return '<div class="badge-pill' + (got ? '' : ' locked') + '" title="' + esc(b.desc) + '"><span class="emoji">' + b.emoji + '</span> ' + esc(b.name) + '</div>';
    }).join('') + '</div>';
  }

  // ---------- rewards ----------
  function renderRewards() {
    renderNav('rewards');
    var cards = state.rewards.slice().sort(function (a, b) { return a.cost - b.cost; }).map(function (r) {
      var ok = state.points >= r.cost;
      return '<div class="card reward-card"><div><div class="name">' + esc(r.name) + '</div><div class="cost">💎 ' + r.cost + '</div></div>' +
        '<button class="btn small' + (ok ? '' : ' secondary') + '" data-reward="' + r.id + '"' + (ok ? '' : ' disabled') + '>Redeem</button></div>';
    }).join('');
    var hist = state.redemptions.slice(0, 8).map(function (r) {
      return '<li>' + esc(r.date) + ' — ' + esc(r.rewardName) + ' (' + r.cost + ')' + (r.fulfilled ? ' ✅' : ' ⏳') + '</li>';
    }).join('');
    mainEl.innerHTML =
      '<div class="card"><h2>🎁 Rewards Shop</h2><p>You have <strong>💎 ' + state.points + '</strong> to spend.</p></div>' +
      '<div class="grid grid-2 mt-2">' + cards + '</div>' +
      '<div class="card mt-2"><h3>History</h3>' + (hist ? '<ul>' + hist + '</ul>' : '<p class="text-soft">Nothing yet.</p>') + '</div>';
    $all('[data-reward]', mainEl).forEach(function (b) {
      b.addEventListener('click', function () {
        var r = Engine.redeemReward(state, b.getAttribute('data-reward'));
        if (r.ok) { save(); toast('🎉 Redeemed: ' + r.redemption.rewardName); renderRewards(); }
        else toast(r.message);
      });
    });
  }

  // ---------- parent ----------
  function renderParentGate() {
    renderNav('parent');
    mainEl.innerHTML = '<div class="card parent-gate"><div class="big-emoji">👪</div><h2>Parent Zone</h2>' +
      '<p>See exactly where the gaps are, manage rewards, and handle redemptions.</p>' +
      '<button class="btn" id="enter">Enter Parent Zone</button></div>';
    $('#enter').addEventListener('click', renderParentPanel);
  }

  function renderParentPanel() {
    var gapRows = C.STRANDS.map(function (s) {
      var kg = Engine.knowledgeGrade(state, s.id);
      var cur = Engine.currentLevel(state, s.id);
      var p = Engine.strandProgress(state, s.id);
      return '<tr><td>' + s.emoji + ' ' + esc(s.name) + '</td>' +
        '<td>' + (kg ? 'Grade ' + kg : '<span style="color:var(--danger)">below Grade 4</span>') + '</td>' +
        '<td>' + p.done + '/' + p.total + '</td>' +
        '<td>' + (cur ? esc(cur.name) + ' (G' + cur.grade + ')' : '✅ complete') + '</td></tr>';
    }).join('');

    var detail = C.LEVELS.map(function (lv) {
      var ls = state.levels[lv.id];
      var acc = ls.attempts ? Math.round((ls.correct / ls.attempts) * 100) + '%' : '—';
      var status = ls.masteredAt ? (ls.placedByDiagnostic ? 'Placed (already knew)' : 'Mastered') : Engine.isUnlocked(state, lv.id) ? 'Working on it' : 'Locked';
      return '<tr><td>G' + lv.grade + '</td><td>' + esc(lv.name) + '</td><td>' + status + '</td><td>' + ls.attempts + '</td><td>' + acc + '</td></tr>';
    }).join('');

    var rewardRows = state.rewards.map(function (r) {
      return '<div class="form-row" style="align-items:center;"><span style="flex:1;">' + esc(r.name) + ' — 💎 ' + r.cost + '</span>' +
        '<button class="btn small danger" data-del="' + r.id + '">Remove</button></div>';
    }).join('');

    var redeems = state.redemptions.map(function (r) {
      return '<div class="form-row" style="align-items:center;"><span style="flex:1;">' + esc(r.date) + ' — ' + esc(r.rewardName) + (r.fulfilled ? ' ✅' : ' ⏳') + '</span>' +
        (r.fulfilled ? '' : '<button class="btn small success" data-ful="' + r.id + '">Mark Fulfilled</button>') + '</div>';
    }).join('') || '<p class="text-soft">None yet.</p>';

    var activeId = Storage.getActiveId();
    var learnerRows = Storage.listProfiles().map(function (p) {
      var s = Storage.profileSummary(p.id);
      return '<div class="form-row" style="align-items:center;">' +
        '<span style="flex:1;">' + p.avatar + ' <strong>' + esc(p.name) + '</strong>' +
        (p.id === activeId ? ' <span class="grade-chip">active</span>' : '') +
        ' <span class="text-soft">— ' + (s.placed ? s.mastered + '/' + s.total + ' levels, 💎 ' + s.points : 'not started') + '</span></span>' +
        '<button class="btn small secondary" data-rename="' + p.id + '">Rename</button>' +
        '<button class="btn small danger" data-delprofile="' + p.id + '">Delete</button>' +
        '</div>';
    }).join('');

    mainEl.innerHTML =
      '<div class="card"><h2>📊 Where ' + esc(state.studentName) + ' Actually Is</h2>' +
      '<p>"Knowledge grade" is the highest grade level fully mastered in that strand. Anything below Grade 7 is a gap the app is actively teaching.</p>' +
      '<div style="overflow-x:auto"><table class="report"><thead><tr><th>Strand</th><th>Knowledge grade</th><th>Mastered</th><th>Currently teaching</th></tr></thead><tbody>' + gapRows + '</tbody></table></div></div>' +

      '<div class="card mt-2"><h3>Every Level</h3><div style="overflow-x:auto"><table class="report"><thead><tr><th>Gr</th><th>Level</th><th>Status</th><th>Tries</th><th>Accuracy</th></tr></thead><tbody>' + detail + '</tbody></table></div></div>' +

      '<div class="card mt-2"><h3>Rewards</h3>' +
      '<div class="form-row"><input type="text" id="rw-name" placeholder="Reward name" style="flex:2;"><input type="number" id="rw-cost" placeholder="Points" style="flex:1;"><button class="btn" id="rw-add">Add</button></div>' + rewardRows + '</div>' +

      '<div class="card mt-2"><h3>Redemption Requests</h3>' + redeems + '</div>' +

      '<div class="card mt-2"><h3>Daily Goal</h3><div class="form-row"><label>Sessions per day: <input type="number" id="goal" value="' + state.dailyGoal.target + '" min="1" max="10" style="width:60px;"></label><button class="btn small" id="goal-save">Save</button></div></div>' +

      '<div class="card mt-2"><h3>Backup & Transfer</h3><p class="text-soft">Progress saves on this device only. Move it between her iPad and iPhone here.</p>' +
      '<div class="form-row"><button class="btn small" id="export">⬇️ Download Backup</button>' +
      '<label class="btn small secondary" for="import" style="cursor:pointer;">⬆️ Restore<input type="file" id="import" accept="application/json" style="display:none;"></label></div></div>' +

      '<div class="card mt-2"><h3>Placement</h3><p class="text-soft">Re-running placement can only unlock levels, never take mastered ones away. Useful after a break, or if the first run did not reflect what they know.</p>' +
      '<button class="btn small" id="retake-placement">Run placement for ' + esc(state.studentName) + '</button></div>' +

      '<div class="card mt-2"><h3>Learners on this device</h3>' +
      '<p class="text-soft">Each learner has completely separate progress, placement and points. Nothing is shared between them, and nothing leaves this device.</p>' +
      learnerRows +
      '<button class="btn small mt-1" id="add-learner-parent">➕ Add a learner</button></div>' +

      '<div class="card mt-2"><h3>Danger Zone</h3><p class="text-soft">Clears progress for <strong>' + esc(state.studentName) + '</strong> only and re-runs their placement.</p><button class="btn danger" id="reset">Reset ' + esc(state.studentName) + '\'s Progress</button></div>';

    $('#rw-add').addEventListener('click', function () {
      var n = $('#rw-name').value.trim(), c = parseInt($('#rw-cost').value, 10);
      if (!n || !c || c <= 0) return toast('Enter a name and a point cost.');
      state.rewards.push({ id: 'r_' + Date.now(), name: n, cost: c });
      save(); renderParentPanel();
    });
    $all('[data-del]', mainEl).forEach(function (b) {
      b.addEventListener('click', function () {
        state.rewards = state.rewards.filter(function (r) { return r.id !== b.getAttribute('data-del'); });
        save(); renderParentPanel();
      });
    });
    $all('[data-ful]', mainEl).forEach(function (b) {
      b.addEventListener('click', function () {
        var r = state.redemptions.find(function (x) { return x.id === b.getAttribute('data-ful'); });
        if (r) r.fulfilled = true;
        save(); renderParentPanel();
      });
    });
    $('#goal-save').addEventListener('click', function () {
      var t = parseInt($('#goal').value, 10);
      if (t > 0) { state.dailyGoal.target = t; save(); toast('Saved.'); }
    });
    $('#export').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'meital-math-backup-' + Storage.todayStr() + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      toast('Backup downloaded.');
    });
    $('#import').addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          if (!data || !data.levels) throw new Error('bad file');
          if (!confirm('Replace current progress with this backup?')) return;
          state = data; save(); renderParentPanel(); toast('Restored.');
        } catch (err) { toast('Could not read that backup.'); }
        e.target.value = '';
      };
      reader.readAsText(f);
    });
    $('#retake-placement').addEventListener('click', function () {
      state.placementSkipped = false; save(); startDiagnostic();
    });
    $('#add-learner-parent').addEventListener('click', function () { renderNameEntry(false); });
    $all('[data-rename]', mainEl).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-rename');
        var p = Storage.listProfiles().find(function (x) { return x.id === id; });
        var name = prompt('New name for ' + p.name + ':', p.name);
        if (name && name.trim()) {
          Storage.renameProfile(id, name);
          if (id === Storage.getActiveId()) { state.studentName = name.trim(); save(); }
          renderParentPanel();
        }
      });
    });
    $all('[data-delprofile]', mainEl).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-delprofile');
        var p = Storage.listProfiles().find(function (x) { return x.id === id; });
        if (!confirm('Delete ' + p.name + ' and all of their progress? This cannot be undone.')) return;
        Storage.deleteProfile(id);
        var remaining = Storage.listProfiles();
        if (!remaining.length) return renderNameEntry(true);
        if (id === activeId) { Storage.setActiveId(remaining[0].id); return enterApp(); }
        renderParentPanel();
      });
    });
    $('#reset').addEventListener('click', function () {
      if (confirm('Reset ' + state.studentName + '\'s progress? This cannot be undone.')) {
        state = Storage.reset(); save(); renderWelcome();
      }
    });
  }

  // ---------- init ----------
  function init() {
    mainEl = $('#app-main'); navEl = $('#app-nav'); headerStatsEl = $('#header-stats');
    var mascot = $('#squish-mascot');
    if (mascot) {
      mascot.addEventListener('click', function (e) {
        e.stopPropagation(); // the mascot sits inside the clickable brand
        mascot.classList.remove('squish-pop'); void mascot.offsetWidth; mascot.classList.add('squish-pop');
        toast(BOOPS[Math.floor(Math.random() * BOOPS.length)]);
      });
    }
    // Clicking the logo always returns to the dashboard, from any screen.
    var brand = $('#go-home');
    if (brand) {
      brand.addEventListener('click', function () {
        if (!state) return;
        if (!state.diagnosticDone) skipPlacement(); else go('dashboard');
      });
    }

    Storage.migrateLegacy();
    var profiles = Storage.listProfiles();
    if (!profiles.length) return renderNameEntry(true);

    // One learner: go straight in. Several (a shared iPad): ask who it is.
    if (profiles.length === 1) {
      Storage.setActiveId(profiles[0].id);
      return enterApp();
    }
    renderProfilePicker();
  }

  root.App = root.App || {};
  root.App.UI = { init: init };
})(typeof window !== 'undefined' ? window : global);
