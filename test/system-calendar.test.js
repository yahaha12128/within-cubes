"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  parseIcsDate,
  parseIcsEvents
} = require("../src/system-calendar");

const ICS = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "BEGIN:VEVENT",
  "UID:event-1",
  "DTSTART:20261022T090000",
  "DTEND:20261022T100000",
  "SUMMARY:设计评审",
  "LOCATION:会议室 A",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:event-2",
  "DTSTART;VALUE=DATE:20261023",
  "SUMMARY:产品发布\\, 上线",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:event-old",
  "DTSTART:20250101T090000",
  "SUMMARY:很旧的日程",
  "END:VEVENT",
  "END:VCALENDAR"
].join("\r\n");

test("解析 ICS 日期、全天事件和跨行文本", () => {
  const date = parseIcsDate("20261022T090000");
  assert.equal(date.allDay, false);
  assert.equal(date.date.getFullYear(), 2026);
  assert.equal(date.date.getMonth(), 9);
  assert.equal(date.date.getDate(), 22);

  const allDay = parseIcsDate("20261023");
  assert.equal(allDay.allDay, true);
});

test("ICS 事件按时间范围过滤、排序并反转义", () => {
  const from = new Date(2026, 9, 21, 0, 0, 0);
  const to = new Date(2026, 9, 28, 23, 59, 59);
  const events = parseIcsEvents(ICS, { from, to });

  assert.equal(events.length, 2);
  assert.equal(events[0].title, "设计评审");
  assert.equal(events[0].location, "会议室 A");
  assert.equal(events[0].uid, "event-1");
  assert.equal(events[1].title, "产品发布, 上线");
  assert.equal(events[1].allDay, true);
});

test("ICS 空内容或不完整事件不会抛错", () => {
  assert.deepEqual(parseIcsEvents("", {}), []);
  assert.deepEqual(
    parseIcsEvents("BEGIN:VEVENT\nSUMMARY:没有开始时间\nEND:VEVENT", {}),
    []
  );
});
