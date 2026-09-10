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
    'my dog ate a waffle',
    'the goose stole my sandwich',
    'a squid is driving the bus',
    'never trust a sneaky penguin',
    'my sock has a secret plan',
    'the cat is judging you',
    'bananas do not have knees',
    'a dragon lives in my backpack',
    'the pickle wants to be famous',
    'my homework was eaten by a robot',
    'sixty six slimy snails',
    'a wizard sneezed on the pizza',
    'the moon smells like toast',
    'quiet frogs make the best spies',
    'my brother is part gremlin'
  ];

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
  var STAGES = [
    { id: 't1', name: 'Home Base: F and J', keys: ['f', 'j'], blurb: 'Feel the little bumps on F and J — those are your anchors. Your index fingers live there.' },
    { id: 't2', name: 'D and K', keys: ['d', 'k'], blurb: 'Middle fingers, right next door to F and J.' },
    { id: 't3', name: 'S and L', keys: ['s', 'l'], blurb: 'Ring fingers. Keep those index fingers on the bumps!' },
    { id: 't4', name: 'A and Semicolon', keys: ['a', ';'], blurb: 'Pinkies! The whole home row is yours now.' },
    { id: 't5', name: 'The Whole Home Row', keys: [], review: true, blurb: 'All eight home keys together. This is the position your hands always come back to.' },
    { id: 't6', name: 'G and H', keys: ['g', 'h'], blurb: 'Index fingers stretch inward — then snap straight back to F and J.' },
    { id: 't7', name: 'E and I', keys: ['e', 'i'], blurb: 'Reaching UP with your middle fingers. Two of the most common letters in English.' },
    { id: 't8', name: 'R and U', keys: ['r', 'u'], blurb: 'Index fingers reach up. Now real words start appearing.' },
    { id: 't9', name: 'T and Y', keys: ['t', 'y'], blurb: 'The big index-finger stretch across the middle.' },
    { id: 't10', name: 'W and O', keys: ['w', 'o'], blurb: 'Ring fingers reach up.' },
    { id: 't11', name: 'Q and P', keys: ['q', 'p'], blurb: 'Pinkies up top. The trickiest reach — take it slow.' },
    { id: 't12', name: 'Top Row Complete', keys: [], review: true, blurb: 'Everything from Q to P, plus the home row.' },
    { id: 't13', name: 'C and Comma', keys: ['c', ','], blurb: 'Now we go DOWN. Middle fingers dip below home.' },
    { id: 't14', name: 'V and M', keys: ['v', 'm'], blurb: 'Index fingers down.' },
    { id: 't15', name: 'X and Period', keys: ['x', '.'], blurb: 'Ring fingers down.' },
    { id: 't16', name: 'Z and Slash', keys: ['z', '/'], blurb: 'Pinkies down. Z is rare — but you need it for pizza and puzzles.' },
    { id: 't17', name: 'B and N', keys: ['b', 'n'], blurb: 'The last two! Big index stretches.' },
    { id: 't18', name: 'The Whole Keyboard', keys: [], review: true, phrases: true, blurb: 'Every letter. Real sentences now — and they get silly.' },
    { id: 't19', name: 'Speed Run', keys: [], review: true, phrases: true, speed: true, blurb: 'You know every key. NOW we care about speed — accuracy first, always.' }
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
    STAGES: STAGES,
    drillText: drillText,
    renderKeyboard: renderKeyboard,
    renderHands: renderHands,
    fingerFor: fingerFor,
    FUNNY_PHRASES: FUNNY_PHRASES
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.App.Typing;
})(typeof window !== 'undefined' ? window : global);
