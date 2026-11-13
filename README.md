# 會考英文每日測驗（含成績後台）

- 學生測驗頁：`https://你的網址/`
- 老師後台：`https://你的網址/admin.html`

成績存在 Netlify 內建的雲端儲存（Netlify Blobs），不用另外申請資料庫。

## 檔案說明

```
public/index.html            學生測驗頁（選座號、姓名 → 測驗 → 自動上傳成績）
public/admin.html            老師後台（密碼登入、交卷狀況、個人統計、最常錯的字、下載 CSV）
public/bank.json             題庫（183 天 × 每天 100 題）
netlify/functions/submit.mjs   接收成績，伺服器端重新計分後存檔
netlify/functions/results.mjs  後台查詢／刪除成績（需要密碼）
netlify/functions/answer-key.json  答案卷（只給伺服器用）
netlify.toml / package.json  Netlify 設定
```

## 部署步驟

> ⚠️ 不能用「把資料夾拖進 Netlify」的方式部署：拖曳上傳不會建立後台程式（Functions），成績就存不進去。請用下面兩種方法之一。

### 方法 A：GitHub（最推薦，之後改題庫也方便）

1. 在 GitHub 建一個新的 repository，把整個資料夾的檔案上傳上去（`node_modules` 資料夾不用上傳）。
2. 登入 Netlify → **Add new site → Import an existing project** → 選 GitHub → 選這個 repository。
3. 設定頁面不用改（netlify.toml 已經寫好），直接按 **Deploy**。

### 方法 B：Netlify CLI（用電腦指令）

```bash
npm install -g netlify-cli
cd 這個資料夾
npm install
netlify login
netlify deploy --prod
```

## 一定要做：設定後台密碼

1. Netlify 網站頁面 → **Site configuration → Environment variables → Add a variable**
2. Key 填 `ADMIN_PASSWORD`，Value 填你要的密碼。
3. 存檔後到 **Deploys → Trigger deploy → Deploy site** 重新部署一次，密碼才會生效。

## 可以自己改的地方

- **班級人數**：`public/index.html` 裡搜尋 `const CLASS_SIZE = 28;` 改數字（後台頁面上也可以直接改）。
- **起始日期**：`public/index.html` 裡的 `const START = new Date(2026, 10, 13);` 代表 2026/11/13 是 D183（月份從 0 開始算，10 = 11 月）。

## 防作弊說明

- 學生送出的是「每題選了哪個選項」，分數由伺服器用答案卷重新計算，改網頁上的分數沒有用。
- 後台會標出「中途結束」的測驗（作答題數少於題目數）。
- 每次測驗都會留下紀錄，包含交卷時間和用時，太快交卷的可以從「用時」看出來。

## 隱私

只存座號、學生自己輸入的姓名、分數和答錯的字。若不想存真名，可以請學生只填座號或綽號。
