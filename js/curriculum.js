/* Curriculum: a prerequisite ladder spanning grades 4-7.
   Each level TEACHES first (idea + method + worked examples), then practices to mastery.
   Levels are chained within a strand: you can't advance until the one below is mastered,
   and the diagnostic walks DOWN a chain to find where a student's real knowledge ends. */
(function (root) {
  var PI = 3.14;
  var V = root.App.Visuals;

  // ---------- shared helpers ----------
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randNonzero(min, max) { var v = 0; while (v === 0) v = randInt(min, max); return v; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function round2(x) { return Math.round(x * 100) / 100; }
  function money(x) { return round2(x).toFixed(2); }
  function fracStr(n, d) { if (d < 0) { n = -n; d = -d; } return n + '/' + d; }
  function simplifyFrac(n, d) { if (d < 0) { n = -n; d = -d; } var g = gcd(n, d); return [n / g, d / g]; }
  function makeMC(correctText, wrongTexts) {
    var seen = {}, wrong = [];
    wrongTexts.forEach(function (t) { if (t !== correctText && !seen[t]) { seen[t] = true; wrong.push(t); } });
    var pad = 1;
    while (wrong.length < 3) { var f = String(correctText) + ' '.repeat(pad++); if (!seen[f]) { seen[f] = true; wrong.push(f); } }
    var items = shuffle([{ t: correctText, c: true }].concat(wrong.slice(0, 3).map(function (t) { return { t: t, c: false }; })));
    return { choices: items.map(function (i) { return i.t; }), answer: items.findIndex(function (i) { return i.c; }), type: 'mc' };
  }
  function num(prompt, answer, explanation, tolerance) {
    return { prompt: prompt, answer: answer, explanation: explanation, tolerance: tolerance || 0.01, type: 'numeric' };
  }

  var STRANDS = [
    { id: 'WN', name: 'Whole Numbers', emoji: '🔟', color: '#f4a261' },
    { id: 'FD', name: 'Fractions & Decimals', emoji: '🍕', color: '#e76f51' },
    { id: 'IN', name: 'Negative Numbers', emoji: '🌡️', color: '#00b8d9' },
    { id: 'RP', name: 'Ratios & Percents', emoji: '⚖️', color: '#ff6b6b' },
    { id: 'EE', name: 'Expressions & Equations', emoji: '🧮', color: '#ffa62b' },
    { id: 'GM', name: 'Geometry', emoji: '📐', color: '#6c5ce7' },
    { id: 'SP', name: 'Data & Probability', emoji: '🎲', color: '#00b894' }
  ];

  // ================= WHOLE NUMBERS =================
  var LEVELS = [
    {
      id: 'wn_1', strand: 'WN', grade: 4, name: 'Multi-Digit Multiplication',
      lesson: {
        idea: 'Big multiplication is just small multiplication done in pieces. You break one number apart, multiply each piece, then add the pieces back together.',
        steps: [
          'Break the bottom number into tens and ones.',
          'Multiply the top number by the ones.',
          'Multiply the top number by the tens.',
          'Add the two results together.'
        ],
        examples: [{
          problem: '34 × 6',
          steps: ['Break 34 into 30 and 4.', '6 × 4 = 24', '6 × 30 = 180', '180 + 24 = 204'],
          answer: '204'
        }]
      },
      gen: function () {
        var a = randInt(12, 89), b = randInt(3, 9);
        var tens = Math.floor(a / 10) * 10, ones = a % 10;
        var qmul = num(a + ' × ' + b + ' = ?', a * b,
          'Break ' + a + ' into ' + tens + ' + ' + ones + '. ' + b + ' × ' + ones + ' = ' + (b * ones) + ', and ' + b + ' × ' + tens + ' = ' + (b * tens) + '. Add: ' + (b * tens) + ' + ' + (b * ones) + ' = ' + (a * b) + '.', 0.001);
        qmul.visual = V.areaModel(a, b, {
          split: [tens, ones],
          leftLabel: String(b * tens),
          rightLabel: String(b * ones),
          caption: 'Split ' + a + ' into ' + tens + ' + ' + ones + ', multiply each piece, then add'
        });
        return qmul;
      }
    },
    {
      id: 'wn_2', strand: 'WN', grade: 5, name: 'Division',
      lesson: {
        idea: 'Division asks "how many groups fit?" If you know your multiplication facts, you already know division — it is the same fact running backwards.',
        steps: [
          'Ask: what number times the divisor gives the dividend?',
          'Check your answer by multiplying it back.'
        ],
        examples: [{
          problem: '96 ÷ 8',
          steps: ['Ask: 8 times what equals 96?', '8 × 10 = 80, which is too small.', '8 × 12 = 96 ✓', 'So 96 ÷ 8 = 12'],
          answer: '12'
        }]
      },
      gen: function () {
        var q = randInt(3, 15), d = randInt(3, 9);
        return num((q * d) + ' ÷ ' + d + ' = ?', q,
          d + ' × ' + q + ' = ' + (q * d) + ', so ' + (q * d) + ' ÷ ' + d + ' = ' + q + '.', 0.001);
      }
    },

    // ================= FRACTIONS & DECIMALS =================
    {
      id: 'fd_1', strand: 'FD', grade: 4, name: 'Equivalent Fractions',
      lesson: {
        idea: 'Two fractions can look different but be worth exactly the same amount. 1/2 and 3/6 are the same size slice of pizza. You get an equivalent fraction by multiplying (or dividing) the top AND bottom by the same number.',
        steps: [
          'Whatever you do to the top, do to the bottom.',
          'To simplify, divide top and bottom by a number that goes into both.'
        ],
        examples: [{
          problem: 'Simplify 8/12',
          steps: ['What number goes into both 8 and 12? 4 does.', '8 ÷ 4 = 2', '12 ÷ 4 = 3', 'So 8/12 = 2/3'],
          answer: '2/3'
        }]
      },
      gen: function () {
        var base = randChoice([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5]]);
        var k = randInt(2, 6);
        var n = base[0] * k, d = base[1] * k;
        var correct = fracStr(base[0], base[1]);
        return Object.assign(makeMC(correct, [fracStr(base[0] + 1, base[1]), fracStr(base[1], base[0]), fracStr(n - 1, d)]), {
          prompt: 'Write ' + fracStr(n, d) + ' in simplest form.',
          visual: V.fractionBars([
            { num: n, den: d, label: fracStr(n, d) },
            { num: base[0], den: base[1], label: fracStr(base[0], base[1]), color: 'var(--viz-fill-b)' }
          ], 'Same amount shaded — just cut into bigger pieces'),
          explanation: 'Both ' + n + ' and ' + d + ' divide by ' + k + '. ' + n + ' ÷ ' + k + ' = ' + base[0] + ' and ' + d + ' ÷ ' + k + ' = ' + base[1] + ', so ' + fracStr(n, d) + ' = ' + correct + '.'
        });
      }
    },
    {
      id: 'fd_2', strand: 'FD', grade: 5, name: 'Adding & Subtracting Fractions',
      lesson: {
        idea: 'You can only add fractions when the pieces are the same size — that means the bottoms (denominators) must match. If they do not match, rename them so they do.',
        steps: [
          'Find a number both denominators divide into (multiplying them always works).',
          'Rewrite each fraction with that new denominator.',
          'Add or subtract only the tops. The bottom stays the same.',
          'Simplify if you can.'
        ],
        examples: [{
          problem: '1/2 + 1/3',
          steps: ['The bottoms are 2 and 3. Both go into 6.', '1/2 = 3/6', '1/3 = 2/6', '3/6 + 2/6 = 5/6'],
          answer: '5/6'
        }]
      },
      gen: function () {
        var d1 = randChoice([2, 3, 4, 5, 6]), d2 = randChoice([2, 3, 4, 5, 6]);
        var n1 = randInt(1, d1 - 1 || 1), n2 = randInt(1, d2 - 1 || 1);
        var rn = n1 * d2 + n2 * d1, rd = d1 * d2;
        var s = simplifyFrac(rn, rd);
        var q = num(fracStr(n1, d1) + ' + ' + fracStr(n2, d2) + ' = ?  (answer as a decimal, rounded to 2 places)',
          round2(s[0] / s[1]),
          'Common denominator is ' + rd + ': ' + fracStr(n1 * d2, rd) + ' + ' + fracStr(n2 * d1, rd) + ' = ' + fracStr(rn, rd) + ' = ' + fracStr(s[0], s[1]) + ' = ' + round2(s[0] / s[1]) + '.', 0.02);
        q.visual = V.fractionBars([
          { num: n1, den: d1, label: fracStr(n1, d1) },
          { num: n2, den: d2, label: fracStr(n2, d2), color: 'var(--viz-fill-b)' }
        ], 'How much is shaded altogether?');
        return q;
      }
    },
    {
      id: 'fd_3', strand: 'FD', grade: 5, name: 'Multiplying Fractions',
      lesson: {
        idea: 'Multiplying fractions is the easy one — no common denominator needed. Just multiply straight across: tops together, bottoms together.',
        steps: ['Multiply the two top numbers.', 'Multiply the two bottom numbers.', 'Simplify if you can.'],
        examples: [{
          problem: '2/3 × 3/4',
          steps: ['Tops: 2 × 3 = 6', 'Bottoms: 3 × 4 = 12', 'So 6/12', 'Simplify: 6/12 = 1/2'],
          answer: '1/2'
        }]
      },
      gen: function () {
        var d1 = randChoice([2, 3, 4, 5, 6]), d2 = randChoice([2, 3, 4, 5, 6]);
        var n1 = randInt(1, d1 - 1 || 1), n2 = randInt(1, d2 - 1 || 1);
        var s = simplifyFrac(n1 * n2, d1 * d2);
        var qm = num(fracStr(n1, d1) + ' × ' + fracStr(n2, d2) + ' = ?  (answer as a decimal, rounded to 2 places)',
          round2(s[0] / s[1]),
          'Straight across: ' + (n1 * n2) + '/' + (d1 * d2) + ' = ' + fracStr(s[0], s[1]) + ' = ' + round2(s[0] / s[1]) + '.', 0.02);
        qm.visual = V.fractionBars([
          { num: n1, den: d1, label: fracStr(n1, d1) },
          { num: n2, den: d2, label: fracStr(n2, d2), color: 'var(--viz-fill-b)' }
        ], 'Taking a part OF a part');
        return qm;
      }
    },
    {
      id: 'fd_4', strand: 'FD', grade: 6, name: 'Dividing Fractions',
      lesson: {
        idea: 'To divide by a fraction, flip the second fraction upside down and multiply instead. Dividing by 1/2 is the same as multiplying by 2 — which is why the answer often gets BIGGER.',
        steps: ['Keep the first fraction.', 'Change ÷ to ×.', 'Flip the second fraction.', 'Multiply straight across and simplify.'],
        examples: [{
          problem: '3/4 ÷ 1/2',
          steps: ['Keep 3/4', 'Change ÷ to ×', 'Flip 1/2 to 2/1', '3/4 × 2/1 = 6/4 = 3/2 = 1.5'],
          answer: '3/2 (or 1.5)'
        }]
      },
      gen: function () {
        var d1 = randChoice([2, 3, 4, 5, 6]), d2 = randChoice([2, 3, 4, 5]);
        var n1 = randInt(1, d1 - 1 || 1), n2 = randInt(1, d2 - 1 || 1);
        var s = simplifyFrac(n1 * d2, d1 * n2);
        var qd = num(fracStr(n1, d1) + ' ÷ ' + fracStr(n2, d2) + ' = ?  (answer as a decimal, rounded to 2 places)',
          round2(s[0] / s[1]),
          'Flip and multiply: ' + fracStr(n1, d1) + ' × ' + fracStr(d2, n2) + ' = ' + fracStr(n1 * d2, d1 * n2) + ' = ' + fracStr(s[0], s[1]) + ' = ' + round2(s[0] / s[1]) + '.', 0.02);
        qd.visual = V.fractionBars([
          { num: n1, den: d1, label: 'we have ' + fracStr(n1, d1) },
          { num: n2, den: d2, label: 'in chunks of ' + fracStr(n2, d2), color: 'var(--viz-fill-b)' }
        ], 'How many chunks fit?');
        return qd;
      }
    },
    {
      id: 'fd_5', strand: 'FD', grade: 6, name: 'Decimal Operations',
      lesson: {
        idea: 'Decimals are just fractions in disguise. The trick is keeping the decimal point lined up when adding, and counting decimal places when multiplying.',
        steps: [
          'Adding/subtracting: line up the decimal points, then add normally.',
          'Multiplying: ignore the points, multiply, then count how many decimal places were in the problem and put that many in the answer.'
        ],
        examples: [{
          problem: '0.4 × 0.3',
          steps: ['Ignore the points: 4 × 3 = 12', 'Count decimal places in the problem: 0.4 has 1, 0.3 has 1, so 2 total', 'Put 2 decimal places in the answer: 0.12'],
          answer: '0.12'
        }]
      },
      gen: function () {
        if (Math.random() < 0.5) {
          var a = round2(randInt(10, 900) / 10), b = round2(randInt(10, 900) / 10);
          return num(a + ' + ' + b + ' = ?', round2(a + b), 'Line up the decimal points: ' + a + ' + ' + b + ' = ' + round2(a + b) + '.', 0.02);
        }
        var c = round2(randInt(2, 9) / 10), d = round2(randInt(2, 9) / 10);
        return num(c + ' × ' + d + ' = ?', round2(c * d),
          Math.round(c * 10) + ' × ' + Math.round(d * 10) + ' = ' + Math.round(c * 10) * Math.round(d * 10) + ', and there are 2 decimal places, so ' + round2(c * d) + '.', 0.005);
      }
    },
    {
      id: 'fd_6', strand: 'FD', grade: 7, name: 'Negative Fractions & Decimals',
      lesson: {
        idea: 'Everything you know about fractions still works when negatives show up. Do the fraction arithmetic first, then figure out the sign at the end.',
        steps: [
          'Handle the numbers as if they were all positive.',
          'Then apply the sign rules: same signs multiply/divide to positive, different signs to negative.',
          'For adding, a negative pulls the answer down the number line.'
        ],
        examples: [{
          problem: '-1/2 × 2/3',
          steps: ['Ignore signs: 1/2 × 2/3 = 2/6 = 1/3', 'Signs are different (one negative), so the answer is negative', 'Answer: -1/3 ≈ -0.33'],
          answer: '-1/3'
        }]
      },
      gen: function () {
        var d1 = randChoice([2, 3, 4, 5]), d2 = randChoice([2, 3, 4, 5]);
        var n1 = randInt(1, d1 - 1 || 1) * (Math.random() < 0.6 ? -1 : 1);
        var n2 = randInt(1, d2 - 1 || 1) * (Math.random() < 0.5 ? -1 : 1);
        var op = randChoice(['+', '×']);
        var rn, rd;
        if (op === '+') { rn = n1 * d2 + n2 * d1; rd = d1 * d2; } else { rn = n1 * n2; rd = d1 * d2; }
        var s = simplifyFrac(rn, rd);
        return num(fracStr(n1, d1) + ' ' + op + ' ' + fracStr(n2, d2) + ' = ?  (answer as a decimal, rounded to 2 places)',
          round2(s[0] / s[1]),
          'Result is ' + fracStr(s[0], s[1]) + ' = ' + round2(s[0] / s[1]) + '.', 0.02);
      }
    },

    // ================= NEGATIVE NUMBERS =================
    {
      id: 'in_1', strand: 'IN', grade: 6, name: 'Negative Numbers & Absolute Value',
      lesson: {
        idea: 'Negative numbers live to the LEFT of zero on the number line — like temperatures below freezing or money you owe. Absolute value just asks "how far from zero?", and distance is never negative.',
        steps: [
          'Further left = smaller. So -8 is SMALLER than -2.',
          'Absolute value |x| strips the sign off: |-7| = 7.'
        ],
        examples: [{
          problem: 'What is |-7|?',
          steps: ['Absolute value asks: how far is -7 from zero?', 'It is 7 steps away.', 'Distance is never negative, so the answer is 7.'],
          answer: '7'
        }]
      },
      gen: function () {
        if (Math.random() < 0.5) {
          var a = randNonzero(-15, 15);
          var qa = num('What is |' + a + '|?', Math.abs(a), '|' + a + '| is the distance from 0, which is ' + Math.abs(a) + '.', 0.001);
          qa.visual = V.numberLine(Math.min(a, 0) - 2, Math.max(a, 0) + 2, {
            points: [{ at: a, label: String(a) }],
            jump: { from: 0, to: a, label: 'how far from 0?' }
          });
          return qa;
        }
        var p = randInt(-12, -1), q = randInt(-12, -1);
        while (q === p) q = randInt(-12, -1);
        var bigger = Math.max(p, q);
        return Object.assign(makeMC(String(bigger), [String(Math.min(p, q)), 'They are equal', '0']), {
          prompt: 'Which number is GREATER: ' + p + ' or ' + q + '?',
          explanation: 'On a number line, the number further right is greater. ' + bigger + ' is to the right of ' + Math.min(p, q) + ', so ' + bigger + ' is greater.'
        });
      }
    },
    {
      id: 'in_2', strand: 'IN', grade: 7, name: 'Adding & Subtracting Integers',
      lesson: {
        idea: 'Think of it as moving on a number line. Adding a positive moves right; adding a negative moves left. And subtracting is the same as adding the opposite.',
        steps: [
          'Rewrite subtraction as "add the opposite": 5 - (-3) becomes 5 + 3.',
          'Same signs? Add the amounts and keep the sign.',
          'Different signs? Subtract the smaller from the larger and keep the sign of the bigger one.'
        ],
        examples: [{
          problem: '-8 + 3',
          steps: ['Signs are different, so subtract: 8 - 3 = 5', '8 is bigger than 3, and 8 was negative', 'So the answer is negative: -5'],
          answer: '-5'
        }, {
          problem: '4 - (-6)',
          steps: ['Subtracting a negative = adding the opposite', '4 - (-6) becomes 4 + 6', '4 + 6 = 10'],
          answer: '10'
        }]
      },
      gen: function () {
        var a = randInt(-20, 20), b = randInt(-20, 20), op = randChoice(['+', '-']);
        var ans = op === '+' ? a + b : a - b;
        var qi = num(a + ' ' + op + ' (' + b + ') = ?', ans,
          (op === '-' ? 'Subtracting ' + b + ' is the same as adding ' + (-b) + '. ' : '') + a + ' ' + op + ' (' + b + ') = ' + ans + '.', 0.001);
        var lo = Math.min(a, ans, 0) - 3, hi = Math.max(a, ans, 0) + 3;
        qi.visual = V.numberLine(lo, hi, {
          points: [{ at: a, label: 'start' }],
          jump: { from: a, to: ans, label: (ans >= a ? 'move right' : 'move left') },
          caption: 'Start at ' + a + ', then move along the line'
        });
        return qi;
      }
    },
    {
      id: 'in_3', strand: 'IN', grade: 7, name: 'Multiplying & Dividing Integers',
      lesson: {
        idea: 'The signs follow one simple rule: if the two signs MATCH, the answer is positive. If they are DIFFERENT, the answer is negative. That is it.',
        steps: [
          'Multiply or divide the numbers, ignoring signs.',
          'Count the negatives: an even number of negatives → positive; an odd number → negative.'
        ],
        examples: [{
          problem: '-6 × (-4)',
          steps: ['Ignore signs: 6 × 4 = 24', 'Two negatives — signs match', 'Matching signs give a positive answer: 24'],
          answer: '24'
        }]
      },
      gen: function () {
        var a = randNonzero(-12, 12), b = randNonzero(-12, 12);
        if (Math.random() < 0.5) {
          return num(a + ' × (' + b + ') = ?', a * b,
            'Ignoring signs, ' + Math.abs(a) + ' × ' + Math.abs(b) + ' = ' + Math.abs(a * b) + '. Signs ' + ((a < 0) === (b < 0) ? 'match, so the answer is positive' : 'differ, so the answer is negative') + ': ' + (a * b) + '.', 0.001);
        }
        return num((a * b) + ' ÷ (' + b + ') = ?', a,
          'Ignoring signs, ' + Math.abs(a * b) + ' ÷ ' + Math.abs(b) + ' = ' + Math.abs(a) + '. Signs ' + ((a * b < 0) === (b < 0) ? 'match, so positive' : 'differ, so negative') + ': ' + a + '.', 0.001);
      }
    },

    // ================= RATIOS & PERCENTS =================
    {
      id: 'rp_1', strand: 'RP', grade: 6, name: 'Ratios & Equivalent Ratios',
      lesson: {
        idea: 'A ratio compares two amounts. If a recipe uses 2 cups of flour for every 3 cookies, then doubling the cookies means doubling the flour — the ratio stays the same as long as you scale BOTH numbers by the same amount.',
        steps: ['Find what you multiply the first amount by to get the new one.', 'Multiply the other amount by that same number.'],
        examples: [{
          problem: '2 cups makes 3 cookies. How many cups for 9 cookies?',
          steps: ['3 cookies → 9 cookies means × 3', 'Do the same to the cups: 2 × 3 = 6', 'So 6 cups'],
          answer: '6 cups'
        }]
      },
      gen: function () {
        var a = randInt(2, 6), b = randInt(2, 6), k = randInt(2, 5);
        return num(a + ' cups of flour makes ' + b + ' batches. At the same ratio, how many cups make ' + (b * k) + ' batches?',
          a * k, b + ' × ' + k + ' = ' + (b * k) + ', so multiply the cups by ' + k + ' too: ' + a + ' × ' + k + ' = ' + (a * k) + ' cups.', 0.01);
      }
    },
    {
      id: 'rp_2', strand: 'RP', grade: 6, name: 'Unit Rates',
      lesson: {
        idea: 'A unit rate tells you the cost (or speed, or amount) for exactly ONE of something. It is what makes "which is the better deal?" answerable. You get it by dividing.',
        steps: ['Divide the total by how many there are.', 'The answer is the amount "per one".'],
        examples: [{
          problem: '5 notebooks cost $15. What is the price per notebook?',
          steps: ['Divide the total by the number of notebooks', '$15 ÷ 5 = $3', 'So $3 per notebook'],
          answer: '$3 per notebook'
        }]
      },
      gen: function () {
        var each = randInt(2, 12), n = randInt(3, 9);
        return num(n + ' ' + randChoice(['notebooks', 'tickets', 'smoothies', 'markers']) + ' cost $' + (each * n) + ' in total. What is the price for ONE, in dollars?',
          each, '$' + (each * n) + ' ÷ ' + n + ' = $' + each + ' each.', 0.01);
      }
    },
    {
      id: 'rp_3', strand: 'RP', grade: 6, name: 'Percent of a Number',
      lesson: {
        idea: 'Percent means "out of 100". To find a percent of a number, turn the percent into a decimal (slide the point two places left) and multiply.',
        steps: ['Convert the percent to a decimal: 25% → 0.25', 'Multiply it by the number.'],
        examples: [{
          problem: 'What is 25% of 80?',
          steps: ['25% becomes 0.25', '0.25 × 80 = 20', 'So 25% of 80 is 20'],
          answer: '20'
        }]
      },
      gen: function () {
        var pct = randChoice([10, 20, 25, 50, 75, 5]);
        var whole = randChoice([20, 40, 60, 80, 100, 120, 200]);
        var qpc = num('What is ' + pct + '% of ' + whole + '?', round2(whole * pct / 100),
          pct + '% = ' + (pct / 100) + '. ' + (pct / 100) + ' × ' + whole + ' = ' + round2(whole * pct / 100) + '.', 0.01);
        qpc.visual = V.percentBar(pct, { caption: 'The whole bar is ' + whole });
        return qpc;
      }
    },
    {
      id: 'rp_4', strand: 'RP', grade: 7, name: 'Proportional Relationships',
      lesson: {
        idea: 'When two things are proportional, one is always the same multiple of the other. That multiple is called the constant of proportionality, k, and it satisfies y = kx. Find k by dividing y by x.',
        steps: ['Divide y by x to get k.', 'Once you know k, you can find any y: multiply that x by k.'],
        examples: [{
          problem: 'y is proportional to x. When x = 4, y = 10. Find k.',
          steps: ['k = y ÷ x', 'k = 10 ÷ 4', 'k = 2.5'],
          answer: 'k = 2.5'
        }]
      },
      gen: function () {
        var k = randChoice([2, 3, 4, 5, 2.5, 1.5, 0.5]);
        var x = randInt(2, 12);
        return num('y is proportional to x. When x = ' + x + ', y = ' + round2(k * x) + '. What is the constant of proportionality k?',
          k, 'k = y ÷ x = ' + round2(k * x) + ' ÷ ' + x + ' = ' + k + '.', 0.02);
      }
    },
    {
      id: 'rp_5', strand: 'RP', grade: 7, name: 'Percent Applications',
      lesson: {
        idea: 'Tax, tips, discounts and markups are all the same move: find the percent, then either add it on or take it off. A shortcut: 20% off means you PAY 80%.',
        steps: [
          'Find the percent amount (percent as a decimal × the price).',
          'Discount → subtract it. Tax or tip → add it.',
          'Shortcut: 15% tax means multiply by 1.15; 30% off means multiply by 0.70.'
        ],
        examples: [{
          problem: 'A $40 jacket is 25% off. What is the sale price?',
          steps: ['25% of 40 = 0.25 × 40 = 10', 'It is a discount, so subtract: 40 - 10 = 30', 'Or shortcut: 40 × 0.75 = 30'],
          answer: '$30'
        }]
      },
      gen: function () {
        var rate = randChoice([10, 15, 20, 25, 30, 50]);
        var price = randInt(20, 200);
        if (Math.random() < 0.5) {
          return num('A $' + price + ' jacket is ' + rate + '% off. What is the sale price, in dollars?',
            round2(price * (1 - rate / 100)),
            rate + '% of ' + price + ' = ' + round2(price * rate / 100) + '. ' + price + ' - ' + round2(price * rate / 100) + ' = ' + money(price * (1 - rate / 100)) + '.', 0.02);
        }
        return num('A meal costs $' + price + '. You leave a ' + rate + '% tip. What is the TOTAL, in dollars?',
          round2(price * (1 + rate / 100)),
          'Tip = ' + rate + '% of ' + price + ' = ' + round2(price * rate / 100) + '. Total = ' + price + ' + ' + round2(price * rate / 100) + ' = ' + money(price * (1 + rate / 100)) + '.', 0.02);
      }
    },
    {
      id: 'rp_6', strand: 'RP', grade: 7, name: 'Scale Drawings',
      lesson: {
        idea: 'A scale drawing is a real thing shrunk (or blown up) by a fixed factor. The scale tells you how to convert: multiply to go from drawing to real life, divide to go the other way.',
        steps: ['Drawing → real life: multiply by the scale.', 'Real life → drawing: divide by the scale.'],
        examples: [{
          problem: '1 inch = 5 feet. A wall is 3 inches on the drawing. How long is it really?',
          steps: ['Going from drawing to real life, so multiply', '3 × 5 = 15', 'The wall is 15 feet'],
          answer: '15 feet'
        }]
      },
      gen: function () {
        var k = randChoice([2, 3, 4, 5, 8, 10, 12]);
        var d = randInt(2, 15);
        if (Math.random() < 0.5) {
          return num('On a drawing, 1 inch = ' + k + ' feet. A wall is ' + d + ' inches on the drawing. How many FEET is the real wall?',
            k * d, 'Drawing → real life, so multiply: ' + d + ' × ' + k + ' = ' + (k * d) + ' feet.', 0.01);
        }
        return num('On a drawing, 1 inch = ' + k + ' feet. A real wall is ' + (k * d) + ' feet long. How many INCHES is it on the drawing?',
          d, 'Real life → drawing, so divide: ' + (k * d) + ' ÷ ' + k + ' = ' + d + ' inches.', 0.01);
      }
    },

    // ================= EXPRESSIONS & EQUATIONS =================
    {
      id: 'ee_1', strand: 'EE', grade: 5, name: 'Order of Operations',
      lesson: {
        idea: 'When a problem has several operations, everyone has to do them in the same order or we would all get different answers. The order is: Parentheses, Exponents, Multiply/Divide (left to right), Add/Subtract (left to right).',
        steps: ['Parentheses first.', 'Then exponents.', 'Then × and ÷, working left to right.', 'Finally + and -, working left to right.'],
        examples: [{
          problem: '3 + 4 × 2',
          steps: ['No parentheses or exponents.', 'Multiplication comes before addition: 4 × 2 = 8', 'Now add: 3 + 8 = 11', 'Note: 3 + 4 first would give 14 — that is the common mistake.'],
          answer: '11'
        }]
      },
      gen: function () {
        var a = randInt(2, 9), b = randInt(2, 9), c = randInt(2, 9);
        if (Math.random() < 0.5) {
          return num(a + ' + ' + b + ' × ' + c + ' = ?', a + b * c,
            'Multiply first: ' + b + ' × ' + c + ' = ' + (b * c) + '. Then add: ' + a + ' + ' + (b * c) + ' = ' + (a + b * c) + '.', 0.001);
        }
        return num('(' + a + ' + ' + b + ') × ' + c + ' = ?', (a + b) * c,
          'Parentheses first: ' + a + ' + ' + b + ' = ' + (a + b) + '. Then multiply: ' + (a + b) + ' × ' + c + ' = ' + ((a + b) * c) + '.', 0.001);
      }
    },
    {
      id: 'ee_2', strand: 'EE', grade: 6, name: 'Evaluating Expressions',
      lesson: {
        idea: 'A variable like x is just a placeholder for a number. To evaluate an expression, swap the letter for the number you are given, then do the arithmetic in order.',
        steps: ['Replace every variable with its value (use parentheses to stay safe).', 'Do the arithmetic using order of operations.'],
        examples: [{
          problem: 'Evaluate 3x + 5 when x = 4',
          steps: ['Replace x with 4: 3(4) + 5', 'Multiply first: 3 × 4 = 12', 'Add: 12 + 5 = 17'],
          answer: '17'
        }]
      },
      gen: function () {
        var a = randInt(2, 9), b = randInt(1, 15), x = randInt(2, 10);
        return num('Evaluate ' + a + 'x + ' + b + ' when x = ' + x, a * x + b,
          'Replace x with ' + x + ': ' + a + '(' + x + ') + ' + b + ' = ' + (a * x) + ' + ' + b + ' = ' + (a * x + b) + '.', 0.001);
      }
    },
    {
      id: 'ee_3', strand: 'EE', grade: 6, name: 'Combining Like Terms',
      lesson: {
        idea: 'Like terms are terms with the exact same variable part — 3x and 5x are like terms, but 3x and 5 are not. You can only add together things that are the same kind, the same way you cannot add 3 apples and 5 oranges into one number.',
        steps: ['Group the x terms together and the plain numbers together.', 'Add the coefficients (the numbers in front of x).', 'Keep the x on the x terms.'],
        examples: [{
          problem: 'Simplify 4x + 3 + 2x',
          steps: ['x terms: 4x and 2x', '4 + 2 = 6, so 6x', 'The plain number 3 has nothing to combine with', 'Answer: 6x + 3'],
          answer: '6x + 3'
        }]
      },
      gen: function () {
        var a = randInt(2, 9), b = randInt(1, 12), c = randInt(2, 9);
        var coef = a + c;
        var correct = coef + 'x + ' + b;
        return Object.assign(makeMC(correct, [(a * c) + 'x + ' + b, (coef + b) + 'x', coef + 'x + ' + (b + 1)]), {
          prompt: 'Simplify: ' + a + 'x + ' + b + ' + ' + c + 'x',
          explanation: a + 'x and ' + c + 'x are like terms: ' + a + ' + ' + c + ' = ' + coef + ', giving ' + coef + 'x. The ' + b + ' stays separate. Answer: ' + correct + '.'
        });
      }
    },
    {
      id: 'ee_4', strand: 'EE', grade: 6, name: 'One-Step Equations',
      lesson: {
        idea: 'An equation is a balance scale — both sides are equal. To find x, undo whatever is being done to it, and do the exact same thing to BOTH sides so the scale stays balanced.',
        steps: ['Look at what is happening to x (added? multiplied?).', 'Do the OPPOSITE to both sides.', 'Check by putting your answer back in.'],
        examples: [{
          problem: 'Solve x + 7 = 12',
          steps: ['7 is being ADDED to x', 'The opposite of adding 7 is subtracting 7', 'Do it to both sides: x + 7 - 7 = 12 - 7', 'x = 5. Check: 5 + 7 = 12 ✓'],
          answer: 'x = 5'
        }]
      },
      gen: function () {
        var x = randInt(2, 15);
        if (Math.random() < 0.5) {
          var b = randInt(1, 20);
          return num('Solve for x:   x + ' + b + ' = ' + (x + b), x,
            'Subtract ' + b + ' from both sides: x = ' + (x + b) + ' - ' + b + ' = ' + x + '.', 0.001);
        }
        var a = randInt(2, 9);
        return num('Solve for x:   ' + a + 'x = ' + (a * x), x,
          'Divide both sides by ' + a + ': x = ' + (a * x) + ' ÷ ' + a + ' = ' + x + '.', 0.001);
      }
    },
    {
      id: 'ee_5', strand: 'EE', grade: 7, name: 'Two-Step Equations',
      lesson: {
        idea: 'Two-step equations need two undo moves. Undo in reverse order from how you would build it: get rid of the added/subtracted number FIRST, then deal with the multiplication.',
        steps: [
          'Add or subtract to move the plain number away from x.',
          'Then divide by the coefficient in front of x.',
          'Check by substituting your answer back in.'
        ],
        examples: [{
          problem: 'Solve 3x + 5 = 20',
          steps: ['First undo the + 5: subtract 5 from both sides', '3x = 15', 'Now undo the × 3: divide both sides by 3', 'x = 5. Check: 3(5) + 5 = 20 ✓'],
          answer: 'x = 5'
        }]
      },
      gen: function () {
        var x = randInt(-8, 12), a = randInt(2, 9), b = randInt(-15, 15);
        var c = a * x + b;
        return num('Solve for x:   ' + a + 'x ' + (b >= 0 ? '+ ' + b : '- ' + Math.abs(b)) + ' = ' + c, x,
          (b >= 0 ? 'Subtract ' + b : 'Add ' + Math.abs(b)) + ' from both sides: ' + a + 'x = ' + (c - b) + '. Then divide by ' + a + ': x = ' + x + '.', 0.001);
      }
    },
    {
      id: 'ee_6', strand: 'EE', grade: 7, name: 'Inequalities',
      lesson: {
        idea: 'Inequalities work exactly like equations, with one special rule: if you multiply or divide by a NEGATIVE number, the inequality sign flips direction.',
        steps: [
          'Solve it just like an equation.',
          'If you divided or multiplied by a negative, flip the sign (< becomes >).',
          'The answer is a range of numbers, not just one.'
        ],
        examples: [{
          problem: 'Solve 2x + 3 > 11',
          steps: ['Subtract 3 from both sides: 2x > 8', 'Divide both sides by 2: x > 4', 'We divided by a POSITIVE, so no flip', 'Any number bigger than 4 works'],
          answer: 'x > 4'
        }]
      },
      gen: function () {
        var x = randInt(2, 15), a = randInt(2, 8), b = randInt(1, 15);
        var op = randChoice(['>', '<']);
        return num('Solve:   ' + a + 'x + ' + b + ' ' + op + ' ' + (a * x + b) + '.   What is the boundary number for x?',
          x, 'Subtract ' + b + ': ' + a + 'x ' + op + ' ' + (a * x) + '. Divide by ' + a + ': x ' + op + ' ' + x + '. The boundary is ' + x + '.', 0.001);
      }
    },

    // ================= GEOMETRY =================
    {
      id: 'gm_1', strand: 'GM', grade: 4, name: 'Area & Perimeter of Rectangles',
      lesson: {
        idea: 'Perimeter is the distance all the way AROUND a shape (like walking the fence). Area is how much space is INSIDE it (like the carpet needed to cover it).',
        steps: ['Area of a rectangle = length × width.', 'Perimeter of a rectangle = add all four sides, or 2 × (length + width).'],
        examples: [{
          problem: 'A rectangle is 8 cm long and 5 cm wide. Find its area.',
          steps: ['Area = length × width', 'Area = 8 × 5', 'Area = 40 square cm'],
          answer: '40 cm²'
        }]
      },
      gen: function () {
        var l = randInt(3, 15), w = randInt(3, 15);
        if (Math.random() < 0.5) {
          var qr = num('A rectangle is ' + l + ' cm long and ' + w + ' cm wide. What is its AREA, in cm²?',
            l * w, 'Area = length × width = ' + l + ' × ' + w + ' = ' + (l * w) + ' cm².', 0.01);
          qr.visual = V.rectShape(l, w, { grid: true, caption: 'Count the squares inside' });
          return qr;
        }
        var qp = num('A rectangle is ' + l + ' cm long and ' + w + ' cm wide. What is its PERIMETER, in cm?',
          2 * (l + w), 'Perimeter = 2 × (' + l + ' + ' + w + ') = 2 × ' + (l + w) + ' = ' + (2 * (l + w)) + ' cm.', 0.01);
        qp.visual = V.rectShape(l, w, { caption: 'Walk all the way around the edge' });
        return qp;
      }
    },
    {
      id: 'gm_2', strand: 'GM', grade: 6, name: 'Area of Triangles & Parallelograms',
      lesson: {
        idea: 'A parallelogram is really a rectangle with a slice moved over, so its area is still base × height. And any triangle is exactly HALF of a parallelogram — which is where the ½ comes from.',
        steps: [
          'Parallelogram: area = base × height.',
          'Triangle: area = ½ × base × height.',
          'Height means straight up-and-down height, not the slanted side.'
        ],
        examples: [{
          problem: 'A triangle has base 10 cm and height 6 cm. Find its area.',
          steps: ['Area = ½ × base × height', 'Area = ½ × 10 × 6', '10 × 6 = 60, and half of 60 is 30', 'Area = 30 square cm'],
          answer: '30 cm²'
        }]
      },
      gen: function () {
        var b = randInt(3, 20), h = randInt(3, 20);
        if (Math.random() < 0.5) {
          var qt = num('A triangle has a base of ' + b + ' cm and a height of ' + h + ' cm. What is its area, in cm²?',
            round2(0.5 * b * h), 'Area = ½ × ' + b + ' × ' + h + ' = ' + round2(0.5 * b * h) + ' cm².', 0.01);
          qt.visual = V.triangleShape(b, h);
          return qt;
        }
        return num('A parallelogram has a base of ' + b + ' cm and a height of ' + h + ' cm. What is its area, in cm²?',
          b * h, 'Area = base × height = ' + b + ' × ' + h + ' = ' + (b * h) + ' cm².', 0.01);
      }
    },
    {
      id: 'gm_3', strand: 'GM', grade: 6, name: 'Volume of Prisms',
      lesson: {
        idea: 'Volume is how much SPACE is inside a 3D shape — how much water it would hold. For a box, you find the area of the bottom, then stack that layer up as many times as it is tall.',
        steps: ['Volume of a box = length × width × height.', 'Answer is in cubic units (cm³).'],
        examples: [{
          problem: 'A box is 4 cm by 3 cm by 5 cm. Find its volume.',
          steps: ['Volume = length × width × height', 'Volume = 4 × 3 × 5', '4 × 3 = 12, then 12 × 5 = 60', 'Volume = 60 cubic cm'],
          answer: '60 cm³'
        }]
      },
      gen: function () {
        var l = randInt(2, 12), w = randInt(2, 12), h = randInt(2, 12);
        return num('A box is ' + l + ' cm long, ' + w + ' cm wide, and ' + h + ' cm tall. What is its VOLUME, in cm³?',
          l * w * h, 'Volume = ' + l + ' × ' + w + ' × ' + h + ' = ' + (l * w * h) + ' cm³.', 0.01);
      }
    },
    {
      id: 'gm_4', strand: 'GM', grade: 7, name: 'Angle Relationships',
      lesson: {
        idea: 'Certain angle pairs always add to the same total. Angles on a straight line add to 180°. Angles forming a square corner add to 90°. And the three angles inside any triangle always add to 180°.',
        steps: [
          'Straight line (supplementary): the two angles add to 180°.',
          'Right angle (complementary): the two angles add to 90°.',
          'Triangle: all three angles add to 180°.',
          'Subtract what you know from the total.'
        ],
        examples: [{
          problem: 'Two angles form a straight line. One is 130°. Find the other.',
          steps: ['A straight line is 180°', 'Subtract the angle you know', '180 - 130 = 50', 'The other angle is 50°'],
          answer: '50°'
        }]
      },
      gen: function () {
        var mode = randChoice(['line', 'right', 'triangle']);
        if (mode === 'line') {
          var a = randInt(20, 160);
          return num('Two angles together form a straight line (180°). One measures ' + a + '°. What is the other, in degrees?',
            180 - a, '180 - ' + a + ' = ' + (180 - a) + '°.', 0.01);
        }
        if (mode === 'right') {
          var b = randInt(10, 80);
          return num('Two angles together form a right angle (90°). One measures ' + b + '°. What is the other, in degrees?',
            90 - b, '90 - ' + b + ' = ' + (90 - b) + '°.', 0.01);
        }
        var p = randInt(20, 100), q = randInt(20, 150 - p);
        return num('A triangle has angles of ' + p + '° and ' + q + '°. What is the third angle, in degrees?',
          180 - p - q, 'All three add to 180: 180 - ' + p + ' - ' + q + ' = ' + (180 - p - q) + '°.', 0.01);
      }
    },
    {
      id: 'gm_5', strand: 'GM', grade: 7, name: 'Circles',
      lesson: {
        idea: 'Circles have two formulas worth memorizing. Circumference (the distance around) = 2πr. Area (the space inside) = πr². The one thing people mix up: area uses the radius SQUARED. We use π ≈ 3.14.',
        steps: [
          'Find the radius (if given diameter, cut it in half).',
          'Circumference = 2 × 3.14 × radius.',
          'Area = 3.14 × radius × radius.'
        ],
        examples: [{
          problem: 'A circle has radius 5 cm. Find its area.',
          steps: ['Area = πr²', 'r² = 5 × 5 = 25', 'Area = 3.14 × 25', 'Area = 78.5 square cm'],
          answer: '78.5 cm²'
        }]
      },
      gen: function () {
        var r = randInt(2, 12);
        if (Math.random() < 0.5) {
          var qc = num('A circle has a radius of ' + r + ' cm. Using π ≈ 3.14, what is its AREA in cm²? (2 decimal places)',
            round2(PI * r * r), 'Area = πr² = 3.14 × ' + r + '² = 3.14 × ' + (r * r) + ' = ' + round2(PI * r * r) + ' cm².', 0.15);
          qc.visual = V.circleShape(r, { caption: 'Area = the space inside' });
          return qc;
        }
        var qcc = num('A circle has a radius of ' + r + ' cm. Using π ≈ 3.14, what is its CIRCUMFERENCE in cm? (2 decimal places)',
          round2(2 * PI * r), 'Circumference = 2πr = 2 × 3.14 × ' + r + ' = ' + round2(2 * PI * r) + ' cm.', 0.15);
        qcc.visual = V.circleShape(r, { caption: 'Circumference = the distance around the edge' });
        return qcc;
      }
    },
    {
      id: 'gm_6', strand: 'GM', grade: 7, name: 'Surface Area & Composite Figures',
      lesson: {
        idea: 'Surface area is the total of every face you could paint — think of unfolding the box flat. For weird composite shapes, break them into simple shapes you already know, find each area, then add.',
        steps: [
          'Surface area of a box = 2(lw + lh + wh).',
          'Composite shapes: split into rectangles/triangles, find each area, add them up.'
        ],
        examples: [{
          problem: 'A figure is a 6×4 rectangle with a triangle on top (base 6, height 3). Find the total area.',
          steps: ['Rectangle: 6 × 4 = 24', 'Triangle: ½ × 6 × 3 = 9', 'Add them: 24 + 9 = 33', 'Total area = 33 square units'],
          answer: '33'
        }]
      },
      gen: function () {
        if (Math.random() < 0.5) {
          var l = randInt(2, 10), w = randInt(2, 10), h = randInt(2, 10);
          return num('A box is ' + l + ' by ' + w + ' by ' + h + ' cm. What is its SURFACE AREA, in cm²?',
            2 * (l * w + l * h + w * h),
            'SA = 2(lw + lh + wh) = 2(' + (l * w) + ' + ' + (l * h) + ' + ' + (w * h) + ') = ' + (2 * (l * w + l * h + w * h)) + ' cm².', 0.01);
        }
        var rw = randInt(4, 12), rh = randInt(3, 10), th = randInt(3, 8);
        return num('A shape is a rectangle ' + rw + ' cm by ' + rh + ' cm, with a triangle on top (base ' + rw + ' cm, height ' + th + ' cm). What is the TOTAL area, in cm²?',
          round2(rw * rh + 0.5 * rw * th),
          'Rectangle = ' + rw + ' × ' + rh + ' = ' + (rw * rh) + '. Triangle = ½ × ' + rw + ' × ' + th + ' = ' + round2(0.5 * rw * th) + '. Total = ' + round2(rw * rh + 0.5 * rw * th) + ' cm².', 0.01);
      }
    },

    // ================= DATA & PROBABILITY =================
    {
      id: 'sp_1', strand: 'SP', grade: 6, name: 'Mean, Median & Range',
      lesson: {
        idea: 'These three describe a set of numbers. The MEAN is the balancing point (the average). The MEDIAN is the number in the middle when sorted. The RANGE tells you how spread out the numbers are.',
        steps: [
          'Mean: add all the numbers, then divide by how many there are.',
          'Median: sort them, then take the middle one.',
          'Range: biggest minus smallest.'
        ],
        examples: [{
          problem: 'Find the mean of 4, 8, 6, 2',
          steps: ['Add them: 4 + 8 + 6 + 2 = 20', 'Count them: there are 4 numbers', 'Divide: 20 ÷ 4 = 5', 'The mean is 5'],
          answer: '5'
        }]
      },
      gen: function () {
        var n = 5, nums = [];
        for (var i = 0; i < n; i++) nums.push(randInt(1, 20));
        var mode = randChoice(['mean', 'median', 'range']);
        var sorted = nums.slice().sort(function (a, b) { return a - b; });
        var sum = nums.reduce(function (s, v) { return s + v; }, 0);
        if (mode === 'mean') {
          var qmean = num('Find the MEAN of: ' + nums.join(', ') + '   (round to 2 decimals)', round2(sum / n),
            'Sum = ' + sum + '. Divide by ' + n + ': ' + round2(sum / n) + '.', 0.02);
          qmean.visual = V.barChart(nums, { caption: 'The mean is the level they would all be if you evened them out' });
          return qmean;
        }
        if (mode === 'median') {
          return num('Find the MEDIAN of: ' + nums.join(', '), sorted[2],
            'Sorted: ' + sorted.join(', ') + '. The middle value is ' + sorted[2] + '.', 0.001);
        }
        return num('Find the RANGE of: ' + nums.join(', '), sorted[n - 1] - sorted[0],
          'Biggest ' + sorted[n - 1] + ' minus smallest ' + sorted[0] + ' = ' + (sorted[n - 1] - sorted[0]) + '.', 0.001);
      }
    },
    {
      id: 'sp_2', strand: 'SP', grade: 6, name: 'Comparing Data Sets',
      lesson: {
        idea: 'To compare two groups fairly, compare their averages (which group is typically higher?) and their ranges (which group is more consistent?). A smaller range means more consistent.',
        steps: ['Find the mean of each set.', 'Subtract to see how far apart they are.'],
        examples: [{
          problem: 'Set A: 4, 6, 8. Set B: 2, 3, 4. How far apart are the means?',
          steps: ['Mean of A = (4+6+8) ÷ 3 = 18 ÷ 3 = 6', 'Mean of B = (2+3+4) ÷ 3 = 9 ÷ 3 = 3', 'Difference: 6 - 3 = 3'],
          answer: '3'
        }]
      },
      gen: function () {
        var A = [], B = [];
        for (var i = 0; i < 4; i++) { A.push(randInt(1, 20)); B.push(randInt(1, 20)); }
        var mA = A.reduce(function (s, v) { return s + v; }, 0) / 4;
        var mB = B.reduce(function (s, v) { return s + v; }, 0) / 4;
        return num('Set A: ' + A.join(', ') + '\nSet B: ' + B.join(', ') + '\nBy how much do the MEANS differ? (round to 2 decimals)',
          round2(Math.abs(mA - mB)),
          'Mean A = ' + round2(mA) + ', Mean B = ' + round2(mB) + '. Difference = ' + round2(Math.abs(mA - mB)) + '.', 0.02);
      }
    },
    {
      id: 'sp_3', strand: 'SP', grade: 7, name: 'Simple Probability',
      lesson: {
        idea: 'Probability measures how likely something is, from 0 (impossible) to 1 (certain). It is just a fraction: the number of ways you can WIN over the total number of possible outcomes.',
        steps: [
          'Count the outcomes you want (favorable).',
          'Count all possible outcomes (total).',
          'Write favorable / total, then simplify.'
        ],
        examples: [{
          problem: 'A bag has 3 red and 5 blue marbles. P(red)?',
          steps: ['Favorable (red) = 3', 'Total marbles = 3 + 5 = 8', 'P(red) = 3/8', '3/8 will not simplify further'],
          answer: '3/8'
        }]
      },
      gen: function () {
        var red = randInt(1, 6), blue = randInt(1, 6);
        while (blue === red) blue = randInt(1, 6);
        var total = red + blue;
        var s = simplifyFrac(red, total);
        var b2 = simplifyFrac(blue, total);
        return Object.assign(makeMC(fracStr(s[0], s[1]), [fracStr(red, blue), fracStr(b2[0], b2[1]), fracStr(total, red)]), {
          visual: V.marbles({ red: red, blue: blue }, { caption: red + ' red + ' + blue + ' blue = ' + total + ' marbles in total' }),
          prompt: 'A bag has ' + red + ' red and ' + blue + ' blue marbles. What is the probability of picking RED? (simplest form)',
          explanation: red + ' red out of ' + total + ' total = ' + fracStr(red, total) + (fracStr(s[0], s[1]) !== fracStr(red, total) ? ', which simplifies to ' + fracStr(s[0], s[1]) : '') + '.'
        });
      }
    },
    {
      id: 'sp_4', strand: 'SP', grade: 7, name: 'Compound Probability',
      lesson: {
        idea: 'When two separate things happen and one does not affect the other, you MULTIPLY their probabilities. Multiplying fractions makes them smaller — which makes sense, since needing two things to both happen is harder.',
        steps: ['Find the probability of the first event.', 'Find the probability of the second event.', 'Multiply them together.'],
        examples: [{
          problem: 'Flip a coin AND roll a die. P(heads and a 4)?',
          steps: ['P(heads) = 1/2', 'P(rolling a 4) = 1/6', 'Multiply: 1/2 × 1/6 = 1/12'],
          answer: '1/12'
        }]
      },
      gen: function () {
        var setups = [
          { text: 'flip a coin and roll a 6-sided die', p: 'getting heads AND rolling a 3', n: 12, why: '1/2 × 1/6 = 1/12' },
          { text: 'flip two coins', p: 'getting heads BOTH times', n: 4, why: '1/2 × 1/2 = 1/4' },
          { text: 'roll two 6-sided dice', p: 'rolling a 5 on BOTH', n: 36, why: '1/6 × 1/6 = 1/36' },
          { text: 'spin a 4-color spinner and flip a coin', p: 'landing on red AND getting tails', n: 8, why: '1/4 × 1/2 = 1/8' }
        ];
        var s = randChoice(setups);
        return Object.assign(makeMC(fracStr(1, s.n), [fracStr(1, Math.max(2, Math.round(s.n / 2))), fracStr(2, s.n), fracStr(1, s.n + 2)]), {
          prompt: 'You ' + s.text + '. What is the probability of ' + s.p + '?',
          explanation: 'Multiply the two probabilities: ' + s.why + '.'
        });
      }
    }
  ];


  /* ---- Lesson visuals: every lesson opens with a picture of the idea ---- */
  var LESSON_VISUALS = {
    wn_1: V.areaModel(34, 6, { split: [30, 4], leftLabel: '180', rightLabel: '24', caption: '34 x 6 = 180 + 24 = 204' }),
    wn_2: V.arrayModel(4, 6, { caption: '24 dots in 4 equal rows -> 24 ÷ 4 = 6' }),
    fd_1: V.fractionBars([{ num: 1, den: 2, label: '1/2' }, { num: 3, den: 6, label: '3/6', color: 'var(--viz-fill-b)' }], 'Different names, exactly the same amount'),
    fd_2: V.fractionBars([{ num: 1, den: 2, label: '1/2 = 3/6' }, { num: 1, den: 3, label: '1/3 = 2/6', color: 'var(--viz-fill-b)' }], 'Cut both into sixths so the pieces match, then add'),
    fd_3: V.fractionBar(1, 2, { label: 'Half of the bar...' }),
    fd_4: V.fractionBars([{ num: 3, den: 4, label: 'we have 3/4' }, { num: 1, den: 2, label: 'in chunks of 1/2', color: 'var(--viz-fill-b)' }], '3/4 ÷ 1/2 asks: how many halves fit into 3/4?'),
    fd_5: V.percentBar(30, { caption: '0.3 and 30% and 3/10 are all the same amount' }),
    fd_6: V.numberLine(-2, 2, { points: [{ at: -1, label: '-1/1' }], caption: 'Negative fractions live left of zero' }),
    in_1: V.numberLine(-8, 8, { points: [{ at: -5, label: '-5' }, { at: 3, label: '3' }], caption: 'Further LEFT means smaller' }),
    in_2: V.numberLine(-10, 10, { points: [{ at: -8, label: 'start' }], jump: { from: -8, to: -5, label: 'add 3 -> move right' }, caption: '-8 + 3 = -5' }),
    in_3: V.numberLine(-12, 12, { points: [{ at: -6, label: '-6' }, { at: 6, label: '+6' }], caption: 'Same signs -> positive. Different signs -> negative.' }),
    rp_1: V.ratioTable([['cups', 'batches'], [2, 3], [4, 6], [6, 9]]),
    rp_2: V.ratioTable([['notebooks', 'cost'], [5, '$15'], [1, '$3']]),
    rp_3: V.percentBar(25, { caption: '25% means 25 out of every 100' }),
    rp_4: V.ratioTable([['x', 'y'], [1, 2.5], [2, 5], [4, 10]]),
    rp_5: V.percentBar(75, { caption: '25% off means you pay the other 75%' }),
    rp_6: V.ratioTable([['on the drawing', 'in real life'], ['1 inch', '5 feet'], ['3 inches', '15 feet']]),
    ee_1: V.balance('3 + 4 x 2', '11', { caption: 'Multiply before you add' }),
    ee_2: V.balance('3x + 5, x = 4', '17', { caption: 'Swap the letter for the number' }),
    ee_3: V.fractionBars([{ num: 4, den: 10, label: '4x' }, { num: 2, den: 10, label: '2x', color: 'var(--viz-fill-b)' }], '4x and 2x are the same kind of thing, so they combine into 6x'),
    ee_4: V.balance('x + 7', '12', { caption: 'Take 7 off BOTH sides to keep it balanced' }),
    ee_5: V.balance('3x + 5', '20', { caption: 'Undo the +5 first, then undo the x3' }),
    ee_6: V.numberLine(0, 10, { points: [{ at: 4, label: '4' }], jump: { from: 4, to: 10, label: 'x > 4 is everything over here' }, caption: 'An inequality is a whole range, not one number' }),
    gm_1: V.rectShape(8, 5, { grid: true, caption: 'Area = squares inside. Perimeter = distance around.' }),
    gm_2: V.triangleShape(10, 6),
    gm_3: V.rectShape(4, 3, { grid: true, caption: 'Find the bottom layer, then stack it up' }),
    gm_4: V.numberLine(0, 180, { points: [{ at: 130, label: '130°' }], caption: 'A straight line is 180° in total' }),
    gm_5: V.circleShape(5, { caption: 'Circumference = around the edge. Area = space inside.' }),
    gm_6: V.rectShape(6, 4, { grid: true, caption: 'Break odd shapes into simple ones you know' }),
    sp_1: V.barChart([4, 8, 6, 2], { caption: 'The mean levels them all out to the same height' }),
    sp_2: V.barChart([4, 6, 8, 2, 3, 4], { caption: 'Compare two groups by their averages and their spread' }),
    sp_3: V.marbles({ red: 3, blue: 5 }, { caption: '3 red out of 8 total -> P(red) = 3/8' }),
    sp_4: V.marbles({ red: 1, blue: 1 }, { caption: 'Two separate events -> multiply the chances' })
  };
  LEVELS.forEach(function (lv) {
    if (LESSON_VISUALS[lv.id]) lv.lesson.visual = LESSON_VISUALS[lv.id];
  });

  root.App = root.App || {};
  root.App.Curriculum = { STRANDS: STRANDS, LEVELS: LEVELS, _helpers: { randInt: randInt, randChoice: randChoice, randNonzero: randNonzero, round2: round2, money: money, fracStr: fracStr, simplifyFrac: simplifyFrac, makeMC: makeMC, num: num, PI: PI, shuffle: shuffle } };

  if (typeof module !== 'undefined' && module.exports) module.exports = root.App.Curriculum;
})(typeof window !== 'undefined' ? window : global);
