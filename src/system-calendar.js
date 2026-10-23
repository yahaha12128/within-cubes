"use strict";

const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);
const MAX_ICS_FILES = 40;
const MAX_EVENTS = 100;
let outlookUnavailable = false;

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDateKey(date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function unescapeIcsText(value) {
  return String(value || "")
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseIcsDate(value, params = "") {
  const raw = String(value || "").trim();
  const plain = raw.replace(/^"|"$/g, "");
  const dateOnly = /^\d{8}$/.test(plain);
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(plain);

  if (!match) return null;

  const [, year, month, day, hour = "00", minute = "00", second = "00", utc] = match;
  const date = utc
    ? new Date(Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    ))
    : new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );

  if (Number.isNaN(date.getTime())) return null;

  return {
    date,
    allDay: dateOnly || !match[4]
  };
}

function unfoldIcsLines(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n[ \t]/g, "");
}

function parseIcsEvents(text, { from = new Date(), to = new Date(Date.now() + 7 * 86400000) } = {}) {
  const lines = unfoldIcsLines(text).split("\n");
  const events = [];
  let current = null;

  const finishEvent = () => {
    if (!current || !current.start) {
      current = null;
      return;
    }

    if (current.start.date >= from && current.start.date <= to) {
      events.push({
        uid: current.uid || "",
        title: unescapeIcsText(current.summary || "未命名日程").trim() || "未命名日程",
        start: current.start.date.toISOString(),
        end: current.end ? current.end.date.toISOString() : null,
        allDay: current.start.allDay,
        location: unescapeIcsText(current.location || "").trim(),
        source: "ics"
      });
    }

    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "BEGIN:VEVENT") {
      current = {};
      continue;
    }

    if (trimmed === "END:VEVENT") {
      finishEvent();
      continue;
    }

    if (!current) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const keyPart = line.slice(0, separator);
    const value = line.slice(separator + 1);
    const [key, ...paramParts] = keyPart.split(";");
    const params = paramParts.join(";");

    if (key === "DTSTART") {
      current.start = parseIcsDate(value, params);
    } else if (key === "DTEND") {
      current.end = parseIcsDate(value, params);
    } else if (key === "SUMMARY") {
      current.summary = value;
    } else if (key === "UID") {
      current.uid = value;
    } else if (key === "LOCATION") {
      current.location = value;
    }
  }

  finishEvent();

  return events.sort((left, right) => (
    new Date(left.start).getTime() - new Date(right.start).getTime()
  ));
}

function normalizeOutlookEvents(events, from, to) {
  if (!Array.isArray(events)) return [];

  const list = [];

  for (const event of events) {
    if (!event || !event.subject) continue;

    const start = new Date(event.start);
    if (Number.isNaN(start.getTime())) continue;
    if (start < from || start > to) continue;

    const end = new Date(event.end);
    list.push({
      uid: String(event.entryId || event.id || ""),
      title: String(event.subject).trim() || "未命名日程",
      start: start.toISOString(),
      end: Number.isNaN(end.getTime()) ? null : end.toISOString(),
      allDay: Boolean(event.allDay),
      location: String(event.location || "").trim(),
      source: "outlook"
    });
  }

  return list.sort((left, right) => (
    new Date(left.start).getTime() - new Date(right.start).getTime()
  ));
}

async function readOutlookEvents(from, to) {
  if (process.platform !== "win32" || outlookUnavailable) return null;

  const startText = from.toISOString();
  const endText = to.toISOString();
  const script = `
$ErrorActionPreference = 'Stop'
try {
  $outlook = New-Object -ComObject Outlook.Application
  $namespace = $outlook.GetNamespace('MAPI')
  $folder = $namespace.GetDefaultFolder(9)
  $items = $folder.Items
  try { $items.IncludeRecurrences = $true } catch {}
  try { $items.Sort('[Start]') } catch {}
  $from = [datetime]::Parse('${startText}').ToLocalTime()
  $to = [datetime]::Parse('${endText}').ToLocalTime()
  $result = @()
  $count = 0
  foreach ($item in $items) {
    $count++
    if ($count -gt 600) { break }
    try {
      $start = [datetime]$item.Start
      if ($start -lt $from -or $start -gt $to) { continue }
      $result += [pscustomobject]@{
        subject = [string]$item.Subject
        start = $start.ToString('o')
        end = ([datetime]$item.End).ToString('o')
        location = [string]$item.Location
        allDay = [bool]$item.AllDayEvent
        entryId = [string]$item.EntryID
      }
    } catch {}
  }
  ConvertTo-Json -InputObject $result -Compress -Depth 4
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
`;

  try {
    const { stdout } = await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { timeout: 6000, windowsHide: true, maxBuffer: 1024 * 1024 }
    );
    const parsed = JSON.parse(stdout.trim() || "[]");
    return normalizeOutlookEvents(Array.isArray(parsed) ? parsed : [parsed], from, to);
  } catch (error) {
    // Remember the failure so the next import goes straight to .ics files.
    outlookUnavailable = true;
    return null;
  }
}

async function collectIcsFiles(directory, depth, files) {
  if (files.length >= MAX_ICS_FILES || depth < 0) return;

  let entries = [];

  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    return;
  }

  for (const entry of entries) {
    if (files.length >= MAX_ICS_FILES) return;

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith(".")) continue;
      await collectIcsFiles(fullPath, depth - 1, files);
      continue;
    }

    if (entry.isFile() && /\.ics$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
}

async function readIcsEvents(from, to) {
  const home = os.homedir();
  const candidates = [
    path.join(home, "Documents"),
    path.join(home, "OneDrive", "Documents"),
    path.join(home, "Desktop"),
    path.join(home, "Downloads")
  ];
  const files = [];

  for (const directory of candidates) {
    await collectIcsFiles(directory, 3, files);
  }

  const events = [];
  const seen = new Set();

  for (const file of files.slice(0, MAX_ICS_FILES)) {
    let text = "";

    try {
      text = await fs.readFile(file, "utf8");
    } catch (error) {
      continue;
    }

    for (const event of parseIcsEvents(text, { from, to })) {
      const key = `${event.uid || event.title}\u0000${event.start}`;
      if (seen.has(key)) continue;
      seen.add(key);
      events.push({ ...event, source: "ics" });
    }
  }

  events.sort((left, right) => (
    new Date(left.start).getTime() - new Date(right.start).getTime()
  ));

  return events.length > 0 ? events.slice(0, MAX_EVENTS) : null;
}

async function readSystemCalendar({ days = 7, now = new Date() } = {}) {
  const from = new Date(now.getTime());
  const to = new Date(now.getTime() + Math.max(1, Math.min(30, days)) * 86400000);

  const outlookEvents = await readOutlookEvents(from, to);

  if (outlookEvents && outlookEvents.length > 0) {
    return {
      ok: true,
      source: "outlook",
      sourceLabel: "Outlook 日历",
      events: outlookEvents.slice(0, MAX_EVENTS)
    };
  }

  const icsEvents = await readIcsEvents(from, to);

  if (icsEvents && icsEvents.length > 0) {
    return {
      ok: true,
      source: "ics",
      sourceLabel: ".ics 日历",
      events: icsEvents
    };
  }

  return {
    ok: false,
    source: null,
    sourceLabel: "",
    events: [],
    error: "没有找到可读取的系统日历。支持 Outlook 桌面日历，或文档/桌面中的 .ics 日历文件。"
  };
}

module.exports = {
  MAX_EVENTS,
  parseIcsDate,
  parseIcsEvents,
  normalizeOutlookEvents,
  readSystemCalendar
};
