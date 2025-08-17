// ===== Utilities =====
const pad = (n) => String(n).padStart(2, "0");

function formatDate(d) {
  const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
  const monthDay = d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  return `${weekday}, ${monthDay}`;
}

function getTZLabel() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local Time";
    const offMin = -new Date().getTimezoneOffset(); // ahead of UTC is positive
    const sign = offMin >= 0 ? "+" : "-";
    const hh = Math.floor(Math.abs(offMin) / 60);
    const mm = Math.abs(offMin) % 60;
    return `${tz} (UTC${sign}${pad(hh)}:${pad(mm)})`;
  } catch {
    return "Local Time";
  }
}

function dayProgressPercent(d) {
  const ms = d.getHours() * 3600000 + d.getMinutes() * 60000 + d.getSeconds() * 1000 + d.getMilliseconds();
  return Math.min(100, Math.max(0, (ms / 86400000) * 100));
}

// ===== Elements =====
const elTime = document.getElementById("time");
const elAmPm = document.getElementById("ampm");
const elDate = document.getElementById("date");
const elTZ = document.getElementById("tz");
const elProg = document.getElementById("day-progress");
const chk24h = document.getElementById("toggle-24h");
const selTheme = document.getElementById("theme-select");

// ===== Preferences (localStorage) =====
const PREFS_KEY = "aesthetic-clock-prefs";
const loadPrefs = () => {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; }
  catch { return {}; }
};
const savePrefs = (p) => {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {}
};

const prefs = loadPrefs();
chk24h.checked = Boolean(prefs.use24h);
selTheme.value = prefs.theme || "auto";

// Apply theme
function applyTheme(mode) {
  const root = document.documentElement;
  root.classList.remove("light","dark");
  if (mode === "light") root.classList.add("light");
  else if (mode === "dark") root.classList.add("dark");
  // 'auto' relies on prefers-color-scheme
}
applyTheme(selTheme.value);

// ===== Event handlers =====
chk24h.addEventListener("change", () => {
  prefs.use24h = chk24h.checked;
  savePrefs(prefs);
  update(); // reflect immediately
});

selTheme.addEventListener("change", () => {
  prefs.theme = selTheme.value;
  savePrefs(prefs);
  applyTheme(selTheme.value);
});

// ===== Clock update with exact second alignment =====
function update() {
  const now = new Date();

  // Time
  let hours = now.getHours();
  const mins = now.getMinutes();
  const secs = now.getSeconds();

  let ampm = "";
  if (!chk24h.checked) {
    ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
  }
  elTime.textContent = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  elAmPm.textContent = ampm;

  // Date & TZ
  elDate.textContent = formatDate(now);
  elTZ.textContent = getTZLabel();

  // Day progress
  const pct = dayProgressPercent(now).toFixed(1);
  elProg.textContent = `${pct}% of today`;
}

// Align tick to the next wall-clock second to avoid drift
function scheduleTick() {
  const now = new Date();
  const msToNext = 1000 - now.getMilliseconds();
  setTimeout(() => {
    update();
    scheduleTick();
  }, msToNext);
}

// Initial paint
update();
scheduleTick();
