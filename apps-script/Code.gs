/**
 * 會考英文每日測驗：成績接收程式（Google Apps Script）
 * 貼到「904 英文每日測驗成績」試算表的 擴充功能 → Apps Script，
 * 再「部署 → 新增部署作業 → 網頁應用程式」，存取權選「所有人」。
 */
const SHEET_NAME = '成績';
const DETAIL_NAME = '作答明細';   // 每題一列，給老師儀表板用（找不到會自動建立）
const DETAIL_HEAD = ['日期', '座號', '姓名', '回', '題號', '單字', '題型', '答對', '選的', '訂正', '交卷時間'];
// 直接指定試算表，不論這段程式放在哪個 Apps Script 專案都會寫進同一份試算表
const SPREADSHEET_ID = '1v_YtQtmFH29t1Zugvi4A8pej9MHkGRB7_Oe9VtpiK3o';
function sheet_() {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sh) throw new Error('試算表裡找不到「' + SHEET_NAME + '」分頁');
  return sh;
}
// 答案卷放在 GitHub Pages 上，伺服器用它重新計分（學生改網頁分數沒有用）
const KEY_URL = 'https://nian-zu.github.io/904ENGVOC/answer-key.json';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const seat = parseInt(body.seat, 10);
    if (!(seat >= 1 && seat <= 60)) return out_({ ok: false, error: '座號不正確' });
    const pc = checkPin_(seat, body.pin);
    if (!pc.ok) return out_({ ok: false, error: pc.error, pin: true });
    if (body.type === 'avatar') return out_(saveAvatar_(seat, body.avatar));
    if (body.type === 'buy') return out_(buy_(seat, String(body.cat || ''), String(body.id || '')));
    if (body.type === 'show') return out_(saveShow_(seat, body.show));
    // 名單上有這個座號就用名單的姓名（學生打錯字也會自動更正）
    const name = (roster_()[seat] || String(body.name || '').trim()).slice(0, 20);
    if (!name) return out_({ ok: false, error: '請輸入姓名' });
    const answers = Array.isArray(body.answers) ? body.answers.slice(0, 300) : [];
    if (!answers.length) return out_({ ok: false, error: '沒有作答資料' });

    // 重新計分
    let key = loadKey_();
    // 新加的克漏字題號可能還不在快取裡：缺題號就重新抓一次答案檔
    if (answers.some(function (a) { return !key[parseInt(a[0], 10)]; })) key = loadKey_(true);
    const kindZh = { word: '單字', verb: '動詞變化', prep: '介系詞', cloze: '克漏字', sense: '一字多義', phrase: '片語', cap: '會考文法', jt: '寂天' };
    const range = String(body.range || '').slice(0, 120);
    const redo = range.indexOf('錯題重做') >= 0 ? 1 : 0;
    let right = 0;
    const wrong = [], detail = [];
    answers.forEach(function (a) {
      const id = parseInt(a[0], 10), k = key[id];
      if (!k) return;
      const ok = k[0] === parseInt(a[1], 10);
      if (ok) right++; else wrong.push(k[1]);
      detail.push([id, k, ok, String(a[2] == null ? '' : a[2]).slice(0, 40), kindZh[a[3]] || '']);
    });
    const answered = answers.length;
    const total = Math.max(answered, Math.min(300, parseInt(body.total, 10) || answered));
    const score = Math.round(right / answered * 100);
    const seconds = Math.max(0, Math.min(36000, parseInt(body.seconds, 10) || 0));
    const kinds = { all: '全部', word: '單字', verb: '動詞變化', prep: '介系詞', cloze: '克漏字', sense: '一字多義', phrase: '片語', cap: '會考文法', jt: '寂天' };

    // 台灣時間
    const now = new Date();
    const p = Utilities.formatDate(now, 'Asia/Taipei', 'yyyy,M,d,H,m,s').split(',');
    const row = [
      '=DATE(' + p[0] + ',' + p[1] + ',' + p[2] + ')+TIME(' + p[3] + ',' + p[4] + ',' + p[5] + ')',
      '=DATE(' + p[0] + ',' + p[1] + ',' + p[2] + ')',
      seat, "'" + name, "'" + range,
      (String(body.kind || 'all').split('+').map(function (k) { return kinds[k]; }).filter(Boolean).join('、') || '全部'), total, answered, right, score, seconds,
      answered >= total ? '是' : '否', wrong.slice(0, 100).join(' ')
    ];
    // 每日小考：密碼正確就在 N 欄記下小考日期（錯題重做不算小考）
    let quiz = '';
    if (body.quiz && !redo) { const qt = quizTask_(body.quiz); if (qt) quiz = qt.date; }
    row.push(quiz ? "'" + quiz : '');

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sh = sheet_();
      if (sh.getMaxColumns() < row.length) sh.insertColumnsAfter(sh.getMaxColumns(), row.length - sh.getMaxColumns());
      if (!sh.getRange(1, 14).getValue()) sh.getRange(1, 14).setValue('小考').setFontWeight('bold');
      append_(sh, [row]);
      const day = "'" + p[0] + '-' + ('0' + p[1]).slice(-2) + '-' + ('0' + p[2]).slice(-2);
      const stamp = "'" + day.slice(1) + ' ' + ('0' + p[3]).slice(-2) + ':' + ('0' + p[4]).slice(-2) + ':' + ('0' + p[5]).slice(-2);
      const rows = detail.map(function (x) {
        return [day, seat, "'" + name, typeof x[1][2] === 'string' ? x[1][2] : 'D' + (183 - x[1][2]), x[0], "'" + x[1][1], x[4], x[2] ? 1 : 0, "'" + x[3], redo, stamp];
      });
      if (rows.length) {
        const dt = detailSheet_();
        append_(dt, rows);
      }
      bump_();   // 經驗值要重算
    } finally {
      lock.releaseLock();
    }
    return out_({ ok: true, score: score, right: right, answered: answered, quiz: quiz ? true : (body.quiz ? false : null) });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

// 排行榜：GET ?action=board&period=day|week|month|all
// 回傳三種排行（答對數、答對率、進步）、稱號、歷屆週冠王與月冠王。30 號（測試用）不列入
// 答對率與進步只算一般測驗，不含錯題重做；答對數照舊全部加總
const BOARD_START = '2026-11-13';
const MIN_RATE = { day: 10, week: 30, month: 100, all: 100 };   // 上答對率榜至少要作答的題數
const MIN_UP = { day: 10, week: 20, month: 20 };                 // 進步榜：兩段各至少作答的題數

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'dash') return out_(dash_(p.key));
  if (p.action === 'badges') return out_(badgesC_());
  if (p.action === 'tasks') return out_(tasks_(p.key, p.seat));
  if (p.action === 'profile') return out_(profile_(p.seat));
  if (p.action === 'daily') return out_(dailyFor_(p.seat));
  if (p.action === 'parent') return out_(parent_(p.key, p.seat));
  if (p.action === 'who') { const ws = parseInt(p.seat, 10), wn = roster_()[ws]; return out_({ ok: true, given: wn ? givenName(wn) : '' }); }
  if (p.action === 'login') {
    const ls = parseInt(p.seat, 10), lc = checkPin_(ls, p.pin);
    return out_(lc.ok ? { ok: true, given: roster_()[ls] ? givenName(roster_()[ls]) : '' } : { ok: false, error: lc.error });
  }
  if (p.action === 'quizpw') { const qt = quizTask_(p.pw); return out_(qt ? { ok: true, date: qt.date, n: qt.n, days: qt.days } : { ok: false, error: '密碼不對，或今天沒有小考' }); }
  if (p.action !== 'board') return out_({ ok: true, message: '成績接收程式運作中' });
  return out_(boardCached_(p));
}

