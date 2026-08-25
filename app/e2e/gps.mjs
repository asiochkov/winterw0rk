import { chromium } from 'playwright';

const shots = process.env.SHOTS_DIR || new URL('./shots', import.meta.url).pathname;
const log = (m) => console.log(`[gps] ${m}`);

const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--no-sandbox'],
});

async function onboard(page, email) {
  await page.goto('http://localhost:5173/sign-up');
  await page.fill('input[placeholder="Your name"]', 'GPS Tester');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'password123');
  // Signup is gated on explicit consent; the button stays disabled until all are ticked.
  const boxes = page.locator('.consent-row input');
  const n = await boxes.count();
  for (let i = 0; i < n; i++) await boxes.nth(i).check();
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await page.waitForURL('**/onboarding');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('.onb-option:has-text("Build discipline")').click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('.onb-chip:has-text("Training")').click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('.onb-option:has-text("Cold Shower")').click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Begin Day 01', exact: true }).click();
  await page.waitForURL('**/today');
}

try {
  // ============ CASE 1: real GPS track ============
  const ctx = await browser.newContext({
    viewport: { width: 420, height: 900 },
    permissions: ['geolocation'],
    geolocation: { latitude: 55.75, longitude: 37.62, accuracy: 8 },
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));

  await onboard(page, `gps-${Date.now()}@example.com`);
  log('onboarded');

  await page.goto('http://localhost:5173/street');
  await page.getByRole('button', { name: /^Start run$/ }).click();
  await page.waitForTimeout(500);
  log('session started, GPS permission granted');

  // Move at a realistic pace. The app rejects jumps faster than 12 m/s as GPS
  // glitches (verified separately in the geo unit tests), so the emulated device
  // has to move at a speed a human could actually run: 1 m per 100 ms = 10 m/s.
  const degPerMeter = 1 / 111195;
  const metresPerStep = 1;
  const msPerStep = 100;
  const steps = 500; // ≈ 500 m over ~50 s
  for (let i = 1; i <= steps; i++) {
    await ctx.setGeolocation({
      latitude: 55.75 + i * metresPerStep * degPerMeter,
      longitude: 37.62,
      accuracy: 8,
    });
    await page.waitForTimeout(msPerStep);
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${shots}/01-tracking.png` });

  const liveKm = await page.locator('.street-live-stats .detail-stat-n').first().innerText();
  log(`live distance readout: ${liveKm} km`);
  if (parseFloat(liveKm) < 0.25) throw new Error(`Live distance did not accumulate: ${liveKm}`);

  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${shots}/02-confirm-route.png` });
  log('finish -> confirm screen with route map');

  const hasMap = await page.locator('svg[aria-label="Recorded route"]').count();
  if (hasMap === 0) throw new Error('Route map did not render');
  log('route polyline rendered');

  await page.getByRole('button', { name: 'Save session', exact: true }).click();
  await page.waitForSelector('.today-mood-set', { timeout: 10000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${shots}/03-saved-with-splits.png` });

  const summary = await page.locator('.today-mood-set').innerText();
  log(`saved summary: ${summary}`);
  if (!/measured by GPS/.test(summary)) throw new Error(`Expected GPS-sourced save, got: ${summary}`);

  const splitRows = await page.locator('.detail-history-row').count();
  log(`split rows rendered: ${splitRows}`);

  // Verify what the SERVER actually stored, not just what the UI claims.
  const stored = await page.evaluate(async () => {
    const r = await fetch('/api/street/history', { credentials: 'include' });
    return r.json();
  });
  const s = stored.sessions[0];
  log(`server stored: ${s.distanceKm} km, source=${s.source}, calories=${s.calories}`);
  if (s.source !== 'gps') throw new Error(`Server recorded source=${s.source}, expected gps`);
  if (s.distanceKm < 0.25 || s.distanceKm > 0.6) throw new Error(`Server distance ${s.distanceKm} km outside expected ~0.5 km`);

  const detail = await page.evaluate(async (id) => {
    const r = await fetch(`/api/street/${id}`, { credentials: 'include' });
    return r.json();
  }, s.id);
  log(`server persisted ${detail.points.length} track points, ${detail.splits.length} split(s)`);
  if (detail.points.length < 50) throw new Error(`Too few points persisted: ${detail.points.length}`);
  // Km-split maths is covered exhaustively by the geo unit tests; this route is
  // under 1 km so it correctly produces no splits.
  if (detail.splits.length !== 0) throw new Error(`Sub-1km route should have no splits, got ${detail.splits.length}`);

  await ctx.close();

  // ============ CASE 2: permission denied -> manual fallback ============
  const ctx2 = await browser.newContext({
    viewport: { width: 420, height: 900 },
    permissions: [], // geolocation NOT granted
  });
  const page2 = await ctx2.newPage();
  page2.on('pageerror', (e) => console.log('[pageerror]', e.message));

  await onboard(page2, `nogps-${Date.now()}@example.com`);
  await page2.goto('http://localhost:5173/street');
  await page2.getByRole('button', { name: /^Start run$/ }).click();
  await page2.waitForTimeout(1500);
  await page2.screenshot({ path: `${shots}/04-permission-denied.png` });

  const banner = await page2.locator('.banner-dg').count();
  if (banner === 0) throw new Error('Expected a permission-denied banner');
  log('permission denied -> banner shown, timer still running');

  await page2.getByRole('button', { name: 'Finish', exact: true }).click();
  await page2.waitForTimeout(300);
  await page2.fill('input[placeholder="5.2"]', '4.4');
  await page2.getByRole('button', { name: 'Save session', exact: true }).click();
  await page2.waitForSelector('.today-mood-set', { timeout: 10000 });
  await page2.screenshot({ path: `${shots}/05-manual-fallback-saved.png` });

  const stored2 = await page2.evaluate(async () => {
    const r = await fetch('/api/street/history', { credentials: 'include' });
    return r.json();
  });
  const m = stored2.sessions[0];
  log(`manual fallback stored: ${m.distanceKm} km, source=${m.source}`);
  if (m.source !== 'manual') throw new Error(`Expected source=manual, got ${m.source}`);
  if (m.distanceKm !== 4.4) throw new Error(`Expected 4.4 km, got ${m.distanceKm}`);

  await ctx2.close();

  log('GPS E2E PASSED');
} catch (err) {
  console.error('[gps] FAILED:', err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
