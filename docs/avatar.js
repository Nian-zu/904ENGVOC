/* 永中904 人物造型：依 avatar-items.json 的部件 id 畫出 SVG 頭像（全部是原創的簡單扁平造型）。
   用法：AV.load().then(() => el.innerHTML = AV.svg(cfg, {size: 96}))
   cfg = {skin, hair, hc, eyes, mouth, top, tc, acc, pet, bg}（缺的部位用預設） */
(function () {
  const AV = {items: null, map: {}};
  AV.load = function (base) {
    if (AV._p) return AV._p;
    AV._p = fetch((base || '') + 'avatar-items.json').then(r => r.json()).then(j => {
      AV.items = j;
      j.cats.forEach(c => { AV.map[c.key] = {}; c.items.forEach(it => { AV.map[c.key][it.id] = it; }); });
      return j;
    });
    return AV._p;
  };
  const col = (k, id, fb) => (AV.map[k] && AV.map[k][id] && AV.map[k][id].c) || fb;
  AV.norm = function (cfg) {
    const d = (AV.items && AV.items.default) || {};
    const o = {};
    Object.keys(d).forEach(k => { o[k] = cfg && AV.map[k] && AV.map[k][cfg[k]] ? cfg[k] : d[k]; });
    return o;
  };
  // 等級
  AV.need = n => (AV.items ? AV.items.levels.base : 15) * n * (n - 1);   // 升到第 n 級需要的累計經驗
  AV.level = xp => { let n = 1; while (n < 50 && xp >= AV.need(n + 1)) n++; return n; };
  AV.title = lv => { let t = ''; ((AV.items && AV.items.levels.titles) || []).forEach(([l, name]) => { if (lv >= l) t = name; }); return t; };

  const shade = (hex, f) => {   // f<0 變暗，f>0 變亮
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255;
    const m = v => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
    return '#' + ((1 << 24) + (m(r) << 16) + (m(g) << 8) + m(b)).toString(16).slice(1);
  };

  // ---------- 頭髮（back：畫在頭後面；front：畫在臉上面）
  const HAIR = {
    short: {front: 'M35 54 Q33 26 60 24 Q87 26 85 54 Q82 40 71 37 Q61 43 48 37 Q39 41 35 54Z'},
    buzz: {front: 'M37 47 Q39 28 60 27 Q81 28 83 47 Q73 37 60 37 Q47 37 37 47Z'},
    side: {front: 'M35 56 Q31 24 62 23 Q89 26 85 52 Q83 35 66 34 Q54 41 41 41 Q37 47 35 56Z'},
    spiky: {front: 'M35 53 L33 34 L42 36 L43 21 L52 31 L58 16 L64 30 L73 19 L75 32 L85 28 L85 53 Q79 39 60 39 Q43 39 35 53Z'},
    bob: {back: 'M31 58 Q29 22 60 22 Q91 22 89 58 L89 76 Q81 81 77 72 L77 52 L43 52 L43 72 Q39 81 31 76Z',
      front: 'M36 50 Q36 27 60 26 Q84 27 84 50 Q75 40 60 42 Q45 40 36 50Z'},
    long: {back: 'M31 56 Q29 21 60 21 Q91 21 89 56 L93 106 L74 102 L77 60 L43 60 L46 102 L27 106Z',
      front: 'M35 55 Q33 25 60 24 Q87 25 85 55 Q80 37 64 35 Q55 44 40 44 Q37 48 35 55Z'},
    ponytail: {back: 'M78 34 Q104 34 100 66 Q98 82 90 88 Q94 66 84 52Z',
      front: 'M35 53 Q33 25 60 24 Q87 25 85 53 Q80 38 60 37 Q42 38 35 53Z', tie: true},
    buns: {back: 'M39 24 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M81 24 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0',
      front: 'M35 52 Q34 26 60 25 Q86 26 85 52 Q79 38 60 38 Q41 38 35 52Z'},
    curly: {back: 'M30 60 a9 9 0 0 1 0 -16 a10 10 0 0 1 6 -16 a10 10 0 0 1 14 -10 a11 11 0 0 1 20 0 a10 10 0 0 1 14 10 a10 10 0 0 1 6 16 a9 9 0 0 1 0 16Z',
      front: 'M36 46 a7 7 0 0 1 8 -10 a8 8 0 0 1 12 -4 a8 8 0 0 1 12 2 a8 8 0 0 1 10 6 a7 7 0 0 1 6 8 Q72 38 60 38 Q46 38 36 46Z'},
    wavy: {back: 'M31 56 Q29 21 60 21 Q91 21 89 56 Q95 66 90 76 Q96 86 90 98 Q84 104 76 100 Q80 90 76 82 L77 60 L43 60 L44 82 Q40 90 44 100 Q36 104 30 98 Q24 86 30 76 Q25 66 31 56Z',
      front: 'M35 55 Q33 25 60 24 Q87 25 85 55 Q78 40 70 37 Q60 46 50 38 Q41 42 35 55Z'},
    mohawk: {front: 'M52 40 L50 14 Q60 8 70 14 L68 40 Q60 36 52 40Z M37 50 Q40 40 50 38 L52 40 Q44 42 37 50Z M83 50 Q80 40 70 38 L68 40 Q76 42 83 50Z'},
    none: {}
  };

  // ---------- 眼睛
  const EYES = {
    dot: '<ellipse cx="51" cy="56" rx="2.8" ry="3.4" fill="#2b2523"/><ellipse cx="69" cy="56" rx="2.8" ry="3.4" fill="#2b2523"/>',
    happy: '<path d="M47 57 Q51 52 55 57 M65 57 Q69 52 73 57" stroke="#2b2523" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    big: '<ellipse cx="51" cy="56" rx="4.2" ry="5" fill="#2b2523"/><ellipse cx="69" cy="56" rx="4.2" ry="5" fill="#2b2523"/><circle cx="52.6" cy="54.2" r="1.6" fill="#fff"/><circle cx="70.6" cy="54.2" r="1.6" fill="#fff"/>',
    wink: '<ellipse cx="51" cy="56" rx="2.8" ry="3.4" fill="#2b2523"/><path d="M65 56 Q69 52 73 56" stroke="#2b2523" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    cool: '<path d="M46 55 L56 55 M64 55 L74 55" stroke="#2b2523" stroke-width="2.6" stroke-linecap="round"/><path d="M47 50 L55 52 M73 50 L65 52" stroke="#2b2523" stroke-width="1.8" stroke-linecap="round"/>',
    lash: '<ellipse cx="51" cy="56" rx="2.9" ry="3.5" fill="#2b2523"/><ellipse cx="69" cy="56" rx="2.9" ry="3.5" fill="#2b2523"/><path d="M47.5 53.5 L45.5 51.5 M49.5 52.6 L48.6 50 M72.5 53.5 L74.5 51.5 M70.5 52.6 L71.4 50" stroke="#2b2523" stroke-width="1.4" stroke-linecap="round"/>',
    sleepy: '<path d="M47 56 Q51 60 55 56 M65 56 Q69 60 73 56" stroke="#2b2523" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M46.5 55 L55.5 55 M64.5 55 L73.5 55" stroke="#2b2523" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>',
    round: '<circle cx="51" cy="56.5" r="2" fill="#2b2523"/><circle cx="69" cy="56.5" r="2" fill="#2b2523"/>',
    heart: '<path d="M51 60 L46.6 55.6 A2.6 2.6 0 0 1 51 52.6 A2.6 2.6 0 0 1 55.4 55.6Z M69 60 L64.6 55.6 A2.6 2.6 0 0 1 69 52.6 A2.6 2.6 0 0 1 73.4 55.6Z" fill="#e2445f"/>',
    galaxy: '<circle cx="51" cy="56" r="4.6" fill="#3a2a7a"/><circle cx="69" cy="56" r="4.6" fill="#3a2a7a"/><circle cx="51" cy="56" r="2.6" fill="#7b5ce0"/><circle cx="69" cy="56" r="2.6" fill="#7b5ce0"/><circle cx="52.6" cy="54.2" r="1.3" fill="#fff"/><circle cx="70.6" cy="54.2" r="1.3" fill="#fff"/><circle cx="49.6" cy="57.6" r=".7" fill="#fff"/><circle cx="67.6" cy="57.6" r=".7" fill="#fff"/>',
    star: '<path d="M51 51 l1.6 3.4 3.6.4 -2.7 2.4 .8 3.6 -3.3 -1.9 -3.3 1.9 .8 -3.6 -2.7 -2.4 3.6 -.4Z M69 51 l1.6 3.4 3.6.4 -2.7 2.4 .8 3.6 -3.3 -1.9 -3.3 1.9 .8 -3.6 -2.7 -2.4 3.6 -.4Z" fill="#f2b705" stroke="#2b2523" stroke-width=".8"/>'
  };
  const MOUTH = {
    smile: '<path d="M53 66 Q60 72 67 66" stroke="#7a3b2e" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
    grin: '<path d="M52 65 Q60 75 68 65Z" fill="#7a3b2e"/><path d="M53.5 65.6 L66.5 65.6 L65.5 67.4 L54.5 67.4Z" fill="#fff"/>',
    o: '<ellipse cx="60" cy="68" rx="3.2" ry="3.8" fill="#7a3b2e"/>',
    tongue: '<path d="M53 66 Q60 72 67 66" stroke="#7a3b2e" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M58 69 Q60 74 63 69Z" fill="#e26d7d"/>',
    cat: '<path d="M54 66 Q57 69 60 66 Q63 69 66 66" stroke="#7a3b2e" stroke-width="2" fill="none" stroke-linecap="round"/>',
    flat: '<path d="M54 67.5 L66 67.5" stroke="#7a3b2e" stroke-width="2.2" stroke-linecap="round"/>',
    teeth: '<path d="M50 64 Q60 64 70 64 Q68 77 60 77 Q52 77 50 64Z" fill="#7a3b2e"/><path d="M51.5 64.6 L68.5 64.6 L67.8 67.4 L52.2 67.4Z" fill="#fff"/><path d="M55 74 Q60 71 65 74 Q60 77 55 74Z" fill="#e26d7d"/>',
    pout: '<path d="M56.5 67.5 Q58 64.5 60 66 Q62 64.5 63.5 67.5 Q60 70.5 56.5 67.5Z" fill="#d9657a"/>'
  };
  // 臉型：輪廓與耳朵位置
  const FACE = {
    round: {d: 'M35 57 a25 25 0 1 0 50 0 a25 25 0 1 0 -50 0Z', ear: [35, 85]},
    oval: {d: 'M60 28 Q81 28 81 54 Q81 84 60 85 Q39 84 39 54 Q39 28 60 28Z', ear: [39, 81]},
    long: {d: 'M60 26 Q80 26 80 50 L80 66 Q79 88 60 89 Q41 88 40 66 L40 50 Q40 26 60 26Z', ear: [40, 80]},
    square: {d: 'M35 48 Q35 31 52 30 L68 30 Q85 31 85 48 L85 70 Q85 81 74 82 L46 82 Q35 81 35 70Z', ear: [35, 85]},
    heart: {d: 'M34 48 Q34 28 60 28 Q86 28 86 48 Q86 64 74 76 Q66 84 60 87 Q54 84 46 76 Q34 64 34 48Z', ear: [34, 86]},
    diamond: {d: 'M60 28 Q72 28 78 40 Q86 54 82 64 Q76 80 60 87 Q44 80 38 64 Q34 54 42 40 Q48 28 60 28Z', ear: [37, 83]},
    pear: {d: 'M60 30 Q76 30 80 42 Q86 54 87 66 Q87 83 60 83 Q33 83 33 66 Q34 54 40 42 Q44 30 60 30Z', ear: [36, 84]},
    chubby: {d: 'M60 31 Q84 31 87 52 Q90 70 78 79 Q70 84 60 84 Q50 84 42 79 Q30 70 33 52 Q36 31 60 31Z', ear: [33, 87]}
  };
  const BROW = {
    soft: ['M46 48 Q51 45 56 47 M64 47 Q69 45 74 48', 2], thick: ['M46 48 Q51 44.5 56 47 M64 47 Q69 44.5 74 48', 3.8],
    thin: ['M46.5 48 Q51 46 55.5 47.5 M64.5 47.5 Q69 46 73.5 48', 1.2], arch: ['M46 49 Q51 42.5 56 46 M64 46 Q69 42.5 74 49', 2.2],
    worry: ['M46 46 Q51 46 56 49.5 M64 49.5 Q69 46 74 46', 2.2], angry: ['M46 45 L56 49 M64 49 L74 45', 2.8]
  };
  function nose(id, skin) {
    const d = shade(skin, -0.28);
    switch (id) {
      case 'button': return `<circle cx="60" cy="61.5" r="2.7" fill="${shade(skin, -0.14)}"/>`;
      case 'line': return `<path d="M60.5 57 Q58 62 61.5 63.2" stroke="${d}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
      case 'pointy': return `<path d="M60.5 55.5 L57.5 63 L62 63" stroke="${d}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      case 'none': return '';
      default: return `<ellipse cx="60" cy="62" rx="1.7" ry="1.2" fill="${d}"/>`;
    }
  }
  function cheek(id, skin) {
    switch (id) {
      case 'none': return '';
      case 'whisker': return '<path d="M38 61 L47 62.5 M37.5 65 L47 64.8 M39 69 L47.5 67 M82 61 L73 62.5 M82.5 65 L73 64.8 M81 69 L72.5 67" stroke="#5a4636" stroke-width="1.1" stroke-linecap="round"/><ellipse cx="45" cy="64" rx="4" ry="2.4" fill="#f08a8a" opacity=".3"/><ellipse cx="75" cy="64" rx="4" ry="2.4" fill="#f08a8a" opacity=".3"/>';
      case 'freckle': return [[44, 62], [47, 64], [43, 65.5], [76, 62], [73, 64], [77, 65.5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".95" fill="${shade(skin, -0.38)}"/>`).join('');
      case 'dimple': return `<path d="M51 65.5 Q52 67.5 51.2 69 M69 65.5 Q68 67.5 68.8 69" stroke="${shade(skin, -0.3)}" stroke-width="1.2" fill="none" stroke-linecap="round"/><ellipse cx="45" cy="64" rx="4" ry="2.4" fill="#f08a8a" opacity=".25"/><ellipse cx="75" cy="64" rx="4" ry="2.4" fill="#f08a8a" opacity=".25"/>`;
      case 'sticker': return '<path d="M76 59.5 l1.4 2.9 3.2.4 -2.4 2.2 .6 3.1 -2.8 -1.6 -2.8 1.6 .6 -3.1 -2.4 -2.2 3.2 -.4Z" fill="#f2c94c" stroke="#d9a21a" stroke-width=".6"/><ellipse cx="45" cy="64" rx="4" ry="2.4" fill="#f08a8a" opacity=".3"/>';
      case 'band': return '<g transform="rotate(-25 76 63)"><rect x="70" y="60.5" width="12" height="5" rx="2.4" fill="#f3d2a8" stroke="#d9b07a" stroke-width=".6"/><rect x="74.3" y="61.3" width="3.4" height="3.4" rx=".6" fill="#e7bd8c"/></g><ellipse cx="45" cy="64" rx="4" ry="2.4" fill="#f08a8a" opacity=".3"/>';
      default: return '<ellipse cx="45" cy="64" rx="4" ry="2.4" fill="#f08a8a" opacity=".35"/><ellipse cx="75" cy="64" rx="4" ry="2.4" fill="#f08a8a" opacity=".35"/>';
    }
  }

  // ---------- 衣服（c = 衣服顏色）
  const BODY = 'M18 122 Q20 93 44 87 L76 87 Q100 93 102 122Z';
  function top(id, c, skin) {
    const d = shade(c, -0.25), l = shade(c, 0.35);
    const base = `<path d="${BODY}" fill="${c}"/>`;
    const neck = `<path d="M53 76 L67 76 L67 89 Q60 93 53 89Z" fill="${skin}"/>`;
    switch (id) {
      case 'uniform': return neck + `<path d="${BODY}" fill="${c}"/><path d="M48 87 L60 100 L72 87 L76 87 L62 104 L58 104 L44 87Z" fill="${shade(c, -0.12)}"/><path d="M60 100 L57 122 L63 122Z" fill="#2c4a7a"/><circle cx="60" cy="110" r="0" />`;
      case 'hoodie': return `<path d="M38 92 Q36 74 60 74 Q84 74 82 92Z" fill="${d}"/>` + neck + base + `<path d="M46 88 Q60 100 74 88" stroke="${d}" stroke-width="3" fill="none"/><path d="M54 96 L53 108 M66 96 L67 108" stroke="${l}" stroke-width="1.6" stroke-linecap="round"/><path d="M48 112 L72 112 L70 122 L50 122Z" fill="${d}" opacity=".5"/>`;
      case 'jersey': return neck + base + `<path d="M44 87 Q36 96 32 108 L22 104 Q26 92 44 87Z M76 87 Q84 96 88 108 L98 104 Q94 92 76 87Z" fill="${l}"/><path d="M50 87 Q60 96 70 87" stroke="${l}" stroke-width="3" fill="none"/><text x="60" y="116" font-size="16" font-weight="900" text-anchor="middle" fill="${l}" font-family="Arial,sans-serif">9</text>`;
      case 'sweater': return neck + base + `<path d="M48 87 L60 101 L72 87" stroke="${d}" stroke-width="3" fill="none"/><path d="M24 106 L96 106 M22 114 L98 114" stroke="${l}" stroke-width="2.6"/>`;
      case 'jacket': return neck + `<path d="${BODY}" fill="${c}"/><path d="M50 87 L60 122 L70 87Z" fill="#f4f4f2"/><path d="M50 87 L58 104 L54 122 L44 122 Z M70 87 L62 104 L66 122 L76 122Z" fill="${d}" opacity=".55"/><circle cx="64" cy="112" r="1.4" fill="${d}"/>`;
      case 'suit': return neck + `<path d="${BODY}" fill="${c === '#f1f1ee' ? '#2a2a2e' : c}"/><path d="M48 87 L60 106 L72 87Z" fill="#fff"/><path d="M58 92 L62 92 L64 112 L60 117 L56 112Z" fill="#c8473a"/><path d="M48 87 L56 108 L46 100 Z M72 87 L64 108 L74 100Z" fill="#1a1a1d" opacity=".55"/>`;
      case 'robe': return `<path d="M14 122 Q14 86 40 82 L80 82 Q106 86 106 122Z" fill="${c}"/>` + neck + `<path d="M44 84 L60 120 L76 84" stroke="#f2c94c" stroke-width="3" fill="none"/><path d="M30 108 l2 4 4 .5 -3 2.5 1 4 -4 -2 -4 2 1 -4 -3 -2.5 4 -.5Z M88 100 l1.6 3 3 .4 -2.3 2 .7 3 -3 -1.6 -3 1.6 .7 -3 -2.3 -2 3 -.4Z" fill="#f2c94c"/>`;
      case 'armor': return neck + `<path d="${BODY}" fill="#aeb4ba"/><path d="M24 104 Q60 96 96 104" stroke="#7d848b" stroke-width="2" fill="none"/><path d="M44 87 Q32 88 26 100 Q36 96 46 96Z M76 87 Q88 88 94 100 Q84 96 74 96Z" fill="#d4d8dc"/><path d="M60 92 L66 100 L60 114 L54 100Z" fill="${c}"/>`;
      case 'cape': return `<path d="M30 88 Q8 104 10 122 L110 122 Q112 104 90 88Z" fill="#c8473a"/>` + neck + base + `<path d="M60 96 l3.2 6.6 7.2.9 -5.3 4.9 1.4 7.1 -6.5 -3.6 -6.5 3.6 1.4 -7.1 -5.3 -4.9 7.2 -.9Z" fill="#f2c94c" stroke="${d}" stroke-width=".8"/>`;
      case 'champion': return neck + `<path d="${BODY}" fill="${c}"/><path d="M50 87 L60 122 L70 87Z" fill="#f4f4f2"/><path d="M44 87 L52 122 M76 87 L68 122" stroke="#f2c94c" stroke-width="3"/><path d="M30 104 l2.2 4.4 4.8.6 -3.5 3.3 .9 4.7 -4.4 -2.4 -4.4 2.4 .9 -4.7 -3.5 -3.3 4.8 -.6Z" fill="#f2c94c"/><path d="M18 122 Q20 100 30 94" stroke="#f2c94c" stroke-width="2.5" fill="none"/>`;
      case 'space': return neck + `<path d="${BODY}" fill="#eef1f4"/><path d="M42 84 Q60 94 78 84 L80 90 Q60 100 40 90Z" fill="#9aa4ae"/><rect x="66" y="100" width="18" height="11" rx="2" fill="#3b6fd1"/><circle cx="71" cy="105.5" r="1.6" fill="#f2c94c"/><circle cx="77" cy="105.5" r="1.6" fill="#e2445f"/><path d="M30 110 L44 110" stroke="#c8473a" stroke-width="3" stroke-linecap="round"/>`;
      case 'detective': return neck + `<path d="${BODY}" fill="#b98f5e"/><path d="M48 87 L58 104 L52 122 L44 122Z M72 87 L62 104 L68 122 L76 122Z" fill="#9c7647"/><path d="M50 87 L60 104 L70 87Z" fill="#f4f4f2"/><path d="M22 112 L98 112" stroke="#6b4f2e" stroke-width="4"/><rect x="56" y="109" width="8" height="6" rx="1" fill="none" stroke="#d9b45a" stroke-width="1.6"/>`;
      default: return neck + base + `<path d="M50 87 Q60 96 70 87" stroke="${d}" stroke-width="3" fill="none"/>`;   // tee
    }
  }

  // ---------- 配件
  function acc(id, hc) {
    switch (id) {
      case 'glasses': return '<g fill="none" stroke="#2b2523" stroke-width="2"><circle cx="51" cy="56" r="6.5"/><circle cx="69" cy="56" r="6.5"/><path d="M57.5 56 L62.5 56 M44.5 55 L37 52 M75.5 55 L83 52"/></g>';
      case 'sunglasses': return '<path d="M42 51 L58 51 Q58 61 50 61 Q42 61 42 51Z M62 51 L78 51 Q78 61 70 61 Q62 61 62 51Z" fill="#1c1c22"/><path d="M58 53 L62 53 M42 52 L36 50 M78 52 L84 50" stroke="#1c1c22" stroke-width="2"/><path d="M45 53 L49 53" stroke="#fff" stroke-width="1.2" opacity=".6"/>';
      case 'bow': return '<path d="M78 28 L90 20 L92 34Z M78 28 L66 22 L68 36Z" fill="#e65a7f"/><circle cx="79" cy="28" r="3.4" fill="#c43c62"/>';
      case 'flower': return '<g transform="translate(80 30)"><circle r="3.6" cx="0" cy="-5" fill="#fff"/><circle r="3.6" cx="4.8" cy="-1.5" fill="#fff"/><circle r="3.6" cx="3" cy="4" fill="#fff"/><circle r="3.6" cx="-3" cy="4" fill="#fff"/><circle r="3.6" cx="-4.8" cy="-1.5" fill="#fff"/><circle r="2.8" fill="#f2c94c"/></g>';
      case 'cap': return '<path d="M34 44 Q34 20 60 20 Q86 20 86 44Z" fill="#c8473a"/><path d="M60 40 Q90 38 102 46 Q88 48 60 46Z" fill="#a8382d"/><circle cx="60" cy="21" r="2.4" fill="#a8382d"/>';
      case 'headphones': return '<path d="M32 56 Q30 18 60 18 Q90 18 88 56" stroke="#2a2a2e" stroke-width="4.5" fill="none"/><rect x="27" y="48" width="10" height="17" rx="4" fill="#3b6fd1"/><rect x="83" y="48" width="10" height="17" rx="4" fill="#3b6fd1"/>';
      case 'beanie': return '<path d="M33 46 Q33 16 60 16 Q87 16 87 46Z" fill="#2a6b52"/><rect x="31" y="40" width="58" height="9" rx="4" fill="#1f5240"/><circle cx="60" cy="14" r="5" fill="#f1f1ee"/>';
      case 'wizard': return '<path d="M30 42 Q60 34 90 42 L66 0 Q62 -2 60 4Z" fill="#4a3a8c"/><path d="M26 42 Q60 32 94 42 Q60 50 26 42Z" fill="#372b6b"/><path d="M58 22 l1.6 3.2 3.4.4 -2.5 2.3.7 3.4 -3.2 -1.8 -3.2 1.8.7 -3.4 -2.5 -2.3 3.4 -.4Z" fill="#f2c94c"/>';
      case 'crown': return '<path d="M38 34 L42 14 L51 26 L60 10 L69 26 L78 14 L82 34Z" fill="#f2c94c" stroke="#b98a12" stroke-width="1.4"/><circle cx="60" cy="27" r="2.6" fill="#c8473a"/><circle cx="47" cy="29" r="2" fill="#3b6fd1"/><circle cx="73" cy="29" r="2" fill="#3fa66b"/>';
      case 'halo': return '<ellipse cx="60" cy="14" rx="20" ry="5.5" fill="none" stroke="#f7d35c" stroke-width="3.5"/><ellipse cx="60" cy="14" rx="20" ry="5.5" fill="none" stroke="#fff6c9" stroke-width="1.2"/>';
      case 'gradcap': return '<path d="M30 26 L60 14 L90 26 L60 38Z" fill="#23232b"/><path d="M42 31 L42 40 Q60 47 78 40 L78 31 L60 38Z" fill="#33333d"/><path d="M84 28 L86 44" stroke="#f2c94c" stroke-width="2"/><circle cx="86" cy="46" r="2.6" fill="#f2c94c"/>';
      case 'laurel': return '<g fill="#5fae5a">' + [0, 1, 2, 3, 4].map(i => `<ellipse cx="${38 + i * 3}" cy="${40 - i * 5}" rx="5" ry="2.4" transform="rotate(${-50 + i * 12} ${38 + i * 3} ${40 - i * 5})"/><ellipse cx="${82 - i * 3}" cy="${40 - i * 5}" rx="5" ry="2.4" transform="rotate(${50 - i * 12} ${82 - i * 3} ${40 - i * 5})"/>`).join('') + '</g><circle cx="60" cy="19" r="2.6" fill="#f2c94c"/>';
      case 'pencil': return '<g transform="rotate(-35 86 46)"><rect x="80" y="43" width="22" height="5" rx="1" fill="#f2c94c"/><path d="M102 43 L108 45.5 L102 48Z" fill="#f3d2a8"/><path d="M106 44.6 L108 45.5 L106 46.4Z" fill="#2b2523"/><rect x="77" y="43" width="4" height="5" fill="#e26d7d"/></g>';
      case 'medal': return '<path d="M50 86 L56 100 M70 86 L64 100" stroke="#3b6fd1" stroke-width="4"/><circle cx="60" cy="104" r="7" fill="#f2c94c" stroke="#c9971a" stroke-width="1.5"/><path d="M60 100 l1.2 2.4 2.6.3 -1.9 1.8.5 2.6 -2.4 -1.3 -2.4 1.3.5 -2.6 -1.9 -1.8 2.6 -.3Z" fill="#fff6c9"/>';
      case 'bandana': return '<path d="M35 44 Q36 26 60 25 Q84 26 85 44 Q60 36 35 44Z" fill="#c8473a"/><circle cx="48" cy="33" r="1.4" fill="#fff"/><circle cx="62" cy="30" r="1.4" fill="#fff"/><circle cx="74" cy="35" r="1.4" fill="#fff"/><path d="M84 40 Q94 42 98 50 Q90 48 86 46Z M84 42 Q92 50 92 58 Q86 52 84 46Z" fill="#a8382d"/>';
      default: return '';
    }
  }

  // ---------- 寵物（在 0–100 的格子裡畫，之後縮小放在右下角）
  function pet(id) {
    const eye = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r || 4}" fill="#2b2523"/><circle cx="${x + 1.3}" cy="${y - 1.3}" r="1.3" fill="#fff"/>`;
    switch (id) {
      case 'cat': return `<path d="M22 40 L28 10 L46 30 Z M78 40 L72 10 L54 30Z" fill="#f2a65a"/><circle cx="50" cy="56" r="34" fill="#f2a65a"/><path d="M26 18 L30 34 L38 30Z M74 18 L70 34 L62 30Z" fill="#f7c9a0"/>${eye(38, 52)}${eye(62, 52)}<path d="M46 64 L54 64 L50 68Z" fill="#e26d7d"/><path d="M20 62 L36 64 M20 70 L36 68 M80 62 L64 64 M80 70 L64 68" stroke="#7a4b2a" stroke-width="1.6"/>`;
      case 'dog': return `<circle cx="50" cy="56" r="33" fill="#c8a27a"/><path d="M18 30 Q8 60 22 72 Q30 52 30 36Z M82 30 Q92 60 78 72 Q70 52 70 36Z" fill="#7a5233"/>${eye(38, 50)}${eye(62, 50)}<ellipse cx="50" cy="66" rx="13" ry="10" fill="#efe1cf"/><ellipse cx="50" cy="61" rx="5" ry="3.6" fill="#2b2523"/><path d="M50 65 L50 70 Q46 74 43 71 M50 70 Q54 74 57 71" stroke="#2b2523" stroke-width="1.6" fill="none"/>`;
      case 'rabbit': return `<ellipse cx="36" cy="20" rx="9" ry="24" fill="#f4f1ee"/><ellipse cx="64" cy="20" rx="9" ry="24" fill="#f4f1ee"/><ellipse cx="36" cy="20" rx="4" ry="17" fill="#f3b7c6"/><ellipse cx="64" cy="20" rx="4" ry="17" fill="#f3b7c6"/><circle cx="50" cy="62" r="30" fill="#f4f1ee" stroke="#ddd6cf" stroke-width="1.5"/>${eye(39, 58)}${eye(61, 58)}<path d="M47 68 L53 68 L50 71Z" fill="#e26d7d"/><circle cx="32" cy="70" r="4" fill="#f3b7c6" opacity=".7"/><circle cx="68" cy="70" r="4" fill="#f3b7c6" opacity=".7"/>`;
      case 'shiba': return `<path d="M20 40 L26 10 L44 28Z M80 40 L74 10 L56 28Z" fill="#d9822b"/><circle cx="50" cy="56" r="34" fill="#d9822b"/><path d="M24 62 Q30 92 50 92 Q70 92 76 62 Q64 56 50 70 Q36 56 24 62Z" fill="#f8efe2"/>${eye(38, 50)}${eye(62, 50)}<ellipse cx="50" cy="66" rx="5" ry="3.6" fill="#2b2523"/><circle cx="34" cy="44" r="3" fill="#f8efe2"/><circle cx="66" cy="44" r="3" fill="#f8efe2"/>`;
      case 'hamster': return `<circle cx="26" cy="28" r="10" fill="#e8b77d"/><circle cx="74" cy="28" r="10" fill="#e8b77d"/><ellipse cx="50" cy="60" rx="38" ry="34" fill="#e8b77d"/><ellipse cx="50" cy="70" rx="26" ry="22" fill="#fbeedd"/>${eye(36, 52, 3.6)}${eye(64, 52, 3.6)}<path d="M47 62 L53 62 L50 65Z" fill="#e26d7d"/><circle cx="26" cy="64" r="6" fill="#f3b7c6" opacity=".6"/><circle cx="74" cy="64" r="6" fill="#f3b7c6" opacity=".6"/>`;
      case 'owl': return `<path d="M20 26 L32 34 M80 26 L68 34" stroke="#7a5233" stroke-width="6" stroke-linecap="round"/><ellipse cx="50" cy="58" rx="34" ry="36" fill="#9b6b43"/><ellipse cx="50" cy="70" rx="20" ry="22" fill="#e4c9a5"/><circle cx="36" cy="46" r="12" fill="#fff"/><circle cx="64" cy="46" r="12" fill="#fff"/>${eye(36, 46, 6)}${eye(64, 46, 6)}<path d="M46 56 L54 56 L50 64Z" fill="#f2b705"/>`;
      case 'panda': return `<circle cx="22" cy="28" r="12" fill="#2b2523"/><circle cx="78" cy="28" r="12" fill="#2b2523"/><circle cx="50" cy="56" r="34" fill="#fbfbfb" stroke="#ddd" stroke-width="1.5"/><ellipse cx="37" cy="52" rx="9" ry="11" fill="#2b2523" transform="rotate(-20 37 52)"/><ellipse cx="63" cy="52" rx="9" ry="11" fill="#2b2523" transform="rotate(20 63 52)"/><circle cx="38" cy="51" r="3" fill="#fff"/><circle cx="62" cy="51" r="3" fill="#fff"/><ellipse cx="50" cy="66" rx="5" ry="3.6" fill="#2b2523"/>`;
      case 'dino': return `<path d="M30 30 L36 16 L42 28 L48 12 L54 26 L62 12 L66 28 L72 18 L74 32Z" fill="#2f8f5b"/><ellipse cx="50" cy="58" rx="34" ry="32" fill="#56c08a"/><ellipse cx="50" cy="72" rx="22" ry="16" fill="#c8f0d8"/>${eye(38, 50)}${eye(62, 50)}<path d="M40 70 Q50 78 60 70" stroke="#2b2523" stroke-width="2" fill="none"/><circle cx="44" cy="64" r="1.6" fill="#2f8f5b"/><circle cx="56" cy="64" r="1.6" fill="#2f8f5b"/>`;
      case 'dragon': return `<path d="M10 54 Q0 30 20 22 Q18 40 30 46Z M90 54 Q100 30 80 22 Q82 40 70 46Z" fill="#f2c94c"/><path d="M34 26 L28 6 L42 22Z M66 26 L72 6 L58 22Z" fill="#f6e7b0"/><ellipse cx="50" cy="58" rx="33" ry="32" fill="#d94a3a"/><ellipse cx="50" cy="72" rx="20" ry="14" fill="#f5b38f"/>${eye(38, 50)}${eye(62, 50)}<circle cx="45" cy="68" r="2" fill="#7a2a20"/><circle cx="55" cy="68" r="2" fill="#7a2a20"/><path d="M40 80 Q50 84 60 80" stroke="#7a2a20" stroke-width="2" fill="none"/>`;
      case 'phoenix': return `<path d="M50 90 Q30 96 18 80 Q34 84 42 76Z M50 90 Q70 96 82 80 Q66 84 58 76Z" fill="#f29d4c"/><path d="M14 52 Q2 30 20 18 Q22 40 34 46Z M86 52 Q98 30 80 18 Q78 40 66 46Z" fill="#f2c94c"/><ellipse cx="50" cy="56" rx="28" ry="30" fill="#e8553b"/><path d="M42 26 Q44 6 50 2 Q56 6 58 26Z" fill="#f2c94c"/>${eye(40, 52)}${eye(60, 52)}<path d="M45 62 L55 62 L50 70Z" fill="#f2c94c"/>`;
      case 'whale': return `<path d="M84 52 Q98 40 96 30 Q90 40 82 44Z M84 56 Q98 66 96 76 Q90 66 82 62Z" fill="#3b78c4"/><ellipse cx="46" cy="58" rx="40" ry="30" fill="#4f93dd"/><path d="M10 62 Q46 92 84 62 Q46 78 10 62Z" fill="#cfe6fb"/>${eye(30, 52)}<path d="M40 20 Q40 10 34 6 M40 20 Q42 10 48 8" stroke="#7fb8e6" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="22" cy="62" r="3" fill="#f3b7c6" opacity=".6"/>`;
      case 'penguin': return `<ellipse cx="50" cy="58" rx="32" ry="36" fill="#2b2f3a"/><ellipse cx="50" cy="64" rx="22" ry="28" fill="#fbfbfb"/>${eye(40, 46)}${eye(60, 46)}<path d="M44 54 L56 54 L50 61Z" fill="#f29d4c"/><path d="M34 94 L44 92 L40 98Z M66 94 L56 92 L60 98Z" fill="#f29d4c"/><circle cx="34" cy="58" r="4" fill="#f3b7c6" opacity=".6"/><circle cx="66" cy="58" r="4" fill="#f3b7c6" opacity=".6"/>`;
      case 'turtle': return `<ellipse cx="86" cy="58" rx="12" ry="10" fill="#8fd18a"/>${eye(88, 55, 3)}<ellipse cx="28" cy="86" rx="9" ry="6" fill="#8fd18a"/><ellipse cx="72" cy="86" rx="9" ry="6" fill="#8fd18a"/><path d="M14 74 Q14 34 50 32 Q86 34 86 74Z" fill="#3f8f4f"/><path d="M50 36 L50 72 M30 46 L70 46 M24 62 L76 62" stroke="#2c6a39" stroke-width="2"/><path d="M10 74 L90 74" stroke="#2c6a39" stroke-width="4" stroke-linecap="round"/>`;
      case 'fox': return `<path d="M18 44 L24 8 L46 32Z M82 44 L76 8 L54 32Z" fill="#e8742c"/><path d="M24 18 L28 36 L38 32Z M76 18 L72 36 L62 32Z" fill="#2b2523"/><path d="M14 46 Q16 84 50 92 Q84 84 86 46 Q70 30 50 30 Q30 30 14 46Z" fill="#e8742c"/><path d="M22 60 Q34 64 50 88 Q66 64 78 60 Q66 76 50 92 Q34 76 22 60Z" fill="#fbf1e4"/>${eye(38, 54)}${eye(62, 54)}<ellipse cx="50" cy="78" rx="4.5" ry="3.2" fill="#2b2523"/>`;
      case 'unicorn': return `<path d="M44 26 L50 0 L56 26Z" fill="#f2c94c"/><path d="M46 18 L54 14 M45 23 L55 19" stroke="#e8a92c" stroke-width="1.4"/><path d="M26 34 L30 14 L42 28Z M74 34 L70 14 L58 28Z" fill="#fbfbfb" stroke="#e5dfe8" stroke-width="1.2"/><path d="M70 26 Q92 30 88 64 Q84 50 74 44Z" fill="#c39be8"/><path d="M68 32 Q86 44 80 72 Q76 56 70 48Z" fill="#f3a5c8"/><circle cx="50" cy="58" r="32" fill="#fbfbfb" stroke="#e5dfe8" stroke-width="1.5"/>${eye(39, 54)}${eye(61, 54)}<ellipse cx="50" cy="74" rx="14" ry="9" fill="#f6dce9"/><circle cx="45" cy="74" r="1.6" fill="#b07aa0"/><circle cx="55" cy="74" r="1.6" fill="#b07aa0"/>`;
      default: return '';
    }
  }

  function bgSVG(id, c) {
    let s = `<rect width="120" height="120" fill="${c}"/>`;
    if (id === 'night') s += [[18, 20], [96, 16], [104, 52], [14, 64], [30, 98], [100, 92], [80, 30]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 1.2 : 1.8}" fill="#fff" opacity=".85"/>`).join('');
    if (id === 'sunset') s = `<defs><linearGradient id="avsun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6a96b"/><stop offset="1" stop-color="#e4606d"/></linearGradient></defs><rect width="120" height="120" fill="url(#avsun)"/>`;
    if (id === 'gold') s += '<circle cx="60" cy="56" r="52" fill="#fff" opacity=".25"/>';
    if (id === 'library') s += [0, 1, 2].map(r => `<rect x="0" y="${18 + r * 34}" width="120" height="3" fill="#a07a4f"/>` + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<rect x="${4 + k * 12}" y="${21 + r * 34 - 22 + (k % 3) * 3}" width="8" height="${22 - (k % 3) * 3}" fill="${['#c8473a', '#3b6fd1', '#3fa66b', '#f2c94c', '#8a5cc8'][(k + r) % 5]}" opacity=".55"/>`).join('')).join('');
    if (id === 'stage') s += '<path d="M60 -10 L20 120 L100 120Z" fill="#fff6c9" opacity=".22"/><path d="M0 0 Q14 40 6 120 L0 120Z M120 0 Q106 40 114 120 L120 120Z" fill="#9c2b3a"/>';
    if (id === 'rainbow') s = `<rect width="120" height="120" fill="#eaf6ff"/>` + ['#e85d75', '#f29d4c', '#f2c94c', '#5fae5a', '#3b78c4', '#8a5cc8'].map((cc, i) => `<path d="M${-6 + i * 7} 120 A${66 - i * 7} ${66 - i * 7} 0 0 1 ${126 - i * 7} 120" fill="none" stroke="${cc}" stroke-width="7" opacity=".75"/>`).join('');
    if (id === 'fireworks') s += [[24, 26, '#f2c94c'], [94, 22, '#e85d75'], [100, 74, '#7fb8e6'], [16, 80, '#5fae5a']].map(([x, y, cc]) => [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M${x} ${y} L${(x + 11 * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(y + 11 * Math.sin(a * Math.PI / 180)).toFixed(1)}" stroke="${cc}" stroke-width="2" stroke-linecap="round"/>`).join('')).join('');
    if (id === 'space') s += '<circle cx="98" cy="24" r="12" fill="#f29d4c"/><ellipse cx="98" cy="24" rx="20" ry="4" fill="none" stroke="#f6c98b" stroke-width="2" transform="rotate(-20 98 24)"/><circle cx="18" cy="90" r="7" fill="#7fb8e6"/>' + [[30, 18], [70, 10], [10, 46], [108, 60], [52, 104], [100, 104]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#fff"/>`).join('');
    if (id === 'board') s += '<path d="M10 104 L40 104 M86 18 L108 18" stroke="#f2f0e6" stroke-width="1.6" opacity=".35" stroke-linecap="round"/>';
    return s;
  }

  // 主程式：回傳 <svg> 字串
  let uid = 0;
  AV.svg = function (cfg, opt) {
    opt = opt || {};
    const a = AV.norm(cfg || {});
    const skin = col('skin', a.skin, '#f1c27d'), tc = col('tc', a.tc, '#f1f1ee');
    const id0 = 'av' + (uid + 1);
    const GRAD = {rainbow: ['#e85d75', '#f2c94c', '#5fae5a', '#3b78c4'], ombre: ['#4a3a8c', '#e889b5'], gold: ['#fff0a8', '#e6b422']};
    const hc = GRAD[a.hc] ? `url(#${id0}h)` : col('hc', a.hc, '#2b2523');
    const hcSolid = GRAD[a.hc] ? GRAD[a.hc][0] : hc;
    const H = HAIR[a.hair] || {};
    // 身材：[身體寬度, 臉寬度, 雙下巴]
    const BD = {slim: [0.8, 0.92, 0], lean: [0.9, 0.96, 0], normal: [1, 1, 0], sturdy: [1.12, 1.03, 0], chubby: [1.24, 1.08, 1], big: [1.38, 1.14, 1]}[a.body] || [1, 1, 0];
    const sx = f => f === 1 ? '' : ` transform="translate(60 0) scale(${f} 1) translate(-60 0)"`;
    const id = 'av' + (++uid);
    let g = GRAD[a.hc] ? `<defs><linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="1">${GRAD[a.hc].map((c2, i, arr) => `<stop offset="${i / (arr.length - 1)}" stop-color="${c2}"/>`).join('')}</linearGradient></defs>` : '';
    g += bgSVG(a.bg, col('bg', a.bg, '#cfeee0'));
    g += `<clipPath id="${id}c"><circle cx="60" cy="60" r="60"/></clipPath><g clip-path="${opt.square ? '' : `url(#${id}c)`}">`;
    if (H.back) g += `<path d="${H.back}" fill="${hc}"${sx(BD[1])}/>`;
    g += `<g${sx(BD[0])}>${top(a.top, tc, skin)}</g>`;
    const F = FACE[a.face] || FACE.round, ex = x => (60 + (x - 60) * BD[1]).toFixed(1);
    g += `<circle cx="${ex(F.ear[0])}" cy="57" r="5" fill="${skin}"/><circle cx="${ex(F.ear[1])}" cy="57" r="5" fill="${skin}"/>`;
    g += `<path d="${F.d}" fill="${skin}"${sx(BD[1])}/>`;
    if (BD[2]) g += `<path d="M51 ${a.body === 'big' ? 80 : 79.5} Q60 ${a.body === 'big' ? 85 : 83.5} 69 ${a.body === 'big' ? 80 : 79.5}" stroke="${shade(skin, -0.16)}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    g += cheek(a.cheek, skin);
    const B = BROW[a.brow];
    if (B) g += `<path d="${B[0]}" stroke="${shade(hcSolid, -0.15)}" stroke-width="${B[1]}" fill="none" stroke-linecap="round"/>`;
    g += EYES[a.eyes] || EYES.dot;
    g += nose(a.nose, skin);
    g += MOUTH[a.mouth] || MOUTH.smile;
    if (H.front) g += `<path d="${H.front}" fill="${hc}"${sx(BD[1])}/>`;
    if (H.tie) g += `<circle cx="84" cy="44" r="3" fill="#e65a7f"/>`;
    g += acc(a.acc, hc);
    if (a.pet && a.pet !== 'none') g += `<g transform="translate(74 70) scale(.46)" class="avpet">${pet(a.pet)}</g>`;
    g += '</g>';
    const size = opt.size || 64;
    return `<svg class="avatar${opt.cls ? ' ' + opt.cls : ''}" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${opt.label || '人物頭像'}">${g}</svg>`;
  };
  // 只畫一個部件的小縮圖（造型編輯器用）
  AV.thumb = function (cfg, key, itemId, size) {
    const c = Object.assign({}, cfg, {[key]: itemId});
    if (key === 'pet') return `<svg viewBox="0 0 100 100" width="${size}" height="${size}">${itemId === 'none' ? '<path d="M30 30 L70 70 M70 30 L30 70" stroke="#aaa" stroke-width="6" stroke-linecap="round"/>' : pet(itemId)}</svg>`;
    return AV.svg(c, {size: size});
  };
  window.AV = AV;
})();
