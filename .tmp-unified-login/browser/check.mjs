import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';

const root = process.cwd();
const temp = resolve(root, '.tmp-unified-login/browser');
const origin = 'http://127.0.0.1:4177';
const appUrl = `${origin}/admin/login`;
const debugUrl = 'http://127.0.0.1:9227';
const processes = [];
const logs = [];
const results = [];
const only = process.argv.find((arg) => arg.startsWith('--only='))?.slice(7).split(',');
const delay = (ms) => new Promise((done) => setTimeout(done, ms));
async function waitFor(fn, timeout = 12000) {
  const deadline = Date.now() + timeout;
  let error;
  while (Date.now() < deadline) {
    try { const value = await fn(); if (value) return value; } catch (cause) { error = cause; }
    await delay(80);
  }
  throw error ?? new Error('Timed out waiting for condition');
}

class CDP {
  constructor(socket) {
    this.socket = socket; this.id = 0; this.pending = new Map(); this.listeners = new Map();
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const pending = this.pending.get(message.id); if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message)); else pending.resolve(message.result);
      } else for (const handler of this.listeners.get(message.method) ?? []) handler(message.params);
    });
  }
  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((done, fail) => { socket.addEventListener('open', done, { once: true }); socket.addEventListener('error', fail, { once: true }); });
    return new CDP(socket);
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolveCommand, reject) => { this.pending.set(id, { resolve: resolveCommand, reject }); this.socket.send(JSON.stringify({ id, method, params })); });
  }
  on(method, callback) { this.listeners.set(method, [...(this.listeners.get(method) ?? []), callback]); }
  async evaluate(expression) {
    const response = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
    return response.result?.value;
  }
  close() { this.socket.close(); }
}

