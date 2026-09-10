/* The squishy collection.

   Modelled on what kids actually collect: mochi animal squishies (cat, panda,
   bunny, chick, koala, penguin, frog), food characters (boba pearl, dumpling,
   soufflé pancake, peach, donut) and the Nee Doh line (fuzz ball, nice cube).

   Four rarity tiers, so there is always a better one visible just ahead. Both
   apps feed the same collection: every math level mastered AND every typing
   level completed unlocks the next squishy. */
(function (root) {

  var TIERS = {
    common: { name: 'Common', color: '#8ecae6', glow: null, order: 0 },
    rare: { name: 'Rare', color: '#06d6a0', glow: null, order: 1 },
    epic: { name: 'Epic', color: '#b56bff', glow: 'sparkle', order: 2 },
    legendary: { name: 'LEGENDARY', color: '#ffd166', glow: 'holo', order: 3 }
  };

  // ---------- kawaii face parts (100x100 viewBox) ----------
  function eyes(y, spread, r) {
    y = y || 52; spread = spread || 15; r = r || 4.2;
    return '<circle cx="' + (50 - spread) + '" cy="' + y + '" r="' + r + '" fill="#2b2b3a"/>' +
      '<circle cx="' + (50 + spread) + '" cy="' + y + '" r="' + r + '" fill="#2b2b3a"/>' +
      '<circle cx="' + (50 - spread + 1.4) + '" cy="' + (y - 1.4) + '" r="' + (r * 0.34) + '" fill="#fff"/>' +
      '<circle cx="' + (50 + spread + 1.4) + '" cy="' + (y - 1.4) + '" r="' + (r * 0.34) + '" fill="#fff"/>';
  }
  function blush(y, spread) {
    y = y || 61; spread = spread || 25;
    return '<ellipse cx="' + (50 - spread) + '" cy="' + y + '" rx="6" ry="3.6" fill="#ff8fab" opacity=".62"/>' +
      '<ellipse cx="' + (50 + spread) + '" cy="' + y + '" rx="6" ry="3.6" fill="#ff8fab" opacity=".62"/>';
  }
  function smile(y) {
    y = y || 62;
    return '<path d="M44 ' + y + ' q6 6 12 0" stroke="#2b2b3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
  }
  function catMouth(y) {
    y = y || 62;
    return '<path d="M44 ' + y + ' q3 4 6 0 q3 4 6 0" stroke="#2b2b3a" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
  }
  function face(o) {
    o = o || {};
    return eyes(o.eyeY, o.spread, o.eyeR) + blush(o.blushY, o.blushSpread) +
      (o.cat ? catMouth(o.mouthY) : smile(o.mouthY));
  }
  // squishy mochi body
  function mochi(fill, stroke) {
    return '<path d="M50 20 C74 20 88 36 88 55 C88 74 72 85 50 85 C28 85 12 74 12 55 C12 36 26 20 50 20 Z" ' +
      'fill="' + fill + '" stroke="' + (stroke || 'rgba(0,0,0,.16)') + '" stroke-width="2"/>';
  }
  function shine() {
    return '<ellipse cx="34" cy="34" rx="9" ry="5.5" fill="#fff" opacity=".38" transform="rotate(-24 34 34)"/>';
  }

  // ---------- the catalog ----------
  var CATALOG = [
    // ---- TIER 1: mochi animals ----
    { id: 'cat', name: 'Mochi Cat', tier: 'common', art: function () {
      return '<path d="M28 30 L26 14 L42 24 Z" fill="#f6f2ff" stroke="rgba(0,0,0,.16)" stroke-width="2"/>' +
        '<path d="M72 30 L74 14 L58 24 Z" fill="#f6f2ff" stroke="rgba(0,0,0,.16)" stroke-width="2"/>' +
        mochi('#f6f2ff') + shine() + face({ cat: true }) +
        '<path d="M22 58 h10 M22 63 h10 M78 58 h-10 M78 63 h-10" stroke="#2b2b3a" stroke-width="1.6" opacity=".45" stroke-linecap="round"/>'; } },
    { id: 'panda', name: 'Mochi Panda', tier: 'common', art: function () {
      return '<circle cx="28" cy="26" r="10" fill="#2b2b3a"/><circle cx="72" cy="26" r="10" fill="#2b2b3a"/>' +
        mochi('#ffffff') + shine() +
        '<ellipse cx="35" cy="52" rx="9" ry="10" fill="#2b2b3a"/><ellipse cx="65" cy="52" rx="9" ry="10" fill="#2b2b3a"/>' +
        '<circle cx="35" cy="52" r="3.4" fill="#fff"/><circle cx="65" cy="52" r="3.4" fill="#fff"/>' +
        blush(64, 27) + smile(64); } },
    { id: 'bunny', name: 'Mochi Bunny', tier: 'common', art: function () {
      return '<ellipse cx="36" cy="16" rx="7" ry="17" fill="#ffe0ec" stroke="rgba(0,0,0,.14)" stroke-width="2"/>' +
        '<ellipse cx="64" cy="16" rx="7" ry="17" fill="#ffe0ec" stroke="rgba(0,0,0,.14)" stroke-width="2"/>' +
        '<ellipse cx="36" cy="17" rx="3" ry="11" fill="#ffb3c9"/><ellipse cx="64" cy="17" rx="3" ry="11" fill="#ffb3c9"/>' +
        mochi('#fff5f8') + shine() + face({ cat: true }); } },
    { id: 'chick', name: 'Mochi Chick', tier: 'common', art: function () {
      return mochi('#ffe066') + shine() + eyes(50, 14) +
        '<path d="M46 60 L54 60 L50 67 Z" fill="#ff9f1c"/>' + blush(60, 26); } },
    { id: 'pig', name: 'Mochi Pig', tier: 'common', art: function () {
      return '<path d="M26 32 L24 20 L38 26 Z" fill="#ffb3c9"/><path d="M74 32 L76 20 L62 26 Z" fill="#ffb3c9"/>' +
        mochi('#ffc2d4') + shine() + eyes(49, 15) +
        '<ellipse cx="50" cy="62" rx="11" ry="8" fill="#ff8fab"/>' +
        '<circle cx="46" cy="62" r="2" fill="#c9184a"/><circle cx="54" cy="62" r="2" fill="#c9184a"/>' + blush(56, 28); } },
    { id: 'frog', name: 'Mochi Frog', tier: 'common', art: function () {
      return '<circle cx="32" cy="27" r="12" fill="#95d5b2" stroke="rgba(0,0,0,.14)" stroke-width="2"/>' +
        '<circle cx="68" cy="27" r="12" fill="#95d5b2" stroke="rgba(0,0,0,.14)" stroke-width="2"/>' +
        '<circle cx="32" cy="27" r="5" fill="#2b2b3a"/><circle cx="68" cy="27" r="5" fill="#2b2b3a"/>' +
        '<circle cx="33.6" cy="25" r="1.8" fill="#fff"/><circle cx="69.6" cy="25" r="1.8" fill="#fff"/>' +
        mochi('#b7e4c7') + shine() + blush(60, 26) +
        '<path d="M38 58 q12 10 24 0" stroke="#2b2b3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>'; } },
    { id: 'penguin', name: 'Mochi Penguin', tier: 'common', art: function () {
      return mochi('#3d5a80') + '<ellipse cx="50" cy="60" rx="21" ry="24" fill="#fff"/>' + shine() +
        eyes(48, 12) + '<path d="M45 57 L55 57 L50 64 Z" fill="#ff9f1c"/>' + blush(58, 27); } },
    { id: 'bear', name: 'Mochi Bear', tier: 'common', art: function () {
      return '<circle cx="27" cy="27" r="11" fill="#c98b5e"/><circle cx="73" cy="27" r="11" fill="#c98b5e"/>' +
        '<circle cx="27" cy="27" r="5.5" fill="#e8b48c"/><circle cx="73" cy="27" r="5.5" fill="#e8b48c"/>' +
        mochi('#deab7f') + shine() + eyes(50, 14) +
        '<ellipse cx="50" cy="62" rx="10" ry="8" fill="#f2d5bd"/>' +
        '<ellipse cx="50" cy="58" rx="4" ry="3" fill="#2b2b3a"/>' + smile(64); } },
    { id: 'koala', name: 'Mochi Koala', tier: 'common', art: function () {
      return '<circle cx="22" cy="34" r="14" fill="#adb5bd"/><circle cx="78" cy="34" r="14" fill="#adb5bd"/>' +
        '<circle cx="22" cy="34" r="8" fill="#ced4da"/><circle cx="78" cy="34" r="8" fill="#ced4da"/>' +
        mochi('#c5ccd4') + shine() + eyes(50, 14) +
        '<ellipse cx="50" cy="61" rx="7" ry="6" fill="#2b2b3a"/>' + blush(58, 28); } },
    { id: 'duck', name: 'Duck Dumpling', tier: 'common', art: function () {
      return mochi('#ffe8a3') + shine() + eyes(48, 13) +
        '<ellipse cx="50" cy="62" rx="12" ry="6" fill="#ff9f1c"/>' +
        '<path d="M40 62 q10 5 20 0" stroke="#e07a00" stroke-width="1.4" fill="none"/>' + blush(56, 28); } },
    { id: 'dino', name: 'Mochi Dino', tier: 'common', art: function () {
      return '<path d="M34 22 l5 -9 l5 9 z M46 19 l5 -9 l5 9 z M58 22 l5 -9 l5 9 z" fill="#80ed99"/>' +
        mochi('#57cc99') + shine() + eyes(50, 14) + blush(60, 26) + smile(62); } },
    { id: 'sheep', name: 'Cloud Sheep', tier: 'common', art: function () {
      return '<circle cx="26" cy="38" r="12" fill="#fff"/><circle cx="74" cy="38" r="12" fill="#fff"/>' +
        '<circle cx="34" cy="24" r="12" fill="#fff"/><circle cx="66" cy="24" r="12" fill="#fff"/>' +
        '<circle cx="50" cy="20" r="13" fill="#fff"/>' +
        mochi('#f8f3ee') + shine() + eyes(52, 13) + blush(60, 24) + smile(63); } },

    // ---- TIER 2: food + Nee Doh ----
    { id: 'peach', name: 'Blushing Peach', tier: 'rare', art: function () {
      return '<path d="M50 22 q-4 -10 -14 -12 q10 -2 14 6 q4 -8 14 -6 q-10 2 -14 12z" fill="#70c18c"/>' +
        '<path d="M50 24 C74 24 88 40 88 57 C88 76 70 86 50 86 C30 86 12 76 12 57 C12 40 26 24 50 24 Z" fill="#ffb3a7"/>' +
        '<path d="M50 26 q-6 30 0 58" stroke="#ff8c85" stroke-width="2.5" fill="none" opacity=".7"/>' +
        shine() + face({ eyeY: 54, blushY: 63, spread: 14 }); } },
    { id: 'strawberry', name: 'Strawberry', tier: 'rare', art: function () {
      var seeds = '';
      [[34, 52], [66, 52], [30, 66], [70, 66], [50, 74], [42, 60], [58, 60]].forEach(function (p) {
        seeds += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="1.8" ry="2.8" fill="#ffe066"/>';
      });
      return '<path d="M36 26 l14 -6 l14 6 l-6 8 h-16 z" fill="#70c18c"/>' +
        '<path d="M50 30 C74 30 86 44 86 58 C86 76 68 88 50 88 C32 88 14 76 14 58 C14 44 26 30 50 30 Z" fill="#ef476f"/>' +
        seeds + shine() + face({ eyeY: 56, blushY: 65, spread: 14 }); } },
    { id: 'donut', name: 'Sprinkle Donut', tier: 'rare', art: function () {
      var sp = '';
      [[30, 40, -20], [64, 34, 30], [76, 58, 60], [24, 62, 10], [50, 26, 0], [40, 76, 40], [66, 74, -30]].forEach(function (p) {
        sp += '<rect x="' + p[0] + '" y="' + p[1] + '" width="7" height="2.8" rx="1.4" fill="hsl(' + ((p[0] * 7) % 360) + ',85%,62%)" transform="rotate(' + p[2] + ' ' + p[0] + ' ' + p[1] + ')"/>';
      });
      return '<circle cx="50" cy="52" r="38" fill="#e8b48c"/>' +
        '<path d="M50 14 a38 38 0 1 1 -0.1 0z" fill="#ffb3d9"/>' +
        '<circle cx="50" cy="52" r="38" fill="none" stroke="#e8b48c" stroke-width="0"/>' +
        sp + '<circle cx="50" cy="52" r="12" fill="var(--card,#fff)" stroke="#e8b48c" stroke-width="2"/>' +
        eyes(44, 20) + blush(52, 28); } },
    { id: 'avocado', name: 'Avocado', tier: 'rare', art: function () {
      return '<path d="M50 16 C70 16 84 38 84 58 C84 76 68 88 50 88 C32 88 16 76 16 58 C16 38 30 16 50 16 Z" fill="#5a8f3d"/>' +
        '<path d="M50 24 C66 24 76 40 76 57 C76 72 64 81 50 81 C36 81 24 72 24 57 C24 40 34 24 50 24 Z" fill="#c9e265"/>' +
        '<ellipse cx="50" cy="60" rx="14" ry="16" fill="#a9713a"/>' + shine() +
        eyes(44, 15) + blush(50, 26); } },
    { id: 'boba', name: 'Boba Pearl', tier: 'rare', art: function () {
      return '<path d="M28 26 h44 l-6 56 a4 4 0 0 1 -4 4 h-24 a4 4 0 0 1 -4 -4 z" fill="#e8d3bd" stroke="rgba(0,0,0,.14)" stroke-width="2"/>' +
        '<rect x="24" y="20" width="52" height="8" rx="4" fill="#fff" stroke="rgba(0,0,0,.14)" stroke-width="2"/>' +
        '<rect x="56" y="4" width="6" height="22" rx="3" fill="#ff8fab" transform="rotate(14 59 15)"/>' +
        '<circle cx="40" cy="72" r="5" fill="#3d2b1f"/><circle cx="52" cy="76" r="5" fill="#3d2b1f"/><circle cx="62" cy="70" r="5" fill="#3d2b1f"/>' +
        eyes(48, 11, 3.6) + blush(56, 20) + smile(56); } },
    { id: 'toast', name: 'Butter Toast', tier: 'rare', art: function () {
      return '<path d="M22 34 q0 -16 14 -16 q4 -10 14 -10 q10 0 14 10 q14 0 14 16 v40 a6 6 0 0 1 -6 6 h-44 a6 6 0 0 1 -6 -6 z" fill="#f2c078" stroke="rgba(0,0,0,.14)" stroke-width="2"/>' +
        '<path d="M30 40 q0 -10 10 -10 q3 -7 10 -7 q7 0 10 7 q10 0 10 10 v30 h-40 z" fill="#ffe8b8"/>' +
        '<rect x="40" y="36" width="20" height="12" rx="2" fill="#ffd166" transform="rotate(-8 50 42)"/>' +
        eyes(58, 13) + blush(66, 24) + smile(68); } },
    { id: 'banana', name: 'Banana', tier: 'rare', art: function () {
      return '<path d="M22 26 q4 44 38 54 q22 6 22 -6 q-2 -8 -16 -10 q-26 -6 -32 -40 q-2 -8 -12 2z" fill="#ffe066" stroke="rgba(0,0,0,.14)" stroke-width="2"/>' +
        '<path d="M28 30 q6 34 32 44" stroke="#f2c078" stroke-width="2.5" fill="none" opacity=".6"/>' +
        eyes(58, 11, 3.6) + blush(65, 19) + smile(65); } },
    { id: 'mushroom', name: 'Mushroom', tier: 'rare', art: function () {
      return '<path d="M12 50 q0 -32 38 -32 q38 0 38 32 z" fill="#ef476f"/>' +
        '<circle cx="30" cy="36" r="6" fill="#fff"/><circle cx="56" cy="30" r="7" fill="#fff"/><circle cx="70" cy="42" r="5" fill="#fff"/>' +
        '<path d="M32 50 h36 v22 q0 12 -18 12 q-18 0 -18 -12 z" fill="#ffe8d6" stroke="rgba(0,0,0,.12)" stroke-width="2"/>' +
        eyes(64, 11, 3.6) + blush(71, 19) + smile(71); } },
    { id: 'fuzzball', name: 'Fuzz Ball', tier: 'rare', art: function () {
      var fz = '';
      for (var i = 0; i < 26; i++) {
        var a = (i / 26) * Math.PI * 2;
        fz += '<line x1="' + (50 + Math.cos(a) * 33) + '" y1="' + (52 + Math.sin(a) * 33) + '" x2="' +
          (50 + Math.cos(a) * 42) + '" y2="' + (52 + Math.sin(a) * 42) + '" stroke="#4cc9f0" stroke-width="3" stroke-linecap="round"/>';
      }
      return fz + '<circle cx="50" cy="52" r="33" fill="#4cc9f0"/>' + shine() +
        eyes(48, 13) + blush(58, 22) + smile(60); } },
    { id: 'nicecube', name: 'Nice Cube', tier: 'rare', art: function () {
      return '<path d="M24 30 h44 a8 8 0 0 1 8 8 v34 a8 8 0 0 1 -8 8 h-44 a8 8 0 0 1 -8 -8 v-34 a8 8 0 0 1 8 -8z" fill="#a0e7f5" stroke="rgba(0,0,0,.14)" stroke-width="2"/>' +
        '<path d="M24 30 l8 -10 h44 l-8 10z" fill="#c9f2fa"/>' +
        '<path d="M76 38 l8 -10 v34 l-8 10z" fill="#7fd6e8"/>' +
        shine() + eyes(52, 13) + blush(61, 22) + smile(62); } },

    // ---- TIER 3: epic ----
    { id: 'axolotl', name: 'Axolotl', tier: 'epic', art: function () {
      return '<path d="M18 40 l-12 -10 M18 48 l-14 0 M18 56 l-12 10" stroke="#ff8fab" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M82 40 l12 -10 M82 48 l14 0 M82 56 l12 10" stroke="#ff8fab" stroke-width="5" stroke-linecap="round"/>' +
        mochi('#ffc2d4') + shine() + eyes(50, 15) + blush(60, 27) + catMouth(61); } },
    { id: 'unicorn', name: 'Unicorn', tier: 'epic', art: function () {
      return '<path d="M50 4 l7 20 h-14z" fill="#ffd166" stroke="#f2a900" stroke-width="1.5"/>' +
        '<path d="M28 30 q-8 -14 4 -18 q2 10 10 12z" fill="#ff8fab"/>' +
        '<path d="M72 30 q8 -14 -4 -18 q-2 10 -10 12z" fill="#a0e7f5"/>' +
        mochi('#fff5fb') + shine() + eyes(52, 15) + blush(61, 27) + smile(63); } },
    { id: 'shiba', name: 'Shiba Inu', tier: 'epic', art: function () {
      return '<path d="M26 30 L22 12 L40 24 Z" fill="#e8a44c"/><path d="M74 30 L78 12 L60 24 Z" fill="#e8a44c"/>' +
        mochi('#f2b366') + '<ellipse cx="50" cy="66" rx="20" ry="16" fill="#fff8f0"/>' + shine() +
        eyes(48, 16) + '<ellipse cx="50" cy="60" rx="4.5" ry="3.4" fill="#2b2b3a"/>' +
        '<path d="M42 68 q8 7 16 0" stroke="#2b2b3a" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        blush(58, 30); } },
    { id: 'pancake', name: 'Soufflé Pancake', tier: 'epic', art: function () {
      return '<ellipse cx="50" cy="74" rx="34" ry="10" fill="#e8a44c"/>' +
        '<ellipse cx="50" cy="64" rx="33" ry="10" fill="#f2c078"/>' +
        '<ellipse cx="50" cy="54" rx="32" ry="10" fill="#ffd9a0"/>' +
        '<path d="M22 50 q10 8 28 6 q18 -2 28 -6 v4 q-10 8 -28 8 q-18 0 -28 -8z" fill="#c97b3c" opacity=".5"/>' +
        '<rect x="42" y="34" width="16" height="12" rx="2" fill="#ffe066" transform="rotate(-6 50 40)"/>' +
        eyes(58, 13, 3.6) + blush(66, 22); } },
    { id: 'dumpling', name: 'Lil Dumpling', tier: 'epic', art: function () {
      return '<path d="M16 62 q0 -34 34 -34 q34 0 34 34 q0 14 -34 14 q-34 0 -34 -14z" fill="#fff5e6" stroke="rgba(0,0,0,.14)" stroke-width="2"/>' +
        '<path d="M16 60 q8 -10 12 0 q8 -10 14 0 q8 -10 14 0 q8 -10 14 0 q8 -10 14 0" fill="none" stroke="#e8d3bd" stroke-width="3" stroke-linecap="round"/>' +
        shine() + eyes(50, 13) + blush(59, 23) + smile(60); } },
    { id: 'icecream', name: 'Ice Cream', tier: 'epic', art: function () {
      return '<path d="M32 52 h36 l-14 34 a4 4 0 0 1 -8 0z" fill="#e8b06a"/>' +
        '<path d="M34 56 l30 22 M40 56 l24 16 M32 66 l24 16" stroke="#c9843c" stroke-width="1.6" opacity=".7"/>' +
        '<circle cx="36" cy="40" r="16" fill="#ffb3d9"/><circle cx="64" cy="40" r="16" fill="#a0e7f5"/>' +
        '<circle cx="50" cy="28" r="16" fill="#fff5b8"/>' +
        '<circle cx="50" cy="12" r="5" fill="#ef476f"/>' +
        eyes(44, 13, 3.6) + blush(51, 22) + smile(51); } },
    { id: 'cupcake', name: 'Cupcake', tier: 'epic', art: function () {
      return '<path d="M28 52 h44 l-6 30 a6 6 0 0 1 -6 5 h-20 a6 6 0 0 1 -6 -5z" fill="#f2c078"/>' +
        '<path d="M36 52 l-2 35 M50 52 v35 M64 52 l2 35" stroke="#e0a45c" stroke-width="2"/>' +
        '<path d="M24 52 q0 -26 26 -26 q26 0 26 26z" fill="#ffb3d9"/>' +
        '<circle cx="50" cy="20" r="6" fill="#ef476f"/>' +
        '<circle cx="34" cy="40" r="2.4" fill="#fff"/><circle cx="66" cy="40" r="2.4" fill="#fff"/><circle cx="50" cy="34" r="2.4" fill="#fff"/>' +
        eyes(62, 13, 3.6) + blush(70, 22) + smile(70); } },
    { id: 'sushi', name: 'Sushi', tier: 'epic', art: function () {
      return '<path d="M18 56 q0 -12 32 -12 q32 0 32 12 v14 q0 8 -32 8 q-32 0 -32 -8z" fill="#fff8f0" stroke="rgba(0,0,0,.12)" stroke-width="2"/>' +
        '<path d="M20 50 q0 -18 30 -18 q30 0 30 18 q0 8 -30 8 q-30 0 -30 -8z" fill="#ff8fab"/>' +
        '<path d="M26 44 q24 -8 48 0" stroke="#ffb3c9" stroke-width="3" fill="none"/>' +
        '<rect x="40" y="40" width="20" height="38" rx="3" fill="#2f4858"/>' +
        eyes(62, 15, 3.6) + blush(70, 26); } },

    // ---- TIER 4: legendary ----
    { id: 'galaxy', name: 'Galaxy Blob', tier: 'legendary', art: function () {
      var stars = '';
      [[30, 40], [66, 34], [72, 62], [36, 68], [50, 30], [58, 72], [24, 56]].forEach(function (p, i) {
        stars += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (1.4 + (i % 3) * 0.7) + '" fill="#fff"/>';
      });
      return '<defs><radialGradient id="gx"><stop offset="0%" stop-color="#7c5cff"/><stop offset="60%" stop-color="#3a0ca3"/><stop offset="100%" stop-color="#10002b"/></radialGradient></defs>' +
        mochi('url(#gx)') + stars + shine() + eyes(52, 15) + blush(61, 27) + smile(63); } },
    { id: 'rainbowcloud', name: 'Rainbow Cloud', tier: 'legendary', art: function () {
      var bands = '';
      ['#ef476f', '#ffa62b', '#ffd166', '#06d6a0', '#4cc9f0', '#b56bff'].forEach(function (c, i) {
        bands += '<rect x="' + (26 + i * 8) + '" y="70" width="6" height="22" rx="3" fill="' + c + '"/>';
      });
      return bands + '<circle cx="30" cy="52" r="15" fill="#fff"/><circle cx="70" cy="52" r="15" fill="#fff"/>' +
        '<circle cx="50" cy="42" r="20" fill="#fff"/><rect x="28" y="50" width="44" height="18" rx="9" fill="#fff"/>' +
        eyes(50, 13) + blush(58, 23) + smile(59); } },
    { id: 'star', name: 'Glitter Star', tier: 'legendary', art: function () {
      return '<defs><linearGradient id="stg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffe066"/><stop offset="100%" stop-color="#ffa62b"/></linearGradient></defs>' +
        '<path d="M50 8 L61 38 L94 38 L67 57 L77 88 L50 69 L23 88 L33 57 L6 38 L39 38 Z" fill="url(#stg)" stroke="#f2a900" stroke-width="2"/>' +
        '<circle cx="34" cy="30" r="1.8" fill="#fff"/><circle cx="70" cy="46" r="2.2" fill="#fff"/><circle cx="44" cy="74" r="1.6" fill="#fff"/>' +
        eyes(48, 12) + blush(56, 21) + smile(57); } },
    { id: 'holoaxo', name: 'Holo Axolotl', tier: 'legendary', art: function () {
      return '<defs><linearGradient id="ho" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#a0e7f5"/><stop offset="35%" stop-color="#ffb3d9"/>' +
        '<stop offset="70%" stop-color="#d0a6ff"/><stop offset="100%" stop-color="#ffe066"/></linearGradient></defs>' +
        '<path d="M18 40 l-12 -10 M18 48 l-14 0 M18 56 l-12 10" stroke="url(#ho)" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M82 40 l12 -10 M82 48 l14 0 M82 56 l12 10" stroke="url(#ho)" stroke-width="6" stroke-linecap="round"/>' +
        mochi('url(#ho)') + shine() + eyes(50, 15) + blush(60, 27) + catMouth(61); } },
    { id: 'goldendoh', name: 'Golden Nee Doh', tier: 'legendary', art: function () {
      var fz = '';
      for (var i = 0; i < 30; i++) {
        var a = (i / 30) * Math.PI * 2;
        fz += '<line x1="' + (50 + Math.cos(a) * 32) + '" y1="' + (52 + Math.sin(a) * 32) + '" x2="' +
          (50 + Math.cos(a) * 43) + '" y2="' + (52 + Math.sin(a) * 43) + '" stroke="#ffd166" stroke-width="3.2" stroke-linecap="round"/>';
      }
      return '<defs><radialGradient id="gd"><stop offset="0%" stop-color="#fff3b0"/><stop offset="100%" stop-color="#f2a900"/></radialGradient></defs>' +
        fz + '<circle cx="50" cy="52" r="32" fill="url(#gd)"/>' + shine() +
        eyes(48, 13) + blush(58, 22) + smile(60); } },
    { id: 'crystalheart', name: 'Crystal Heart', tier: 'legendary', art: function () {
      return '<defs><linearGradient id="ch" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#ffb3d9"/><stop offset="100%" stop-color="#ef476f"/></linearGradient></defs>' +
        '<path d="M50 86 C18 62 12 44 12 36 C12 22 24 14 34 14 C42 14 48 20 50 26 C52 20 58 14 66 14 C76 14 88 22 88 36 C88 44 82 62 50 86 Z" fill="url(#ch)"/>' +
        '<path d="M34 26 q-10 4 -12 16" stroke="#fff" stroke-width="4" opacity=".55" fill="none" stroke-linecap="round"/>' +
        eyes(46, 15) + blush(56, 26) + smile(57); } }
  ];

  var BY_ID = {};
  CATALOG.forEach(function (s, i) { s.index = i; BY_ID[s.id] = s; });

  /* Render one squishy. `locked` shows a teasing silhouette instead. */
  function render(id, opts) {
    opts = opts || {};
    var sq = BY_ID[id];
    if (!sq) return '';
    var tier = TIERS[sq.tier];
    var cls = 'sq sq-' + sq.tier + (opts.locked ? ' locked' : '') + (opts.big ? ' big' : '');
    var inner = opts.locked
      ? mochi('var(--border)') + '<text x="50" y="62" text-anchor="middle" font-size="30" fill="var(--text-soft)">?</text>'
      : sq.art();
    return '<div class="' + cls + '" data-sq="' + sq.id + '" title="' + (opts.locked ? 'Still locked' : sq.name + ' · ' + tier.name) + '">' +
      '<svg viewBox="0 0 100 100" width="100%">' + inner + '</svg>' +
      (opts.showName ? '<div class="sq-name">' + (opts.locked ? '???' : sq.name) + '</div>' : '') +
      (opts.showTier && !opts.locked ? '<div class="sq-tier" style="color:' + tier.color + '">' + tier.name + '</div>' : '') +
      '</div>';
  }

  root.App = root.App || {};
  root.App.Squishies = { CATALOG: CATALOG, TIERS: TIERS, BY_ID: BY_ID, render: render, total: CATALOG.length };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.App.Squishies;
})(typeof window !== 'undefined' ? window : global);
