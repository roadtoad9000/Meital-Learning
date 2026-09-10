/* Typing tutor.

   Built on the standard evidence-based keyboarding principles:
   1. ACCURACY BEFORE SPEED. Errors practised become permanent motor habits, so
      early levels have no timer at all and advancement is gated on accuracy only.
   2. Home-row anchoring, then a few new keys at a time (low cognitive load).
   3. One finger owns each key — taught with consistent colour coding.
   4. Real words as early as the learned key set allows, because drilling
      nonsense letters kills motivation fast.
   5. Per-key accuracy tracking, so practice targets the keys actually being
      missed rather than repeating what's already solid.

   For students with learning disabilities specifically: large targets, high
   contrast, multisensory cues (see the key + see the finger + feel the press),
   no time pressure while learning, very short levels, and frequent visible wins. */
(function (root) {

  /* Standard finger assignment. Colour is how the learner links key -> finger. */
  var FINGERS = {
    lp: { name: 'Left pinky', color: '#ef476f', hand: 'L', slot: 0 },
    lr: { name: 'Left ring', color: '#f78c6b', hand: 'L', slot: 1 },
    lm: { name: 'Left middle', color: '#ffd166', hand: 'L', slot: 2 },
    li: { name: 'Left index', color: '#06d6a0', hand: 'L', slot: 3 },
    ri: { name: 'Right index', color: '#118ab2', hand: 'R', slot: 3 },
    rm: { name: 'Right middle', color: '#7c5cff', hand: 'R', slot: 2 },
    rr: { name: 'Right ring', color: '#b56bff', hand: 'R', slot: 1 },
    rp: { name: 'Right pinky', color: '#ff6b9d', hand: 'R', slot: 0 },
    th: { name: 'Thumb', color: '#8d99ae', hand: 'B', slot: 4 }
  };

  var KEY_FINGER = {
    '`': 'lp', '1': 'lp', '2': 'lr', '3': 'lm', '4': 'li', '5': 'li',
    '6': 'ri', '7': 'ri', '8': 'rm', '9': 'rr', '0': 'rp', '-': 'rp', '=': 'rp',
    q: 'lp', w: 'lr', e: 'lm', r: 'li', t: 'li', y: 'ri', u: 'ri', i: 'rm', o: 'rr', p: 'rp',
    a: 'lp', s: 'lr', d: 'lm', f: 'li', g: 'li', h: 'ri', j: 'ri', k: 'rm', l: 'rr', ';': 'rp', "'": 'rp',
    z: 'lp', x: 'lr', c: 'lm', v: 'li', b: 'li', n: 'ri', m: 'ri', ',': 'rm', '.': 'rr', '/': 'rp',
    ' ': 'th'
  };

  var ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
  ];
  var HOME_KEYS = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];
  var ALL_KEYS = ROWS[0].concat(ROWS[1], ROWS[2], [' ']);

  /* ---------- word banks, filtered by which keys are known ---------- */
  var WORD_BANK = [
    'a', 'as', 'ask', 'add', 'all', 'fall', 'lad', 'dad', 'sad', 'salad', 'flask', 'glass',
    'jak', 'lass', 'flag', 'half', 'hall', 'shall', 'gash', 'dash', 'lash',
    'the', 'she', 'her', 'here', 'there', 'these', 'tree', 'free', 'feet', 'fresh',
    'this', 'that', 'thus', 'is', 'it', 'if', 'fit', 'sit', 'kit', 'lit', 'jet', 'set',
    'red', 'rest', 'fast', 'last', 'list', 'least', 'ideal', 'field', 'shield',
    'we', 'were', 'was', 'saw', 'draw', 'straw', 'sweet', 'water', 'toaster',
    'you', 'your', 'out', 'our', 'four', 'hour', 'route', 'shout', 'about',
    'good', 'goose', 'loose', 'goofy', 'igloo', 'doodle', 'noodle', 'poodle',
    'quiet', 'quite', 'quiz', 'squid', 'squishy', 'aquarium',
    'cat', 'cave', 'vine', 'move', 'cover', 'clever', 'volcano',
    'zebra', 'pizza', 'buzz', 'fizzy', 'jazz', 'puzzle', 'dizzy',
    'box', 'fox', 'mix', 'next', 'exit', 'extra', 'sixty',
    'jump', 'bump', 'lumpy', 'bunny', 'funny', 'money', 'monkey',
    'banana', 'noodles', 'pancake', 'dragon', 'wizard', 'rocket', 'planet',
    'slime', 'goblin', 'gremlin', 'waffle', 'pickle', 'muffin', 'penguin'
  ];

  /* Deliberately silly. Humour is the point: these are the reward for
     getting far enough to unlock the letters. */
  var FUNNY_PHRASES = [
    // soccer — the safest universal obsession
    'messi scored from the halfway line',
    'the goalie dived the wrong way again',
    'we won on penalties somehow',
    'mbappe is faster than my bus',
    'my team lost and i am not okay',
    'that was a red card and you know it',
    'he juggled the ball forty times',
    // food
    'extra hummus on my falafel please',
    'the pizza was bigger than my head',
    'who ate the last bagel',
    'my sandwich fell butter side down',
    'i put too much hot sauce on it',
    'sufganiyot taste better warm',
    'someone finished the shabbat cake',
    'my mom makes the best matzah ball soup',
    // school life
    'the fire drill was during my test',
    'we had a substitute again',
    'a snow day would be nice right now',
    'i left my homework in my locker',
    'the class hamster escaped again',
    'gym class was dodgeball and i hid',
    'my pencil broke three times today',
    'the bus was late and it was raining',
    // holidays and home, warm not preachy
    'my afikomen hiding spot was genius',
    'purim costumes get wilder every year',
    'we sang way too loud at dinner',
    'my little brother won the dreidel game',
    // games and general silliness
    'i built a whole castle in minecraft',
    'my brother deleted my save file',
    'my dog ate a waffle',
    'the goose stole my sandwich',
    'a squid is driving the bus',
    'never trust a sneaky penguin',
    'the cat is judging you right now',
    'bananas do not have knees',
    'a dragon lives in my backpack',
    'my homework was eaten by a robot',
    'the moon smells like toast',
    'quiet frogs make the best spies',
    'my squishy collection is out of control'
  ];

  /* Placement texts. Each is a pangram, so one pass exercises every letter and
     we get a real per-key accuracy read in about a minute. */
  var PLACEMENT_TEXTS = [
    'jumpy frogs vex a quizzical goalkeeper watching the big derby.',
    'wizards quickly vexed the jumpy goalie by faxing him a pizza.',
    'vexed by a quiz, jack gulped six enormous pizzas with extra falafel.',
    'my brave dog quickly axed the plan by jumping into six frozen waves.',
    'quick messi zigzags past six brave defenders, then jabs a lovely winning goal.',
    'zany kids quickly jog past five brown mules munching extra waffles.'
  ];

  function placementText() {
    return PLACEMENT_TEXTS[Math.floor(Math.random() * PLACEMENT_TEXTS.length)];
  }

  /* Given per-key accuracy from a placement run, decide which stages the learner
     has already demonstrated. A stage counts as known when every key it teaches
     was typed accurately enough. Mirrors the math placement: skip what they can
     already do, teach what they can't. */
  function stagesPassedFrom(keyStats, minAccuracy) {
    minAccuracy = minAccuracy === undefined ? 0.9 : minAccuracy;
    var passed = {};
    for (var i = 0; i < STAGES.length; i++) {
      var st = STAGES[i];
      if (st.speed) break;                      // never auto-pass the speed level
      var keys = st.keys.length ? st.keys : st.learned;
      // Only judge keys the placement text actually exercised. Rare keys like ; and /
      // never show up in a sentence, so treating them as failures would stall the
      // whole ladder for a learner who types fluently.
      var judged = keys.filter(function (k) { return keyStats[k] && keyStats[k].total > 0; });
      if (!judged.length) break;                 // nothing to go on — stop here
      var ok = judged.every(function (k) {
        return (keyStats[k].correct / keyStats[k].total) >= minAccuracy;
      });
      if (!ok) break;                            // stop at the first gap: it's a ladder
      passed[st.id] = true;
    }
    return passed;
  }

  function keysKnown(learned, word) {
    for (var i = 0; i < word.length; i++) {
      if (word[i] === ' ') continue;
      if (learned.indexOf(word[i]) === -1) return false;
    }
    return true;
  }

  function wordsFor(learnedKeys, count, allowPhrases) {
    var pool = WORD_BANK.filter(function (w) { return w.length > 1 && keysKnown(learnedKeys, w); });
    if (allowPhrases) {
      var phrases = FUNNY_PHRASES.filter(function (p) { return keysKnown(learnedKeys, p); });
      if (phrases.length) return [phrases[Math.floor(Math.random() * phrases.length)]];
    }
    if (!pool.length) return null;
    var out = [];
    for (var i = 0; i < count; i++) out.push(pool[Math.floor(Math.random() * pool.length)]);
    return out;
  }

  /* ---------- the lesson ladder ----------
     Each stage adds only a couple of keys. `drill` builds the target text from
     whatever the learner knows so far. */
  var BRANCHES = [
    { id: 'home', name: 'Home Row', emoji: '🏠', blurb: 'Where your fingers live. Everything else is measured from here.' },
    { id: 'top', name: 'Top Row', emoji: '⬆️', blurb: 'Reaching up — and snapping back to home.' },
    { id: 'bottom', name: 'Bottom Row', emoji: '⬇️', blurb: 'Reaching down. The last stretch.' },
    { id: 'mastery', name: 'Whole Keyboard', emoji: '🏆', blurb: 'Everything together, then speed.' }
  ];

  var STAGES = [
    { id: 't1', branch: 'home', name: 'Home Base: F and J', keys: ['f', 'j'], blurb: 'Feel the little bumps on F and J — those are your anchors. Your index fingers live there.' },
    { id: 't2', branch: 'home', name: 'D and K', keys: ['d', 'k'], blurb: 'Middle fingers, right next door to F and J.' },
    { id: 't3', branch: 'home', name: 'S and L', keys: ['s', 'l'], blurb: 'Ring fingers. Keep those index fingers on the bumps!' },
    { id: 't4', branch: 'home', name: 'A and Semicolon', keys: ['a', ';'], blurb: 'Pinkies! The whole home row is yours now.' },
    { id: 't5', branch: 'home', name: 'The Whole Home Row', keys: [], review: true, blurb: 'All eight home keys together. This is the position your hands always come back to.' },
    { id: 't6', branch: 'top', name: 'G and H', keys: ['g', 'h'], blurb: 'Index fingers stretch inward — then snap straight back to F and J.' },
    { id: 't7', branch: 'top', name: 'E and I', keys: ['e', 'i'], blurb: 'Reaching UP with your middle fingers. Two of the most common letters in English.' },
    { id: 't8', branch: 'top', name: 'R and U', keys: ['r', 'u'], blurb: 'Index fingers reach up. Now real words start appearing.' },
    { id: 't9', branch: 'top', name: 'T and Y', keys: ['t', 'y'], blurb: 'The big index-finger stretch across the middle.' },
    { id: 't10', branch: 'top', name: 'W and O', keys: ['w', 'o'], blurb: 'Ring fingers reach up.' },
    { id: 't11', branch: 'top', name: 'Q and P', keys: ['q', 'p'], blurb: 'Pinkies up top. The trickiest reach — take it slow.' },
    { id: 't12', branch: 'top', name: 'Top Row Complete', keys: [], review: true, blurb: 'Everything from Q to P, plus the home row.' },
    { id: 't13', branch: 'bottom', name: 'C and Comma', keys: ['c', ','], blurb: 'Now we go DOWN. Middle fingers dip below home.' },
    { id: 't14', branch: 'bottom', name: 'V and M', keys: ['v', 'm'], blurb: 'Index fingers down.' },
    { id: 't15', branch: 'bottom', name: 'X and Period', keys: ['x', '.'], blurb: 'Ring fingers down.' },
    { id: 't16', branch: 'bottom', name: 'Z and Slash', keys: ['z', '/'], blurb: 'Pinkies down. Z is rare — but you need it for pizza and puzzles.' },
    { id: 't17', branch: 'bottom', name: 'B and N', keys: ['b', 'n'], blurb: 'The last two! Big index stretches.' },
    { id: 't18', branch: 'mastery', name: 'The Whole Keyboard', keys: [], review: true, phrases: true, blurb: 'Every letter. Real sentences now — and they get silly.' },
    { id: 't19', branch: 'mastery', name: 'Speed Run', keys: [], review: true, phrases: true, speed: true, blurb: 'You know every key. NOW we care about speed — accuracy first, always.' }
  ];

  // cumulative key knowledge at each stage
  var cum = [];
  STAGES.forEach(function (st, i) {
    cum = cum.concat(st.keys);
    st.learned = (i === 0 ? [] : []).concat(cum);
    st.index = i;
  });

  /* Build the text for one drill round. Early stages use letter patterns
     (there simply aren't words yet); later stages use real words, then phrases. */
  function drillText(stage, weakKeys) {
    var learned = stage.learned;
    if (stage.phrases) {
      var p = wordsFor(learned, 1, true);
      if (p) return p[0];
    }
    var words = wordsFor(learned, stage.review ? 8 : 6, false);
    if (words && (stage.review || learned.length >= 8)) return words.join(' ');

    // letter-pattern drill, weighted toward the new keys and any weak ones
    var focus = (stage.keys.length ? stage.keys : learned).slice();
    if (weakKeys && weakKeys.length) focus = focus.concat(weakKeys.filter(function (k) { return learned.indexOf(k) !== -1; }));
    var groups = [];
    for (var i = 0; i < 7; i++) {
      var g = '';
      for (var j = 0; j < 4; j++) {
        var pool = Math.random() < 0.7 ? focus : learned;
        g += pool[Math.floor(Math.random() * pool.length)];
      }
      groups.push(g);
    }
    return groups.join(' ');
  }

  /* ---------- visual keyboard ---------- */
  function renderKeyboard(opts) {
    opts = opts || {};
    var next = (opts.nextKey || '').toLowerCase();
    var learned = opts.learned || [];
    var accuracy = opts.accuracy || {};
    var html = '<div class="kb">';
    ROWS.forEach(function (row, ri) {
      html += '<div class="kb-row kb-row-' + ri + '">';
      row.forEach(function (k) {
        var fid = KEY_FINGER[k];
        var f = FINGERS[fid];
        var isNew = (opts.newKeys || []).indexOf(k) !== -1;
        var isKnown = learned.indexOf(k) !== -1;
        var isNext = k === next;
        var cls = 'kb-key';
        if (isNext) cls += ' next';
        if (isNew) cls += ' fresh';
        if (!isKnown && !isNew) cls += ' dim';
        if (HOME_KEYS.indexOf(k) !== -1) cls += ' home';
        var acc = accuracy[k];
        var style = 'border-bottom-color:' + f.color + ';';
        if (isNext || isNew) style += 'background:' + f.color + '22;';
        if (opts.heat && acc && acc.total >= 3) {
          var rate = acc.correct / acc.total;
          var hue = Math.round(rate * 120); // red -> green
          style += 'background:hsl(' + hue + ',70%,' + (opts.dark ? '28%' : '85%') + ');';
        }
        html += '<div class="' + cls + '" data-key="' + k + '" style="' + style + '">' + (k === ';' ? ';' : k) + '</div>';
      });
      html += '</div>';
    });
    html += '<div class="kb-row"><div class="kb-key kb-space' + (next === ' ' ? ' next' : '') + '" data-key=" ">space</div></div>';
    html += '</div>';
    return html;
  }

  /* Hands diagram: shows WHICH finger to use, colour-matched to the keyboard. */
  function renderHands(activeFinger) {
    function hand(side) {
      var slots = side === 'L' ? ['lp', 'lr', 'lm', 'li'] : ['ri', 'rm', 'rr', 'rp'];
      var h = '<div class="hand">';
      slots.forEach(function (fid) {
        var f = FINGERS[fid];
        var on = fid === activeFinger;
        h += '<div class="finger' + (on ? ' on' : '') + '" style="' + (on ? 'background:' + f.color + ';' : 'border-color:' + f.color + ';') + '"></div>';
      });
      h += '<div class="hand-label">' + (side === 'L' ? 'Left' : 'Right') + '</div></div>';
      return h;
    }
    var label = activeFinger && FINGERS[activeFinger] ? FINGERS[activeFinger].name : '';
    return '<div class="hands">' + hand('L') + hand('R') + '</div>' +
      (label ? '<div class="finger-callout" style="color:' + FINGERS[activeFinger].color + '">Use your <strong>' + label + '</strong></div>' : '');
  }

  function fingerFor(ch) { return KEY_FINGER[(ch || '').toLowerCase()] || null; }

  root.App = root.App || {};
  root.App.Typing = {
    FINGERS: FINGERS,
    KEY_FINGER: KEY_FINGER,
    ROWS: ROWS,
    HOME_KEYS: HOME_KEYS,
    ALL_KEYS: ALL_KEYS,
    STAGES: STAGES,
    BRANCHES: BRANCHES,
    PLACEMENT_TEXTS: PLACEMENT_TEXTS,
    placementText: placementText,
    stagesPassedFrom: stagesPassedFrom,
    drillText: drillText,
    renderKeyboard: renderKeyboard,
    renderHands: renderHands,
    fingerFor: fingerFor,
    FUNNY_PHRASES: FUNNY_PHRASES
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.App.Typing;
})(typeof window !== 'undefined' ? window : global);
