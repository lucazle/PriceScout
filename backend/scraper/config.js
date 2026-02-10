const URLS_BASE = {
  amazon: "https://www.amazon.com.br",
  mercadolivre: "https://lista.mercadolivre.com.br",
  magalu: "https://www.magazineluiza.com.br",
  kabum: "https://www.kabum.com.br"
};


// Quantas páginas buscar por padrão
const PAGINAS_A_BUSCAR = 1;

// Rotação de User-Agents para evitar bloqueios
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

// Exporta no formato CommonJS (que seu backend usa)
module.exports = {
  URLS_BASE,
  PAGINAS_A_BUSCAR,
  USER_AGENTS
};