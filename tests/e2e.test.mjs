// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E 測試 - 雀星公告管理網站
 *
 * 執行前準備：
 *   1. npm install -D @playwright/test
 *   2. npx playwright install chromium
 *   3. 在此檔案填入正確密碼（搜尋 YOUR_PASSWORD_HERE）
 *   4. 在另一個終端機跑：npx serve . -p 3000
 *   5. 執行：npx playwright test tests/e2e.test.mjs --headed
 */

// ── 填入你的密碼 ──────────────────────────────────────────────
const PASSWORD = 'YOUR_PASSWORD_HERE';

// ── Mock 資料 ─────────────────────────────────────────────────

/** Google Sheets gviz API 回傳格式 */
const MOCK_SHEET_RESPONSE = `/*O_o*/
google.visualization.Query.setResponse({"version":"0.6","reqId":"0","status":"ok","sig":"123","table":{
  "cols":[
    {"id":"A","label":"日期","type":"date"},
    {"id":"B","label":"時間","type":"timeofday"},
    {"id":"C","label":"公告類型","type":"string"},
    {"id":"D","label":"繁中標題","type":"string"},
    {"id":"E","label":"繁中內容","type":"string"},
    {"id":"F","label":"簡中標題","type":"string"},
    {"id":"G","label":"簡中內容","type":"string"},
    {"id":"H","label":"日文標題","type":"string"},
    {"id":"I","label":"日文內容","type":"string"},
    {"id":"J","label":"英文標題","type":"string"},
    {"id":"K","label":"英文內容","type":"string"}
  ],
  "rows":[
    {"c":[
      {"v":"Date(2026,5,20)"},
      {"v":"Date(1899,11,30,17,0,0)"},
      {"v":"活動公告"},
      {"v":"測試活動公告標題"},
      {"v":"測試活動公告內容\\n第二行"},
      {"v":"测试活动公告标题"},
      {"v":"测试活动公告内容"},
      {"v":"テストタイトル"},
      {"v":"テスト内容"},
      {"v":"Test Event Title"},
      {"v":"Test Event Content"}
    ]},
    {"c":[
      {"v":"Date(2026,5,25)"},
      {"v":"Date(1899,11,30,9,0,0)"},
      {"v":"維護預告"},
      {"v":"維護預告標題"},
      {"v":"維護時間\\n2026年6月25日 09:00 ～ 12:00\\n【注意事項】\\n注意事項內容"},
      {"v":"维护预告标题"},
      {"v":"维护预告内容"},
      {"v":"メンテナンス予告タイトル"},
      {"v":"メンテナンス予告内容"},
      {"v":"Maintenance Notice Title"},
      {"v":"Maintenance Notice Content"}
    ]},
    {"c":[
      {"v":"Date(2026,4,1)"},
      {"v":null},
      {"v":"維護完成"},
      {"v":"維護完成標題"},
      {"v":"維護完成內容"},
      {"v":"维护完成标题"},
      {"v":"维护完成内容"},
      {"v":"メンテナンス完了タイトル"},
      {"v":"メンテナンス完了内容"},
      {"v":"Maintenance Complete Title"},
      {"v":"Maintenance Complete Content"}
    ]}
  ]
}});`;

/** GitHub images/index.json */
const MOCK_IMG_CACHE = JSON.stringify({
  '6/20': 'https://raw.githubusercontent.com/windoll/game-announcements/main/images/活動/0620/test.png',
});

/** n8n webhook 回傳 */
const MOCK_N8N_RESPONSE = JSON.stringify({
  ok: true,
  scheduled: '2026-06-20T09:00:00.000Z',
  scheduleId: '1234567890',
});

// ── 共用 setup：mock 外部 API ─────────────────────────────────

