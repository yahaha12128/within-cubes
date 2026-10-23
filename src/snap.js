"use strict";

// 拖动窗口时的对齐吸附阈值（像素）。
const SNAP_THRESHOLD = 10;

// 对齐线在两端各留出的长度，让提示更容易看见。
const GUIDE_PADDING = 6;

function normalizeRect(rect) {
  if (!rect) return null;

  const x = Number(rect.x);
  const y = Number(rect.y);
  const width = Number(rect.width);
  const height = Number(rect.height);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  return { x, y, width, height };
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function spanForPair(a, b, startOf, endOf, minimum, maximum) {
  const start = Math.min(startOf(a), startOf(b)) - GUIDE_PADDING;
  const end = Math.max(endOf(a), endOf(b)) + GUIDE_PADDING;

  return {
    start: Math.round(clamp(start, minimum, maximum)),
    end: Math.round(clamp(end, minimum, maximum))
  };
}

function isBetterCandidate(candidate, current) {
  if (!current) return true;

  const candidateDistance = Math.abs(candidate.delta);
  const currentDistance = Math.abs(current.delta);

  if (candidateDistance !== currentDistance) {
    return candidateDistance < currentDistance;
  }

  // 距离相同时优先对齐其他真实窗口，而不是屏幕边缘。
  return candidate.priority < current.priority;
}

/**
 * 计算窗口松手后应吸附到的位置，以及拖动时需要显示的对齐线。
 *
 * bounds / workArea / targets 都使用屏幕坐标（DIP）。
 * verticalLines 表示竖线（固定 x），horizontalLines 表示横线（固定 y）。
 */
function computeSnap({
  bounds,
  workArea,
  targets = [],
  threshold = SNAP_THRESHOLD
}) {
  const moving = normalizeRect(bounds);
  const area = normalizeRect(workArea);

  if (!moving || !area) {
    const fallbackX = moving ? moving.x : Number(bounds && bounds.x) || 0;
    const fallbackY = moving ? moving.y : Number(bounds && bounds.y) || 0;

    return {
      x: fallbackX,
      y: fallbackY,
      snappedX: false,
      snappedY: false,
      verticalLines: [],
      horizontalLines: []
    };
  }

  const limit = Number.isFinite(threshold) && threshold >= 0
    ? threshold
    : SNAP_THRESHOLD;

  const areaRight = area.x + area.width;
  const areaBottom = area.y + area.height;
  const normalizedTargets = (Array.isArray(targets) ? targets : [])
    .map(normalizeRect)
    .filter(Boolean);

  let bestX = null;
  let bestY = null;

  function considerX(snappedX, lineX, spanStart, spanEnd, priority) {
    const value = Math.round(snappedX);
    const delta = value - moving.x;

    if (Math.abs(delta) > limit) return;

    const candidate = {
      value,
      delta,
      priority,
      lineX: Math.round(lineX),
      spanStart,
      spanEnd
    };

    if (isBetterCandidate(candidate, bestX)) {
      bestX = candidate;
    }
  }

  function considerY(snappedY, lineY, spanStart, spanEnd, priority) {
    const value = Math.round(snappedY);
    const delta = value - moving.y;

    if (Math.abs(delta) > limit) return;

    const candidate = {
      value,
      delta,
      priority,
      lineY: Math.round(lineY),
      spanStart,
      spanEnd
    };

    if (isBetterCandidate(candidate, bestY)) {
      bestY = candidate;
    }
  }

  // 屏幕边缘（工作区）对齐。
  considerX(area.x, area.x, area.y, areaBottom, 1);
  considerX(areaRight - moving.width, areaRight, area.y, areaBottom, 1);
  considerY(area.y, area.y, area.x, areaRight, 1);
  considerY(areaBottom - moving.height, areaBottom, area.x, areaRight, 1);

  // 与其他小组件的边缘或中心对齐。
  for (const target of normalizedTargets) {
    const targetRight = target.x + target.width;
    const targetBottom = target.y + target.height;
    const crossSpan = spanForPair(
      moving,
      target,
      (rect) => rect.y,
      (rect) => rect.y + rect.height,
      area.y,
      areaBottom
    );
    const horizontalSpan = spanForPair(
      moving,
      target,
      (rect) => rect.x,
      (rect) => rect.x + rect.width,
      area.x,
      areaRight
    );

    // 同一列：左边缘、右边缘、水平中心。
    considerX(target.x, target.x, crossSpan.start, crossSpan.end, 0);
    considerX(
      targetRight - moving.width,
      targetRight,
      crossSpan.start,
      crossSpan.end,
      0
    );
    considerX(
      target.x + target.width / 2 - moving.width / 2,
      target.x + target.width / 2,
      crossSpan.start,
      crossSpan.end,
      0
    );

    // 同一行：上边缘、下边缘、垂直中心。
    considerY(target.y, target.y, horizontalSpan.start, horizontalSpan.end, 0);
    considerY(
      targetBottom - moving.height,
      targetBottom,
      horizontalSpan.start,
      horizontalSpan.end,
      0
    );
    considerY(
      target.y + target.height / 2 - moving.height / 2,
      target.y + target.height / 2,
      horizontalSpan.start,
      horizontalSpan.end,
      0
    );
  }

  const verticalLines = bestX
    ? [{ x: bestX.lineX, y1: bestX.spanStart, y2: bestX.spanEnd }]
    : [];
  const horizontalLines = bestY
    ? [{ y: bestY.lineY, x1: bestY.spanStart, x2: bestY.spanEnd }]
    : [];

  return {
    x: bestX ? bestX.value : moving.x,
    y: bestY ? bestY.value : moving.y,
    snappedX: Boolean(bestX),
    snappedY: Boolean(bestY),
    verticalLines,
    horizontalLines
  };
}

module.exports = {
  SNAP_THRESHOLD,
  GUIDE_PADDING,
  computeSnap
};
