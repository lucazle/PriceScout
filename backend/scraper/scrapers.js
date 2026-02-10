const axios = require('axios');
const cheerio = require('cheerio');
const config = require('./config');
const logger = require('./logger');
let pwScrapers = null;
try {
  pwScrapers = require('./playwrightScrapers');
} catch (e) {
  // Playwright scrapers são opcionais; se não estiverem presentes, seguimos com Axios/Cheerio para lojas compatíveis
}

// Removemos 'fs' e 'path' (não há mais debug)

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Função para obter o HTML da página com User-Agent personalizado
async function getSoup(url, userAgent, site) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Referer': 'https://www.google.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1'
      },
      timeout: 20000,
      validateStatus: status => status < 500
    });

    if (response.status !== 200) {
      logger.warn(`[Scraper] ${site} respondeu ${response.status} para ${url}`);
      return null;
    }

    return cheerio.load(response.data);
  } catch (error) {
    logger.warn(`[Scraper] Falha ao acessar ${url}: ${error.message}`);
    // Código de debug de erro removido
    return null;
  }
}


// --- FUNÇÕES DE EXTRAÇÃO ROBUSTAS ---
// Tenta múltiplos seletores até achar o texto
function extractText(item, selectors) {
    for (const selector of selectors) {
        const text = item.find(selector).first().text().trim();
        if (text) return text;
    }
    return null;
}
// Tenta múltiplos seletores até achar o link (href)
function extractLink(item, selectors) {
    for (const selector of selectors) {
        const link = item.find(selector).first().attr('href');
        if (link) return link;
    }
    return null;
}
// Tenta múltiplos seletores até achar a imagem (src ou data-src)
function extractImage(item, selectors) {
    for (const selector of selectors) {
        let image = item.find(selector).first().attr('src');
        if (image) return image;
        image = item.find(selector).first().attr('data-src');
        if (image) return image;
    }
    return null;
}
// Converte "R$ 1.234,56" ou "1.234" para 1234.56
function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const cleanPrice = priceStr
        .replace("R$", "")
        .replace(/\./g, "") // Remove pontos de milhar
        .replace(",", ".") // Troca vírgula por ponto decimal
        .trim();
    return parseFloat(cleanPrice) || 0;
}

function normalizeText(text) {
    if (!text) return '';
    return text
        .toLowerCase() // Converte para minúsculas
        .normalize('NFD') // Separa acentos das letras
        .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
        .replace(/[^\w\s]/gi, ''); // Remove pontuação (deixa só letras, números e espaços)
}

// const { withBrowser } = require('./browser');

// // --- SCRAPER DA SHOPEE
// async function buscaShopee(termo) {
//   return withBrowser(async (page) => {
//     const results = [];
//     const q = termo.replace(/ /g, '%20');
//     const url = `https://shopee.com.br/search?keyword=${q}`;

//     logger.info(`[Shopee] Buscando: ${termo}...`);

//     await page.goto(url, { waitUntil: 'networkidle' });
//     await page.waitForTimeout(3000);

//     const items = await page.$$eval(
//       'div[data-sqe="item"]',
//       cards =>
//         cards.slice(0, 10).map(card => {
//           const title =
//             card.querySelector('[aria-label]')?.getAttribute('aria-label');

//           const priceText =
//             [...card.querySelectorAll('span')]
//               .map(s => s.innerText)
//               .find(t => t.includes('R$')) || '';

//           const link = card.querySelector('a')?.href;
//           const image = card.querySelector('img')?.src;

//           return { title, priceText, link, image };
//         })
//     );

//     for (const i of items) {
//       const price = parsePrice(i.priceText);
//       if (!i.title || price <= 0) continue;

//       results.push({
//         loja: 'Shopee',
//         title: i.title,
//         price,
//         link: i.link,
//         image: i.image
//       });
//     }

//     logger.info(`[Shopee] Encontrados ${results.length} itens`);
//     return results;
//   });
// }




// // --- SCRAPER DO ALIEXPRESS ---
// async function buscaAliExpress(termo) {
//   return withBrowser(async (page) => {
//     const results = [];
//     const q = termo.replace(/ /g, '+');
//     const url = `https://pt.aliexpress.com/wholesale?SearchText=${q}`;

//     logger.info(`[AliExpress] Buscando: ${termo}...`);

//     await page.goto(url, { waitUntil: 'networkidle' });
//     await page.waitForTimeout(3000);

//     const items = await page.$$eval(
//       'a[href*="/item/"]',
//       links =>
//         links.slice(0, 10).map(link => {
//           const card = link.closest('div');
//           const title =
//             card?.querySelector('h1,h2,h3')?.innerText || '';
//           const priceText =
//             [...card?.querySelectorAll('span') || []]
//               .map(s => s.innerText)
//               .find(t => t.includes('R$')) || '';
//           const image = card?.querySelector('img')?.src;

//           return {
//             title,
//             priceText,
//             link: link.href,
//             image
//           };
//         })
//     );

//     for (const i of items) {
//       const price = parsePrice(i.priceText);
//       if (!i.title || price <= 0) continue;

//       results.push({
//         loja: 'AliExpress',
//         title: i.title,
//         price,
//         link: i.link,
//         image: i.image
//       });
//     }

//     logger.info(`[AliExpress] Encontrados ${results.length} itens`);
//     return results;
//   });
// }








