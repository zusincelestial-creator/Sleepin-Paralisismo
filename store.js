"use strict";

const fs = require("fs");
const path = require("path");

const STORE_FILE = path.join(process.cwd(), "sleep_paralysis_store.json");

let data = {
  botName: "Sleep Paralysis",
  nicknameLock: "",
  autoReply: false,
  admins: [],
  settings: {
    admin_only: false
  },
  threads: {}
};

function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
      data = { ...data, ...parsed };
    }
  } catch (e) {
    console.error("[STORE] Error loading store:", e);
  }
}

function saveStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("[STORE] Error saving store:", e);
  }
}

loadStore();

module.exports = {
  getData: () => data,
  updateData: (newData) => {
    data = { ...data, ...newData };
    saveStore();
    return data;
  },
  setThreadState: (threadID, active) => {
    if (!data.threads) data.threads = {};
    data.threads[String(threadID)] = { active: Boolean(active), updatedAt: Date.now() };
    saveStore();
  },
  isThreadActive: (threadID) => {
    return Boolean(data.threads && data.threads[String(threadID)]?.active);
  }
};
