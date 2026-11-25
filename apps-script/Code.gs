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

// ===== 兩個班：904 座號 1–29；916 用 91601–91699（例如 91605 = 916 班 5 號）；30–99 是測試／老師／來賓帳號 =====
const CLASSES = ['904', '915', '916'];
// 老師帳號加入某一班（算進那班的排行、週目標、班級對抗），例如 31 號玠汝老師算 916
const STAFF_CLASS = { 31: '916' };
function classOf_(seat) { seat = +seat; return seat >= 90000 ? String(Math.floor(seat / 100)) : seat > 0 && seat < 30 ? '904' : STAFF_CLASS[seat] || ''; }
function isStudent_(seat) { return !!classOf_(seat); }
function validSeat_(seat) { seat = +seat; return (seat >= 1 && seat <= 99) || (seat >= 91501 && seat <= 91599) || (seat >= 91601 && seat <= 91699); }
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
    if (!validSeat_(seat)) return out_({ ok: false, error: '座號不正確' });
    const pc = checkPin_(seat, body.pin);
    if (!pc.ok) return out_({ ok: false, error: pc.error, pin: true });
    if (body.type === 'avatar') return out_(saveAvatar_(seat, body.avatar));
    if (body.type === 'buy') return out_(buy_(seat, String(body.cat || ''), String(body.id || '')));
    if (body.type === 'show') return out_(saveShow_(seat, body.show));
    if (body.type === 'gift') return out_(gift_(seat, body));
    if (body.type === 'inbox') return out_(inbox_(seat));
    if (body.type === 'giftact') return out_(giftAct_(seat, body.id, body.act));
    if (body.type === 'giftpref') return out_(giftPref_(seat, !!body.block));
    if (body.type === 'feed') return out_(feedPet_(seat));
    if (body.type === 'duelnew') return out_(duelNew_(seat, body));
    if (body.type === 'duelplay') return out_(duelPlay_(seat, body));
    if (body.type === 'duels') return out_(duels_(seat));
    if (body.type === 'dueldecline') return out_(duelDecline_(seat, body.id));
    if (body.type === 'bossinfo') return out_(bossInfo_(seat));
    if (body.type === 'boss') return out_(bossFight_(seat, body));
    if (body.type === 'news') return out_(news_(seat, !!body.check));
    if (body.type === 'clap') return out_(clap_(seat, parseInt(body.id, 10)));
    if (body.type === 'start') return out_(startTok_(seat, body.ids, body.quiz));
    // 名單上有這個座號就用名單的姓名（學生打錯字也會自動更正）
    const name = (roster_()[seat] || String(body.name || '').trim()).slice(0, 20);
    if (!name) return out_({ ok: false, error: '請輸入姓名' });
    const answers = Array.isArray(body.answers) ? body.answers.slice(0, 300) : [];
    if (!answers.length) return out_({ ok: false, error: '沒有作答資料' });
    const tk = checkTok_(seat, body, answers);
    if (!tk.ok) {
      try { blockedSheet_().appendRow([new Date(), seat, String(body.name || '').slice(0, 20), tk.error, String(body.range || '').slice(0, 60), answers.length, parseInt(body.seconds, 10) || 0]); } catch (e) {}
      return out_(tk);
    }

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
    // 同一題同一天只有「第一次答對」算進答對數／代幣／排行榜（答錯後訂正答對也算；已經答對過再刷就不算）
    const todayK = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd'), okSet = okToday_(seat, todayK);
    let counted = 0;
    detail.forEach(function (x) {
      if (x[2] && !okSet[x[0]]) { okSet[x[0]] = 1; x.push(1); counted++; } else x.push(0);
    });
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
    let retry = false;
    if (body.quiz && !redo) {
      const qt = quizTask_(body.quiz);
      if (qt) {
        // 當天第一份「寫完全部題目」的小考才是正式成績；中途結束、或已經有正式成績之後再考，都記成「重考」（只算練習）
        if (answered < total || hasOfficialQuiz_(seat, qt.date)) retry = true; else quiz = qt.date;
        if (retry) quiz = '';
        if (retry) body._retryDate = qt.date;
      }
    }
    // 補做以前沒過關的任務：N 欄記「補＋任務日期」（任務統計會把它算進那天的任務，過關日期是今天＝補做）
    let makeup = '';
    if (!quiz && body.makeup && !redo) {
      const md = String(body.makeup).slice(0, 10), td = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
      if (md < td && readTasks_().some(function (t) { return t.date === md; })) makeup = md;
    }
    row.push(quiz ? "'" + quiz : body._retryDate ? "'重考" + body._retryDate : makeup ? "'補" + makeup : '');

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sh = sheet_();
      if (sh.getMaxColumns() < row.length) sh.insertColumnsAfter(sh.getMaxColumns(), row.length - sh.getMaxColumns());
      if (!sh.getRange(1, 14).getValue()) sh.getRange(1, 14).setValue('小考').setFontWeight('bold');
      row.push(counted);   // O 欄：計分答對（同題同日只算第一次答對）
      if (!sh.getRange(1, 15).getValue()) sh.getRange(1, 15).setValue('計分答對').setFontWeight('bold');
      append_(sh, [row]);
      const day = "'" + p[0] + '-' + ('0' + p[1]).slice(-2) + '-' + ('0' + p[2]).slice(-2);
      const stamp = "'" + day.slice(1) + ' ' + ('0' + p[3]).slice(-2) + ':' + ('0' + p[4]).slice(-2) + ':' + ('0' + p[5]).slice(-2);
      const rows = detail.map(function (x) {
        return [day, seat, "'" + name, typeof x[1][2] === 'string' ? x[1][2] : 'D' + (183 - x[1][2]), x[0], "'" + x[1][1], x[4], x[2] ? 1 : 0, "'" + x[3], redo, stamp, x[5]];
      });
      if (rows.length) {
        const dt = detailSheet_();
        append_(dt, rows);
      }
      saveOkToday_(seat, todayK, okSet);
      bump_();   // 經驗值要重算
    } finally {
      lock.releaseLock();
    }
    try { petGain_(seat, right); } catch (e) {}   // 答對的題數也讓正在帶的寵物長大
    if (tk.tok) CacheService.getScriptCache().put('tku|' + tk.tok, '1', 21600);   // 憑證用過就作廢
    return out_({ ok: true, score: score, right: right, answered: answered, counted: counted, retry: retry || null,
      quiz: quiz ? true : (body.quiz && !retry ? false : null), makeup: makeup || null });
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
  if (p.action === 'dash') return out_(dash_(p.key, p.from, p.to));
  if (p.action === 'anomaly') return out_(teacherOk_(p.key) ? anomalies_(p.from, p.to) : { ok: false, error: '請輸入老師密碼' });
  if (p.action === 'anomalyAct') return out_(teacherOk_(p.key) ? anomalyAct_(p.k, p.act) : { ok: false, error: '請輸入老師密碼' });
  if (p.action === 'badges') return out_(badgesC_());
  if (p.action === 'tasks') return out_(tasks_(p.key, p.seat));
  if (p.action === 'profile') return out_(profile_(p.seat, p.fresh === '1'));
  if (p.action === 'daily') return out_(dailyFor_(p.seat));
  if (p.action === 'names') return out_(names_());
  if (p.action === 'news') return out_(cachedSoft_('news0', 21600, 60, function () { return news_(0, false); }));   // 光榮榜：不用登入也能看
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
  { id: 'acc90', tier: 2, coin: 20, need: 1, t: '一次作答 20 題以上，答對率 90% 以上', val: function (rs) { return rs.filter(function (r) { return r.answered >= 20 && r.raw >= r.answered * 0.9; }).length; } },
  { id: 'jt20', tier: 2, coin: 20, need: 20, t: '寂天答對 20 題', val: function (rs, dk) { return dk['寂天'] || 0; } },
  { id: 'surv8', tier: 2, coin: 20, need: 8, t: '生存挑戰撐到 8 題', val: function (rs) { return max_(rs.filter(isSurv_), 'right'); } },
  { id: 'verb10', tier: 2, coin: 20, need: 10, t: '動詞變化答對 10 題', val: function (rs, dk) { return dk['動詞變化'] || 0; } },
  { id: 'r100', tier: 3, coin: 30, need: 100, t: '今天答對 100 題', val: function (rs) { return sum_(rs, 'right'); } },
  { id: 'full15', tier: 3, coin: 30, need: 1, t: '一次作答 15 題以上全對', val: function (rs) { return rs.filter(function (r) { return !isSurv_(r) && r.answered >= 15 && r.raw === r.answered; }).length; } },
  { id: 'surv15', tier: 3, coin: 30, need: 15, t: '生存挑戰撐到 15 題', val: function (rs) { return max_(rs.filter(isSurv_), 'right'); } },
  { id: 'big40', tier: 3, coin: 30, need: 1, t: '一次作答 40 題以上，答對率 80% 以上', val: function (rs) { return rs.filter(function (r) { return r.answered >= 40 && r.raw >= r.answered * 0.8; }).length; } }
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
function mondayOf_(d) { return weekStart_(d); }   // 週次規則見 weekStart_（第一週 11/14–11/22）
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
  digestRows_().forEach(function (r) {
    if (r.d < QUEST_START || !r.right) return;
    const m = dkBy[r.seat + '|' + r.d] = dkBy[r.seat + '|' + r.d] || {};
    m[r.kind] = (m[r.kind] || 0) + r.right;
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
  // 每個班各自的週目標（鍵：班級|週一日期）
  const wk = {}, wkSeat = {};
  rows.forEach(function (r) {
    const c = classOf_(r.seat); if (!c) return;
    const w = c + '|' + mondayOf_(r.d);
    wk[w] = (wk[w] || 0) + r.right;
    const ws = wkSeat[w] = wkSeat[w] || {}; ws[r.seat] = (ws[r.seat] || 0) + r.answered;
  });
  const goalOf = function (cw) { const c = cw.split('|')[0], w = cw.split('|')[1]; return Math.max(2000, Math.round((wk[c + '|' + prevWeek_(w)] || 0) * 1.1 / 100) * 100); };
  Object.keys(wk).forEach(function (cw) {
    if (cw.split('|')[1] < mondayOf_(QUEST_START) || wk[cw] < goalOf(cw)) return;
    Object.keys(wkSeat[cw]).forEach(function (seat) { if (wkSeat[cw][seat] >= 50) { const p = P(+seat); p.gcoin += 50; p.goals++; } });
  });
  const thisW = mondayOf_(today);
  // 3b) 班級對抗：每週比「平均每人答對題數」（各班人數不同，用平均才公平）。
  //     贏的班，本週作答 50 題以上的人各得 40 代幣；每班每週答對最多的人是該班 MVP
  const nCls = {};
  Object.keys(roster_()).forEach(function (k) { const c = classOf_(+k); if (c) nCls[c] = (nCls[c] || 0) + 1; });
  const avgOf = function (c, w) { return nCls[c] ? Math.round((wk[c + '|' + w] || 0) / nCls[c] * 10) / 10 : 0; };
  const weeks = {};
  Object.keys(wk).forEach(function (cw) { weeks[cw.split('|')[1]] = 1; });
  Object.keys(weeks).forEach(function (w) {
    if (w < mondayOf_(QUEST_START)) return;
    const done = w < thisW;   // 本週還沒結束：勝負週日晚上才算
    // MVP：每班本週答對最多的人（週結束才算）
    CLASSES.forEach(function (c) {
      const rs = {};
      rows.forEach(function (r) { if (classOf_(r.seat) === c && mondayOf_(r.d) === w) rs[r.seat] = (rs[r.seat] || 0) + r.right; });
      const best = Object.keys(rs).sort(function (a, b) { return rs[b] - rs[a]; })[0];
      if (done && best && rs[best] > 0) P(+best).mvp = (P(+best).mvp || 0) + 1;
    });
    if (!done) return;
    // 各班平均最高的贏（平手就不算）
    const avgs = CLASSES.map(function (c) { return [c, avgOf(c, w)]; }).sort(function (x, y) { return y[1] - x[1]; });
    if (!avgs.length || avgs[0][1] <= 0 || (avgs[1] && avgs[1][1] === avgs[0][1])) return;
    const win = avgs[0][0], ws = wkSeat[win + '|' + w] || {};
    Object.keys(ws).forEach(function (seat) { if (ws[seat] >= 50) { const p = P(+seat); p.bcoin = (p.bcoin || 0) + 40; p.wins = (p.wins || 0) + 1; } });
  });
  // 今天各班交卷率
  const todayBy = {};
  rows.forEach(function (r) { if (r.d === today && classOf_(r.seat)) (todayBy[classOf_(r.seat)] = todayBy[classOf_(r.seat)] || {})[r.seat] = 1; });
  const battle = CLASSES.reduce(function (o, c) {
    o[c] = { avg: avgOf(c, thisW), n: nCls[c] || 0, today: Math.min(nCls[c] || 0, Object.keys(todayBy[c] || {}).length),
      lastAvg: avgOf(c, prevWeek_(thisW)) };
    return o;
  }, {});
  // 4) 生存挑戰紀錄
  rows.forEach(function (r) {
    if (!isSurv_(r)) return;
    const p = P(r.seat);
    p.survBest = Math.max(p.survBest, r.raw);
    if (r.d >= thisW) p.survWeek = Math.max(p.survWeek, r.raw);
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
    week: CLASSES.reduce(function (o, c) { const cw = c + '|' + thisW; o[c] = { from: thisW, total: wk[cw] || 0, goal: goalOf(cw), mine: wkSeat[cw] || {} }; return o; }, {}),
    survTop: survTop, battle: battle, per: per };
}
function dailyC_() { return cachedSoft_('daily2|' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd'), 21600, 60, daily_); }
function dailyFor_(seat) {
  const D = dailyC_(), s = parseInt(seat, 10), p = D.per[s] || { today: [0, 0, 0], streak: 0, survBest: 0, survWeek: 0 };
  return { ok: true, today: D.today, quests: D.quests.map(function (q, i) { return Object.assign({ val: (p.today || [])[i] || 0 }, q); }), clear: D.clear,
    streak: p.streak, doneToday: !!p.done, streakCoin: Math.min(p.done ? p.streak : p.streak + 1, 10) * 2, survBest: p.survBest, survWeek: p.survWeek, survTop: D.survTop,
    week: (function () { const W = D.week[classOf_(s) || '904'] || {}, M = W.mine || {};
      return { cls: classOf_(s) || '904', from: W.from, total: W.total || 0, goal: W.goal || 2000, mine: M[s] || 0, people: Object.keys(M).filter(function (k) { return M[k] >= 50; }).length }; })(),
    battle: D.battle || null, wins: p.wins || 0, mvp: p.mvp || 0,
    coins: { quest: p.qcoin || 0, streak: p.scoin || 0, goal: p.gcoin || 0, battle: p.bcoin || 0 }, clearDays: p.clear || 0 };
}
function badgesC_() { return cachedSoft_('badges2|' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd'), 21600, 90, badges_); }
function ver_() { return CacheService.getScriptCache().get('ver') || '0'; }
function bump_() { CacheService.getScriptCache().put('ver', Date.now() + '.' + Math.floor(Math.random() * 1e6), 21600); }
// 排行榜這類「大家都在看、晚一分鐘也沒關係」的資料：有人交卷後，舊結果最多再用 stale 秒才重算，
// 避免下課大家一直交卷時，每個人打開排行榜都要等伺服器從頭算一次
function cachedSoft_(name, sec, stale, fn) {
  const cache = CacheService.getScriptCache(), ver = ver_(), now = Date.now(), hit = cache.get(name);
  if (hit) {
    try {
      const h = JSON.parse(hit);
      if (h.ver === ver || now - h.t < stale * 1000) return h.v;
    } catch (e) {}
  }
  const v = fn(), t = JSON.stringify({ ver: ver, t: now, v: v });
  if (t.length < 95000) try { cache.put(name, t, sec); } catch (e) {}
  return v;
}
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
  const cls = CLASSES.indexOf(p.cls) >= 0 ? p.cls : '';
  const r = cachedSoft_('bd2|' + period + '|' + type + '|' + cls + '|' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd'), 21600, 60, function () { return boardCore_({ period: period, type: type, cls: cls }); });
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
  if (period === 'week') { from = weekStart_(today); prevFrom = prevWeek_(from); prevTo = shift_(from, -1); }
  if (period === 'month') { from = today.slice(0, 8) + '01'; prevTo = shift_(from, -1); prevFrom = prevTo.slice(0, 8) + '01'; }

  // type=word|verb|prep|cloze：只算這種題型（用「作答明細」逐題資料）；不給就是全部題型（用「成績」）
  const TYPE_ZH = { word: '單字', verb: '動詞變化', prep: '介系詞', cloze: '克漏字', sense: '一字多義', phrase: '片語', cap: '會考文法', jt: '寂天' };
  const type = TYPE_ZH[p.type] ? p.type : 'all';
  // 只看某一班（cls=904／916）：其他班和老師帳號都不列入
  const keep = CLASSES.indexOf(p.cls) >= 0 ? function (xs) { return xs.filter(function (r) { return classOf_(r.seat) === p.cls; }); } : function (xs) { return xs; };
  const allRows = keep(readRows_());
  const rows = type === 'all' ? allRows : keep(readDetail_(TYPE_ZH[type]));
  const clozeRows = keep(readDetail_('克漏字'));
  const cur = agg_(rows, from, today), prv = prevFrom ? agg_(rows, prevFrom, prevTo) : {};
  // 「全部」排行不算克漏字：從每人的題數扣掉同期間克漏字的題數
  // 「全部」也不算寂天（寂天有自己的排行）
  if (type === 'all') {
    const jtRows = keep(readDetail_('寂天'));
    // 逐題明細分不出哪些寂天題是生存挑戰／BOSS 戰；那些題本來就沒算進答對率，扣的時候要先排除
    const timedRows = allRows.filter(function (r) { return timed_(r.range) && !r.redo; });
    const jtMinus = function (a, b) {
      const z = agg_(jtRows, a, b), t = agg_(timedRows.map(function (r) { return Object.assign({}, r, { range: '' }); }), a, b);
      Object.keys(z).forEach(function (k) { if (t[k]) { z[k].fAns = Math.max(0, z[k].fAns - t[k].fAns); z[k].fRight = Math.max(0, z[k].fRight - t[k].fRight); } });
      return z;
    };
    minus_(cur, agg_(clozeRows, from, today)); if (prevFrom) minus_(prv, agg_(clozeRows, prevFrom, prevTo));
    minus_(cur, jtMinus(from, today)); if (prevFrom) minus_(prv, jtMinus(prevFrom, prevTo));
    Object.keys(cur).forEach(function (k) { const c = cur[k]; c.fAns = Math.max(0, c.fAns); c.fRight = Math.max(0, Math.min(c.fRight, c.fAns)); });
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
    type: type, titles: titles_(list, prv, streaks, period), fame: fame_(allRows, today, clozeRows.concat(keep(readDetail_('寂天')))), av: avMap_() };
}

// 老師儀表板：GET ?action=dash&key=密碼
// 密碼（選用）放在「專案設定 → 指令碼屬性」的 TEACHER_KEY；沒設就不用密碼
// 回傳「儀表板資料」分頁各區塊（由公式整理好的統計）
const DASH_BLOCKS = { daily: [1, 7], unit_stats: [9, 4], item_stats: [14, 3], wrong_picks: [18, 3],
  type_stats: [22, 4], wrong_words: [27, 3], redo_stats: [31, 4] }; // [起始欄（A=1）, 欄數]

function dash_(key, from, to) {
  // 沒設 TEACHER_KEY 就不需要密碼；設了就要輸入正確密碼
  const want = PropertiesService.getScriptProperties().getProperty('TEACHER_KEY');
  if (want && String(key || '') !== want) return { ok: false, error: key ? '密碼不正確' : '請輸入老師密碼' };
  // 直接從「成績」「作答明細」算，才能依期間（from～to，yyyy-MM-dd）篩選；沒給期間就是全部
  try { return dashRange_(from, to); } catch (e) {}
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
  const w = Math.min(15, sh.getLastColumn());
  sh.getRange(2, 1, n, w).getValues().forEach(function (r) { // A:O（O＝計分答對）
    const seat = parseInt(r[2], 10);
    if (!seat || seat === 30) return;
    const d = r[1] instanceof Date ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd') : String(r[1]);
    if (invMatch_(seat, r[4], d)) return;   // 老師標成無效的紀錄
    out.push({ d: d, seat: seat, name: roster_()[seat] || String(r[3]),
      redo: String(r[4]).indexOf('錯題重做') >= 0, answered: Number(r[7]) || 0,
      right: (w >= 15 && r[14] !== '' && r[14] != null) ? Number(r[14]) || 0 : Number(r[8]) || 0,   // 計分答對（同題同日只算一次）
      raw: Number(r[8]) || 0,                                                                     // 實際答對（算答對率用）
      range: String(r[4]), kind: String(r[5]), h: r[0] instanceof Date ? Number(Utilities.formatDate(r[0], tz, 'H')) : 12 });
  });
  return out;
}

// 「作答明細」某一題型的逐題資料，依每次交卷合併成一列（格式同 readRows_）
let DETAIL_VALUES_ = null;   // 同一次執行內只讀一次「作答明細」
function detailValues_() {
  if (DETAIL_VALUES_) return DETAIL_VALUES_;
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DETAIL_NAME);
  DETAIL_VALUES_ = !sh || sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, Math.min(12, sh.getLastColumn())).getValues();
  const inv = invStamps_();
  if (inv.n) DETAIL_VALUES_ = DETAIL_VALUES_.filter(function (r) { return !inv.s[parseInt(r[1], 10) + '|' + String(r[10])]; });
  return DETAIL_VALUES_;
}
// ===== 作答明細摘要（加速）=====
// 「作答明細」每答一題就多一列，幾萬列每次整張讀要好幾秒、而且越來越慢。
// 改成把它濃縮成「每人每次交卷每種題型：日期、是否錯題重做、作答數、答對數」＋「每人練過哪些天數／單元」，
// 存在快取；之後每次只讀新增的那幾列（舊的資料不會變），所以排行榜、徽章、每日挑戰都不用再整張讀。
let DIGEST_ = null;
function digest_() {
  if (DIGEST_) return DIGEST_;
  const cache = CacheService.getScriptCache(), tz = 'Asia/Taipei';
  let dg = null;
  try {
    const meta = JSON.parse(cache.get('dg5|meta') || 'null');
    if (meta && meta.n) {
      const keys = []; for (let i = 0; i < meta.n; i++) keys.push('dg5|' + i);
      const got = cache.getAll(keys);
      if (keys.every(function (k) { return got[k] != null; })) dg = JSON.parse(keys.map(function (k) { return got[k]; }).join(''));
    }
  } catch (e) { dg = null; }
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DETAIL_NAME);
  const lastRow = sh ? sh.getLastRow() : 1;
  if (!dg || dg.last > lastRow) dg = { last: 1, S: {}, U: {} };   // 第一次、或有人刪了列 → 從頭建
  if (lastRow > dg.last) {
    const inv = invStamps_();
    sh.getRange(dg.last + 1, 1, lastRow - dg.last, Math.min(12, sh.getLastColumn())).getValues().forEach(function (r) {
      const seat = parseInt(r[1], 10); if (!seat || seat === 30) return;
      if (inv.n && inv.s[seat + '|' + String(r[10])]) return;   // 老師標成無效的紀錄
      const d = r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : String(r[0]).replace(/^'/, '').slice(0, 10);
      const k = seat + '|' + String(r[10]) + '|' + String(r[6]);
      const t = dg.S[k] = dg.S[k] || [d, Number(r[9]) === 1 ? 1 : 0, 0, 0, 0];
      t[2]++; if (Number(r[7]) === 1) { t[3]++; if (r[11] === '' || r[11] == null || Number(r[11]) === 1) t[4] = (t[4] || 0) + 1; }
      const u = String(r[3]);
      if (/^[DU]\d+$/.test(u)) { const us = dg.U[seat] = dg.U[seat] || ''; if ((',' + us + ',').indexOf(',' + u + ',') < 0) dg.U[seat] = us ? us + ',' + u : u; }
    });
    dg.last = lastRow;
    try {
      const t = JSON.stringify(dg), parts = {}, N = 90000, n = Math.ceil(t.length / N);
      for (let i = 0; i < n; i++) parts['dg5|' + i] = t.slice(i * N, (i + 1) * N);
      parts['dg5|meta'] = JSON.stringify({ n: n, last: dg.last });
      cache.putAll(parts, 21600);
    } catch (e) {}
  }
  DIGEST_ = dg;
  return dg;
}
// 摘要逐筆：{seat, stamp, kind, d, redo, answered, right}
function digestRows_() {
  const dg = digest_();
  return Object.keys(dg.S).map(function (k) {
    const p = k.split('|'), v = dg.S[k];
    return { seat: +p[0], stamp: p[1], kind: p.slice(2).join('|'), d: v[0], redo: v[1] === 1, answered: v[2], right: v[4] != null ? v[4] : v[3], raw: v[3] };
  });
}
function readDetail_(kindZh) {
  const ro = roster_();
  return digestRows_().filter(function (r) { return r.kind === kindZh; }).map(function (r) {
    return { d: r.d, seat: r.seat, name: ro[r.seat] || '', redo: r.redo, answered: r.answered, right: r.right, raw: r.raw };
  });
}

function agg_(rows, from, to) {
  const st = {};
  rows.forEach(function (r) {
    if (r.d < from || r.d > to) return;
    const s = st[r.seat] || (st[r.seat] = { seat: r.seat, name: '', right: 0, answered: 0, tests: 0, fRight: 0, fAns: 0, days: {} });
    s.name = r.name; s.right += r.right; s.answered += r.answered; s.tests++; s.days[r.d] = 1;
    if (!r.redo && !timed_(r.range)) { s.fRight += (r.raw != null ? r.raw : r.right); s.fAns += r.answered; }   // 答對率不算錯題重做、生存挑戰和 BOSS 戰
  });
  return st;
}

// 生存挑戰、BOSS 戰：限時、而且一定會答錯到結束，所以不算進答對率
function timed_(range) { range = String(range || ''); return range.indexOf('生存挑戰') === 0 || range.indexOf('BOSS 戰') === 0; }
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
// 週次：第一週是 11/14（六）～11/22（日）共 9 天，之後每週一到週日
const FIRST_WEEK = ['2026-11-14', '2026-11-22'];
function weekStart_(d) {
  if (d >= FIRST_WEEK[0] && d <= FIRST_WEEK[1]) return FIRST_WEEK[0];
  const dow = new Date(Date.parse(d + 'T12:00:00+08:00')).getUTCDay() || 7; // 1=週一 … 7=週日
  return shift_(d, 1 - dow);
}
function prevWeek_(w) { return weekStart_(shift_(w, -1)); }
function weekEnd_(w) { const e = w === FIRST_WEEK[0] ? FIRST_WEEK[1] : shift_(w, 6); return w < FIRST_WEEK[0] && e >= FIRST_WEEK[0] ? shift_(FIRST_WEEK[0], -1) : e; }

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
    weeks: champs(weekStart_, function (k) { return md(k) + '–' + md(weekEnd_(k)); }, weekStart_(today)),
    months: champs(function (d) { return d.slice(0, 7); }, function (k) { return parseInt(k.slice(0, 4), 10) + ' 年 ' + parseInt(k.slice(5), 10) + ' 月'; }, today.slice(0, 7))
  };
}

// 接在最後一列後面；工作表列數不夠時先加列
function append_(sh, rows) {
  if (rows[0].length > sh.getMaxColumns()) sh.insertColumnsAfter(sh.getMaxColumns(), rows[0].length - sh.getMaxColumns());
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
  // 30 號以後是老師／來賓帳號：名單上怎麼寫就怎麼顯示（不去掉姓）
  const ro = roster_();
  if (Object.keys(ro).some(function (k) { return +k >= 30 && +k < 100 && ro[k] === n; })) return n;
  if (!/^[\u4e00-\u9fff]{3,5}$/.test(n)) return n;   // 兩個字的名字（蒲桃、林琳）整個顯示
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
  { id: 'fix20', icon: '🩹', name: '訂正新手', desc: '錯題重做累積答對 20 題' },
  { id: 'fix50', icon: '🔧', name: '訂正達人', desc: '錯題重做累積答對 50 題' },
  { id: 'fix100', icon: '🛠️', name: '訂正職人', desc: '錯題重做累積答對 100 題' },
  { id: 'fix300', icon: '🏗️', name: '訂正大師', desc: '錯題重做累積答對 300 題' },
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
  { id: 'goal4', icon: '🏫', name: '班級支柱', desc: '全班達成 4 次週目標，每次都有出力' },
  // ---- 進階／長期目標 ----
  { id: 'q10000', icon: '🌠', name: '萬題宗師', desc: '累積作答 10000 題' },
  { id: 'streak150', icon: '🌋', name: '一百五十天不斷', desc: '連續 150 天交卷' },
  { id: 'days150', icon: '📆', name: '一百五十天勤學', desc: '累積 150 天有交卷（不用連續）' },
  { id: 'early20', icon: '🌄', name: '晨型人', desc: '20 個不同的早上（4–7 點）交卷' },
  { id: 'week7', icon: '🗓️', name: '全勤週', desc: '某一週星期一到星期日每天都交卷' },
  { id: 'speed', icon: '⚡', name: '閃電手', desc: '一次 20 題以上全對，平均每題 6 秒內' },
  { id: 'full50', icon: '💎', name: '滿分機器', desc: '50 次不同的測驗 10 題以上全對' },
  { id: 'first30', icon: '🦚', name: '頭香之王', desc: '30 天是全班第一個交卷' },
  { id: 'cover50', icon: '🗺️', name: '探索者', desc: '練過單字書 50 個不同的天數（Day）' },
  { id: 'cover100', icon: '🧭', name: '冒險家', desc: '練過單字書 100 個不同的天數' },
  { id: 'cover183', icon: '🌏', name: '全書制霸', desc: '183 天的單字書每一天都練過' },
  { id: 'jtcover25', icon: '📒', name: '寂天半本', desc: '練過寂天 25 個不同的單元' },
  { id: 'jtcover50', icon: '📚', name: '寂天全制霸', desc: '寂天 50 個單元每一個都練過' },
  { id: 'word1000', icon: '🔠', name: '單字大師', desc: '單字題答對 1000 題' },
  { id: 'verb600', icon: '🛠️', name: '動詞大師', desc: '動詞變化答對 600 題' },
  { id: 'prep600', icon: '🗝️', name: '介系詞大師', desc: '介系詞答對 600 題' },
  { id: 'cloze500', icon: '📖', name: '閱讀大師', desc: '克漏字答對 500 題' },
  { id: 'sense300', icon: '🔮', name: '一字多義大師', desc: '一字多義答對 300 題' },
  { id: 'phrase300', icon: '🧠', name: '片語大師', desc: '片語答對 300 題' },
  { id: 'cap200', icon: '🎓', name: '會考文法大師', desc: '會考文法答對 200 題' },
  { id: 'jt1500', icon: '📕', name: '寂天大師', desc: '寂天答對 1500 題' },
  { id: 'surv150', icon: '☄️', name: '生存之神', desc: '生存挑戰撐到 150 題' },
  { id: 'quest60', icon: '🏅', name: '挑戰狂人', desc: '累積 60 天完成全部每日挑戰' },
  { id: 'quest100', icon: '👑', name: '挑戰之王', desc: '累積 100 天完成全部每日挑戰' },
  { id: 'goal10', icon: '🏟️', name: '班級英雄', desc: '全班達成 10 次週目標，每次都有出力' },
  { id: 'shop5', icon: '🛍️', name: '購物達人', desc: '在商店買 5 件商品' },
  { id: 'shop15', icon: '🧳', name: '收藏家', desc: '在商店買 15 件商品' },
  // ---- 班級對抗 ----
  { id: 'win1', icon: '🚩', name: '班級對抗勝利', desc: '自己的班贏得一次週對抗（那週自己作答 50 題以上）' },
  { id: 'win4', icon: '🏆', name: '常勝之班', desc: '幫自己的班贏得 4 次週對抗' },
  { id: 'win10', icon: '🏯', name: '王者之班', desc: '幫自己的班贏得 10 次週對抗' },
  { id: 'mvp1', icon: '🌟', name: '班級 MVP', desc: '某一週答對題數是全班第一' },
  { id: 'mvp4', icon: '💫', name: 'MVP 常客', desc: '當 4 次班級 MVP' },
  { id: 'gift1', icon: '🎁', name: '送禮新手', desc: '送出第一份禮物' },
  { id: 'gift10', icon: '💝', name: '慷慨大方', desc: '送出 10 份禮物' },
  { id: 'friends5', icon: '🤗', name: '好人緣', desc: '收到 5 位不同同學的禮物' },
  { id: 'duel1', icon: '🤺', name: '初次對戰', desc: '完成第一場單字對戰' },
  { id: 'duelwin10', icon: '🥊', name: '對戰常勝', desc: '單字對戰贏 10 場' },
  { id: 'duel30', icon: '🏟️', name: '對戰老手', desc: '完成 30 場單字對戰' },
  { id: 'pet5', icon: '🐾', name: '寵物達人', desc: '把一隻寵物養到 Lv.5' },
  { id: 'pet10', icon: '🐲', name: '神寵飼主', desc: '把一隻寵物養到 Lv.10' }
];
// 徽章分類與等級（1 銅、2 銀、3 金、4 鑽石）：同一系列越後面越難
const BADGE_SERIES = [
  ['堅持', '🔥', [['streak3', 'streak7', 'streak14', 'streak30', 'streak60', 'streak100', 'streak150'], ['days30', 'days100', 'days150'], ['weekend', 'week7'], ['comeback']]],
  ['題量', '📈', [['q100', 'q500', 'q1000', 'q2000', 'q5000', 'q10000'], ['marathon', 'day100']]],
  ['精準', '🎯', [['full', 'full5', 'full20', 'full50'], ['acc90', 'speed'], ['improve']]],
  ['好習慣', '🌅', [['early', 'early20'], ['first', 'first10', 'first30'], ['redo10', 'redo50'], ['fix20', 'fix50', 'fix100', 'fix300']]],
  ['題型大師', '🧩', [['word300', 'word1000'], ['verb200', 'verb600'], ['prep200', 'prep600'], ['cloze85', 'cloze200', 'cloze500'], ['sense100', 'sense300'], ['phrase100', 'phrase300'], ['cap80', 'cap200'], ['allkind']]],
  ['寂天', '📘', [['jt100', 'jt500', 'jt1500'], ['jtcover25', 'jtcover50']]],
  ['探索', '🗺️', [['cover50', 'cover100', 'cover183']]],
  ['挑戰', '💀', [['quest1', 'quest7', 'quest30', 'quest60', 'quest100'], ['surv20', 'surv50', 'surv100', 'surv150']]],
  ['班級', '⚔️', [['goal1', 'goal4', 'goal10'], ['win1', 'win4', 'win10'], ['mvp1', 'mvp4'], ['week', 'month']]],
  ['收藏', '🛍️', [['shop5', 'shop15']]],
  ['友誼', '🎁', [['gift1', 'gift10'], ['friends5']]],
  ['對戰與寵物', '🤺', [['duel1', 'duel30'], ['duelwin10'], ['pet5', 'pet10']]]
];
(function () {
  const meta = {};
  let ORD = 0;
  BADGE_SERIES.forEach(function (g) {
    g[2].forEach(function (ser) {
      ser.forEach(function (id, i) {
        const top = Math.min(4, ser.length + 1), t = ser.length === 1 ? 2 : 1 + Math.round(i * (top - 1) / (ser.length - 1));
        meta[id] = { cat: g[0], tier: t, ord: ++ORD };
      });
    });
  });
  BADGE_DEFS.forEach(function (d) { Object.assign(d, meta[d.id] || { cat: '其他', tier: 2 }); });
})();
const BADGE_CATS = BADGE_SERIES.map(function (g) { return { name: g[0], icon: g[1] }; });


// 「作答明細」各題型統計（不含錯題重做）
function detailStats_() {
  const out = {};
  digestRows_().forEach(function (r) {
    if (r.redo) return;
    const s = out[r.seat] = out[r.seat] || {};
    const o = s[r.kind] = s[r.kind] || { ans: 0, right: 0 };
    o.ans += r.answered; o.right += r.right;
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
    if (r.redo || timed_(r.range)) return;
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
      const a = s[w], b = s[prevWeek_(w)];
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
    sh.getRange(2, 1, n, 11).getValues().forEach(function (r) { // A:K
      const seat = parseInt(r[2], 10);
      if (!seat || seat === 30) return;
      const p = per[seat] = per[seat] || { days: {}, early: false, earlyD: {}, full: false, fullN: 0, ans: 0, right: 0, redoN: 0, dayAns: {}, big: false, speed: false };
      const d = r[1] instanceof Date ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd') : String(r[1]).replace(/\//g, '-');
      if (invMatch_(seat, r[4], d)) return;
      p.days[d] = 1;
      const answered = Number(r[7]) || 0, right = Number(r[8]) || 0;
      if (String(r[4]).indexOf('錯題重做') >= 0) { p.redoN++; p.fixN = (p.fixN || 0) + (Number(r[8]) || 0); }
      else {
        p.ans += answered; p.right += right;
        if (answered >= 10 && right === answered) { p.full = true; p.fullN++; }
        if (answered >= 20 && right === answered && (Number(r[10]) || 999) > 0 && Number(r[10]) <= answered * 6) p.speed = true;
        if (answered >= 50) p.big = true;
        p.dayAns[d] = (p.dayAns[d] || 0) + answered;
      }
      const ts = r[0] instanceof Date ? r[0].getTime() : Date.parse(String(r[0]).replace(/\//g, '-').replace(' ', 'T'));
      if (isFinite(ts) && (!first[d] || ts < first[d].ts)) first[d] = { ts: ts, seat: seat };
      let hh = -1;
      if (r[0] instanceof Date) hh = Number(Utilities.formatDate(r[0], tz, 'HH'));
      else { const m = String(r[0]).match(/(\d{1,2}):\d{2}/); if (m) hh = Number(m[1]); }
      if (hh >= 4 && hh < 7) { p.early = true; p.earlyD[d] = 1; }
    });
  }
  const rows = readRows_(), cloze = readDetail_('克漏字').concat(readDetail_('寂天'));   // 週／月冠王不算克漏字和寂天
  const wk = champsAll_(rows, cloze, today, weekStart_);
  const mo = champsAll_(rows, cloze, today, function (d) { return d.slice(0, 7); });
  const imp = improveEver_(rows, today);
  const det = detailStats_();
  // 練過哪些天數／單元（作答明細 D 欄：D183、U12）
  const cover = {}, DU = digest_().U;
  Object.keys(DU).forEach(function (seat) {
    const c = cover[seat] = { D: {}, U: {} };
    DU[seat].split(',').forEach(function (u) { if (/^D\d+$/.test(u)) c.D[u] = 1; else if (/^U\d+$/.test(u)) c.U[u] = 1; });
  });
  // 商店買了幾件（造型分頁 D 欄）
  const bought = {};
  try {
    const av = avSheet_();
    if (av.getLastRow() > 1) av.getRange(2, 1, av.getLastRow() - 1, 4).getValues().forEach(function (r) {
      const k = parseInt(r[0], 10); if (!k) return;
      try { bought[k] = JSON.parse(String(r[3] || '[]')).length; } catch (e) {}
    });
  } catch (e) {}
  let dper = {};
  try { dper = dailyC_().per || {}; } catch (e) {}
  let GT = {}, DTb = {}, PAb = {};
  try { GT = giftTotals_(); } catch (e) {}
  try { DTb = duelTotals_(); } catch (e) {}
  try { PAb = petAll_(); } catch (e) {}
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
    [[20, 'fix20'], [50, 'fix50'], [100, 'fix100'], [300, 'fix300']].forEach(function (x) { if ((p.fixN || 0) >= x[0]) ids.push(x[1]); });
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
    [[1, 'goal1'], [4, 'goal4'], [10, 'goal10']].forEach(function (x) { if ((dp.goals || 0) >= x[0]) ids.push(x[1]); });
    // 進階徽章
    if (p.ans >= 10000) ids.push('q10000');
    if (st >= 150) ids.push('streak150');
    if (dl.length >= 150) ids.push('days150');
    if (Object.keys(p.earlyD).length >= 20) ids.push('early20');
    if (dl.some(function (d) { if (new Date(d + 'T12:00:00+08:00').getDay() !== 1) return false; for (let i = 1; i < 7; i++) if (!p.days[shift_(d, i)]) return false; return true; })) ids.push('week7');
    if (p.speed) ids.push('speed');
    if (p.fullN >= 50) ids.push('full50');
    if (fN >= 30) ids.push('first30');
    const cv = cover[seat] || { D: {}, U: {} }, nD = Object.keys(cv.D).length, nU = Object.keys(cv.U).length;
    if (nD >= 50) ids.push('cover50');
    if (nD >= 100) ids.push('cover100');
    if (nD >= 183) ids.push('cover183');
    if (nU >= 25) ids.push('jtcover25');
    if (nU >= 50) ids.push('jtcover50');
    [['單字', 1000, 'word1000'], ['動詞變化', 600, 'verb600'], ['介系詞', 600, 'prep600'], ['克漏字', 500, 'cloze500'],
     ['一字多義', 300, 'sense300'], ['片語', 300, 'phrase300'], ['會考文法', 200, 'cap200'], ['寂天', 1500, 'jt1500']].forEach(function (x) {
      if (dk[x[0]] && dk[x[0]].right >= x[1]) ids.push(x[2]);
    });
    if ((dp.survBest || 0) >= 150) ids.push('surv150');
    [[60, 'quest60'], [100, 'quest100']].forEach(function (x) { if ((dp.clear || 0) >= x[0]) ids.push(x[1]); });
    if ((bought[seat] || 0) >= 5) ids.push('shop5');
    if ((bought[seat] || 0) >= 15) ids.push('shop15');
    [[1, 'win1'], [4, 'win4'], [10, 'win10']].forEach(function (x) { if ((dp.wins || 0) >= x[0]) ids.push(x[1]); });
    [[1, 'mvp1'], [4, 'mvp4']].forEach(function (x) { if ((dp.mvp || 0) >= x[0]) ids.push(x[1]); });
    const dt = DTb[seat] || { n: 0, win: 0 }, pxs = Object.keys(PAb[seat] || {}).map(function (k) { return petLv_(PAb[seat][k]); });
    if (dt.n >= 1) ids.push('duel1');
    if (dt.n >= 30) ids.push('duel30');
    if (dt.win >= 10) ids.push('duelwin10');
    if (pxs.some(function (l) { return l >= 5; })) ids.push('pet5');
    if (pxs.some(function (l) { return l >= 10; })) ids.push('pet10');
    const gt = GT[seat] || { sent: 0, from: {} };
    if (gt.sent >= 1) ids.push('gift1');
    if (gt.sent >= 10) ids.push('gift10');
    if (Object.keys(gt.from).filter(function (k) { return +k !== +seat; }).length >= 5) ids.push('friends5');
    if (ids.length) out[seat] = ids;
  });
  return { ok: true, defs: BADGE_DEFS, cats: BADGE_CATS, badges: out, today: today };
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

// 學生端（每次開網頁都會問）：只算今天的任務，全班共用一份快取，交卷後才重算
function taskFor_(seat) {
  const tz = 'Asia/Taipei', today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const C = cachedSoft_('tday3|' + today, 120, 45, function () { const r = tasks_(null, null, true); return { tasks: r.tasks || [], results: r.results || {} }; });
  const ro = roster_();
  let t = null, pw = '';
  C.tasks.forEach(function (x) { if (x.date === today) { t = JSON.parse(JSON.stringify(x)); pw = x.pw || ''; } });
  if (t) { delete t.dist; delete t.pw; }
  // 「設定」分頁的「小考密碼公開時間」到了，就把今天的小考密碼直接顯示給學生
  if (t && t.quiz) {
    const show = hhmm_(setting_('小考密碼公開時間')), until = hhmm_(setting_('小考密碼公開到'));
    const now = Utilities.formatDate(new Date(), tz, 'HH:mm');
    if (show) {
      t.pwAt = show; t.pwUntil = until || '';
      if (pw && now >= show && (!until || now < until)) t.pwShow = pw;
    }
    t.now = now;
  }
  return { ok: true, today: today, task: t, me: t ? ((C.results[t.date] || {})[seat] || null) : null,
    given: ro[seat] ? givenName(ro[seat]) : '', owe: oweFor_(seat, today) };
}

// 補做任務：以前的任務還沒過關的（從這位同學第一次交卷那天之後的任務才算），最近的在前面
function oweFor_(seat, today) {
  if (seat === 30 || isStaff_(seat)) return [];
  try {
    const A = cachedSoft_('tall3|' + today, 600, 60, function () {
      const r = tasks_(null, null, false, true), first = {};
      readRows_().forEach(function (x) { if (!first[x.seat] || x.d < first[x.seat]) first[x.seat] = x.d; });
      (r.tasks || []).forEach(function (t) { delete t.pw; delete t.dist; });
      return { tasks: r.tasks || [], results: r.results || {}, first: first };
    });
    const f = A.first[seat];
    if (!f) return [];
    return A.tasks.filter(function (t) { return t.date < today && t.date >= f && !(((A.results[t.date] || {})[seat] || {}).passAt); })
      .reverse().map(function (t) {
        const me = (A.results[t.date] || {})[seat] || {};
        return { date: t.date, label: t.label, from: t.from, to: t.to, list: t.list, days: t.days, n: t.n, pass: t.pass, quiz: t.quiz,
          refLabel: t.refLabel || '', best: me.best || 0, attempts: me.attempts || 0 };
      });
  } catch (e) { return []; }
}

function tasks_(key, seatOnly, todayOnly, internal) {
  const tz = 'Asia/Taipei', today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  if (parseInt(seatOnly, 10)) return taskFor_(parseInt(seatOnly, 10));
  const tasks = readTasks_().filter(function (t) { return !todayOnly || t.date === today; });
  const onlySeat = 0;
  if (!todayOnly && !internal) {
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
        answered: answered, right: Number(r[8]) || 0,
        quiz: w >= 14 && String(r[13]).indexOf('重考') < 0 ? ymd_(r[13]) : '', retry: w >= 14 && String(r[13]).indexOf('重考') >= 0 ? ymd_(r[13]) : '',
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
    if (t.pw) rows.forEach(function (x) {   // 重考（同一天第二次以後的小考）：只記次數，不算成績
      if (x.retry === t.date && (!onlySeat || x.seat === onlySeat)) { const o3 = res[x.seat] = res[x.seat] || blank(); o3.retry = (o3.retry || 0) + 1; }
    });
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
    // 「設定」分頁的「小考密碼公開時間」到了，就把今天的小考密碼直接顯示給學生
    if (t && t.quiz) {
      const show = hhmm_(setting_('小考密碼公開時間')), until = hhmm_(setting_('小考密碼公開到'));
      const now = Utilities.formatDate(new Date(), tz, 'HH:mm');
      if (show) {
        t.pwAt = show; t.pwUntil = until || '';
        const raw = tasks.filter(function (x) { return x.date === today && x.pw; })[0];
        if (raw && now >= show && (!until || now < until)) t.pwShow = raw.pw;
      }
      t.now = now;
    }
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

// 「設定」分頁：A 欄名稱、B 欄值
function setting_(name) {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('設定');
  if (!sh || sh.getLastRow() < 1) return '';
  const v = sh.getRange(1, 1, sh.getLastRow(), 2).getValues();
  for (let i = 0; i < v.length; i++) if (String(v[i][0]).trim() === name) return v[i][1];
  return '';
}
// 7:50、07:50、時間格式的儲存格 → "07:50"；看不懂就回空字串
function hhmm_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Taipei', 'HH:mm');
  const m = String(v || '').trim().match(/^(\d{1,2})\s*[:：]\s*(\d{2})$/);
  return m && +m[1] < 24 && +m[2] < 60 ? ('0' + m[1]).slice(-2) + ':' + m[2] : '';
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
  // 904 用「家長密碼」、916 用「916家長密碼」（都在「設定」分頁）；家長只看得到自己班
  const want = parentKey_(), want916 = String(setting_('916家長密碼') || '').trim(), want915 = String(setting_('915家長密碼') || '').trim();
  if (!want && !want916 && !want915) return { ok: false, error: '家長密碼尚未設定，請洽導師。' };
  const k = String(key || '').trim();
  const cls = want && k === want ? '904' : want916 && k === want916 ? '916' : want915 && k === want915 ? '915' : '';
  if (!cls) return { ok: false, error: key ? '密碼不正確' : '請輸入密碼' };
  const ro = roster_();
  const roster = Object.keys(ro).map(Number).filter(function (x) { return classOf_(x) === cls && !isStaff_(x); })
    .sort(function (a, b) { return a - b; }).map(function (x) { return { seat: x, name: ro[x], label: x >= 90000 ? String(x % 100) : String(x) }; });
  const s = parseInt(seat, 10);
  if (!s) return { ok: true, roster: roster, cls: cls };
  if (!ro[s] || classOf_(s) !== cls) return { ok: false, error: '找不到這個座號' };
  const tz = 'Asia/Taipei', today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const isStu = function (x) { return x && classOf_(x) === cls && !isStaff_(x); };   // 班級比較只跟同班學生比

  // ---- 練習量：每次交卷（成績分頁）
  const rows = readRows_().filter(function (r) { return isStu(r.seat); });
  const mine = rows.filter(function (r) { return r.seat === s; });
  const weeks = {}, classWeeks = {}, days = {};
  const wk = function (o, r) { const w = weekStart_(r.d); const x = o[w] || (o[w] = { w: w, tests: 0, answered: 0, right: 0, seats: {} }); x.tests++; x.answered += r.answered; x.right += r.right; x.seats[r.seat] = 1; };
  mine.forEach(function (r) { wk(weeks, r); days[r.d] = 1; });
  rows.forEach(function (r) { wk(classWeeks, r); });
  const nStu = roster.length || 1;
  const weekList = [];
  const ws = [weekStart_(today)];
  while (ws.length < 8) ws.unshift(prevWeek_(ws[0]));
  for (let i = 0; i < ws.length; i++) {
    const w = ws[i], m = weeks[w] || { tests: 0, answered: 0, right: 0 }, c = classWeeks[w] || { answered: 0, right: 0 };
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
    const o = out[r.seat] || (out[r.seat] = { right: 0, quiz: 0, days: {}, fix: 0 });
    o.right += r.right; o.days[r.d] = 1;
    if (r.redo) o.fix += r.right;   // 錯題重做答對（訂正成功）：每題多 1 枚代幣
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
  const G = giftTotals_();
  let DT = {}, PA = {}, last = {}, BT = {};
  try { DT = duelTotals_(); } catch (e) {}
  try { BT = bossTotals_(); } catch (e) {}
  try { PA = petAll_(); } catch (e) {}
  readRows_().forEach(function (r) { if (!last[r.seat] || r.d > last[r.seat]) last[r.seat] = r.d; });
  const today0 = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
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
    const earn = o.right * CR.right + (o.fix || 0) * (CR.fix == null ? 1 : CR.fix) + o.quiz * CR.quiz + (bd[k] || []).length * CR.badge + (dp.qcoin || 0) + (dp.scoin || 0) + (dp.gcoin || 0) + (dp.bcoin || 0);
    const g = G[k] || { recv: 0, cost: 0, items: [] };
    const bt = BT[k] || { coin: 0, drops: [] };
    const owned = (own[k] || []).concat(g.items.concat(bt.drops).filter(function (x, i, a) { return (own[k] || []).indexOf(x) < 0 && a.indexOf(x) === i; }));
    res[k] = { xp: xp, lv: lv, right: o.right, quiz: o.quiz, days: days, a: av[k] || null, tr: tr,
      own: owned, earn: earn, spent: spent[k] || 0, giftIn: g.recv, giftOut: g.cost,
      coin: Math.max(0, earn + g.recv - g.cost - (spent[k] || 0) + ((DT[k] || {}).coin || 0) + bt.coin),
      duel: DT[k] || { coin: 0, win: 0, n: 0 },
      pets: PA[k] || {}, petXp: ((PA[k] || {})[(av[k] || {}).pet] || 0), petLv: petLv_((PA[k] || {})[(av[k] || {}).pet] || 0),
      away: last[k] ? Math.round((new Date(today0 + 'T12:00:00+08:00') - new Date(last[k] + 'T12:00:00+08:00')) / 864e5) : 99,
      show: (show[k] || []).filter(function (id) { return (bd[k] || []).indexOf(id) >= 0; }) };
  });
  try { cache.put(pk, JSON.stringify(res), 600); } catch (e) {}
  return res;
}
function avMap_() {
  try {
    const p = profilesSoft_(), m = {};
    Object.keys(p).forEach(function (k) { m[k] = { lv: p[k].lv, a: p[k].a, show: p[k].show || [], petLv: p[k].petLv || 1 }; });
    return m;
  } catch (e) { return {}; }
}
// 大家共用的等級資料：有人交卷後最多沿用 45 秒（剛交卷的本人會帶 fresh=1 拿最新的）
function profilesSoft_() { return cachedSoft_('profS', 21600, 45, profiles_); }
function profile_(seat, fresh) {
  const s = parseInt(seat, 10);
  let p = (fresh ? profiles_() : profilesSoft_())[s];
  if (!p && roster_()[s]) { bump_(); p = profiles_()[s]; }   // 名單剛新增的人：等級資料還沒算到，重算一次
  if (!p) return { ok: false, error: '找不到這個座號' };
  const L = avItems_().levels;
  return { ok: true, seat: s, xp: p.xp, lv: p.lv, title: avTitle_(p.lv, L.titles), cur: avNeed_(p.lv, L.base), next: p.lv >= 50 ? null : avNeed_(p.lv + 1, L.base),
    right: p.right, quiz: p.quiz, days: p.days, a: p.a, xpRule: L.xp, tr: p.tr || [],
    coin: p.coin || 0, earn: p.earn || 0, own: p.own || [], show: p.show || [],
    pets: p.pets || {}, petXp: p.petXp || 0, petLv: p.petLv || 1, petNeed: PET_NEED, away: p.away == null ? 99 : p.away, duel: p.duel || { coin: 0, win: 0, n: 0 }, coinRule: L.coin || { right: 1, quiz: 20, badge: 20 } };
}
// 存造型：每個部件都要存在、而且等級夠才能用，否則換回預設
function saveAvatar_(seat, a) {
  const items = avItems_(), p = profiles_()[seat] || { lv: 1 }, clean = {};
  items.cats.forEach(function (c) {
    const want = a && a[c.key], it = c.items.filter(function (x) { return x.id === want; })[0];
    // 寵物配件（pl）：要看「這次選的寵物」養到幾級
    const ok = it && (it.pl != null ? clean.pet && clean.pet !== 'none' && petLv_((p.pets || {})[clean.pet] || 0) >= it.pl
      : it.t ? (p.tr || []).indexOf(it.t) >= 0
      : (it.lv != null && it.lv <= p.lv) || ((it.s != null || it.b) && (p.own || []).indexOf(c.key + ':' + it.id) >= 0));
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
// ===================== 送禮物 =====================
// 「禮物」分頁：時間 | 送禮座號 | 收禮座號 | 類型（coin／item） | 內容（代幣數或 分類:商品） | 祝福語 | 花費 | 開啟時間 | 狀態（收下／退回） | 退回已通知
// 收禮的人可以「退回」：退回的禮物不算數，代幣自動還給送禮的人。也可以「暫停收禮」（造型分頁 G 欄）。
// 祝福語可以自己寫（最多 30 字，有不雅字詞就擋下），所有內容老師都看得到。
// 規則：不能送自己；學生每天最多送 3 份、代幣一次 10–50 枚；商品＝幫對方買商店的東西（自己付錢）。
//       老師帳號（31 號以後）送代幣不扣自己的錢，一次最多 200 枚，可以當作獎勵。
const GIFT_NAME = '禮物';
const GIFT_MSGS = ['加油！一起背單字 💪', '謝謝你幫我 🙏', '恭喜過關 🎉', '你超強 👍', '一起拚段考 📚', '生日快樂 🎂', '早安！今天也要努力 ☀️', '老師給你的獎勵 🏅'];
function giftSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(GIFT_NAME);
  if (!sh) { sh = ss.insertSheet(GIFT_NAME); sh.setFrozenRows(1); }
  if (sh.getRange(1, 10).getValue() !== '退回已通知') sh.getRange(1, 1, 1, 10).setValues([['時間', '送禮座號', '收禮座號', '類型', '內容', '祝福語', '花費', '開啟時間', '狀態', '退回已通知']]).setFontWeight('bold');
  return sh;
}
function giftRows_() {
  const sh = giftSheet_(), n = sh.getLastRow() - 1;
  if (n <= 0) return [];
  return sh.getRange(2, 1, n, 10).getValues().map(function (r, i) {
    return { row: i + 2, at: r[0] instanceof Date ? Utilities.formatDate(r[0], 'Asia/Taipei', 'yyyy-MM-dd HH:mm') : String(r[0]),
      from: parseInt(r[1], 10), to: parseInt(r[2], 10), kind: String(r[3]), what: String(r[4]), msg: String(r[5]), cost: Number(r[6]) || 0, opened: !!r[7],
      rejected: String(r[8]) === '退回', told: !!r[9] };
  });
}
// 每個人：收到的代幣、送禮花掉的代幣、收到的商品
function giftTotals_() {
  const t = {}, T = function (k) { return t[k] = t[k] || { recv: 0, cost: 0, items: [], sent: 0, from: {} }; };
  giftRows_().forEach(function (g) {
    if (g.rejected) return;   // 被退回的禮物不算：收禮的人沒拿到，送禮的人也不用付
    // 送出就先扣送禮的人；收禮的人要按「收下」才拿到（避免先花掉再退回）
    if (g.opened && g.kind === 'coin') T(g.to).recv += Number(g.what) || 0;
    if (g.opened && g.kind === 'item') T(g.to).items.push(g.what);
    T(g.from).cost += g.cost; T(g.from).sent++;
    T(g.to).from[g.from] = 1;
  });
  return t;
}
const isStaff_ = function (seat) { return seat >= 31 && seat < 100; };
function names_() {
  const ro = roster_(), out = [];
  Object.keys(ro).forEach(function (k) { if (+k !== 30) out.push({ seat: +k, given: givenName(ro[k]), cls: isStaff_(+k) ? '老師' : classOf_(+k) }); });
  return { ok: true, names: out.sort(function (a, b) { return a.seat - b.seat; }), msgs: GIFT_MSGS };
}
function gift_(seat, b) {
  const to = parseInt(b.to, 10), staff = isStaff_(seat);
  const ro = roster_();
  if (!to || !ro[to] || to === 30) return { ok: false, error: '找不到收禮的同學' };
  if (to === seat) return { ok: false, error: '不能送給自己喔' };
  let msg;
  if (b.text != null && String(b.text).trim()) {
    msg = String(b.text).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim();
    if (msg.length > 30) return { ok: false, error: '自己寫的話最多 30 個字' };
    if (badWord_(msg)) return { ok: false, error: '這句話好像不太友善，換個說法吧！' };
  } else {
    msg = GIFT_MSGS[parseInt(b.msg, 10)] || GIFT_MSGS[0];
    if (!staff && msg === '老師給你的獎勵 🏅') return { ok: false, error: '這句只有老師能用' };
  }
  if (noGift_()[to]) return { ok: false, error: '對方目前暫停收禮物' };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
    const sentToday = giftRows_().filter(function (g) { return g.from === seat && g.at.slice(0, 10) === today; }).length;
    if (!staff && sentToday >= 3) return { ok: false, error: '今天已經送了 3 份禮物，明天再送吧！' };
    bump_();
    const P = profiles_(), me = P[seat] || { coin: 0, own: [] }, you = P[to] || { own: [] };
    let kind, what, cost;
    if (b.kind === 'item') {
      const items = avItems_(), c = items.cats.filter(function (x) { return x.key === b.cat; })[0];
      const it = c && c.items.filter(function (x) { return x.id === b.id; })[0];
      if (!it || it.s == null) return { ok: false, error: '這個商品不能送' };
      what = c.key + ':' + it.id;
      if ((you.own || []).indexOf(what) >= 0) return { ok: false, error: '對方已經有這個了，換一個吧！' };
      if (giftRows_().some(function (g) { return g.to === to && g.what === what && g.kind === 'item' && !g.opened && !g.rejected; })) return { ok: false, error: '已經有人送對方這個了，換一個吧！' };
      kind = 'item'; cost = it.s;
    } else {
      const n = parseInt(b.amount, 10);
      const max = staff ? 200 : 50, min = staff ? 1 : 10;
      if (!(n >= min && n <= max)) return { ok: false, error: '代幣一次可以送 ' + min + '–' + max + ' 枚' };
      kind = 'coin'; what = String(n); cost = staff ? 0 : n;
    }
    if (cost > (me.coin || 0)) return { ok: false, error: '代幣不夠，還差 ' + (cost - (me.coin || 0)) + ' 枚' };
    giftSheet_().appendRow([new Date(), seat, to, kind, what, msg, cost, '', '', '']);
    bump_();
    return { ok: true, coin: (me.coin || 0) - cost, left: staff ? null : 2 - sentToday };
  } finally { lock.releaseLock(); }
}
// 不雅字詞（擋下自己寫的祝福語）
const BAD_WORDS = ['幹', '靠北', '靠杯', '白痴', '白癡', '智障', '低能', '腦殘', '去死', '垃圾', '廢物', '賤', '婊', '操你', '雞掰', '機掰', '滾', '醜八怪', '肥豬', '死胖子', '笨蛋', '蠢', '神經病', '王八', '他媽', '你媽', '妳媽', 'fuck', 'shit', 'bitch', 'damn', 'stupid', 'idiot', 'loser', 'ugly', 'http', 'www', '.com'];
function badWord_(t) { t = String(t).toLowerCase().replace(/\s/g, ''); return BAD_WORDS.some(function (w) { return t.indexOf(w) >= 0; }); }
// 暫停收禮的人（造型分頁 G 欄填 1）
function noGift_() {
  const sh = avSheet_(), out = {};
  if (sh.getLastRow() > 1 && sh.getLastColumn() >= 7) sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues().forEach(function (r) { if (String(r[6]) === '1') out[parseInt(r[0], 10)] = true; });
  return out;
}
function giftPref_(seat, block) {
  const sh = avSheet_(), n = sh.getLastRow() - 1;
  if (sh.getRange(1, 7).getValue() !== '暫停收禮') sh.getRange(1, 7).setValue('暫停收禮').setFontWeight('bold');
  let row = 0;
  if (n > 0) sh.getRange(2, 1, n, 1).getValues().forEach(function (r, i) { if (parseInt(r[0], 10) === seat) row = i + 2; });
  if (row) sh.getRange(row, 7).setValue(block ? '1' : '');
  else sh.appendRow([seat, '', '', '[]', 0, '[]', block ? '1' : '']);
  return { ok: true, block: !!block };
}
// 收下或退回一份禮物
function giftAct_(seat, row, act) {
  const g = giftRows_().filter(function (x) { return x.row === parseInt(row, 10); })[0];
  if (!g || g.to !== seat) return { ok: false, error: '找不到這份禮物' };
  if (g.opened) return { ok: true, already: true };
  const sh = giftSheet_();
  sh.getRange(g.row, 8, 1, 2).setValues([[new Date(), act === 'reject' ? '退回' : '收下']]);
  bump_();
  return { ok: true, act: act === 'reject' ? 'reject' : 'accept' };
}
// 收禮匣：還沒處理的禮物、自己送出被退回（還沒通知過）的禮物、最近紀錄
function inbox_(seat) {
  const rows = giftRows_(), ro = roster_(), sh = giftSheet_(), now = new Date();
  const nm = function (k) { return ro[k] ? givenName(ro[k]) : k + ' 號'; };
  const items = avItems_(), label = function (w) { const p = w.split(':'), c = items.cats.filter(function (x) { return x.key === p[0]; })[0], it = c && c.items.filter(function (x) { return x.id === p[1]; })[0]; return it ? it.name : w; };
  const fresh = rows.filter(function (g) { return g.to === seat && !g.opened; });
  const back = rows.filter(function (g) { return g.from === seat && g.rejected && !g.told; });
  back.forEach(function (g) { sh.getRange(g.row, 10).setValue(now); });
  const fmt = function (g) { return { id: g.row, at: g.at, from: g.from, fromName: nm(g.from), to: g.to, toName: nm(g.to), kind: g.kind, what: g.what, name: g.kind === 'item' ? label(g.what) : '', msg: g.msg, cost: g.cost, rejected: g.rejected }; };
  return { ok: true, fresh: fresh.map(fmt), back: back.map(fmt), block: !!noGift_()[seat],
    recv: rows.filter(function (g) { return g.to === seat; }).slice(-10).reverse().map(fmt),
    sent: rows.filter(function (g) { return g.from === seat; }).slice(-10).reverse().map(fmt) };
}

// ===================== 寵物養成 =====================
// 「寵物」分頁：座號 | 寵物 | 經驗 | 最後餵食日 | 當天餵食次數
// 帶著的寵物（造型裡的 pet）會跟著你答對的題數長經驗；也可以花 10 代幣餵食（+15 經驗，每天 3 次）。
// 寵物心情看你最近有沒有交卷：今天或昨天有交卷 😊，兩三天沒來 😐，四天以上 😢
const PET_NAME = '寵物';
const PET_NEED = [0, 20, 60, 120, 200, 300, 450, 650, 900, 1200];   // Lv1–Lv10 需要的累積經驗
function petLv_(xp) { let lv = 1; for (let i = 1; i < PET_NEED.length; i++) if (xp >= PET_NEED[i]) lv = i + 1; return lv; }
function petSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(PET_NAME);
  if (!sh) { sh = ss.insertSheet(PET_NAME); sh.getRange(1, 1, 1, 5).setValues([['座號', '寵物', '經驗', '最後餵食日', '當天餵食次數']]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
function petRows_() {
  const sh = petSheet_(), n = sh.getLastRow() - 1;
  if (n <= 0) return [];
  return sh.getRange(2, 1, n, 5).getValues().map(function (r, i) {
    return { row: i + 2, seat: parseInt(r[0], 10), pet: String(r[1]), xp: Number(r[2]) || 0,
      fedDay: r[3] instanceof Date ? Utilities.formatDate(r[3], 'Asia/Taipei', 'yyyy-MM-dd') : String(r[3]).replace(/^'/, ''), fedN: Number(r[4]) || 0 };
  });
}
function petAll_() {   // {座號: {寵物: 經驗}}
  const o = {};
  petRows_().forEach(function (r) { (o[r.seat] = o[r.seat] || {})[r.pet] = r.xp; });
  return o;
}
function myPet_(seat) {
  const sh = avSheet_(), n = sh.getLastRow() - 1;
  let pet = 'none';
  if (n > 0) sh.getRange(2, 1, n, 2).getValues().forEach(function (r) {
    if (parseInt(r[0], 10) === seat) { try { pet = (JSON.parse(String(r[1] || '{}')).pet) || 'none'; } catch (e) {} }
  });
  return pet;
}
function petAdd_(seat, pet, xp, feed) {
  const sh = petSheet_(), today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
  const r = petRows_().filter(function (x) { return x.seat === seat && x.pet === pet; })[0];
  if (r) {
    const n = feed ? (r.fedDay === today ? r.fedN + 1 : 1) : r.fedN;
    sh.getRange(r.row, 3, 1, 3).setValues([[r.xp + xp, feed ? "'" + today : (r.fedDay ? "'" + r.fedDay : ''), n]]);
    return r.xp + xp;
  }
  sh.appendRow([seat, pet, xp, feed ? "'" + today : '', feed ? 1 : 0]);
  return xp;
}
function petGain_(seat, right) {
  if (!right) return;
  const pet = myPet_(seat);
  if (pet && pet !== 'none') petAdd_(seat, pet, right, false);
}
function feedPet_(seat) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const pet = myPet_(seat);
    if (!pet || pet === 'none') return { ok: false, error: '你還沒有帶寵物，先到「換造型」選一隻寵物吧！' };
    const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
    const r = petRows_().filter(function (x) { return x.seat === seat && x.pet === pet; })[0];
    if (r && r.fedDay === today && r.fedN >= 3) return { ok: false, error: '今天已經餵了 3 次，寵物吃飽了，明天再來！' };
    bump_();
    const p = profiles_()[seat] || { coin: 0 };
    if ((p.coin || 0) < 10) return { ok: false, error: '代幣不夠（餵一次要 10 枚）' };
    // 花掉的代幣記在「造型」分頁的已花代幣
    const sh = avSheet_(), n = sh.getLastRow() - 1;
    let row = 0;
    if (n > 0) sh.getRange(2, 1, n, 1).getValues().forEach(function (x, i) { if (parseInt(x[0], 10) === seat) row = i + 2; });
    if (row) sh.getRange(row, 5).setValue((p.spent || 0) + 10);
    const xp = petAdd_(seat, pet, 15, true);
    bump_();
    return { ok: true, pet: pet, xp: xp, lv: petLv_(xp), coin: (p.coin || 0) - 10, fedLeft: Math.max(0, 2 - (r && r.fedDay === today ? r.fedN : 0)) };
  } finally { lock.releaseLock(); }
}

// ===================== 單字對戰（友誼賽） =====================
// 「對戰」分頁：時間 | 挑戰者 | 對手 | 題號 | 挑戰者答對 | 挑戰者秒數 | 對手答對 | 對手秒數 | 狀態 | 已看結果
// 規則：兩人寫同一份 10 題，答對多的贏，一樣多比快。贏的 +15 代幣、輸的 +5、平手各 +10，都是系統給的，沒有人會失去東西。
//       每人每天最多發起 3 場；同一對每天 1 場；對手可以拒絕；2 天內沒應戰就結束（挑戰者拿 5 代幣參加獎）。
const DUEL_NAME = '對戰';
function duelSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(DUEL_NAME);
  if (!sh) { sh = ss.insertSheet(DUEL_NAME); sh.getRange(1, 1, 1, 10).setValues([['時間', '挑戰者', '對手', '題號', '挑戰者答對', '挑戰者秒數', '對手答對', '對手秒數', '狀態', '已看結果']]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
function duelRows_() {
  const sh = duelSheet_(), n = sh.getLastRow() - 1, now = Date.now();
  if (n <= 0) return [];
  return sh.getRange(2, 1, n, 10).getValues().map(function (r, i) {
    const t = r[0] instanceof Date ? r[0].getTime() : Date.parse(String(r[0])) || now;
    const d = { id: i + 2, t: t, at: Utilities.formatDate(new Date(t), 'Asia/Taipei', 'yyyy-MM-dd HH:mm'), a: parseInt(r[1], 10), b: parseInt(r[2], 10),
      qs: (function () { try { return JSON.parse(String(r[3] || '[]')); } catch (e) { return []; } })(),
      aR: r[4] === '' ? null : Number(r[4]), aS: Number(r[5]) || 0, bR: r[6] === '' ? null : Number(r[6]), bS: Number(r[7]) || 0,
      st: String(r[8] || ''), seen: String(r[9] || '') };
    if (d.st === '' && now - t > 2 * 864e5) d.st = 'expired';
    if (d.aR != null && d.bR != null) {
      d.st = 'done';
      d.win = d.aR !== d.bR ? (d.aR > d.bR ? d.a : d.b) : d.aS !== d.bS ? (d.aS < d.bS ? d.a : d.b) : 0;
    }
    return d;
  });
}
// 每個人從對戰拿到的代幣、勝場、場數
function duelTotals_() {
  const t = {}, T = function (k) { return t[k] = t[k] || { coin: 0, win: 0, n: 0 }; };
  duelRows_().forEach(function (d) {
    if (d.st === 'done') {
      [d.a, d.b].forEach(function (k) { const x = T(k); x.n++; if (d.win === 0) x.coin += 10; else if (d.win === k) { x.coin += 15; x.win++; } else x.coin += 5; });
    } else if ((d.st === 'expired' || d.st === 'declined') && d.aR != null) T(d.a).coin += 5;
  });
  return t;
}
function duelNew_(seat, b) {
  const to = parseInt(b.to, 10), ro = roster_();
  if (!to || !ro[to] || to === 30) return { ok: false, error: '找不到這位同學' };
  if (to === seat) return { ok: false, error: '不能跟自己對戰喔' };
  const qs = (Array.isArray(b.qs) ? b.qs : []).map(function (x) { return parseInt(x, 10); }).filter(function (x, i, a) { return x >= 0 && a.indexOf(x) === i; }).slice(0, 10);
  if (qs.length !== 10) return { ok: false, error: '題目不完整' };
  const key = loadKey_();
  if (qs.some(function (x) { return !key[x]; })) return { ok: false, error: '題目不正確' };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd'), rows = duelRows_();
    const mine = rows.filter(function (d) { return d.a === seat && d.at.slice(0, 10) === today; });
    if (mine.length >= 3) return { ok: false, error: '今天已經發起 3 場對戰了，明天再來！' };
    if (rows.some(function (d) { return d.at.slice(0, 10) === today && ((d.a === seat && d.b === to) || (d.a === to && d.b === seat)); })) return { ok: false, error: '你們今天已經對戰過了' };
    if (rows.filter(function (d) { return d.b === to && d.st === '' && d.aR != null; }).length >= 3) return { ok: false, error: '對方還有 3 場對戰沒打，換個人挑戰吧！' };
    const sh = duelSheet_();
    sh.appendRow([new Date(), seat, to, JSON.stringify(qs), '', '', '', '', '', '']);
    return { ok: true, id: sh.getLastRow() };
  } finally { lock.releaseLock(); }
}
function duelPlay_(seat, b) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = duelRows_().filter(function (x) { return x.id === parseInt(b.id, 10); })[0];
    if (!d || (d.a !== seat && d.b !== seat)) return { ok: false, error: '找不到這場對戰' };
    if (d.st === 'declined' || d.st === 'expired') return { ok: false, error: '這場對戰已經結束了' };
    const me = d.a === seat ? 'a' : 'b';
    if ((me === 'a' ? d.aR : d.bR) != null) return { ok: false, error: '你已經打過這場了' };
    if (me === 'b' && d.aR == null) return { ok: false, error: '對方還沒打完' };
    const key = loadKey_(), ans = Array.isArray(b.answers) ? b.answers : [];
    let right = 0;
    d.qs.forEach(function (q) {
      const a = ans.filter(function (x) { return parseInt(x[0], 10) === q; })[0];
      if (a && key[q] && key[q][0] === parseInt(a[1], 10)) right++;
    });
    const secs = Math.max(1, Math.min(3600, parseInt(b.secs, 10) || 0));
    const sh = duelSheet_();
    sh.getRange(d.id, me === 'a' ? 5 : 7, 1, 2).setValues([[right, secs]]);
    bump_();
    const res = { ok: true, right: right, secs: secs };
    if (me === 'b') {
      res.done = true; res.other = { right: d.aR, secs: d.aS };
      res.win = right !== d.aR ? (right > d.aR ? seat : d.a) : secs !== d.aS ? (secs < d.aS ? seat : d.a) : 0;
      sh.getRange(d.id, 10).setValue(String(seat));   // 對手當場就看到結果
    }
    return res;
  } finally { lock.releaseLock(); }
}
function duelDecline_(seat, id) {
  const d = duelRows_().filter(function (x) { return x.id === parseInt(id, 10); })[0];
  if (!d || d.b !== seat || d.st !== '') return { ok: false, error: '找不到這場對戰' };
  duelSheet_().getRange(d.id, 9).setValue('declined');
  bump_();
  return { ok: true };
}
// 我的對戰：等我應戰的、我發起還在等的、剛出爐的結果（看過就不再跳）、最近戰績
function duels_(seat) {
  const rows = duelRows_(), ro = roster_(), sh = duelSheet_();
  const nm = function (k) { return ro[k] ? givenName(ro[k]) : k + ' 號'; };
  const fmt = function (d) {
    const meA = d.a === seat;
    return { id: d.id, at: d.at, other: meA ? d.b : d.a, otherName: nm(meA ? d.b : d.a), mine: meA ? d.aR : d.bR, mySecs: meA ? d.aS : d.bS,
      theirs: meA ? d.bR : d.aR, theirSecs: meA ? d.bS : d.aS, st: d.st, win: d.win, iStarted: meA, qs: d.qs };
  };
  const incoming = rows.filter(function (d) { return d.b === seat && d.st === '' && d.aR != null && d.bR == null; });
  const waiting = rows.filter(function (d) { return d.a === seat && d.st === '' && d.aR != null; });
  const unplayed = rows.filter(function (d) { return d.a === seat && d.st === '' && d.aR == null; });
  const fresh = rows.filter(function (d) { return d.st === 'done' && (d.a === seat || d.b === seat) && d.seen.split(',').indexOf(String(seat)) < 0; });
  fresh.forEach(function (d) { sh.getRange(d.id, 10).setValue(d.seen ? d.seen + ',' + seat : String(seat)); });
  const T = duelTotals_()[seat] || { coin: 0, win: 0, n: 0 };
  return { ok: true, incoming: incoming.map(fmt), waiting: waiting.map(fmt), unplayed: unplayed.map(fmt), fresh: fresh.map(fmt),
    recent: rows.filter(function (d) { return (d.a === seat || d.b === seat) && d.st === 'done'; }).slice(-10).reverse().map(fmt),
    stats: T, petNeed: PET_NEED };
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
    const spent = (p.spent || 0) + it.s;
    if (row) sh.getRange(row, 4, 1, 2).setValues([[JSON.stringify(own), spent]]);
    else sh.appendRow([seat, JSON.stringify(p.a || items.default), '', JSON.stringify(own), spent]);
    bump_();
    return { ok: true, coin: p.coin - it.s, own: own };
  } finally { lock.releaseLock(); }
}


// ===================== 週末 BOSS 戰 =====================
// 題目：寂天 U1–U20。答對＝打 BOSS 一下（扣 1 滴血），答錯或超時＝自己少 1 顆心。
// 打倒 BOSS：拿代幣，並有機率掉落這隻 BOSS 的稀有寶物／寵物（每樣只會掉一次）。
// 週六、週日開放（老師、測試帳號隨時可以試打）；每人每天最多挑戰 3 次；要先打倒前一隻才能挑戰下一隻。
const BOSS_NAME = 'BOSS戰';
const BOSS_PER_DAY = 3;
const BOSS_PITY = 4;   // 保底：同一隻 BOSS 連續打倒 4 次都沒掉寶，第 4 次一定掉
// 難度設計（答對率 95% 的學生大約的勝率）：史萊姆王 97%、石像巨人 75%、暗影巫師 62%、冰霜巨龍 21%、混沌魔王 13%
// 有限時、題型也比較難，實際勝率會再低一些
const BOSSES = [
  { id: 'slime', name: '史萊姆王', icon: '🟢', diff: '簡單', hp: 12, hearts: 3, sec: 15, u: [1, 10], j: ['e'], coin: 10, drop: 20, items: ['pet:crownslime', 'hold:slimewand'] },
  { id: 'golem', name: '石像巨人', icon: '🗿', diff: '普通', hp: 18, hearts: 2, sec: 12, u: [1, 20], j: ['e', 'c'], coin: 20, drop: 22, items: ['pet:golem', 'acc:runeband'] },
  { id: 'wizard', name: '暗影巫師', icon: '🧙', diff: '困難', hp: 25, hearts: 2, sec: 10, u: [1, 20], j: ['e', 'c', 's'], coin: 30, drop: 25, items: ['pet:shadowcat', 'hold:shadowstaff'] },
  { id: 'icedragon', name: '冰霜巨龍', icon: '🐉', diff: '極難', hp: 30, hearts: 1, sec: 8, u: [1, 20], j: ['c', 's'], coin: 50, drop: 30, items: ['pet:icedragon', 'bg:glacier'] },
  { id: 'chaos', name: '混沌魔王', icon: '😈', diff: '地獄', hp: 40, hearts: 1, sec: 7, u: [1, 20], j: ['e', 'c', 's'], coin: 80, drop: 35, items: ['pet:imp', 'acc:demonhorns'] }
];
function bossSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(BOSS_NAME);
  if (!sh) { sh = ss.insertSheet(BOSS_NAME); sh.getRange(1, 1, 1, 9).setValues([['時間', '座號', 'BOSS', '結果', '答對', '答錯', '秒數', '掉落', '代幣']]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
function bossRows_() {
  const sh = bossSheet_(), n = sh.getLastRow() - 1;
  if (n <= 0) return [];
  return sh.getRange(2, 1, n, 9).getValues().map(function (r) {
    const t = r[0] instanceof Date ? r[0] : new Date(String(r[0]));
    return { day: isNaN(t) ? '' : Utilities.formatDate(t, 'Asia/Taipei', 'yyyy-MM-dd'), seat: parseInt(r[1], 10), boss: String(r[2]), win: String(r[3]) === 'win',
      drop: String(r[7] || ''), coin: Number(r[8]) || 0 };
  });
}
function bossTotals_() {
  const t = {};
  bossRows_().forEach(function (r) {
    const x = t[r.seat] = t[r.seat] || { coin: 0, drops: [] };
    x.coin += r.coin;
    if (r.drop && r.drop.indexOf(':') > 0 && x.drops.indexOf(r.drop) < 0) x.drops.push(r.drop);
  });
  return t;
}
function bossOpen_(seat) {
  if (seat === 30 || isStaff_(seat)) return true;
  const u = parseInt(Utilities.formatDate(new Date(), 'Asia/Taipei', 'u'), 10);   // 1＝週一 … 7＝週日
  return u >= 6;
}
function bossState_(seat, rows) {
  const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd'), mine = rows.filter(function (r) { return r.seat === seat; });
  const beat = {}, drops = [], dry = {};   // dry：上次掉寶之後又打倒幾次
  mine.forEach(function (r) {
    if (r.win) { beat[r.boss] = (beat[r.boss] || 0) + 1; dry[r.boss] = (dry[r.boss] || 0) + 1; }
    if (r.drop && r.drop.indexOf(':') > 0) { drops.push(r.drop); dry[r.boss] = 0; }
  });
  const used = mine.filter(function (r) { return r.day === today; }).length;
  return { beat: beat, drops: drops, dry: dry, used: used, left: Math.max(0, BOSS_PER_DAY - used) };
}
function bossInfo_(seat) {
  const rows = bossRows_(), st = bossState_(seat, rows);
  const p = profiles_()[seat] || {}, own = p.own || [];
  const top = {};   // 每隻 BOSS 被打倒幾次（全校）
  rows.forEach(function (r) { if (r.win) top[r.boss] = (top[r.boss] || 0) + 1; });
  return { ok: true, open: bossOpen_(seat), perDay: BOSS_PER_DAY, pityN: BOSS_PITY, left: st.left, used: st.used,
    bosses: BOSSES.map(function (b, i) {
      return { id: b.id, name: b.name, icon: b.icon, diff: b.diff, hp: b.hp, hearts: b.hearts, sec: b.sec, u: b.u, j: b.j, coin: b.coin, drop: b.drop,
        items: b.items.map(function (x) { return { key: x, got: own.indexOf(x) >= 0 }; }),
        beat: st.beat[b.id] || 0, unlocked: i === 0 || !!st.beat[BOSSES[i - 1].id], kills: top[b.id] || 0,
        pity: BOSS_PITY - (st.dry[b.id] || 0) };
    }) };
}
function bossFight_(seat, b) {
  const i = BOSSES.map(function (x) { return x.id; }).indexOf(String(b.boss || '')), B = BOSSES[i];
  if (!B) return { ok: false, error: '找不到這隻 BOSS' };
  if (!bossOpen_(seat)) return { ok: false, error: 'BOSS 戰只在週六、週日開放喔！' };
  const ans = (Array.isArray(b.answers) ? b.answers : []).slice(0, B.hp + B.hearts);
  let key = loadKey_();
  if (ans.some(function (a) { return !key[parseInt(a[0], 10)]; })) key = loadKey_(true);   // 題庫剛加新題：重新抓答案檔
  const seen = {};
  for (let k = 0; k < ans.length; k++) {
    const q = parseInt(ans[k][0], 10), e = key[q];
    if (!e || q < 50000 || seen[q]) return { ok: false, error: '題目不正確' };
    const u = parseInt(String(e[2] || '').replace(/^U/, ''), 10);
    if (!(u >= B.u[0] && u <= B.u[1])) return { ok: false, error: '題目不在範圍內' };
    seen[q] = 1;
  }
  // 照順序重算：答對扣 BOSS 血、答錯扣自己的心
  let hp = B.hp, hearts = B.hearts, right = 0, wrong = 0;
  for (let k = 0; k < ans.length && hp > 0 && hearts > 0; k++) {
    if (key[parseInt(ans[k][0], 10)][0] === parseInt(ans[k][1], 10)) { hp--; right++; } else { hearts--; wrong++; }
  }
  const win = hp <= 0, secs = Math.max(1, Math.min(3600, parseInt(b.secs, 10) || 0));
  if (win && secs < right * 1.5) return { ok: false, error: '作答時間不合理' };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const rows = bossRows_(), st = bossState_(seat, rows);
    if (st.left <= 0) return { ok: false, error: '今天的 ' + BOSS_PER_DAY + ' 次挑戰用完了，明天再來！' };
    if (i > 0 && !st.beat[BOSSES[i - 1].id]) return { ok: false, error: '要先打倒「' + BOSSES[i - 1].name + '」才能挑戰這隻' };
    let drop = '', coin = 0, bonus = 0;
    if (win) {
      coin = B.coin;
      const own = (profiles_()[seat] || {}).own || [];
      const left = B.items.filter(function (x) { return own.indexOf(x) < 0 && st.drops.indexOf(x) < 0; });
      if (left.length && (Math.random() * 100 < B.drop || (st.dry[B.id] || 0) + 1 >= BOSS_PITY)) drop = left[Math.floor(Math.random() * left.length)];
      else if (!left.length) { bonus = Math.round(B.coin / 2); coin += bonus; }   // 寶物都拿到了：多給一點代幣
    }
    bossSheet_().appendRow([new Date(), seat, B.id, win ? 'win' : 'lose', right, wrong, secs, drop, coin]);
    // 全校動態：掉寶、第一次打倒困難以上的 BOSS
    try {
      const nm = drop ? (avItemName_(drop) || drop) : '';
      if (drop) newsAdd_(seat, 'drop', drop + '@' + Date.now(), '打倒' + B.icon + B.name + '，掉落稀有' + (drop.indexOf('pet:') === 0 ? '寵物' : '寶物') + '「' + nm + '」！', drop);
      else if (win && !st.beat[B.id] && i >= 2) newsAdd_(seat, 'boss', B.id, '第一次打倒' + B.icon + B.name + '！', '');
    } catch (e) {}
    bump_();
    return { ok: true, win: win, right: right, wrong: wrong, hp: hp, hearts: hearts, coin: coin, bonus: bonus, drop: drop, first: win && !st.beat[B.id],
      next: win && BOSSES[i + 1] && !st.beat[B.id] ? BOSSES[i + 1].name : '', left: st.left - 1 };
  } finally { lock.releaseLock(); }
}


// ===================== 全校動態（光榮榜） =====================
// 稀有寶物、BOSS 掉寶、金／鑽石徽章、每 5 級升級 → 寫進「動態」表，大家首頁都看得到，還能按 👏 恭喜
// 第一次幫某個人檢查時，把他「以前就有的」成就先記成隱藏（不廣播舊的），之後新拿到的才廣播
const NEWS_NAME = '動態';
const NEWS_DAYS = 3;
function newsSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(NEWS_NAME);
  if (!sh) { sh = ss.insertSheet(NEWS_NAME); sh.getRange(1, 1, 1, 8).setValues([['時間', '座號', '類型', '代號', '內容', '圖', '拍手', '隱藏']]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
function newsRows_() {
  const sh = newsSheet_(), n = sh.getLastRow() - 1;
  if (n <= 0) return [];
  return sh.getRange(2, 1, n, 8).getValues().map(function (r, i) {
    const t = r[0] instanceof Date ? r[0].getTime() : Date.parse(String(r[0])) || 0;
    let claps = [];
    try { claps = JSON.parse(String(r[6] || '[]')); } catch (e) {}
    return { id: i + 2, t: t, seat: parseInt(r[1], 10), type: String(r[2]), key: String(r[3]), text: String(r[4]), pic: String(r[5] || ''), claps: claps, hidden: !!r[7] };
  });
}
function newsAdd_(seat, type, key, text, pic, hidden) {
  newsSheet_().appendRow([new Date(), seat, type, key, text, pic || '', '[]', hidden ? 1 : '']);
}
function avItemName_(key) {
  const k = String(key).split(':'), c = avItems_().cats.filter(function (x) { return x.key === k[0]; })[0];
  const it = c && c.items.filter(function (x) { return x.id === k[1]; })[0];
  return it ? it.name : '';
}
// 檢查這個人有沒有新的成就要廣播
function newsCheck_(seat) {
  if (seat === 30) return;
  const p = profiles_()[seat]; if (!p) return;
  const items = avItems_(), TR = {};
  (items.treasures || []).forEach(function (t) { TR[t.t] = t; });
  const want = [];
  (p.tr || []).forEach(function (t) { if (TR[t]) want.push(['tr', t, '獲得寶物「' + TR[t].name + '」💎', TR[t].cat + ':' + TR[t].id]); });
  const B = {}, TIER = ['', '銅', '銀', '金', '鑽石'];
  BADGE_DEFS.forEach(function (d) { B[d.id] = d; });
  ((badgesC_().badges || {})[seat] || []).forEach(function (id) {
    const d = B[id]; if (d && d.tier >= 3) want.push(['badge', id, '拿到' + TIER[d.tier] + '徽章「' + d.icon + ' ' + d.name + '」', '']);
  });
  for (let L = 5; L <= (p.lv || 0); L += 5) want.push(['lv', String(L), '升到 Lv.' + L + '！', '']);
  const mine = newsRows_().filter(function (r) { return r.seat === seat; }), have = {};
  mine.forEach(function (r) { have[r.type + '|' + r.key] = 1; });
  const seed = !mine.some(function (r) { return r.type !== 'drop' && r.type !== 'boss'; });   // 第一次檢查：舊成就不廣播
  let lvTop = 0;
  want.forEach(function (w) { if (w[0] === 'lv' && !have['lv|' + w[1]]) lvTop = Math.max(lvTop, +w[1]); });
  want.forEach(function (w) {
    if (have[w[0] + '|' + w[1]]) return;
    const quiet = seed || (w[0] === 'lv' && +w[1] !== lvTop);   // 一次跳好幾級只廣播最高的
    newsAdd_(seat, w[0], w[1], w[2], w[3], quiet);
  });
  if (seed) newsAdd_(seat, 'seed', '', '', '', true);
}
function news_(seat, check) {
  if (check) {
    const lock = LockService.getScriptLock();
    if (lock.tryLock(8000)) { try { newsCheck_(seat); } catch (e) {} finally { lock.releaseLock(); } }
  }
  const since = Date.now() - NEWS_DAYS * 864e5, ro = roster_(), av = avMap_();
  const list = newsRows_().filter(function (r) { return !r.hidden && r.t >= since && ro[r.seat]; }).slice(-30).reverse().map(function (r) {
    return { id: r.id, at: Utilities.formatDate(new Date(r.t), 'Asia/Taipei', 'MM/dd HH:mm'), t: r.t, seat: r.seat, given: givenName(ro[r.seat]),
      cls: isStaff_(r.seat) ? '老師' : classOf_(r.seat), type: r.type, text: r.text, pic: r.pic, a: (av[r.seat] || {}).a || null,
      claps: r.claps.length, iClap: r.claps.indexOf(seat) >= 0 };
  });
  return { ok: true, news: list };
}
function clap_(seat, id) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const r = newsRows_().filter(function (x) { return x.id === id; })[0];
    if (!r || r.hidden) return { ok: false, error: '找不到這則動態' };
    if (r.seat === seat) return { ok: false, error: '不能幫自己拍手啦 😆' };
    if (r.claps.indexOf(seat) < 0) { r.claps.push(seat); newsSheet_().getRange(id, 7).setValue(JSON.stringify(r.claps)); }
    return { ok: true, claps: r.claps.length };
  } finally { lock.releaseLock(); }
}


// ===== 老師儀表板：依期間統計（格式和「儀表板資料」分頁的各區塊相同）=====
function dashRange_(from, to) {
  const tz = 'Asia/Taipei', ok = function (d) { return d && (!from || d >= from) && (!to || d <= to); };
  const skip = function (seat) { return !seat || seat === 30 || isStaff_(seat); };
  const dstr = function (v) { return v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : String(v || '').slice(0, 10).replace(/\//g, '-'); };
  // 成績：每日（不含錯題重做）＋錯題重做次數
  const sh = sheet_(), n = sh.getLastRow() - 1;
  const daily = {}, redo = {};
  if (n > 0) sh.getRange(2, 1, n, 11).getValues().forEach(function (r) {
    const seat = parseInt(r[2], 10), d = dstr(r[1]);
    if (skip(seat) || !ok(d) || invMatch_(seat, r[4], d)) return;
    const ans = Number(r[7]) || 0, right = Number(r[8]) || 0;
    if (String(r[4]).indexOf('錯題重做') >= 0) {
      const x = redo[seat] = redo[seat] || [seat, 0, 0, 0]; x[1]++; x[2] += ans; x[3] += right; return;
    }
    const k = d + '|' + seat, x = daily[k] = daily[k] || [d, seat, String(r[3]), 0, 0, 0, 0];
    x[3]++; x[4] += ans; x[5] += right; x[6] += Number(r[10]) || 0;
  });
  // 作答明細：第一次作答（訂正＝0）
  const unit = {}, item = {}, pick = {}, type = {}, wrong = {};
  detailValues_().forEach(function (r) {
    const seat = parseInt(r[1], 10), d = dstr(r[0]);
    if (skip(seat) || !ok(d) || Number(r[9])) return;
    const o = Number(r[7]) ? 1 : 0, q = r[4], u = String(r[3]), t = String(r[6] || ''), w = String(r[5] || '');
    const a = unit[u + '|' + seat] = unit[u + '|' + seat] || [u, seat, 0, 0]; a[2]++; a[3] += o;
    const b = item[q] = item[q] || [q, 0, 0]; b[1]++; b[2] += o;
    const c = type[seat + '|' + t] = type[seat + '|' + t] || [seat, t, 0, 0]; c[2]++; c[3] += o;
    if (!o) {
      const pk = q + '|' + r[8], e = pick[pk] = pick[pk] || [q, String(r[8]), 0]; e[2]++;
      const wk = seat + '|' + w, f = wrong[wk] = wrong[wk] || [seat, w, 0]; f[2]++;
    }
  });
  const tbl = function (head, obj) { return [head].concat(Object.keys(obj).map(function (k) { return obj[k]; })); };
  return { ok: true, at: Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm'), from: from || '', to: to || '', blocks: {
    daily: tbl(['日期', '座號', '姓名', '測驗次數', '作答題數', '答對題數', '用時秒數'], daily),
    unit_stats: tbl(['回', '座號', '作答題數', '答對題數'], unit),
    item_stats: tbl(['題號', '作答次數', '答對次數'], item),
    wrong_picks: tbl(['題號', '選的', '次數'], pick),
    type_stats: tbl(['座號', '題型', '作答題數', '答對題數'], type),
    wrong_words: tbl(['座號', '單字', '答錯次數'], wrong),
    redo_stats: tbl(['座號', '訂正次數', '訂正題數', '訂正答對'], redo) } };
}


// ===================== 作答憑證（防止用程式直接灌成績）=====================
// 開始作答時，網頁先跟伺服器要一張憑證（記下座號、這次的題號、開始時間）；交卷時要附上憑證：
//   1. 憑證要存在、是這個座號的、沒用過
//   2. 交的題目都要在這次發的題號裡
//   3. 從開始到交卷的時間要合理（每題至少 1.5 秒）
// 網站改版前已經開著的舊頁面沒有憑證：到 TOK_GRACE 之前，格式正常的舊頁面成績還收；之後一律要憑證
const TOK_GRACE = '2026-11-25 06:00';
function startTok_(seat, ids, quizPw) {
  ids = (Array.isArray(ids) ? ids : []).slice(0, 300).map(function (x) { return parseInt(x, 10); }).filter(function (x) { return x >= 0; });
  if (!ids.length) return { ok: false, error: '沒有題目' };
  const tok = Utilities.getUuid().replace(/-/g, '').slice(0, 20);
  CacheService.getScriptCache().put('tk|' + tok, JSON.stringify({ s: seat, ids: ids, t: Date.now() }), 21600);
  // 每日小考：記下開始時間；當天第一次開始的那一份才是正式成績
  let first = null;
  if (quizPw && quizTask_(quizPw)) {
    const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
    quizStartSheet_().appendRow([new Date(), seat, "'" + today, tok]);
    first = !hasOfficialQuiz_(seat, today);
  }
  return { ok: true, tok: tok, first: first };
}
// 這個座號當天是否已經有正式的每日小考成績（N 欄＝當天日期，不含重考／補做）
function hasOfficialQuiz_(seat, date) {
  const sh = sheet_(), last = sh.getLastRow(), n = Math.min(1500, last - 1);
  if (n <= 0 || sh.getLastColumn() < 14) return false;
  const v = sh.getRange(last - n + 1, 3, n, 12).getValues();
  return v.some(function (r) { return +r[0] === seat && ymd_(r[11]) === date && String(r[11]).indexOf('重考') < 0 && String(r[11]).indexOf('補') < 0; });
}
// 「小考開始」分頁：每次開始每日小考記一列（時間、座號、日期、憑證）
function quizStartSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName('小考開始');
  if (!sh) { sh = ss.insertSheet('小考開始'); sh.getRange(1, 1, 1, 4).setValues([['時間', '座號', '日期', '憑證']]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
function quizStarts_(from, to) {
  to = to || from;
  const sh = quizStartSheet_(), n = sh.getLastRow() - 1;
  if (n <= 0) return [];
  return sh.getRange(2, 1, n, 4).getValues().map(function (r) {
    const d = r[2] instanceof Date ? Utilities.formatDate(r[2], 'Asia/Taipei', 'yyyy-MM-dd') : String(r[2]).replace(/^'/, '');
    return { t: r[0] instanceof Date ? r[0].getTime() : 0, seat: parseInt(r[1], 10), d: d, tok: String(r[3]) };
  }).filter(function (x) { return x.d >= from && x.d <= to; });
}
function checkTok_(seat, body, answers) {
  const tok = String(body.tok || '').slice(0, 40), C = CacheService.getScriptCache();
  if (!tok) {
    const now = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm');
    const range = String(body.range || '');
    const siteLike = /^((D\d+(–D\d+)?|D\d+(, D\d+)*|寂天 U\d+(–U\d+)?)(（錯題重做）)*|(生存挑戰|BOSS 戰|單字對戰)｜.*)$/.test(range);
    if (now < TOK_GRACE && siteLike) return { ok: true };
    return { ok: false, error: '這份成績沒有作答憑證，請重新整理網頁後再寫一次。' };
  }
  if (C.get('tku|' + tok)) return { ok: false, error: '這份成績已經交過了' };
  let v = null;
  try { v = JSON.parse(C.get('tk|' + tok) || 'null'); } catch (e) {}
  if (!v) return { ok: false, error: '作答憑證過期了（超過 6 小時），請重新整理網頁後再寫一次。' };
  if (v.s !== seat) return { ok: false, error: '作答憑證和座號不符' };
  const allow = {};
  v.ids.forEach(function (x) { allow[x] = 1; });
  if (answers.some(function (a) { return !allow[parseInt(a[0], 10)]; })) return { ok: false, error: '交的題目和開始時的題目不符' };
  // 錯題重做：題目剛看過，答得快很正常（每題 0.6 秒、至少 1 秒）；一般測驗每題 1.5 秒、至少 2 秒
  const isRedo = String(body.range || '').indexOf('錯題重做') >= 0;
  if (Date.now() - v.t < (isRedo ? Math.max(1000, answers.length * 600) : Math.max(2000, answers.length * 1500))) return { ok: false, error: '作答時間太短，這次成績不算。' };
  return { ok: true, tok: tok };
}


// ===================== 無效紀錄（老師標記，不刪資料）=====================
// 「無效紀錄」分頁每一列是一條規則：座號｜範圍（空白＝任何範圍）｜起日｜迄日｜原因
// 符合的「成績」列，以及同一次交卷的「作答明細」，都不算進排行榜、代幣、徽章、任務、老師儀表板。
// 要恢復：把那一列刪掉即可（約 6 小時內生效；想立刻生效就重新部署）。
const INV_NAME = '無效紀錄';
let INV_RULES_ = null, INV_STAMPS_ = null;
function invRules_() {
  if (INV_RULES_) return INV_RULES_;
  INV_RULES_ = [];
  try {
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(INV_NAME);
    if (sh && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues().forEach(function (r) {
      const seat = parseInt(r[0], 10); if (!seat) return;
      const ds = function (v) { return v instanceof Date ? Utilities.formatDate(v, 'Asia/Taipei', 'yyyy-MM-dd') : String(v || '').trim().replace(/^'/, '').replace(/\//g, '-'); };
      INV_RULES_.push({ seat: seat, range: String(r[1] || '').trim(), from: ds(r[2]), to: ds(r[3]) });
    });
  } catch (e) {}
  return INV_RULES_;
}
function invReset_() { INV_RULES_ = null; INV_STAMPS_ = null; DETAIL_VALUES_ = null; DIGEST_ = null; }   // 測試用
function invMatch_(seat, range, d) {
  const R = invRules_(); if (!R.length) return false;
  range = String(range || '');
  return R.some(function (x) { return x.seat === seat && (!x.range || x.range === range) && (!x.from || d >= x.from) && (!x.to || d <= x.to); });
}
// 無效的那幾次交卷時間（座號|yyyy-MM-dd HH:mm:ss），用來排除「作答明細」
function invStamps_() {
  if (INV_STAMPS_) return INV_STAMPS_;
  INV_STAMPS_ = { n: 0, s: {} };
  if (!invRules_().length) return INV_STAMPS_;
  const tz = 'Asia/Taipei', sh = sheet_(), n = sh.getLastRow() - 1;
  if (n > 0) sh.getRange(2, 1, n, 5).getValues().forEach(function (r) {
    const seat = parseInt(r[2], 10), d = r[1] instanceof Date ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd') : String(r[1]);
    if (!seat || !(r[0] instanceof Date) || !invMatch_(seat, r[4], d)) return;
    INV_STAMPS_.s[seat + '|' + Utilities.formatDate(r[0], tz, 'yyyy-MM-dd HH:mm:ss')] = 1; INV_STAMPS_.n++;
  });
  return INV_STAMPS_;
}


// ===== 同一題同一天只算第一次答對 =====
// 今天已經答對過的題號：先看快取；沒有就從「作答明細」最後幾千列重建
function okToday_(seat, today) {
  const C = CacheService.getScriptCache(), k = 'okq|' + seat + '|' + today, v = C.get(k);
  const set = {};
  if (v != null) { if (v) v.split(',').forEach(function (x) { set[x] = 1; }); return set; }
  try {
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DETAIL_NAME);
    const last = sh ? sh.getLastRow() : 1, n = Math.min(6000, last - 1);
    if (n > 0) sh.getRange(last - n + 1, 1, n, 8).getValues().forEach(function (r) {
      const d = r[0] instanceof Date ? Utilities.formatDate(r[0], 'Asia/Taipei', 'yyyy-MM-dd') : String(r[0]).replace(/^'/, '').slice(0, 10);
      if (d === today && parseInt(r[1], 10) === seat && Number(r[7]) === 1) set[r[4]] = 1;
    });
  } catch (e) {}
  return set;
}
function saveOkToday_(seat, today, set) {
  try { CacheService.getScriptCache().put('okq|' + seat + '|' + today, Object.keys(set).join(','), 21600); } catch (e) {}
}


// ===================== 可疑作答自動檢查 =====================
// 規則（每人每天）：
//   🚫 交卷被擋下（沒有憑證、太快、題目不符、重複交）
//   🤖 連續 5 次以上用時秒數一模一樣
//   ⏱ 任一小時內交卷 30 次以上
//   ⚡ 當天每題平均不到 2 秒、答對率 90% 以上（作答 30 題以上）
//   🔁 每日小考開始 3 次以上（重新整理／重開換題）
//   📈 最近 3 天答對率比之前高 20 個百分點以上，而且每題時間變成 1.5 倍以上（可能查答案或代寫）
//   🎲 當天答對率低於 35%、每題不到 4 秒（作答 20 題以上；接近亂猜，需要關心）
// 已標成無效的紀錄不再提醒；老師按「沒問題」的也不再提醒（記在「異常處理」分頁）
function teacherOk_(key) {
  const want = PropertiesService.getScriptProperties().getProperty('TEACHER_KEY');
  return !want || String(key || '') === want;
}
function blockedSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName('擋下紀錄');
  if (!sh) { sh = ss.insertSheet('擋下紀錄'); sh.getRange(1, 1, 1, 7).setValues([['時間', '座號', '姓名', '原因', '範圍', '題數', '秒數']]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
function anomalyDoneSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName('異常處理');
  if (!sh) { sh = ss.insertSheet('異常處理'); sh.getRange(1, 1, 1, 3).setValues([['代號', '處理', '時間']]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
function anomalies_(from, to) {
  const tz = 'Asia/Taipei', today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  to = to || today; from = from || shift_(to, -6);
  const ro = roster_(), stu = function (s) { return s && s !== 30 && !isStaff_(s); };
  const fmt = function (t) { return Utilities.formatDate(new Date(t), tz, 'HH:mm'); };
  const items = [], add = function (type, seat, d, ev, range) {
    items.push({ k: type + '|' + seat + '|' + d, type: type, seat: seat, name: ro[seat] || '', cls: classOf_(seat) || '', d: d, ev: ev, range: range || '' });
  };
  // 成績（含時間、秒數；已無效的跳過）
  const sh = sheet_(), n = sh.getLastRow() - 1, by = {};
  if (n > 0) sh.getRange(2, 1, n, 14).getValues().forEach(function (r) {
    const seat = parseInt(r[2], 10); if (!stu(seat) || !(r[0] instanceof Date)) return;
    const d = Utilities.formatDate(r[0], tz, 'yyyy-MM-dd');
    if (d < shift_(from, -14) || d > to || invMatch_(seat, r[4], d)) return;
    (by[seat] = by[seat] || []).push({ t: r[0].getTime(), d: d, range: String(r[4]), ans: Number(r[7]) || 0, right: Number(r[8]) || 0,
      secs: Number(r[10]) || 0, redo: String(r[4]).indexOf('錯題重做') >= 0, timed: timed_(r[4]) });
  });
  Object.keys(by).forEach(function (k) {
    const seat = +k, L = by[k].sort(function (a, b) { return a.t - b.t; });
    const days = {};
    L.forEach(function (x) { if (x.d >= from) (days[x.d] = days[x.d] || []).push(x); });
    Object.keys(days).forEach(function (d) {
      const X = days[d];
      // 秒數一模一樣
      let run = 1, best = 1, bs = 0, br = '';
      for (let i = 1; i < X.length; i++) {
        if (X[i].secs > 0 && X[i].secs === X[i - 1].secs) { run++; if (run > best) { best = run; bs = X[i].secs; br = X[i].range; } } else run = 1;
      }
      if (best >= 5) add('same', seat, d, '連續 ' + best + ' 次交卷，每次用時都剛好 ' + bs + ' 秒（範圍「' + br + '」）', br);
      // 一小時內交卷次數
      let mx = 0, a = 0, at = 0;
      for (let i = 0; i < X.length; i++) { while (X[i].t - X[a].t > 3600000) a++; if (i - a + 1 > mx) { mx = i - a + 1; at = a; } }
      if (mx >= 30) {
        const rc = {}; X.slice(at, at + mx).forEach(function (x) { rc[x.range] = (rc[x.range] || 0) + 1; });
        const top = Object.keys(rc).sort(function (p, q) { return rc[q] - rc[p]; })[0];
        add('burst', seat, d, fmt(X[at].t) + '–' + fmt(X[at + mx - 1].t) + ' 一小時內交卷 ' + mx + ' 次（最多的範圍「' + top + '」）', rc[top] === mx ? top : '');
      }
      const N = X.filter(function (x) { return !x.redo && !x.timed && x.secs > 0 && x.secs < 3600; });
      const ans = N.reduce(function (s, x) { return s + x.ans; }, 0), right = N.reduce(function (s, x) { return s + x.right; }, 0), secs = N.reduce(function (s, x) { return s + x.secs; }, 0);
      if (ans >= 30 && secs / ans < 2 && right / ans >= 0.9) add('fast', seat, d, '當天 ' + ans + ' 題，每題平均 ' + (secs / ans).toFixed(1) + ' 秒，答對率 ' + Math.round(right / ans * 100) + '%');
      if (ans >= 20 && right / ans < 0.35 && secs / ans < 4) add('random', seat, d, '當天 ' + ans + ' 題，答對率只有 ' + Math.round(right / ans * 100) + '%，每題平均 ' + (secs / ans).toFixed(1) + ' 秒（接近亂猜，可能沒在看題目）');
    });
    // 成績突然暴增（以期間最後一天往前 3 天 vs 之前）
    const cut = shift_(to, -2), N2 = L.filter(function (x) { return !x.redo && !x.timed && x.secs > 0 && x.secs < 3600; });
    const sum = function (X) { return X.reduce(function (o, x) { o.a += x.ans; o.r += x.right; o.s += x.secs; return o; }, { a: 0, r: 0, s: 0 }); };
    const A = sum(N2.filter(function (x) { return x.d < cut; })), B = sum(N2.filter(function (x) { return x.d >= cut && x.d <= to; }));
    if (A.a >= 40 && B.a >= 40) {
      const ra = A.r / A.a, rb = B.r / B.a, sa = A.s / A.a, sb = B.s / B.a;
      if (rb - ra >= 0.2 && sb >= sa * 1.5) add('jump', seat, to, '最近 3 天答對率 ' + Math.round(ra * 100) + '% → ' + Math.round(rb * 100) + '%，每題時間 ' + sa.toFixed(1) + ' → ' + sb.toFixed(1) + ' 秒（可能查答案或別人代寫，也可能真的進步）');
    }
  });
  // 小考開始次數
  const qs = {};
  quizStarts_(from, to).forEach(function (x) { if (stu(x.seat)) { const k = x.seat + '|' + x.d; qs[k] = (qs[k] || 0) + 1; } });
  Object.keys(qs).forEach(function (k) { if (qs[k] >= 3) { const p = k.split('|'); add('quiz', +p[0], p[1], '每日小考開始了 ' + qs[k] + ' 次（第一份寫完的才算成績；一直重開可能是在偷看題目）'); } });
  // 被擋下的交卷
  const bsh = blockedSheet_(), bn = bsh.getLastRow() - 1, bl = {};
  if (bn > 0) bsh.getRange(2, 1, bn, 7).getValues().forEach(function (r) {
    if (!(r[0] instanceof Date)) return;
    const seat = parseInt(r[1], 10), d = Utilities.formatDate(r[0], tz, 'yyyy-MM-dd');
    if (!stu(seat) || d < from || d > to) return;
    const o = bl[seat + '|' + d] = bl[seat + '|' + d] || { n: 0, why: {} }; o.n++; o.why[String(r[3])] = (o.why[String(r[3])] || 0) + 1;
  });
  Object.keys(bl).forEach(function (k) {
    const p = k.split('|'), o = bl[k];
    add('blocked', +p[0], p[1], '交卷被系統擋下 ' + o.n + ' 次：' + Object.keys(o.why).map(function (w) { return w.replace(/[，。].*$/, '') + ' ×' + o.why[w]; }).join('、'));
  });
  // 已處理的不再顯示
  const dsh = anomalyDoneSheet_(), dn = dsh.getLastRow() - 1, done = {};
  if (dn > 0) dsh.getRange(2, 1, dn, 2).getValues().forEach(function (r) { done[String(r[0])] = String(r[1]); });
  const order = { blocked: 0, same: 1, burst: 2, fast: 3, quiz: 4, jump: 5, random: 6 };
  const list = items.filter(function (x) { return !done[x.k]; }).sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : order[a.type] - order[b.type]; });
  return { ok: true, from: from, to: to, items: list };
}
function anomalyAct_(k, act) {
  k = String(k || ''); const p = k.split('|');
  if (p.length !== 3) return { ok: false, error: '代號不正確' };
  const sh = anomalyDoneSheet_();
  if (act === 'invalid') {
    const it = (anomalies_(p[2], p[2]).items || []).filter(function (x) { return x.k === k; })[0];
    const range = it ? it.range : '';
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(INV_NAME) || SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet(INV_NAME).getRange(1, 1, 1, 5).setValues([['座號', '範圍（空白＝全部）', '起日', '迄日', '原因']]);
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(INV_NAME).appendRow([+p[1], range, "'" + p[2], "'" + p[2], '老師從可疑作答標記：' + (it ? it.ev : p[0])]);
    sh.appendRow([k, '標成無效', new Date()]);
    bump_();
  } else sh.appendRow([k, '沒問題', new Date()]);
  return { ok: true };
}

// ===== 每天寄異常摘要給老師（寄到部署這支程式的帳號信箱）=====
// 第一次使用：在 Apps Script 編輯器選 setupDailyMail 按「執行」，同意寄信權限；之後每天晚上 9 點半左右自動寄
const TEACHER_PAGE = 'https://nian-zu.github.io/904ENGVOC/t-lIYA4SOCIi1MNbuF3uKo2qGwB50uczwALry0VHWV.html';
function setupDailyMail() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'dailyAnomalyMail') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('dailyAnomalyMail').timeBased().everyDays(1).atHour(21).nearMinute(30).inTimezone('Asia/Taipei').create();
  dailyAnomalyMail();   // 先寄一封確認收得到
}
function dailyAnomalyMail() {
  const tz = 'Asia/Taipei', today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const A = anomalies_(today, today), L = A.items || [];
  const icon = { blocked: '🚫', same: '🤖', burst: '⏱', fast: '⚡', quiz: '🔁', jump: '📈', random: '🎲' };
  const name = { blocked: '交卷被擋下', same: '秒數一模一樣', burst: '交卷太密', fast: '快到不合理', quiz: '小考一直重開', jump: '成績突然暴增', random: '接近亂猜' };
  const esc = function (t) { return String(t).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };
  const subject = '【每日背英單】' + today.slice(5).replace('-', '/') + (L.length ? ' 可疑作答 ' + L.length + ' 筆' : ' 今天沒有可疑作答');
  const html = '<div style="font-family:sans-serif;font-size:15px;line-height:1.6">' +
    '<p>' + today + ' 自動檢查結果：' + (L.length ? '<b>' + L.length + ' 筆</b>需要看一下。' : '沒有發現異常 👍') + '</p>' +
    (L.length ? '<table cellpadding="6" style="border-collapse:collapse;border:1px solid #ddd">' + L.map(function (x) {
      return '<tr style="border-top:1px solid #ddd"><td>' + icon[x.type] + ' ' + name[x.type] + '</td><td><b>' + esc(x.cls) + ' ' + esc(x.name) + '</b>（' + x.seat + '）</td><td>' + esc(x.ev) + '</td></tr>';
    }).join('') + '</table>' : '') +
    '<p>這只是提醒，不代表一定作弊。到<a href="' + TEACHER_PAGE + '">老師儀表板</a>的「⚠️ 可疑作答」可以標成無效或按「沒問題」。</p></div>';
  MailApp.sendEmail({ to: Session.getEffectiveUser().getEmail(), subject: subject, htmlBody: html });
}
