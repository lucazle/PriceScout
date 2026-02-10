const { chromium } = require('playwright');

async function withBrowser(fn) {
  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    locale: 'pt-BR',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    return await fn(page);
  } finally {
    await browser.close();
  }
}

module.exports = { withBrowser };
