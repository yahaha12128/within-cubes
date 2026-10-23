"use strict";

(() => {
  const api = window.guideApi;
  const layer = document.querySelector("#guideLayer");
  let lastSignature = "";

  function createVerticalLine(line) {
    const element = document.createElement("div");
    element.className = "guide-line guide-line--vertical";
    element.style.left = `${Math.round(line.x)}px`;
    element.style.top = `${Math.round(line.y1)}px`;
    element.style.height = `${Math.max(1, Math.round(line.y2 - line.y1))}px`;
    return element;
  }

  function createHorizontalLine(line) {
    const element = document.createElement("div");
    element.className = "guide-line guide-line--horizontal";
    element.style.top = `${Math.round(line.y)}px`;
    element.style.left = `${Math.round(line.x1)}px`;
    element.style.width = `${Math.max(1, Math.round(line.x2 - line.x1))}px`;
    return element;
  }

  function render(state) {
    const vertical = Array.isArray(state && state.vertical) ? state.vertical : [];
    const horizontal = Array.isArray(state && state.horizontal)
      ? state.horizontal
      : [];
    const signature = JSON.stringify([vertical, horizontal]);

    if (signature === lastSignature) return;
    lastSignature = signature;

    const fragment = document.createDocumentFragment();
    vertical.forEach((line) => fragment.append(createVerticalLine(line)));
    horizontal.forEach((line) => fragment.append(createHorizontalLine(line)));
    layer.replaceChildren(fragment);
  }

  if (api) {
    api.onGuides(render);
  }
})();
