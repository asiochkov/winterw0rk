import { chromium } from 'playwright';
const BASE = 'https://127.0.0.1:8797';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
p.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text()));

const email = `onb${Date.now()}@test.com`;
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
const r = await p.evaluate(async (email) => {
  const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', name: 'T', acceptedTerms: true, acceptedPrivacy: true, confirmedAge: true }) });
  return res.status;
}, email);
console.log('signup', r);

await p.goto(BASE + '/onboarding', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(800);
await p.click('text=/Continue|Продолжить/');            // intro -> goal
await p.waitForTimeout(300);
await p.locator('.onb-option').nth(1).click();            // the body goal
await p.click('button:has-text("Continue")');
await p.waitForTimeout(300);
await p.locator('.onb-chip').first().click();
await p.click('button:has-text("Continue")');
await p.waitForTimeout(400);
console.log('--- habits step, goal=body ---');
console.log(await p.locator('.onb-option-label').allInnerTexts());
await p.screenshot({ path: '/tmp/claude-0/onb-habits.png', fullPage: true });

// pick one and set 3x a week
await p.locator('.onb-option-main').first().click();
await p.waitForTimeout(200);
await p.click('.onb-freq-btn:has-text("3")');
await p.screenshot({ path: '/tmp/claude-0/onb-freq.png', fullPage: true });

// reload mid-flow: the draft must survive
await p.reload({ waitUntil: 'domcontentloaded' });
await p.waitForTimeout(900);
console.log('after reload, still on habits step:', await p.locator('.onb-title').innerText());
console.log('selection kept:', await p.locator('.onb-option-on .onb-option-label').allInnerTexts());
console.log('frequency kept:', await p.locator('.onb-freq-btn.is-on').innerText());

// back button
await p.click('.onb-back');
await p.waitForTimeout(300);
console.log('back went to:', await p.locator('.onb-title').innerText());
await p.click('button:has-text("Continue")');
await p.waitForTimeout(300);
await p.click('button:has-text("Continue")');
await p.waitForTimeout(400);
await p.click('button:has-text("Begin")').catch(async () => p.click('button:has-text("Start")'));
await p.waitForTimeout(1500);
console.log('landed on:', p.url());
const habits = await p.evaluate(() => fetch('/api/habits').then((r) => r.json()));
console.log('created:', habits.habits.map((h) => `${h.name} [${h.category}] ${JSON.stringify(h.schedule)}`));
await b.close();
process.exit(0);
