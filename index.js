"use strict";

/*
 * =====================================================================
 * PROJECT: SLEEP PARALYSIS — Autonomous Undetectable Messenger Bot
 * =====================================================================
 */

const fs = require("fs");
const path = require("path");
const { login } = require("ws3-fca");
const store = require("./store");
const { sendHumanizedReply } = require("./humanizer");
const triggers = require("./triggers");
const dashboardApi = require("./dashboard-api");

if (!process.env.SLEEP_SESSION_FILE && process.env.RAILWAY_VOLUME_MOUNT_PATH) {
  process.env.SLEEP_SESSION_FILE = path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, "appstate.json");
}

const PORT = Number(process.env.PORT || 10000);
const THREAD_COOLDOWN_MS = 5000;

let currentApi = null;
let stopListener = null;
let botUserID = "";
let messengerConnected = false;
let loginInProgress = false;
let loginGen = 0;
let sessionOverride = null;
let lastError = null;
let lastMessageAt = null;
let lastConnectedAt = null;
let lastDisconnectedAt = null;
const stats = { received: 0, sent: 0, errors: 0 };
const events = [];

function pushEvent(type, message) {
  events.unshift({ type, message, at: new Date().toISOString() });
  if (events.length > 100) events.length = 100;
}

function noteError(where, error) {
  stats.errors++;
  const msg = error?.message || String(error);
  lastError = { where, message: msg.slice(0, 300), at: new Date().toISOString() };
  pushEvent("error", `[${where}] ${msg}`);
  console.error(`[SLEEP-PARALYSIS ERROR] [${where}]`, error);
}

process.on("uncaughtException", (err) => noteError("uncaughtException", err));
process.on("unhandledRejection", (err) => noteError("unhandledRejection", err));

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function parseMaybeJson(text) {
  const trimmed = String(text).trim();
  try { return JSON.parse(trimmed); } catch (_) { return trimmed; }
}

function readSession() {
  if (sessionOverride) return parseMaybeJson(sessionOverride);
  const candidates = [
    process.env.SLEEP_SESSION_FILE,
    path.join(process.cwd(), "appstate.json"),
    path.join(process.cwd(), "cookies.json")
  ].filter(Boolean);
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) return parseMaybeJson(fs.readFileSync(filePath, "utf8"));
  }
  const raw = process.env.FB_COOKIES || process.env.FB_APPSTATE;
  if (raw) return parseMaybeJson(raw);
  throw new Error("No session found. Configure cookie in the Sleep Paralysis dashboard.");
}

function normalizeSession(value) {
  if (typeof value === "string") {
    const cookie = value.trim();
    if (!cookie) throw new Error("Empty cookie session.");
    return cookie;
  }
  const entries = Array.isArray(value) ? value : Array.isArray(value?.appState) ? value.appState : null;
  if (!entries) throw new Error("Invalid session format.");
  return entries.map(c => `${c.key || c.name}=${c.value}`).join("; ");
}

const threadQueues = new Map();
const threadLastSent = new Map();

function enqueue(threadID, job) {
  const key = String(threadID);
  const current = threadQueues.get(key) || Promise.resolve();
  const next = current.catch(() => {}).then(job).finally(() => {
    if (threadQueues.get(key) === next) threadQueues.delete(key);
  });
  threadQueues.set(key, next);
  return next;
}

function trafficSendMessage(api, message, threadID, callback, replyToMessageID = null) {
  const key = String(threadID);
  return enqueue(key, async () => {
    const now = Date.now();
    const sinceLast = now - Number(threadLastSent.get(key) || 0);
    if (sinceLast < THREAD_COOLDOWN_MS) {
      await sleep(THREAD_COOLDOWN_MS - sinceLast + Math.floor(Math.random() * 500));
    }

    try {
      const result = await new Promise((resolve, reject) => {
        let done = false;
        const cb = (err, info) => {
          if (done) return;
          done = true;
          err ? reject(err) : resolve(info);
        };
        const returned = replyToMessageID ? api.sendMessage(message, threadID, cb, replyToMessageID) : api.sendMessage(message, threadID, cb);
        if (returned && typeof returned.then === "function") returned.then(info => cb(null, info)).catch(cb);
      });
      threadLastSent.set(key, Date.now());
      callback(null, result);
    } catch (err) {
      callback(err);
    }
  });
}

