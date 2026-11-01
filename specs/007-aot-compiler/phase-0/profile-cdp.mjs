// Drives a headless Chromium over the DevTools protocol (no dependencies:
// Node 22+ has a global WebSocket) and collects the PROFILE console line the
// profile pages print. Usage: node profile-cdp.mjs <chrome.exe> <url> [timeoutMs]
import {spawn} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const [exe, url, timeoutArg] = process.argv.slice(2);
const timeoutMs = Number(timeoutArg || 90000);
const port = 9333;
const profileDir = mkdtempSync(join(tmpdir(), 'eligius-profile-'));
const chrome = spawn(
  exe,
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1280,800',
    'about:blank',
  ],
  {stdio: 'ignore'}
);

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitForDevtools() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return res.json();
    } catch {}
    await sleep(200);
  }
  throw new Error('devtools endpoint did not come up');
}

try {
  await waitForDevtools();
  const targets = await (
    await fetch(`http://127.0.0.1:${port}/json/list`)
  ).json();
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let id = 0;
  const pending = new Map();
  const consoleLines = [];
  const errors = [];
  ws.onmessage = event => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args
        .map(a => a.value ?? a.description ?? '')
        .join(' ');
      consoleLines.push(`[${msg.params.type}] ${text}`);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(
        msg.params.exceptionDetails.exception?.description ??
          msg.params.exceptionDetails.text
      );
    }
  };
  const send = (method, params = {}) =>
    new Promise(resolve => {
      const msgId = ++id;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({id: msgId, method, params}));
    });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', {url});

  const started = Date.now();
  let profile = null;
  while (Date.now() - started < timeoutMs) {
    await sleep(1000);
    const result = await send('Runtime.evaluate', {
      expression: 'JSON.stringify(window.__profile || null)',
      returnByValue: true,
    });
    const value = result.result?.result?.value;
    if (value && value !== 'null') {
      profile = JSON.parse(value);
      break;
    }
    if (consoleLines.some(l => l.includes('PROFILE-ERROR'))) break;
  }
  const output = {
    url,
    profile,
    consoleTail: consoleLines
      .filter(l => !l.startsWith('[log] PROFILE '))
      .slice(-15),
    errors: errors.slice(0, 10),
  };
  console.log(JSON.stringify(output, null, 1));
  ws.close();
} finally {
  chrome.kill();
}