const auraRole = { id: '00000000-0000-4000-8000-000000000011', code: 'aurakey_admin', name: 'AuraKey Admin', scope: 'hope_aurakey' };
const timeRole = { id: '00000000-0000-4000-8000-000000000012', code: 'timelibrary_admin', name: 'TimeLibrary Admin', scope: 'hope_time_library' };
const baseUser = { id: '00000000-0000-4000-8000-000000000001', nickname: 'Mock Admin', phone: '13800138000', source: 'phone', is_active: true, needs_phone_binding: false, is_superuser: false, roles: [auraRole] };
function loginData(user = baseUser, appScope = 'admin_web') {
  const b64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return { access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user.id, app_scope: appScope, exp: Math.floor(Date.now() / 1000) + 3600 })}.mock-signature`, refresh_token: 'mock-refresh', token_type: 'bearer', app_scope: appScope, user };
}

async function browserCase(name, options = {}) {
  const target = await (await fetch(`${debugUrl}/json/new?about:blank`, { method: 'PUT' })).json();
  const cdp = await CDP.connect(target.webSocketDebuggerUrl);
  const state = { cdp, requests: [], blocked: [], sessions: [], exchanges: 0, sms: 0, phone: 0, data: loginData(), ...options };
  const headers = [
    { name: 'Content-Type', value: 'application/json; charset=utf-8' },
    { name: 'Access-Control-Allow-Origin', value: origin },
    { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
    { name: 'Access-Control-Allow-Headers', value: 'Authorization,Content-Type,X-Scan-Token' },
    { name: 'Access-Control-Allow-Credentials', value: 'true' },
    { name: 'Cache-Control', value: 'no-store' },
  ];
  const respond = (requestId, data, code = 200) => cdp.send('Fetch.fulfillRequest', { requestId, responseCode: code, responseHeaders: headers, body: Buffer.from(JSON.stringify({ code, message: code === 200 ? 'success' : 'mock denied', data })).toString('base64') }).catch(() => undefined);
  cdp.on('Fetch.requestPaused', async ({ requestId, request }) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/v1/')) {
      if (request.method === 'OPTIONS') { await respond(requestId, null); return; }
      const body = request.postData ? JSON.parse(request.postData) : null;
      state.requests.push({ path: url.pathname, method: request.method, body });
      if (url.pathname === '/api/v1/auth/scan/apps') {
        await respond(requestId, [{ app_key: 'admin_web', name: '统一后台' }, { app_key: 'hope_aurakey', name: 'AuraKey' }]);
      } else if (url.pathname === '/api/v1/auth/scan/sessions' && request.method === 'POST') {
        const id = `00000000-0000-4000-8000-${String(state.sessions.length + 1).padStart(12, '0')}`;
        const data = { transaction_id: id, status: 'WAITING_SCAN', app: { app_key: body.app_key, name: '统一后台' }, expires_at: new Date(Date.now() + 300000).toISOString(), poll_token: `mock-poll-${id}`, poll_interval_seconds: 2 };
        state.sessions.push(data); await respond(requestId, data);
      } else if (url.pathname.startsWith('/api/v1/auth/scan/sessions/')) {
        const id = url.pathname.split('/').at(-1);
        const session = state.sessions.find((item) => item.transaction_id === id);
        await respond(requestId, { transaction_id: id, status: session?.status ?? 'EXPIRED', app: session?.app ?? null, expires_at: session?.expires_at ?? null, exchange_code: session?.status === 'CONFIRMED' ? `mock-exchange-${id}` : null });
      } else if (url.pathname === '/api/v1/auth/scan/exchange') {
        state.exchanges += 1; await respond(requestId, state.data);
      } else if (url.pathname === '/api/v1/auth/sms/send') {
        state.sms += 1; await respond(requestId, null);
      } else if (url.pathname === '/api/v1/auth/phone/login') {
        state.phone += 1; await respond(requestId, state.data);
      } else if (url.pathname === '/api/v1/auth/me' || url.pathname === '/api/v1/aurakey/admin/session') {
        await respond(requestId, state.data.user);
      } else if (url.pathname === '/api/v1/aurakey/admin/dashboard/stats') {
        await respond(requestId, { total_users: 0, today_active_users: 0, today_orders: 0, today_revenue: 0, total_orders: 0, total_revenue: 0 });
      } else if (/\/books$|\/admin\/users$/.test(url.pathname)) {
        await respond(requestId, { items: [], total: 0, page: 1, page_size: 10 });
      } else await respond(requestId, []);
    } else if (url.origin === origin || ['blob:', 'data:'].includes(url.protocol)) {
      await cdp.send('Fetch.continueRequest', { requestId }).catch(() => undefined);
    } else {
      state.blocked.push(url.origin);
      await cdp.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }).catch(() => undefined);
    }
  });
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Network.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1365, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  const cache = options.cache ? `localStorage.setItem('user-storage', ${JSON.stringify(JSON.stringify(options.cache))});` : '';
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.clear(); sessionStorage.clear(); ${cache}` });
  state.navigate = () => cdp.send('Page.navigate', { url: appUrl });
  state.text = () => cdp.evaluate('document.body.innerText');
  state.side = () => cdp.evaluate('document.querySelector(".hope-sidebar")?.innerText ?? ""');
  state.path = () => cdp.evaluate('location.pathname');
  state.storage = () => cdp.evaluate('JSON.parse(localStorage.getItem("user-storage") ?? "null")');
  state.waitText = (text) => waitFor(async () => (await state.text()).includes(text));
  state.click = (text, selector = 'button,[role=tab]') => cdp.evaluate(`(() => { const element = [...document.querySelectorAll(${JSON.stringify(selector)})].find(item => item.textContent.includes(${JSON.stringify(text)})); if (!element) throw new Error('Element not found'); element.click(); })()`);
  state.fill = (selector, value) => cdp.evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) throw new Error('Input not found'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, ${JSON.stringify(value)}); element.dispatchEvent(new Event('input', { bubbles: true })); element.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  state.go = (path) => cdp.evaluate(`history.pushState({}, '', ${JSON.stringify(path)}); window.dispatchEvent(new PopStateEvent('popstate'));`);
  state.screenshot = async (suffix) => { const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' }); await writeFile(resolve(temp, `${name}-${suffix}.png`), Buffer.from(screenshot.data, 'base64')); };
  state.ready = async () => { await state.navigate(); await waitFor(() => state.sessions.length > 0); await waitFor(async () => cdp.evaluate('!!document.querySelector(".login-qr svg")')); };
  state.scanLogin = async (pending = false) => {
    await state.ready();
    if (pending) { state.sessions[0].status = 'PENDING'; await state.waitText('扫码成功'); assert.equal(await cdp.evaluate('!!document.querySelector(".login-qr svg")'), false); }
    state.sessions[0].status = 'CONFIRMED';
    await waitFor(async () => (await state.storage())?.state?.token);
    await waitFor(async () => (await state.path()) === '/admin/dashboard');
  };
  state.close = async () => { cdp.close(); await fetch(`${debugUrl}/json/close/${target.id}`).catch(() => undefined); };
  return state;
}

