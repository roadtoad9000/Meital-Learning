/* Visual models. For students with learning disabilities the picture IS the
   explanation, so every one of these is built to be read before the words are.
   Everything returns an inline SVG string and adapts to light/dark via CSS vars. */
(function (root) {
  var FILL = 'var(--viz-fill)';
  var FILL_B = 'var(--viz-fill-b)';
  var LINE = 'var(--viz-line)';
  var TEXT = 'var(--viz-text)';

  function wrap(inner, w, h, caption) {
    return '<div class="viz"><svg viewBox="0 0 ' + w + ' ' + h + '" ' +
      'width="100%" style="max-width:' + Math.min(w, 460) + 'px" role="img" aria-hidden="true">' + inner + '</svg>' +
      (caption ? '<div class="viz-caption">' + esc(caption) + '</div>' : '') + '</div>';
  }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function txt(x, y, s, size, anchor, weight) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + (size || 14) + '" text-anchor="' + (anchor || 'middle') +
      '" font-weight="' + (weight || 700) + '" fill="' + TEXT + '" font-family="system-ui,sans-serif">' + esc(s) + '</text>';
  }

  /* ---- Bar model: a rectangle cut into `den` equal parts, `num` of them shaded.
     This is the workhorse for fractions. ---- */
  function fractionBar(num, den, opts) {
    opts = opts || {};
    var W = 420, H = opts.height || 62, pad = 6;
    var barW = W - pad * 2;
    var seg = barW / den;
    var color = opts.color || FILL;
    var s = '';
    for (var i = 0; i < den; i++) {
      var filled = i < num;
      s += '<rect x="' + (pad + i * seg) + '" y="' + pad + '" width="' + seg + '" height="' + (H - pad * 2) + '" ' +
        'fill="' + (filled ? color : 'transparent') + '" stroke="' + LINE + '" stroke-width="2"/>';
    }
    var cap = opts.label === false ? null : (opts.label || (num + ' of ' + den + ' parts shaded = ' + num + '/' + den));
    return wrap(s, W, H, cap);
  }

  /* Two stacked bars, for comparing or adding fractions. */
  function fractionBars(rows, caption) {
    var W = 420, rowH = 54, pad = 6;
    var H = rows.length * (rowH + 24) + (caption ? 24 : 4);
    var s = '', y = 4;
    rows.forEach(function (r) {
      var seg = (W - pad * 2) / r.den;
      for (var i = 0; i < r.den; i++) {
        s += '<rect x="' + (pad + i * seg) + '" y="' + y + '" width="' + seg + '" height="' + rowH + '" ' +
          'fill="' + (i < r.num ? (r.color || FILL) : 'transparent') + '" stroke="' + LINE + '" stroke-width="2"/>';
      }
      s += txt(W / 2, y + rowH + 17, r.label || (r.num + '/' + r.den), 14);
      y += rowH + 24;
    });
    return wrap(s, W, H, caption);
  }

  /* ---- Number line. Essential for negatives, absolute value, and "which is bigger". ---- */
  function numberLine(min, max, opts) {
    opts = opts || {};
    var W = 440, H = 96, pad = 26;
    var span = max - min;
    var x = function (v) { return pad + ((v - min) / span) * (W - pad * 2); };
    var axisY = 54;
    var s = '<line x1="' + pad + '" y1="' + axisY + '" x2="' + (W - pad) + '" y2="' + axisY + '" stroke="' + LINE + '" stroke-width="2"/>';
    var stepEvery = span > 20 ? Math.ceil(span / 12) : 1;
    for (var v = min; v <= max; v += stepEvery) {
      var isZero = v === 0;
      s += '<line x1="' + x(v) + '" y1="' + (axisY - (isZero ? 10 : 6)) + '" x2="' + x(v) + '" y2="' + (axisY + (isZero ? 10 : 6)) +
        '" stroke="' + LINE + '" stroke-width="' + (isZero ? 3 : 2) + '"/>';
      s += txt(x(v), axisY + 26, String(v), 12, 'middle', isZero ? 800 : 500);
    }
    (opts.points || []).forEach(function (p) {
      s += '<circle cx="' + x(p.at) + '" cy="' + axisY + '" r="8" fill="' + (p.color || FILL) + '" stroke="' + LINE + '" stroke-width="2"/>';
      if (p.label) s += txt(x(p.at), axisY - 18, p.label, 14);
    });
    if (opts.jump) {
      var x1 = x(opts.jump.from), x2 = x(opts.jump.to);
      var mid = (x1 + x2) / 2;
      s += '<path d="M ' + x1 + ' ' + (axisY - 12) + ' Q ' + mid + ' ' + (axisY - 42) + ' ' + x2 + ' ' + (axisY - 12) +
        '" fill="none" stroke="' + FILL_B + '" stroke-width="3" marker-end="url(#vzarrow)"/>';
      s += txt(mid, axisY - 46, opts.jump.label || '', 13);
      s = '<defs><marker id="vzarrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">' +
        '<path d="M0,0 L0,6 L7,3 z" fill="' + FILL_B + '"/></marker></defs>' + s;
    }
    return wrap(s, W, H, opts.caption);
  }

  /* ---- Array model: rows x cols of dots. Makes multiplication concrete. ---- */
  function arrayModel(rows, cols, opts) {
    opts = opts || {};
    var maxDim = 12;
    if (rows > maxDim || cols > maxDim) return areaModel(cols, rows, opts);
    var cell = 26, pad = 30;
    var W = pad + cols * cell + 14, H = pad + rows * cell + 26;
    var s = '';
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        s += '<circle cx="' + (pad + c * cell + cell / 2) + '" cy="' + (pad + r * cell + cell / 2) + '" r="8" fill="' + FILL + '"/>';
      }
    }
    s += txt(pad + (cols * cell) / 2, 18, cols + ' across', 13);
    s += '<text x="12" y="' + (pad + (rows * cell) / 2) + '" font-size="13" font-weight="700" fill="' + TEXT +
      '" text-anchor="middle" transform="rotate(-90 12 ' + (pad + (rows * cell) / 2) + ')" font-family="system-ui,sans-serif">' + rows + ' down</text>';
    return wrap(s, W, H, opts.caption);
  }

  /* Area model: a labelled rectangle, optionally split to show partial products. */
  function areaModel(w, h, opts) {
    opts = opts || {};
    var W = 420, H = 190, pad = 34;
    var bw = W - pad * 2, bh = H - pad * 2 - 16;
    var s = '';
    if (opts.split) {
      var a = opts.split[0], b = opts.split[1];
      var frac = a / (a + b);
      s += '<rect x="' + pad + '" y="' + pad + '" width="' + (bw * frac) + '" height="' + bh + '" fill="' + FILL + '" fill-opacity="0.35" stroke="' + LINE + '" stroke-width="2"/>';
      s += '<rect x="' + (pad + bw * frac) + '" y="' + pad + '" width="' + (bw * (1 - frac)) + '" height="' + bh + '" fill="' + FILL_B + '" fill-opacity="0.35" stroke="' + LINE + '" stroke-width="2"/>';
      s += txt(pad + (bw * frac) / 2, pad + bh / 2 + 5, String(opts.leftLabel || (a * h)), 16);
      s += txt(pad + bw * frac + (bw * (1 - frac)) / 2, pad + bh / 2 + 5, String(opts.rightLabel || (b * h)), 16);
      s += txt(pad + (bw * frac) / 2, pad - 10, String(a), 13);
      s += txt(pad + bw * frac + (bw * (1 - frac)) / 2, pad - 10, String(b), 13);
    } else {
      s += '<rect x="' + pad + '" y="' + pad + '" width="' + bw + '" height="' + bh + '" fill="' + FILL + '" fill-opacity="0.3" stroke="' + LINE + '" stroke-width="2"/>';
      s += txt(pad + bw / 2, pad - 10, String(w), 14);
    }
    s += '<text x="' + (pad - 12) + '" y="' + (pad + bh / 2) + '" font-size="14" font-weight="700" fill="' + TEXT +
      '" text-anchor="middle" transform="rotate(-90 ' + (pad - 12) + ' ' + (pad + bh / 2) + ')" font-family="system-ui,sans-serif">' + h + '</text>';
    return wrap(s, W, H, opts.caption);
  }

  /* ---- Geometry shapes with labelled dimensions ---- */
  function rectShape(w, h, opts) {
    opts = opts || {};
    var W = 380, H = 200, pad = 40;
    var maxW = W - pad * 2, maxH = H - pad * 2 - 10;
    var scale = Math.min(maxW / Math.max(w, 1), maxH / Math.max(h, 1));
    var bw = Math.max(60, w * scale), bh = Math.max(40, h * scale);
    var x0 = (W - bw) / 2, y0 = 28;
    var s = '<rect x="' + x0 + '" y="' + y0 + '" width="' + bw + '" height="' + bh + '" fill="' + FILL + '" fill-opacity="0.28" stroke="' + LINE + '" stroke-width="2.5"/>';
    if (opts.grid) {
      for (var i = 1; i < w; i++) s += '<line x1="' + (x0 + (bw / w) * i) + '" y1="' + y0 + '" x2="' + (x0 + (bw / w) * i) + '" y2="' + (y0 + bh) + '" stroke="' + LINE + '" stroke-width="0.7" opacity="0.5"/>';
      for (var j = 1; j < h; j++) s += '<line x1="' + x0 + '" y1="' + (y0 + (bh / h) * j) + '" x2="' + (x0 + bw) + '" y2="' + (y0 + (bh / h) * j) + '" stroke="' + LINE + '" stroke-width="0.7" opacity="0.5"/>';
    }
    s += txt(x0 + bw / 2, y0 - 8, w + (opts.unit || ' cm'), 14);
    s += '<text x="' + (x0 - 12) + '" y="' + (y0 + bh / 2) + '" font-size="14" font-weight="700" fill="' + TEXT +
      '" text-anchor="middle" transform="rotate(-90 ' + (x0 - 12) + ' ' + (y0 + bh / 2) + ')" font-family="system-ui,sans-serif">' + h + (opts.unit || ' cm') + '</text>';
    return wrap(s, W, y0 + bh + 14, opts.caption);
  }

  function triangleShape(b, h, opts) {
    opts = opts || {};
    var W = 380, pad = 40;
    var scale = Math.min((W - pad * 2) / Math.max(b, 1), 130 / Math.max(h, 1));
    var bw = Math.max(90, b * scale), bh = Math.max(60, h * scale);
    var x0 = (W - bw) / 2, y0 = 22;
    var apexX = x0 + bw * 0.38;
    var s = '<polygon points="' + x0 + ',' + (y0 + bh) + ' ' + (x0 + bw) + ',' + (y0 + bh) + ' ' + apexX + ',' + y0 + '" ' +
      'fill="' + FILL + '" fill-opacity="0.28" stroke="' + LINE + '" stroke-width="2.5"/>';
    s += '<line x1="' + apexX + '" y1="' + y0 + '" x2="' + apexX + '" y2="' + (y0 + bh) + '" stroke="' + FILL_B + '" stroke-width="2" stroke-dasharray="5 4"/>';
    s += '<rect x="' + apexX + '" y="' + (y0 + bh - 10) + '" width="10" height="10" fill="none" stroke="' + FILL_B + '" stroke-width="1.5"/>';
    s += txt(x0 + bw / 2, y0 + bh + 20, 'base = ' + b + ' cm', 14);
    s += txt(apexX + 34, y0 + bh / 2, 'height', 12, 'start');
    s += txt(apexX + 34, y0 + bh / 2 + 15, '= ' + h + ' cm', 12, 'start');
    return wrap(s, W, y0 + bh + 32);
  }

  function circleShape(r, opts) {
    opts = opts || {};
    var W = 320, H = 220, cx = W / 2, cy = 105;
    var rad = Math.max(48, Math.min(88, r * 8));
    var s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + rad + '" fill="' + FILL + '" fill-opacity="0.22" stroke="' + LINE + '" stroke-width="2.5"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="3.5" fill="' + LINE + '"/>';
    if (opts.showDiameter) {
      s += '<line x1="' + (cx - rad) + '" y1="' + cy + '" x2="' + (cx + rad) + '" y2="' + cy + '" stroke="' + FILL_B + '" stroke-width="2.5"/>';
      s += txt(cx, cy - 10, 'diameter = ' + (opts.diameterLabel || r * 2), 14);
    } else {
      s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + rad) + '" y2="' + cy + '" stroke="' + FILL_B + '" stroke-width="2.5"/>';
      s += txt(cx + rad / 2, cy - 10, 'r = ' + r, 14);
    }
    return wrap(s, W, H, opts.caption);
  }

  /* ---- Percent bar: 10 blocks, shaded to show the percent ---- */
  function percentBar(pct, opts) {
    opts = opts || {};
    var W = 420, H = 74, pad = 6;
    var barW = W - pad * 2, blocks = 10, seg = barW / blocks;
    var filledBlocks = pct / 10;
    var s = '';
    for (var i = 0; i < blocks; i++) {
      var full = i + 1 <= filledBlocks;
      var partial = !full && i < filledBlocks;
      var fillW = full ? seg : (partial ? seg * (filledBlocks - i) : 0);
      s += '<rect x="' + (pad + i * seg) + '" y="10" width="' + seg + '" height="34" fill="transparent" stroke="' + LINE + '" stroke-width="1.6"/>';
      if (fillW > 0) s += '<rect x="' + (pad + i * seg) + '" y="10" width="' + fillW + '" height="34" fill="' + FILL + '"/>';
    }
    s += txt(pad, 62, '0%', 12, 'start');
    s += txt(W - pad, 62, '100%', 12, 'end');
    s += txt(pad + barW * (pct / 100), 62, pct + '%', 13);
    return wrap(s, W, H, opts.caption);
  }

  /* ---- Probability: a jar of coloured marbles you can literally count ---- */
  var MARBLE_COLORS = { red: '#e63946', blue: '#3a86ff', green: '#2a9d8f', yellow: '#f4a261', purple: '#8338ec' };
  function marbles(counts, opts) {
    opts = opts || {};
    var items = [];
    Object.keys(counts).forEach(function (c) {
      for (var i = 0; i < counts[c]; i++) items.push(c);
    });
    var perRow = Math.min(6, Math.max(4, Math.ceil(Math.sqrt(items.length))));
    var rows = Math.ceil(items.length / perRow);
    var cell = 44, pad = 16;
    var W = Math.max(240, pad * 2 + perRow * cell), H = pad * 2 + rows * cell + (opts.caption ? 22 : 0);
    var s = '<rect x="4" y="4" width="' + (W - 8) + '" height="' + (pad * 2 + rows * cell - 8) + '" rx="16" fill="none" stroke="' + LINE + '" stroke-width="2"/>';
    items.forEach(function (c, i) {
      var r = Math.floor(i / perRow), col = i % perRow;
      s += '<circle cx="' + (pad + col * cell + cell / 2) + '" cy="' + (pad + r * cell + cell / 2) + '" r="16" fill="' + (MARBLE_COLORS[c] || FILL) + '" stroke="' + LINE + '" stroke-width="1.5"/>';
    });
    return wrap(s, W, H, opts.caption);
  }

  /* ---- Bar chart for data sets ---- */
  function barChart(values, opts) {
    opts = opts || {};
    var W = 420, H = 190, pad = 30, base = H - 34;
    var max = Math.max.apply(null, values.concat([1]));
    var bw = (W - pad * 2) / values.length;
    var s = '<line x1="' + pad + '" y1="' + base + '" x2="' + (W - pad) + '" y2="' + base + '" stroke="' + LINE + '" stroke-width="2"/>';
    values.forEach(function (v, i) {
      var h = (v / max) * (base - 34);
      var x = pad + i * bw + bw * 0.16;
      s += '<rect x="' + x + '" y="' + (base - h) + '" width="' + bw * 0.68 + '" height="' + h + '" fill="' + FILL + '" rx="3"/>';
      s += txt(x + bw * 0.34, base - h - 6, String(v), 12);
      s += txt(x + bw * 0.34, base + 16, (opts.labels && opts.labels[i]) || String(i + 1), 11, 'middle', 500);
    });
    return wrap(s, W, H, opts.caption);
  }

  /* ---- Balance scale: both sides of an equation must stay equal ---- */
  function balance(leftLabel, rightLabel, opts) {
    opts = opts || {};
    var W = 400, H = 150;
    var s = '<line x1="40" y1="46" x2="360" y2="46" stroke="' + LINE + '" stroke-width="4" stroke-linecap="round"/>';
    s += '<path d="M200 46 L200 104 M170 116 L230 116" stroke="' + LINE + '" stroke-width="4" fill="none" stroke-linecap="round"/>';
    s += '<path d="M170 116 L200 104 L230 116 Z" fill="' + LINE + '" opacity="0.25"/>';
    [[120, leftLabel], [280, rightLabel]].forEach(function (p) {
      s += '<rect x="' + (p[0] - 62) + '" y="50" width="124" height="42" rx="10" fill="' + FILL + '" fill-opacity="0.28" stroke="' + LINE + '" stroke-width="2"/>';
      s += txt(p[0], 77, p[1], 17);
    });
    s += txt(200, 40, '=', 20);
    return wrap(s, W, H, opts.caption);
  }

  /* ---- Ratio / double number line table ---- */
  function ratioTable(rows, opts) {
    opts = opts || {};
    var W = 400, rowH = 38, H = rows.length * rowH + 14;
    var s = '';
    rows.forEach(function (r, i) {
      var y = 6 + i * rowH;
      s += '<rect x="6" y="' + y + '" width="' + (W - 12) + '" height="' + rowH + '" fill="' + (i === 0 ? FILL : 'transparent') + '" fill-opacity="' + (i === 0 ? 0.22 : 1) + '" stroke="' + LINE + '" stroke-width="1.6"/>';
      s += '<line x1="' + (W / 2) + '" y1="' + y + '" x2="' + (W / 2) + '" y2="' + (y + rowH) + '" stroke="' + LINE + '" stroke-width="1.6"/>';
      s += txt(W / 4, y + 25, String(r[0]), 15);
      s += txt(W * 0.75, y + 25, String(r[1]), 15);
    });
    return wrap(s, W, H);
  }

  root.App = root.App || {};
  root.App.Visuals = {
    fractionBar: fractionBar,
    fractionBars: fractionBars,
    numberLine: numberLine,
    arrayModel: arrayModel,
    areaModel: areaModel,
    rectShape: rectShape,
    triangleShape: triangleShape,
    circleShape: circleShape,
    percentBar: percentBar,
    marbles: marbles,
    barChart: barChart,
    balance: balance,
    ratioTable: ratioTable,
    MARBLE_COLORS: MARBLE_COLORS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.App.Visuals;
})(typeof window !== 'undefined' ? window : global);
