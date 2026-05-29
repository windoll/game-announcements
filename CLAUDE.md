# 雀星公告管理 — 程式碼索引

## 檔案結構

| 檔案 | 說明 | 行數 |
|------|------|------|
| `index.html` | HTML 結構 + JS 邏輯 | ~1808 行 |
| `style.css` | 所有 CSS 樣式 | ~420 行 |
| `deploy.bat` | 部署腳本（git add -A → commit → pull → push） | - |

---

## index.html 結構索引

### HTML 區塊（行 1–247）

| 行號 | 內容 |
|------|------|
| 1–10 | `<head>`、`<link rel="stylesheet" href="style.css">` |
| 11–22 | 密碼鎖畫面 `#lock-screen` |
| 24–145 | 主應用 `#main-app`（側邊欄 + 公告列表頁 + 設定頁） |
| 147–175 | Erolabs 公告彈窗 `#modal-erolabs` |
| 176–213 | 圖片庫 Modal `#modal-img-library` |
| 214–246 | 發送確認彈窗 `#modal-send` |
| 247 | `<script src="jszip">` |

### JS 模組（行 248–1797）

| 行號範圍 | 模組 | 主要內容 |
|----------|------|---------|
| 252–280 | **CONFIG** | `DEFAULTS`、`PAGE_PASSWORD_HASH`、`SECRET_TOKEN`、`N8N_WEBHOOK`、`getCfg()` |
| 281–302 | **UTILS** | `escHtml()`、`escUrl()`、`stopProp()`、`toast()` |
| 303–330 | **AUTH** | `checkPassword()`、`initApp()` |
| 331–340 | **STATE** | `allData`、`pendingAnn`、`_annMap`、`_modalAnn`、`_modalMessages` |
| 341–350 | **NAV** | `showPage()` |
| 351–439 | **SHEET** | `loadSheet()`、Google Sheets gviz 解析 |
| 440–478 | **DATE UTILS** | `parseDate()`（含跨年修正）、`getStatus()`、`badgeClass()` |
| 479–526 | **SCHEDULE STORE** | `_getSchedules()`、`_saveSchedule()`、`_getScheduleBadgesHtml()`、`deleteSchedule()` |
| 527–701 | **RENDER LIST** | `renderList()`、`toggleCard()` |
| 702–952 | **SEND MODAL** | `openSendModal()`、`renderModalLangs()`、`closeModal()`、`confirmSend()` |
| 953–1180 | **SETTINGS** | `loadSettings()`、`toggleTestMode()`、`applyTestModeUI()`、`saveSettings()`、設定頁類型管理 |
| 1181–1340 | **EROLABS** | `buildErolabsDocs()`、`_doGenerateErolabs()`、`trimMaintContent()`、`textToRtf()` |
| 1341–1505 | **GITHUB IMAGE** | `_imgCache`、`_getImgUrl()`、`_setImgUrl()`、`_saveImgCache()`、`_syncImgCacheToGitHub()`、`_loadImgCacheFromGitHub()`、`_githubPut()`、`_githubListImages()`、`uploadImageToGitHub()` |
| 1506–1769 | **IMAGE LIBRARY** | `openImgLibrary()`、`switchImgLangTab()`、`switchImgLibTab()`、`selectImgFromLibrary()`、`applySelectedImg()`、`previewUploadFile()`、`confirmUploadImg()`、`closeImgLibrary()` |
| 1770–1780 | **IMG CACHE SYNC** | `syncImgCache()` |
| 1781–1797 | **INIT** | `DOMContentLoaded`、`Object.assign(window, {...})` 全域暴露 |

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
| 公告卡片圖片列 | `.ann-img-row`、`.ann-img-multi`、`.ann-img-lang-row`、`.ann-img-lang-code` |
| 語系標籤 | `.lang-row`、`.lang-check`、`.lang-ok`、`.lang-no`、`.lang-img-row` |
| 按鈕 | `.btn`、`.btn-primary`、`.btn-green`、`.btn-outline`、`.btn-sm`、`.btn-past-send` |
| Toast | `#toast` |
| 彈窗 | `.modal-bg`、`.modal`、`.field-label`、`.field-val` |
| 設定頁 | `.cfg-input`、`.cfg-toggle-*`、`.cfg-unsaved` |
| 密碼鎖 | `#lock-screen`、`.lock-box` |
| 排程標籤 | `.scheduled-badge`、`.scheduled-badge-del` |
| 圖片庫 | `.img-lib-tabs`、`.img-lib-lang-tabs`、`.img-lib-lang-btn`、`.img-lib-grid`、`.img-lib-thumb`、`.img-lib-upload-*` |
| Erolabs | `.erolabs-opt-*` |
| 其他 | `.card-date-warn`、`.schedule-badges`、`#test-mode-banner` |

---

## 重要資料結構

### `_imgCache`
```js
// 新格式（多語系）
{ '6/3': { ALL: url, TW: url, CN: url, JP: url, EN: url } }
// 舊格式（相容）
{ '6/3': url }
// 讀取用 _getImgUrl(annDate, lang)
// 寫入用 _setImgUrl(annDate, lang, url)
```

### `_imgLibLang`
圖片庫目前選中的語系（`'ALL'`、`'TW'`、`'CN'`、`'JP'`、`'EN'`）

### `_annMap`
```js
Map<cardId, 公告物件>  // renderList 時存入，供 onclick 查詢
```

### `ann-schedules`（localStorage）
```js
{ '6/3': [{ sendDate, sendTime, typeName, createdAt }] }
```

### `ann-img-cache`（localStorage）
`_imgCache` 的持久化存儲

### `ann-img-cache-ts`（localStorage）
圖片快取時間戳，當天有效

---

## 修改注意事項

1. **大範圍修改用 Python**：多個地方同時改，用 `python3 -c` 做字串替換，不要用多次 Edit（容易截斷）
2. **改完驗證 JS 語法**：用 `node --input-type=module` 執行語法檢查
3. **safeDate/safeType/safeMmdd** 必須在 `mkContent` 定義之前宣告（目前在行 1003-1011）
4. **_imgCache** 讀取一律用 `_getImgUrl()`，寫入用 `_setImgUrl()`，不要直接操作
5. **全域暴露** 在行 1785，新增函式記得加進去
6. **讀取特定模組**：用 `Read offset=<開始行-1> limit=<結束行-開始行+10>` 精準讀取，不要讀整份
