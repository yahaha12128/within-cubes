"use strict";

const { undoRuns } = require("./undo");

async function rollbackRuns(categoryMap, runs) {
  const report = {
    removed: 0,
    skipped: 0,
    errors: [],
    items: []
  };

  for (const run of [...(Array.isArray(runs) ? runs : [])].reverse()) {
    try {
      const result = await undoRuns(categoryMap, [run]);

      report.removed += result.removed;
      report.skipped += result.skipped;
      report.errors.push(...result.errors);

      result.items.forEach((item) => {
        report.items.push({
          ...item,
          runId: run.id,
          runCreatedAt: run.createdAt
        });
      });
    } catch (error) {
      const message = error.message || "回档失败。";
      report.errors.push({ name: run.id, message });
      report.items.push({
        status: "error",
        runId: run.id,
        runCreatedAt: run.createdAt,
        path: null,
        name: null,
        category: null,
        message,
        timestamp: new Date().toISOString()
      });
    }
  }

  return report;
}

module.exports = {
  rollbackRuns
};
