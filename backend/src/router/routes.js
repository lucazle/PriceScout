const express = require('express');
const router = express.Router();
const db = require('../../db');
const monitoramentoController = require('../controllers/MonitoramentoController');
const perfilController = require('../controllers/PerfilController');

// --- Rotas de Dashboard/Monitoramento ---

// Rota GET: /dashboard
router.get('/dashboard', monitoramentoController.getProdutosMonitorados);

// Rota POST: /api/run-scraper
router.post('/api/run-scraper', monitoramentoController.runScraper);


// --- Rotas de Produto (para Procurar.jsx) ---

// Rota GET: /products/all (Lista os produtos com IMAGEM)
router.get('/products/all', async (req, res) => {
    try {
        // SQL atualizado para pegar a url_imagem que incluímos no banco
        const { rows } = await db.query('SELECT id, nome_produto, url_imagem FROM Produtos ORDER BY nome_produto');
        return res.json(rows);
    } catch (error) {
        console.error("Erro ao buscar todos os produtos:", error.stack);
        return res.status(500).json({ message: "Erro interno ao buscar produtos." });
    }
});


// --- Rotas de Perfil ---

// Rota GET: /perfil (Obter dados do usuário)
router.get('/perfil', perfilController.getPerfilUsuario);

// Rota PUT: /perfil (Atualizar informações básicas)
router.put('/perfil', perfilController.atualizarPerfil);

// Rota PUT: /perfil/senha (Atualizar senha)
router.put('/perfil/senha', perfilController.atualizarSenha);


module.exports = router;