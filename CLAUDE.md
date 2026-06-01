# 雀星公告管理 — 程式碼索引

## 檔案結構

| 檔案 | 說明 | 行數 |
|------|------|------|
| `index.html` | HTML 結構 + JS 邏輯 | ~2707 行 |
| `style.css` | 所有 CSS 樣式 | ~420 行 |
| `deploy.bat` | 部署腳本（git add -A → commit → pull → push） | - |

---

## index.html 結構索引

### HTML 區塊（行 1–332）

| 行號 | 內容 |
|------|------|
| 1–10 | `<head>`、`<link rel="stylesheet" href="style.css">` |
| 11–22 | 密碼鎖畫面 `#lock-screen` |
| 24–145 | 主應用 `#main-app`（側邊欄 + 公告列表頁 + 圖片管理頁 + 設定頁） |
| 147–175 | Erolabs 公告彈窗 `#modal-erolabs` |
| 176–215 | 圖片庫 Modal `#modal-img-library` |
| 216–248 | 發送確認彈窗 `#modal-send` |
| 332 | `<script src="jszip">` |

### JS 模組

| 行號範圍 | 模組 | 主要內容 |
|----------|------|---------|
| 345–351 | **CONSTANTS** | `LANGS`、`LS_KEY_CFG`、`LS_KEY_SCH`、`IMG_ROOT` |
| 352–386 | **CONFIG** | `DEFAULTS`、`PAGE_PASSWORD_HASH`、`SECRET_TOKEN`、`N8N_WEBHOOK()`、`GITHUB_REPO()`、`GITHUB_BRANCH()`、`getCfg()` |
| 387–414 | **STORES** | `cfgStore`、`scheduleStore` |
| 415–438 | **UTILS** | `escHtml()`、`escUrl()`、`stopProp()`、`toast()` |
| 439–465 | **AUTH** | `checkPassword()`、`initApp()` |
| 466–478 | **STATE** | `allData`、`pastData`、`_activeTab`、`_pastLoaded`、`pendingAnn`、`_annMap`、`_modalAnn`、`_modalMessages` |
| 479–489 | **NAV** | `showPage()` |
| 498–751 | **SHEET** | `_sheetColMap`、`_parseSheetRows()`、`_resolveSheetColMap()`、`loadSheet()`、`loadPastSheet()` |
| 752–810 | **DATE UTILS** | `parseDate()`（含跨年修正）、`getStatus()`、`badgeClass()` |
| 811–846 | **SCHEDULE STORE** | `_getScheduleBadgesHtml()`、`deleteSchedule()` |
| 847–993 | **RENDER LIST** | `_filterAndSort()`、`_buildCardHtml()`、`renderList()`、`toggleCard()` |
| 994–1233 | **SEND MODAL** | `openSendModal()`、`renderModalLangs()`、`closeModal()`、`confirmSend()` |
| 1234–1481 | **SETTINGS** | `loadSettings()`、`toggleTestMode()`、`applyTestModeUI()`、`saveSettings()`、設定頁類型管理 |
| 1482–1642 | **EROLABS** | `buildErolabsDocs()`、`_doGenerateErolabs()`、`trimMaintContent()`、`textToRtf()` |
| 1643–1672 | **GITHUB API** | `_githubRequest()`、`_githubGetSha()` |
| 1673–1724 | **GITHUB IMAGE** | `_getImgUrl()`、`_githubPut()`、`_githubListImages()`、`clearAnnImg()` |
| 1725–1887 | **IMAGE LIBRARY** | `openImgLibrary()`、`_imgLibLoadFolder()`、`switchImgLangTab()`、`selectImgFromLibrary()`、`closeImgLibrary()` |
| 1888–2472 | **IMAGE MANAGER** | `imgMgrLoad()`、`imgMgrRefresh()`、上傳、刪除、重新命名資料夾等 |
| 2473–2669 | **GOOGLE OAUTH** | `gauthStart()`、`gauthGetAccessToken()`、`_resolveSheetName()`、`sheetsWriteImgUrl()` |
| 2670–2707 | **INIT** | `DOMContentLoaded`、`Object.assign(window, {...})` 全域暴露（行 2684） |

---

## style.css 結構索引

