/**
 * 單元測試 - 雀星公告管理網站
 * 執行方式：node tests/unit.test.mjs
 *
 * 測試範圍：
 *   - parseDate        日期解析（含跨年）
 *   - getStatus        公告狀態判斷
 *   - badgeClass       badge 樣式對應
 *   - trimMaintContent 維護預告截斷邏輯
 *   - escHtml          HTML 跳脫
 *   - escUrl           URL 安全驗證
 *   - _imgCacheIsValid 圖片快取有效期
 *   - _saveSchedule    排程去重邏輯
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ══ 從 index.html 抽出的純函式（複製後獨立執行）══════════════════

function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escUrl(s) {
  const str = String(s || '');
  return /^https?:\/\//i.test(str) ? escHtml(str) : '';
}

function parseDate(d, t) {
  if (!d) return null;
  const parts = String(d).split('/').map(Number).filter(Boolean);
  if (parts.length < 2) return null;
  const [m, day] = parts.length === 2 ? parts : [parts[1], parts[2]];
  const hm = String(t || '').match(/(\d{1,2}):(\d{2})/);
  const now = new Date();
  let year = now.getFullYear();
  const monthDiff = m - (now.getMonth() + 1);
  if (monthDiff > 6)  year -= 1;
  if (monthDiff < -6) year += 1;
  return new Date(year, m - 1, day, hm ? +hm[1] : 0, hm ? +hm[2] : 0);
}

function getStatus(dt) {
  if (!dt || isNaN(dt)) return 'past';
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cday  = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  if (+cday === +today) return 'today';
  return dt > now ? 'upcoming' : 'past';
}

function badgeClass(type) {
  if (!type) return 'badge-other';
  if (type.includes('完成')) return 'badge-done';
  if (type.includes('預告') || type.includes('維護')) return 'badge-notice';
  if (type.includes('活動')) return 'badge-event';
  return 'badge-other';
}

function trimMaintContent(text, lang) {
  if (!text) return '';
  const cutKeywords = { TW: '【注意事項】', CN: '【注意事项】', JP: '【ご注意】', EN: '[Important Notes]' };
  const keyword = cutKeywords[lang] || '';
  if (!keyword) return text;
  const idx = text.indexOf(keyword);
  if (idx === -1) return text;
  return text.substring(0, idx).trimEnd();
}

function _imgCacheIsValid(ts, now = new Date()) {
  if (!ts) return false;
  const saved = new Date(parseInt(ts, 10));
  return saved.getFullYear() === now.getFullYear() &&
         saved.getMonth()    === now.getMonth()    &&
         saved.getDate()     === now.getDate();
}

// 模擬 _saveSchedule 的去重邏輯
function _saveSchedule(records, sendDate, sendTime, typeName) {
  const dup = records.find(r => r.sendDate === sendDate && r.sendTime === sendTime);
  if (!dup) records.push({ sendDate, sendTime, typeName });
  return records;
}

// ══ 測試開始 ═══════════════════════════════════════════════════

describe('escHtml', () => {
  test('正常字串不變', () => {
    assert.equal(escHtml('hello'), 'hello');
  });
  test('& 轉換', () => {
    assert.equal(escHtml('a & b'), 'a &amp; b');
  });
  test('< > 轉換', () => {
    assert.equal(escHtml('<div>'), '&lt;div&gt;');
  });
  test('" 轉換', () => {
    assert.equal(escHtml('"test"'), '&quot;test&quot;');
  });
  test('null/undefined 不爆炸', () => {
    assert.equal(escHtml(null), '');
    assert.equal(escHtml(undefined), '');
  });
});

describe('escUrl', () => {
  test('https URL 通過', () => {
    assert.equal(escUrl('https://example.com'), 'https://example.com');
  });
  test('http URL 通過', () => {
    assert.equal(escUrl('http://example.com'), 'http://example.com');
  });
  test('javascript: 被攔截', () => {
    assert.equal(escUrl('javascript:alert(1)'), '');
  });
  test('空字串回傳空', () => {
    assert.equal(escUrl(''), '');
  });
  test('含特殊字元的 URL 被 escHtml 處理', () => {
    assert.equal(escUrl('https://example.com?a=1&b=2'), 'https://example.com?a=1&amp;b=2');
  });
  test('data: URI 被攔截', () => {
    assert.equal(escUrl('data:text/html,<h1>xss</h1>'), '');
  });
});

describe('parseDate', () => {
  test('正常日期解析', () => {
    const d = parseDate('6/15', '10:00');
    assert.equal(d.getMonth(), 5);   // 6月 (0-based)
    assert.equal(d.getDate(), 15);
    assert.equal(d.getHours(), 10);
    assert.equal(d.getMinutes(), 0);
  });
  test('無時間時預設 00:00', () => {
    const d = parseDate('6/15', '');
    assert.equal(d.getHours(), 0);
    assert.equal(d.getMinutes(), 0);
  });
  test('空值回傳 null', () => {
    assert.equal(parseDate('', ''), null);
    assert.equal(parseDate(null, ''), null);
  });
  test('格式不正確回傳 null', () => {
    assert.equal(parseDate('abc', ''), null);
  });
  test('跨年修正：現在 1 月，公告 12 月 → 屬於去年', () => {
    // 模擬現在是 1 月
    const origDate = Date;
    const mockNow = new Date(2026, 0, 15); // 2026-01-15
    global.Date = class extends origDate {
      constructor(...args) { return args.length ? new origDate(...args) : mockNow; }
      static now() { return mockNow.getTime(); }
    };
    // 覆寫測試用的 parseDate（使用 mock Date）
    function parseDateMock(d, t) {
      if (!d) return null;
      const parts = String(d).split('/').map(Number).filter(Boolean);
      if (parts.length < 2) return null;
      const [m, day] = parts.length === 2 ? parts : [parts[1], parts[2]];
      const hm = String(t || '').match(/(\d{1,2}):(\d{2})/);
      const now = new origDate(2026, 0, 15);
      let year = now.getFullYear();
      const monthDiff = m - (now.getMonth() + 1);
      if (monthDiff > 6)  year -= 1;
      if (monthDiff < -6) year += 1;
      return new origDate(year, m - 1, day, hm ? +hm[1] : 0, hm ? +hm[2] : 0);
    }
    const d = parseDateMock('12/25', '');
    assert.equal(d.getFullYear(), 2025); // 應為去年
    assert.equal(d.getMonth(), 11);      // 12 月
    global.Date = origDate;
  });
  test('跨年修正：現在 12 月，公告 1 月 → 屬於明年', () => {
    function parseDateMock(d, t) {
      const parts = String(d).split('/').map(Number).filter(Boolean);
      const [m, day] = parts;
      const hm = String(t || '').match(/(\d{1,2}):(\d{2})/);
      const now = new Date(2026, 11, 15); // 2026-12-15
      let year = now.getFullYear();
      const monthDiff = m - (now.getMonth() + 1);
      if (monthDiff > 6)  year -= 1;
      if (monthDiff < -6) year += 1;
      return new Date(year, m - 1, day, hm ? +hm[1] : 0, hm ? +hm[2] : 0);
    }
    const d = parseDateMock('1/10', '');
    assert.equal(d.getFullYear(), 2027); // 應為明年
    assert.equal(d.getMonth(), 0);       // 1 月
  });
});

describe('getStatus', () => {
  test('今天的日期回傳 today', () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0);
    assert.equal(getStatus(today), 'today');
  });
  test('未來日期回傳 upcoming', () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    assert.equal(getStatus(future), 'upcoming');
  });
  test('過去日期回傳 past', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    assert.equal(getStatus(past), 'past');
  });
  test('null 回傳 past', () => {
    assert.equal(getStatus(null), 'past');
  });
  test('Invalid Date 回傳 past', () => {
    assert.equal(getStatus(new Date('invalid')), 'past');
  });
});

describe('badgeClass', () => {
  test('維護完成 → badge-done', () => {
    assert.equal(badgeClass('維護完成'), 'badge-done');
  });
  test('維護預告 → badge-notice', () => {
    assert.equal(badgeClass('維護預告'), 'badge-notice');
  });
  test('維護 → badge-notice', () => {
    assert.equal(badgeClass('維護'), 'badge-notice');
  });
  test('活動公告 → badge-event', () => {
    assert.equal(badgeClass('活動公告'), 'badge-event');
  });
  test('其他 → badge-other', () => {
    assert.equal(badgeClass('其他公告'), 'badge-other');
  });
  test('空值 → badge-other', () => {
    assert.equal(badgeClass(''), 'badge-other');
    assert.equal(badgeClass(null), 'badge-other');
  });
  test('完成 優先於 維護（包含「完成」）', () => {
    assert.equal(badgeClass('維護完成'), 'badge-done');
  });
});

describe('trimMaintContent', () => {
  test('TW：截掉注意事項之後', () => {
    const text = '維護內容\n【注意事項】\n注意1\n注意2';
    assert.equal(trimMaintContent(text, 'TW'), '維護內容');
  });
  test('CN：截掉注意事项之後', () => {
    const text = '维护内容\n【注意事项】\n注意';
    assert.equal(trimMaintContent(text, 'CN'), '维护内容');
  });
  test('JP：截掉ご注意之後', () => {
    const text = 'メンテ内容\n【ご注意】\n注意事項';
    assert.equal(trimMaintContent(text, 'JP'), 'メンテ内容');
  });
  test('EN：截掉 Important Notes 之後', () => {
    const text = 'Maintenance\n[Important Notes]\nNote 1';
    assert.equal(trimMaintContent(text, 'EN'), 'Maintenance');
  });
  test('找不到關鍵字時回傳完整內容', () => {
    const text = '只有內容沒有注意事項';
    assert.equal(trimMaintContent(text, 'TW'), text);
  });
  test('空字串回傳空字串', () => {
    assert.equal(trimMaintContent('', 'TW'), '');
    assert.equal(trimMaintContent(null, 'TW'), '');
  });
  test('截斷後去除結尾空白行', () => {
    const text = '內容   \n\n【注意事項】\n注意';
    assert.equal(trimMaintContent(text, 'TW'), '內容');
  });
});

describe('_imgCacheIsValid', () => {
  test('同一天的 timestamp 有效', () => {
    const now = new Date();
    const ts = now.getTime().toString();
    assert.equal(_imgCacheIsValid(ts, now), true);
  });
  test('昨天的 timestamp 無效', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const ts = yesterday.getTime().toString();
    assert.equal(_imgCacheIsValid(ts, now), false);
  });
  test('null/undefined 無效', () => {
    assert.equal(_imgCacheIsValid(null), false);
    assert.equal(_imgCacheIsValid(undefined), false);
    assert.equal(_imgCacheIsValid(''), false);
  });
});

describe('_saveSchedule 去重邏輯', () => {
  test('相同 sendDate+sendTime 不重複新增', () => {
    const records = [];
    _saveSchedule(records, '06/15', '10:00', '活動公告');
    _saveSchedule(records, '06/15', '10:00', '活動公告');
    assert.equal(records.length, 1);
  });
  test('不同時間各自新增', () => {
    const records = [];
    _saveSchedule(records, '06/15', '10:00', '活動公告');
    _saveSchedule(records, '06/15', '17:00', '活動公告');
    assert.equal(records.length, 2);
  });
  test('不同日期各自新增', () => {
    const records = [];
    _saveSchedule(records, '06/15', '10:00', '活動公告');
    _saveSchedule(records, '06/16', '10:00', '活動公告');
    assert.equal(records.length, 2);
  });
  test('新增後資料正確', () => {
    const records = [];
    _saveSchedule(records, '06/15', '10:00', '維護更新');
    assert.equal(records[0].sendDate, '06/15');
    assert.equal(records[0].sendTime, '10:00');
    assert.equal(records[0].typeName, '維護更新');
  });
});
