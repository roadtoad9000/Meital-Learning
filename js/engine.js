/* Adaptive learning engine: mastery updates, difficulty selection, points, badges, levels. */
(function (root) {
  var Q = root.App.Questions;

  var MASTERY_THRESHOLD = 85;

  var LEVELS = [
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
    { id: 'skill_unlocked', name: 'Skill Unlocked', emoji: '🔓', desc: 'Mastered your first skill', bonus: 100 },
    { id: 'rp_champion', name: 'Ratios Champion', emoji: '⚖️', desc: 'Mastered every Ratios & Proportions skill', bonus: 300 },
    { id: 'ns_champion', name: 'Numbers Champion', emoji: '🔢', desc: 'Mastered every Number System skill', bonus: 300 },
    { id: 'ee_champion', name: 'Algebra Champion', emoji: '🧮', desc: 'Mastered every Expressions & Equations skill', bonus: 300 },
    { id: 'g_champion', name: 'Geometry Champion', emoji: '📐', desc: 'Mastered every Geometry skill', bonus: 300 },
    { id: 'sp_champion', name: 'Data Champion', emoji: '🎲', desc: 'Mastered every Statistics & Probability skill', bonus: 300 },
    { id: 'math_master', name: 'Grade 7 Math Master', emoji: '🏆', desc: 'Mastered all 20 skills', bonus: 1500 },
    { id: 'streak_3', name: '3-Day Streak', emoji: '🔥', desc: 'Practiced 3 days in a row', bonus: 75 },
    { id: 'streak_7', name: 'Week Warrior', emoji: '🌟', desc: 'Practiced 7 days in a row', bonus: 200 },
    { id: 'perfect_sprint', name: 'Perfect Sprint', emoji: '💯', desc: 'Got 100% on a full sprint', bonus: 100 },
    { id: 'comeback_kid', name: 'Comeback Kid', emoji: '💪', desc: 'Mastered a skill you struggled with early on', bonus: 150 }
  ];
  var BADGE_MAP = {};
  BADGES.forEach(function (b) { BADGE_MAP[b.id] = b; });

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function levelFor(lifetimePoints) {
    var cur = LEVELS[0];
    for (var i = 0; i < LEVELS.length; i++) {
      if (lifetimePoints >= LEVELS[i].min) cur = LEVELS[i]; else break;
    }
    var nextIdx = LEVELS.indexOf(cur) + 1;
    var next = LEVELS[nextIdx] || null;
    return { title: cur.title, emoji: cur.emoji, next: next, pointsToNext: next ? (next.min - lifetimePoints) : 0 };
  }

  function difficultyForMastery(mastery) {
    if (mastery < 40) return 1;
    if (mastery < 75) return 2;
    return 3;
  }

  function pickQuestionDifficulty(mastery) {
    var base = difficultyForMastery(mastery);
    var r = Math.random();
    var d = base;
    if (r < 0.15) d = clamp(base - 1, 1, 3);
    else if (r > 0.85) d = clamp(base + 1, 1, 3);
    return d;
  }

  function domainSkills(domainId) {
    return Q.SKILLS.filter(function (s) { return s.domain === domainId; });
  }

  function domainMastery(state, domainId) {
    var skills = domainSkills(domainId);
    var sum = skills.reduce(function (acc, s) { return acc + state.skills[s.id].mastery; }, 0);
    return Math.round(sum / skills.length);
  }

  function weakestDomain(state) {
    var domains = Q.DOMAINS.map(function (d) { return { id: d.id, mastery: domainMastery(state, d.id) }; });
    domains.sort(function (a, b) { return a.mastery - b.mastery; });
    return domains[0].id;
  }

  function pickSprintSkills(state, domainId, count) {
    var skills = domainSkills(domainId);
    var picks = skills.map(function (s) { return s.id; });
    while (picks.length < count) {
      var weights = skills.map(function (s) { return Math.max(5, 100 - state.skills[s.id].mastery); });
      var total = weights.reduce(function (a, b) { return a + b; }, 0);
      var r = Math.random() * total;
      var acc = 0, chosen = skills[0].id;
      for (var i = 0; i < skills.length; i++) {
        acc += weights[i];
        if (r <= acc) { chosen = skills[i].id; break; }
      }
      picks.push(chosen);
    }
    return shuffleArr(picks).slice(0, count);
  }

  function shuffleArr(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function buildSprint(state, domainId, count) {
    count = count || 8;
    var skillIds = pickSprintSkills(state, domainId, count);
    return skillIds.map(function (skillId) {
      var mastery = state.skills[skillId].mastery;
      var diff = pickQuestionDifficulty(mastery);
      return Q.generateQuestion(skillId, diff);
    });
  }

  function buildDiagnostic(state) {
    return Q.SKILLS.map(function (s) { return Q.generateQuestion(s.id, 2); });
  }

  function recordDiagnosticAnswer(state, skillId, correct) {
    var sk = state.skills[skillId];
    sk.diagnosticCorrect = correct;
    sk.mastery = correct ? 60 : 25;
    sk.struggledEarly = !correct;
    sk.attempts += 1;
    if (correct) sk.correct += 1;
    sk.lastPracticed = root.App.Storage.todayStr();
  }

  function pointsForAnswer(difficulty, correct, comboStreak) {
    if (!correct) return 0;
    var base = difficulty * 10;
    var comboBonus = comboStreak > 3 ? (comboStreak - 3) * 5 : 0;
    return base + comboBonus;
  }

  function updateMastery(skillState, difficulty, correct) {
    var gain = correct ? (5 + difficulty * 3) : -(4 + (3 - difficulty) * 2);
    var before = skillState.mastery;
    skillState.mastery = clamp(skillState.mastery + gain, 0, 100);
    skillState.attempts += 1;
    if (correct) skillState.correct += 1;
    skillState.lastPracticed = root.App.Storage.todayStr();
    var justMastered = skillState.mastery >= MASTERY_THRESHOLD && before < MASTERY_THRESHOLD;
    if (justMastered) skillState.masteredAt = root.App.Storage.todayStr();
    return justMastered;
  }

  function addPoints(state, amount) {
    state.points += amount;
    if (amount > 0) state.lifetimePoints += amount;
  }

  function awardBadge(state, badgeId) {
    if (state.badges.indexOf(badgeId) !== -1) return null;
    state.badges.push(badgeId);
    var badge = BADGE_MAP[badgeId];
    if (badge) addPoints(state, badge.bonus);
    return badge;
  }

  function checkBadges(state, context) {
    var newlyEarned = [];
    function tryAward(id) {
      var b = awardBadge(state, id);
      if (b) newlyEarned.push(b);
    }

    if (context.anyCorrectThisSession) tryAward('first_steps');

    var masteredSkills = Q.SKILLS.filter(function (s) { return state.skills[s.id].mastery >= MASTERY_THRESHOLD; });
    if (masteredSkills.length >= 1) tryAward('skill_unlocked');
    if (masteredSkills.length >= Q.SKILLS.length) tryAward('math_master');

    Q.DOMAINS.forEach(function (d) {
      var skills = domainSkills(d.id);
      var allMastered = skills.every(function (s) { return state.skills[s.id].mastery >= MASTERY_THRESHOLD; });
      if (allMastered) tryAward(d.id.toLowerCase() + '_champion');
    });

    if (context.newlyMasteredSkillIds) {
      context.newlyMasteredSkillIds.forEach(function (skillId) {
        if (state.skills[skillId].struggledEarly) tryAward('comeback_kid');
      });
    }

    if (state.streak.current >= 3) tryAward('streak_3');
    if (state.streak.current >= 7) tryAward('streak_7');

    if (context.sprintPerfect && context.sprintLength >= 6) tryAward('perfect_sprint');

    return newlyEarned;
  }

  function updateStreakOnPractice(state) {
    var today = root.App.Storage.todayStr();
    var last = state.streak.lastPracticeDate;
    if (last === today) return;
    if (last) {
      var lastDate = new Date(last + 'T00:00:00');
      var todayDate = new Date(today + 'T00:00:00');
      var diffDays = Math.round((todayDate - lastDate) / 86400000);
      if (diffDays === 1) state.streak.current += 1;
      else state.streak.current = 1;
    } else {
      state.streak.current = 1;
    }
    state.streak.best = Math.max(state.streak.best, state.streak.current);
    state.streak.lastPracticeDate = today;
  }

  function completeSprint(state, results) {
    var newlyMasteredSkillIds = [];
    var comboStreak = 0;
    var earnedPoints = 0;
    var anyCorrect = false;

    results.forEach(function (r) {
      if (r.correct) { comboStreak += 1; anyCorrect = true; } else comboStreak = 0;
      earnedPoints += pointsForAnswer(r.difficulty, r.correct, comboStreak);
      var justMastered = updateMastery(state.skills[r.skill], r.difficulty, r.correct);
      if (justMastered) newlyMasteredSkillIds.push(r.skill);
    });

    var correctCount = results.filter(function (r) { return r.correct; }).length;
    var sprintPerfect = correctCount === results.length;

    earnedPoints += 50; // participation bonus
    newlyMasteredSkillIds.forEach(function () { earnedPoints += 150; });

    addPoints(state, earnedPoints);

    updateStreakOnPractice(state);

    state.dailyGoal.sprintsToday += 1;
    var dailyBonus = 0;
    if (!state.dailyGoal.goalMet && state.dailyGoal.sprintsToday >= state.dailyGoal.target) {
      state.dailyGoal.goalMet = true;
      dailyBonus = 100;
      addPoints(state, dailyBonus);
    }

    var badges = checkBadges(state, {
      anyCorrectThisSession: anyCorrect,
      newlyMasteredSkillIds: newlyMasteredSkillIds,
      sprintPerfect: sprintPerfect,
      sprintLength: results.length
    });

    state.history.push({
      date: root.App.Storage.todayStr(),
      domain: results[0] ? results[0].domain : null,
      correct: correctCount,
      total: results.length,
      pointsEarned: earnedPoints + dailyBonus
    });
    if (state.history.length > 100) state.history = state.history.slice(-100);

    return {
      correctCount: correctCount,
      total: results.length,
      pointsEarned: earnedPoints,
      dailyBonus: dailyBonus,
      newlyMasteredSkillIds: newlyMasteredSkillIds,
      newBadges: badges,
      sprintPerfect: sprintPerfect
    };
  }

  function completeDiagnostic(state, anyCorrect) {
    var badges = checkBadges(state, { anyCorrectThisSession: !!anyCorrect });
    state.diagnosticDone = true;
    return { newBadges: badges };
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
    MASTERY_THRESHOLD: MASTERY_THRESHOLD,
    LEVELS: LEVELS,
    BADGES: BADGES,
    BADGE_MAP: BADGE_MAP,
    levelFor: levelFor,
    domainMastery: domainMastery,
    weakestDomain: weakestDomain,
    buildSprint: buildSprint,
    buildDiagnostic: buildDiagnostic,
    recordDiagnosticAnswer: recordDiagnosticAnswer,
    completeSprint: completeSprint,
    completeDiagnostic: completeDiagnostic,
    redeemReward: redeemReward,
    difficultyForMastery: difficultyForMastery
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.App.Engine;
  }
})(typeof window !== 'undefined' ? window : global);
