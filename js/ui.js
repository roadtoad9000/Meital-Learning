/* UI layer: renders views into #app-main, wires up interactions. Vanilla JS, no framework. */
(function (root) {
  var Q = root.App.Questions;
  var Engine = root.App.Engine;
  var Storage = root.App.Storage;

  var state = null;
  var mainEl, navEl, headerStatsEl;
  var sprintCtx = null;
  var diagCtx = null;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function saveState() { Storage.save(state); updateHeaderStats(); }

  // ---------- header ----------
  function updateHeaderStats() {
    var lvl = Engine.levelFor(state.lifetimePoints);
    headerStatsEl.innerHTML =
      '<div class="stat-chip level">' + lvl.emoji + ' <span class="num">' + esc(lvl.title) + '</span></div>' +
      '<div class="stat-chip points">💎 <span class="num">' + state.points.toLocaleString() + '</span></div>' +
      '<div class="stat-chip streak"><span>🔥</span><span class="num">' + state.streak.current + '-day streak</span></div>';
  }

  // ---------- shared widgets ----------
  function svgRing(pct, color, size, label) {
    size = size || 90;
    var stroke = size * 0.11;
    var r = (size - stroke) / 2;
    var c = 2 * Math.PI * r;
    var offset = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    return (
      '<svg class="ring-svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="var(--border)" stroke-width="' + stroke + '" fill="none"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="' + color + '" stroke-width="' + stroke + '" fill="none" ' +
      'stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + offset + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
      '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="' + size * 0.24 + '" font-weight="800" fill="currentColor">' + Math.round(pct) + '%</text>' +
      '</svg>'
    );
  }

  function domainRingGrid(clickable) {
    return '<div class="ring-grid">' + Q.DOMAINS.map(function (d) {
      var pct = Engine.domainMastery(state, d.id);
      return '<div class="ring-card" data-domain="' + d.id + '" style="' + (clickable ? 'cursor:pointer' : 'cursor:default') + '">' +
        svgRing(pct, d.color, 84) +
        '<div class="domain-name">' + d.emoji + ' ' + esc(d.short) + '</div>' +
        '<div class="domain-pct">' + pct + '% mastered</div>' +
        '</div>';
    }).join('') + '</div>';
  }

  function badgeShelf() {
    return '<div class="badge-shelf">' + Engine.BADGES.map(function (b) {
      var earned = state.badges.indexOf(b.id) !== -1;
      return '<div class="badge-pill' + (earned ? '' : ' locked') + '" title="' + esc(b.desc) + (earned ? '' : ' (locked)') + '">' +
        '<span class="emoji">' + b.emoji + '</span> ' + esc(b.name) + '</div>';
    }).join('') + '</div>';
  }

  function confettiBurst() {
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

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2400);
  }

  function statusForMastery(m) {
    if (m >= Engine.MASTERY_THRESHOLD) return { label: 'Mastered', cls: 'status-mastered' };
    if (m >= 60) return { label: 'Proficient', cls: 'status-proficient' };
    if (m >= 35) return { label: 'Developing', cls: 'status-developing' };
    return { label: 'Not Started', cls: 'status-new' };
  }

  // ---------- nav ----------
  var NAV_ITEMS = [
    { id: 'dashboard', label: '🏠 Dashboard' },
    { id: 'progress', label: '📊 Progress Report' },
    { id: 'rewards', label: '🎁 Rewards Shop' },
    { id: 'parent', label: '👪 Parent Zone' }
  ];

  function renderNav(active) {
    navEl.classList.remove('hidden');
    navEl.innerHTML = NAV_ITEMS.map(function (n) {
      return '<button class="nav-btn' + (n.id === active ? ' active' : '') + '" data-view="' + n.id + '">' + n.label + '</button>';
    }).join('');
    $all('.nav-btn', navEl).forEach(function (btn) {
      btn.addEventListener('click', function () { go(btn.getAttribute('data-view')); });
    });
  }

  function hideNav() { navEl.classList.add('hidden'); }

  // ---------- router ----------
  function go(view, params) {
    if (view === 'dashboard') renderDashboard();
    else if (view === 'progress') renderProgress();
    else if (view === 'rewards') renderRewards();
    else if (view === 'parent') renderParentGate();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- welcome ----------
  function renderWelcome() {
    hideNav();
    mainEl.innerHTML =
      '<div class="card welcome-hero">' +
      '<div class="big-emoji">🚀🧮</div>' +
      '<h1>Welcome, ' + esc(state.studentName) + "'s Math Quest!" + '</h1>' +
      '<p>This is your own adaptive 7th-grade math trainer, built like the Alpha School model: short focused sprints, questions that grow with you, and real rewards for real mastery.</p>' +
      '<p>First, a quick <strong>Placement Quiz</strong> (about 20 questions, one per skill) so your quest can be built just for you. Answer your best &mdash; it is okay to not know some yet!</p>' +
      '<button class="btn" id="start-diag-btn">Start My Placement Quiz →</button>' +
      '</div>';
    $('#start-diag-btn').addEventListener('click', startDiagnostic);
  }

  // ---------- diagnostic ----------
  function startDiagnostic() {
    diagCtx = { questions: Engine.buildDiagnostic(state), idx: 0, correctCount: 0 };
    renderDiagQuestion();
  }

  function renderDiagQuestion() {
    hideNav();
    var q = diagCtx.questions[diagCtx.idx];
    var pct = Math.round((diagCtx.idx / diagCtx.questions.length) * 100);
    mainEl.innerHTML =
      '<div class="card">' +
      '<div class="quiz-meta"><span>Placement Quiz — ' + Q.SKILL_MAP[q.skill].name + '</span><span>' + (diagCtx.idx + 1) + ' / ' + diagCtx.questions.length + '</span></div>' +
      '<div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="question-prompt">' + esc(q.prompt) + '</div>' +
      '<div id="answer-zone"></div>' +
      '</div>';
    renderAnswerZone(q, function (correct) {
      Engine.recordDiagnosticAnswer(state, q.skill, correct);
      diagCtx.idx += 1;
      if (correct) diagCtx.correctCount += 1;
      setTimeout(function () {
        if (diagCtx.idx >= diagCtx.questions.length) finishDiagnostic();
        else renderDiagQuestion();
      }, 550);
    }, { quickFeedback: true });
  }

  function finishDiagnostic() {
    var res = Engine.completeDiagnostic(state, diagCtx.correctCount > 0);
    saveState();
    var domains = Q.DOMAINS.map(function (d) { return { d: d, pct: Engine.domainMastery(state, d.id) }; });
    domains.sort(function (a, b) { return a.pct - b.pct; });
    var weakest = domains[0];
    hideNav();
    mainEl.innerHTML =
      '<div class="card center">' +
      '<div class="big-emoji">🎉</div>' +
      '<h1>Placement Complete!</h1>' +
      '<p>You got ' + diagCtx.correctCount + ' out of ' + diagCtx.questions.length + ' correct on first try &mdash; and that is just the starting line. Here is your starting map:</p>' +
      domainRingGrid(false) +
      '<p class="mt-2">Your quest will focus first on <strong>' + weakest.d.name + '</strong> (' + weakest.pct + '%), but you can practice any area anytime.</p>' +
      '<button class="btn mt-2" id="to-dashboard-btn">Go to My Dashboard →</button>' +
      '</div>';
    $('#to-dashboard-btn').addEventListener('click', function () { go('dashboard'); });
    if (res.newBadges.length) setTimeout(function () { announceBadges(res.newBadges); }, 400);
  }

  // ---------- answer zone (shared by diagnostic + sprint) ----------
  function renderAnswerZone(q, onAnswered, opts) {
    opts = opts || {};
    var zone = $('#answer-zone');
    if (q.type === 'mc') {
      zone.innerHTML = '<div class="mc-grid">' + q.choices.map(function (c, i) {
        return '<button class="mc-choice" data-idx="' + i + '">' + esc(c) + '</button>';
      }).join('') + '</div><div id="feedback-slot"></div>';
      $all('.mc-choice', zone).forEach(function (btn) {
        btn.addEventListener('click', function () {
          $all('.mc-choice', zone).forEach(function (b) { b.disabled = true; });
          var chosen = parseInt(btn.getAttribute('data-idx'), 10);
          var correct = chosen === q.answer;
          btn.classList.add(correct ? 'correct' : 'incorrect');
          if (!correct) $all('.mc-choice', zone)[q.answer].classList.add('correct');
          showFeedback(q, correct, onAnswered, opts);
        });
      });
    } else {
      zone.innerHTML =
        '<div class="numeric-input-row">' +
        '<input type="text" inputmode="decimal" id="numeric-answer" placeholder="Type your answer" autocomplete="off" />' +
        '<button class="btn" id="submit-answer-btn">Check ✓</button>' +
        '</div><div id="feedback-slot"></div>';
      var input = $('#numeric-answer');
      var submit = function () {
        var val = parseFloat((input.value || '').replace(/,/g, ''));
        input.disabled = true; $('#submit-answer-btn').disabled = true;
        var correct = !isNaN(val) && Math.abs(val - q.answer) <= (q.tolerance || 0.01);
        showFeedback(q, correct, onAnswered, opts);
      };
      $('#submit-answer-btn').addEventListener('click', submit);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      input.focus();
    }
  }

  function showFeedback(q, correct, onAnswered, opts) {
    var slot = $('#feedback-slot');
    if (opts.quickFeedback) {
      slot.innerHTML = '<div class="feedback-panel ' + (correct ? 'correct' : 'incorrect') + '"><div class="feedback-title">' + (correct ? '✅ Nice!' : '➡️ Noted — moving on') + '</div></div>';
      onAnswered(correct);
      return;
    }
    var comboLine = opts.comboStreak > 1 ? '<div class="combo-flame">🔥 ' + opts.comboStreak + ' in a row!</div>' : '';
    slot.innerHTML =
      '<div class="feedback-panel ' + (correct ? 'correct' : 'incorrect') + '">' +
      '<div class="feedback-title">' + (correct ? '✅ Correct!' : '❌ Not quite') + '</div>' +
      '<div>' + esc(q.explanation) + '</div>' + comboLine +
      '<button class="btn small mt-2" id="continue-btn">Continue →</button>' +
      '</div>';
    $('#continue-btn').addEventListener('click', function () { onAnswered(correct); });
  }

  // ---------- dashboard ----------
  function renderDashboard() {
    renderNav('dashboard');
    var lvl = Engine.levelFor(state.lifetimePoints);
    var weakest = Q.DOMAIN_MAP[Engine.weakestDomain(state)];
    var goal = state.dailyGoal;
    mainEl.innerHTML =
      '<div class="grid" style="gap:16px;">' +
      '<div class="card">' +
      '<div class="section-title"><h2>Hi ' + esc(state.studentName) + '! ' + lvl.emoji + '</h2><span class="text-soft">' + lvl.title + (lvl.next ? ' · ' + lvl.pointsToNext + ' pts to ' + lvl.next.title : ' · Max level!') + '</span></div>' +
      '<p>Today\'s goal: complete <strong>' + goal.target + ' sprint' + (goal.target > 1 ? 's' : '') + '</strong> — ' + goal.sprintsToday + '/' + goal.target + (goal.goalMet ? ' ✅ done!' : '') + '</p>' +
      '<div class="grid grid-2">' +
      '<div>' +
      '<h3 style="margin-bottom:6px;">🎯 Recommended Sprint</h3>' +
      '<p style="margin-top:0;">' + weakest.emoji + ' <strong>' + weakest.name + '</strong> needs the most love right now.</p>' +
      '<button class="btn block" id="start-recommended-btn">Start Recommended Sprint →</button>' +
      '</div>' +
      '<div>' +
      '<h3 style="margin-bottom:6px;">🗺️ Choose Your Own Adventure</h3>' +
      '<p style="margin-top:0;">Pick any domain below to practice it directly.</p>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="card"><h2>Your Mastery Map</h2>' + domainRingGrid(true) + '</div>' +
      '<div class="card"><h2>Badges</h2>' + badgeShelf() + '</div>' +
      '</div>';

    $('#start-recommended-btn').addEventListener('click', function () { startSprint(weakest.id); });
    $all('.ring-card', mainEl).forEach(function (card) {
      card.addEventListener('click', function () { startSprint(card.getAttribute('data-domain')); });
    });
  }

  // ---------- sprint ----------
  function startSprint(domainId) {
    sprintCtx = { domain: domainId, questions: Engine.buildSprint(state, domainId, 8), idx: 0, results: [], comboStreak: 0 };
    renderSprintQuestion();
  }

  function renderSprintQuestion() {
    hideNav();
    var q = sprintCtx.questions[sprintCtx.idx];
    var d = Q.DOMAIN_MAP[q.domain];
    var pct = Math.round((sprintCtx.idx / sprintCtx.questions.length) * 100);
    var diffLabel = { 1: 'Warm-Up', 2: 'On Level', 3: 'Challenge' }[q.difficulty];
    mainEl.innerHTML =
      '<div class="card">' +
      '<div class="quiz-meta">' +
      '<span>' + d.emoji + ' ' + esc(Q.SKILL_MAP[q.skill].name) + '</span>' +
      '<span class="difficulty-pill d' + q.difficulty + '">' + diffLabel + '</span>' +
      '<span>' + (sprintCtx.idx + 1) + ' / ' + sprintCtx.questions.length + '</span>' +
      '</div>' +
      '<div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' + pct + '%; background: linear-gradient(90deg, ' + d.color + ', var(--accent-2));"></div></div>' +
      '<div class="question-prompt">' + esc(q.prompt) + '</div>' +
      '<div id="answer-zone"></div>' +
      '</div>';

    renderAnswerZone(q, function (correct) {
      sprintCtx.comboStreak = correct ? sprintCtx.comboStreak + 1 : 0;
      sprintCtx.results.push({ skill: q.skill, domain: q.domain, difficulty: q.difficulty, correct: correct });
      sprintCtx.idx += 1;
      if (sprintCtx.idx >= sprintCtx.questions.length) finishSprint();
      else renderSprintQuestion();
    }, { quickFeedback: false, comboStreak: sprintCtx.comboStreak + 1 });
  }

  function finishSprint() {
    var summary = Engine.completeSprint(state, sprintCtx.results);
    saveState();
    var acc = Math.round((summary.correctCount / summary.total) * 100);
    var masteredNames = summary.newlyMasteredSkillIds.map(function (id) { return Q.SKILL_MAP[id].name; });
    hideNav();
    mainEl.innerHTML =
      '<div class="card center">' +
      '<div class="big-emoji">' + (summary.sprintPerfect ? '💯' : acc >= 70 ? '🌟' : '💪') + '</div>' +
      '<h1>Sprint Complete!</h1>' +
      '<p>' + summary.correctCount + ' / ' + summary.total + ' correct (' + acc + '%)</p>' +
      '<p style="font-size:1.3rem;font-weight:800;color:var(--accent);">+' + (summary.pointsEarned + summary.dailyBonus) + ' points earned 💎</p>' +
      (summary.dailyBonus ? '<p>🎯 Daily goal bonus included!</p>' : '') +
      (masteredNames.length ? ('<p>🔓 Skill' + (masteredNames.length > 1 ? 's' : '') + ' mastered: <strong>' + masteredNames.map(esc).join(', ') + '</strong></p>') : '') +
      '<div class="grid grid-2 mt-2">' +
      '<button class="btn" id="another-sprint-btn">Do Another Sprint →</button>' +
      '<button class="btn secondary" id="back-dashboard-btn">Back to Dashboard</button>' +
      '</div>' +
      '</div>';
    $('#another-sprint-btn').addEventListener('click', function () { startSprint(sprintCtx.domain); });
    $('#back-dashboard-btn').addEventListener('click', function () { go('dashboard'); });

    if (summary.newlyMasteredSkillIds.length || summary.newBadges.length || summary.sprintPerfect) {
      confettiBurst();
    }
    if (summary.newBadges.length) setTimeout(function () { announceBadges(summary.newBadges); }, 300);
  }

  function announceBadges(badges) {
    badges.forEach(function (b, i) {
      setTimeout(function () { toast('🏅 Badge earned: ' + b.name + ' (+' + b.bonus + ' pts)'); }, i * 900);
    });
  }

  // ---------- progress report ----------
  function renderProgress() {
    renderNav('progress');
    var rows = Q.SKILLS.map(function (s) {
      var sk = state.skills[s.id];
      var d = Q.DOMAIN_MAP[s.domain];
      var st = statusForMastery(sk.mastery);
      var acc = sk.attempts ? Math.round((sk.correct / sk.attempts) * 100) : 0;
      return '<tr>' +
        '<td>' + d.emoji + ' ' + esc(d.short) + '</td>' +
        '<td>' + esc(s.name) + '</td>' +
        '<td><span class="mastery-bar-bg"><span class="mastery-bar-fill" style="width:' + sk.mastery + '%;background:' + d.color + '"></span></span>' + sk.mastery + '%</td>' +
        '<td><span class="status-pill ' + st.cls + '">' + st.label + '</span></td>' +
        '<td>' + sk.attempts + ' (' + acc + '% correct)</td>' +
        '<td>' + (sk.lastPracticed || '—') + '</td>' +
        '</tr>';
    }).join('');
    mainEl.innerHTML =
      '<div class="card">' +
      '<h2>Progress Report</h2>' +
      '<p>Every skill across all 5 Grade 7 math domains, updated live as ' + esc(state.studentName) + ' practices.</p>' +
      '<div style="overflow-x:auto;"><table class="report"><thead><tr><th>Domain</th><th>Skill</th><th>Mastery</th><th>Status</th><th>Attempts</th><th>Last practiced</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '</div>';
  }

  // ---------- rewards shop ----------
  function renderRewards() {
    renderNav('rewards');
    var cards = state.rewards.slice().sort(function (a, b) { return a.cost - b.cost; }).map(function (r) {
      var afford = state.points >= r.cost;
      return '<div class="card reward-card">' +
        '<div><div class="name">' + esc(r.name) + '</div><div class="cost">💎 ' + r.cost + ' points</div></div>' +
        '<button class="btn small' + (afford ? '' : ' secondary') + '" data-reward="' + r.id + '" ' + (afford ? '' : 'disabled') + '>Redeem</button>' +
        '</div>';
    }).join('');
    var history = state.redemptions.slice(0, 8).map(function (r) {
      return '<li>' + esc(r.date) + ' — ' + esc(r.rewardName) + ' (' + r.cost + ' pts)' + (r.fulfilled ? ' ✅' : ' ⏳ waiting on a grown-up') + '</li>';
    }).join('');
    mainEl.innerHTML =
      '<div class="card"><h2>🎁 Rewards Shop</h2><p>You have <strong>💎 ' + state.points + ' points</strong> to spend. Redeeming lets a grown-up know it\'s time to deliver!</p></div>' +
      '<div class="grid grid-2 mt-2">' + cards + '</div>' +
      '<div class="card mt-2"><h3>Redemption History</h3>' + (history ? '<ul>' + history + '</ul>' : '<p class="text-soft">No redemptions yet — go earn some points!</p>') + '</div>';
    $all('[data-reward]', mainEl).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var res = Engine.redeemReward(state, btn.getAttribute('data-reward'));
        if (res.ok) { saveState(); toast('🎉 Redeemed: ' + res.redemption.rewardName); renderRewards(); }
        else toast(res.message);
      });
    });
  }

  // ---------- parent zone ----------
  function renderParentGate() {
    renderNav('parent');
    mainEl.innerHTML =
      '<div class="card parent-gate">' +
      '<div class="big-emoji">👪</div>' +
      '<h2>Parent Zone</h2>' +
      '<p>Manage rewards, review progress details, and fulfill redemption requests.</p>' +
      '<button class="btn" id="enter-parent-btn">Enter Parent Zone</button>' +
      '</div>';
    $('#enter-parent-btn').addEventListener('click', renderParentPanel);
  }

  function renderParentPanel() {
    var rewardRows = state.rewards.map(function (r) {
      return '<div class="form-row" style="align-items:center;">' +
        '<span style="flex:1;">' + esc(r.name) + ' — 💎 ' + r.cost + '</span>' +
        '<button class="btn small danger" data-del-reward="' + r.id + '">Remove</button>' +
        '</div>';
    }).join('');
    var redemptionRows = state.redemptions.map(function (r) {
      return '<div class="form-row" style="align-items:center;">' +
        '<span style="flex:1;">' + esc(r.date) + ' — ' + esc(r.rewardName) + ' (' + r.cost + ' pts) ' + (r.fulfilled ? '✅ fulfilled' : '⏳ pending') + '</span>' +
        (r.fulfilled ? '' : '<button class="btn small success" data-fulfill="' + r.id + '">Mark Fulfilled</button>') +
        '</div>';
    }).join('') || '<p class="text-soft">No redemptions yet.</p>';

    mainEl.innerHTML =
      '<div class="card">' +
      '<h2>Manage Rewards</h2>' +
      '<div class="form-row"><input type="text" id="new-reward-name" placeholder="Reward name" style="flex:2;"><input type="number" id="new-reward-cost" placeholder="Cost (points)" style="flex:1;"><button class="btn" id="add-reward-btn">Add</button></div>' +
      rewardRows +
      '</div>' +
      '<div class="card mt-2"><h2>Redemption Requests</h2>' + redemptionRows + '</div>' +
      '<div class="card mt-2"><h2>Daily Goal</h2>' +
      '<div class="form-row"><label>Sprints per day: <input type="number" id="daily-target" value="' + state.dailyGoal.target + '" min="1" max="10" style="width:60px;"></label><button class="btn small" id="save-goal-btn">Save</button></div>' +
      '</div>' +
      '<div class="card mt-2"><h2>Danger Zone</h2><p class="text-soft">This clears all progress, points, and badges. Cannot be undone.</p><button class="btn danger" id="reset-btn">Reset All Progress</button></div>';

    $('#add-reward-btn').addEventListener('click', function () {
      var name = $('#new-reward-name').value.trim();
      var cost = parseInt($('#new-reward-cost').value, 10);
      if (!name || !cost || cost <= 0) { toast('Enter a name and a positive point cost.'); return; }
      state.rewards.push({ id: 'r_' + Date.now(), name: name, cost: cost });
      saveState(); renderParentPanel();
    });
    $all('[data-del-reward]', mainEl).forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.rewards = state.rewards.filter(function (r) { return r.id !== btn.getAttribute('data-del-reward'); });
        saveState(); renderParentPanel();
      });
    });
    $all('[data-fulfill]', mainEl).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var r = state.redemptions.find(function (x) { return x.id === btn.getAttribute('data-fulfill'); });
        if (r) r.fulfilled = true;
        saveState(); renderParentPanel();
      });
    });
    $('#save-goal-btn').addEventListener('click', function () {
      var t = parseInt($('#daily-target').value, 10);
      if (t && t > 0) { state.dailyGoal.target = t; saveState(); toast('Daily goal updated.'); }
    });
    $('#reset-btn').addEventListener('click', function () {
      if (confirm('Reset ALL progress, points, and badges? This cannot be undone.')) {
        state = Storage.reset();
        saveState();
        renderWelcome();
      }
    });
  }

  // ---------- init ----------
  function init() {
    mainEl = $('#app-main');
    navEl = $('#app-nav');
    headerStatsEl = $('#header-stats');
    state = Storage.load();
    updateHeaderStats();
    if (!state.diagnosticDone) renderWelcome();
    else renderDashboard();
  }

  root.App = root.App || {};
  root.App.UI = { init: init };
})(typeof window !== 'undefined' ? window : global);
