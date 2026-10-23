"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  THIRTY_DAYS_MS,
  getLastTouchedMs,
  isTimeCapsule
} = require("../src/time-capsule");

test("时间胶囊以修改时间和访问时间中较晚者计算", () => {
  const now = Date.now();
  const old = now - THIRTY_DAYS_MS - 1000;
  const fresh = now - 1000;

  assert.equal(getLastTouchedMs({ mtimeMs: old, atimeMs: fresh }), fresh);
  assert.equal(getLastTouchedMs({ mtimeMs: fresh, atimeMs: old }), fresh);
  assert.equal(getLastTouchedMs({}), 0);

  assert.equal(isTimeCapsule({ mtimeMs: old, atimeMs: old }, now), true);
  assert.equal(isTimeCapsule({ mtimeMs: fresh, atimeMs: old }, now), false);
  assert.equal(isTimeCapsule({}, now), false);
});

test("刚好 30 天不算时间胶囊，超过 30 天才变灰", () => {
  const now = Date.now();

  assert.equal(
    isTimeCapsule({ mtimeMs: now - THIRTY_DAYS_MS }, now),
    false
  );
  assert.equal(
    isTimeCapsule({ mtimeMs: now - THIRTY_DAYS_MS - 1 }, now),
    true
  );
});
