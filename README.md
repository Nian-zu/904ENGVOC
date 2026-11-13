# 會考英文每日測驗（GitHub Pages ＋ Google 試算表）

- 學生測驗頁：https://nian-zu.github.io/904ENGVOC/
- 成績：自動寫進 Google 試算表「904 英文每日測驗成績」

## 檔案

```
docs/index.html        學生測驗頁（GitHub Pages 從 docs 資料夾發布）
docs/bank.json         題庫（183 天 × 每天 100 題）
docs/answer-key.json   答案卷（Apps Script 用來重新計分）
apps-script/Code.gs    貼到 Google 試算表 Apps Script 的成績接收程式
```

## 設定一：開啟 GitHub Pages

1. GitHub 這個 repository → **Settings → Pages**
2. Source 選 **Deploy from a branch**，Branch 選 **main**、資料夾選 **/docs**，按 **Save**
3. 等 1–2 分鐘，網址是 https://nian-zu.github.io/904ENGVOC/

## 設定二：Google 試算表接收成績

1. 打開試算表「904 英文每日測驗成績」→ **擴充功能 → Apps Script**
2. 把編輯器裡原本的內容全部刪掉，貼上 `apps-script/Code.gs` 的內容，按儲存
3. 右上角 **部署 → 新增部署作業**
   - 類型（齒輪圖示）選 **網頁應用程式**
   - 執行身分：**我**
   - 誰可以存取：**所有人**
4. 按 **部署**，依畫面授權（出現「Google 尚未驗證這個應用程式」時，按「進階」→「前往…（不安全）」→ 允許。這是你自己寫的程式，所以會出現這個提示）
5. 複製「網頁應用程式網址」（https://script.google.com/macros/s/……/exec），填進 `docs/index.html` 裡的 `const SHEET_URL = '';`

> 之後如果改了 Code.gs，要用「部署 → 管理部署作業 → 編輯（鉛筆）→ 版本選『新版本』→ 部署」，網址才會不變。

## 試算表的兩個分頁

- **成績**：每次交卷一列（交卷時間、日期、座號、姓名、範圍、題型、題數、作答、答對、分數、用時、是否完成、答錯的字）。分數由 Apps Script 用答案卷重新計算。
- **統計**：改 B1、B2 的起迄日，自動算出 1–28 號在這段期間的測驗次數、平均、最佳分數、最後交卷時間；沒交卷的座號整列標紅，平均低於 60 分標紅字。

## 可以自己改的地方

- 班級人數：`docs/index.html` 的 `const CLASS_SIZE = 28;`
- 起始日期：`docs/index.html` 的 `const START = new Date(2026, 10, 13);`（2026/11/13 = D183，月份從 0 算）
