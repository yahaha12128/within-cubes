"use strict";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function getLastTouchedMs(file) {
  const mtime = Number(file && file.mtimeMs) || 0;
  const atime = Number(file && file.atimeMs) || 0;

  return Math.max(mtime, atime);
}

function isTimeCapsule(file, now = Date.now()) {
  const lastTouched = getLastTouchedMs(file);

  // Windows can disable last-access timestamps. Files with no metadata at all
  // stay in colour instead of turning the whole desktop grey.
  if (lastTouched <= 0) return false;

  return now - lastTouched > THIRTY_DAYS_MS;
}

module.exports = {
  THIRTY_DAYS_MS,
  getLastTouchedMs,
  isTimeCapsule
};
