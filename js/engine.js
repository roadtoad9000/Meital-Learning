/* Learning engine.
   Model (following Alpha's approach): diagnose each strand DOWN to find the student's
   real "knowledge grade", then teach the lowest unmastered level — lesson first,
   practice second — and only unlock the next level once this one is demonstrated. */
(function (root) {
  var C = root.App.Curriculum;

  var MASTERY_STREAK = 4;     // correct-in-a-row needed to master a level
  var GUIDED_COUNT = 2;       // scaffolded questions right after a lesson

  var LEVELS_BY_STRAND = {};
  C.STRANDS.forEach(function (s) {
    LEVELS_BY_STRAND[s.id] = C.LEVELS.filter(function (l) { return l.strand === s.id; });
  });
  var LEVEL_MAP = {};
  C.LEVELS.forEach(function (l) { LEVEL_MAP[l.id] = l; });

  var STRAND_MAP = {};
  C.STRANDS.forEach(function (s) { STRAND_MAP[s.id] = s; });

  var LEVELS_TITLES = [
    { min: 0, title: 'Math Explorer', emoji: '🧭' },
    { min: 500, title: 'Number Ninja', emoji: '🥷' },
    { min: 1500, title: 'Equation Explorer', emoji: '🗺️' },
    { min: 3000, title: 'Geometry Guru', emoji: '📐' },
    { min: 5000, title: 'Data Detective', emoji: '🔍' },
    { min: 8000, title: 'Math Strategist', emoji: '♟️' },
    { min: 12000, title: 'Math Whiz', emoji: '⚡' },
    { min: 18000, title: 'Math Master', emoji: '🏆' },
    { min: 25000, title: 'Math Legend', emoji: '👑' }
  ];

  var BADGES = [
    { id: 'first_steps', name: 'First Steps', emoji: '👣', desc: 'Answered your first question correctly', bonus: 25 },
    { id: 'lesson_learner', name: 'Lesson Learner', emoji: '📖', desc: 'Worked through your first lesson', bonus: 50 },
    { id: 'first_mastery', name: 'Level Up', emoji: '🔓', desc: 'Mastered your first level', bonus: 100 },
    { id: 'wn_champion', name: 'Whole Numbers Champion', emoji: '🔟', desc: 'Mastered every Whole Numbers level', bonus: 250 },
    { id: 'fd_champion', name: 'Fractions Champion', emoji: '🍕', desc: 'Mastered every Fractions & Decimals level', bonus: 250 },
    { id: 'in_champion', name: 'Negatives Champion', emoji: '🌡️', desc: 'Mastered every Negative Numbers level', bonus: 250 },
    { id: 'rp_champion', name: 'Ratios Champion', emoji: '⚖️', desc: 'Mastered every Ratios & Percents level', bonus: 250 },
    { id: 'ee_champion', name: 'Algebra Champion', emoji: '🧮', desc: 'Mastered every Expressions & Equations level', bonus: 250 },
    { id: 'gm_champion', name: 'Geometry Champion', emoji: '📐', desc: 'Mastered every Geometry level', bonus: 250 },
    { id: 'sp_champion', name: 'Data Champion', emoji: '🎲', desc: 'Mastered every Data & Probability level', bonus: 250 },
    { id: 'grade5_clear', name: 'Grade 5 Cleared', emoji: '5️⃣', desc: 'Mastered every Grade 5 level', bonus: 300 },
    { id: 'grade6_clear', name: 'Grade 6 Cleared', emoji: '6️⃣', desc: 'Mastered every Grade 6 level', bonus: 400 },
    { id: 'grade7_clear', name: 'Grade 7 Cleared', emoji: '7️⃣', desc: 'Mastered every Grade 7 level', bonus: 1000 },
    { id: 'streak_3', name: '3-Day Streak', emoji: '🔥', desc: 'Practiced 3 days in a row', bonus: 75 },
    { id: 'streak_7', name: 'Week Warrior', emoji: '🌟', desc: 'Practiced 7 days in a row', bonus: 200 },
    { id: 'perfect_session', name: 'Perfect Session', emoji: '💯', desc: 'Finished a session with no mistakes', bonus: 100 },
    { id: 'comeback_kid', name: 'Comeback Kid', emoji: '💪', desc: 'Mastered a level you missed on the placement', bonus: 150 }
  ];
  var BADGE_MAP = {};
  BADGES.forEach(function (b) { BADGE_MAP[b.id] = b; });

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function titleFor(lifetimePoints) {
    var cur = LEVELS_TITLES[0];
    for (var i = 0; i < LEVELS_TITLES.length; i++) {
      if (lifetimePoints >= LEVELS_TITLES[i].min) cur = LEVELS_TITLES[i]; else break;
    }
    var next = LEVELS_TITLES[LEVELS_TITLES.indexOf(cur) + 1] || null;
    return { title: cur.title, emoji: cur.emoji, next: next, pointsToNext: next ? next.min - lifetimePoints : 0 };
  }

  // ---------- progression ----------
  function isMastered(state, levelId) {
    var s = state.levels[levelId];
    return !!(s && s.masteredAt);
  }

  function strandLevels(strandId) { return LEVELS_BY_STRAND[strandId] || []; }

  /* The level a student is currently working on in a strand: the lowest one not yet
     mastered. Everything below it is done, everything above is locked. */
  function currentLevel(state, strandId) {
    var levels = strandLevels(strandId);
    for (var i = 0; i < levels.length; i++) {
      if (!isMastered(state, levels[i].id)) return levels[i];
    }
    return null; // whole strand complete
  }

  function isUnlocked(state, levelId) {
    var lv = LEVEL_MAP[levelId];
    if (!lv) return false;
    var levels = strandLevels(lv.strand);
    var idx = levels.findIndex(function (l) { return l.id === levelId; });
    if (idx <= 0) return true;
    return isMastered(state, levels[idx - 1].id);
  }

  function strandProgress(state, strandId) {
    var levels = strandLevels(strandId);
    var done = levels.filter(function (l) { return isMastered(state, l.id); }).length;
    return { done: done, total: levels.length, pct: Math.round((done / levels.length) * 100) };
  }

  /* "Knowledge grade" for a strand: the highest grade whose levels in this strand are
     all mastered. Reported to the parent so gaps below grade level are visible. */
  function knowledgeGrade(state, strandId) {
    var levels = strandLevels(strandId);
    var best = null;
    [4, 5, 6, 7].forEach(function (g) {
      var atGrade = levels.filter(function (l) { return l.grade === g; });
      if (!atGrade.length) return;
      if (atGrade.every(function (l) { return isMastered(state, l.id); })) best = g;
    });
    return best; // null = has gaps below grade 4 content in this strand
  }

  function overallKnowledgeGrade(state) {
    var grades = C.STRANDS.map(function (s) { return knowledgeGrade(state, s.id); });
    if (grades.some(function (g) { return g === null; })) return null;
    return Math.min.apply(null, grades);
  }

  /* Recommend the strand furthest behind — fill the lowest gaps first, like Alpha
     assigning fifth-grade material to a seventh grader when that's the real gap. */
  function recommendedStrand(state) {
    var best = null, bestGrade = 99, bestPct = 999;
    C.STRANDS.forEach(function (s) {
      var cur = currentLevel(state, s.id);
      if (!cur) return;
      var pct = strandProgress(state, s.id).pct;
      if (cur.grade < bestGrade || (cur.grade === bestGrade && pct < bestPct)) {
        best = s.id; bestGrade = cur.grade; bestPct = pct;
      }
    });
    return best;
  }

  function nextUpLevel(state) {
    var strandId = recommendedStrand(state);
    return strandId ? currentLevel(state, strandId) : null;
  }

  // ---------- adaptive placement (binary search down each strand) ----------
  function newDiagnostic() {
    return {
      strandIdx: 0, lo: 0, hi: strandLevels(C.STRANDS[0].id).length - 1,
      highestPassed: -1, asked: 0, results: [], done: false, probingFloor: true
    };
  }

  /* The FIRST question in each strand is always its easiest level. Confidence
     first: a student should get a win before the search starts climbing. */
  function diagnosticIndex(diag) {
    if (diag.probingFloor) return diag.lo;
    return Math.floor((diag.lo + diag.hi) / 2);
  }

  function diagnosticCurrentLevel(diag) {
    var strand = C.STRANDS[diag.strandIdx];
    if (!strand) return null;
    var levels = strandLevels(strand.id);
    if (diag.lo > diag.hi) return null;
    return levels[diagnosticIndex(diag)];
  }

  /* Record one placement answer and advance the search. Correct → look higher.
     Wrong → look lower. When a strand's search closes, move to the next strand. */
  function diagnosticAnswer(diag, correct) {
    var strand = C.STRANDS[diag.strandIdx];
    var levels = strandLevels(strand.id);
    var mid = diagnosticIndex(diag);
    diag.asked += 1;
    diag.results.push({ levelId: levels[mid].id, correct: correct });
    if (correct) { diag.highestPassed = Math.max(diag.highestPassed, mid); diag.lo = mid + 1; }
    else { diag.hi = mid - 1; }
    diag.probingFloor = false;

    if (diag.lo > diag.hi) {
      diag.strandResults = diag.strandResults || {};
      diag.strandResults[strand.id] = diag.highestPassed;
      diag.strandIdx += 1;
      var nextStrand = C.STRANDS[diag.strandIdx];
      if (!nextStrand) { diag.done = true; return diag; }
      diag.lo = 0;
      diag.hi = strandLevels(nextStrand.id).length - 1;
      diag.highestPassed = -1;
      diag.probingFloor = true;
    }
    return diag;
  }

  function diagnosticTotalEstimate() {
    // +1 per strand for the confidence-building floor question
    return C.STRANDS.reduce(function (sum, s) {
      return sum + 1 + Math.ceil(Math.log2(strandLevels(s.id).length + 1));
    }, 0);
  }

  /* Apply placement: everything at or below the highest level she passed in a strand is
     treated as already known, so she never grinds through material she's shown she has. */
  function applyDiagnostic(state, diag) {
    var placedCount = 0, gapCount = 0;
    C.STRANDS.forEach(function (s) {
      var highest = (diag.strandResults && diag.strandResults[s.id] !== undefined) ? diag.strandResults[s.id] : -1;
      var levels = strandLevels(s.id);
      levels.forEach(function (lv, idx) {
        var ls = state.levels[lv.id];
        if (idx <= highest) {
          ls.masteredAt = ls.masteredAt || root.App.Storage.todayStr();
          ls.placedByDiagnostic = true;
          ls.streak = MASTERY_STREAK;
          placedCount += 1;
        } else {
          gapCount += 1;
        }
      });
    });
    diag.results.forEach(function (r) {
      if (!r.correct) state.levels[r.levelId].missedOnPlacement = true;
    });
    state.diagnosticDone = true;
    return { placedCount: placedCount, gapCount: gapCount };
  }

  // ---------- practice ----------
  function questionFor(levelId) {
    var lv = LEVEL_MAP[levelId];
    var q = lv.gen();
    q.levelId = levelId;
    q.strand = lv.strand;
    q.grade = lv.grade;
    if (!q.type) q.type = q.choices ? 'mc' : 'numeric';
    return q;
  }

  function pointsForAnswer(grade, correct, comboStreak, usedHelp) {
    if (!correct) return 0;
    var base = { 4: 10, 5: 15, 6: 20, 7: 25 }[grade] || 15;
    if (usedHelp) return Math.round(base * 0.4); // still worth something, but not full credit
    var combo = comboStreak > 3 ? (comboStreak - 3) * 5 : 0;
    return base + combo;
  }

  /* A level is mastered by demonstrating it: MASTERY_STREAK correct in a row.
     A miss resets the streak — and triggers a teaching moment in the UI. */
  function recordAnswer(state, levelId, correct, usedHelp) {
    var ls = state.levels[levelId];
    ls.attempts += 1;
    if (usedHelp) ls.hintedAnswers = (ls.hintedAnswers || 0) + 1;
    // Getting it right WITH the answer in front of you doesn't prove mastery,
    // so a helped question holds the streak rather than advancing it.
    if (correct && !usedHelp) { ls.correct += 1; ls.streak += 1; }
    else if (correct) { ls.correct += 1; }
    else { ls.streak = 0; }
    ls.lastPracticed = root.App.Storage.todayStr();
    var justMastered = false;
    if (ls.streak >= MASTERY_STREAK && !ls.masteredAt) {
      ls.masteredAt = root.App.Storage.todayStr();
      justMastered = true;
    }
    return justMastered;
  }

  function levelProgressPct(state, levelId) {
    var ls = state.levels[levelId];
    if (!ls) return 0;
    if (ls.masteredAt) return 100;
    return Math.round((ls.streak / MASTERY_STREAK) * 100);
  }

  function addPoints(state, amount) {
    state.points += amount;
    if (amount > 0) state.lifetimePoints += amount;
  }

  function awardBadge(state, id) {
    if (state.badges.indexOf(id) !== -1) return null;
    state.badges.push(id);
    var b = BADGE_MAP[id];
    if (b) addPoints(state, b.bonus);
    return b;
  }

  function checkBadges(state, ctx) {
    var earned = [];
    function give(id) { var b = awardBadge(state, id); if (b) earned.push(b); }

    if (ctx.anyCorrect) give('first_steps');
    if (ctx.lessonCompleted && ctx.anyCorrect) give('lesson_learner');

    var masteredAny = C.LEVELS.some(function (l) { return isMastered(state, l.id) && !state.levels[l.id].placedByDiagnostic; });
    if (masteredAny) give('first_mastery');

    C.STRANDS.forEach(function (s) {
      if (strandLevels(s.id).every(function (l) { return isMastered(state, l.id); })) give(s.id.toLowerCase() + '_champion');
    });

    [5, 6, 7].forEach(function (g) {
      var atGrade = C.LEVELS.filter(function (l) { return l.grade === g; });
      if (atGrade.length && atGrade.every(function (l) { return isMastered(state, l.id); })) give('grade' + g + '_clear');
    });

    if (state.streak.current >= 3) give('streak_3');
    if (state.streak.current >= 7) give('streak_7');
    if (ctx.perfectSession && ctx.sessionLength >= 5) give('perfect_session');

    (ctx.newlyMastered || []).forEach(function (levelId) {
      if (state.levels[levelId].missedOnPlacement) give('comeback_kid');
    });

    return earned;
  }

  function updateStreakOnPractice(state) {
    var today = root.App.Storage.todayStr();
    var last = state.streak.lastPracticeDate;
    if (last === today) return;
    if (last) {
      var diffDays = Math.round((new Date(today + 'T00:00:00') - new Date(last + 'T00:00:00')) / 86400000);
      state.streak.current = diffDays === 1 ? state.streak.current + 1 : 1;
    } else {
      state.streak.current = 1;
    }
    state.streak.best = Math.max(state.streak.best, state.streak.current);
    state.streak.lastPracticeDate = today;
  }

  var SESSION_COUNTS_MIN_CORRECT = 4;

  function completeSession(state, summary) {
    // A session only counts toward the daily goal (and the streak) if it contained
    // real, unaided correct work. Otherwise you could farm the bonus by starting
    // and immediately quitting.
    var counts = summary.unaidedCorrect >= SESSION_COUNTS_MIN_CORRECT || summary.mastered;
    if (!counts) {
      state.history.push({
        date: root.App.Storage.todayStr(), levelId: summary.levelId,
        correct: summary.correctCount, total: summary.total,
        pointsEarned: summary.pointsEarned, mastered: false, counted: false
      });
      if (state.history.length > 200) state.history = state.history.slice(-200);
      return 0;
    }
    updateStreakOnPractice(state);
    state.dailyGoal.sessionsToday += 1;
    var dailyBonus = 0;
    if (!state.dailyGoal.goalMet && state.dailyGoal.sessionsToday >= state.dailyGoal.target) {
      state.dailyGoal.goalMet = true;
      dailyBonus = 100;
      addPoints(state, dailyBonus);
    }
    state.history.push({
      date: root.App.Storage.todayStr(),
      levelId: summary.levelId,
      correct: summary.correctCount,
      total: summary.total,
      pointsEarned: summary.pointsEarned + dailyBonus,
      mastered: summary.mastered,
      counted: true
    });
    if (state.history.length > 200) state.history = state.history.slice(-200);
    return dailyBonus;
  }

  function redeemReward(state, rewardId) {
    var reward = state.rewards.find(function (r) { return r.id === rewardId; });
    if (!reward) return { ok: false, message: 'Reward not found.' };
    if (state.points < reward.cost) return { ok: false, message: 'Not enough points yet.' };
    state.points -= reward.cost;
    var redemption = { id: 'red_' + Date.now(), rewardName: reward.name, cost: reward.cost, date: root.App.Storage.todayStr(), fulfilled: false };
    state.redemptions.unshift(redemption);
    return { ok: true, redemption: redemption };
  }

  root.App = root.App || {};
  root.App.Engine = {
    MASTERY_STREAK: MASTERY_STREAK,
    SESSION_COUNTS_MIN_CORRECT: SESSION_COUNTS_MIN_CORRECT,
    GUIDED_COUNT: GUIDED_COUNT,
    BADGES: BADGES,
    BADGE_MAP: BADGE_MAP,
    LEVEL_MAP: LEVEL_MAP,
    STRAND_MAP: STRAND_MAP,
    strandLevels: strandLevels,
    titleFor: titleFor,
    isMastered: isMastered,
    isUnlocked: isUnlocked,
    currentLevel: currentLevel,
    strandProgress: strandProgress,
    knowledgeGrade: knowledgeGrade,
    overallKnowledgeGrade: overallKnowledgeGrade,
    recommendedStrand: recommendedStrand,
    nextUpLevel: nextUpLevel,
    newDiagnostic: newDiagnostic,
    diagnosticCurrentLevel: diagnosticCurrentLevel,
    diagnosticAnswer: diagnosticAnswer,
    diagnosticTotalEstimate: diagnosticTotalEstimate,
    applyDiagnostic: applyDiagnostic,
    questionFor: questionFor,
    pointsForAnswer: pointsForAnswer,
    recordAnswer: recordAnswer,
    levelProgressPct: levelProgressPct,
    addPoints: addPoints,
    checkBadges: checkBadges,
    completeSession: completeSession,
    redeemReward: redeemReward
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = root.App.Engine;
})(typeof window !== 'undefined' ? window : global);
