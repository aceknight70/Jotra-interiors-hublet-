import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText || request.response()?.status());
  });
  page.on('response', response => {
    if (response.status() === 404) {
        console.log('404 URL:', response.url());
    }
  });
  
  await page.goto('http://localhost:3000');
  
  // Wait a bit to see if there are any async errors
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
})();
