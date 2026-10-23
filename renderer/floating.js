"use strict";

(() => {
  const api = window.floatingApi;

  const els = {
    app: document.querySelector("#floatingApp"),
    dragbar: document.querySelector("#dragbar"),
    lockButton: document.querySelector("#lockButton"),
    lockBadge: document.querySelector("#lockBadge"),
    resetButton: document.querySelector("#resetButton"),
    closeButton: document.querySelector("#closeButton"),
    categoryLabel: document.querySelector("#categoryLabel"),
    gridScroll: document.querySelector("#gridScroll"),
    grid: document.querySelector("#grid"),
    emptyState: document.querySelector("#emptyState"),
    dropOverlay: document.querySelector("#dropOverlay"),
    dropOverlayName: document.querySelector("#dropOverlayName"),
    toast: document.querySelector("#toast")
  };

  const TYPE_ICONS = {
    folder: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#f5efe3"/>
      <path d="M13 19h9l3 3h10v14H13z" fill="#fff" stroke="#7a6238" stroke-width="2" stroke-linejoin="round"/>
      <path d="M13 22h22" fill="none" stroke="#7a6238" stroke-width="2"/>
    </svg>`,
    image: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#e9f1f6"/>
      <rect x="13" y="15" width="22" height="18" rx="3" fill="#fff" stroke="#3f6f8e" stroke-width="2"/>
      <circle cx="20" cy="21" r="2.4" fill="#3f6f8e"/>
      <path d="M15 31l6-7 4 4 3-3 5 6z" fill="#3f6f8e"/>
    </svg>`,
    document: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#e9f1f6"/>
      <path d="M17 12h10l6 6v18H17z" fill="#fff" stroke="#3f6f8e" stroke-width="2" stroke-linejoin="round"/>
      <path d="M27 12v7h6" fill="none" stroke="#3f6f8e" stroke-width="2" stroke-linejoin="round"/>
      <path d="M21 25h8M21 30h6" fill="none" stroke="#3f6f8e" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    archive: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#f5efe3"/>
      <rect x="16" y="14" width="16" height="21" rx="3" fill="#fff" stroke="#7a6238" stroke-width="2"/>
      <path d="M24 14v21" stroke="#7a6238" stroke-width="2" stroke-dasharray="3 2"/>
      <path d="M21 19h6" stroke="#7a6238" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    installer: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#f7ebe6"/>
      <path d="M24 12v13M18.5 20l5.5 6.5 5.5-6.5" fill="none" stroke="#8a4f38" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="16" y="31" width="16" height="4" rx="2" fill="#8a4f38"/>
    </svg>`,
    audio: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#e8f1eb"/>
      <path d="M27 14v15a4 4 0 1 1-2-3.46V18l9-2v11" fill="none" stroke="#496a52" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="23" cy="31" r="4" fill="none" stroke="#496a52" stroke-width="2"/>
      <circle cx="32" cy="28" r="4" fill="none" stroke="#496a52" stroke-width="2"/>
    </svg>`,
    video: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#f0edf6"/>
      <rect x="13" y="17" width="22" height="14" rx="3" fill="#fff" stroke="#6a5b86" stroke-width="2"/>
      <path d="M22 21l6 3-6 3z" fill="#6a5b86"/>
    </svg>`,
    code: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#eef2ee"/>
      <path d="M20 18l-6 6 6 6M28 18l6 6-6 6" fill="none" stroke="#5e6b63" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M26 15l-4 18" stroke="#5e6b63" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    shortcut: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#eef2ee"/>
      <path d="M18 30l12-12M22 18h8v8" fill="none" stroke="#5e6b63" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    other: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#eef2ee"/>
      <path d="M17 12h10l6 6v18H17z" fill="#fff" stroke="#5e6b63" stroke-width="2" stroke-linejoin="round"/>
      <path d="M27 12v7h6" fill="none" stroke="#5e6b63" stroke-width="2" stroke-linejoin="round"/>
    </svg>`
  };

  const GENERIC_ICON = TYPE_ICONS.other;

  let files = [];
  let rows = 2;
  let cols = 3;
  let locked = false;
  let categoryLabel = "整理分类";
  let tint = "system";
  let customTint = "#2f6b4f";
  let frosted = true;
  let material = "css";
  const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  let dragIndex = null;
  let dragActive = false;
  let dragExternal = false;
  let dragCanceled = false;
  let lastDragEnd = 0;
  let toastTimer = null;
  let gridChanging = false;
  let lockChanging = false;
  let renaming = false;
  let collapseMode = "double-click";
  let collapsed = false;
  let collapseBusy = false;
  let collapseQueued = null;
  let collapseTimer = null;
  let collapseAfterPointerUp = false;

  function clamp(value, minimum, maximum, fallback) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
      return fallback;
    }
    return parsed;
  }

  function hexToRgba(hex, alpha) {
    const match = /^#([0-9a-f]{6})$/i.exec(String(hex || ""));

    if (!match) return `rgba(47, 107, 79, ${alpha})`;

    const value = parseInt(match[1], 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  function isDarkColor(hex) {
    const match = /^#([0-9a-f]{6})$/i.exec(String(hex || ""));

    if (!match) return false;

    const value = parseInt(match[1], 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;

    return red * 0.299 + green * 0.587 + blue * 0.114 < 140;
  }

  function applyGlassAppearance() {
    const classes = [
      "theme-light",
      "theme-dark",
      "tint-transparent",
      "tint-white",
      "tint-black",
      "tint-custom",
      "material-native",
      "material-css",
      "material-off"
    ];

    els.app.classList.remove(...classes);

    let resolvedTint = tint;
    let theme = "light";

    if (tint === "system") {
      const dark = systemThemeMedia.matches;
      resolvedTint = dark ? "black" : "white";
      theme = dark ? "dark" : "light";
    } else if (tint === "black") {
      theme = "dark";
    } else if (tint === "custom") {
      theme = isDarkColor(customTint) ? "dark" : "light";
    }

    if (resolvedTint === "transparent") {
      theme = "light";
    }

    if (resolvedTint === "custom") {
      els.app.style.setProperty("--glass-tint", hexToRgba(customTint, 0.42));
    } else {
      els.app.style.removeProperty("--glass-tint");
    }

    els.app.classList.add(
      `theme-${theme}`,
      `tint-${resolvedTint}`,
      `material-${material}`
    );
    els.app.dataset.tint = resolvedTint;
    els.app.dataset.material = material;
  }

  function setDropTarget(active) {
    els.app.classList.toggle("is-drop-target", active);
    els.dropOverlay.hidden = !active;

    if (active) {
      els.dropOverlayName.textContent = categoryLabel;
    }
  }

  function applyCollapsedUI() {
    els.app.classList.toggle("is-collapsed", collapsed);
    els.dragbar.setAttribute("aria-expanded", String(!collapsed));
    els.dragbar.dataset.collapseMode = collapseMode;
  }

  function updateLockUI() {
    els.app.classList.toggle("is-locked", locked);
    els.lockBadge.hidden = !locked;
    els.lockButton.classList.toggle("is-locked", locked);
    els.lockButton.textContent = locked ? "🔒" : "🔓";
    els.lockButton.setAttribute("aria-label", locked ? "解锁小组件" : "锁定小组件");
    els.lockButton.title = locked ? "解锁小组件" : "锁定小组件";

    const hints = [];

    hints.push(
      locked
        ? `${categoryLabel}（已锁定，不能移动）`
        : `拖动这里移动「${categoryLabel}」`
    );

    if (collapseMode === "double-click") {
      hints.push(collapsed ? "双击标题栏展开" : "双击标题栏折叠");
    } else {
      hints.push(collapsed ? "悬停展开" : "移出后折叠");
      hints.push("双击名称可重命名");
    }

    els.dragbar.title = hints.join(" · ");
  }

  async function flushCollapsedRequest() {
    collapseTimer = null;
    const target = collapseQueued;
    collapseQueued = null;

    if (target === null || target === collapsed) return;

    if (collapseBusy) {
      collapseQueued = target;
      return;
    }

    collapseBusy = true;

    try {
      const result = await api.setCollapsed(target);

      if (result && result.ok) {
        collapsed = Boolean(result.collapsed);
        applyCollapsedUI();
        updateLockUI();
      }
    } catch (error) {
      // 保持当前展开状态
    } finally {
      collapseBusy = false;

      if (collapseQueued !== null && collapseQueued !== collapsed) {
        flushCollapsedRequest();
      }
    }
  }

  function requestCollapsed(next) {
    if (collapseMode === "hover" && next && renaming) return;

    collapseQueued = Boolean(next);
    clearTimeout(collapseTimer);
    collapseTimer = setTimeout(flushCollapsedRequest, 40);
  }

  function applyState(state) {
    if (!state || !state.ok) return;

    const previousSignature = `${rows}:${cols}:${files.map((file) => file.key).join("\u0001")}`;

    files = Array.isArray(state.files) ? state.files.slice() : [];
    rows = clamp(state.rows, 1, 8, 2);
    cols = clamp(state.cols, 1, 8, 3);
    locked = Boolean(state.locked);
    categoryLabel = state.categoryLabel || "整理分类";
    document.title = categoryLabel;
    document.documentElement.dataset.categoryKey = state.categoryKey || "";
    tint = ["transparent", "white", "black", "system", "custom"].includes(state.tint)
      ? state.tint
      : "system";
    if (typeof state.customTint === "string") {
      customTint = state.customTint;
    }
    frosted = state.frosted !== false;
    material = state.material === "native" || state.material === "off"
      ? state.material
      : "css";

    if (!frosted) {
      material = "off";
    }

    const previousCollapseMode = collapseMode;
    collapseMode = state.collapseMode === "hover" ? "hover" : "double-click";

    if (!collapseBusy && collapseQueued === null) {
      collapsed = Boolean(state.collapsed);
    }

    const nextSignature = `${rows}:${cols}:${files.map((file) => file.key).join("\u0001")}`;
    const resetScroll = previousSignature !== nextSignature;

    els.app.style.setProperty("--rows", rows);
    els.app.style.setProperty("--cols", cols);
    els.categoryLabel.textContent = categoryLabel;
    els.categoryLabel.title = `双击重命名「${categoryLabel}」`;

    if (!els.dropOverlay.hidden) {
      els.dropOverlayName.textContent = categoryLabel;
    }

    const empty = files.length === 0;
    els.gridScroll.hidden = empty;
    els.emptyState.hidden = !empty;

    applyGlassAppearance();
    applyCollapsedUI();
    updateLockUI();
    renderGrid({ resetScroll });

    if (
      previousCollapseMode !== collapseMode &&
      collapseMode === "hover" &&
      els.app.matches(":hover")
    ) {
      requestCollapsed(false);
    }
  }

  function updateScrollable() {
    if (els.gridScroll.hidden) {
      els.gridScroll.classList.remove("is-scrollable");
      return;
    }

    const scrollable = els.gridScroll.scrollHeight > els.gridScroll.clientHeight + 1;
    els.gridScroll.classList.toggle("is-scrollable", scrollable);
  }

  function renderGrid({ resetScroll = false } = {}) {
    const previousScroll = els.gridScroll.scrollTop;

    els.grid.replaceChildren();

    files.forEach((file, index) => {
      els.grid.append(createFileCell(file, index));
    });

    els.gridScroll.scrollTop = resetScroll ? 0 : previousScroll;
    requestAnimationFrame(updateScrollable);
  }

  function createFileCell(file, index) {
    const cell = document.createElement("div");
    cell.className = "file-cell";
    cell.draggable = true;
    cell.tabIndex = 0;
    cell.setAttribute("role", "listitem");
    cell.setAttribute("aria-label", `${file.name}，点击打开`);
    cell.title = file.isSystemIcon ? `${file.name}（系统图标）` : file.name;

    const iconWrap = document.createElement("div");
    iconWrap.className = "file-icon";

    if (file.isSystemIcon) {
      cell.classList.add("is-system-icon");
      iconWrap.classList.add("is-system-icon");
      const glyph = document.createElement("span");
      glyph.className = "file-icon-emoji";
      glyph.setAttribute("aria-hidden", "true");
      glyph.textContent = file.icon || "▣";
      iconWrap.append(glyph);
    } else {
      iconWrap.innerHTML = TYPE_ICONS[file.type] || GENERIC_ICON;

      if (file.iconMode === "system") {
        iconWrap.classList.add("is-icon-loading");
        loadSystemIcon(file, iconWrap);
      }
    }

    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = file.name;
    name.title = file.name;

    cell.append(iconWrap, name);

    cell.addEventListener("click", () => {
      if (Date.now() - lastDragEnd < 250) return;
      openFile(file);
    });

    cell.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (Date.now() - lastDragEnd < 250) return;
        openFile(file);
      }
    });

    cell.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      api.showContextMenu(file.path)
        .then((result) => {
          if (!result || !result.ok) {
            showToast(result && result.error ? result.error : "无法打开所在文件夹");
          }
        })
        .catch(() => showToast("无法打开所在文件夹"));
    });

    cell.addEventListener("dragstart", (event) => handleDragStart(event, index, cell));
    cell.addEventListener("dragover", (event) => handleDragOver(event, index, cell));
    cell.addEventListener("dragleave", (event) => handleDragLeave(event, cell));
    cell.addEventListener("drop", (event) => handleDrop(event, index, cell));
    cell.addEventListener("dragend", handleDragEnd);

    return cell;
  }

  async function loadSystemIcon(file, iconWrap) {
    let result = null;

    try {
      result = await api.getSystemIcon(file.path);
    } catch (error) {
      result = null;
    }

    if (!iconWrap.isConnected) return;

    if (!result || !result.ok || !result.dataUrl) {
      iconWrap.classList.remove("is-icon-loading");
      return;
    }

    const image = new Image();
    image.alt = "";
    image.draggable = false;

    image.addEventListener("load", () => {
      if (!iconWrap.isConnected) return;
      iconWrap.replaceChildren(image);
      iconWrap.classList.remove("is-icon-loading");
    }, { once: true });

    image.addEventListener("error", () => {
      if (!iconWrap.isConnected) return;
      iconWrap.classList.remove("is-icon-loading");
    }, { once: true });

    image.src = result.dataUrl;
  }

  function getDropSide(cell, event) {
    const rect = cell.getBoundingClientRect();
    return event.clientX < rect.left + rect.width / 2 ? "before" : "after";
  }

  function clearDropIndicators() {
    els.grid.querySelectorAll(".drop-before, .drop-after").forEach((cell) => {
      cell.classList.remove("drop-before", "drop-after");
    });
  }

  function handleDragStart(event, index, cell) {
    dragIndex = index;
    dragActive = true;
    dragExternal = false;
    dragCanceled = false;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));

    const file = files[index];
    // 系统图标只参与窗口内排序，不发起“拖出分类/拖到桌面”的外部拖动。
    if (file && !file.isSystemIcon) {
      dragExternal = true;
      api.startCategoryDrag(file.path).catch(() => {});
    }

    cell.classList.add("is-dragging");

    const ghost = cell.cloneNode(true);
    ghost.classList.add("drag-ghost");
    ghost.classList.remove("is-dragging", "drop-before", "drop-after");
    document.body.append(ghost);
    event.dataTransfer.setDragImage(ghost, 38, 42);
    requestAnimationFrame(() => ghost.remove());
  }

  function handleDragOver(event, index, cell) {
    if (dragIndex === null) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    clearDropIndicators();
    const side = getDropSide(cell, event);
    cell.classList.add(side === "before" ? "drop-before" : "drop-after");
  }

  function handleDragLeave(event, cell) {
    if (!cell.contains(event.relatedTarget)) {
      cell.classList.remove("drop-before", "drop-after");
    }
  }

  function handleDrop(event, index, cell) {
    if (dragIndex === null) return;

    event.preventDefault();

    const fromIndex = dragIndex;
    lastDragEnd = Date.now();

    if (fromIndex === index) {
      cleanupDragState();
      return;
    }

    const side = getDropSide(cell, event);
    const [moved] = files.splice(fromIndex, 1);
    let insertIndex = index;

    if (fromIndex < index) insertIndex -= 1;
    if (side === "after") insertIndex += 1;
    insertIndex = Math.max(0, Math.min(insertIndex, files.length));

    files.splice(insertIndex, 0, moved);
    lastDragEnd = Date.now();

    cleanupDragState();
    renderGrid({ resetScroll: false });
    persistOrder();
  }

  function handleDragEnd() {
    if (dragActive) {
      dragActive = false;
      const canceled = dragCanceled;
      const external = dragExternal;
      dragCanceled = false;
      dragExternal = false;

      if (external) {
        api.endCategoryDrag({ canceled }).catch(() => {});
      }
    }

    if (dragIndex !== null) {
      lastDragEnd = Date.now();
    }

    cleanupDragState();

    if (
      collapseAfterPointerUp &&
      collapseMode === "hover" &&
      !els.app.matches(":hover")
    ) {
      collapseAfterPointerUp = false;
      requestCollapsed(true);
    }
  }

  function cleanupDragState() {
    dragIndex = null;
    clearDropIndicators();
    els.grid.querySelectorAll(".is-dragging").forEach((cell) => {
      cell.classList.remove("is-dragging");
    });
  }

  async function persistOrder() {
    try {
      const result = await api.saveOrder(files.map((file) => file.key));
      if (!result || !result.ok) {
        showToast(result && result.error ? result.error : "排序保存失败");
      }
    } catch (error) {
      showToast("排序保存失败");
    }
  }

  async function openFile(file) {
    try {
      const result = await api.openFile(file.path);
      if (!result || !result.ok) {
        showToast(result && result.error ? result.error : "无法打开文件");
      }
    } catch (error) {
      showToast("无法打开文件");
    }
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.hidden = false;

    requestAnimationFrame(() => {
      els.toast.classList.add("is-visible");
    });

    toastTimer = setTimeout(() => {
      els.toast.classList.remove("is-visible");
      toastTimer = setTimeout(() => {
        els.toast.hidden = true;
      }, 220);
    }, 2200);
  }

  function beginRename() {
    if (renaming) return;

    renaming = true;
    els.dragbar.classList.add("is-renaming");

    const input = document.createElement("input");
    input.type = "text";
    input.className = "drag-label-input";
    input.value = categoryLabel;
    input.maxLength = 40;
    input.setAttribute("aria-label", "小组件名称");
    input.title = "回车确认，Esc 取消";

    els.categoryLabel.hidden = true;
    els.categoryLabel.after(input);

    let settled = false;

    const finish = (commit) => {
      if (settled) return;
      settled = true;
      renaming = false;
      const value = input.value;

      input.remove();
      els.categoryLabel.hidden = false;
      els.dragbar.classList.remove("is-renaming");

      if (collapseMode === "hover" && !els.app.matches(":hover")) {
        requestCollapsed(true);
      }

      if (commit && value.trim() !== categoryLabel) {
        commitRename(value);
      }
    };

    input.addEventListener("keydown", (event) => {
      event.stopPropagation();

      if (event.key === "Enter") {
        event.preventDefault();
        finish(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        finish(false);
      }
    });
    input.addEventListener("blur", () => finish(true));
    input.addEventListener("pointerdown", (event) => event.stopPropagation());
    input.addEventListener("dblclick", (event) => event.stopPropagation());

    input.focus();
    input.select();
  }

  async function commitRename(value) {
    try {
      const result = await api.rename(value);

      if (!result || !result.ok) {
        showToast(result && result.error ? result.error : "重命名失败");
        return;
      }

      applyState(result.state);
    } catch (error) {
      showToast("重命名失败");
    }
  }

  async function resetGridSize() {
    if (gridChanging) return;

    gridChanging = true;

    try {
      const result = await api.resetGrid();
      if (!result || !result.ok) {
        showToast(result && result.error ? result.error : "无法恢复默认大小");
        return;
      }
      applyState(result.state);
    } catch (error) {
      showToast("无法恢复默认大小");
    } finally {
      gridChanging = false;
    }
  }

  async function toggleLock() {
    if (lockChanging) return;

    lockChanging = true;

    try {
      const result = await api.toggleLock();
      if (!result || !result.ok) {
        showToast(result && result.error ? result.error : "无法切换锁定状态");
        return;
      }
      applyState(result.state);
    } catch (error) {
      showToast("无法切换锁定状态");
    } finally {
      lockChanging = false;
    }
  }

  async function loadInitialState() {
    try {
      const state = await api.getData();
      applyState(state);
    } catch (error) {
      showToast("无法读取整理结果");
    } finally {
      api.ready();
    }
  }

  els.dragbar.addEventListener("dblclick", (event) => {
    if (event.target.closest("button, input")) return;

    if (collapseMode === "double-click") {
      event.preventDefault();
      requestCollapsed(!collapsed);
      return;
    }

    beginRename();
  });

  els.app.addEventListener("mouseenter", () => {
    if (collapseMode !== "hover") return;
    requestCollapsed(false);
  });

  els.app.addEventListener("mouseleave", (event) => {
    if (collapseMode !== "hover" || renaming) return;

    if (dragActive || (event.buttons & 1) !== 0) {
      collapseAfterPointerUp = true;
      return;
    }

    requestCollapsed(true);
  });

  window.addEventListener("pointerup", () => {
    if (!collapseAfterPointerUp) return;

    collapseAfterPointerUp = false;

    if (
      collapseMode === "hover" &&
      !dragActive &&
      !renaming &&
      !els.app.matches(":hover")
    ) {
      requestCollapsed(true);
    }
  });

  els.resetButton.addEventListener("click", resetGridSize);
  els.lockButton.addEventListener("click", toggleLock);
  els.closeButton.addEventListener("click", () => {
    api.close().catch(() => {});
  });

  els.gridScroll.addEventListener("dragover", (event) => {
    if (dragIndex === null) return;

    const rect = els.gridScroll.getBoundingClientRect();
    const threshold = 22;

    if (event.clientY < rect.top + threshold) {
      els.gridScroll.scrollTop -= 10;
    } else if (event.clientY > rect.bottom - threshold) {
      els.gridScroll.scrollTop += 10;
    }
  });

  window.addEventListener("resize", updateScrollable);

  window.addEventListener("keydown", (event) => {
    if (dragActive && event.key === "Escape") {
      dragCanceled = true;
    }
  }, true);

  api.onDragTarget((state) => {
    setDropTarget(Boolean(state && state.active));
  });

  systemThemeMedia.addEventListener("change", () => {
    if (tint === "system") {
      applyGlassAppearance();
    }
  });

  api.onUpdate((state) => {
    applyState(state);
  });

  if (typeof api.onToast === "function") {
    api.onToast((message) => {
      if (message) showToast(message);
    });
  }

  if (typeof api.onExternalDropResult === "function") {
    api.onExternalDropResult((result) => {
      if (!result) return;

      if (result.ok && result.count > 0) {
        showToast(`已移入 ${result.count} 个文件`);
      } else if (result.error) {
        showToast(result.error);
      }
    });
  }

  loadInitialState();
})();