| 區塊 | 主要 class |
|------|-----------|
| CSS 變數 | `:root`（`--primary`、`--green` 等） |
| 側邊欄 | `.layout`、`.sidebar`、`.nav-btn` |
| 主內容 | `.main`、`.page`、`.page-title` |
| 卡片系統 | `.card`、`.stats`、`.stat` |
| 篩選列 | `.filters` |
| 公告卡片 | `.ann-card`、`.ann-top`、`.badge`、`.dot`、`.expand-arrow`、`.ann-content` |
| 語系標籤 | `.lang-row`、`.lang-check`、`.lang-ok`、`.lang-no`、`.lang-img-row` |
| 按鈕 | `.btn`、`.btn-primary`、`.btn-green`、`.btn-outline`、`.btn-sm`、`.btn-past-send` |
| Toast | `#toast` |
| 彈窗 | `.modal-bg`、`.modal`、`.field-label`、`.field-val` |
| 設定頁 | `.cfg-input`、`.cfg-toggle-*`、`.cfg-unsaved` |
| 密碼鎖 | `#lock-screen`、`.lock-box` |
| 排程標籤 | `.scheduled-badge`、`.scheduled-badge-del` |
| 圖片庫 | `.img-lib-tabs`、`.img-lib-lang-tabs`、`.img-lib-lang-btn`、`.img-lib-grid`、`.img-lib-thumb`、`.img-lib-upload-*` |
| 圖片管理 | `.imgmgr-*` |
| Erolabs | `.erolabs-opt-*` |
| 其他 | `.card-date-warn`、`.schedule-badges`、`#test-mode-banner` |

---

## 重要資料結構

### `ann` 物件（allData / pastData 元素）
```js
{
  _rowIndex,           // Sheet 實際列號（從 A 欄「列號」欄讀取）
  date, time, type,
  titleTW, contentTW,
  titleCN, contentCN,
  titleJP, contentJP,
  titleEN, contentEN,
  imgTW, imgCN, imgJP, imgEN,  // 圖片 URL，直接來自 Sheet，唯一來源
}
```

### `_sheetColMap`
```js
{
  dateLetter,   // 「日期」欄的欄位字母（e.g. 'G'）
  imgTW, imgCN, imgJP, imgEN,  // 各圖片欄的欄位字母
  sheetName,    // 工作表名稱（首次寫入時從 Sheets API 查詢並快取）
}
```

### `_annMap`
```js
Map<cardId, 公告物件>  // renderList 時存入，供 onclick 查詢
```

### `ann-schedules`（localStorage）
```js
{ '6/3': [{ sendDate, sendTime, typeName, createdAt }] }
```

---

## 設定頁欄位 → cfg 對應

| 設定頁欄位 | cfg key |
|-----------|---------|
| Google Sheet 網址 | 自動拆解為 `sheetId`、`sheetGid` |
| GitHub Repo | `githubRepo` |
| GitHub Branch | `githubBranch`（預設 `main`） |
| GitHub Token | `githubToken` |
| N8N Webhook URL | `n8nWebhookProd`（測試模式自動替換 `/webhook/` → `/webhook-test/`） |
| OAuth Client ID | `oauthClientId` |
| OAuth Client Secret | `oauthClientSecret` |

---

## 圖片流程

- **來源**：Sheet H~K 欄（TW/CN/JP/EN 圖片 URL）
- **讀取**：`_getImgUrl(annDate, lang, annType)` → 從 `allData`/`pastData` 找 ann，直接讀 `imgXX` 欄
- **寫入**：`selectImgFromLibrary()` → `sheetsWriteImgUrl()` → 成功後更新 in-memory `ann.imgXX`
- **localStorage cache 已移除**，不再有本地圖片快取

---

## 修改注意事項

1. **大範圍修改用 Python**：多個地方同時改，用 `python3 -c` 做字串替換，不要用多次 Edit
2. **改完驗證 JS 語法**：用 `awk '/^<script>/{found=1; next} found && /^<\/script>/{exit} found{print}' index.html | node --input-type=module`
3. **全域暴露** 在行 2691，新增函式記得加進去
4. **讀取特定模組**：用 `Read offset=<開始行-1> limit=<行數+10>` 精準讀取，不要讀整份
5. **GITHUB_REPO / GITHUB_BRANCH** 現在是函式（`GITHUB_REPO()`、`GITHUB_BRANCH()`），呼叫時要加 `()`
6. **_rowIndex** 從 Sheet A 欄「列號」欄讀取（`=ROW()`），寫入時直接用，不需要 +1