async function setupMocks(page) {
  // Mock Google Sheets
  await page.route('**/docs.google.com/spreadsheets/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: MOCK_SHEET_RESPONSE,
    });
  });

  // Mock GitHub raw（images/index.json）
  await page.route('**/raw.githubusercontent.com/**/images/index.json**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: MOCK_IMG_CACHE,
    });
  });

  // Mock GitHub API（圖片庫列表）
  await page.route('**/api.github.com/repos/**/contents/images/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { name: 'test.png', type: 'file' },
      ]),
    });
  });

  // Mock n8n webhook
  await page.route('**/n8n.cloud/webhook/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: MOCK_N8N_RESPONSE,
    });
  });
}

/** 解鎖頁面 */
async function unlock(page) {
  await page.goto('http://localhost:3000');
  await page.fill('#lock-input', PASSWORD);
  await page.click('button:has-text("進入")');
  await expect(page.locator('#main-app')).toBeVisible();
}

/** 解鎖並載入公告 */
async function unlockAndLoad(page) {
  await unlock(page);
  await page.click('button:has-text("載入公告")');
  await expect(page.locator('.ann-card').first()).toBeVisible({ timeout: 5000 });
}

// ══ 測試：密碼鎖 ══════════════════════════════════════════════

test.describe('密碼鎖', () => {
  test('錯誤密碼顯示錯誤訊息', async ({ page }) => {
    await setupMocks(page);
    await page.goto('http://localhost:3000');
    await page.fill('#lock-input', 'wrongpassword');
    await page.click('button:has-text("進入")');
    await expect(page.locator('#lock-error')).toHaveText('密碼錯誤，請再試一次');
    await expect(page.locator('#lock-screen')).toBeVisible();
  });

  test('正確密碼進入主畫面', async ({ page }) => {
    await setupMocks(page);
    await unlock(page);
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('#page-list')).toBeVisible();
  });

  test('Enter 鍵觸發解鎖', async ({ page }) => {
    await setupMocks(page);
    await page.goto('http://localhost:3000');
    await page.fill('#lock-input', PASSWORD);
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-app')).toBeVisible();
  });

  test('解鎖後 session 保留，重新整理不需再輸入密碼', async ({ page }) => {
    await setupMocks(page);
    await unlock(page);
    await page.reload();
    await expect(page.locator('#main-app')).toBeVisible();
    await expect(page.locator('#lock-screen')).toBeHidden();
  });
});

// ══ 測試：公告列表 ═════════════════════════════════════════════

test.describe('公告列表', () => {
  test('點「載入公告」顯示 loading 狀態', async ({ page }) => {
    await setupMocks(page);
    await unlock(page);
    // 延遲回應，讓 loading 狀態可以被捕捉
    await page.route('**/docs.google.com/spreadsheets/**', async route => {
      await new Promise(r => setTimeout(r, 300));
      route.fulfill({ status: 200, contentType: 'text/plain', body: MOCK_SHEET_RESPONSE });
    });
    await page.click('button:has-text("載入公告")');
    await expect(page.locator('.loading')).toBeVisible();
  });

  test('載入後顯示公告卡片', async ({ page }) => {
    await setupMocks(page);
    await unlockAndLoad(page);
    const cards = page.locator('.ann-card');
    await expect(cards).toHaveCount(3);
  });

  test('統計數字正確更新', async ({ page }) => {
    await setupMocks(page);
    await unlockAndLoad(page);
    // 全部公告 3 筆
    await expect(page.locator('#s-total')).toHaveText('3');
  });

  test('Sheet 讀取失敗顯示錯誤訊息', async ({ page }) => {
    await setupMocks(page);
    await unlock(page);
    await page.route('**/docs.google.com/spreadsheets/**', route => {
      route.fulfill({ status: 403, body: 'Forbidden' });
    });
    await page.click('button:has-text("載入公告")');
    await expect(page.locator('#list-area')).toContainText('無法讀取試算表');
  });

  test('快速連點重新整理不會重複請求', async ({ page }) => {
    await setupMocks(page);
    await unlock(page);
    let requestCount = 0;
    await page.route('**/docs.google.com/spreadsheets/**', async route => {
      requestCount++;
      await new Promise(r => setTimeout(r, 200));
      route.fulfill({ status: 200, contentType: 'text/plain', body: MOCK_SHEET_RESPONSE });
    });
    // 快速連點三次
    await page.click('button:has-text("載入公告")');
    await page.click('button:has-text("↻ 重新整理")');
    await page.click('button:has-text("↻ 重新整理")');
    await page.waitForTimeout(500);
    // 只應該發出 1 次請求（防重複點擊）
    expect(requestCount).toBe(1);
  });
});

