"use strict";

const api = window.workerwDemo;

const elements = {
  panel: document.getElementById("panel"),
  statusPill: document.getElementById("statusPill"),
  statusText: document.getElementById("statusText"),
  hostValue: document.getElementById("hostValue"),
  childBadge: document.getElementById("childBadge"),
  parentValue: document.getElementById("parentValue"),
  clickThroughValue: document.getElementById("clickThroughValue"),
  defViewValue: document.getElementById("defViewValue"),
  rectValue: document.getElementById("rectValue"),
  clickButton: document.getElementById("clickButton"),
  clickCount: document.getElementById("clickCount"),
  mouseState: document.getElementById("mouseState"),
  steps: document.querySelector(".steps"),
  errorBox: document.getElementById("errorBox"),
  reapplyButton: document.getElementById("reapplyButton"),
  closeButton: document.getElementById("closeButton")
};

let buttonClicks = 0;
let pointerEvents = 0;
let lastStatus = null;

function setPill(kind, text) {
  elements.statusPill.classList.remove("is-good", "is-bad", "is-pending");
  elements.statusPill.classList.add(kind);
  elements.statusText.textContent = text;
}

function setStatusText(element, text, kind = "") {
  element.textContent = text;
  element.classList.remove("is-good", "is-bad");
  if (kind) element.classList.add(kind);
}

function renderStatus(status) {
  lastStatus = status;
  if (!status) return;

  elements.errorBox.hidden = !status.error;
  elements.steps.hidden = Boolean(status.error);
  if (status.error) elements.errorBox.textContent = status.error;

  if (status.phase === "attached" && status.attached) {
    setPill("is-good", "已嵌入桌面层");
  } else if (status.phase === "failed" || status.phase === "detached") {
    setPill("is-bad", "嵌入失败");
  } else {
    setPill("is-pending", "正在嵌入");
  }

  const host = status.host;
  const diagnostics = status.diagnostics;

  if (host) {
    elements.hostValue.textContent =
      `${host.className || "WorkerW"} ${host.hwnd}`;
  } else {
    elements.hostValue.textContent = "未找到";
  }

  elements.defViewValue.textContent = status.defView || "—";
  elements.defViewValue.title = status.defView || "";

  if (diagnostics && diagnostics.valid) {
    setStatusText(
      elements.parentValue,
      `${diagnostics.parentClass || "?"} ${diagnostics.parent}`,
      diagnostics.parent !== "0x0" ? "is-good" : "is-bad"
    );

    const childOk = diagnostics.isChildStyle && !diagnostics.isPopupStyle;
    elements.childBadge.textContent = childOk
      ? "WS_CHILD ✓"
      : "WS_CHILD ✗";
    elements.childBadge.classList.remove("is-good", "is-bad", "is-pending");
    elements.childBadge.classList.add(childOk ? "is-good" : "is-bad");

    const clickThrough = diagnostics.isClickThroughStyle;
    setStatusText(
      elements.clickThroughValue,
      clickThrough ? "已启用（会拦截点击）" : "未启用",
      clickThrough ? "is-bad" : "is-good"
    );

    if (diagnostics.rect) {
      const { left, top, width, height } = diagnostics.rect;
      elements.rectValue.textContent =
        `${width}×${height} @ ${left},${top}`;
    } else {
      elements.rectValue.textContent = "—";
    }
  } else {
    setStatusText(elements.parentValue, "—");
    elements.childBadge.textContent = "WS_CHILD ?";
    elements.childBadge.classList.remove("is-good", "is-bad");
    elements.childBadge.classList.add("is-pending");
  }
}

api.onStatus(renderStatus);
api.getStatus().then(renderStatus).catch((error) => {
  elements.errorBox.hidden = false;
  elements.errorBox.textContent = String(error);
});

elements.clickButton.addEventListener("click", (event) => {
  event.stopPropagation();
  buttonClicks += 1;
  elements.clickCount.textContent = String(buttonClicks);
  elements.mouseState.textContent = "鼠标点击链路正常";
  elements.mouseState.classList.add("is-good");

  api.reportPointer({
    kind: "button-click",
    count: buttonClicks,
    screenX: event.screenX,
    screenY: event.screenY
  });
});

// Track raw pointer delivery across the whole panel. If this counter stays at
// zero while clicking, the window is receiving no Win32 mouse input at all.
elements.panel.addEventListener("pointerdown", (event) => {
  pointerEvents += 1;

  if (buttonClicks === 0) {
    elements.mouseState.textContent = `已收到 ${pointerEvents} 次按下，正在等待按钮 click`;
  }

  api.reportPointer({
    kind: "panel-pointerdown",
    count: pointerEvents,
    target: event.target && event.target.id
      ? event.target.id
      : (event.target && event.target.tagName) || "unknown",
    screenX: event.screenX,
    screenY: event.screenY
  });
});

elements.reapplyButton.addEventListener("click", async () => {
  elements.reapplyButton.disabled = true;
  elements.reapplyButton.textContent = "置顶中…";

  try {
    const result = await api.reapplyZOrder();
    if (!result.ok) {
      elements.errorBox.hidden = false;
      elements.errorBox.textContent = result.error || "重新置顶失败";
    } else if (lastStatus) {
      renderStatus(lastStatus);
    }
  } catch (error) {
    elements.errorBox.hidden = false;
    elements.errorBox.textContent = String(error);
  } finally {
    elements.reapplyButton.disabled = false;
    elements.reapplyButton.textContent = "重新置顶";
  }
});

elements.closeButton.addEventListener("click", () => {
  api.close();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") api.close();
});
