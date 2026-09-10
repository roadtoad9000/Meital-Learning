/* Persistence: all state lives in localStorage under one key. */
(function (root) {
  var STORAGE_KEY = 'meitalMathQuest_v2';

  var DEFAULT_REWARDS = [
    { id: 'r1', name: 'Extra 15 min of screen time', cost: 300 },
    { id: 'r2', name: 'Pick the family movie', cost: 500 },
    { id: 'r3', name: 'Skip one chore', cost: 400 },
    { id: 'r4', name: 'Bake something fun together', cost: 600 },
    { id: 'r5', name: 'Stay up 20 min later on a school night', cost: 350 },
    { id: 'r6', name: 'Choose what\'s for dinner one night', cost: 450 },
    { id: 'r7', name: '$5 bonus allowance', cost: 800 },
    { id: 'r8', name: 'New book of your choice', cost: 1000 },
    { id: 'r9', name: 'Pick out a new Nee Doh squishy', cost: 700 },
    { id: 'r10', name: 'Squishy surprise pack (3 mystery squishies)', cost: 1400 }
  ];

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function blankLevel() {
    return {
      attempts: 0, correct: 0, streak: 0,
      lessonSeen: false, masteredAt: null, lastPracticed: null,
      placedByDiagnostic: false, missedOnPlacement: false
    };
  }

  function createDefaultState() {
    var levels = {};
    root.App.Curriculum.LEVELS.forEach(function (l) { levels[l.id] = blankLevel(); });
    return {
      version: 2,
      studentName: 'Meital',
      diagnosticDone: false,
      points: 0,
      lifetimePoints: 0,
      streak: { current: 0, best: 0, lastPracticeDate: null },
      badges: [],
      levels: levels,
      dailyGoal: { sessionsToday: 0, date: todayStr(), goalMet: false, target: 2 },
      rewards: DEFAULT_REWARDS.map(function (r) { return Object.assign({}, r); }),
      redemptions: [],
      history: []
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      var state = JSON.parse(raw);
      var def = createDefaultState();
      if (!state.levels) state.levels = def.levels;
      Object.keys(def.levels).forEach(function (id) {
        if (!state.levels[id]) state.levels[id] = blankLevel();
      });
      if (!state.rewards) state.rewards = def.rewards;
      if (!state.redemptions) state.redemptions = [];
      if (!state.history) state.history = [];
      if (!state.badges) state.badges = [];
      if (!state.streak) state.streak = def.streak;
      if (!state.dailyGoal) state.dailyGoal = def.dailyGoal;
      if (state.dailyGoal.date !== todayStr()) {
        state.dailyGoal = { sessionsToday: 0, date: todayStr(), goalMet: false, target: state.dailyGoal.target || 2 };
      }
      if (typeof state.lifetimePoints !== 'number') state.lifetimePoints = state.points || 0;
      return state;
    } catch (e) {
      console.warn('Could not load saved progress, starting fresh.', e);
      return createDefaultState();
    }
  }

  function save(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.warn('Could not save progress.', e); }
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    return createDefaultState();
  }

  root.App = root.App || {};
  root.App.Storage = { load: load, save: save, reset: reset, todayStr: todayStr, createDefaultState: createDefaultState };
})(typeof window !== 'undefined' ? window : global);
