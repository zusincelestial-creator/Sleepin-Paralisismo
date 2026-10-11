"use strict";

function getRandomJitter(min = 600, max = 2200) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateHumanDelay(text) {
  const base = 1000;
  const perChar = 45;
  const lengthFactor = Math.min(text.length * perChar, 6000);
  return base + lengthFactor + getRandomJitter(500, 3000);
}

function mimicText(text) {
  const clean = String(text || "").trim();
  if (!clean) return clean;
  return Math.random() < 0.15 ? clean.toLowerCase() : clean;
}

async function sendHumanizedReply(api, text, threadID, messageID = null, trafficHandler) {
  const finalMessage = mimicText(text);
  const delay = calculateHumanDelay(finalMessage);

  return new Promise((resolve, reject) => {
    try {
      if (typeof api.sendTypingIndicator === "function") {
        api.sendTypingIndicator(threadID, (err) => {
          if (err) console.error("[HUMANIZER] Typing indicator warning:", err);
        });
      }
    } catch (_) {}

    setTimeout(() => {
      trafficHandler(api, finalMessage, threadID, (err, info) => {
        if (err) reject(err);
        else resolve(info);
      }, messageID);
    }, delay);
  });
}

module.exports = {
  calculateHumanDelay,
  mimicText,
  sendHumanizedReply
};
