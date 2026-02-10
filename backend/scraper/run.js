require('dotenv').config();
const db = require('../db'); // Conexão DB do PriceScout
const config = require('./config');
const scrapers = require('./scrapers');
const logger = require('./logger');
// require('dotenv').config({ path: 'C:\\Users\\anime\\Documents\\PriceScout\\backend\\.env' }); // Carrega variáveis de ambiente (teste local)

// Regex para extrair specs do TÍTULO DA OFERTA
const REGEX = {
    cpu: /(i[3579]|ryzen\s*[3579])(\s*-\s*\w+)?/i,
    ram: /(\d+)\s*(GB|G)\s*(DE\s*)?(RAM)?/gi,
    armazenamento: /(\d+)\s*(GB|TB)\s*(SSD|HD|NVME)/i,
    gpu: /(RTX\s*\d+|GTX\s*\d+|Radeon\s*[\w\d]+|Iris\s*Xe)/i,
    tela: /(\d{2}\.?\d?)\s*(''|polegadas|pol)/i
};

// Extrai specs do título da OFERTA encontrada
function extrairSpecs(titulo) {
    const specs = { cpu: null, ram: null, armazenamento: null, gpu: null, tela: null };
    try {
        let match = titulo.match(REGEX.cpu);
        if (match) specs.cpu = match[0].trim().toUpperCase();

        const ramMatches = Array.from(titulo.matchAll(REGEX.ram));
        const ramMatch = ramMatches.find(m => m[0].toUpperCase().includes("RAM")) || ramMatches[0];
        if (ramMatch) specs.ram = `${ramMatch[1] || ramMatch[0].match(/\d+/)[0]}GB`;

        match = titulo.match(REGEX.armazenamento);
        if (match) specs.armazenamento = match[0].toUpperCase().replace(/\s*(SSD|HD|NVME)/, ' $1');

        match = titulo.match(REGEX.gpu);
        if (match) specs.gpu = match[0].toUpperCase();

        match = titulo.match(REGEX.tela);
        if (match) specs.tela = `${match[1]}"`;

    } catch (e) { logger.warn(`Regex falhou para: ${titulo}`); }
    return specs;
}

// Salva as ofertas encontradas no banco de dados
async function salvarOfertas(produtoId, ofertas) {
    let count = 0;
    for (const oferta of ofertas) {
        // Extrai specs do título da oferta
        const specs = extrairSpecs(oferta.title);

        const query = `
            INSERT INTO Ofertas (
                produto_id, loja, url, titulo_extraido, preco_atual, imagem_url,
                cpu_extraido, ram_extraido, armazenamento_extraido, placa_video_extraida, tela_extraida,
                data_ultima_verificacao
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
            ON CONFLICT (url) DO UPDATE SET 
                preco_atual = EXCLUDED.preco_atual,
                data_ultima_verificacao = NOW(),
                titulo_extraido = EXCLUDED.titulo_extraido,
                imagem_url = EXCLUDED.imagem_url,
                cpu_extraido = EXCLUDED.cpu_extraido,
                ram_extraido = EXCLUDED.ram_extraido,
                armazenamento_extraido = EXCLUDED.armazenamento_extraido,
                placa_video_extraida = EXCLUDED.placa_video_extraida,
                tela_extraida = EXCLUDED.tela_extraida
            RETURNING id, (xmax IS NOT NULL) as "updated"; 
            -- xmax é um campo interno do postgres que diz se a linha foi atualizada
        `;

        const values = [
            produtoId, oferta.loja, oferta.link, oferta.title, oferta.price, oferta.image,
            specs.cpu, specs.ram, specs.armazenamento, specs.gpu, specs.tela
        ];

        try {
            const res = await db.query(query, values);
            // Se a oferta foi inserida ou atualizada, salvamos no histórico de preços
            if (res.rows[0]) {
                await db.query(
                    "INSERT INTO Historico_Precos (oferta_id, preco) VALUES ($1, $2)",
                    [res.rows[0].id, oferta.price]
                );
                count++;
            }
        } catch (e) {
            logger.error(`[DB] Erro ao salvar oferta: ${e.message}`);
        }
    }
    return count;
}

