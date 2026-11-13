/**
 * 會考英文每日測驗：成績接收程式（Google Apps Script）
 * 貼到「904 英文每日測驗成績」試算表的 擴充功能 → Apps Script，
 * 再「部署 → 新增部署作業 → 網頁應用程式」，存取權選「所有人」。
 */
const SHEET_NAME = '成績';
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
    let right = 0;
    const wrong = [];
    answers.forEach(function (a) {
      const k = key[parseInt(a[0], 10)];
      if (!k) return;
      if (k[0] === parseInt(a[1], 10)) right++; else wrong.push(k[1]);
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
      seat, "'" + name, "'" + String(body.range || '').slice(0, 120),
      kinds[body.kind] || '全部', total, answered, right, score, seconds,
      answered >= total ? '是' : '否', wrong.slice(0, 100).join(' ')
    ];

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
      sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setValues([row]);
    } finally {
      lock.releaseLock();
    }
    return out_({ ok: true, score: score, right: right, answered: answered });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return out_({ ok: true, message: '成績接收程式運作中' });
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
