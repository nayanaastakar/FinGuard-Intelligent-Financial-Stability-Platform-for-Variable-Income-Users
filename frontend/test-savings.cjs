const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });
  
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.type(), msg.text());
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  try {
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173/');
    
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    
    await page.type('input[type="text"]', 'demo');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('.sidebar-nav-item.nav-dashboard', { timeout: 10000 });
    
    await page.click('.sidebar-nav-item.nav-savings');
    
    await new Promise(r => setTimeout(r, 2000));
    
    await page.screenshot({ path: 'savings_crash.png' });
    
    const html = await page.$eval('body', el => el.innerHTML);
    console.log("Body HTML length:", html.length);
    console.log("Body HTML preview:", html.substring(0, 500));
    
  } catch (err) {
    console.error("Test script failed:", err);
  } finally {
    await browser.close();
  }
})();
