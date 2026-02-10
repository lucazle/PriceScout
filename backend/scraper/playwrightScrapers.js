const { chromium } = require('playwright');
const config = require('./config');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '');
}

function parsePriceBR(str) {
  if (!str) return 0;
  let s = String(str).trim();
  // Remove prefixos como 'ou', 'por', etc. e pega só o valor
  const match = s.match(/(R\$\s?[\d\.]+,[\d]{2})/i);
  if (match) s = match[1];
  s = s.replace(/R\$\s?/i, '').replace(/\./g, '').replace(/,/g, '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

async function setupBrowser() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'pt-BR'
  });
  const page = await context.newPage();
  return { browser, context, page };
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 800;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 250);
    });
  });
}

async function tryAcceptCookies(page) {
  const selectors = [
    '#onetrust-accept-btn-handler',
    'button[aria-label*="aceitar" i]',
    'button:has-text("Aceitar")',
    'button:has-text("Concordo")',
    'button:has-text("Prosseguir")',
    'button:has-text("Entendi")',
  ];
  for (const sel of selectors) {
    try {
      const btn = await page.waitForSelector(sel, { timeout: 2000 });
      if (btn) { await btn.click({ delay: 50 }); break; }
    } catch {}
  }
}

async function safeClose(browser, context) {
  try { await context?.close(); } catch {}
  try { await browser?.close(); } catch {}
}

function buildDebugPaths(store, termo) {
  const safe = String(termo).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_\-]/g, '');
  const dir = path.join(__dirname, 'debug');
  const htmlPath = path.join(dir, `${store}-${safe}.html`);
  const pngPath = path.join(dir, `${store}-${safe}.png`);
  return { dir, htmlPath, pngPath };
}

async function captureDebug(page, store, termo) {
  try {
    const { dir, htmlPath, pngPath } = buildDebugPaths(store, termo);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const html = await page.content();
    fs.writeFileSync(htmlPath, html, 'utf8');
    await page.screenshot({ path: pngPath, fullPage: true });
    logger.warn(`[${store}] Capturado debug em ${path.relative(process.cwd(), htmlPath)} e ${path.relative(process.cwd(), pngPath)}`);
  } catch (e) {
    logger.warn(`[${store}] Falha ao capturar debug: ${e.message}`);
  }
}

function keywordTokens(termo) {
  const stop = new Set(['notebook']);
  return normalizeText(termo)
    .split(/\s+/)
    .filter(k => k.length > 1 && !stop.has(k));
}

function hasSufficientMatch(title, termo) {
  if (!title) return false;
  const normTitle = normalizeText(title);
  // Palavras proibidas para evitar acessórios e peças
  const forbidden = [
    'tela notebook', 'tela para notebook', 'bateria para', 'bateria de', 'capa', 'pelicula', 'protetor', 'bolsa', 'case', 'carregador', 'fonte',
    'teclado', 'adaptador', 'suporte', 'mouse', 'mochila',
    'maleta', 'hub', 'dock', 'cabo', 'pelicula', 'protetor', 'bolsa', 'case', 'carregador',
    'fonte', 'teclado', 'adaptador', 'suporte', 'mouse',
    'mochila', 'maleta', 'hub', 'dock', 'cabo'
  ];
  for (const word of forbidden) {
    if (normTitle.includes(word)) return false;
  }
  // Exigir "notebook", "laptop", "macbook", "mac book", "chromebook", "ultrabook" no título
  if (!/notebook|laptop|mac\s?book|chromebook|ultrabook/.test(normTitle)) return false;
  const tokens = keywordTokens(termo).filter(t => !['notebook','laptop'].includes(t));
  if (tokens.length === 0) return true;
  // Exigir pelo menos 1 token principal do termo
  const matched = tokens.filter(t => normTitle.includes(t)).length;
  return matched >= 1;
}

