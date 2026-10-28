// App Lock - shared by the website (index.html), the Chrome extension (popup.html) and the Android app.
// Builds the page, then talks to the App Lock helper: on Windows at localhost:8765,
// inside the Android app through the app's private window.AppLockAndroid bridge.
document.getElementById("app").innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-lock" viewBox="0 0 24 24"><rect x="4" y="10.5" width="16" height="11" rx="3" fill="currentColor"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></symbol>
  <symbol id="i-refresh" viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></symbol>
</svg>

<div class="wrap">
  <div class="top">
    <div class="brand">
      <div class="brand-mark"><svg width="22" height="22"><use href="#i-lock"/></svg></div>
      <div><h1>App Lock</h1><p>Lock distracting apps for a set time.</p></div>
    </div>
    <span class="pill" id="stateTag"><span class="dot"></span><span id="stateText">Ready</span></span>
  </div>

  <div class="setup" id="setup" hidden>
    <p><b>One more step: turn on App Lock's blocking.</b> Android only lets apps block other apps through Accessibility. Tap the button, open <b>Installed apps → App Lock</b>, and switch it on.</p>
    <p>If the switch is greyed out: go to Settings → Apps → App Lock, tap <b>⋮</b> (top right) → <b>Allow restricted settings</b>, then try again.</p>
    <div class="row"><button class="btn" id="a11yBtn" type="button"><svg width="16" height="16"><use href="#i-lock"/></svg>Open Accessibility settings</button></div>
  </div>

  <p class="offline" id="offlineAndroid" hidden><svg width="22" height="22"><use href="#i-lock"/></svg><span><b>On Android, App Lock works through its app.</b> A browser can't block other apps, so blocking is done by the App Lock app. <a href="https://github.com/muhammada1012000-ui/app-lock/releases/download/android-latest/AppLock.apk" style="color:inherit">Download the App Lock app (APK)</a>, install it, then open it. <a href="intent://open#Intent;scheme=applock;package=io.github.muhammada1012000ui.applock;end" style="color:inherit">Already installed? Open App Lock.</a></span></p>

  <p class="offline" id="offline" hidden><svg width="22" height="22"><use href="#i-lock"/></svg><span><b>App Lock needs its helper on this PC.</b> It closes the apps, because a web page can't do that by itself. One-time setup: <a href="https://github.com/muhammada1012000-ui/app-lock#install" target="_blank" rel="noopener" style="color:inherit">download App Lock and run Install.ps1</a>. If your browser asked to allow access to devices on your network, click <b>Allow</b> and reload this page.</span></p>

  <div class="grid" id="grid">
    <aside class="dial-card">
      <div class="dial">
        <svg viewBox="0 0 260 260" aria-hidden="true">
          <defs>
            <linearGradient id="brassGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#f6c878"/><stop offset="1" stop-color="#c7832a"/>
            </linearGradient>
          </defs>
          <circle class="ticks" cx="130" cy="130" r="122" stroke-dasharray="1 11.77"/>
          <circle class="track" cx="130" cy="130" r="104"/>
          <circle class="arc" id="arc" cx="130" cy="130" r="104"/>
        </svg>
        <div class="dial-center">
          <svg class="lock-ic" width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="10.5" width="16" height="11" rx="3" fill="currentColor"/>
            <path class="shackle" d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4"/>
          </svg>
          <div class="big" id="bigTime">0:45:00</div>
          <div class="big-label" id="bigLabel">Lock length</div>
        </div>
      </div>
      <p class="until" id="until"></p>
      <div class="tags" id="tags"></div>
      <p class="warnbox" id="edgeWarn" hidden></p>
      <button class="btn-start" id="startBtn" type="button"><svg width="18" height="18"><use href="#i-lock"/></svg>Start lock</button>
      <p class="closing-note" id="closingNote" hidden>You can close this tab. The lock keeps running in the background.</p>
      <p class="msg" id="msg" role="status"></p>
    </aside>

    <div class="steps">
      <section class="panel">
        <div class="panel-head">
          <h2><span class="num">1</span>Choose apps to lock</h2>
          <span class="count" id="count"></span>
        </div>
        <p class="sub-h" id="runningTitle">Open right now</p>
        <div class="apps" id="running"></div>
        <p class="sub-h" id="commonTitle">Popular apps</p>
        <div class="apps" id="common"></div>
        <div class="row">
          <div class="field">
            <svg width="16" height="16"><use href="#i-search"/></svg>
            <input type="text" id="customName" placeholder="Add another app, e.g. notepad" aria-label="App name">
          </div>
          <button class="btn" id="addBtn" type="button"><svg width="16" height="16"><use href="#i-plus"/></svg>Add</button>
          <button class="btn btn-ghost" id="refreshBtn" type="button"><svg width="16" height="16"><use href="#i-refresh"/></svg>Refresh</button>
        </div>
        <p class="hint" id="appsHint">Not listed? Open the app and click Refresh. Or find its name in Task Manager (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Esc</kbd>) → Details, and type it without “.exe”.</p>
      </section>

      <section class="panel">
        <div class="panel-head"><h2><span class="num">2</span>Set the timer</h2></div>
        <div class="presets" id="presets"></div>
        <div class="stepper-row">
          <div class="stepper">
            <button type="button" data-step="hrs" data-d="-1" aria-label="One hour less">−</button>
            <input type="number" id="hrs" min="0" max="23" value="0" aria-label="Hours">
            <button type="button" data-step="hrs" data-d="1" aria-label="One hour more">+</button>
            <label for="hrs">hours</label>
          </div>
          <div class="stepper">
            <button type="button" data-step="mins" data-d="-5" aria-label="Five minutes less">−</button>
            <input type="number" id="mins" min="0" max="59" value="45" aria-label="Minutes">
            <button type="button" data-step="mins" data-d="5" aria-label="Five minutes more">+</button>
            <label for="mins">minutes</label>
          </div>
        </div>
      </section>
    </div>
  </div>
