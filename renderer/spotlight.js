"use strict";

(() => {
  const api = window.spotlightApi;
  const input = document.querySelector("#spotlightInput");
  const resultsHost = document.querySelector("#spotlightResults");
  const message = document.querySelector("#spotlightMessage");

  const TYPE_ICONS = {
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    document: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    audio: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    video: '<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m16 10 6-3v10l-6-3z"/>',
    archive: '<path d="M4 7h16v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M3 4h18v3H3z"/><path d="M10 11h4"/>',
    app: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/>',
    shortcut: '<path d="m18 13-1.5-7.5L2 11l6.5 1.5L10 19z"/><path d="m10 19 2.5-5"/>',
    installer: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/>',
    code: '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12"/>',
    other: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'
  };

  let results = [];
  let selectedIndex = -1;
  let searchTimer = null;
  let requestToken = 0;

  function getIconPath(result) {
    if (result.kind === "folder") return TYPE_ICONS.folder;
    return TYPE_ICONS[result.type] || TYPE_ICONS.other;
  }

  function createResultRow(result, index) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "spotlight-result";
    row.id = `spotlightResult-${index}`;
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", String(index === selectedIndex));
    row.dataset.index = String(index);
    row.classList.toggle("is-selected", index === selectedIndex);

    const icon = document.createElement("span");
    icon.className = "spotlight-result-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = `<svg viewBox="0 0 24 24">${getIconPath(result)}</svg>`;

    const copy = document.createElement("span");
    copy.className = "spotlight-result-copy";
    const name = document.createElement("span");
    name.className = "spotlight-result-name";
    name.textContent = result.name || "未命名文件";
    const path = document.createElement("span");
    path.className = "spotlight-result-path";
    path.textContent = result.path || "";
    path.title = result.path || "";
    copy.append(name, path);

    const category = document.createElement("span");
    category.className = "spotlight-result-category";
    category.textContent = result.categoryLabel || "文件";

    row.append(icon, copy, category);
    row.addEventListener("mouseenter", () => setSelectedIndex(index));
    row.addEventListener("click", () => openResult(index));
    return row;
  }

  function updateMessage(text, { error = false } = {}) {
    message.textContent = text;
    message.hidden = !text;
    message.classList.toggle("is-error", Boolean(error));
  }

  function setSelectedIndex(index) {
    if (results.length === 0) {
      selectedIndex = -1;
      return;
    }

    selectedIndex = Math.max(0, Math.min(results.length - 1, index));
    resultsHost
      .querySelectorAll(".spotlight-result")
      .forEach((row, rowIndex) => {
        const selected = rowIndex === selectedIndex;
        row.classList.toggle("is-selected", selected);
        row.setAttribute("aria-selected", String(selected));
      });

    const selected = resultsHost.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    if (selected) selected.scrollIntoView({ block: "nearest" });
  }

  function updateWindowHeight() {
    const visibleRows = results.length > 0
      ? Math.min(results.length, 7)
      : 0;
    const height = results.length > 0
      ? Math.min(560, 72 + 34 + visibleRows * 48 + 12)
      : 132;

    api.resize(height).catch(() => {});
  }

  function renderResults(nextResults) {
    results = Array.isArray(nextResults) ? nextResults : [];
    selectedIndex = results.length > 0 ? 0 : -1;
    resultsHost.replaceChildren();
    resultsHost.classList.toggle("has-results", results.length > 0);

    if (results.length === 0) {
      updateMessage(
        input.value.trim() ? "没有找到匹配的文件。" : "输入文件名开始搜索"
      );
      updateWindowHeight();
      return;
    }

    updateMessage("");
    results.forEach((result, index) => {
      resultsHost.append(createResultRow(result, index));
    });
    setSelectedIndex(0);
    updateWindowHeight();
  }

  function resetSpotlight() {
    clearTimeout(searchTimer);
    requestToken += 1;
    input.value = "";
    results = [];
    selectedIndex = -1;
    resultsHost.replaceChildren();
    resultsHost.classList.remove("has-results");
    updateMessage("输入文件名开始搜索");
    updateWindowHeight();
    requestAnimationFrame(() => {
      input.focus();
      input.select();
    });
  }

  async function runSearch(query) {
    const value = String(query || "").trim();
    const token = ++requestToken;

    if (!value) {
      renderResults([]);
      return;
    }

    try {
      const result = await api.search(value);
      if (token !== requestToken) return;

      if (!result || !result.ok) {
        renderResults([]);
        updateMessage(result && result.error ? result.error : "搜索失败。", {
          error: true
        });
        return;
      }

      renderResults(result.results);
    } catch (error) {
      if (token !== requestToken) return;
      renderResults([]);
      updateMessage("搜索失败。", { error: true });
    }
  }

  async function openResult(index = selectedIndex) {
    const result = results[index];
    if (!result) return;

    try {
      const response = await api.openResult({
        path: result.path,
        query: input.value
      });

      if (!response || !response.ok) {
        updateMessage(
          response && response.error ? response.error : "无法打开文件。",
          { error: true }
        );
      }
    } catch (error) {
      updateMessage("无法打开文件。", { error: true });
    }
  }

  input.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => runSearch(input.value), 90);
  });

  input.addEventListener("keydown", async (event) => {
    if (event.isComposing) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex(selectedIndex + 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex(selectedIndex - 1);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      api.hide().catch(() => {});
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (results.length > 0) {
        openResult(selectedIndex);
        return;
      }

      const query = input.value.trim();
      if (query) {
        await api.submitQuery(query).catch(() => {});
        api.hide().catch(() => {});
      }
    }
  });

  api.onReset(resetSpotlight);
  resetSpotlight();
})();