async function test(name, work, options) {
  if (only && !only.includes(name)) return;
  const state = await browserCase(name, options);
  try {
    await work(state);
    const serialized = await state.cdp.evaluate('JSON.stringify({local: {...localStorage}, session: {...sessionStorage}})');
    assert(!serialized.includes('mock-poll-') && !serialized.includes('mock-exchange-'), 'Transient scan credentials must not persist');
    assert.equal(state.blocked.length, 0, 'Unexpected external page request');
    results.push({ name, status: 'PASS', requestPaths: state.requests.map((request) => `${request.method} ${request.path}`) });
    console.log(`PASS ${name}`);
  } catch (error) {
    await state.screenshot('failure').catch(() => undefined);
    results.push({ name, status: 'FAIL', error: error.message, path: await state.path(), text: await state.text(), requestPaths: state.requests.map((request) => `${request.method} ${request.path}`) });
    console.error(`FAIL ${name}: ${error.message}`);
  } finally { await state.close(); }
}

async function scenarios() {
  await test('default-scan-no-selector', async (state) => {
    await state.ready();
    assert.equal(await state.cdp.evaluate('!!document.querySelector("#login-app,.login-page .arco-select")'), false);
    assert.equal(state.sessions.length, 1); assert.equal(state.sessions[0].app.app_key, 'admin_web');
    assert(!(await state.text()).includes('切换应用'));
    await state.screenshot('desktop');
    await state.cdp.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
    assert.equal(await state.cdp.evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    await state.screenshot('mobile-scan');
    await state.click('手机', '[role=tab]'); await state.waitText('短信验证码');
    assert.equal(await state.cdp.evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    await state.screenshot('mobile-phone');
  });
  await test('aurakey-role-unified-login', async (state) => {
    await state.scanLogin(true); await delay(2100); assert.equal(state.exchanges, 1);
    assert.equal((await state.storage()).state.appScope, 'admin_web');
    const sidebar = await state.side(); assert(sidebar.includes('用户处理')); assert(!sidebar.includes('时空图书馆')); assert(!sidebar.includes('系统管理'));
    await state.go('/admin/apps/aurakey/dashboard');
    await waitFor(() => state.requests.some((request) => request.path === '/api/v1/aurakey/admin/dashboard/stats'));
    assert.equal(await state.path(), '/admin/apps/aurakey/dashboard');
    await state.go('/admin/system/users'); await waitFor(async () => (await state.path()) === '/admin/dashboard');
    assert(!state.requests.some((request) => request.path === '/api/v1/admin/users'));
    await state.go('/admin/apps/timelibrary'); await waitFor(async () => (await state.path()) === '/admin/dashboard');
  });
  await test('multiple-role-modules', async (state) => {
    await state.scanLogin();
    const side = await state.side(); assert(side.includes('AuraKey')); assert(side.includes('时空图书馆')); assert(!side.includes('系统管理'));
    await state.go('/admin/apps/timelibrary'); await delay(350); assert.equal(await state.path(), '/admin/apps/timelibrary');
    await state.go('/admin/apps/aurakey/dashboard'); await delay(350); assert.equal(await state.path(), '/admin/apps/aurakey/dashboard');
  }, { data: loginData({ ...baseUser, roles: [auraRole, timeRole] }) });
  await test('superuser-all-modules', async (state) => {
    await state.scanLogin();
    const side = await state.side(); assert(side.includes('AuraKey')); assert(side.includes('时空图书馆')); assert(side.includes('系统管理'));
    await state.go('/admin/system/users'); await waitFor(() => state.requests.some((request) => request.path === '/api/v1/admin/users')); assert.equal(await state.path(), '/admin/system/users');
  }, { data: loginData({ ...baseUser, is_superuser: true, roles: [] }) });
  for (const [name, data] of [
    ['ordinary-user-rejected', loginData({ ...baseUser, roles: [] })],
    ['wrong-token-scope-rejected', loginData(baseUser, 'hope_aurakey')],
  ]) {
    await test(name, async (state) => { await state.ready(); state.sessions[0].status = 'CONFIRMED'; await waitFor(() => state.exchanges === 1); await delay(350); assert.equal(await state.path(), '/admin/login'); assert(!(await state.storage())?.state?.token); }, { data });
  }
  await test('system-superuser-flag-required', async (state) => {
    await state.scanLogin();
    assert(!(await state.side()).includes('系统管理'));
    await state.go('/admin/system/users'); await waitFor(async () => (await state.path()) === '/admin/dashboard');
    assert(!state.requests.some((request) => request.path === '/api/v1/admin/users'));
  }, { data: loginData({ ...baseUser, roles: [auraRole, { id: '00000000-0000-4000-8000-000000000013', code: 'SUPER_ADMIN', name: 'SUPER_ADMIN', scope: 'admin_web' }] }) });
  await test('legacy-v1-cache-cleared', async (state) => {
    await state.ready();
    const storage = await state.storage(); assert.equal(storage.version, 2); assert(!storage.state.token); assert(!storage.state.userInfo); assert.equal(await state.path(), '/admin/login');
  }, { cache: { state: { token: 'mock-old-cache-token', appScope: 'admin_web', userInfo: { ...baseUser, is_superuser: true } }, version: 1 } });
  await test('phone-login-backup', async (state) => {
    await state.ready(); await state.click('手机', '[role=tab]'); await state.waitText('短信验证码');
    await state.fill('input[type=tel]', '13800138000');
    await state.click('获取验证码', 'button'); await waitFor(() => state.sms === 1); await state.waitText('秒后重发');
    assert.deepEqual(state.requests.find((request) => request.path === '/api/v1/auth/sms/send').body, { phone: '13800138000' });
    await state.fill('input[aria-label="短信验证码"]', '1234'); await state.cdp.evaluate('document.querySelector("button[type=submit]").click()');
    await waitFor(async () => (await state.path()) === '/admin/dashboard');
    assert.equal(state.phone, 1); assert.equal(state.exchanges, 0);
    assert.equal(state.requests.find((request) => request.path === '/api/v1/auth/phone/login').body.app_key, 'admin_web');
  });
}

async function start() {
  await mkdir(temp, { recursive: true });
  for (const port of [4177, 9227]) await new Promise((done, fail) => { const server = net.createServer(); server.once('error', fail); server.listen(port, '127.0.0.1', () => server.close(done)); });
  const launch = (exe, args) => {
    const child = spawn(exe, args, { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (chunk) => logs.push(chunk.toString('utf8'))); child.stderr.on('data', (chunk) => logs.push(chunk.toString('utf8'))); child.on('error', (error) => logs.push(error.message)); processes.push(child);
  };
  launch(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '4177', '--strictPort']);
  launch('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-sync', '--disable-component-update', '--disable-default-apps', '--disable-extensions', '--disable-features=MediaRouter,OptimizationHints', `--user-data-dir=${resolve(temp, 'profile')}`, '--remote-debugging-port=9227', '--remote-allow-origins=*', 'about:blank']);
  await waitFor(async () => (await fetch(appUrl)).ok, 20000); await waitFor(async () => (await fetch(`${debugUrl}/json/version`)).ok, 20000);
}
async function stop() {
  try { const version = await (await fetch(`${debugUrl}/json/version`)).json(); const browser = await CDP.connect(version.webSocketDebuggerUrl); await Promise.race([browser.send('Browser.close').catch(() => undefined), delay(2000)]); browser.close(); } catch {}
  for (const child of processes.reverse()) child.kill();
  await writeFile(resolve(temp, 'process.log'), logs.join(''), 'utf8');
}
try { await start(); await scenarios(); await writeFile(resolve(temp, only ? 'results-targeted.json' : 'results.json'), JSON.stringify(results, null, 2), 'utf8'); if (results.some((item) => item.status === 'FAIL')) process.exitCode = 1; }
finally { await stop(); }
