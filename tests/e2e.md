# E2E 測試說明

## 環境需求

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## 執行方式

```bash
npx playwright test tests/e2e.test.mjs
```

## 測試項目（待實作）

1. **密碼解鎖**
   - 輸入錯誤密碼 → 顯示錯誤訊息
   - 輸入正確密碼 → 進入主畫面

2. **載入公告**
   - 點「載入公告」→ 顯示 loading 狀態
   - Sheet 回應後 → 顯示公告列表
   - Sheet 失敗 → 顯示錯誤訊息

3. **篩選功能**
   - 輸入搜尋關鍵字 → 列表即時過濾
   - 選擇公告類型 → 只顯示對應類型
   - 選擇時間範圍 → 只顯示對應時間

4. **發送排程**
   - 點「發送到 Discord」→ 開啟 Modal
   - 選擇過去時間 → 顯示防呆錯誤
   - 選擇未來時間並確認 → 顯示排程 badge

5. **圖片功能**
   - 點「圖片庫」→ 開啟 Modal
   - 選擇圖片 → 更新卡片預覽

## Mock 說明

E2E 測試需要 mock 以下外部請求：
- Google Sheets gviz API
- GitHub raw URL（index.json）
- GitHub API（圖片庫列表）
- n8n webhook
