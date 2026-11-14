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
    const name = String(body.name || '').trim().slice(0, 20);
    if (!(seat >= 1 && seat <= 60)) return out_({ ok: false, error: '座號不正確' });
    if (!name) return out_({ ok: false, error: '請輸入姓名' });
    const answers = Array.isArray(body.answers) ? body.answers.slice(0, 300) : [];
    if (!answers.length) return out_({ ok: false, error: '沒有作答資料' });

    // 重新計分
    const key = loadKey_();
    const kindZh = { word: '單字', verb: '動詞變化', prep: '介系詞' };
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
    const kinds = { all: '全部', word: '單字', verb: '動詞變化', prep: '介系詞' };

    // 台灣時間
    const now = new Date();
    const p = Utilities.formatDate(now, 'Asia/Taipei', 'yyyy,M,d,H,m,s').split(',');
    const row = [
      '=DATE(' + p[0] + ',' + p[1] + ',' + p[2] + ')+TIME(' + p[3] + ',' + p[4] + ',' + p[5] + ')',
      '=DATE(' + p[0] + ',' + p[1] + ',' + p[2] + ')',
      seat, "'" + name, "'" + range,
      kinds[body.kind] || '全部', total, answered, right, score, seconds,
      answered >= total ? '是' : '否', wrong.slice(0, 100).join(' ')
    ];

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sh = sheet_();
      append_(sh, [row]);
      const day = "'" + p[0] + '-' + ('0' + p[1]).slice(-2) + '-' + ('0' + p[2]).slice(-2);
      const stamp = "'" + day.slice(1) + ' ' + ('0' + p[3]).slice(-2) + ':' + ('0' + p[4]).slice(-2) + ':' + ('0' + p[5]).slice(-2);
      const rows = detail.map(function (x) {
        return [day, seat, "'" + name, 'D' + (183 - x[1][2]), x[0], "'" + x[1][1], x[4], x[2] ? 1 : 0, "'" + x[3], redo, stamp];
      });
      if (rows.length) {
        const dt = detailSheet_();
        append_(dt, rows);
      }
    } finally {
      lock.releaseLock();
    }
    return out_({ ok: true, score: score, right: right, answered: answered });
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
  if (p.action !== 'board') return out_({ ok: true, message: '成績接收程式運作中' });
  const period = ['day', 'week', 'month', 'all'].indexOf(p.period) >= 0 ? p.period : 'week';
  const tz = 'Asia/Taipei';
  const today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');

  let from = '0000-00-00', prevFrom = '', prevTo = '';
  if (period === 'day') { from = today; prevFrom = prevTo = shift_(today, -1); }
  if (period === 'week') { from = weekStart_(today); prevFrom = shift_(from, -7); prevTo = shift_(from, -1); }
  if (period === 'month') { from = today.slice(0, 8) + '01'; prevTo = shift_(from, -1); prevFrom = prevTo.slice(0, 8) + '01'; }

  const rows = readRows_();
  const cur = agg_(rows, from, today), prv = prevFrom ? agg_(rows, prevFrom, prevTo) : {};
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

  return out_({ ok: true, period: period, from: from, today: today, top: boards.right, boards: boards,
    min: { rate: MIN_RATE[period], up: MIN_UP[period] || null },
    titles: titles_(list, prv, streaks, period), fame: fame_(rows, today) });
}

function readRows_() {
  const tz = 'Asia/Taipei', sh = sheet_(), n = sh.getLastRow() - 1, out = [];
  if (n <= 0) return out;
  sh.getRange(2, 1, n, 10).getValues().forEach(function (r) { // A:J
    const seat = parseInt(r[2], 10);
    if (!seat || seat === 30) return;
    out.push({ d: r[1] instanceof Date ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd') : String(r[1]), seat: seat, name: String(r[3]),
      redo: String(r[4]).indexOf('錯題重做') >= 0, answered: Number(r[7]) || 0, right: Number(r[8]) || 0 });
  });
  return out;
}

function agg_(rows, from, to) {
  const st = {};
  rows.forEach(function (r) {
    if (r.d < from || r.d > to) return;
    const s = st[r.seat] || (st[r.seat] = { seat: r.seat, name: '', right: 0, answered: 0, tests: 0, fRight: 0, fAns: 0, days: {} });
    s.name = r.name; s.right += r.right; s.answered += r.answered; s.tests++; s.days[r.d] = 1;
    if (!r.redo) { s.fRight += r.right; s.fAns += r.answered; }
  });
  return st;
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
function fame_(rows, today) {
  function champs(keyOf, labelOf, curKey) {
    const by = {};
    rows.forEach(function (r) {
      const k = keyOf(r.d), g = by[k] || (by[k] = {});
      const s = g[r.seat] || (g[r.seat] = { seat: r.seat, name: r.name, right: 0 });
      s.name = r.name; s.right += r.right;
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

function loadKey_() {
  const cache = CacheService.getScriptCache();
  const parts = cache.get('key_parts');
  if (parts) {
    const n = parseInt(parts, 10), keys = [];
    for (let i = 0; i < n; i++) keys.push('key_' + i);
    const got = cache.getAll(keys);
    if (Object.keys(got).length === n) return JSON.parse(keys.map(function (k) { return got[k]; }).join(''));
  }
  const text = UrlFetchApp.fetch(KEY_URL).getContentText();
  const size = 90000, obj = {};
  let n = 0;
  for (let i = 0; i < text.length; i += size) obj['key_' + (n++)] = text.slice(i, i + size);
  obj['key_parts'] = String(n);
  cache.putAll(obj, 21600);
  return JSON.parse(text);
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
