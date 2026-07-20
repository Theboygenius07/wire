const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
  page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: process.env.SCRATCH + '/wire-hero-fixed.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });

  // hover over a logo bar cell
  await page.evaluate(() => window.scrollTo(0, 850));
  await page.waitForTimeout(300);
  const box = await page.locator('text=Claude').first().boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: process.env.SCRATCH + '/wire-logobar-hover.png' });

  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
