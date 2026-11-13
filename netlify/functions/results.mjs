// 老師查詢成績：GET /api/results?from=2026-11-14&to=2026-11-20
// 需在 header 帶 x-admin-password（與 Netlify 環境變數 ADMIN_PASSWORD 相同）
// 刪除單筆：DELETE /api/results?id=<紀錄 id>
import { getStore } from "@netlify/blobs";

function auth(req) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return "尚未在 Netlify 設定 ADMIN_PASSWORD 環境變數";
  if (req.headers.get("x-admin-password") !== pw) return "密碼錯誤";
  return null;
}

function* daysBetween(from, to) {
  const a = new Date(from + "T00:00:00Z"), b = new Date(to + "T00:00:00Z");
  for (let d = a; d <= b; d = new Date(d.getTime() + 86400000)) yield d.toISOString().slice(0, 10);
}

export default async (req) => {
  const err = auth(req);
  if (err) return Response.json({ ok: false, error: err }, { status: 401 });

  const url = new URL(req.url);
  const store = getStore({ name: "results", consistency: "strong" });

  if (req.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return Response.json({ ok: false, error: "缺少 id" }, { status: 400 });
    await store.delete(id);
    return Response.json({ ok: true });
  }

  const re = /^\d{4}-\d{2}-\d{2}$/;
  let from = url.searchParams.get("from"), to = url.searchParams.get("to");
  const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  if (!re.test(from || "")) from = today;
  if (!re.test(to || "")) to = from;
  if (from > to) [from, to] = [to, from];

  const keys = [];
  let n = 0;
  for (const day of daysBetween(from, to)) {
    if (++n > 200) break; // 最多查 200 天
    const { blobs } = await store.list({ prefix: day + "/" });
    keys.push(...blobs.map((b) => b.key));
  }

  const records = [];
  for (let i = 0; i < keys.length; i += 25) {
    const part = await Promise.all(keys.slice(i, i + 25).map((k) => store.get(k, { type: "json" })));
    records.push(...part.filter(Boolean));
  }
  records.sort((a, b) => (a.time < b.time ? 1 : -1));
  return Response.json({ ok: true, from, to, count: records.length, records });
};

export const config = { path: "/api/results" };
