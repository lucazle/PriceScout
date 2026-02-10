// backend/src/controllers/MonitoramentoController.js
const db = require('../../db');

const TEST_USER_ID = 1; 

// ROTA: GET /dashboard
async function getProdutosMonitorados(req, res) {
    // Assume ID 1 para testes se o JWT não estiver configurado
    const usuarioId = req.user ? req.user.id : TEST_USER_ID; 

    try {
        // Query CORRIGIDA: Usa preco_maximo_desejado e junta todas as tabelas
       const query = `
    SELECT
        p.id,
        p.nome_produto,
        p.url_imagem,
        p.termo_busca, 
        us.preco_maximo_desejado,
        us.ram_desejada,
        us.cpu_modelo_desejado,
        o.loja,
        o.preco_atual,
        o.url,
        o.data_ultima_verificacao
            FROM
                Produtos p
            JOIN
                Usuarios_Seguindo us ON p.id = us.produto_id
            LEFT JOIN
                Ofertas o ON p.id = o.produto_id
            WHERE
                us.usuario_id = $1;
        `;
        
        const { rows } = await db.query(query, [usuarioId]);
        
        // Formata os dados para o Frontend (agrupa ofertas por produto)
        const produtosFormatados = {};
        rows.forEach(row => {
            if (!produtosFormatados[row.id]) {
               produtosFormatados[row.id] = {
    id: row.id,
    nome_produto: row.nome_produto,
    url_imagem: row.url_imagem, // 👈 AQUI
    preco_maximo_desejado: row.preco_maximo_desejado,
    ram_desejada: row.ram_desejada,
    cpu_modelo_desejado: row.cpu_modelo_desejado,
    ofertas: []
};
            }
            if (row.preco_atual) {
                produtosFormatados[row.id].ofertas.push({
                    loja: row.loja,
                    preco_atual: row.preco_atual,
                    url: row.url
                });
            }
        });

        return res.json(Object.values(produtosFormatados));

    } catch (error) {
        console.error("Erro ao buscar monitoramentos para o dashboard:", error.stack);
        return res.status(500).json({ message: "Erro interno do servidor ao carregar dashboard." });
    }
}

// ROTA: POST /api/run-scraper (Botão Atualizar Preços Agora)
async function runScraper(req, res) {
    console.log("LOG: API solicitou atualização de preços.");
    return res.json({ message: "Solicitação de varredura recebida. Execução do scraper em andamento." });
}

module.exports = {
    getProdutosMonitorados,
    runScraper
};