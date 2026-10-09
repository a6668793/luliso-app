# 嚕哩嚕嗦 luliso.

毛孩有好多心事想說。A LITTLE LANGUAGE OF LOVE.

React + TypeScript + Vite 手機優先 PWA。伺服器 API 使用 Supabase Auth / PostgreSQL / 私有 Storage 與 OpenAI 多模態分析。這個版本不含假 AI 或假儲存 fallback；未連線時會明确顯示服務狀態。

## 目前交付狀態

網站已部署於 https://luliso-app.vercel.app，Supabase 資料表與正式站連線設定已完成。使用者要求暫停功能實測以保留額度；尚未通過完整公開 Beta 驗收。公開登入的 SMTP 與 Google Drive 授權仍待設定。請見 [QA.md](QA.md)。

- 六項功能：行為問卷個性故事、照片與影片影格分析、音訊分析、擬人化心聲、依寵物隔離的多輪聊天、多寵分析與附來源百科。
- 電子郵件無密碼登入、多寵 CRUD、分析歷史、媒體管理、帳號刪除。
- 390px 手機版、桌面版、PWA manifest / 圖示、隱私友善離線頁、reduced-motion。
- 每帳號每日 10 次 AI 請求（Asia/Taipei），最多 100 MB / 200 檔媒體、12 隻寵物。
- AI 不會將推測當成真正動物語言翻譯。影片以 4 張離散影格分析，非完整動作或聲音辨識。
- Google Drive 明確 opt-in、OAuth refresh token、資料夾權限檢查及批次備份；未授權預設中斷。系統災難復原備份排程尚未建置。

## 開發

Node.js 24，pnpm 11.25.0。

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
```

本機網站 `http://localhost:5173`，同一程序提供 Vite 與 `/api/index`。`pnpm check` 包含 TypeScript、ESLint、單元/安全測試及 build。`pnpm test:ai` 會送出少量合成文字情境到真實 OpenAI，可能產生費用；不是端到端驗收。

## 安全設定

依 `.env.example` 設定伺服器環境變數。所有密鑰只存 `.env.local` 與 Vercel 敏感環境變數，不能加 `VITE_` 前綴、寫進程式或提交版本控制。Supabase 公開 URL 與 publishable/anon key 透過 status API 提供登入客戶端；service role key 永遠留在後端。

1. 在 Supabase 建立專案，執行 `supabase/migrations/001_luliso.sql`。SQL 建立資料表、RLS、私有 bucket、原子額度與儲存容量限制。
2. 將 `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY` 設定到本機及 Vercel，勿貼到對話。
3. Supabase Auth Site URL 與 redirect allowlist 設為已部署 HTTPS 網址；開發時另加 localhost。公開測試需配置可靠 SMTP、註冊防濫用及供應商費用限制。
4. 設 `OPENAI_API_KEY`、`OPENAI_MODEL`（預設 gpt-4.1-mini）、`OPENAI_AUDIO_MODEL`（預設 gpt-audio-1.5）。帳號需有 API 可用額度。
5. 設 `APP_ORIGIN` 為部署來源，防止跨來源寫入。正式預覽應各自設定相符來源。

## GitHub / Vercel

Repo: https://github.com/a6668793/luliso-app

Vercel 專案名稱 `luliso-app`，Framework Vite，Node 24，build `pnpm build`，output `dist`。`api/index.ts` 為 Node serverless endpoint；SPA rewrites 保留 `/api/` 與靜態檔案。CI 不接觸正式密鑰。部署保護需依公開 Beta 需求設定，不要公開任何私有檔案。

## Drive 備份

指定 folder `1WHtGe7QoVZkNjy6zv0LKrHc-w401eD_Z`。分享連結不等於寫入授權。管理員必須用 Google 官方 OAuth 流程取得伺服器 refresh token，設定 `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`GOOGLE_REFRESH_TOKEN`，並確認資料夾僅與必要管理員分享。

每次備份會檢查真實寫入能力與 permissions；公開或網域分享、權限不可確認時 fail closed。使用者須另行勾選同意；每批最多 2 筆，畫面顯示剩餘筆數。帳號與媒體刪除會先刪除已知 Drive 副本，失敗就回報並保留可重試資訊。未實作 OAuth 管理員 UI、排程同步或資料庫全量備份。

## 安全設計與限制

每個私人 API 都透過 `auth.getUser(token)` 驗證，並以伺服器確認 user_id。資料表僅允許登入者讀取自己的資料，client 不可直接寫入。媒體透過單一路徑的 signed upload、檔案大小與 magic bytes 檢查後標成 ready；下載連結 5 分鐘有效。AI 資料不輸出到日誌，OpenAI `store:false` 不等於供應商零保留。

已知待強化：影片/音訊伺服器端時長探測、跨請求聊天排序鎖、上傳失敗自動清除、Drive 自動同步/備份並發鎖、寄信與多帳號濫用防護、完整瀏覽器端與 RLS 整合測試。公開給大量用戶前應完成上述驗證及營運聯絡資訊。

## 知識來源

- [Cats Protection：介紹新貓](https://www.cats.org.uk/help-and-advice/cat-behaviour/introducing-cats)
- [RSPCA：狗狗陪伴](https://www.rspca.org.uk/adviceandwelfare/pets/dogs/company)
- [RSPCA：貓咪與其他寵物](https://www.rspca.org.uk/adviceandwelfare/pets/cats/company)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [OpenAI audio inputs](https://developers.openai.com/api/docs/guides/audio-chat-completions)

