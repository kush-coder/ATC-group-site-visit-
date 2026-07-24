/**
 * Generate the sample day-end Excel reports shipped in docs/sample-report/.
 *
 * These are produced by the real app (ExcelJS service) from the built-in
 * sample visits, so the committed files are exactly what an employee gets
 * when they tap "Generate Report" on the Day-End Report screen.
 *
 * Usage:
 *   npm run build
 *   npx vite preview --port 4173 &
 *   npm i -D playwright && node scripts/generate-sample-report.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:4173';
const OUT = 'docs/sample-report';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });

// First-run setup -> seeds the five sample client visits
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.waitForURL('**/setup', { timeout: 15000 });
await page.locator('input').nth(0).fill('Rahul Sharma');
await page.locator('input').nth(1).fill('ATC-EMP-001');
await page.locator('input').nth(2).fill('9876543210');
await page.locator('input').nth(3).fill('rahul.sharma@atcgroup.in');
await page.getByText('Get Started').click();
await page.waitForURL('**/dashboard', { timeout: 15000 });
await page.waitForTimeout(4000);

await page.goto(`${BASE}/reports`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

const grab = async (label, suffix) => {
  const dl = page.waitForEvent('download', { timeout: 60000 });
  await page.locator('ion-button').filter({ hasText: label }).first().click();
  const download = await dl;
  const name = download.suggestedFilename().replace(/\.xlsx$/, `${suffix}.xlsx`);
  await download.saveAs(`${OUT}/${name}`);
  console.log(`✓ ${name}  (${(fs.statSync(`${OUT}/${name}`).size / 1024).toFixed(1)} KB)`);
  await page.waitForTimeout(2500);
};

await grab('Generate Full Report with Images', '');
await grab('Generate Lightweight Report', '_Lightweight');

await browser.close();
console.log('Sample reports written to', OUT);
