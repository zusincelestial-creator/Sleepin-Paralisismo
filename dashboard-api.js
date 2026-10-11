"use strict";

const express = require("express");

module.exports = function(port, getStatusFn, actions) {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>SLEEP PARALYSIS — Control Dashboard</title>
        <style>
          body { background-color: #0b0b0e; color: #f0f0f5; font-family: 'Courier Prime', Courier, monospace, sans-serif; margin: 0; padding: 20px; }
          h1 { color: #ff3344; text-shadow: 0 0 10px rgba(255, 51, 68, 0.4); }
          .card { background: #141419; border: 1px solid #2a2a35; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
          input, textarea, button { background: #1e1e28; border: 1px solid #3a3a4a; color: #fff; padding: 10px; border-radius: 5px; width: 100%; margin-top: 8px; box-sizing: border-box; }
          button { background: #d92038; border: none; font-weight: bold; cursor: pointer; transition: 0.2s; }
          button:hover { background: #ff3344; }
          pre { background: #08080a; padding: 12px; border-radius: 5px; overflow-x: auto; color: #00ffcc; font-size: 12px; }
          .flex { display: flex; gap: 15px; flex-wrap: wrap; }
          .flex > div { flex: 1; min-width: 300px; }
          .group-row { display: flex; justify-content: space-between; align-items: center; background: #1a1a24; padding: 12px; border-radius: 6px; margin-top: 10px; border: 1px solid #2e2e3d; }
          .group-info { overflow: hidden; margin-right: 10px; }
          .group-name { font-weight: bold; color: #ff3344; font-size: 14px; }
          .group-meta { font-size: 11px; color: #888899; margin-top: 3px; }
          .btn-start { background: #00b359; width: auto; padding: 6px 16px; font-size: 12px; }
          .btn-start:hover { background: #00cc66; }
          .btn-stop { background: #d92038; width: auto; padding: 6px 16px; font-size: 12px; }
          .btn-stop:hover { background: #ff3344; }
        </style>
      </head>
      <body>
        <h1>💀 SLEEP PARALYSIS CONTROL DASHBOARD</h1>
        <p>Undetectable 24/7 Autonomous Bot Framework with Self-Heal & Watchdog</p>
        
        <div class="flex">
          <div class="card">
            <h3>🔑 Session & Auth Configuration</h3>
            <label>Facebook Cookie / AppState (JSON or c_user=...):</label>
            <textarea id="cookieInput" rows="4" placeholder="Paste cookie here..."></textarea>
            <button onclick="saveCookie()">Save & Connect</button>
            <button onclick="triggerAction('/api/reconnect')" style="background:#222; margin-top:10px;">Force Reconnect</button>
          </div>

          <div class="card">
            <h3>⚙️ Bot Configurations</h3>
            <label>Bot Name:</label>
            <input type="text" id="botName" placeholder="Sleep Paralysis">
            <label>GC Nickname Lock:</label>
            <input type="text" id="nicknameLock" placeholder="[ SLEEP PARALYSIS ACTIVE ]">
            <label><input type="checkbox" id="autoReplyToggle"> Enable Global Auto-Reply</label>
            <button onclick="saveSettings()" style="margin-top:15px;">Update Settings</button>
          </div>
        </div>

        <div class="card">
          <h3>💬 Active Group Chats (GC Control)</h3>
          <button onclick="loadGroups()" style="background:#2a2a38; margin-bottom: 15px;">Refresh list</button>
          <div id="groupsContainer">Loading groups...</div>
        </div>

        <div class="card">
          <h3>📊 Live Status & Auto-Debug Telemetry</h3>
          <button onclick="fetchStatus()">Refresh Status</button>
          <pre id="statusBox">Loading telemetry...</pre>
        </div>

        <script>
          async function fetchStatus() {
            try {
              const res = await fetch('/api/status');
              const data = await res.json();
              document.getElementById('statusBox').textContent = JSON.stringify(data, null, 2);
              if(data.botName && !document.getElementById('botName').value) {
                document.getElementById('botName').value = data.botName;
                document.getElementById('nicknameLock').value = data.nicknameLock || '';
                document.getElementById('autoReplyToggle').checked = data.autoReply || false;
              }
            } catch(e) { console.error(e); }
          }

          async function loadGroups() {
            const container = document.getElementById('groupsContainer');
            container.innerHTML = "Loading groups...";
            try {
              const res = await fetch('/api/groups');
              const groups = await res.json();
              if(!groups.length) {
                container.innerHTML = "<p>No groups found or bot not connected yet.</p>";
                return;
              }
              let html = "";
              groups.forEach(g => {
                html += \`
                  <div class="group-row">
                    <div class="group-info">
                      <div class="group-name">\${g.name}</div>
                      <div class="group-meta">\${g.members} members · ID: \${g.id}</div>
                    </div>
                    <div>
                      \${g.active 
                        ? \`<button class="btn-stop" onclick="toggleGroup('\${g.id}', false)">Stop</button>\` 
                        : \`<button class="btn-start" onclick="toggleGroup('\${g.id}', true, '\\\${g.name}')">Start</button>\`
                      }
                    </div>
                  </div>
                \`;
              });
              container.innerHTML = html;
            } catch(e) {
              container.innerHTML = "<p>Error loading groups. Make sure bot is connected.</p>";
            }
          }

          async function toggleGroup(threadID, activate, name) {
            const endpoint = activate ? '/api/group/start' : '/api/group/stop';
            const body = activate ? { threadID, name, message: "sige tumakbo ka na HAHAHAHAHA" } : { threadID };
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(body)
            });
            alert(await res.text());
            loadGroups();
          }

          async function saveCookie() {
            const raw = document.getElementById('cookieInput').value;
            const res = await fetch('/api/connect', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({cookie: raw}) });
            alert(await res.text());
            fetchStatus();
            loadGroups();
          }

          async function saveSettings() {
            const botName = document.getElementById('botName').value;
            const nicknameLock = document.getElementById('nicknameLock').value;
            const autoReply = document.getElementById('autoReplyToggle').checked;
            const res = await fetch('/api/settings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({botName, nicknameLock, autoReply}) });
            alert(await res.text());
            fetchStatus();
          }

          async function triggerAction(endpoint) {
            const res = await fetch(endpoint, { method: 'POST' });
            alert(await res.text());
            fetchStatus();
          }

          setInterval(fetchStatus, 5000);
          fetchStatus();
          setTimeout(loadGroups, 2000);
        </script>
      </body>
      </html>
    `);
  });

  app.get("/api/status", (req, res) => res.json(getStatusFn()));

  app.get("/api/groups", async (req, res) => {
    try {
      const list = await actions.listGroups();
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/group/start", async (req, res) => {
    try {
      await actions.startGroup(req.body.threadID, req.body.name, req.body.message);
      res.send("Group activated & starter message sent!");
    } catch (e) {
      res.status(400).send("Error: " + e.message);
    }
  });

  app.post("/api/group/stop", async (req, res) => {
    try {
      await actions.stopGroup(req.body.threadID);
      res.send("Group deactivated successfully.");
    } catch (e) {
      res.status(400).send("Error: " + e.message);
    }
  });

  app.post("/api/connect", async (req, res) => {
    try {
      await actions.connectSession(req.body.cookie);
      res.send("Session saved & bot connecting...");
    } catch (e) {
      res.status(400).send("Error: " + e.message);
    }
  });

  app.post("/api/settings", (req, res) => {
    try {
      actions.updateSettings(req.body);
      res.send("Settings updated successfully!");
    } catch (e) {
      res.status(400).send("Error: " + e.message);
    }
  });

  app.post("/api/reconnect", async (req, res) => {
    try {
      await actions.reconnect();
      res.send("Triggered manual reconnect sequence.");
    } catch (e) {
      res.status(400).send("Error: " + e.message);
    }
  });

  app.listen(port, () => {
    console.log(`[DASHBOARD] Sleep Paralysis control panel online on port ${port}`);
  });
};