// ══ 測試：篩選功能 ═════════════════════════════════════════════

test.describe('篩選功能', () => {
  test('搜尋關鍵字過濾公告', async ({ page }) => {
    await setupMocks(page);
    await unlockAndLoad(page);
    await page.fill('#q', '活動');
    await expect(page.locator('.ann-card')).toHaveCount(1);
    await expect(page.locator('.ann-card').first()).toContainText('測試活動公告標題');
  });

  test('搜尋無結果顯示空狀態', async ({ page }) => {
    await setupMocks(page);
    await unlockAndLoad(page);
    await page.fill('#q', '不存在的關鍵字xyz');
    await expect(page.locator('.empty')).toBeVisible();
  });

  test('按公告類型篩選', async ({ page }) => {
    await setupMocks(page);
    await unlockAndLoad(page);
    await page.selectOption('#tf', '維護預告');
    await expect(page.locator('.ann-card')).toHaveCount(1);
    await expect(page.locator('.ann-card').first()).toContainText('維護預告');
  });

  test('清除篩選顯示全部', async ({ page }) => {
    await setupMocks(page);
    await unlockAndLoad(page);
    await page.fill('#q', '活動');
    await expect(page.locator('.ann-card')).toHaveCount(1);
    await page.fill('#q', '');
    await expect(page.locator('.ann-card')).toHaveCount(3);
  });
});

// ══ 測試：公告卡片展開 ═════════════════════════════════════════

test.describe('公告卡片', () => {
  test('點擊卡片展開內容', async ({ page }) => {
    await setupMocks(page);
    await unlockAndLoad(page);
    const firstCard = page.locator('.ann-card').first();
    await expect(firstCard.locator('.ann-content')).toBeHidden();
    await firstCard.click();
    await expect(firstCard.locator('.ann-content')).toBeVisible();
  });

  test('再次點擊收合內容', async ({ page }) => {
    await setupMocks(page);
    await unlockAndLoad(page);
    const firstCard = page.locator('.ann-card').first();
    await firstCard.click();
    await expect(firstCard.locator('.ann-content')).toBeVisible();
    await firstCard.click();
    await expect(firstCard.locator('.ann-content')).toBeHidden();
  });

  test('四語系標籤正確顯示', async ({ page }) => {
    await setupMocks(page);
    await unlockAndLoad(page);
    const firstCard = page.locator('.ann-card').first();
    await expect(firstCard.locator('.lang-ok')).toHaveCount(4); // TW CN JP EN 都有
  });

  test('維護預告日期不符顯示警告', async ({ page }) => {
    await setupMocks(page);
    // 使用日期不符的資料：Sheet 日期 6/20，但內文寫 7/25
    const mismatchSheet = MOCK_SHEET_RESPONSE.replace(
      '"維護預告標題"',
      '"維護預告標題"'
    ).replace(
      'Date(2026,5,25)', // 6/25
      'Date(2026,5,20)'  // 改成 6/20，但內文還是 6/25
    );
    await page.route('**/docs.google.com/spreadsheets/**', route => {
      route.fulfill({ status: 200, contentType: 'text/plain', body: mismatchSheet });
    });
    await unlock(page);
    await page.click('button:has-text("載入公告")');
    await expect(page.locator('.card-date-warn').first()).toBeVisible({ timeout: 5000 });
  });
});

// ══ 測試：發送排程 ═════════════════════════════════════════════