// --- SCRAPER DA AMAZON (v2 Robusto) ---
async function buscaAmazon(termo, userAgent) {
  const results = [];
  const q = termo.replace(/ /g, "+");
  const url = `${config.URLS_BASE.amazon}/s?k=${q}`;
  logger.info(`[Amazon] Buscando: ${termo}...`);
  
  const $ = await getSoup(url, userAgent, 'amazon');
  if (!$) return results;

  const items = $('div[data-component-type="s-search-result"]');
  logger.info(`[Amazon] Seletor principal encontrou ${items.length} itens.`);

  // *** MUDANÇA AQUI ***
  // 1. Normaliza o termo de busca (o nome do seu notebook)
  const normalizedTermo = normalizeText(termo);
  // 2. Pega as palavras-chave principais (ignora "de", "para", etc.)
  const keywords = normalizedTermo.split(' ').filter(k => k.length > 2); 

  // 3. Aumentamos o slice para 10 para ter mais chance de achar
  items.slice(0, 10).each((i, el) => {
    const item = $(el);

    const title = extractText(item, [
        'h2 a span'
    ]);
    
    // ... (extração de link, price, image continua igual) ...
    // (cole o seu código de extrair price, link e image aqui)
    let link = extractLink(item, ['h2 a.a-link-normal']);
    if (link && !link.startsWith('http')) {
        link = "https://www.amazon.com.br" + link;
    }
    let price = 0;
    const priceText = item.find(".a-price .a-offscreen").first().text();
    price = parsePrice(priceText);
    if (price === 0) {
        const priceWhole = item.find(".a-price-whole").first().text();
        const priceFraction = item.find(".a-price-fraction").first().text();
        if (priceWhole) {
            price = parsePrice(`${priceWhole},${priceFraction}`);
        }
    }
    const image = extractImage(item, ['img.s-image']);
    // ... (fim do trecho colado)

    // *** ESTE É O NOVO FILTRO ***
    if (title && price > 0 && link) {
        const normalizedTitle = normalizeText(title);

        // 4. Verifica se o título do resultado contém TODAS as palavras-chave
        const hasAllKeywords = keywords.every(key => normalizedTitle.includes(key));

        if (hasAllKeywords) {
            logger.info(`[Amazon] Encontrado (Match): ${title.substring(0, 30)}... (R$ ${price})`);
            results.push({ loja: 'Amazon', title, price, link, image });
        } else {
            // Opcional: logar por que pulou
            // logger.warn(`[Amazon] Item pulado (não bate com keywords): ${title.substring(0, 30)}...`);
        }
    } else if (title) {
        logger.warn(`[Amazon] Item pulado (sem preço?): ${title.substring(0, 30)}...`);
    }
  });
  return results;
}

// --- SCRAPER DO MERCADO LIVRE (v2 Robusto) ---
async function buscaMercadoLivre(termo, userAgent) {
  const results = [];
  const q = termo.replace(/ /g, "-");
  const url = `${config.URLS_BASE.mercadolivre}/${q}_Desde_1`;
  logger.info(`[MercadoLivre] Buscando: ${termo}...`);

  const $ = await getSoup(url, userAgent, 'mercadolivre');
  if (!$) return results;

  const items = $("li.ui-search-layout__item, div.ui-search-result__wrapper, div.andes-card");
  logger.info(`[MercadoLivre] Seletor principal encontrou ${items.length} itens.`);

  // *** MUDANÇA AQUI ***
  const normalizedTermo = normalizeText(termo);
  const keywords = normalizedTermo.split(' ').filter(k => k.length > 2);

  items.slice(0, 10).each((i, el) => {
    const item = $(el);

    const title = extractText(item, [
        'h2.ui-search-item__title',
        'a.poly-component__title'
    ]);
    
    // ... (extração de link, price, image continua igual) ...
    // (cole o seu código de extrair price, link e image aqui)
    const link = extractLink(item, ['a.ui-search-link', 'a.poly-component__title']);
    const symbol = item.find(".andes-money-amount__currency-symbol").first().text();
    const priceText = item.find(".andes-money-amount__fraction").first().text();
    let price = 0;
    if (priceText) {
        price = parsePrice(priceText);
    }
    if (price === 0 && symbol === "R$") {
        const altPrice = item.find("span.raw-price, span.price-tag-fraction").first().text();
        price = parsePrice(altPrice);
    }
    const image = extractImage(item, [
        'img.ui-search-result-image__element',
        'img.poly-component__picture',
        'img.andes-carousel-snapped__img' // Aquele que adicionamos antes
    ]);
    // ... (fim do trecho colado)

    // *** ESTE É O NOVO FILTRO ***
    if (title && price > 0 && link) {
        const normalizedTitle = normalizeText(title);

        const hasAllKeywords = keywords.every(key => normalizedTitle.includes(key));

        if (hasAllKeywords) {
            logger.info(`[MercadoLivre] Encontrado (Match): ${title.substring(0, 30)}... (R$ ${price})`);
            results.push({ loja: 'Mercado Livre', title, price, link, image });
        } else {
            // logger.warn(`[MercadoLivre] Item pulado (não bate com keywords): ${title.substring(0, 30)}...`);
        }
    } else if (title) {
        logger.warn(`[MercadoLivre] Item pulado (sem preço?): ${title.substring(0, 30)}...`);
    }
  });
  return results;
}

// Delegações para scrapers Playwright (somente lojas ativas)

async function buscaMagalu(termo, _userAgent) {
  if (!pwScrapers || !pwScrapers.buscaMagalu) {
    logger.warn('[Magalu] Scraper Playwright indisponível. Retornando lista vazia.');
    return [];
  }
  return pwScrapers.buscaMagalu(termo);
}

async function buscaKabum(termo, _userAgent) {
  if (!pwScrapers || !pwScrapers.buscaKabum) {
    logger.warn('[KaBuM] Scraper Playwright indisponível. Retornando lista vazia.');
    return [];
  }
  return pwScrapers.buscaKabum(termo);
}

module.exports = {
  buscaAmazon,
  buscaMercadoLivre,
  buscaMagalu,
  buscaKabum,
  sleep
};
