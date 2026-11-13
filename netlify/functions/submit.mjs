// 學生交卷：POST /api/submit
// 伺服器端用答案卷重新計分，再存進 Netlify Blobs（store: "results"）
import { getStore } from "@netlify/blobs";
import KEY from "./answer-key.json" with { type: "json" };

const LABEL = (d) => "D" + (183 - d);

function bad(msg, status = 400) {
  return Response.json({ ok: false, error: msg }, { status });
}

export default async (req) => {
  if (req.method !== "POST") return bad("只接受 POST", 405);
  let body;
  try { body = await req.json(); } catch { return bad("資料格式錯誤"); }

  const seat = parseInt(body.seat, 10);
  const name = String(body.name || "").trim().slice(0, 20);
  const range = String(body.range || "").slice(0, 120);
  const kind = ["all", "word", "verb", "prep"].includes(body.kind) ? body.kind : "all";
  const answers = Array.isArray(body.answers) ? body.answers.slice(0, 300) : [];
  const seconds = Math.max(0, Math.min(36000, parseInt(body.seconds, 10) || 0));
  const total = Math.max(0, Math.min(300, parseInt(body.total, 10) || answers.length));

  if (!(seat >= 1 && seat <= 60)) return bad("座號不正確");
  if (!name) return bad("請輸入姓名");
  if (answers.length === 0) return bad("沒有作答資料");

  // 重新計分
  let right = 0;
  const wrong = [];
  const days = new Set();
  for (const a of answers) {
    if (!Array.isArray(a) || a.length !== 2) continue;
    const [qid, pick] = a.map((v) => parseInt(v, 10));
    const k = KEY[qid];
    if (!k) continue;
    days.add(LABEL(k[2]));
    if (k[0] === pick) right++;
    else wrong.push(k[1]);
  }
  const answered = answers.length;
  const score = answered ? Math.round((right / answered) * 100) : 0;

  const now = new Date();
  // 以台灣時間的日期當資料夾，方便老師依日期查詢
  const tw = new Date(now.getTime() + 8 * 3600 * 1000);
  const day = tw.toISOString().slice(0, 10);
  const id = `${day}/${now.getTime()}-${String(seat).padStart(2, "0")}`;

  const record = {
    id, date: day, time: now.toISOString(), seat, name, range, kind,
    total, answered, right, score, seconds,
    finished: answered >= total,
    wrong: wrong.slice(0, 100),
  };

  const store = getStore({ name: "results", consistency: "strong" });
  await store.setJSON(id, record);

  return Response.json({ ok: true, score, right, answered });
};

export const config = { path: "/api/submit" };
