/**
 * Regenerate the README screenshots in docs/screenshots/.
 *
 * Captures this app running at Android (412x915) and iPhone (393x852) viewport
 * sizes, populated with the built-in sample visits.
 *
 * Usage:
 *   npm run build
 *   npx vite preview --port 4173 &
 *   npm i -D playwright && node scripts/capture-screenshots.mjs
 *
 * Note: this app clears no data itself - the script completes first-run setup,
 * which triggers the sample-visit seeding used in the shots.
 */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:4173';

const DEVICES = [
  { key: 'android', width: 412, height: 915, ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36' },
  { key: 'ios', width: 393, height: 852, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
];

const shot = async (page, dir, name) => {
  await page.screenshot({ path: `docs/screenshots/${dir}/${name}.jpg`, type: 'jpeg', quality: 86 });
  console.log(`   ✓ ${dir}/${name}.jpg`);
};

for (const dev of DEVICES) {
  fs.mkdirSync(`docs/screenshots/${dev.key}`, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({
    viewport: { width: dev.width, height: dev.height },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    userAgent: dev.ua,
  });
  const page = await ctx.newPage();
  console.log(`\n== ${dev.key} (${dev.width}x${dev.height}) ==`);

  // --- 1. Splash (capture before its 2.2s auto-redirect) ---
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1100);
  await shot(page, dev.key, '01-splash');

  // --- 2. Employee setup ---
  await page.waitForURL('**/setup', { timeout: 15000 });
  await page.waitForTimeout(600);
  await shot(page, dev.key, '02-employee-setup');

  // Complete setup so the rest of the app has a profile + seeded data
  await page.locator('input').nth(0).fill('Rahul Sharma');
  await page.locator('input').nth(1).fill('ATC-EMP-001');
  await page.locator('input').nth(2).fill('9876543210');
  await page.locator('input').nth(3).fill('rahul.sharma@atcgroup.in');
  await page.getByText('Get Started').click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  // Wait out the welcome toast (2.6s) + seeding + animated counters
  await page.waitForTimeout(5200);

  // --- 3. Dashboard ---
  await shot(page, dev.key, '03-dashboard');

  // --- 4. Today's visits ---
  await page.goto(`${BASE}/today`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  await shot(page, dev.key, '04-today-visits');

  // --- 5. All visits (search + filter) ---
  await page.goto(`${BASE}/visits`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  await shot(page, dev.key, '05-all-visits');

  // --- 6. New visit form (step 1) ---
  await page.goto(`${BASE}/visit/new`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await shot(page, dev.key, '06-new-visit');

  // --- 7. Opportunity assessment step (step 8 of the form) ---
  const nextBtn = page.locator('.atc-sticky-actions ion-button').filter({ hasText: 'Next' });
  for (let i = 0; i < 7; i++) {
    await nextBtn.click();
    await page.waitForTimeout(360);
  }
  await page.waitForTimeout(700);
  await shot(page, dev.key, '07-opportunities');

  // --- 8. Visit details ---
  await page.goto(`${BASE}/visits`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  const card = page.locator('.atc-card').filter({ hasText: 'ATC-VISIT' }).first();
  await card.click();
  await page.waitForTimeout(2000);
  await shot(page, dev.key, '08-visit-details');

  // --- 9. Day-end report ---
  await page.goto(`${BASE}/reports`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  await shot(page, dev.key, '09-day-end-report');

  // --- 10. Follow-ups ---
  await page.goto(`${BASE}/followups`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await shot(page, dev.key, '10-follow-ups');

  // --- 11. Settings ---
  await page.goto(`${BASE}/settings`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  await shot(page, dev.key, '11-settings');

  // --- 12. About ---
  await page.goto(`${BASE}/about`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await shot(page, dev.key, '12-about');

  await browser.close();
}
console.log('\nAll screenshots captured.');
