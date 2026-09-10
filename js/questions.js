/* Question bank: procedurally generates infinite 7th-grade math practice problems
   across the 5 Massachusetts Curriculum Framework domains for Grade 7 math. */
(function (root) {
  var PI = 3.14;

  var DOMAINS = [
    { id: 'RP', name: 'Ratios & Proportions', short: 'Ratios', color: '#ff6b6b', emoji: '⚖️' },
    { id: 'NS', name: 'The Number System', short: 'Numbers', color: '#00b8d9', emoji: '🔢' },
    { id: 'EE', name: 'Expressions & Equations', short: 'Algebra', color: '#ffa62b', emoji: '🧮' },
    { id: 'G', name: 'Geometry', short: 'Geometry', color: '#6c5ce7', emoji: '📐' },
    { id: 'SP', name: 'Statistics & Probability', short: 'Data', color: '#00b894', emoji: '🎲' }
  ];

  var SKILLS = [
    { id: 'unit_rate', domain: 'RP', name: 'Unit Rates' },
    { id: 'proportional', domain: 'RP', name: 'Proportional Relationships' },
    { id: 'percent', domain: 'RP', name: 'Percent Problems' },
    { id: 'scale', domain: 'RP', name: 'Scale Drawings' },
    { id: 'add_sub_integers', domain: 'NS', name: 'Adding & Subtracting Integers' },
    { id: 'mul_div_integers', domain: 'NS', name: 'Multiplying & Dividing Integers' },
    { id: 'rational_ops', domain: 'NS', name: 'Fractions & Decimals' },
    { id: 'abs_value', domain: 'NS', name: 'Absolute Value & Distance' },
    { id: 'simplify_expr', domain: 'EE', name: 'Simplifying Expressions' },
    { id: 'two_step_eq', domain: 'EE', name: 'Two-Step Equations' },
    { id: 'word_to_eq', domain: 'EE', name: 'Word Problems to Equations' },
    { id: 'inequalities', domain: 'EE', name: 'Inequalities' },
    { id: 'circles', domain: 'G', name: 'Circles' },
    { id: 'composite_area', domain: 'G', name: 'Area of Figures' },
    { id: 'volume_surface', domain: 'G', name: 'Volume & Surface Area' },
    { id: 'angles', domain: 'G', name: 'Angle Relationships' },
    { id: 'measures_center', domain: 'SP', name: 'Mean, Median & Range' },
    { id: 'simple_prob', domain: 'SP', name: 'Simple Probability' },
    { id: 'compound_prob', domain: 'SP', name: 'Compound Probability' },
    { id: 'data_compare', domain: 'SP', name: 'Comparing Data Sets' }
  ];

  var SKILL_MAP = {};
  SKILLS.forEach(function (s) { SKILL_MAP[s.id] = s; });
  var DOMAIN_MAP = {};
  DOMAINS.forEach(function (d) { DOMAIN_MAP[d.id] = d; });

  // ---------- helpers ----------
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randNonzero(min, max) { var v = 0; while (v === 0) v = randInt(min, max); return v; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function round2(x) { return Math.round(x * 100) / 100; }
  function fmtMoney(x) { return round2(x).toFixed(2); }
  function fracStr(n, d) { if (d < 0) { n = -n; d = -d; } return n + '/' + d; }
  function simplifyFrac(n, d) { if (d < 0) { n = -n; d = -d; } var g = gcd(n, d); return [n / g, d / g]; }
  function itemsPhrase(n) {
    return n + ' ' + randChoice(['notebooks', 'pencils', 'movie tickets', 'bagels', 'stickers', 'water bottles']);
  }
  function signedConstStr(v) { return v >= 0 ? ('+ ' + v) : ('- ' + Math.abs(v)); }

  function termAbsStr(t) {
    if (t.isX) { var c = Math.abs(t.val); return c === 1 ? 'x' : (c + 'x'); }
    return String(Math.abs(t.val));
  }
  function termStr(t) { var s = termAbsStr(t); return t.val < 0 ? ('-' + s) : s; }
  function joinTermsSimple(terms) {
    var out = termStr(terms[0]);
    for (var i = 1; i < terms.length; i++) {
      out += (terms[i].val < 0 ? ' - ' : ' + ') + termAbsStr(terms[i]);
    }
    return out;
  }
  function simplifiedStr(coef, k) {
    var parts = [];
    if (coef !== 0) parts.push({ isX: true, val: coef });
    if (k !== 0) parts.push({ isX: false, val: k });
    if (parts.length === 0) return '0';
    return joinTermsSimple(parts);
  }
  function makeMC(correctText, wrongTexts) {
    var seen = {};
    var uniqueWrong = [];
    wrongTexts.forEach(function (t) {
      if (t !== correctText && !seen[t]) { seen[t] = true; uniqueWrong.push(t); }
    });
    var i = 0;
    while (uniqueWrong.length < 3) {
      var filler = correctText + '~' + (i++);
      if (!seen[filler]) { seen[filler] = true; uniqueWrong.push(filler); }
    }
    uniqueWrong = uniqueWrong.slice(0, 3);
    var items = [{ t: correctText, c: true }].concat(uniqueWrong.map(function (t) { return { t: t, c: false }; }));
    items = shuffle(items);
    var answer = items.findIndex(function (it) { return it.c; });
    return { choices: items.map(function (it) { return it.t; }), answer: answer };
  }

  // ---------- RP: Ratios & Proportional Relationships ----------
  function genUnitRate(diff) {
    var mode = Math.random() < 0.5 ? 'price' : 'speed';
    if (mode === 'price') {
      var unitPrice, n;
      if (diff === 1) { unitPrice = randInt(2, 9); n = randInt(2, 6); }
      else if (diff === 2) { unitPrice = round2(randInt(2, 20) + randChoice([0, 0.5])); n = randInt(3, 9); }
      else { unitPrice = round2(randInt(150, 900) / 100); n = randInt(4, 12); }
      var total = round2(unitPrice * n);
      var phrase = itemsPhrase(n);
      return {
        prompt: phrase.charAt(0).toUpperCase() + phrase.slice(1) + ' cost $' + fmtMoney(total) + ' in total. What is the price of ONE item (the unit rate), in dollars?',
        answer: unitPrice, tolerance: 0.02,
        explanation: '$' + fmtMoney(total) + ' ÷ ' + n + ' = $' + fmtMoney(unitPrice) + ' per item.'
      };
    } else {
      var speed, h;
      if (diff === 1) { speed = randInt(20, 60); h = randInt(1, 4); }
      else if (diff === 2) { speed = randInt(15, 75); h = randInt(2, 6); }
      else { speed = round2(randInt(150, 700) / 10); h = randInt(2, 7); }
      var dist = round2(speed * h);
      return {
        prompt: 'A car travels ' + dist + ' miles in ' + h + ' hours at a constant speed. What is its speed, in miles per hour?',
        answer: speed, tolerance: 0.05,
        explanation: dist + ' ÷ ' + h + ' = ' + speed + ' mph.'
      };
    }
  }

  function genProportional(diff) {
    if (Math.random() < 0.5) {
      var rate;
      if (diff === 1) rate = randInt(2, 9);
      else if (diff === 2) rate = round2(randInt(5, 40) / 2);
      else rate = round2(randInt(20, 300) / 10);
      var b1 = randInt(2, 6), b2;
      do { b2 = randInt(2, 12); } while (b2 === b1);
      var v1 = round2(rate * b1), v2 = round2(rate * b2);
      return {
        prompt: b1 + ' items cost $' + fmtMoney(v1) + ' at a constant rate. At that same rate, how much would ' + b2 + ' items cost, in dollars?',
        answer: v2, tolerance: 0.05,
        explanation: 'Rate = $' + fmtMoney(v1) + ' ÷ ' + b1 + ' = $' + fmtMoney(rate) + ' per item. ' + b2 + ' × $' + fmtMoney(rate) + ' = $' + fmtMoney(v2) + '.'
      };
    } else {
      var k;
      if (diff === 1) k = randInt(2, 9);
      else if (diff === 2) k = round2(randInt(5, 40) / 10);
      else k = round2(randInt(20, 300) / 100);
      var x = diff === 3 ? randInt(4, 12) : randInt(2, 10);
      var y = round2(k * x);
      return {
        prompt: 'y is proportional to x. When x = ' + x + ', y = ' + fmtMoney(y) + '. What is the constant of proportionality k, where y = kx?',
        answer: k, tolerance: 0.02,
        explanation: 'k = y ÷ x = ' + fmtMoney(y) + ' ÷ ' + x + ' = ' + k + '.'
      };
    }
  }

  function genPercent(diff) {
    var type = randChoice(['discount', 'tax', 'tip', 'increase']);
    var rate = diff === 1 ? randChoice([10, 20, 25, 50, 5])
      : diff === 2 ? randChoice([15, 30, 12, 35, 7, 40])
      : randChoice([6.5, 17.5, 8.25, 4.75, 22.5]);
    var price = diff === 1 ? randInt(10, 80)
      : diff === 2 ? round2(randInt(15, 200) + randChoice([0, 0.5]))
      : round2(randInt(500, 25000) / 100);
    if (type === 'discount') {
      var sale = round2(price * (1 - rate / 100));
      return { prompt: 'A jacket costs $' + fmtMoney(price) + ' and is on sale for ' + rate + '% off. What is the sale price, in dollars?', answer: sale, tolerance: 0.05, explanation: '$' + fmtMoney(price) + ' × (1 - ' + rate + '/100) = $' + fmtMoney(sale) + '.' };
    } else if (type === 'tax') {
      var total = round2(price * (1 + rate / 100));
      return { prompt: 'An item costs $' + fmtMoney(price) + ' before tax. Sales tax is ' + rate + '%. What is the total cost, in dollars?', answer: total, tolerance: 0.05, explanation: '$' + fmtMoney(price) + ' × (1 + ' + rate + '/100) = $' + fmtMoney(total) + '.' };
    } else if (type === 'tip') {
      var tip = round2(price * rate / 100);
      return { prompt: 'A restaurant bill is $' + fmtMoney(price) + '. What is a ' + rate + '% tip, in dollars?', answer: tip, tolerance: 0.05, explanation: '$' + fmtMoney(price) + ' × ' + rate + '/100 = $' + fmtMoney(tip) + '.' };
    } else {
      var newVal = round2(price * (1 + rate / 100));
      return { prompt: 'A town of ' + Math.round(price * 100) + ' people grows by ' + rate + '%. What is the new population? (round to the nearest whole number)', answer: Math.round(price * 100 * (1 + rate / 100)), tolerance: 2, explanation: Math.round(price * 100) + ' × (1 + ' + rate + '/100) ≈ ' + Math.round(price * 100 * (1 + rate / 100)) + '.' };
    }
  }

  function genScale(diff) {
    var k = diff === 1 ? randInt(2, 20) : diff === 2 ? round2(randInt(20, 100) / 4) : round2(randInt(10, 500) / 10);
    var drawing = diff === 3 ? round2(randInt(10, 300) / 10) : randInt(1, 12);
    var real = round2(drawing * k);
    if (diff === 3 && Math.random() < 0.5) {
      var d = round2(real / k);
      return { prompt: 'On a scale drawing, 1 inch = ' + k + ' feet in real life. If a real wall is ' + real + ' feet long, how long is it on the drawing, in inches?', answer: d, tolerance: 0.1, explanation: real + ' ÷ ' + k + ' = ' + d + ' in.' };
    }
    return { prompt: 'On a scale drawing, 1 inch = ' + k + ' feet in real life. A wall measures ' + drawing + ' inches on the drawing. How long is the real wall, in feet?', answer: real, tolerance: 0.1, explanation: drawing + ' × ' + k + ' = ' + real + ' ft.' };
  }

  // ---------- NS: The Number System ----------
  function genAddSub(diff) {
    var range = diff === 1 ? 10 : diff === 2 ? 25 : 50;
    if (diff < 3) {
      var a = randInt(-range, range), b = randInt(-range, range), op = randChoice(['+', '-']);
      var ans = op === '+' ? a + b : a - b;
      return { prompt: a + ' ' + op + ' (' + b + ') = ?', answer: ans, tolerance: 0.001, explanation: a + ' ' + op + ' (' + b + ') = ' + ans + '.' };
    } else {
      var a2 = randInt(-range, range), b2 = randInt(-range, range), c2 = randInt(-range, range);
      var ans2 = a2 - b2 + c2;
      return { prompt: a2 + ' - (' + b2 + ') + (' + c2 + ') = ?', answer: ans2, tolerance: 0.001, explanation: 'Work left to right: ' + a2 + ' - (' + b2 + ') = ' + (a2 - b2) + '; then + (' + c2 + ') = ' + ans2 + '.' };
    }
  }

  function genMulDiv(diff) {
    var range = diff === 1 ? 12 : diff === 2 ? 20 : 30;
    var useDiv = diff >= 2 && Math.random() < 0.5;
    if (useDiv) {
      var b = randNonzero(-range, range);
      var ans = randNonzero(-range, range);
      var a = ans * b;
      return { prompt: a + ' ÷ (' + b + ') = ?', answer: ans, tolerance: 0.001, explanation: a + ' ÷ (' + b + ') = ' + ans + '.' };
    } else {
      var a2 = randNonzero(-range, range), b2 = randNonzero(-range, range);
      var ans2 = a2 * b2;
      return { prompt: a2 + ' × (' + b2 + ') = ?', answer: ans2, tolerance: 0.001, explanation: a2 + ' × (' + b2 + ') = ' + ans2 + '.' };
    }
  }

  function genRational(diff) {
    var denomPool = diff === 1 ? [2, 4, 5, 10] : diff === 2 ? [2, 3, 4, 5, 6, 8] : [3, 6, 7, 8, 9, 12];
    var d1 = randChoice(denomPool), d2 = randChoice(denomPool);
    var n1 = diff === 1 ? randInt(1, d1 * 2) : randNonzero(-(d1 * 2), d1 * 2);
    var n2 = diff === 1 ? randNonzero(1, d2 * 2) : randNonzero(-(d2 * 2), d2 * 2);
    var op = randChoice(['+', '-', '×', '÷']);
    var rn, rd;
    if (op === '+') { rn = n1 * d2 + n2 * d1; rd = d1 * d2; }
    else if (op === '-') { rn = n1 * d2 - n2 * d1; rd = d1 * d2; }
    else if (op === '×') { rn = n1 * n2; rd = d1 * d2; }
    else { if (n2 === 0) n2 = 1; rn = n1 * d2; rd = d1 * n2; }
    if (rd === 0) rd = 1;
    var simplified = simplifyFrac(rn, rd);
    var answer = round2(simplified[0] / simplified[1]);
    return {
      prompt: fracStr(n1, d1) + ' ' + op + ' ' + fracStr(n2, d2) + ' = ? (round to 2 decimal places)',
      answer: answer, tolerance: 0.02,
      explanation: fracStr(n1, d1) + ' ' + op + ' ' + fracStr(n2, d2) + ' = ' + fracStr(simplified[0], simplified[1]) + ' = ' + answer + '.'
    };
  }

  function genAbsValue(diff) {
    if (diff === 1) {
      var a = randNonzero(-20, 20);
      return { prompt: 'What is |' + a + '|?', answer: Math.abs(a), tolerance: 0.001, explanation: 'The absolute value of ' + a + ' is ' + Math.abs(a) + '.' };
    } else if (diff === 2) {
      var p1 = randInt(-30, 30), p2 = randInt(-30, 30);
      return { prompt: 'What is the distance between ' + p1 + ' and ' + p2 + ' on the number line? (|' + p1 + ' - ' + p2 + '|)', answer: Math.abs(p1 - p2), tolerance: 0.001, explanation: '|' + p1 + ' - ' + p2 + '| = ' + Math.abs(p1 - p2) + '.' };
    } else {
      var x = randInt(-40, 40), y = randInt(-40, 40), c = randInt(-10, 10);
      var ans = Math.abs(x) - Math.abs(y) + c;
      return { prompt: '|' + x + '| - |' + y + '| + (' + c + ') = ?', answer: ans, tolerance: 0.001, explanation: '|' + x + '| - |' + y + '| + (' + c + ') = ' + Math.abs(x) + ' - ' + Math.abs(y) + ' + (' + c + ') = ' + ans + '.' };
    }
  }

  // ---------- EE: Expressions & Equations ----------
  function genSimplifyExpr(diff) {
    var coef, k, exprStr;
    if (diff === 1) {
      var a = randNonzero(-9, 9), b = randNonzero(-20, 20), c = randNonzero(-9, 9);
      var terms = shuffle([{ isX: true, val: a }, { isX: false, val: b }, { isX: true, val: c }]);
      exprStr = joinTermsSimple(terms);
      coef = a + c; k = b;
    } else if (diff === 2) {
      var m = randNonzero(-6, 6), innerK = randNonzero(-10, 10), outer = randNonzero(-9, 9);
      exprStr = m + '(x ' + signedConstStr(innerK) + ') ' + signedConstStr(outer) + 'x';
      coef = m + outer; k = m * innerK;
    } else {
      var m1 = randInt(2, 6), m2 = randInt(2, 6);
      var ik1 = randNonzero(-9, 9), ik2 = randNonzero(-9, 9);
      exprStr = m1 + '(x ' + signedConstStr(ik1) + ') - ' + m2 + '(x ' + signedConstStr(ik2) + ')';
      coef = m1 - m2; k = m1 * ik1 - m2 * ik2;
    }
    var correctText = simplifiedStr(coef, k);
    var wrong = [
      simplifiedStr(-coef, k),
      simplifiedStr(coef, -k),
      simplifiedStr(coef + (coef >= 0 ? 2 : -2), k + (k >= 0 ? 3 : -3))
    ];
    var mc = makeMC(correctText, wrong);
    return {
      prompt: 'Simplify: ' + exprStr,
      choices: mc.choices, answer: mc.answer, type: 'mc',
      explanation: 'Combining like terms gives ' + correctText + '.'
    };
  }

  function genTwoStepEq(diff) {
    var xAns, a, b;
    if (diff === 1) { xAns = randInt(-12, 12) || 1; a = randNonzero(2, 9); b = randInt(-20, 20); }
    else if (diff === 2) { xAns = randInt(-15, 15) || 1; a = randNonzero(2, 12); b = randInt(-30, 30); }
    else { xAns = randChoice([0.5, 1.5, 2.5, -0.5, -1.5, 3.5]); a = randNonzero(2, 9); b = randInt(-20, 20); }
    var c = round2(a * xAns + b);
    var aStr = a === 1 ? 'x' : a === -1 ? '-x' : (a + 'x');
    var tol = diff === 3 ? 0.02 : 0.001;
    return {
      prompt: 'Solve for x: ' + aStr + ' ' + signedConstStr(b) + ' = ' + c,
      answer: xAns, tolerance: tol,
      explanation: aStr + ' = ' + round2(c - b) + '  →  x = ' + round2(c - b) + ' ÷ ' + a + ' = ' + xAns + '.'
    };
  }

  var WORD_STORIES = [
    function (a, b, c, ans) { return 'Jordan has $' + b + ' saved and earns $' + a + ' each week from a part-time job. After how many weeks will Jordan have $' + c + ' saved (at the same rate)?'; },
    function (a, b, c, ans) { return 'A book has ' + b + ' pages already read. If Meital reads ' + a + ' pages each day, after how many days will ' + c + ' total pages be read?'; },
    function (a, b, c, ans) { return 'A plant is ' + b + ' cm tall and grows ' + a + ' cm every week. After how many weeks will it be ' + c + ' cm tall?'; },
    function (a, b, c, ans) { return 'A store already sold $' + b + ' worth of shirts before noon, then sells $' + a + ' worth each hour. After how many hours will total sales reach $' + c + '?'; }
  ];
  function genWordToEq(diff) {
    var ans = diff === 1 ? randInt(1, 10) : diff === 2 ? randInt(1, 15) : randInt(2, 20);
    var a = diff === 1 ? randInt(5, 20) : diff === 2 ? randInt(5, 40) : randInt(3, 50);
    var b = diff === 1 ? randInt(0, 30) : diff === 2 ? randInt(0, 100) : randInt(0, 200);
    var c = a * ans + b;
    var story = randChoice(WORD_STORIES);
    return {
      prompt: story(a, b, c, ans),
      answer: ans, tolerance: 0.001,
      explanation: 'Equation: ' + a + 'x + ' + b + ' = ' + c + '  →  x = (' + c + ' - ' + b + ') ÷ ' + a + ' = ' + ans + '.'
    };
  }

  function genInequalities(diff) {
    var xAns, a, b;
    if (diff === 1) { xAns = randInt(-10, 10) || 1; a = randNonzero(2, 9); b = randInt(-15, 15); }
    else if (diff === 2) { xAns = randInt(-15, 15) || 1; a = randNonzero(2, 12); b = randInt(-25, 25); }
    else { xAns = randInt(-15, 15) || 1; a = randNonzero(-9, -2); b = randInt(-25, 25); }
    var c = a * xAns + b;
    var aStr = a === 1 ? 'x' : a === -1 ? '-x' : (a + 'x');
    var op = randChoice(['<', '>', '≤', '≥']);
    return {
      prompt: 'Solve: ' + aStr + ' ' + signedConstStr(b) + ' ' + op + ' ' + c + '. What is the boundary value of x (the value that separates true from false)?',
      answer: xAns, tolerance: 0.001,
      explanation: aStr + ' ' + signedConstStr(b) + ' ' + op + ' ' + c + '  →  x boundary = (' + c + ' - ' + b + ') ÷ ' + a + ' = ' + xAns + '.'
    };
  }

  // ---------- G: Geometry ----------
  function genCircles(diff) {
    if (diff === 1) {
      var r = randInt(2, 12);
      var askArea = Math.random() < 0.5;
      if (askArea) { var a = round2(PI * r * r); return { prompt: 'A circle has a radius of ' + r + ' cm. Using π ≈ 3.14, what is its AREA? (round to 2 decimals)', answer: a, tolerance: 0.15, explanation: 'Area = πr² = 3.14 × ' + r + '² = ' + a + ' cm².' }; }
      var c = round2(2 * PI * r); return { prompt: 'A circle has a radius of ' + r + ' cm. Using π ≈ 3.14, what is its CIRCUMFERENCE? (round to 2 decimals)', answer: c, tolerance: 0.15, explanation: 'Circumference = 2πr = 2 × 3.14 × ' + r + ' = ' + c + ' cm.' };
    } else if (diff === 2) {
      var d = randInt(4, 24), r2 = d / 2;
      var askArea2 = Math.random() < 0.5;
      if (askArea2) { var a2 = round2(PI * r2 * r2); return { prompt: 'A circle has a diameter of ' + d + ' cm. Using π ≈ 3.14, what is its AREA? (round to 2 decimals)', answer: a2, tolerance: 0.2, explanation: 'radius = ' + d + '/2 = ' + r2 + '. Area = 3.14 × ' + r2 + '² = ' + a2 + ' cm².' }; }
      var c2 = round2(PI * d); return { prompt: 'A circle has a diameter of ' + d + ' cm. Using π ≈ 3.14, what is its CIRCUMFERENCE? (round to 2 decimals)', answer: c2, tolerance: 0.2, explanation: 'Circumference = πd = 3.14 × ' + d + ' = ' + c2 + ' cm.' };
    } else {
      var r3 = randInt(3, 15);
      if (Math.random() < 0.5) {
        var c3 = round2(2 * PI * r3);
        return { prompt: 'A circle has a circumference of ' + c3 + ' cm. Using π ≈ 3.14, what is its radius? (round to 2 decimals)', answer: r3, tolerance: 0.15, explanation: 'radius = C ÷ (2π) = ' + c3 + ' ÷ ' + round2(2 * PI) + ' ≈ ' + r3 + ' cm.' };
      }
      var a3 = round2(PI * r3 * r3);
      return { prompt: 'A circle has an area of ' + a3 + ' cm². Using π ≈ 3.14, what is its radius? (round to 2 decimals)', answer: r3, tolerance: 0.2, explanation: 'radius = √(A ÷ π) = √(' + a3 + ' ÷ 3.14) ≈ ' + r3 + ' cm.' };
    }
  }

  function genCompositeArea(diff) {
    if (diff === 1) {
      var shape = randChoice(['triangle', 'parallelogram']);
      var b = randInt(3, 20), h = randInt(3, 20);
      var area = shape === 'triangle' ? round2(0.5 * b * h) : round2(b * h);
      return { prompt: 'A ' + shape + ' has a base of ' + b + ' cm and a height of ' + h + ' cm. What is its area, in cm²?', answer: area, tolerance: 0.1, explanation: shape === 'triangle' ? ('Area = ½ × base × height = ½ × ' + b + ' × ' + h + ' = ' + area + ' cm².') : ('Area = base × height = ' + b + ' × ' + h + ' = ' + area + ' cm².') };
    } else if (diff === 2) {
      var b1 = randInt(3, 20), b2 = randInt(3, 20), h2 = randInt(3, 20);
      var area2 = round2(0.5 * (b1 + b2) * h2);
      return { prompt: 'A trapezoid has parallel sides of ' + b1 + ' cm and ' + b2 + ' cm, and a height of ' + h2 + ' cm. What is its area, in cm²?', answer: area2, tolerance: 0.1, explanation: 'Area = ½ × (' + b1 + ' + ' + b2 + ') × ' + h2 + ' = ' + area2 + ' cm².' };
    } else {
      var w = randInt(4, 15), l = randInt(4, 15), th = randInt(3, 12);
      var total = round2(l * w + 0.5 * w * th);
      return { prompt: 'A composite figure is a rectangle ' + l + ' cm by ' + w + ' cm, with a triangle on top (base = ' + w + ' cm, height = ' + th + ' cm). What is the TOTAL area, in cm²?', answer: total, tolerance: 0.1, explanation: 'Rectangle area = ' + l + ' × ' + w + ' = ' + (l * w) + '. Triangle area = ½ × ' + w + ' × ' + th + ' = ' + round2(0.5 * w * th) + '. Total = ' + total + ' cm².' };
    }
  }

  function genVolumeSurface(diff) {
    if (diff === 1) {
      var l = randInt(2, 15), w = randInt(2, 15), h = randInt(2, 15);
      var v = l * w * h;
      return { prompt: 'A rectangular prism has length ' + l + ' cm, width ' + w + ' cm, and height ' + h + ' cm. What is its VOLUME, in cm³?', answer: v, tolerance: 0.5, explanation: 'Volume = l × w × h = ' + l + ' × ' + w + ' × ' + h + ' = ' + v + ' cm³.' };
    } else if (diff === 2) {
      var l2 = randInt(2, 15), w2 = randInt(2, 15), h2 = randInt(2, 15);
      var sa = 2 * (l2 * w2 + l2 * h2 + w2 * h2);
      return { prompt: 'A rectangular prism has length ' + l2 + ' cm, width ' + w2 + ' cm, and height ' + h2 + ' cm. What is its SURFACE AREA, in cm²?', answer: sa, tolerance: 0.5, explanation: 'SA = 2(lw + lh + wh) = 2(' + (l2 * w2) + ' + ' + (l2 * h2) + ' + ' + (w2 * h2) + ') = ' + sa + ' cm².' };
    } else {
      var b = randInt(2, 12), htri = randInt(2, 12), len = randInt(2, 12);
      var v2 = round2(0.5 * b * htri * len);
      return { prompt: 'A triangular prism has a triangular base with base ' + b + ' cm and height ' + htri + ' cm, and the prism length is ' + len + ' cm. What is its VOLUME, in cm³?', answer: v2, tolerance: 0.5, explanation: 'Volume = (½ × ' + b + ' × ' + htri + ') × ' + len + ' = ' + v2 + ' cm³.' };
    }
  }

  function genAngles(diff) {
    if (diff === 1) {
      var type = randChoice(['complementary', 'supplementary']);
      var a = type === 'complementary' ? randInt(10, 80) : randInt(20, 160);
      var other = type === 'complementary' ? 90 - a : 180 - a;
      return { prompt: 'Two angles are ' + type + '. One angle measures ' + a + '°. What is the measure of the other angle, in degrees?', answer: other, tolerance: 0.1, explanation: type === 'complementary' ? ('90 - ' + a + ' = ' + other + '°.') : ('180 - ' + a + ' = ' + other + '°.') };
    } else if (diff === 2) {
      var x = randNonzero(1, 12);
      var a2 = randInt(2, 9);
      var c2 = randInt(10, 170);
      var b2 = c2 - a2 * x;
      var aStr = a2 === 1 ? 'x' : (a2 + 'x');
      return { prompt: 'Two vertical angles measure (' + aStr + ' ' + signedConstStr(b2) + ')° and ' + c2 + '°. Vertical angles are equal. Solve for x.', answer: x, tolerance: 0.1, explanation: aStr + ' ' + signedConstStr(b2) + ' = ' + c2 + '  →  x = (' + c2 + ' - ' + b2 + ') ÷ ' + a2 + ' = ' + x + '.' };
    } else {
      var a3 = randInt(20, 110), b3 = randInt(20, 130 - a3 > 20 ? 130 - a3 : 20);
      if (a3 + b3 >= 175) b3 = Math.max(10, 170 - a3);
      var mode = Math.random() < 0.5 ? 'third' : 'exterior';
      if (mode === 'third') {
        var third = 180 - a3 - b3;
        return { prompt: 'A triangle has two angles measuring ' + a3 + '° and ' + b3 + '°. What is the measure of the third angle, in degrees?', answer: third, tolerance: 0.1, explanation: '180 - ' + a3 + ' - ' + b3 + ' = ' + third + '°.' };
      }
      var ext = a3 + b3;
      return { prompt: 'In a triangle, the two "remote interior" angles measure ' + a3 + '° and ' + b3 + '°. By the Exterior Angle Theorem, what is the measure of the exterior angle, in degrees?', answer: ext, tolerance: 0.1, explanation: 'Exterior angle = sum of remote interior angles = ' + a3 + ' + ' + b3 + ' = ' + ext + '°.' };
    }
  }

  // ---------- SP: Statistics & Probability ----------
  function genMeasuresCenter(diff) {
    if (diff === 1) {
      var nums = []; for (var i = 0; i < 5; i++) nums.push(randInt(1, 20));
      var ask = randChoice(['mean', 'range']);
      if (ask === 'mean') { var mean = round2(nums.reduce(function (s, v) { return s + v; }, 0) / nums.length); return { prompt: 'Find the MEAN of this data set: ' + nums.join(', ') + ' (round to 2 decimals)', answer: mean, tolerance: 0.02, explanation: 'Sum = ' + nums.reduce(function (s, v) { return s + v; }, 0) + '; Mean = sum ÷ 5 = ' + mean + '.' }; }
      var range = Math.max.apply(null, nums) - Math.min.apply(null, nums);
      return { prompt: 'Find the RANGE of this data set: ' + nums.join(', '), answer: range, tolerance: 0.001, explanation: 'Range = max - min = ' + Math.max.apply(null, nums) + ' - ' + Math.min.apply(null, nums) + ' = ' + range + '.' };
    } else if (diff === 2) {
      var n2 = 7; var nums2 = []; for (var j = 0; j < n2; j++) nums2.push(randInt(-10, 40));
      var ask2 = randChoice(['mean', 'median']);
      var sorted = nums2.slice().sort(function (a, b) { return a - b; });
      if (ask2 === 'mean') { var mean2 = round2(nums2.reduce(function (s, v) { return s + v; }, 0) / n2); return { prompt: 'Find the MEAN of this data set: ' + nums2.join(', ') + ' (round to 2 decimals)', answer: mean2, tolerance: 0.05, explanation: 'Sum = ' + nums2.reduce(function (s, v) { return s + v; }, 0) + '; Mean = sum ÷ ' + n2 + ' = ' + mean2 + '.' }; }
      var median2 = sorted[3];
      return { prompt: 'Find the MEDIAN of this data set: ' + nums2.join(', '), answer: median2, tolerance: 0.001, explanation: 'Sorted: ' + sorted.join(', ') + '. The middle value is ' + median2 + '.' };
    } else {
      var n3 = 5, M = randInt(5, 25), others = [], sum3 = 0;
      for (var k = 0; k < n3 - 1; k++) { var v = randInt(1, 30); others.push(v); sum3 += v; }
      var missing = M * n3 - sum3;
      var tries = 0;
      while ((missing < 0 || missing > 60) && tries < 20) {
        others = []; sum3 = 0;
        for (var k2 = 0; k2 < n3 - 1; k2++) { var v2 = randInt(1, 30); others.push(v2); sum3 += v2; }
        missing = M * n3 - sum3; tries++;
      }
      if (missing < 0) missing = Math.abs(missing);
      return { prompt: 'A data set has ' + n3 + ' numbers: ' + others.join(', ') + ', and an unknown value x. The MEAN of all ' + n3 + ' numbers is ' + M + '. What is x?', answer: missing, tolerance: 0.1, explanation: 'Total sum needed = ' + M + ' × ' + n3 + ' = ' + (M * n3) + '. x = ' + (M * n3) + ' - ' + sum3 + ' = ' + missing + '.' };
    }
  }

  function genSimpleProb(diff) {
    var colors = diff === 1 ? ['red', 'blue'] : diff === 2 ? ['red', 'blue', 'green'] : ['red', 'blue', 'green', 'yellow'];
    var counts = colors.map(function () { return randInt(2, diff === 3 ? 12 : 8); });
    var total = counts.reduce(function (s, v) { return s + v; }, 0);
    var targetIdx = randInt(0, colors.length - 1);
    var favorable = counts[targetIdx];
    var askComplement = diff === 3 && Math.random() < 0.5;
    var desc = colors.map(function (c, i) { return counts[i] + ' ' + c; }).join(', ');
    var num = askComplement ? (total - favorable) : favorable;
    var simp = simplifyFrac(num, total);
    var correctText = fracStr(simp[0], simp[1]);
    var wrong = [
      fracStr(favorable, total),
      fracStr(simplifyFrac(total - favorable, total)[0], simplifyFrac(total - favorable, total)[1]),
      fracStr(simplifyFrac(favorable + 1 > total ? favorable - 1 : favorable + 1, total)[0], simplifyFrac(favorable + 1 > total ? favorable - 1 : favorable + 1, total)[1])
    ];
    var mc = makeMC(correctText, wrong);
    var prompt = 'A bag has marbles: ' + desc + '. What is the probability of picking ' + (askComplement ? ('NOT ' + colors[targetIdx]) : colors[targetIdx]) + '? (as a simplified fraction)';
    return { prompt: prompt, choices: mc.choices, answer: mc.answer, type: 'mc', explanation: 'P = ' + num + '/' + total + ' = ' + correctText + ' in simplest form.' };
  }

  function genCompoundProb(diff) {
    var devices = diff === 1 ? [['a coin', 2], ['a coin', 2]]
      : diff === 2 ? [['a coin', 2], ['a 6-sided die', 6]]
      : [['a 6-sided die', 6], ['a 6-sided die', 6]];
    var d1 = devices[0], d2 = diff === 1 ? ['a coin', 2] : devices[1];
    var n1 = d1[1], n2 = d2[1];
    var total = n1 * n2;
    var simp = simplifyFrac(1, total);
    var correctText = fracStr(simp[0], simp[1]);
    var wrong = [fracStr(1, n1 + n2), fracStr(simplifyFrac(2, total)[0], simplifyFrac(2, total)[1]), fracStr(1, total > 2 ? total - 1 : total + 1)];
    var mc = makeMC(correctText, wrong);
    return {
      prompt: 'You flip/roll ' + d1[0] + ' and ' + d2[0] + ' at the same time. What is the probability of getting one SPECIFIC outcome from each (e.g. heads AND a chosen number)? (as a simplified fraction)',
      choices: mc.choices, answer: mc.answer, type: 'mc',
      explanation: 'P = (1/' + n1 + ') × (1/' + n2 + ') = 1/' + total + ' = ' + correctText + '.'
    };
  }

  function genDataCompare(diff) {
    var n = diff === 1 ? 4 : 5;
    var setA = [], setB = [];
    for (var i = 0; i < n; i++) { setA.push(randInt(1, diff === 3 ? 50 : 30)); setB.push(randInt(1, diff === 3 ? 50 : 30)); }
    var meanA = setA.reduce(function (s, v) { return s + v; }, 0) / n;
    var meanB = setB.reduce(function (s, v) { return s + v; }, 0) / n;
    if (diff === 3 && Math.random() < 0.5) {
      var rangeA = Math.max.apply(null, setA) - Math.min.apply(null, setA);
      var rangeB = Math.max.apply(null, setB) - Math.min.apply(null, setB);
      var diffR = Math.abs(rangeA - rangeB);
      return { prompt: 'Set A: ' + setA.join(', ') + '\nSet B: ' + setB.join(', ') + '\nBy how much do the RANGES of Set A and Set B differ?', answer: diffR, tolerance: 0.1, explanation: 'Range A = ' + rangeA + ', Range B = ' + rangeB + '. Difference = ' + diffR + '.' };
    }
    var diffM = round2(Math.abs(meanA - meanB));
    return { prompt: 'Set A: ' + setA.join(', ') + '\nSet B: ' + setB.join(', ') + '\nBy how much do the MEANS of Set A and Set B differ? (round to 2 decimals)', answer: diffM, tolerance: 0.05, explanation: 'Mean A = ' + round2(meanA) + ', Mean B = ' + round2(meanB) + '. Difference = ' + diffM + '.' };
  }

  var GENERATORS = {
    unit_rate: genUnitRate,
    proportional: genProportional,
    percent: genPercent,
    scale: genScale,
    add_sub_integers: genAddSub,
    mul_div_integers: genMulDiv,
    rational_ops: genRational,
    abs_value: genAbsValue,
    simplify_expr: genSimplifyExpr,
    two_step_eq: genTwoStepEq,
    word_to_eq: genWordToEq,
    inequalities: genInequalities,
    circles: genCircles,
    composite_area: genCompositeArea,
    volume_surface: genVolumeSurface,
    angles: genAngles,
    measures_center: genMeasuresCenter,
    simple_prob: genSimpleProb,
    compound_prob: genCompoundProb,
    data_compare: genDataCompare
  };

  function generateQuestion(skillId, difficulty) {
    var gen = GENERATORS[skillId];
    if (!gen) throw new Error('Unknown skill: ' + skillId);
    var q = gen(difficulty);
    q.skill = skillId;
    q.difficulty = difficulty;
    q.domain = SKILL_MAP[skillId].domain;
    if (!q.type) q.type = q.choices ? 'mc' : 'numeric';
    return q;
  }

  var Questions = {
    DOMAINS: DOMAINS,
    SKILLS: SKILLS,
    SKILL_MAP: SKILL_MAP,
    DOMAIN_MAP: DOMAIN_MAP,
    generateQuestion: generateQuestion,
    _util: { randInt: randInt, randChoice: randChoice, round2: round2 }
  };

  root.App = root.App || {};
  root.App.Questions = Questions;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Questions;
  }
})(typeof window !== 'undefined' ? window : global);
