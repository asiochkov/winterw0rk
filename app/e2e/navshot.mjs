import { chromium } from 'playwright';
const BASE = 'https://127.0.0.1:8797';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
for (const [name, width] of [['mobile', 430], ['desktop', 1440]]) {
  const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'demo@winterwork.test', password: 'Passw0rd!demo' }) }));
  await p.goto(BASE + '/today', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);
  await p.click('text=Got it').catch(() => {});
  await p.waitForTimeout(300);
  const tabs = await p.locator('.ww-nav-tab').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  const side = await p.locator('.side-nav-item').evaluateAll((els) => els.map((e) => e.textContent?.trim()));
  console.log(name, '| bottom tabs:', tabs, '| rail:', side);
  console.log(name, '| world switch:', await p.locator('.ww-world-tab, .side-nav-world').count());
  await p.screenshot({ path: `/tmp/claude-0/nav-${name}.png` });
  await ctx.close();
}
await b.close(); process.exit(0);