async function buscaMagalu(termo) {
  const results = [];
  const q = encodeURIComponent(termo);
  const url = `${config.URLS_BASE.magalu}/busca/${q}/`;
  logger.info(`[Magalu-PW] Buscando: ${termo}...`);
  const { browser, context, page } = await setupBrowser();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await tryAcceptCookies(page);
    await autoScroll(page);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Detect captcha/bot page
    const bodyText = (await page.textContent('body').catch(() => '')) || '';
    if (/captcha|verifica[cç][aã]o|magalu logo/i.test(bodyText)) {
      logger.warn('[Magalu-PW] Página de captcha/bot detectada. Sem extração.');
      await captureDebug(page, 'magalu', termo);
      return results;
    }

    const itemSelectorOptions = [
      'li[data-testid="product-card"]',
      'a[data-testid="product-card-container"]',
      'div[data-testid="product-list"] article',
      'a[href*="/produto/"]',
    ];
    let foundSel = null;
    for (const sel of itemSelectorOptions) {
      try { await page.waitForSelector(sel, { timeout: 8000 }); foundSel = sel; break; } catch {}
    }
    if (!foundSel) { logger.warn('[Magalu-PW] Nenhum seletor de item encontrado.'); await captureDebug(page, 'magalu', termo); return results; }

    const offers = await page.$$eval(foundSel, (nodes) => {
      function pickText(el, sels) { for (const s of sels) { const n = el.querySelector(s); if (n && n.textContent) return n.textContent.trim(); } return null; }
         function pickHref(el, sels) {
           // Se o próprio elemento é um <a> com href
           if (el.tagName === 'A' && el.href) return el.href;
           for (const s of sels) {
             const n = el.querySelector(s);
             if (n && n.href) return n.href;
             if (n && n.getAttribute && n.getAttribute('href')) return n.getAttribute('href');
           }
           return null;
         }
      function pickImage(el, sels) { for (const s of sels) { const n = el.querySelector(s); if (n) return n.src || n.getAttribute('src') || n.getAttribute('data-src'); } return null; }
      const list = [];
      for (const el of nodes.slice(0, 30)) {
        const title = pickText(el, ['h2[data-testid="product-title"]', 'h2', 'span[data-testid="product-title"]']);
        const priceText = pickText(el, ['p[data-testid="price-value"]', 'span[data-testid="price-value"]', 'span:has-text("R$")']);
        let link = pickHref(el, ['a[data-testid="product-card-container"]', 'a[href]']);
        const image = pickImage(el, ['img', 'div img']);
        if (link && !link.startsWith('http')) { try { link = new URL(link, location.origin).href; } catch {} }
        list.push({ title, price: priceText, link, image });
      }
      return list;
    });

    for (const ofr of offers) {
      const priceNum = parsePriceBR(ofr.price);
      const match = hasSufficientMatch(ofr.title, termo);
      if (ofr.title && priceNum > 0 && ofr.link && match) {
        results.push({ loja: 'Magalu', title: ofr.title, price: priceNum, link: ofr.link, image: ofr.image });
      } else {
        logger.info(`[Magalu-PW][Filtro] Ignorado: Título='${ofr.title}' | Preço='${ofr.price}' | Link='${ofr.link}' | Match=${match}`);
      }
    }
    // Log detalhado para debug
    logger.info(`[Magalu-PW] Ofertas extraídas para '${termo}': ${offers.length}`);
    offers.forEach((ofr, idx) => {
      logger.info(`[Magalu-PW] [${idx+1}] Título: ${ofr.title} | Preço: ${ofr.price} | Link: ${ofr.link}`);
    });
    logger.info(`[Magalu-PW] Ofertas válidas (após filtro): ${results.length}`);
    if (results.length === 0) await captureDebug(page, 'magalu', termo);
  } catch (e) {
    logger.warn(`[Magalu-PW] Falha: ${e.message}`);
  } finally {
    await safeClose(browser, context);
  }
  return results;
}

async function buscaKabum(termo) {
  const results = [];
  const q = encodeURIComponent(termo);
  const url = `${config.URLS_BASE.kabum}/busca/${q}`;
  logger.info(`[KaBuM-PW] Buscando: ${termo}...`);
  const { browser, context, page } = await setupBrowser();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await tryAcceptCookies(page);
    await autoScroll(page);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const itemSelectorOptions = [
      'div.productCard',
      'li.productCard',
      'a[data-selenium="product-card"]',
      'a[href*="/produto/"]',
    ];
    let foundSel = null;
    for (const sel of itemSelectorOptions) {
      try { await page.waitForSelector(sel, { timeout: 8000 }); foundSel = sel; break; } catch {}
    }
    if (!foundSel) { logger.warn('[KaBuM-PW] Nenhum seletor de item encontrado.'); await captureDebug(page, 'kabum', termo); return results; }

    const offers = await page.$$eval(foundSel, (nodes) => {
      function pickText(el, sels) { for (const s of sels) { const n = el.querySelector(s); if (n && n.textContent) return n.textContent.trim(); } return null; }
         function pickHref(el, sels) {
           // Se o próprio elemento é um <a> com href
           if (el.tagName === 'A' && el.href) return el.href;
           for (const s of sels) {
             const n = el.querySelector(s);
             if (n && n.href) return n.href;
             if (n && n.getAttribute && n.getAttribute('href')) return n.getAttribute('href');
           }
           return null;
         }
      function pickImage(el, sels) { for (const s of sels) { const n = el.querySelector(s); if (n) return n.src || n.getAttribute('src') || n.getAttribute('data-src'); } return null; }
      const list = [];
      for (const el of nodes.slice(0, 30)) {
        const title = pickText(el, ['span.nameCard', 'h2', 'span.title', 'a[title]']);
        const priceText = pickText(el, ['span.priceCard', 'span.finalPrice', 'span[data-testid="price"]', 'span:has-text("R$")']);
        let link = pickHref(el, ['a[href*="/produto/"]', 'a[href]']);
        const image = pickImage(el, ['img', 'div img']);
        if (link && !link.startsWith('http')) { try { link = new URL(link, location.origin).href; } catch {} }
        list.push({ title, price: priceText, link, image });
      }
      return list;
    });

    for (const ofr of offers) {
      const priceNum = parsePriceBR(ofr.price);
      if (ofr.title && priceNum > 0 && ofr.link && hasSufficientMatch(ofr.title, termo)) {
        results.push({ loja: 'KaBuM!', title: ofr.title, price: priceNum, link: ofr.link, image: ofr.image });
      }
    }
    // Log detalhado para debug
    logger.info(`[KaBuM-PW] Ofertas extraídas para '${termo}': ${offers.length}`);
    offers.forEach((ofr, idx) => {
      logger.info(`[KaBuM-PW] [${idx+1}] Título: ${ofr.title} | Preço: ${ofr.price} | Link: ${ofr.link}`);
    });
    logger.info(`[KaBuM-PW] Ofertas válidas (após filtro): ${results.length}`);
    if (results.length === 0) await captureDebug(page, 'kabum', termo);
  } catch (e) {
    logger.warn(`[KaBuM-PW] Falha: ${e.message}`);
  } finally {
    await safeClose(browser, context);
  }
  return results;
}

module.exports = { buscaMagalu, buscaKabum };
