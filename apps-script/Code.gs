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

// 排行榜：GET ?action=board&period=week|month|all
// 依「答對題數」加總排名，只回傳前 10 名，30 號（測試用）不列入
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action !== 'board') return out_({ ok: true, message: '成績接收程式運作中' });
  const period = ['week', 'month', 'all'].indexOf(p.period) >= 0 ? p.period : 'week';

  const tz = 'Asia/Taipei';
  const today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  let from = '0000-00-00';
  if (period === 'month') from = today.slice(0, 8) + '01';
  if (period === 'week') {
    const dow = parseInt(Utilities.formatDate(new Date(), tz, 'u'), 10); // 1=週一 … 7=週日
    from = Utilities.formatDate(new Date(Date.now() - (dow - 1) * 86400000), tz, 'yyyy-MM-dd');
  }

  // 上一個同長度的期間（算「進步最多」用）
  let prevFrom = '', prevTo = '';
  if (period === 'week') { prevFrom = shift_(from, -7); prevTo = shift_(from, -1); }
  if (period === 'month') { prevTo = shift_(from, -1); prevFrom = prevTo.slice(0, 8) + '01'; }

  const sh = sheet_();
  const n = sh.getLastRow() - 1;
  const stats = {}, prevStats = {}, allDays = {};
  if (n > 0) {
    const rows = sh.getRange(2, 1, n, 10).getValues(); // A:J
    rows.forEach(function (r) {
      const d = r[1] instanceof Date ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd') : String(r[1]);
      const seat = parseInt(r[2], 10);
      if (!seat || seat === 30) return;
      (allDays[seat] = allDays[seat] || {})[d] = 1;
      const redo = String(r[4]).indexOf('錯題重做') >= 0;
      let s = null;
      if (d >= from) s = stats[seat] || (stats[seat] = { seat: seat, name: '', right: 0, answered: 0, tests: 0, fRight: 0, fAns: 0, days: {} });
      else if (prevFrom && d >= prevFrom && d <= prevTo) s = prevStats[seat] || (prevStats[seat] = { seat: seat, name: '', right: 0, answered: 0, tests: 0, fRight: 0, fAns: 0, days: {} });
      if (!s) return;
      s.name = String(r[3]);
      s.right += Number(r[8]) || 0;
      s.answered += Number(r[7]) || 0;
      s.tests++;
      s.days[d] = 1;
      if (!redo) { s.fRight += Number(r[8]) || 0; s.fAns += Number(r[7]) || 0; }
    });
  }
  const list = Object.keys(stats).map(function (k) { return stats[k]; })
    .sort(function (a, b) { return b.right - a.right || a.seat - b.seat; });
  let rank = 0, prev = null;
  const top = [];
  list.forEach(function (s, i) {
    if (s.right !== prev) { rank = i + 1; prev = s.right; }
    if (rank <= 10) top.push({ rank: rank, seat: s.seat, given: givenName(s.name), right: s.right, tests: s.tests,
      rate: s.answered ? Math.round(s.right / s.answered * 100) : 0 });
  });
  const titles = titles_(list, prevStats, allDays, today, period);
  return out_({ ok: true, period: period, from: from, today: today, top: top, titles: titles });
}

function shift_(d, n) {
  return Utilities.formatDate(new Date(Date.parse(d + 'T12:00:00+08:00') + n * 86400000), 'Asia/Taipei', 'yyyy-MM-dd');
}

// 稱號：最強、最準、進步最多、最勤奮、連續達人（同分全部並列）
// 答對率只算一般測驗，不含錯題重做
function titles_(list, prevStats, allDays, today, period) {
  const minAns = period === 'week' ? 30 : 100;
  const out = [];
  function best(key, label, desc, cands, val, show, min) {
    let top = null;
    cands.forEach(function (s) { const v = val(s); if (v == null || (min != null && v < min)) return; if (top == null || v > top) top = v; });
    if (top == null) return;
    const who = cands.filter(function (s) { return val(s) === top; }).sort(function (a, b) { return a.seat - b.seat; });
    out.push({ key: key, label: label, desc: desc, value: show(top),
      who: who.map(function (s) { return { seat: s.seat, given: givenName(s.name) }; }) });
  }
  const rate = function (s) { return s.fAns >= minAns ? Math.round(s.fRight / s.fAns * 100) : null; };
  best('strong', '最強', '答對題數最多', list, function (s) { return s.right || null; }, function (v) { return v + ' 題'; });
  best('sharp', '神準', '答對率最高（至少作答 ' + minAns + ' 題）', list, rate, function (v) { return v + '%'; });
  if (period !== 'all') {
    best('up', '進步最多', '答對率比上一' + (period === 'week' ? '週' : '個月') + '進步最多（兩段各至少作答 20 題）', list, function (s) {
      const p = prevStats[s.seat];
      if (!p || p.fAns < 20 || s.fAns < 20) return null;
      return Math.round(s.fRight / s.fAns * 100) - Math.round(p.fRight / p.fAns * 100);
    }, function (v) { return '+' + v + ' 分'; }, 1);
  }
  best('busy', '最勤奮', '交卷天數最多', list, function (s) { return Object.keys(s.days).length; }, function (v) { return v + ' 天'; });
  const streaks = Object.keys(allDays).map(function (seat) {
    const days = allDays[seat];
    let d = days[today] ? today : shift_(today, -1), k = 0;
    while (days[d]) { k++; d = shift_(d, -1); }
    const s = list.filter(function (x) { return x.seat === +seat; })[0];
    return { seat: +seat, name: s ? s.name : '', streak: k };
  }).filter(function (s) { return s.name; });
  best('streak', '連續達人', '目前連續每天交卷的天數', streaks, function (s) { return s.streak; }, function (v) { return '連續 ' + v + ' 天'; }, 2);
  return out;
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
