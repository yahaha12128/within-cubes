"use strict";

const { getAssignment, removeAssignment } = require("./category-map");

async function undoRuns(categoryMap, runs) {
  const report = {
    removed: 0,
    skipped: 0,
    errors: [],
    items: []
  };

  const addItem = (item) => {
    report.items.push({ timestamp: new Date().toISOString(), ...item });
  };

  for (const run of [...(Array.isArray(runs) ? runs : [])].reverse()) {
    if (!run || !Array.isArray(run.items)) continue;

    for (const item of [...run.items].reverse()) {
      if (!item || typeof item.path !== "string") {
        report.skipped += 1;
        addItem({
          status: "skipped",
          path: null,
          name: null,
          category: null,
          runId: run.id,
          reason: "归属记录缺少路径"
        });
        continue;
      }

      const assignment = getAssignment(categoryMap, item.path);

      if (!assignment) {
        report.skipped += 1;
        addItem({
          status: "skipped",
          path: item.path,
          name: item.name,
          category: item.category,
          runId: run.id,
          reason: "归属记录已不存在"
        });
        continue;
      }

      if (assignment.runId !== run.id) {
        report.skipped += 1;
        addItem({
          status: "skipped",
          path: item.path,
          name: item.name,
          category: assignment.category,
          runId: run.id,
          reason: "归属已被后续整理或手动调整覆盖"
        });
        continue;
      }

      const result = removeAssignment(categoryMap, item.path, { runId: run.id });

      if (!result.removed) {
        report.skipped += 1;
        addItem({
          status: "skipped",
          path: item.path,
          name: item.name,
          category: assignment.category,
          runId: run.id,
          reason: "归属记录移除失败"
        });
        continue;
      }

      report.removed += 1;
      addItem({
        status: "unassigned",
        path: item.path,
        name: item.name,
        category: assignment.category,
        kind: assignment.kind,
        runId: run.id
      });
    }
  }

  return report;
}

module.exports = {
  undoRuns
};