test.describe('發送排程', () => {
  test('點「發送到 Discord」開啟 Modal', async ({ page }) => {
    await setupMocks(page);
    await unlockAndLoad(page);
    // 找未來的活動公告（有發送按鈕）
    await page.locator('.btn-green').first().click();
    await expect(page.locator('#modal-send')).toHaveClass(/open/);
  });

  test('Modal 顯示公告標題', async ({ page }) => {
    await setupMocks(page);
    await unlockAndLoad(page);
    await page.locator('.btn-green').first().click();
    await expect(page.locator('#modal-thread')).not.toBeEmpty();
  });

  test('選擇過去時間顯示防呆提示', async ({ page }) => {
    await setupMocks(page);
    await unlockAndLoad(page);
    await page.locator('.btn-green').first().click();
    // 選第一個日期選項（今天），設定過去的時間（00:00）
    await page.selectOption('#modal-time-h', '00');
    await page.selectOption('#modal-time-m', '00');
    await page.click('#modal-confirm-btn');
    // 應該顯示 toast 警告
    await expect(page.locator('#toast')).toContainText('發送時間已過');
  });

  test('取消關閉 Modal', async ({ page }) => {
    await setupMocks(page);
    await unlockAndLoad(page);
    await page.locator('.btn-green').first().click();
    await expect(page.locator('#modal-send')).toHaveClass(/open/);
    await page.click('button:has-text("取消")');
    await expect(page.locator('#modal-send')).not.toHaveClass(/open/);
  });
});

// ══ 測試：設定頁 ═══════════════════════════════════════════════

test.describe('設定頁', () => {
  test('切換到設定頁', async ({ page }) => {
    await setupMocks(page);
    await unlock(page);
    await page.click('button:has-text("⚙️ 設定")');
    await expect(page.locator('#page-settings')).toHaveClass(/active/);
  });

  test('儲存設定顯示成功 toast', async ({ page }) => {
    await setupMocks(page);
    await unlock(page);
    await page.click('button:has-text("⚙️ 設定")');
    await page.fill('#cfg-project-name', '測試專案');
    await page.click('button:has-text("儲存設定")');
    await expect(page.locator('#toast')).toContainText('設定已儲存');
  });

  test('儲存後側邊欄名稱更新', async ({ page }) => {
    await setupMocks(page);
    await unlock(page);
    await page.click('button:has-text("⚙️ 設定")');
    await page.fill('#cfg-project-name', '雀星測試');
    await page.click('button:has-text("儲存設定")');
    await expect(page.locator('.project-name')).toHaveText('雀星測試');
  });

  test('開啟測試模式切換配色', async ({ page }) => {
    await setupMocks(page);
    await unlock(page);
    await page.click('button:has-text("⚙️ 設定")');
    await page.click('#test-mode-track');
    // 側邊欄應變成棕色（測試模式）
    await expect(page.locator('.sidebar')).toHaveCSS('background', /rgb\(120, 53, 15\)|#78350f/);
    await expect(page.locator('#test-mode-banner')).toBeVisible();
  });

  test('匯出設定觸發下載', async ({ page }) => {
    await setupMocks(page);
    await unlock(page);
    await page.click('button:has-text("⚙️ 設定")');
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("匯出設定")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('雀星公告設定.json');
  });
});

// ══ 測試：同步圖片按鈕 ═════════════════════════════════════════

test.describe('同步圖片', () => {
  test('載入公告前按鈕是 disabled', async ({ page }) => {
    await setupMocks(page);
    await unlock(page);
    await expect(page.locator('#btn-sync-img')).toBeDisabled();
  });

  test('載入公告後按鈕變為可用', async ({ page }) => {
    await setupMocks(page);
    await unlockAndLoad(page);
    await expect(page.locator('#btn-sync-img')).toBeEnabled();
  });

  test('點同步圖片顯示成功 toast', async ({ page }) => {
    await setupMocks(page);
    await unlockAndLoad(page);
    await page.click('#btn-sync-img');
    await expect(page.locator('#toast')).toContainText('圖片已同步');
  });
});
