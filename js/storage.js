/* Persistence with multiple learner profiles.
   Each learner gets their own independent progress, stored separately in
   localStorage on this device. Nothing is uploaded anywhere. */
(function (root) {
  var PROFILES_KEY = 'mathQuest_profiles';
  var ACTIVE_KEY = 'mathQuest_activeProfile';
  var STATE_PREFIX = 'mathQuest_state_';
  var LEGACY_KEY = 'meitalMathQuest_v2';

  var AVATARS = ['🦊', '🐼', '🦉', '🐙', '🦄', '🐢', '🦁', '🐧', '🦋', '🐸', '🦕', '🐝'];

  var DEFAULT_REWARDS = [
    { id: 'r1', name: 'Extra 15 min of screen time', cost: 300 },
    { id: 'r2', name: 'Pick the family movie', cost: 500 },
    { id: 'r3', name: 'Skip one chore', cost: 400 },
    { id: 'r4', name: 'Bake something fun together', cost: 600 },
    { id: 'r5', name: 'Stay up 20 min later on a school night', cost: 350 },
    { id: 'r6', name: 'Choose what\'s for dinner one night', cost: 450 },
    { id: 'r7', name: '$5 bonus allowance', cost: 800 },
    { id: 'r8', name: 'New book of your choice', cost: 1000 },
    { id: 'r9', name: 'Pick out a new squishy', cost: 700 },
    { id: 'r10', name: 'Surprise pack (3 mystery squishies)', cost: 1400 }
  ];

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.warn('Could not save.', e); }
  }

  function blankLevel() {
    return {
      attempts: 0, correct: 0, streak: 0,
      lessonSeen: false, masteredAt: null, lastPracticed: null,
      placedByDiagnostic: false, missedOnPlacement: false
    };
  }

  function createDefaultState(name) {
    var levels = {};
    root.App.Curriculum.LEVELS.forEach(function (l) { levels[l.id] = blankLevel(); });
    return {
      version: 3,
      studentName: name || 'Learner',
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

  // ---------- profiles ----------
  function listProfiles() { return readJSON(PROFILES_KEY, []); }

  function createProfile(name) {
    var profiles = listProfiles();
    var profile = {
      id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: (name || 'Learner').trim().slice(0, 30),
      avatar: AVATARS[profiles.length % AVATARS.length],
      createdAt: todayStr()
    };
    profiles.push(profile);
    writeJSON(PROFILES_KEY, profiles);
    writeJSON(STATE_PREFIX + profile.id, createDefaultState(profile.name));
    setActiveId(profile.id);
    return profile;
  }

  function renameProfile(id, name) {
    var profiles = listProfiles();
    var p = profiles.find(function (x) { return x.id === id; });
    if (!p) return;
    p.name = (name || p.name).trim().slice(0, 30);
    writeJSON(PROFILES_KEY, profiles);
    var st = readJSON(STATE_PREFIX + id, null);
    if (st) { st.studentName = p.name; writeJSON(STATE_PREFIX + id, st); }
  }

  function deleteProfile(id) {
    writeJSON(PROFILES_KEY, listProfiles().filter(function (p) { return p.id !== id; }));
    try { localStorage.removeItem(STATE_PREFIX + id); } catch (e) {}
    if (getActiveId() === id) {
      try { localStorage.removeItem(ACTIVE_KEY); } catch (e) {}
    }
  }

  function getActiveId() {
    try { return localStorage.getItem(ACTIVE_KEY); } catch (e) { return null; }
  }
  function setActiveId(id) {
    try { localStorage.setItem(ACTIVE_KEY, id); } catch (e) {}
  }
  function getActiveProfile() {
    var id = getActiveId();
    return listProfiles().find(function (p) { return p.id === id; }) || null;
  }

  /* Progress summary for the profile picker, without loading the whole state. */
  function profileSummary(id) {
    var st = readJSON(STATE_PREFIX + id, null);
    if (!st || !st.levels) return { mastered: 0, total: 0, points: 0, placed: false };
    var ids = Object.keys(st.levels);
    return {
      mastered: ids.filter(function (k) { return st.levels[k].masteredAt; }).length,
      total: ids.length,
      points: st.points || 0,
      placed: !!st.diagnosticDone
    };
  }

  /* One-time move of pre-profiles progress into a profile so nothing is lost. */
  function migrateLegacy() {
    if (listProfiles().length) return;
    var legacy = readJSON(LEGACY_KEY, null);
    if (!legacy || !legacy.levels) return;
    var profile = createProfile(legacy.studentName || 'Meital');
    legacy.studentName = profile.name;
    writeJSON(STATE_PREFIX + profile.id, legacy);
    try { localStorage.removeItem(LEGACY_KEY); } catch (e) {}
  }

  // ---------- state for the active profile ----------
  function load() {
    var id = getActiveId();
    if (!id) return null;
    var profile = getActiveProfile();
    if (!profile) return null;
    var state = readJSON(STATE_PREFIX + id, null);
    if (!state) state = createDefaultState(profile.name);

    var def = createDefaultState(profile.name);
    if (!state.levels) state.levels = def.levels;
    Object.keys(def.levels).forEach(function (lid) {
      if (!state.levels[lid]) state.levels[lid] = blankLevel();
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
    state.studentName = profile.name;
    return state;
  }

  function save(state) {
    var id = getActiveId();
    if (!id) return;
    writeJSON(STATE_PREFIX + id, state);
  }

  /* Reset just the active learner's progress (keeps the profile itself). */
  function reset() {
    var profile = getActiveProfile();
    var fresh = createDefaultState(profile ? profile.name : 'Learner');
    save(fresh);
    return fresh;
  }

  root.App = root.App || {};
  root.App.Storage = {
    todayStr: todayStr,
    createDefaultState: createDefaultState,
    listProfiles: listProfiles,
    createProfile: createProfile,
    renameProfile: renameProfile,
    deleteProfile: deleteProfile,
    getActiveId: getActiveId,
    setActiveId: setActiveId,
    getActiveProfile: getActiveProfile,
    profileSummary: profileSummary,
    migrateLegacy: migrateLegacy,
    load: load,
    save: save,
    reset: reset
  };
})(typeof window !== 'undefined' ? window : global);