</div>

<div class="overlay" id="confirm" hidden>
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
    <h3 id="confirmTitle">Ready to lock?</h3>
    <div class="tags" id="confirmTags" style="justify-content:flex-start"></div>
    <p id="confirmText"></p>
    <div class="row">
      <button class="btn btn-ghost" id="noBtn" type="button">Cancel</button>
      <button class="btn-start" id="yesBtn" type="button"><svg width="16" height="16"><use href="#i-lock"/></svg>Lock now</button>
    </div>
  </div>
</div>`;

var COMMON = [
  { n: "Discord", p: "Discord", c: "#5865F2" }, { n: "Steam", p: "steam", c: "#2a475e" }, { n: "Roblox", p: "RobloxPlayerBeta", c: "#d8261c" },
  { n: "Spotify", p: "Spotify", c: "#1aa34a" }, { n: "WhatsApp", p: "WhatsApp", c: "#1fae54" }, { n: "Telegram", p: "Telegram", c: "#229ED9" },
  { n: "Chrome", p: "chrome", c: "#3b78e7" }, { n: "Firefox", p: "firefox", c: "#e8622c" }, { n: "Edge", p: "msedge", c: "#0c6fb8" },
  { n: "Epic Games", p: "EpicGamesLauncher", c: "#3c3c3c" }, { n: "Minecraft", p: "MinecraftLauncher", c: "#4f9a5f" },
  { n: "Valorant / Riot", p: "RiotClientServices", c: "#d13639" }, { n: "Fortnite", p: "FortniteClient-Win64-Shipping", c: "#8a45e6" },
  { n: "Xbox", p: "XboxPcApp", c: "#107C10" }, { n: "Teams", p: "ms-teams", c: "#5059C9" }, { n: "Slack", p: "slack", c: "#7c3085" }
];
// Where this screen is running
var BRIDGE = window.AppLockAndroid || null;   // only exists inside the Android app
var IS_ANDROID_APP = !!BRIDGE;
var IS_ANDROID_WEB = !BRIDGE && /Android/i.test(navigator.userAgent);
var ICONS = {};                               // package name -> icon (Android app)
if (IS_ANDROID_APP) COMMON = [];              // Android lists the apps actually installed instead
var PALETTE = ["#3d7ea6", "#9a5bb5", "#c2563f", "#3f9a86", "#b5832a", "#5a6cc4", "#b04a77", "#4c8f3f"];
var PRESETS = [15, 25, 45, 60, 90, 120, 180];
var CIRC = 2 * Math.PI * 104;
var $ = function (id) { return document.getElementById(id); };
var picked = {}, names = {}, custom = [], running = [], server = { locked: false }, lockTotal = 0;

try {
  var saved = JSON.parse(localStorage.getItem("applock") || "null");
  if (saved) { picked = saved.picked || {}; custom = saved.custom || []; $("hrs").value = saved.h || 0; $("mins").value = saved.m != null ? saved.m : 45; lockTotal = saved.total || 0; }
} catch (e) {}
function save() { try { localStorage.setItem("applock", JSON.stringify({ picked: picked, custom: custom, h: $("hrs").value, m: $("mins").value, total: lockTotal })); } catch (e) {} }

// The browser showing this page, so we can warn before it locks itself
var THIS_BROWSER = /Edg\//.test(navigator.userAgent) ? { n: "Microsoft Edge", p: "msedge" }
  : /Firefox\//.test(navigator.userAgent) ? { n: "Firefox", p: "firefox" }
  : { n: "Google Chrome", p: "chrome" };
var API_BASE = location.hostname === "localhost" && location.port === "8765" ? "" : "http://localhost:8765";
// Android app: requests go over a message channel the app only opens for its own built-in page
var bridgeSeq = 0, bridgeWaiting = {};
if (BRIDGE) BRIDGE.onmessage = function (e) {
  var r = JSON.parse(e.data), w = bridgeWaiting[r.id];
  if (!w) return;
  delete bridgeWaiting[r.id];
  if (r.error) w.reject(new Error(r.error)); else w.resolve(r.data);
};
function api(path, body) {
  if (BRIDGE) {
    return new Promise(function (resolve, reject) {
      var id = ++bridgeSeq;
      bridgeWaiting[id] = { resolve: resolve, reject: reject };
      BRIDGE.postMessage(JSON.stringify({ id: id, path: path, body: body || null }));
    });
  }
  // Android browsers can't reach a Windows helper; the page points to the Android app instead
  if (IS_ANDROID_WEB) return Promise.reject(new Error("Use the App Lock app on Android."));
  return fetch(API_BASE + "/api/" + path, {
    method: body ? "POST" : "GET",
    headers: { "X-AppLock": "1", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "Something went wrong."); return j; }); });
}

function colorFor(p) {
  var known = COMMON.find(function (a) { return a.p.toLowerCase() === p.toLowerCase(); });
  if (known) return known.c;
  var h = 0; for (var i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function avatar(name, p) {
  if (ICONS[p.toLowerCase()]) {
    var img = document.createElement("img"); img.className = "av"; img.alt = "";
    img.src = ICONS[p.toLowerCase()];
    return img;
  }
  var s = document.createElement("span"); s.className = "av";
  s.style.background = colorFor(p);
  s.textContent = (name.replace(/[^A-Za-z0-9]/g, "")[0] || "?").toUpperCase();
  return s;
}
function lookup(k) {
  return COMMON.concat(running, custom).find(function (x) { return x.p.toLowerCase() === k; });
}

function appTile(a) {
  names[a.p.toLowerCase()] = a.n;
  var d = document.createElement("div"); d.className = "app";
  var id = "app-" + a.p.replace(/[^A-Za-z0-9_-]/g, "_");
  d.innerHTML = '<input type="checkbox" id="' + id + '"><label for="' + id + '"><span class="check"><svg width="12" height="12"><use href="#i-check"/></svg></span><span class="n"></span><span class="p"></span></label>';
  var label = d.querySelector("label");
  label.insertBefore(avatar(a.n, a.p), label.querySelector(".n"));
  d.querySelector(".n").textContent = a.n;
  d.querySelector(".p").textContent = IS_ANDROID_APP ? a.p : a.p + ".exe";
  d.dataset.search = (a.n + " " + a.p).toLowerCase();
  var cb = d.querySelector("input"); cb.checked = !!picked[a.p.toLowerCase()];
  cb.addEventListener("change", function () { picked[a.p.toLowerCase()] = cb.checked; sync(); });
  return d;
}
function renderApps() {
  var commonSet = {}; COMMON.forEach(function (a) { commonSet[a.p.toLowerCase()] = 1; });
  var r = $("running"); r.innerHTML = "";
  var extra = running.concat(custom).filter(function (a, i, arr) {
    var k = a.p.toLowerCase();
    return !commonSet[k] && arr.findIndex(function (b) { return b.p.toLowerCase() === k; }) === i;
  });
  if (!extra.length) { var h = document.createElement("p"); h.className = "empty"; h.textContent = IS_ANDROID_APP ? "Loading your apps…" : "No other open apps found. Open one and click Refresh."; r.appendChild(h); }
  extra.forEach(function (a) { r.appendChild(appTile(a)); });
  filterApps();
  var c = $("common"); c.innerHTML = "";
  COMMON.forEach(function (a) { c.appendChild(appTile(a)); });
}
function pickedList() {
  return Object.keys(picked).filter(function (k) { return picked[k]; }).map(function (k) {
    var a = lookup(k); return a ? { n: a.n, p: a.p } : null;
  }).filter(Boolean);
}

function totalMinutes() {
  var h = Math.max(0, Math.min(23, parseInt($("hrs").value, 10) || 0));
  var m = Math.max(0, Math.min(59, parseInt($("mins").value, 10) || 0));
  return h * 60 + m;
}
function fmt(sec) {
  sec = Math.max(0, Math.round(sec));
  return Math.floor(sec / 3600) + ":" + String(Math.floor(sec % 3600 / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
}
function niceLen(m) {
  var h = Math.floor(m / 60), r = m % 60, out = [];
  if (h) out.push(h + (h === 1 ? " hour" : " hours"));
  if (r) out.push(r + " min");
  return out.join(" ");
}
function clock(d) { return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
function setArc(frac) {
  frac = Math.max(0, Math.min(1, frac));
  $("arc").style.strokeDasharray = CIRC;
  $("arc").style.strokeDashoffset = CIRC * (1 - frac);
}
function fillTags(el, list) {
  el.innerHTML = "";
  if (!list.length) { var s = document.createElement("span"); s.className = "tag none"; s.textContent = "No apps picked yet"; el.appendChild(s); return; }
  list.forEach(function (a) {
    var s = document.createElement("span"); s.className = "tag";
    s.appendChild(avatar(a.n, a.p || a.n));
    s.appendChild(document.createTextNode(a.n));
    el.appendChild(s);
  });
}

function sync() {
  save();
  document.body.classList.toggle("locked-mode", server.locked);
  $("stateTag").classList.toggle("on", server.locked);
  $("closingNote").hidden = !server.locked;
  if (server.locked) {
    var left = (server.end - Date.now()) / 1000;
    var total = lockTotal > 0 ? lockTotal : Math.max(left, 1);
    $("stateText").textContent = "Locked";
    $("bigLabel").textContent = "Time left";
    $("bigTime").textContent = fmt(left);
    $("until").innerHTML = "Unlocks at <b></b>";
    $("until").querySelector("b").textContent = clock(new Date(server.end));
    setArc(left / total);
    fillTags($("tags"), server.apps.map(function (n) {
      var k = Object.keys(names).find(function (key) { return names[key] === n; });
      return { n: n, p: k || n };
    }));
    $("startBtn").hidden = true; $("edgeWarn").hidden = true;
    return;
  }
  var mins = totalMinutes(), list = pickedList();
  $("stateText").textContent = "Ready";
  $("bigLabel").textContent = "Lock length";
  $("bigTime").textContent = fmt(mins * 60);
  if (mins > 0) { $("until").innerHTML = "Start now and apps unlock at <b></b>"; $("until").querySelector("b").textContent = clock(new Date(Date.now() + mins * 60000)); }
  else $("until").textContent = "Set a time above zero.";
  setArc(mins / 180);
  fillTags($("tags"), list);
  $("count").innerHTML = list.length ? "<b>" + list.length + "</b> picked" : "None picked";
  $("edgeWarn").hidden = IS_ANDROID_APP || !picked[THIS_BROWSER.p];
  $("edgeWarn").textContent = THIS_BROWSER.n + " is picked, so this page will close too. The lock still runs.";
  $("startBtn").hidden = false;
  $("startBtn").disabled = !list.length || !mins || (IS_ANDROID_APP && !server.ready);
  document.querySelectorAll(".preset").forEach(function (b) { b.setAttribute("aria-pressed", String(+b.dataset.m === mins)); });
}

function poll() {
  api("state").then(function (s) {
    var wasLocked = server.locked;
    server = s; $("offline").hidden = true; $("offlineAndroid").hidden = true; $("grid").hidden = false;
    $("setup").hidden = !IS_ANDROID_APP || !!s.ready;
    if (wasLocked && !s.locked) { $("msg").className = "msg"; $("msg").textContent = "Time is up. Your apps are unlocked."; }
    sync();
  }).catch(function () { $(IS_ANDROID_WEB ? "offlineAndroid" : "offline").hidden = false; $("grid").hidden = true; });
}
function loadRunning() {
  api("running").then(function (r) {
    running = r.apps || [];
    running.forEach(function (a) { if (a.icon) ICONS[a.p.toLowerCase()] = a.icon; });
    renderApps(); sync();
  }).catch(function () {});
}
// Android: the text box searches the installed apps instead of adding one by name
function filterApps() {
  if (!IS_ANDROID_APP) return;
  var q = $("customName").value.trim().toLowerCase();
  document.querySelectorAll("#running .app").forEach(function (d) { d.hidden = q && d.dataset.search.indexOf(q) < 0; });
}

PRESETS.forEach(function (m) {
  var b = document.createElement("button"); b.type = "button"; b.className = "preset"; b.dataset.m = m;
  b.innerHTML = m < 60 ? "<b>" + m + "</b><span>min</span>" : "<b>" + (m / 60) + "</b><span>" + (m === 60 ? "hour" : "hours") + "</span>";
  b.addEventListener("click", function () { $("hrs").value = Math.floor(m / 60); $("mins").value = m % 60; sync(); });
  $("presets").appendChild(b);
});
["hrs", "mins"].forEach(function (id) { $(id).addEventListener("input", sync); });
document.querySelectorAll("[data-step]").forEach(function (b) {
  b.addEventListener("click", function () {
    var total = totalMinutes() + (b.dataset.step === "hrs" ? 60 : 1) * +b.dataset.d;
    total = Math.max(0, Math.min(23 * 60 + 59, total));
    $("hrs").value = Math.floor(total / 60); $("mins").value = total % 60; sync();
  });
});

function addCustom() {
  var raw = $("customName").value.trim().replace(/\.exe$/i, "");
  if (!raw) return;
  if (!/^[A-Za-z0-9._ -]+$/.test(raw)) { $("msg").className = "msg bad"; $("msg").textContent = "Use only letters, numbers, spaces, dots, dashes or underscores."; return; }
  if (!names[raw.toLowerCase()]) custom.push({ n: raw, p: raw });
  picked[raw.toLowerCase()] = true; $("customName").value = ""; $("msg").textContent = "";
  renderApps(); sync();
}
$("addBtn").addEventListener("click", addCustom);
$("customName").addEventListener("keydown", function (e) { if (e.key === "Enter" && !IS_ANDROID_APP) addCustom(); });
$("customName").addEventListener("input", filterApps);
$("a11yBtn").addEventListener("click", function () { api("openAccessibility", {}).catch(function () {}); });

// Android app wording; computers keep the Windows wording above
if (IS_ANDROID_APP) {
  document.documentElement.classList.add("android-app");
  $("runningTitle").textContent = "Installed apps";
  $("commonTitle").hidden = true; $("common").hidden = true; $("addBtn").hidden = true;
  $("customName").placeholder = "Search apps";
  $("customName").setAttribute("aria-label", "Search apps");
  $("appsHint").textContent = "Lists the apps on your home screen. App Lock, Settings and the phone app can't be locked.";
  $("closingNote").textContent = "You can leave App Lock. The lock keeps running, even after a restart.";
  $("refreshBtn").lastChild.textContent = "Reload";
}
$("refreshBtn").addEventListener("click", loadRunning);

function closeConfirm() { $("confirm").hidden = true; $("startBtn").focus(); }
$("startBtn").addEventListener("click", function () {
  var list = pickedList(), mins = totalMinutes();
  fillTags($("confirmTags"), list);
  var until = clock(new Date(Date.now() + mins * 60000));
  $("confirmText").textContent = IS_ANDROID_APP
    ? "For " + niceLen(mins) + ", until " + until + ", opening these apps sends you back to the home screen. You can't unlock early from App Lock."
    : "These apps will close right now and stay closed for " + niceLen(mins) + ", until " + until + ". Save your work first. You can't unlock early from this page.";
  $("confirm").hidden = false; $("msg").textContent = ""; $("yesBtn").focus();
});
$("noBtn").addEventListener("click", closeConfirm);
$("confirm").addEventListener("click", function (e) { if (e.target === $("confirm")) closeConfirm(); });
document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("confirm").hidden) closeConfirm(); });
$("yesBtn").addEventListener("click", function () {
  var mins = totalMinutes();
  api("start", { apps: pickedList(), minutes: mins }).then(function (s) {
    lockTotal = mins * 60; server = s; $("confirm").hidden = true;
    $("msg").className = "msg"; $("msg").textContent = "Locked. Stay focused.";
    sync();
  }).catch(function (e) { $("confirm").hidden = true; $("msg").className = "msg bad"; $("msg").textContent = e.message; });
});

renderApps(); sync(); poll(); loadRunning();
setInterval(poll, 2000);
setInterval(function () { if (server.locked) sync(); }, 1000);