function onMessage(api, event) {
  if (!event || event.type !== "message") return;
  if (botUserID && String(event.senderID) === String(botUserID)) return;

  const body = String(event.body || "").trim();
  if (!body) return;

  stats.received++;
  lastMessageAt = new Date().toISOString();
  const threadID = String(event.threadID);
  const st = store.getData();

  if (st.nicknameLock && event.isGroup && api.changeThreadNickname) {
    api.changeThreadNickname(st.nicknameLock, threadID, botUserID, (err) => {});
  }

  if (!st.autoReply && !store.isThreadActive(threadID)) return;

  let chosenReply = triggers.getTriggerReply(body);
  if (!chosenReply) {
    chosenReply = triggers.getRandomFallbackReply();
  }

  sendHumanizedReply(api, chosenReply, threadID, event.messageID, trafficSendMessage)
    .then(() => { stats.sent++; })
    .catch(err => noteError("humanized reply", err));
}

function startBot(api, gen) {
  currentApi = api;
  messengerConnected = true;
  lastConnectedAt = new Date().toISOString();
  try { botUserID = String(api.getCurrentUserID?.() || ""); } catch (_) {}

  const stop = api.listenMqtt((err, event) => {
    if (gen !== loginGen) return;
    if (err) {
      noteError("mqtt listener", err);
      return;
    }
    try { onMessage(api, event); } catch (e) { noteError("onMessage handler", e); }
  });

  stopListener = typeof stop === "function" ? stop : (typeof api.stopListening === "function" ? () => api.stopListening() : null);
  console.log(`[SLEEP PARALYSIS] Online securely as user ID: ${botUserID}`);
}

function disconnectBot() {
  loginGen++;
  if (stopListener) try { stopListener(); } catch (_) {}
  stopListener = null;
  currentApi = null;
  if (messengerConnected) lastDisconnectedAt = new Date().toISOString();
  messengerConnected = false;
  loginInProgress = false;
}

function loginBot() {
  if (loginInProgress) return;
  loginGen++;
  const gen = loginGen;
  loginInProgress = true;

  try {
    const cookie = normalizeSession(readSession());
    login(cookie, (err, api) => {
      if (gen !== loginGen) return;
      loginInProgress = false;
      if (err) {
        messengerConnected = false;
        noteError("login failed", err);
        setTimeout(loginBot, 15000);
        return;
      }
      startBot(api, gen);
    });
  } catch (e) {
    loginInProgress = false;
    noteError("read session", e);
    setTimeout(loginBot, 20000);
  }
}

setInterval(() => {
  if (!messengerConnected && !loginInProgress) {
    console.log("[WATCHDOG] Connection dropped. Initiating self-heal login...");
    loginBot();
  }
}, 30000);

dashboardApi(PORT, () => ({
  ok: true,
  botName: store.getData().botName,
  nicknameLock: store.getData().nicknameLock,
  autoReply: store.getData().autoReply,
  facebook_connected: messengerConnected,
  facebook_user_id: botUserID,
  bot_running: messengerConnected,
  messages_received: stats.received,
  replies_sent: stats.sent,
  errors: stats.errors,
  last_error: lastError,
  last_connected_at: lastConnectedAt,
  last_disconnected_at: lastDisconnectedAt,
  last_message_at: lastMessageAt,
  uptime_seconds: process.uptime(),
  memory_usage_mb: Math.round(process.memoryUsage().rss / 1048576)
}), {
  connectSession: async (rawCookie) => {
    sessionOverride = rawCookie;
    disconnectBot();
    loginBot();
  },
  updateSettings: (newSet) => {
    store.updateData(newSet);
  },
  reconnect: async () => {
    disconnectBot();
    loginBot();
  }
});

loginBot();
