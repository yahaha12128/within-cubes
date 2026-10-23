"use strict";

/*
 * 方寸格轻量 i18n
 * 语言包以中文原文为键，渲染层通过文本/属性精确匹配自动替换，
 * 动态插入的界面文字由 MutationObserver 继续翻译。
 */
(() => {
  const STORAGE_KEY = "within-cubes.locale";
  const DEFAULT_LOCALE = "zh-CN";
  // “跟随系统”是一个偏好值，不是真正的语言代码；解析后才落到具体语言。
  const SYSTEM_LOCALE = "system";
  const LOCALES = [
    { code: SYSTEM_LOCALE, label: "跟随系统 (Follow System)" },
    { code: "zh-CN", label: "简体中文" },
    { code: "zh-TW", label: "繁體中文" },
    { code: "en", label: "English" },
    { code: "ja", label: "日本語" },
    { code: "fr", label: "Français" },
    { code: "ru", label: "Русский" }
  ];
  const SUPPORTED_LOCALES = LOCALES
    .map((item) => item.code)
    .filter((code) => code !== SYSTEM_LOCALE);
  const ATTRS = ["placeholder", "title", "aria-label", "alt"];
  const SKIP_SELECTOR = [
    "script",
    "style",
    "textarea",
    "input",
    "select",
    "option",
    "code",
    "pre",
    "svg",
    ".icon-sprite",
    "[contenteditable='true']",
    "[data-i18n-skip]",
    ".note-reader-content",
    ".notes-history-row",
    ".scan-file-list",
    ".dashboard-recent-list",
    ".path-value",
    ".file-name",
    ".clipboard-entry-text"
  ].join(",");
  const ATTRIBUTE_SKIP_SELECTOR = [
    "code",
    "pre",
    "svg",
    ".icon-sprite",
    "[data-i18n-skip]",
    ".path-value",
    ".file-name"
  ].join(",");
  const packs = window.__WITHIN_LOCALES__ || {};

  // 桌面组件会渲染 “3 个结果 / 2 个标签 / 2026 年 10 月” 这类拼接文案，
  // 纯字典匹配不到，用模式规则兜住，切换语言时数字保持不变。
  const MONTHS = {
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
    ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"]
  };
  const MONTHS_SHORT = {
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
    ru: ["янв.", "февр.", "мар.", "апр.", "мая", "июн.", "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."]
  };

  function ruPlural(count, one, few, many) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    const word = mod10 === 1 && mod100 !== 11
      ? one
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? few
        : many;
    return `${count} ${word}`;
  }

  const PATTERNS = {
    "zh-TW": [
      [/^已解锁 (\d+) \/ (\d+) · 神秘成就 (\d+) \/ (\d+)$/, (m) => `已解鎖 ${m[1]} / ${m[2]} · 神秘成就 ${m[3]} / ${m[4]}`],
      [/^已解锁 (\d+) \/ (\d+) 个成就$/, (m) => `已解鎖 ${m[1]} / ${m[2]} 個成就`],
      [/^(\d+) 个文件$/, (m) => `${m[1]} 個檔案`],
      [/^当前 (\d+) 个可见$/, (m) => `目前 ${m[1]} 個可見`],
      [/^已选 (\d+) \/ 共 (\d+) 个文件$/, (m) => `已選 ${m[1]} / 共 ${m[2]} 個檔案`],
      [/^共找到 (\d+) 个文件$/, (m) => `共找到 ${m[1]} 個檔案`],
      [/^发现新版本 (v.+)。$/, (m) => `發現新版本 ${m[1]}。`],
      [/^(\d+) 个结果$/, (m) => `${m[1]} 個結果`],
      [/^(\d+) 个中转文件$/, (m) => `${m[1]} 個中轉檔案`],
      [/^(\d+) 项待办$/, (m) => `${m[1]} 項待辦`],
      [/^(\d+) 项$/, (m) => `${m[1]} 項`],
      [/^(\d+) 个标签$/, (m) => `${m[1]} 個標籤`],
      [/^(\d+) 年 (\d+) 月$/, (m) => `${m[1]} 年 ${m[2]} 月`],
      [/^(\d+)月(\d+)日$/, (m) => `${m[1]}月${m[2]}日`],
      [/^今天 (\d{1,2}:\d{2})$/, (m) => `今天 ${m[1]}`],
      [/^今天 (\d{1,2}\/\d{1,2})$/, (m) => `今天 ${m[1]}`],
      [/^(\d+) 分钟$/, (m) => `${m[1]} 分鐘`],
      [/^已选择 (\d+) 项$/, (m) => `已選 ${m[1]} 項`]
    ],
    en: [
      [/^已解锁 (\d+) \/ (\d+) · 神秘成就 (\d+) \/ (\d+)$/, (m) => `Unlocked ${m[1]} / ${m[2]} · Secret ${m[3]} / ${m[4]}`],
      [/^已解锁 (\d+) \/ (\d+) 个成就$/, (m) => `Unlocked ${m[1]} / ${m[2]} achievements`],
      [/^(\d+) 个文件$/, (m) => `${m[1]} ${m[1] === "1" ? "file" : "files"}`],
      [/^当前 (\d+) 个可见$/, (m) => `${m[1]} visible now`],
      [/^已选 (\d+) \/ 共 (\d+) 个文件$/, (m) => `Selected ${m[1]} / ${m[2]} files`],
      [/^共找到 (\d+) 个文件$/, (m) => `Found ${m[1]} ${m[1] === "1" ? "file" : "files"}`],
      [/^发现新版本 (v.+)。$/, (m) => `New version ${m[1]} available.`],
      [/^(\d+) 个结果$/, (m) => `${m[1]} ${m[1] === "1" ? "result" : "results"}`],
      [/^(\d+) 个中转文件$/, (m) => `${m[1]} ${m[1] === "1" ? "item" : "items"} in Quick Drop`],
      [/^(\d+) 项待办$/, (m) => `${m[1]} ${m[1] === "1" ? "task" : "tasks"}`],
      [/^(\d+) 项$/, (m) => `${m[1]} ${m[1] === "1" ? "item" : "items"}`],
      [/^(\d+) 个标签$/, (m) => `${m[1]} ${m[1] === "1" ? "tab" : "tabs"}`],
      [/^(\d+) 年 (\d+) 月$/, (m) => `${MONTHS.en[Number(m[2]) - 1] || m[2]} ${m[1]}`],
      [/^(\d+)月(\d+)日$/, (m) => `${MONTHS_SHORT.en[Number(m[1]) - 1] || m[1]} ${m[2]}`],
      [/^今天 (\d{1,2}:\d{2})$/, (m) => `Today ${m[1]}`],
      [/^今天 (\d{1,2}\/\d{1,2})$/, (m) => `Today ${m[1]}`],
      [/^(\d+) 分钟$/, (m) => `${m[1]} min`],
      [/^已选择 (\d+) 项$/, (m) => `${m[1]} selected`]
    ],
    ja: [
      [/^已解锁 (\d+) \/ (\d+) · 神秘成就 (\d+) \/ (\d+)$/, (m) => `実績 ${m[1]} / ${m[2]} 解除 · シークレット ${m[3]} / ${m[4]}`],
      [/^已解锁 (\d+) \/ (\d+) 个成就$/, (m) => `実績 ${m[1]} / ${m[2]} 解除`],
      [/^(\d+) 个文件$/, (m) => `${m[1]} ファイル`],
      [/^当前 (\d+) 个可见$/, (m) => `現在 ${m[1]} 個表示`],
      [/^已选 (\d+) \/ 共 (\d+) 个文件$/, (m) => `${m[1]} / ${m[2]} ファイルを選択`],
      [/^共找到 (\d+) 个文件$/, (m) => `${m[1]} ファイルが見つかりました`],
      [/^发现新版本 (v.+)。$/, (m) => `新しいバージョン ${m[1]} があります。`],
      [/^(\d+) 个结果$/, (m) => `${m[1]} 件の結果`],
      [/^(\d+) 个中转文件$/, (m) => `${m[1]} 個の一時ファイル`],
      [/^(\d+) 项待办$/, (m) => `${m[1]} 件のタスク`],
      [/^(\d+) 项$/, (m) => `${m[1]} 件`],
      [/^(\d+) 个标签$/, (m) => `${m[1]} 個のタブ`],
      [/^(\d+) 年 (\d+) 月$/, (m) => `${m[1]}年${m[2]}月`],
      [/^(\d+)月(\d+)日$/, (m) => `${m[1]}月${m[2]}日`],
      [/^今天 (\d{1,2}:\d{2})$/, (m) => `今日 ${m[1]}`],
      [/^今天 (\d{1,2}\/\d{1,2})$/, (m) => `今日 ${m[1]}`],
      [/^(\d+) 分钟$/, (m) => `${m[1]} 分`],
      [/^已选择 (\d+) 项$/, (m) => `${m[1]} 件を選択`]
    ],
    fr: [
      [/^已解锁 (\d+) \/ (\d+) · 神秘成就 (\d+) \/ (\d+)$/, (m) => `${m[1]} / ${m[2]} succès · ${m[3]} / ${m[4]} secrets`],
      [/^已解锁 (\d+) \/ (\d+) 个成就$/, (m) => `${m[1]} / ${m[2]} succès débloqués`],
      [/^(\d+) 个文件$/, (m) => `${m[1]} ${m[1] === "1" ? "fichier" : "fichiers"}`],
      [/^当前 (\d+) 个可见$/, (m) => `${m[1]} visible${m[1] === "1" ? "" : "s"} actuellement`],
      [/^已选 (\d+) \/ 共 (\d+) 个文件$/, (m) => `${m[1]} / ${m[2]} fichiers sélectionnés`],
      [/^共找到 (\d+) 个文件$/, (m) => `${m[1]} ${m[1] === "1" ? "fichier trouvé" : "fichiers trouvés"}`],
      [/^发现新版本 (v.+)。$/, (m) => `Nouvelle version ${m[1]} disponible.`],
      [/^(\d+) 个结果$/, (m) => `${m[1]} ${m[1] === "1" ? "résultat" : "résultats"}`],
      [/^(\d+) 个中转文件$/, (m) => `${m[1]} fichier${m[1] === "1" ? "" : "s"} en dépôt`],
      [/^(\d+) 项待办$/, (m) => `${m[1]} ${m[1] === "1" ? "tâche" : "tâches"}`],
      [/^(\d+) 项$/, (m) => `${m[1]} élément${m[1] === "1" ? "" : "s"}`],
      [/^(\d+) 个标签$/, (m) => `${m[1]} onglet${m[1] === "1" ? "" : "s"}`],
      [/^(\d+) 年 (\d+) 月$/, (m) => `${MONTHS.fr[Number(m[2]) - 1] || m[2]} ${m[1]}`],
      [/^(\d+)月(\d+)日$/, (m) => `${Number(m[2])} ${MONTHS_SHORT.fr[Number(m[1]) - 1] || m[1]}`],
      [/^今天 (\d{1,2}:\d{2})$/, (m) => `Aujourd'hui ${m[1]}`],
      [/^今天 (\d{1,2}\/\d{1,2})$/, (m) => `Aujourd'hui ${m[1]}`],
      [/^(\d+) 分钟$/, (m) => `${m[1]} min`],
      [/^已选择 (\d+) 项$/, (m) => `${m[1]} sélectionné${m[1] === "1" ? "" : "s"}`]
    ],
    ru: [
      [/^已解锁 (\d+) \/ (\d+) · 神秘成就 (\d+) \/ (\d+)$/, (m) => `Открыто ${m[1]} / ${m[2]} · Секретных ${m[3]} / ${m[4]}`],
      [/^已解锁 (\d+) \/ (\d+) 个成就$/, (m) => `Открыто ${m[1]} / ${m[2]} достижений`],
      [/^(\d+) 个文件$/, (m) => `${m[1]} ${m[1] === "1" ? "файл" : "файлов"}`],
      [/^当前 (\d+) 个可见$/, (m) => `Сейчас видно: ${m[1]}`],
      [/^已选 (\d+) \/ 共 (\d+) 个文件$/, (m) => `Выбрано ${m[1]} / ${m[2]} файлов`],
      [/^共找到 (\d+) 个文件$/, (m) => `Найдено ${m[1]} ${m[1] === "1" ? "файл" : "файлов"}`],
      [/^发现新版本 (v.+)。$/, (m) => `Доступна новая версия ${m[1]}.`],
      [/^(\d+) 个结果$/, (m) => ruPlural(Number(m[1]), "результат", "результата", "результатов")],
      [/^(\d+) 个中转文件$/, (m) => `${ruPlural(Number(m[1]), "файл", "файла", "файлов")} во временном хранилище`],
      [/^(\d+) 项待办$/, (m) => ruPlural(Number(m[1]), "задача", "задачи", "задач")],
      [/^(\d+) 项$/, (m) => ruPlural(Number(m[1]), "элемент", "элемента", "элементов")],
      [/^(\d+) 个标签$/, (m) => ruPlural(Number(m[1]), "вкладка", "вкладки", "вкладок")],
      [/^(\d+) 年 (\d+) 月$/, (m) => `${MONTHS.ru[Number(m[2]) - 1] || m[2]} ${m[1]}`],
      [/^(\d+)月(\d+)日$/, (m) => `${m[2]} ${MONTHS_SHORT.ru[Number(m[1]) - 1] || m[1]}`],
      [/^今天 (\d{1,2}:\d{2})$/, (m) => `Сегодня ${m[1]}`],
      [/^今天 (\d{1,2}\/\d{1,2})$/, (m) => `Сегодня ${m[1]}`],
      [/^(\d+) 分钟$/, (m) => `${m[1]} мин`],
      [/^已选择 (\d+) 项$/, (m) => `Выбрано: ${m[1]}`]
    ]
  };
  const textStates = new WeakMap();
  const attrStates = new WeakMap();
  let preference = readStoredPreference();
  let currentLocale = resolveLocale(preference);
  let observer = null;
  let reverseIndex = null;

  // 把 navigator / 主进程给的语言标记收敛到受支持的语言上。
  function normalizeLocaleTag(tag) {
    const raw = String(tag || "").trim().toLowerCase();
    if (!raw) return DEFAULT_LOCALE;
    if (raw.startsWith("zh")) {
      return /(^|[-_])(tw|hk|mo|hant)([-_]|$)/.test(raw) ? "zh-TW" : "zh-CN";
    }
    if (raw.startsWith("ja")) return "ja";
    if (raw.startsWith("fr")) return "fr";
    if (raw.startsWith("ru")) return "ru";
    if (raw.startsWith("en")) return "en";
    return "en";
  }

  function getSystemLocale() {
    const candidates = [window.__WITHIN_SYSTEM_LOCALE__];
    if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
    candidates.push(navigator.language);

    for (const candidate of candidates) {
      if (candidate) return normalizeLocaleTag(candidate);
    }

    return DEFAULT_LOCALE;
  }

  function resolveLocale(nextPreference) {
    if (nextPreference === SYSTEM_LOCALE) return getSystemLocale();
    if (SUPPORTED_LOCALES.includes(nextPreference)) return nextPreference;
    return DEFAULT_LOCALE;
  }

  function readStoredPreference() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === SYSTEM_LOCALE || SUPPORTED_LOCALES.includes(saved)) {
        return saved;
      }
    } catch (error) {
      // localStorage may be unavailable in hardened environments.
    }

    // 默认跟随系统语言，而不是写死简体中文。
    return SYSTEM_LOCALE;
  }

  function getPack(locale = currentLocale) {
    return packs[locale] || {};
  }

  // 组件会把已经翻译过的文案（例如折叠摘要里的“专注中”）再写回 DOM。
  // 建立反向索引，把这类值还原成中文源文，避免切回中文时残留英文。
  function getReverseIndex() {
    if (reverseIndex) return reverseIndex;

    reverseIndex = new Map();
    if (currentLocale === DEFAULT_LOCALE) return reverseIndex;

    for (const [source, target] of Object.entries(getPack())) {
      if (target && !reverseIndex.has(target)) {
        reverseIndex.set(target, source);
      }
    }

    return reverseIndex;
  }

  function canonicalSource(value) {
    const text = String(value);
    const trimmed = text.trim();
    if (!trimmed || currentLocale === DEFAULT_LOCALE) return text;

    const source = getReverseIndex().get(trimmed);
    if (!source) return text;

    return text.replace(trimmed, source);
  }

  function t(source) {
    if (!source) return source;
    if (currentLocale === DEFAULT_LOCALE) return source;

    const direct = getPack()[source];
    if (direct) return direct;

    const patterns = PATTERNS[currentLocale] || [];

    for (const [pattern, build] of patterns) {
      const match = pattern.exec(source);
      if (match) return build(match);
    }

    return source;
  }

  function isSkipped(node) {
    const element = node && node.nodeType === Node.TEXT_NODE
      ? node.parentElement
      : node;

    return Boolean(element && element.closest && element.closest(SKIP_SELECTOR));
  }

  function translateValue(value) {
    const trimmed = String(value).trim();
    if (!trimmed) return value;

    const translated = t(trimmed);
    if (translated === trimmed) return value;

    const leading = String(value).match(/^\s*/)[0];
    const trailing = String(value).match(/\s*$/)[0];
    return leading + translated + trailing;
  }

  function translateTextNode(node) {
    if (!node || !node.nodeValue || !node.nodeValue.trim() || isSkipped(node)) {
      return;
    }

    let state = textStates.get(node);

    if (!state) {
      const source = canonicalSource(node.nodeValue);
      state = { source, rendered: node.nodeValue };
      textStates.set(node, state);
    } else if (node.nodeValue !== state.rendered) {
      // The application replaced the text since our last pass; use the new
      // Chinese source so later language switches translate the right value.
      // 有些组件会把“已翻译过”的文案再写回来，这里先还原成中文源文。
      state.source = canonicalSource(node.nodeValue);
    }

    const next = translateValue(state.source);
    state.rendered = next;

    if (node.nodeValue !== next) {
      node.nodeValue = next;
    }
  }

  function translateElementAttributes(element) {
    if (
      !element ||
      element.nodeType !== Node.ELEMENT_NODE ||
      (element.closest && element.closest(ATTRIBUTE_SKIP_SELECTOR))
    ) {
      return;
    }

    let sources = attrStates.get(element);

    if (!sources) {
      sources = {};
      attrStates.set(element, sources);
    }

    for (const attr of ATTRS) {
      if (!element.hasAttribute(attr)) continue;

      if (!(attr in sources)) {
        sources[attr] = element.getAttribute(attr);
      }

      const next = translateValue(sources[attr]);
      if (element.getAttribute(attr) !== next) {
        element.setAttribute(attr, next);
      }
    }
  }

  function apply(root = document.body) {
    if (!root) return;

    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) {
      return;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();

    while (node) {
      translateTextNode(node);
      node = walker.nextNode();
    }

    if (root.nodeType === Node.ELEMENT_NODE) {
      translateElementAttributes(root);
    }

    root.querySelectorAll("[placeholder], [title], [aria-label], [alt]").forEach(
      translateElementAttributes
    );
  }

  function observe() {
    if (!document.body || observer) return;

    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          translateTextNode(mutation.target);
          continue;
        }

        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            translateTextNode(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            apply(node);
          }
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function syncDocumentLanguage() {
    document.documentElement.lang = currentLocale;
  }

  /**
   * 应用一个语言偏好（"system" 或具体语言代码）。
   * - persist：是否写入 localStorage（跨窗口 storage 事件据此同步）
   * - broadcast：是否通知主进程，由主进程推给其它窗口
   */
  function applyPreference(nextPreference, { persist = true, broadcast = true } = {}) {
    const next = nextPreference === SYSTEM_LOCALE
      ? SYSTEM_LOCALE
      : (SUPPORTED_LOCALES.includes(nextPreference) ? nextPreference : SYSTEM_LOCALE);
    const nextLocale = resolveLocale(next);

    preference = next;
    currentLocale = nextLocale;
    reverseIndex = null;
    syncDocumentLanguage();

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (error) {
        // Ignore storage failures; the switch still applies to this session.
      }
    }

    apply(document.body);

    if (broadcast) {
      // 主窗口把偏好交给主进程，主进程再广播给全屏桌面层。
      try {
        if (window.desktopOrganizer && typeof window.desktopOrganizer.setLocalePreference === "function") {
          window.desktopOrganizer.setLocalePreference(next);
        }
      } catch (error) {
        // 桌面层没有这个桥接，忽略即可。
      }
    }

    window.dispatchEvent(
      new CustomEvent("within-locale-changed", {
        detail: { locale: nextLocale, preference: next }
      })
    );

    return nextLocale;
  }

  // 兼容旧调用：传 "system" 或语言代码都可以，返回真正生效的语言。
  function setLocale(code) {
    return applyPreference(code);
  }

  // 外部（主进程 / 另一个窗口）指定的语言，不再回传，避免循环。
  function syncLocale(nextPreference) {
    if (nextPreference === preference && resolveLocale(nextPreference) === currentLocale) {
      return currentLocale;
    }

    return applyPreference(nextPreference, { persist: true, broadcast: false });
  }

  function init() {
    syncDocumentLanguage();
    apply(document.body);
    observe();

    // 系统语言在运行中变化时，跟随系统模式要立刻重算。
    window.addEventListener("languagechange", () => {
      if (preference !== SYSTEM_LOCALE) return;
      applyPreference(SYSTEM_LOCALE, { persist: false, broadcast: false });
    });

    // 同一分区内的其它窗口改了语言（file:// 下 storage 事件不一定触发，
    // desktop 层还有 IPC 兜底）。
    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      if (event.newValue === preference) return;
      syncLocale(event.newValue);
    });
  }

  window.withinI18n = {
    t,
    apply,
    setLocale,
    syncLocale,
    getLocale: () => currentLocale,
    getPreference: () => preference,
    getSystemLocale,
    resolveLocale,
    getLocales: () => LOCALES.map((item) => ({ ...item })),
    getPack: (locale) => ({ ...getPack(locale) })
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