// ===== 快取：有人交卷、存造型、買東西時把版本號換掉，所有排行／徽章／等級快取一起失效 =====
// ================= 每日挑戰、全班週目標、連續交卷獎勵、生存挑戰 =================
const QUEST_START = '2026-11-19';
const SURV = '生存挑戰';
const isSurv_ = function (r) { return r.range.indexOf(SURV) === 0; };
// 每天從三個難度各抽一個（全班同一組）；val(當天這個人的成績列) 算出進度
const QUESTS = [
  { id: 'r30', tier: 1, coin: 10, need: 30, t: '今天答對 30 題', val: function (rs) { return sum_(rs, 'right'); } },
  { id: 'two', tier: 1, coin: 10, need: 2, t: '今天交卷 2 次', val: function (rs) { return rs.length; } },
  { id: 'redo', tier: 1, coin: 10, need: 1, t: '完成一次錯題重做', val: function (rs) { return rs.filter(function (r) { return r.redo; }).length; } },
  { id: 'early', tier: 1, coin: 10, need: 1, t: '早上 8 點前交卷一次', val: function (rs) { return rs.filter(function (r) { return r.h < 8; }).length; } },
  { id: 'cloze', tier: 1, coin: 10, need: 5, t: '克漏字答對 5 格', val: function (rs, dk) { return dk['克漏字'] || 0; } },
  { id: 'r60', tier: 2, coin: 20, need: 60, t: '今天答對 60 題', val: function (rs) { return sum_(rs, 'right'); } },
  { id: 'three', tier: 2, coin: 20, need: 3, t: '今天交卷 3 次', val: function (rs) { return rs.length; } },
  { id: 'acc90', tier: 2, coin: 20, need: 1, t: '一次作答 20 題以上，答對率 90% 以上', val: function (rs) { return rs.filter(function (r) { return r.answered >= 20 && r.right >= r.answered * 0.9; }).length; } },
  { id: 'jt20', tier: 2, coin: 20, need: 20, t: '寂天答對 20 題', val: function (rs, dk) { return dk['寂天'] || 0; } },
  { id: 'surv8', tier: 2, coin: 20, need: 8, t: '生存挑戰撐到 8 題', val: function (rs) { return max_(rs.filter(isSurv_), 'right'); } },
  { id: 'verb10', tier: 2, coin: 20, need: 10, t: '動詞變化答對 10 題', val: function (rs, dk) { return dk['動詞變化'] || 0; } },
  { id: 'r100', tier: 3, coin: 30, need: 100, t: '今天答對 100 題', val: function (rs) { return sum_(rs, 'right'); } },
  { id: 'full15', tier: 3, coin: 30, need: 1, t: '一次作答 15 題以上全對', val: function (rs) { return rs.filter(function (r) { return !isSurv_(r) && r.answered >= 15 && r.right === r.answered; }).length; } },
  { id: 'surv15', tier: 3, coin: 30, need: 15, t: '生存挑戰撐到 15 題', val: function (rs) { return max_(rs.filter(isSurv_), 'right'); } },
  { id: 'big40', tier: 3, coin: 30, need: 1, t: '一次作答 40 題以上，答對率 80% 以上', val: function (rs) { return rs.filter(function (r) { return r.answered >= 40 && r.right >= r.answered * 0.8; }).length; } }
];
const QUEST_CLEAR = 30;   // 三項全完成的額外獎勵
function sum_(rs, k) { return rs.reduce(function (a, r) { return a + (r[k] || 0); }, 0); }
function max_(rs, k) { return rs.reduce(function (a, r) { return Math.max(a, r[k] || 0); }, 0); }
function hash_(t) { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 1000003; return h; }
function questsOf_(d) {
  return [1, 2, 3].map(function (tier) {
    const qs = QUESTS.filter(function (q) { return q.tier === tier; });
    return qs[hash_(d + '#' + tier) % qs.length];
  });
}
function mondayOf_(d) { const t = new Date(d + 'T12:00:00+08:00'), w = (t.getDay() + 6) % 7; return shift_(d, -w); }
// 全部算好放快取：每人每天的挑戰完成、連續交卷、全班週目標、生存紀錄
function daily_() {
  const tz = 'Asia/Taipei', today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const rows = readRows_(), by = {}, days = {};
  rows.forEach(function (r) {
    const k = r.seat + '|' + r.d; (by[k] = by[k] || []).push(r);
    (days[r.seat] = days[r.seat] || {})[r.d] = 1;
  });
  // 作答明細：每人每天各題型答對數（克漏字、寂天、動詞變化）
  const dkBy = {};
  detailValues_().forEach(function (r) {
    const seat = parseInt(r[1], 10); if (!seat || seat === 30) return;
    const d = r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : String(r[0]).slice(0, 10);
    if (d < QUEST_START || Number(r[7]) !== 1) return;
    const m = dkBy[seat + '|' + d] = dkBy[seat + '|' + d] || {};
    m[String(r[6])] = (m[String(r[6])] || 0) + 1;
  });
  const per = {};
  const P = function (seat) { return per[seat] = per[seat] || { qcoin: 0, clear: 0, scoin: 0, streak: 0, gcoin: 0, goals: 0, survBest: 0, survWeek: 0, today: null }; };
  // 1) 每日挑戰
  Object.keys(by).forEach(function (k) {
    const seat = +k.split('|')[0], d = k.split('|')[1];
    if (d < QUEST_START) return;
    const rs = by[k], dk = dkBy[k] || {}, qs = questsOf_(d), p = P(seat);
    let n = 0;
    qs.forEach(function (q) { if (q.val(rs, dk) >= q.need) { p.qcoin += q.coin; n++; } });
    if (n === 3) { p.qcoin += QUEST_CLEAR; p.clear++; }
  });
  // 2) 連續交卷獎勵：連續第 n 天交卷得 min(n,10)×2 代幣（從挑戰開始那天算）
  Object.keys(days).forEach(function (seat) {
    const ds = Object.keys(days[seat]).sort(), p = P(+seat);
    let run = 0, prev = '';
    ds.forEach(function (d) {
      run = prev && shift_(prev, 1) === d ? run + 1 : 1; prev = d;
      if (d >= QUEST_START) p.scoin += Math.min(run, 10) * 2;
    });
    let st = 0, d = days[seat][today] ? today : shift_(today, -1);
    while (days[seat][d]) { st++; d = shift_(d, -1); }
    p.streak = st; p.done = !!days[seat][today];
  });
  // 3) 全班週目標：本週全班答對題數；目標＝上週的 1.1 倍（至少 2000）。達成時本週作答 50 題以上的人各得 50 代幣
  const wk = {}, wkSeat = {};
  rows.forEach(function (r) {
    if (r.seat >= 30) return;
    const w = mondayOf_(r.d);
    wk[w] = (wk[w] || 0) + r.right;
    const ws = wkSeat[w] = wkSeat[w] || {}; ws[r.seat] = (ws[r.seat] || 0) + r.answered;
  });
  const goalOf = function (w) { return Math.max(2000, Math.round((wk[shift_(w, -7)] || 0) * 1.1 / 100) * 100); };
  Object.keys(wk).forEach(function (w) {
    if (w < mondayOf_(QUEST_START) || w === mondayOf_(today) && wk[w] < goalOf(w)) return;
    if (wk[w] < goalOf(w)) return;
    Object.keys(wkSeat[w]).forEach(function (seat) { if (wkSeat[w][seat] >= 50) { const p = P(+seat); p.gcoin += 50; p.goals++; } });
  });
  const thisW = mondayOf_(today);
  // 4) 生存挑戰紀錄
  rows.forEach(function (r) {
    if (!isSurv_(r)) return;
    const p = P(r.seat);
    p.survBest = Math.max(p.survBest, r.right);
    if (r.d >= thisW) p.survWeek = Math.max(p.survWeek, r.right);
  });
  // 今天每個人的挑戰進度
  const qs = questsOf_(today);
  Object.keys(roster_()).forEach(function (seat) {
    const k = seat + '|' + today, rs = by[k] || [], dk = dkBy[k] || {};
    P(+seat).today = qs.map(function (q) { return Math.min(q.need, q.val(rs, dk)); });
  });
  const survTop = Object.keys(per).filter(function (k) { return per[k].survWeek > 0 && +k !== 30; })
    .map(function (k) { return { seat: +k, given: givenName(roster_()[k] || ''), best: per[k].survWeek }; })
    .sort(function (a, b) { return b.best - a.best; }).slice(0, 10);
  return { ok: true, today: today, quests: qs.map(function (q) { return { id: q.id, t: q.t, need: q.need, coin: q.coin, tier: q.tier }; }), clear: QUEST_CLEAR,
    week: { from: thisW, total: wk[thisW] || 0, goal: goalOf(thisW), mine: wkSeat[thisW] || {} }, survTop: survTop, per: per };
}
function dailyC_() { return cached_('daily|' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd'), 600, daily_); }
function dailyFor_(seat) {
  const D = dailyC_(), s = parseInt(seat, 10), p = D.per[s] || { today: [0, 0, 0], streak: 0, survBest: 0, survWeek: 0 };
  return { ok: true, today: D.today, quests: D.quests.map(function (q, i) { return Object.assign({ val: (p.today || [])[i] || 0 }, q); }), clear: D.clear,
    streak: p.streak, doneToday: !!p.done, streakCoin: Math.min(p.done ? p.streak : p.streak + 1, 10) * 2, survBest: p.survBest, survWeek: p.survWeek, survTop: D.survTop,
    week: { from: D.week.from, total: D.week.total, goal: D.week.goal, mine: (D.week.mine || {})[s] || 0, people: Object.keys(D.week.mine || {}).filter(function (k) { return D.week.mine[k] >= 50; }).length },
    coins: { quest: p.qcoin || 0, streak: p.scoin || 0, goal: p.gcoin || 0 }, clearDays: p.clear || 0 };
}
function badgesC_() { return cached_('badges|' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd'), 600, badges_); }
function ver_() { return CacheService.getScriptCache().get('ver') || '0'; }
function bump_() { CacheService.getScriptCache().put('ver', String(Date.now()), 21600); }
function cached_(name, sec, fn) {
  const cache = CacheService.getScriptCache(), k = name + '|' + ver_(), hit = cache.get(k);
  if (hit) return JSON.parse(hit);
  const v = fn(), t = JSON.stringify(v);
  if (t.length < 95000) try { cache.put(k, t, sec); } catch (e) {}
  return v;
}

// 排行榜：同一個版本內大家共用計算結果；「我」的成績另外從裡面挑出來
function boardCached_(p) {
  const period = ['day', 'week', 'month', 'all'].indexOf(p.period) >= 0 ? p.period : 'week';
  const type = /^[a-z]{2,6}$/.test(String(p.type || '')) ? p.type : 'all';
  const r = cached_('bd|' + period + '|' + type + '|' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd'), 600, function () { return boardCore_({ period: period, type: type }); });
  const all = r.mineAll || {};
  delete r.mineAll;
  r.me = null;
  const ms = parseInt(p.seat, 10);
  if (ms && p.pin && checkPin_(ms, p.pin).ok) r.me = all[ms] || { seat: ms, right: 0, answered: 0, tests: 0, rate: null, fAns: 0, rank: null, total: r.total || 0 };
  delete r.total;
  return r;
}

function boardCore_(p) {
  const period = ['day', 'week', 'month', 'all'].indexOf(p.period) >= 0 ? p.period : 'week';
  const tz = 'Asia/Taipei';
  const today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');

  let from = '0000-00-00', prevFrom = '', prevTo = '';
  if (period === 'day') { from = today; prevFrom = prevTo = shift_(today, -1); }
  if (period === 'week') { from = weekStart_(today); prevFrom = shift_(from, -7); prevTo = shift_(from, -1); }
  if (period === 'month') { from = today.slice(0, 8) + '01'; prevTo = shift_(from, -1); prevFrom = prevTo.slice(0, 8) + '01'; }

  // type=word|verb|prep|cloze：只算這種題型（用「作答明細」逐題資料）；不給就是全部題型（用「成績」）
  const TYPE_ZH = { word: '單字', verb: '動詞變化', prep: '介系詞', cloze: '克漏字', sense: '一字多義', phrase: '片語', cap: '會考文法', jt: '寂天' };
  const type = TYPE_ZH[p.type] ? p.type : 'all';
  const allRows = readRows_();
  const rows = type === 'all' ? allRows : readDetail_(TYPE_ZH[type]);
  const clozeRows = readDetail_('克漏字');
  const cur = agg_(rows, from, today), prv = prevFrom ? agg_(rows, prevFrom, prevTo) : {};
  // 「全部」排行不算克漏字：從每人的題數扣掉同期間克漏字的題數
  // 「全部」也不算寂天（寂天有自己的排行）
  if (type === 'all') {
    const jtRows = readDetail_('寂天');
    [clozeRows, jtRows].forEach(function (xs) { minus_(cur, agg_(xs, from, today)); if (prevFrom) minus_(prv, agg_(xs, prevFrom, prevTo)); });
    Object.keys(cur).forEach(function (k) { if (cur[k].answered <= 0) delete cur[k]; });
  }
  const list = Object.keys(cur).map(function (k) { return cur[k]; });
  const rateOf = function (s) { return s.fAns ? Math.round(s.fRight / s.fAns * 100) : null; };
  const entry = function (s) {
    const q = prv[s.seat], d = upOf_(s, q, period);
    return { seat: s.seat, given: givenName(s.name), right: s.right, answered: s.answered, tests: s.tests,
      rate: rateOf(s), fAns: s.fAns, prevRate: q && q.fAns ? rateOf(q) : null, up: d };
  };
  const boards = {
    right: rank_(list, function (s) { return s.right || null; }, entry),
    rate: rank_(list, function (s) { return s.fAns >= MIN_RATE[period] ? rateOf(s) : null; }, entry),
    up: period === 'all' ? [] : rank_(list, function (s) { const d = upOf_(s, prv[s.seat], period); return d > 0 ? d : null; }, entry)
  };

  // 連續交卷天數（不分期間）
  const days = {};
  rows.forEach(function (r) { (days[r.seat] = days[r.seat] || {})[r.d] = 1; });
  const names = {};
  rows.forEach(function (r) { names[r.seat] = r.name; });
  const streaks = Object.keys(days).map(function (seat) {
    let d = days[seat][today] ? today : shift_(today, -1), k = 0;
    while (days[seat][d]) { k++; d = shift_(d, -1); }
    return { seat: +seat, name: names[seat], streak: k };
  });

  // 每個人自己的成績（沒進前 10 名也看得到；回傳前只留下帶對密碼的那一位）
  const total = list.filter(function (x) { return x.right > 0; }).length, mineAll = {};
  list.forEach(function (s) {
    const m = entry(s);
    m.rank = s.right > 0 ? 1 + list.filter(function (x) { return x.right > s.right; }).length : null;
    m.total = total;
    mineAll[s.seat] = m;
  });
  return { ok: true, period: period, from: from, today: today, top: boards.right, boards: boards, mineAll: mineAll, total: total,
    min: { rate: MIN_RATE[period], up: MIN_UP[period] || null },
    type: type, titles: titles_(list, prv, streaks, period), fame: fame_(allRows, today, clozeRows.concat(readDetail_('寂天'))), av: avMap_() };
}

// 老師儀表板：GET ?action=dash&key=密碼
// 密碼（選用）放在「專案設定 → 指令碼屬性」的 TEACHER_KEY；沒設就不用密碼
// 回傳「儀表板資料」分頁各區塊（由公式整理好的統計）
const DASH_BLOCKS = { daily: [1, 7], unit_stats: [9, 4], item_stats: [14, 3], wrong_picks: [18, 3],
  type_stats: [22, 4], wrong_words: [27, 3], redo_stats: [31, 4] }; // [起始欄（A=1）, 欄數]

function dash_(key) {
  // 沒設 TEACHER_KEY 就不需要密碼；設了就要輸入正確密碼
  const want = PropertiesService.getScriptProperties().getProperty('TEACHER_KEY');
  if (want && String(key || '') !== want) return { ok: false, error: key ? '密碼不正確' : '請輸入老師密碼' };
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('儀表板資料');
  if (!sh) return { ok: false, error: '找不到「儀表板資料」分頁' };
  const n = Math.max(1, sh.getLastRow());
  const all = sh.getRange(1, 1, n, 34).getDisplayValues();
  const blocks = {};
  Object.keys(DASH_BLOCKS).forEach(function (k) {
    const c = DASH_BLOCKS[k][0] - 1, w = DASH_BLOCKS[k][1];
    blocks[k] = all.map(function (r) { return r.slice(c, c + w); })
      .filter(function (r, i) { return i === 0 || r.some(function (x) { return x !== ''; }); });
  });
  return { ok: true, at: Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm'), blocks: blocks };
}

function readRows_() {
  const tz = 'Asia/Taipei', sh = sheet_(), n = sh.getLastRow() - 1, out = [];
  if (n <= 0) return out;
  sh.getRange(2, 1, n, 10).getValues().forEach(function (r) { // A:J
    const seat = parseInt(r[2], 10);
    if (!seat || seat === 30) return;
    out.push({ d: r[1] instanceof Date ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd') : String(r[1]), seat: seat, name: roster_()[seat] || String(r[3]),
      redo: String(r[4]).indexOf('錯題重做') >= 0, answered: Number(r[7]) || 0, right: Number(r[8]) || 0,
      range: String(r[4]), kind: String(r[5]), h: r[0] instanceof Date ? Number(Utilities.formatDate(r[0], tz, 'H')) : 12 });
  });
  return out;
}

// 「作答明細」某一題型的逐題資料，依每次交卷合併成一列（格式同 readRows_）
let DETAIL_VALUES_ = null;   // 同一次執行內只讀一次「作答明細」
function detailValues_() {
  if (DETAIL_VALUES_) return DETAIL_VALUES_;
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DETAIL_NAME);
  DETAIL_VALUES_ = !sh || sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, 11).getValues();
  return DETAIL_VALUES_;
}
function readDetail_(kindZh) {
  const tz = 'Asia/Taipei';
  const out = [], by = {};
  detailValues_().forEach(function (r) { // A:K
    const seat = parseInt(r[1], 10);
    if (!seat || seat === 30 || String(r[6]) !== kindZh) return;
    const d = r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : String(r[0]).slice(0, 10);
    const k = seat + '|' + String(r[10]);
    let t = by[k];
    if (!t) { t = by[k] = { d: d, seat: seat, name: roster_()[seat] || String(r[2]), redo: Number(r[9]) === 1, answered: 0, right: 0 }; out.push(t); }
    t.answered++; t.right += Number(r[7]) === 1 ? 1 : 0;
  });
  return out;
}

function agg_(rows, from, to) {
  const st = {};
  rows.forEach(function (r) {
    if (r.d < from || r.d > to) return;
    const s = st[r.seat] || (st[r.seat] = { seat: r.seat, name: '', right: 0, answered: 0, tests: 0, fRight: 0, fAns: 0, days: {} });
    s.name = r.name; s.right += r.right; s.answered += r.answered; s.tests++; s.days[r.d] = 1;
    if (!r.redo && (!r.range || r.range.indexOf('生存挑戰') !== 0)) { s.fRight += r.right; s.fAns += r.answered; }   // 答對率不算錯題重做和生存挑戰
  });
  return st;
}

function minus_(st, cz) {
  Object.keys(cz).forEach(function (k) {
    const s = st[k], c = cz[k];
    if (!s) return;
    s.right -= c.right; s.answered -= c.answered; s.fRight -= c.fRight; s.fAns -= c.fAns;
  });
}

function upOf_(s, q, period) {
  const m = MIN_UP[period];
  if (!m || !q || s.fAns < m || q.fAns < m) return null;
  return Math.round(s.fRight / s.fAns * 100) - Math.round(q.fRight / q.fAns * 100);
}

// 依 val 由大到小排名，同分同名次，取前 10 名（含並列）
function rank_(list, val, entry) {
  const xs = list.filter(function (s) { return val(s) != null; })
    .sort(function (a, b) { return val(b) - val(a) || b.fAns - a.fAns || a.seat - b.seat; });
  const out = [];
  let rank = 0, prev = null;
  xs.forEach(function (s, i) {
    const v = val(s);
    if (v !== prev) { rank = i + 1; prev = v; }
    if (rank <= 10) { const o = entry(s); o.rank = rank; out.push(o); }
  });
  return out;
}

function shift_(d, n) {
  return Utilities.formatDate(new Date(Date.parse(d + 'T12:00:00+08:00') + n * 86400000), 'Asia/Taipei', 'yyyy-MM-dd');
}
function weekStart_(d) {
  const dow = new Date(Date.parse(d + 'T12:00:00+08:00')).getUTCDay() || 7; // 1=週一 … 7=週日
  return shift_(d, 1 - dow);
}

// 稱號：最強、神準、進步最多、最勤奮、連續達人（同分全部並列）
function titles_(list, prv, streaks, period) {
  const out = [];
  function best(key, label, desc, cands, val, show) {
    let top = null;
    cands.forEach(function (s) { const v = val(s); if (v != null && (top == null || v > top)) top = v; });
    if (top == null) return;
    const who = cands.filter(function (s) { return val(s) === top; }).sort(function (a, b) { return a.seat - b.seat; });
    out.push({ key: key, label: label, desc: desc, value: show(top),
      who: who.map(function (s) { return { seat: s.seat, given: givenName(s.name) }; }) });
  }
  const unit = { day: '昨天', week: '上週', month: '上個月' }[period];
  best('strong', '最強', '答對題數最多', list, function (s) { return s.right || null; }, function (v) { return v + ' 題'; });
  best('sharp', '神準', '答對率最高（至少作答 ' + MIN_RATE[period] + ' 題）', list,
    function (s) { return s.fAns >= MIN_RATE[period] ? Math.round(s.fRight / s.fAns * 100) : null; }, function (v) { return v + '%'; });
  if (unit) best('up', '進步最多', '答對率比' + unit + '進步最多', list,
    function (s) { const d = upOf_(s, prv[s.seat], period); return d > 0 ? d : null; }, function (v) { return '+' + v + ' 分'; });
  if (period !== 'day') best('busy', '最勤奮', '交卷天數最多', list, function (s) { return Object.keys(s.days).length; }, function (v) { return v + ' 天'; });
  best('streak', '連續達人', '目前連續每天交卷的天數', streaks, function (s) { return s.streak >= 2 ? s.streak : null; }, function (v) { return '連續 ' + v + ' 天'; });
  return out;
}

// 歷屆週冠王、月冠王（答對題數最多，同分並列），最新的在前面，各取最近 8 個
// 克漏字不算：從「成績」的答對題數扣掉同一人同一天克漏字答對的題數
function fame_(rows, today, clozeRows) {
  function champs(keyOf, labelOf, curKey) {
    const by = {};
    rows.forEach(function (r) {
      const k = keyOf(r.d), g = by[k] || (by[k] = {});
      const s = g[r.seat] || (g[r.seat] = { seat: r.seat, name: r.name, right: 0 });
      s.name = r.name; s.right += r.right;
    });
    (clozeRows || []).forEach(function (r) {
      const g = by[keyOf(r.d)], s = g && g[r.seat];
      if (s) s.right -= r.right;
    });
    return Object.keys(by).sort().reverse().slice(0, 8).map(function (k) {
      const xs = Object.keys(by[k]).map(function (x) { return by[k][x]; });
      const top = Math.max.apply(null, xs.map(function (s) { return s.right; }));
      return { key: k, label: labelOf(k), current: k === curKey, value: top + ' 題',
        who: xs.filter(function (s) { return s.right === top; }).sort(function (a, b) { return a.seat - b.seat; })
          .map(function (s) { return { seat: s.seat, given: givenName(s.name) }; }) };
    });
  }
  const md = function (d) { return parseInt(d.slice(5, 7), 10) + '/' + parseInt(d.slice(8), 10); };
  return {
    weeks: champs(weekStart_, function (k) { return md(k) + '–' + md(shift_(k, 6)); }, weekStart_(today)),
    months: champs(function (d) { return d.slice(0, 7); }, function (k) { return parseInt(k.slice(0, 4), 10) + ' 年 ' + parseInt(k.slice(5), 10) + ' 月'; }, today.slice(0, 7))
  };
}

// 接在最後一列後面；工作表列數不夠時先加列
function append_(sh, rows) {
  const at = sh.getLastRow() + 1, need = at + rows.length - 1 - sh.getMaxRows();
  if (need > 0) sh.insertRowsAfter(sh.getMaxRows(), Math.max(need, 500));
  sh.getRange(at, 1, rows.length, rows[0].length).setValues(rows);
}

function detailSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(DETAIL_NAME);
  if (!sh) {
    sh = ss.insertSheet(DETAIL_NAME);
    sh.getRange(1, 1, 1, DETAIL_HEAD.length).setValues([DETAIL_HEAD]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

// 只留名字、去掉姓氏（複姓去兩字）；英文或其他寫法照原樣
function givenName(n) {
  n = String(n || '').trim();
  if (!/^[\u4e00-\u9fff]{2,5}$/.test(n)) return n;
  const two = ['歐陽', '司馬', '諸葛', '上官', '張簡', '范姜', '端木', '皇甫', '司徒', '東方', '公孫', '令狐', '夏侯', '慕容', '尉遲', '長孫', '宇文', '軒轅', '單于', '呼延'];
  const cut = (n.length >= 4 || (n.length === 3 && two.indexOf(n.slice(0, 2)) >= 0)) ? 2 : 1;
  return n.slice(cut) || n;
}

function loadKeyMain_(fresh) {
  const cache = CacheService.getScriptCache();
  const parts = fresh ? null : cache.get('key_parts');
  if (parts) {
    const n = parseInt(parts, 10), keys = [];
    for (let i = 0; i < n; i++) keys.push('key_' + i);
    const got = cache.getAll(keys);
    if (Object.keys(got).length === n) return JSON.parse(keys.map(function (k) { return got[k]; }).join(''));
  }
  const text = UrlFetchApp.fetch(fresh_(KEY_URL)).getContentText();
  const size = 90000, obj = {};
  let n = 0;
  for (let i = 0; i < text.length; i += size) obj['key_' + (n++)] = text.slice(i, i + size);
  obj['key_parts'] = String(n);
  cache.putAll(obj, 21600);
  return JSON.parse(text);
}

// 講義題（一字多義／片語／會考文法）的答案另放 answer-key-extra.json（題號 40000 起），不跟克漏字的答案檔互相干擾
const KEY_EXTRA_URL = 'https://nian-zu.github.io/904ENGVOC/answer-key-extra.json';
const KEY_JT_URL = 'https://nian-zu.github.io/904ENGVOC/answer-key-jt.json';
function loadKey_(fresh) {
  const key = loadKeyMain_(fresh);
  const cache = CacheService.getScriptCache();
  let text = fresh ? null : cache.get('key_extra');
  if (!text) {
    try { text = UrlFetchApp.fetch(fresh_(KEY_EXTRA_URL)).getContentText(); cache.put('key_extra', text, 21600); } catch (e) { text = '{}'; }
  }
  const ex = JSON.parse(text);
  Object.keys(ex).forEach(function (id) { key[parseInt(id, 10)] = ex[id]; });
  // 寂天 Reading Success 3（題號 50000 起）
  let jt = fresh ? null : cache.get('key_jt');
  if (!jt) {
    try { jt = UrlFetchApp.fetch(fresh_(KEY_JT_URL)).getContentText(); cache.put('key_jt', jt, 21600); } catch (e) { jt = '{}'; }
  }
  const jx = JSON.parse(jt);
  Object.keys(jx).forEach(function (id) { key[parseInt(id, 10)] = jx[id]; });
  return key;
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// ===== 收集徽章：從「成績」和「作答明細」即時計算，不另外存檔 =====
const BADGE_DEFS = [
  { id: 'full', icon: '🎯', name: '滿分出擊', desc: '單次測驗 10 題以上全對' },
  { id: 'streak3', icon: '🔥', name: '連續 3 天', desc: '連續 3 天交卷' },
  { id: 'streak7', icon: '🔥', name: '連續 7 天', desc: '連續 7 天交卷' },
  { id: 'streak14', icon: '🌋', name: '連續 14 天', desc: '連續 14 天交卷' },
  { id: 'streak30', icon: '🏔️', name: '連續 30 天', desc: '連續 30 天交卷' },
  { id: 'q100', icon: '💪', name: '百題新手', desc: '累積作答 100 題' },
  { id: 'q500', icon: '🦾', name: '五百題好手', desc: '累積作答 500 題' },
  { id: 'q1000', icon: '🧠', name: '千題大師', desc: '累積作答 1000 題' },
  { id: 'early', icon: '🌅', name: '早鳥', desc: '早上 4 點到 7 點之間交卷' },
  { id: 'redo10', icon: '♻️', name: '錯題獵人', desc: '完成錯題重做 10 次' },
  { id: 'improve', icon: '📈', name: '進步之星', desc: '某一週的答對率比前一週高 10 分以上（兩週各作答 20 題）' },
  { id: 'cloze85', icon: '📖', name: '克漏字高手', desc: '克漏字作答 50 題以上，答對率 85% 以上' },
  { id: 'allkind', icon: '🎨', name: '全能選手', desc: '四種題型各作答 30 題以上' },
  { id: 'week', icon: '🏆', name: '週冠王', desc: '拿下一次完整一週的答對數冠軍' },
  { id: 'month', icon: '👑', name: '月冠王', desc: '拿下一次完整一個月的答對數冠軍' },
  { id: 'streak60', icon: '🌠', name: '連續 60 天', desc: '連續 60 天交卷' },
  { id: 'streak100', icon: '💯', name: '百日不斷', desc: '連續 100 天交卷' },
  { id: 'days30', icon: '📅', name: '三十天勤學', desc: '累積 30 天有交卷（不用連續）' },
  { id: 'days100', icon: '🗓️', name: '一百天勤學', desc: '累積 100 天有交卷（不用連續）' },
  { id: 'q2000', icon: '🚀', name: '兩千題達人', desc: '累積作答 2000 題' },
  { id: 'q5000', icon: '🌌', name: '五千題傳說', desc: '累積作答 5000 題' },
  { id: 'full5', icon: '🎳', name: '滿分連發', desc: '5 次不同的測驗 10 題以上全對' },
  { id: 'full20', icon: '🏹', name: '神射手', desc: '20 次不同的測驗 10 題以上全對' },
  { id: 'acc90', icon: '🔍', name: '精準之眼', desc: '累積作答 300 題以上，總答對率 90% 以上' },
  { id: 'marathon', icon: '🏃', name: '單字馬拉松', desc: '單次測驗作答 50 題以上' },
  { id: 'day100', icon: '⚡', name: '爆發日', desc: '一天之內作答 100 題以上' },
  { id: 'redo50', icon: '🔁', name: '錯題剋星', desc: '完成錯題重做 50 次' },
  { id: 'first', icon: '🥇', name: '搶頭香', desc: '某一天全班第一個交卷' },
  { id: 'first10', icon: '🐓', name: '頭香常客', desc: '10 天是全班第一個交卷' },
  { id: 'weekend', icon: '🛋️', name: '週末也努力', desc: '8 個不同的週六、週日有交卷' },
  { id: 'comeback', icon: '🔙', name: '王者回歸', desc: '休息 7 天以上之後又回來交卷' },
  { id: 'word300', icon: '🔤', name: '單字王', desc: '單字題答對 300 題' },
  { id: 'verb200', icon: '🔧', name: '動詞達人', desc: '動詞變化答對 200 題' },
  { id: 'prep200', icon: '🧭', name: '介系詞達人', desc: '介系詞答對 200 題' },
  { id: 'cloze200', icon: '📚', name: '閱讀小書蟲', desc: '克漏字答對 200 題' },
  { id: 'sense100', icon: '🪞', name: '一字多義通', desc: '一字多義答對 100 題' },
  { id: 'phrase100', icon: '🧩', name: '片語通', desc: '片語答對 100 題' },
  { id: 'cap80', icon: '📝', name: '會考文法通', desc: '會考文法答對 80 題' },
  { id: 'jt100', icon: '📘', name: '寂天新手', desc: '寂天 Reading Success 3 答對 100 題' },
  { id: 'jt500', icon: '📗', name: '寂天達人', desc: '寂天 Reading Success 3 答對 500 題' },
  { id: 'quest1', icon: '✅', name: '挑戰達成', desc: '某一天完成全部 3 項每日挑戰' },
  { id: 'quest7', icon: '🎖️', name: '挑戰常勝軍', desc: '累積 7 天完成全部每日挑戰' },
  { id: 'quest30', icon: '🏆', name: '挑戰傳奇', desc: '累積 30 天完成全部每日挑戰' },
  { id: 'surv20', icon: '🛡️', name: '生存者', desc: '生存挑戰撐到 20 題' },
  { id: 'surv50', icon: '⚔️', name: '不倒戰士', desc: '生存挑戰撐到 50 題' },
  { id: 'surv100', icon: '🐲', name: '生存傳說', desc: '生存挑戰撐到 100 題' },
  { id: 'goal1', icon: '🤝', name: '團隊合作', desc: '全班達成一次週目標（那週自己作答 50 題以上）' },
  { id: 'goal4', icon: '🏫', name: '班級支柱', desc: '全班達成 4 次週目標，每次都有出力' }
];

// 「作答明細」各題型統計（不含錯題重做）
function detailStats_() {
  const out = {};
  detailValues_().forEach(function (r) {
    const seat = parseInt(r[1], 10);
    if (!seat || seat === 30 || Number(r[9]) === 1) return;
    const s = out[seat] = out[seat] || {};
    const o = s[String(r[6])] = s[String(r[6])] || { ans: 0, right: 0 };
    o.ans++; o.right += Number(r[7]) === 1 ? 1 : 0;
  });
  return out;
}

// 已結束的每週／每月答對數冠軍（不含克漏字、不含進行中的那一期）
function champsAll_(rows, clozeRows, today, keyOf) {
  const by = {};
  rows.forEach(function (r) { const g = by[keyOf(r.d)] = by[keyOf(r.d)] || {}; const s = g[r.seat] = g[r.seat] || { right: 0 }; s.right += r.right; });
  (clozeRows || []).forEach(function (r) { const g = by[keyOf(r.d)], s = g && g[r.seat]; if (s) s.right -= r.right; });
  const curKey = keyOf(today), out = {};
  Object.keys(by).forEach(function (k) {
    if (k === curKey) return;
    const g = by[k];
    let top = 0;
    Object.keys(g).forEach(function (seat) { if (g[seat].right > top) top = g[seat].right; });
    if (top <= 0) return;
    Object.keys(g).forEach(function (seat) { if (g[seat].right === top) out[seat] = 1; });
  });
  return out;
}

// 歷史上任何一個「完整週」答對率比前一週高 10 分以上（兩週各作答 20 題，不含錯題重做）
function improveEver_(rows, today) {
  const byWeek = {};
  rows.forEach(function (r) {
    if (r.redo || r.range.indexOf('生存挑戰') === 0) return;
    const w = weekStart_(r.d);
    const s = byWeek[r.seat] = byWeek[r.seat] || {};
    const o = s[w] = s[w] || { fa: 0, fr: 0 };
    o.fa += r.answered; o.fr += r.right;
  });
  const curW = weekStart_(today), out = {};
  Object.keys(byWeek).forEach(function (seat) {
    const s = byWeek[seat];
    Object.keys(s).forEach(function (w) {
      if (w === curW) return;
      const a = s[w], b = s[shift_(w, -7)];
      if (a && b && a.fa >= 20 && b.fa >= 20 &&
        Math.round(a.fr / a.fa * 100) - Math.round(b.fr / b.fa * 100) >= 10) out[seat] = 1;
    });
  });
  return out;
}

function maxStreak_(daysObj) {
  const ds = Object.keys(daysObj).sort();
  let best = 0, run = 0, prev = '';
  ds.forEach(function (d) { run = prev && shift_(prev, 1) === d ? run + 1 : 1; if (run > best) best = run; prev = d; });
  return best;
}

function badges_() {
  const tz = 'Asia/Taipei', today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const sh = sheet_(), n = sh.getLastRow() - 1, per = {}, first = {};
  if (n > 0) {
    sh.getRange(2, 1, n, 9).getValues().forEach(function (r) { // A:I
      const seat = parseInt(r[2], 10);
      if (!seat || seat === 30) return;
      const p = per[seat] = per[seat] || { days: {}, early: false, full: false, fullN: 0, ans: 0, right: 0, redoN: 0, dayAns: {}, big: false };
      const d = r[1] instanceof Date ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd') : String(r[1]).replace(/\//g, '-');
      p.days[d] = 1;
      const answered = Number(r[7]) || 0, right = Number(r[8]) || 0;
      if (String(r[4]).indexOf('錯題重做') >= 0) p.redoN++;
      else {
        p.ans += answered; p.right += right;
        if (answered >= 10 && right === answered) { p.full = true; p.fullN++; }
        if (answered >= 50) p.big = true;
        p.dayAns[d] = (p.dayAns[d] || 0) + answered;
      }
      const ts = r[0] instanceof Date ? r[0].getTime() : Date.parse(String(r[0]).replace(/\//g, '-').replace(' ', 'T'));
      if (isFinite(ts) && (!first[d] || ts < first[d].ts)) first[d] = { ts: ts, seat: seat };
      let hh = -1;
      if (r[0] instanceof Date) hh = Number(Utilities.formatDate(r[0], tz, 'HH'));
      else { const m = String(r[0]).match(/(\d{1,2}):\d{2}/); if (m) hh = Number(m[1]); }
      if (hh >= 4 && hh < 7) p.early = true;
    });
  }
  const rows = readRows_(), cloze = readDetail_('克漏字').concat(readDetail_('寂天'));   // 週／月冠王不算克漏字和寂天
  const wk = champsAll_(rows, cloze, today, weekStart_);
  const mo = champsAll_(rows, cloze, today, function (d) { return d.slice(0, 7); });
  const imp = improveEver_(rows, today);
  const det = detailStats_();
  let dper = {};
  try { dper = dailyC_().per || {}; } catch (e) {}
  const KINDS4 = ['單字', '動詞變化', '介系詞', '克漏字'];
  const out = {}, firstN = {};
  Object.keys(first).forEach(function (d) { const k = first[d].seat; firstN[k] = (firstN[k] || 0) + 1; });
  Object.keys(per).forEach(function (seat) {
    const p = per[seat], ids = [];
    if (p.full) ids.push('full');
    const st = maxStreak_(p.days);
    if (st >= 3) ids.push('streak3');
    if (st >= 7) ids.push('streak7');
    if (st >= 14) ids.push('streak14');
    if (st >= 30) ids.push('streak30');
    if (p.ans >= 100) ids.push('q100');
    if (p.ans >= 500) ids.push('q500');
    if (p.ans >= 1000) ids.push('q1000');
    if (p.early) ids.push('early');
    if (p.redoN >= 10) ids.push('redo10');
    if (imp[seat]) ids.push('improve');
    const dk = det[seat] || {}, cz = dk['克漏字'];
    if (cz && cz.ans >= 50 && cz.right / cz.ans >= 0.85) ids.push('cloze85');
    if (KINDS4.every(function (k) { return dk[k] && dk[k].ans >= 30; })) ids.push('allkind');
    if (wk[seat]) ids.push('week');
    if (mo[seat]) ids.push('month');
    // 進階徽章
    if (st >= 60) ids.push('streak60');
    if (st >= 100) ids.push('streak100');
    const dl = Object.keys(p.days).sort();
    if (dl.length >= 30) ids.push('days30');
    if (dl.length >= 100) ids.push('days100');
    if (p.ans >= 2000) ids.push('q2000');
    if (p.ans >= 5000) ids.push('q5000');
    if (p.fullN >= 5) ids.push('full5');
    if (p.fullN >= 20) ids.push('full20');
    if (p.ans >= 300 && p.right / p.ans >= 0.9) ids.push('acc90');
    if (p.big) ids.push('marathon');
    if (Object.keys(p.dayAns).some(function (d) { return p.dayAns[d] >= 100; })) ids.push('day100');
    if (p.redoN >= 50) ids.push('redo50');
    const fN = firstN[seat] || 0;
    if (fN >= 1) ids.push('first');
    if (fN >= 10) ids.push('first10');
    if (dl.filter(function (d) { const w = new Date(d + 'T12:00:00+08:00').getDay(); return w === 0 || w === 6; }).length >= 8) ids.push('weekend');
    for (let i = 1; i < dl.length; i++) {
      if ((new Date(dl[i] + 'T12:00:00+08:00') - new Date(dl[i - 1] + 'T12:00:00+08:00')) / 864e5 >= 8) { ids.push('comeback'); break; }
    }
    [['單字', 300, 'word300'], ['動詞變化', 200, 'verb200'], ['介系詞', 200, 'prep200'], ['克漏字', 200, 'cloze200'],
     ['一字多義', 100, 'sense100'], ['片語', 100, 'phrase100'], ['會考文法', 80, 'cap80'], ['寂天', 100, 'jt100'], ['寂天', 500, 'jt500']].forEach(function (x) {
      if (dk[x[0]] && dk[x[0]].right >= x[1]) ids.push(x[2]);
    });
    const dp = dper[seat] || {};
    [[1, 'quest1'], [7, 'quest7'], [30, 'quest30']].forEach(function (x) { if ((dp.clear || 0) >= x[0]) ids.push(x[1]); });
    [[20, 'surv20'], [50, 'surv50'], [100, 'surv100']].forEach(function (x) { if ((dp.survBest || 0) >= x[0]) ids.push(x[1]); });
    [[1, 'goal1'], [4, 'goal4']].forEach(function (x) { if ((dp.goals || 0) >= x[0]) ids.push(x[1]); });
    if (ids.length) out[seat] = ids;
  });
  return { ok: true, defs: BADGE_DEFS, badges: out, today: today };
}

// ===== 每日任務：老師在「每日任務」分頁設定每天要考的範圍、題數、過關答對率 =====
// 欄位：日期 | 起 | 迄 | 題數 | 過關答對率(%) | 備註 | 小考密碼
// 有填小考密碼：只有輸入密碼的「每日小考」才算；起迄可以留空，系統以當天多數同學考的範圍為準
// 過關：任務當天或之後，範圍和任務完全相同、作答題數 ≥ 題數、答對率 ≥ 過關標準的任一次測驗（錯題重做不算）
const TASK_NAME = '每日任務';
const TASK_HEAD = ['日期', '起', '迄', '題數', '過關答對率(%)', '備註', '小考密碼'];

function taskSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(TASK_NAME);
  if (!sh) {
    sh = ss.insertSheet(TASK_NAME);
    sh.getRange(1, 1, 1, TASK_HEAD.length).setValues([TASK_HEAD]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function ymd_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Taipei', 'yyyy-MM-dd');
  const m = String(v).trim().match(/(\d{4})\D(\d{1,2})\D(\d{1,2})/);
  return m ? m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2) : '';
}

// 「D183–D180」「D183」「D183, D181」→ 回數清單（由大到小）
function dayNums_(text) {
  text = String(text || '');
  if (text.indexOf('錯題重做') >= 0) return null;
  const set = {};
  const m = text.match(/^\s*D?(\d+)\s*[–\-~～]\s*D?(\d+)\s*$/);
  if (m) {
    const a = +m[1], b = +m[2];
    for (let d = Math.min(a, b); d <= Math.max(a, b); d++) set[d] = 1;
  } else {
    (text.match(/D\s*\d+/g) || []).forEach(function (t) { set[parseInt(t.replace(/\D/g, ''), 10)] = 1; });
  }
  const out = Object.keys(set).map(Number).sort(function (a, b) { return b - a; });
  return out.length ? out : null;
}

function readTasks_() {
  const sh = taskSheet_(), n = sh.getLastRow() - 1, out = [];
  if (n <= 0) return out;
  sh.getRange(2, 1, n, 7).getValues().forEach(function (r) {
    const date = ymd_(r[0]), pw = String(r[6] == null ? '' : r[6]).trim();
    const s1 = String(r[1]).trim(), s2 = String(r[2] || '').trim();
    let days;
    if (/[,，、;；\s]/.test(s1.replace(/^\s+|\s+$/g, '')) && (s1.match(/\d+/g) || []).length > 1) {
      // 不連續：「起」欄填 D183, D175, D170（迄欄留空）
      days = dayNums_(s1.replace(/[，、;；]/g, ','));
    } else {
      days = dayNums_(s2 ? s1 + '–' + s2 : s1);
    }
    if (!date || (!days && !pw)) return;
    const base = { date: date, pw: pw, n: parseInt(r[3], 10) || 20, pass: Number(r[4]) || 80, note: String(r[5] || '') };
    if (!days) { out.push(Object.assign(base, { days: null, list: false, from: '', to: '', label: '自選範圍（以多數同學為準）' })); return; }
    const contiguous = days.length === days[0] - days[days.length - 1] + 1;
    out.push(Object.assign(base, { days: days, list: !contiguous,
      from: 'D' + days[0], to: 'D' + days[days.length - 1],
      label: contiguous ? ('D' + days[0] + (days.length > 1 ? '–D' + days[days.length - 1] : '')) : days.map(function (d) { return 'D' + d; }).join(', ') }));
  });
  return out.sort(function (x, y) { return x.date < y.date ? -1 : x.date > y.date ? 1 : 0; });
}

function tasks_(key, seatOnly) {
  const tz = 'Asia/Taipei', today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const tasks = readTasks_();
  const onlySeat = parseInt(seatOnly, 10);
  if (!onlySeat) {
    const want = PropertiesService.getScriptProperties().getProperty('TEACHER_KEY');
    if (want && String(key || '') !== want) return { ok: false, error: key ? '密碼不正確' : '請輸入老師密碼' };
  }
  const results = {}, names = {}, dists = {};
  const blank = function () { return { attempts: 0, best: 0, passAt: '', passDate: '' }; };
  tasks.forEach(function (t) { results[t.date] = {}; });
  // 先把成績讀成清單
  const rows = [], sh = sheet_(), n = sh.getLastRow() - 1;
  if (n > 0 && tasks.length) {
    const w = Math.min(14, sh.getLastColumn());
    sh.getRange(2, 1, n, w).getValues().forEach(function (r) { // A:N
      const seat = parseInt(r[2], 10);
      if (!seat || seat === 30) return;
      names[seat] = roster_()[seat] || String(r[3]);
      const days = dayNums_(r[4]);
      const answered = Number(r[7]) || 0;
      if (!days || !answered) return;
      rows.push({ seat: seat, days: days, key: days.join(','), range: String(r[4]), d: ymd_(r[1]),
        answered: answered, right: Number(r[8]) || 0, quiz: w >= 14 ? ymd_(r[13]) : '',
        when: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd HH:mm') : String(r[0]).replace(/\//g, '-') });
    });
  }
  const rateOf = function (x) { return Math.round(x.right / x.answered * 1000) / 10; };
  tasks.forEach(function (t) {
    const res = results[t.date];
    let ref = t.days ? t.days.join(',') : '';
    let pool;
    if (t.pw) {
      // 每日小考：只看輸入了當天密碼的紀錄
      pool = rows.filter(function (x) { return x.quiz === t.date; });
      // 範圍分布（每人算一次，以他第一次小考的範圍）
      const first = {}, cnt = {}, lab = {};
      pool.forEach(function (x) { if (!first[x.seat]) first[x.seat] = x; });
      Object.keys(first).forEach(function (s) { const x = first[s]; cnt[x.key] = (cnt[x.key] || 0) + 1; lab[x.key] = x.range; });
      const keys = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; });
      if (!ref && keys.length) ref = keys[0];
      dists[t.date] = keys.map(function (k) { return { range: lab[k], count: cnt[k], ok: k === ref }; });
      if (!t.days && ref) dists[t.date].ref = lab[keys[0]];
    } else {
      pool = rows.filter(function (x) { return x.d >= t.date; });
    }
    if (!ref) return;
    const refDays = ref.split(',').map(Number);
    pool.forEach(function (x) {
      if (onlySeat && x.seat !== onlySeat) return;
      if (x.key !== ref) {
        // 小考：範圍和多數人（或任務）不同；一般任務：當天考了有重疊但範圍不同
        if (t.pw || (x.d === t.date && x.days.some(function (y) { return refDays.indexOf(y) >= 0; }))) {
          const o1 = res[x.seat] = res[x.seat] || blank();
          o1.wrong = { range: x.range, rate: rateOf(x), at: x.when };
        }
        return;
      }
      if (x.answered < t.n) {
        if (t.pw || x.d === t.date) { const o2 = res[x.seat] = res[x.seat] || blank(); o2.short = { n: x.answered, rate: rateOf(x), at: x.when }; }
        return;
      }
      const o = res[x.seat] = res[x.seat] || blank(), rate = rateOf(x);
      o.attempts++;
      if (rate > o.best) o.best = rate;
      if (!o.passAt && x.right * 100 >= t.pass * x.answered) { o.passAt = x.when; o.passDate = x.d; }
    });
    t.refKey = ref;
  });
  const pub = tasks.map(function (t) {
    const ref = t.refKey ? t.refKey.split(',').map(Number) : null;
    const o = { date: t.date, from: t.from, to: t.to, label: t.label, list: t.list, days: t.days, n: t.n, pass: t.pass, note: t.note,
      quiz: !!t.pw, dist: dists[t.date] || null };
    if (!t.days && ref) o.refLabel = (dists[t.date] && dists[t.date].ref) || '';
    if (!onlySeat) o.pw = t.pw;
    return o;
  });
  const ro = roster_();
  Object.keys(ro).forEach(function (s) { if (!names[s]) names[s] = ro[s]; });
  if (onlySeat) {
    // 學生端：只回今天的任務和自己的狀態（不給密碼、不給範圍分布）
    let t = null;
    pub.forEach(function (x) { if (x.date === today) t = x; });
    if (t) delete t.dist;
    return { ok: true, today: today, task: t, me: t ? (results[t.date][onlySeat] || null) : null,
      given: ro[onlySeat] ? givenName(ro[onlySeat]) : '' };
  }
  return { ok: true, today: today, tasks: pub, results: results, names: names };
}

// 學生按「開始每日小考」前先確認密碼：GET ?action=quizpw&pw=xxxx
function quizTask_(pw) {
  pw = String(pw || '').trim().toLowerCase();
  if (!pw) return null;
  const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
  let hit = null;
  readTasks_().forEach(function (t) { if (t.date === today && t.pw && t.pw.toLowerCase() === pw) hit = t; });
  return hit;
}

// 「名單」分頁：座號 → 姓名（只存在試算表，不放在公開網頁）
let ROSTER_ = null, PINS_ = {};
// 「名單」分頁：座號 | 姓名 | 個人密碼（有填個人密碼的座號，交卷時要輸入對才收）
function roster_() {
  if (ROSTER_) return ROSTER_;
  // 先看快取（3 分鐘），省掉開試算表的時間；改了名單最多 3 分鐘後生效
  const cache = CacheService.getScriptCache(), hit = cache.get('roster-v1');
  if (hit) { const o = JSON.parse(hit); ROSTER_ = o.r; PINS_ = o.p; return ROSTER_; }
  ROSTER_ = {};
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('名單');
  if (!sh || sh.getLastRow() < 2) return ROSTER_;
  sh.getRange(2, 1, sh.getLastRow() - 1, Math.min(3, Math.max(2, sh.getLastColumn()))).getValues().forEach(function (r) {
    const seat = parseInt(r[0], 10), nm = String(r[1] || '').trim(), pin = String(r[2] == null ? '' : r[2]).trim();
    if (seat && nm) ROSTER_[seat] = nm;
    if (seat && pin) PINS_[seat] = pin;
  });
  cache.put('roster-v1', JSON.stringify({ r: ROSTER_, p: PINS_ }), 180);
  return ROSTER_;
}

// 個人密碼檢查（不分大小寫）；同一個座號 5 分鐘內錯 20 次就暫時鎖住（防止亂猜）
function checkPin_(seat, pin) {
  roster_();
  const want = PINS_[seat];
  if (!want) return { ok: true };
  const cache = CacheService.getScriptCache(), k = 'pinfail2-' + seat, fails = parseInt(cache.get(k) || '0', 10);
  if (fails >= 20) return { ok: false, error: '密碼錯太多次，請 5 分鐘後再試，或找老師幫忙。' };
  const tried = String(pin == null ? '' : pin).trim().toLowerCase();
  if (tried === want.toLowerCase()) return { ok: true };
  // 同一個錯的密碼重複送不重算
  const lk = 'pinlast-' + seat;
  if (tried && cache.get(lk) !== tried) { cache.put(k, String(fails + 1), 300); cache.put(lk, tried, 300); }
  return { ok: false, error: pin ? '個人密碼不正確，請再確認一次。' : '請輸入個人密碼。' };
}

// ===================== 家長查詢頁（docs/parent.html） =====================
// 密碼放在試算表「設定」分頁：A 欄「家長密碼」、B 欄密碼（不放在 GitHub 上）
function parentKey_() {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('設定');
  if (sh && sh.getLastRow() >= 1) {
    const v = sh.getRange(1, 1, sh.getLastRow(), 2).getValues();
    for (let i = 0; i < v.length; i++) if (String(v[i][0]).trim() === '家長密碼') return String(v[i][1]).trim();
  }
  return PropertiesService.getScriptProperties().getProperty('PARENT_KEY') || '';
}

function parent_(key, seat) {
  const want = parentKey_();
  if (!want) return { ok: false, error: '家長密碼尚未設定，請洽導師。' };
  if (String(key || '').trim() !== want) return { ok: false, error: key ? '密碼不正確' : '請輸入密碼' };
  const ro = roster_();
  const roster = Object.keys(ro).map(Number).filter(function (x) { return x !== 30 && x !== 31 && x !== 32; })
    .sort(function (a, b) { return a - b; }).map(function (x) { return { seat: x, name: ro[x] }; });
  const s = parseInt(seat, 10);
  if (!s) return { ok: true, roster: roster };
  if (!ro[s]) return { ok: false, error: '找不到這個座號' };
  const tz = 'Asia/Taipei', today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const isStu = function (x) { return x && x !== 30 && x !== 31 && x !== 32; };

  // ---- 練習量：每次交卷（成績分頁）
  const rows = readRows_().filter(function (r) { return isStu(r.seat); });
  const mine = rows.filter(function (r) { return r.seat === s; });
  const weeks = {}, classWeeks = {}, days = {};
  const wk = function (o, r) { const w = weekStart_(r.d); const x = o[w] || (o[w] = { w: w, tests: 0, answered: 0, right: 0, seats: {} }); x.tests++; x.answered += r.answered; x.right += r.right; x.seats[r.seat] = 1; };
  mine.forEach(function (r) { wk(weeks, r); days[r.d] = 1; });
  rows.forEach(function (r) { wk(classWeeks, r); });
  const nStu = roster.length || 1;
  const weekList = [];
  for (let i = 7; i >= 0; i--) {
    const w = weekStart_(shift_(today, -7 * i)), m = weeks[w] || { tests: 0, answered: 0, right: 0 }, c = classWeeks[w] || { answered: 0, right: 0 };
    weekList.push({ w: w, tests: m.tests, answered: m.answered, rate: m.answered ? Math.round(m.right / m.answered * 100) : null,
      classAnswered: Math.round(c.answered / nStu), classRate: c.answered ? Math.round(c.right / c.answered * 100) : null });
  }
  let streak = 0;
  for (let d = days[today] ? today : shift_(today, -1); days[d]; d = shift_(d, -1)) streak++;
  const tot = mine.reduce(function (a, r) { a.answered += r.answered; a.right += r.right; return a; }, { answered: 0, right: 0 });
  const ctot = rows.reduce(function (a, r) { a.answered += r.answered; a.right += r.right; return a; }, { answered: 0, right: 0 });

  // ---- 各題型答對率、常錯的單字（作答明細分頁）
  const types = {}, ctypes = {}, words = {};
  const dsh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DETAIL_NAME);
  if (dsh && dsh.getLastRow() > 1) {
    dsh.getRange(2, 1, dsh.getLastRow() - 1, 11).getValues().forEach(function (r) {
      const st = parseInt(r[1], 10);
      if (!isStu(st)) return;
      const kind = String(r[6]), ok = Number(r[7]) === 1;
      const c = ctypes[kind] || (ctypes[kind] = { answered: 0, right: 0 }); c.answered++; if (ok) c.right++;
      if (st !== s) return;
      const t = types[kind] || (types[kind] = { answered: 0, right: 0 }); t.answered++; if (ok) t.right++;
      if (kind === '會考文法') return;
      const w = String(r[5]).trim();
      if (!w) return;
      const d = r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : String(r[0]).slice(0, 10);
      const x = words[w] || (words[w] = { w: w, total: 0, wrong: 0, last: '', lastOk: false, kind: kind });
      x.total++; if (!ok) x.wrong++;
      const stamp = String(r[10]);
      if (stamp >= x.last) { x.last = stamp; x.lastOk = ok; x.lastDate = d; }
    });
  }
  const ORDER = ['單字', '動詞變化', '介系詞', '克漏字', '一字多義', '片語', '會考文法'];
  const typeList = ORDER.filter(function (k) { return types[k] || ctypes[k]; }).map(function (k) {
    const t = types[k] || { answered: 0, right: 0 }, c = ctypes[k] || { answered: 0, right: 0 };
    return { kind: k, answered: t.answered, rate: t.answered ? Math.round(t.right / t.answered * 100) : null,
      classRate: c.answered ? Math.round(c.right / c.answered * 100) : null };
  });
  const wrong = Object.keys(words).map(function (k) { return words[k]; }).filter(function (x) { return x.wrong > 0; })
    .sort(function (a, b) { return b.wrong - a.wrong || (a.lastOk === b.lastOk ? 0 : a.lastOk ? 1 : -1) || (b.last < a.last ? -1 : 1); })
    .slice(0, 30).map(function (x) { return { w: x.w, wrong: x.wrong, total: x.total, lastOk: x.lastOk, lastDate: x.lastDate }; });

  // ---- 每日小考
  const tk = tasks_(PropertiesService.getScriptProperties().getProperty('TEACHER_KEY') || '');
  const quiz = [];
  if (tk.ok) {
    tk.tasks.filter(function (t) { return t.date <= today; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }).forEach(function (t) {
      const r = (tk.results[t.date] || {})[s] || null;
      const all = tk.results[t.date] || {};
      const passN = roster.filter(function (x) { return all[x.seat] && all[x.seat].passAt; }).length;
      quiz.push({ classPass: Math.round(passN / (roster.length || 1) * 100), classPassN: passN, classN: roster.length, date: t.date, label: t.days ? t.label : (t.refLabel || '老師公布的範圍'), n: t.n, pass: t.pass,
        passAt: r && r.passAt || '', best: r ? r.best : null, attempts: r ? r.attempts : 0,
        wrongRange: r && r.wrong ? r.wrong.range : '', short: r && r.short ? r.short.n : 0 });
    });
  }

  // ---- 跟全班比：每位同學的數值（匿名，只標出自己的那一個）
  const per = {};
  roster.forEach(function (x) { per[x.seat] = { answered: 0, right: 0, week: 0, days: {}, quiz: 0 }; });
  const wk7 = shift_(today, -6);
  rows.forEach(function (r) {
    const p = per[r.seat]; if (!p) return;
    p.answered += r.answered; p.right += r.right; p.days[r.d] = 1;
    if (r.d >= wk7) p.week += r.answered;
  });
  if (tk.ok) tk.tasks.forEach(function (t) {
    const all = tk.results[t.date] || {};
    Object.keys(all).forEach(function (k) { if (per[k] && all[k].passAt) per[k].quiz++; });
  });
  const metric = function (fn, minAns) {
    const vals = [];
    let me = null;
    roster.forEach(function (x) {
      const p = per[x.seat];
      if (minAns && p.answered < minAns) return;
      const v = fn(p);
      vals.push(v);
      if (x.seat === s) me = v;
    });
    if (me == null) return { values: vals.sort(function (a, b) { return a - b; }), me: null };
    const rank = 1 + vals.filter(function (v) { return v > me; }).length;
    return { values: vals.sort(function (a, b) { return a - b; }), me: me, rank: rank, n: vals.length };
  };
  const compare = {
    answered: metric(function (p) { return p.answered; }),
    week: metric(function (p) { return p.week; }),
    rate: metric(function (p) { return Math.round(p.right / p.answered * 100); }, 50),
    days: metric(function (p) { return Object.keys(p.days).length; }),
    quiz: metric(function (p) { return p.quiz; })
  };

  return { ok: true, today: today, seat: s, name: ro[s], roster: roster, compare: compare,
    summary: { answered: tot.answered, rate: tot.answered ? Math.round(tot.right / tot.answered * 100) : null,
      classRate: ctot.answered ? Math.round(ctot.right / ctot.answered * 100) : null,
      classAnswered: Math.round(ctot.answered / nStu), days: Object.keys(days).length, streak: streak, tests: mine.length,
      firstDay: Object.keys(days).sort()[0] || '' },
    weeks: weekList, types: typeList, wrong: wrong, quiz: quiz };
}

// ===================== 等級與人物造型 =====================
// 經驗值 = 答對題數 × 1 ＋ 每日小考過關 × 30 ＋ 練習天數 × 10（數字在 docs/avatar-items.json 的 levels）
// 造型存在試算表「造型」分頁：座號 | 造型（JSON）| 更新時間
const AV_ITEMS_URL = 'https://nian-zu.github.io/904ENGVOC/avatar-items.json';
// GitHub 上的檔案網址加上時間參數，避免抓到舊的快取版本（之前造型清單一直是舊的，新部件存不進去、商品不能買）
function fresh_(url) { return url + (url.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now(); }
function avItems_() {
  const cache = CacheService.getScriptCache();
  let t = cache.get('av_items2');
  if (!t) { t = UrlFetchApp.fetch(fresh_(AV_ITEMS_URL)).getContentText(); cache.put('av_items2', t, 600); }
  return JSON.parse(t);
}
function avSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName('造型');
  if (!sh) { sh = ss.insertSheet('造型'); sh.getRange(1, 1, 1, 5).setValues([['座號', '造型', '更新時間', '已購買', '已花代幣']]).setFontWeight('bold'); sh.setFrozenRows(1); }
  else if (sh.getLastColumn() < 5) sh.getRange(1, 4, 1, 2).setValues([['已購買', '已花代幣']]).setFontWeight('bold');
  return sh;
}
function avNeed_(n, base) { return base * n * (n - 1); }
function avLevel_(xp, base) { let n = 1; while (n < 50 && xp >= avNeed_(n + 1, base)) n++; return n; }
function avTitle_(lv, titles) { let t = ''; titles.forEach(function (x) { if (lv >= x[0]) t = x[1]; }); return t; }

// 所有學生的經驗值、等級、造型（快取 60 秒）
function profiles_() {
  const cache = CacheService.getScriptCache(), pk = 'prof|' + ver_(), hit = cache.get(pk);
  if (hit) return JSON.parse(hit);
  const L = avItems_().levels, out = {};
  const rows = readRows_();
  rows.forEach(function (r) {
    const o = out[r.seat] || (out[r.seat] = { right: 0, quiz: 0, days: {} });
    o.right += r.right; o.days[r.d] = 1;
  });
  const tk = tasks_(PropertiesService.getScriptProperties().getProperty('TEACHER_KEY') || '');
  const perfect = {};
  if (tk.ok) tk.tasks.forEach(function (t) {
    const res = tk.results[t.date] || {};
    Object.keys(res).forEach(function (k) {
      if (res[k].passAt) { const o = out[k] || (out[k] = { right: 0, quiz: 0, days: {} }); o.quiz++; }
      if (t.quiz && res[k].best >= 100 && res[k].attempts) perfect[k] = 1;
    });
  });
  // 寶物：徽章＋小考次數＋等級＋講義題答對數
  let bd = {}, det = {};
  try { bd = badgesC_().badges || {}; } catch (e) {}
  try { det = detailStats_(); } catch (e) {}
  let dper = {};
  try { dper = dailyC_().per || {}; } catch (e) {}
  const sh = avSheet_(), av = {}, own = {}, spent = {}, show = {};
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues().forEach(function (r) {
    const k = parseInt(r[0], 10); if (!k) return;
    try { av[k] = JSON.parse(String(r[1] || '{}')); } catch (e) {}
    try { own[k] = JSON.parse(String(r[3] || '[]')); } catch (e) { own[k] = []; }
    spent[k] = Number(r[4]) || 0;
    try { show[k] = JSON.parse(String(r[5] || '[]')); } catch (e) { show[k] = []; }
  });
  const CR = L.coin || { right: 1, quiz: 20, badge: 20 };
  const res = {};
  Object.keys(roster_()).concat(Object.keys(out)).forEach(function (k) {
    k = parseInt(k, 10); if (!k || k === 30 || res[k]) return;
    const o = out[k] || { right: 0, quiz: 0, days: {} }, days = Object.keys(o.days).length;
    const xp = o.right * L.xp.right + o.quiz * L.xp.quiz + days * L.xp.day;
    const lv = avLevel_(xp, L.base), tr = (bd[k] || []).slice(), dk = det[k] || {};
    [[1, 'quiz1'], [5, 'quiz5'], [10, 'quiz10'], [30, 'quiz30']].forEach(function (x) { if (o.quiz >= x[0]) tr.push(x[1]); });
    if (perfect[k]) tr.push('quizPerfect');
    if (lv >= 10) tr.push('lv10');
    if (lv >= 20) tr.push('lv20');
    const nb = (bd[k] || []).length;   // 徽章收集數量的寶物
    if (nb >= 10) tr.push('b10');
    if (nb >= 20) tr.push('b20');
    if (nb >= 30) tr.push('b30');
    if (nb >= BADGE_DEFS.length) tr.push('b40');
    [['一字多義', 50, 'sense50'], ['片語', 50, 'phrase50'], ['會考文法', 30, 'cap30']].forEach(function (x) { if (dk[x[0]] && dk[x[0]].right >= x[1]) tr.push(x[2]); });
    const dp = dper[k] || {};
    const earn = o.right * CR.right + o.quiz * CR.quiz + (bd[k] || []).length * CR.badge + (dp.qcoin || 0) + (dp.scoin || 0) + (dp.gcoin || 0);
    res[k] = { xp: xp, lv: lv, right: o.right, quiz: o.quiz, days: days, a: av[k] || null, tr: tr,
      own: own[k] || [], earn: earn, coin: Math.max(0, earn - (spent[k] || 0)),
      show: (show[k] || []).filter(function (id) { return (bd[k] || []).indexOf(id) >= 0; }) };
  });
  try { cache.put(pk, JSON.stringify(res), 600); } catch (e) {}
  return res;
}
function avMap_() {
  try {
    const p = profiles_(), m = {};
    Object.keys(p).forEach(function (k) { m[k] = { lv: p[k].lv, a: p[k].a, show: p[k].show || [] }; });
    return m;
  } catch (e) { return {}; }
}
function profile_(seat) {
  const s = parseInt(seat, 10), p = profiles_()[s];
  if (!p) return { ok: false, error: '找不到這個座號' };
  const L = avItems_().levels;
  return { ok: true, seat: s, xp: p.xp, lv: p.lv, title: avTitle_(p.lv, L.titles), cur: avNeed_(p.lv, L.base), next: p.lv >= 50 ? null : avNeed_(p.lv + 1, L.base),
    right: p.right, quiz: p.quiz, days: p.days, a: p.a, xpRule: L.xp, tr: p.tr || [],
    coin: p.coin || 0, earn: p.earn || 0, own: p.own || [], show: p.show || [], coinRule: L.coin || { right: 1, quiz: 20, badge: 20 } };
}
// 存造型：每個部件都要存在、而且等級夠才能用，否則換回預設
function saveAvatar_(seat, a) {
  const items = avItems_(), p = profiles_()[seat] || { lv: 1 }, clean = {};
  items.cats.forEach(function (c) {
    const want = a && a[c.key], it = c.items.filter(function (x) { return x.id === want; })[0];
    const ok = it && (it.t ? (p.tr || []).indexOf(it.t) >= 0
      : (it.lv != null && it.lv <= p.lv) || (it.s != null && (p.own || []).indexOf(c.key + ':' + it.id) >= 0));
    clean[c.key] = ok ? it.id : items.default[c.key];
  });
  const sh = avSheet_(), n = sh.getLastRow() - 1;
  const stamp = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm');
  let row = 0;
  if (n > 0) sh.getRange(2, 1, n, 1).getValues().forEach(function (r, i) { if (parseInt(r[0], 10) === seat) row = i + 2; });
  if (row) sh.getRange(row, 2, 1, 2).setValues([[JSON.stringify(clean), stamp]]);
  else sh.appendRow([seat, JSON.stringify(clean), stamp, '[]', 0]);
  bump_();
  return { ok: true, a: clean };
}
// 排行榜上要展示的徽章（自己選，最多 3 個，只能選已經拿到的）
function saveShow_(seat, ids) {
  const mine = (badgesC_().badges || {})[seat] || [];
  const clean = (Array.isArray(ids) ? ids : []).map(String).filter(function (id, i, a) { return mine.indexOf(id) >= 0 && a.indexOf(id) === i; }).slice(0, 3);
  const sh = avSheet_(), n = sh.getLastRow() - 1;
  if (sh.getRange(1, 6).getValue() !== '展示徽章') sh.getRange(1, 6).setValue('展示徽章').setFontWeight('bold');
  let row = 0;
  if (n > 0) sh.getRange(2, 1, n, 1).getValues().forEach(function (r, i) { if (parseInt(r[0], 10) === seat) row = i + 2; });
  if (row) sh.getRange(row, 6).setValue(JSON.stringify(clean));
  else sh.appendRow([seat, '', '', '[]', 0, JSON.stringify(clean)]);
  bump_();
  return { ok: true, show: clean };
}
// 商店：用代幣買造型（代幣＝答對題數＋小考過關＋徽章，扣掉已經花掉的）
function buy_(seat, cat, id) {
  const items = avItems_(), c = items.cats.filter(function (x) { return x.key === cat; })[0];
  const it = c && c.items.filter(function (x) { return x.id === id; })[0];
  if (!it || it.s == null) return { ok: false, error: '這個商品不能買' };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    bump_();
    const p = profiles_()[seat];
    if (!p) return { ok: false, error: '找不到這個座號' };
    const key = cat + ':' + id, own = (p.own || []).slice();
    if (own.indexOf(key) >= 0) return { ok: true, coin: p.coin, own: own, already: true };
    if (p.coin < it.s) return { ok: false, error: '代幣不夠，還差 ' + (it.s - p.coin) + ' 枚', coin: p.coin };
    own.push(key);
    const sh = avSheet_(), n = sh.getLastRow() - 1;
    let row = 0;
    if (n > 0) sh.getRange(2, 1, n, 1).getValues().forEach(function (r, i) { if (parseInt(r[0], 10) === seat) row = i + 2; });
    const spent = p.earn - p.coin + it.s;
    if (row) sh.getRange(row, 4, 1, 2).setValues([[JSON.stringify(own), spent]]);
    else sh.appendRow([seat, JSON.stringify(p.a || items.default), '', JSON.stringify(own), spent]);
    bump_();
    return { ok: true, coin: p.coin - it.s, own: own };
  } finally { lock.releaseLock(); }
}
