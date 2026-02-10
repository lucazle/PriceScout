require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db'); 

// --- IMPORTANTE: O módulo do scraper foi reativado aqui ---
const scraper = require('./scraper/run'); 

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Middleware de Autenticação ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user; 
        next();
    });
};

app.get('/', (req, res) => res.json({ message: 'API PriceScout Online 🚀' }));

// --- ROTAS DE USUÁRIO (Auth) ---

app.post('/users/register', async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Campos obrigatórios.' });
    try {
        const senhaHash = await bcrypt.hash(senha, 10);
        const result = await db.query(
            'INSERT INTO Usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, email',
            [nome, email, senhaHash]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'E-mail já cadastrado.' });
        console.error(err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

app.post('/users/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const result = await db.query('SELECT * FROM Usuarios WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(senha, user.senha_hash))) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        const token = jwt.sign(
            { userId: user.id, email: user.email, nome: user.nome }, 
            process.env.JWT_SECRET, 
            { expiresIn: '2h' }
        );
        res.json({ token, user: { id: user.id, nome: user.nome, email: user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// --- ROTAS PROTEGIDAS (AÇÕES DO APP) ---

// Rota para ADICIONAR um novo produto ao banco
app.post('/products/add', authenticateToken, async (req, res) => {
    const { nome_produto, termo_busca, cpu_base, ram_base, armazenamento_base, tela_base } = req.body;
    const { userId } = req.user;

    if (!nome_produto || !termo_busca) {
        return res.status(400).json({ error: 'Nome e Termo de Busca são obrigatórios.' });
    }

    const query = `
        WITH novo_produto AS (
            INSERT INTO Produtos (
                nome_produto, termo_busca, cpu_base, ram_base, armazenamento_base, tela_base
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        )
        INSERT INTO Usuarios_Seguindo (
            usuario_id, produto_id, 
            preco_maximo_desejado, ram_desejada, armazenamento_desejado, memoria_tipo_desejada, gpu_tipo_desejada, cpu_modelo_desejado, so_desejado, tela_tipo_desejada
        )
        VALUES ($7, (SELECT id FROM novo_produto), 
            NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
        RETURNING produto_id;
    `;

    try {
        const result = await db.query(query, [
            nome_produto, termo_busca, cpu_base || null, ram_base || null, 
            armazenamento_base || null, tela_base || null, userId
        ]);
        res.status(201).json({ message: 'Produto adicionado e monitorado!', produto: result.rows[0] });
    } catch (err) {
        console.error("Erro ao adicionar produto:", err);
        res.status(500).json({ error: 'Falha ao adicionar produto.' });
    }
});

// --- ROTA DO SCRAPER REATIVADA ---
app.post('/api/run-scraper', authenticateToken, async (req, res) => {
    if (!scraper || !scraper.executarScraper) {
        console.error("ERRO: Módulo scraper não carregado ou função executarScraper não encontrada.");
        return res.status(500).json({ error: 'Serviço de scraper indisponível no servidor.' });
    }
    
    console.log(`[API] Usuário ${req.user.nome} solicitou atualização de preços.`);
    
    try {
        const resultado = await scraper.executarScraper();
        console.log("Resultado do Scraper:", resultado);
        res.json({ 
            message: `Varredura concluída! ${resultado.total} ofertas atualizadas.`, 
            detalhes: resultado 
        });
    } catch (err) {
        console.error("Erro fatal ao executar o scraper:", err);
        res.status(500).json({ error: 'Falha na execução do scraper. Verifique o terminal do backend.' });
    }
});

// Rota para Listar TODOS os produtos (AJUSTADA PARA IMAGEM)
app.get('/products/all', authenticateToken, async (req, res) => {
    try {
        // Mudamos SELECT * para garantir que url_imagem venha do banco
        const result = await db.query('SELECT id, nome_produto, url_imagem FROM Produtos ORDER BY nome_produto');
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar todos os produtos:", err);
        res.status(500).json({ error: 'Erro ao buscar produtos.' });
    }
});

// Rota para Detalhes do Produto + Ofertas
app.get('/products/:id', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT p.*, 
            (SELECT COALESCE(json_agg(o.* ORDER BY o.preco_atual ASC), '[]') FROM Ofertas o WHERE o.produto_id = p.id) as ofertas
            FROM Produtos p WHERE p.id = $1
        `;
        const result = await db.query(query, [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});

// Rota do Dashboard (AJUSTADA PARA IMAGEM)
app.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT p.*, 
            us.preco_maximo_desejado, us.ram_desejada, us.armazenamento_desejado, 
            us.memoria_tipo_desejada, us.gpu_tipo_desejada, us.cpu_modelo_desejado, us.so_desejado, us.tela_tipo_desejada,
            (SELECT COALESCE(json_agg(o.* ORDER BY o.preco_atual ASC), '[]') FROM Ofertas o WHERE o.produto_id = p.id) as ofertas
            FROM Usuarios_Seguindo us
            JOIN Produtos p ON us.produto_id = p.id
            WHERE us.usuario_id = $1
            ORDER BY p.nome_produto;
        `;
        // p.* já traz a url_imagem se ela estiver na tabela Produtos
        const result = await db.query(query, [req.user.userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao carregar dashboard.' });
    }
});

// Seguir / Editar Preço/Filtros
app.post('/products/:id/follow', authenticateToken, async (req, res) => {
    const { 
        preco_maximo_desejado, ram_desejada, armazenamento_desejado, 
        memoria_tipo_desejada, gpu_tipo_desejada, cpu_modelo_desejado, 
        so_desejado, tela_tipo_desejada 
    } = req.body;
    
    try {
        await db.query(
            `INSERT INTO Usuarios_Seguindo (
                usuario_id, produto_id, 
                preco_maximo_desejado, ram_desejada, armazenamento_desejado, memoria_tipo_desejada, gpu_tipo_desejada, cpu_modelo_desejado, so_desejado, tela_tipo_desejada
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (usuario_id, produto_id) DO UPDATE SET 
                preco_maximo_desejado = $3, ram_desejada = $4, armazenamento_desejado = $5,
                memoria_tipo_desejada = $6, gpu_tipo_desejada = $7, cpu_modelo_desejado = $8,
                so_desejado = $9, tela_tipo_desejada = $10`,
            [
                req.user.userId, req.params.id, 
                preco_maximo_desejado || null, ram_desejada || null, armazenamento_desejado || null,
                memoria_tipo_desejada || null, gpu_tipo_desejada || null, cpu_modelo_desejado || null,
                so_desejado || null, tela_tipo_desejada || null
            ]
        );
        res.status(200).json({ message: 'Monitoramento de produto atualizado.' });
    } catch (err) { 
        console.error("Erro ao seguir/editar:", err);
        res.status(500).json({ error: 'Erro ao seguir/editar.' }); 
    }
});

// Deixar de Seguir
app.delete('/products/:id/follow', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM Usuarios_Seguindo WHERE usuario_id = $1 AND produto_id = $2', [req.user.userId, req.params.id]);
        res.status(204).send();
    } catch (err) { res.status(500).json({ error: 'Erro ao deixar de seguir.' }); }
});

// --- ROTAS DE PERFIL ---

app.get('/perfil', authenticateToken, async (req, res) => {
    const usuarioId = req.user.userId;
    try {
        const query = 'SELECT id, nome, email FROM Usuarios WHERE id = $1';
        const { rows } = await db.query(query, [usuarioId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
        return res.json(rows[0]);
    } catch (error) {
        console.error("Erro ao buscar perfil:", error.stack);
        return res.status(500).json({ message: "Erro interno." });
    }
});

app.put('/perfil', authenticateToken, async (req, res) => {
    const usuarioId = req.user.userId;
    const { nome, email } = req.body;
    if (!nome || !email) return res.status(400).json({ message: 'Nome e email obrigatórios.' });
    try {
        const emailCheck = await db.query('SELECT id FROM Usuarios WHERE email = $1 AND id != $2', [email, usuarioId]);
        if (emailCheck.rows.length > 0) return res.status(409).json({ message: 'E-mail em uso.' });
        const query = 'UPDATE Usuarios SET nome = $1, email = $2 WHERE id = $3 RETURNING id, nome, email';
        const { rows } = await db.query(query, [nome, email, usuarioId]);
        return res.json({ message: 'Perfil atualizado!', user: rows[0] });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao atualizar." });
    }
});

app.put('/perfil/senha', authenticateToken, async (req, res) => {
    const usuarioId = req.user.userId;
    const { senhaAtual, novaSenha } = req.body;
    if (!senhaAtual || !novaSenha) return res.status(400).json({ message: 'Preencha as senhas.' });
    try {
        const { rows } = await db.query('SELECT senha_hash FROM Usuarios WHERE id = $1', [usuarioId]);
        const senhaValida = await bcrypt.compare(senhaAtual, rows[0].senha_hash);
        if (!senhaValida) return res.status(401).json({ message: 'Senha atual incorreta.' });
        const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
        await db.query('UPDATE Usuarios SET senha_hash = $1 WHERE id = $2', [novaSenhaHash, usuarioId]);
        return res.json({ message: 'Senha atualizada!' });
    } catch (error) {
        return res.status(500).json({ message: "Erro interno." });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor da API rodando em http://localhost:${PORT}`);
});