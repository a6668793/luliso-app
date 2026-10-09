# LULISO 驗證紀錄

日期：2026-10-09（Asia/Taipei）。只記錄實際完成的檢查，不將程式存在等同功能驗收。

## 最新交付狀態

- GitHub：https://github.com/a6668793/luliso-app
- 正式網站：https://luliso-app.vercel.app；Vercel 最新部署狀態 READY。
- Supabase 專案 `mzremevbfiwwmxzoceqj` 已套用 migration；SQL 查詢確認 8 個資料表 RLS=true，`pet-media` bucket public=false。
- 正式站已保存 Supabase URL、公開連線憑證、伺服器管理憑證、OpenAI 金鑰與 APP_ORIGIN；秘密值未提交 GitHub。
- Supabase Auth 已設定正式 Site URL 與 `/login`、`/settings` 回跳白名單。
- 使用者要求先不測試以保留額度：停止新的功能實測與 AI 請求，登入、跨帳號隔離與六項 AI 端到端驗收仍待執行。
- Google Drive 未授權；SMTP 尚未配置，公開訪客的登入寄信仍需完成寄信服務設定。

## 已執行

| 檢查 | 結果 |
|---|---|
| TypeScript | 通過 |
| ESLint | 通過 |
| Vitest | 16/16 通過 |
| Vite production build | 通過；初始 bundle 約 150 KB gzip |
| 私人 API 未登入防護 | pets/media/analyses/messages/sessions/chat/upload/backup/account 均回 401 |
| AI consent / 多寵數量 / 媒體必填 / 格式及容量 | 輸入驗證測試通過 |
| status 機密隔離 | 測試金鑰不出现在公開回應 |
| 真實 OpenAI 請求 | 未成功：HTTP 429，code `credit_balance_exhausted`，需補充 API 額度 |
| 本機 API status | HTTP 200，database=false / ai=true / drive=disconnected |
| 桌面首頁 | 已於真實瀏覽器開啟並目視檢查 |
| 手機 viewport 390×844 | 六功能入口與底部分頁存在；可用內容寬 375px（扣除捲軸），scrollWidth=clientWidth，無橫向溢出 |
| 百科互動 | 點選雙貓相處後文章從 7 篇變 1 篇，無橫向溢出 |
| 未連線聊天入口 | 明確顯示未連線狀態，沒有假對話 |

## 六大功能

| 功能 | 實作 | 端到端實測 |
|---|---|---|
| F01 個性檔案 | 毛孩 CRUD、問卷、三種照片、個性生成、人設背景 | 等待 Supabase / AI 額度 |
| F02 情緒行為 | 相機、照片、5–15 秒影片、4 個影格、結構化結果 | 等待 Supabase / AI 額度與真實媒體 |
| F03 聲音 | 麥克風、聲波、WAV 轉換、audio 模型分析 | 等待設備權限、Supabase / AI 額度 |
| F04 心聲 | 情境與照片、第一人稱模擬、明確標示 | 等待 Supabase / AI 額度 |
| F05 問答 | 多輪、獨立毛孩/對話紀錄、新對話 | 等待 Supabase / AI 額度 |
| F06 相處學 | 7 篇附來源文章、分類、多寵 AI 分析 | 百科已實作，AI 等待 Supabase / 額度 |

## 尚未驗證

真實手機硬體相機/麥克風、PWA 安裝、跨帳號 RLS 整合流程、登入信件、Drive OAuth/寫入/刪除、HTTPS 網站端到端流程與路由重新整理。Supabase migration 與 HTTPS 部署已完成，不能視為上述流程已通過驗收。

Google Drive：未連線；不會將公開資料夾連結當成寫入權限。