// Pega um User-Agent aleatório
const getUserAgent = () => config.USER_AGENTS[Math.floor(Math.random() * config.USER_AGENTS.length)];

// --- FUNÇÃO PRINCIPAL DO EXECUTOR ---
async function executarScraper() {
    logger.info(">>> Iniciando ciclo de varredura de preços...");
    
    // 1. Busca os produtos cadastrados no banco
    let produtos;
    try {
        const res = await db.query("SELECT * FROM Produtos");
        produtos = res.rows;
    } catch (e) {
        logger.error("Erro fatal ao buscar produtos:", e);
        return { success: false, error: e.message, total: 0 };
    }

    logger.info(`>>> ${produtos.length} produtos para monitorar.`);
    let totalAtualizados = 0;
    const resumo = {
        amazon: { encontrados: 0, salvos: 0 },
        mercadolivre: { encontrados: 0, salvos: 0 },
        magalu: { encontrados: 0, salvos: 0 },
        kabum: { encontrados: 0, salvos: 0 }
    };


    const todasAsFuncoes = [
        scrapers.buscaAmazon,
        scrapers.buscaMercadoLivre,
        scrapers.buscaMagalu,
        scrapers.buscaKabum
    ];

    // 2. Itera sobre cada produto
    for (const produto of produtos) {
        const termo = produto.termo_busca; 
        
        // 3. Itera sobre cada função de scraper (Amazon, ML, etc)
        for (const funcaoScraper of todasAsFuncoes) {
            try {
                const ofertas = await funcaoScraper(termo, getUserAgent());
                // Contabiliza encontrados por loja
                for (const oferta of ofertas) {
                    const lojaKey = (oferta.loja || '').toLowerCase();
                    if (lojaKey.includes('amazon')) resumo.amazon.encontrados++;
                    else if (lojaKey.includes('mercado')) resumo.mercadolivre.encontrados++;
                    else if (lojaKey.includes('magalu') || lojaKey.includes('magazine')) resumo.magalu.encontrados++;
                    else if (lojaKey.includes('kabum')) resumo.kabum.encontrados++;
                }

                const salvas = await salvarOfertas(produto.id, ofertas);
                totalAtualizados += salvas;
                // Contabiliza salvos por loja (aproximação: distribui proporcionalmente)
                // Aqui, como salvamos em lote por produto, somamos 1 por oferta salva, olhando a loja
                for (const oferta of ofertas) {
                    const lojaKey = (oferta.loja || '').toLowerCase();
                    if (lojaKey.includes('amazon')) resumo.amazon.salvos++;
                    else if (lojaKey.includes('mercado')) resumo.mercadolivre.salvos++;
                    else if (lojaKey.includes('magalu') || lojaKey.includes('magazine')) resumo.magalu.salvos++;
                    else if (lojaKey.includes('kabum')) resumo.kabum.salvos++;
                }
            } catch (e) { 
                logger.error(`Erro ao rodar scraper para ${termo}:`, e.message); 
            }
            await scrapers.sleep(1500 + Math.random() * 2000); // Delay
        }
    }

    logger.info(`>>> Varredura finalizada. ${totalAtualizados} ofertas salvas/atualizadas.`);
    logger.info(`>>> Resumo por loja:`);
    logger.info(`    Amazon: encontrados=${resumo.amazon.encontrados}, salvos=${resumo.amazon.salvos}`);
    logger.info(`    Mercado Livre: encontrados=${resumo.mercadolivre.encontrados}, salvos=${resumo.mercadolivre.salvos}`);
    logger.info(`    Magalu: encontrados=${resumo.magalu.encontrados}, salvos=${resumo.magalu.salvos}`);
    logger.info(`    KaBuM!: encontrados=${resumo.kabum.encontrados}, salvos=${resumo.kabum.salvos}`);
    return { success: true, total: totalAtualizados, error: null };
}

module.exports = { executarScraper };

// Executa diretamente quando chamado via `node run.js`
if (require.main === module) {
    executarScraper()
        .then((res) => {
            logger.info(`>>> Fim da execução. Sucesso=${res.success}, total=${res.total}`);
            process.exit(0);
        })
        .catch((err) => {
            logger.error(`Falha na execução do scraper: ${err.message}`);
            process.exit(1);
        });
}