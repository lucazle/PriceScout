require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const createTablesQuery = `
  CREATE TABLE IF NOT EXISTS Usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Produtos (
  id SERIAL PRIMARY KEY,
  nome_produto VARCHAR(255) NOT NULL,
  termo_busca VARCHAR(255) UNIQUE NOT NULL,
  cpu_base VARCHAR(100),
  ram_base VARCHAR(50),
  armazenamento_base VARCHAR(100),
  tela_base VARCHAR(50)
);

  CREATE TABLE IF NOT EXISTS Ofertas (
    id SERIAL PRIMARY KEY,
    produto_id INT REFERENCES Produtos(id) ON DELETE CASCADE,
    loja VARCHAR(100) NOT NULL,
    url VARCHAR(2048) NOT NULL UNIQUE,
    titulo_extraido TEXT NOT NULL,
    preco_atual NUMERIC(10, 2),
    imagem_url TEXT,
    data_ultima_verificacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cpu_extraido VARCHAR(100),
    ram_extraido VARCHAR(50),
    armazenamento_extraido VARCHAR(100),
    placa_video_extraida VARCHAR(100),
    tela_extraida VARCHAR(50)
  );

  CREATE TABLE IF NOT EXISTS Historico_Precos (
    id SERIAL PRIMARY KEY,
    oferta_id INT REFERENCES Ofertas(id) ON DELETE CASCADE,
    data_coleta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    preco NUMERIC(10, 2) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Usuarios_Seguindo (
    usuario_id INT REFERENCES Usuarios(id) ON DELETE CASCADE,
    produto_id INT REFERENCES Produtos(id) ON DELETE CASCADE,

    preco_maximo_desejado NUMERIC(10, 2),
    ram_desejada VARCHAR(50),
    armazenamento_desejado VARCHAR(50),
    memoria_tipo_desejada VARCHAR(50),
    gpu_tipo_desejada VARCHAR(50),
    cpu_modelo_desejado VARCHAR(50),
    so_desejado VARCHAR(50),
    tela_tipo_desejada VARCHAR(50),

    PRIMARY KEY (usuario_id, produto_id)
  );
`;

async function setupDatabase() {
  try {
    await client.connect();
    console.log('Conectado ao banco de dados!');

    await client.query(createTablesQuery);
    console.log('Tabelas criadas com sucesso (ou já existiam)!');

    await client.query(`
      INSERT INTO Produtos (nome_produto, termo_busca, cpu_base, ram_base, armazenamento_base, tela_base)
      VALUES 
        ('Vivobook 15', 'notebook asus vivobook 15', 'Core i5', '8GB', '512GB SSD', '15.6'),
        ('Acer Aspire 5', 'notebook acer aspire 5', 'Core i5', '8GB', '512GB SSD', '15.6'),
        ('Dell G15', 'notebook dell g15', 'Core i7', '16GB', '512GB SSD', '15.6'),
        ('MacBook Air M2', 'macbook air m2', 'M2', '8GB', '256GB SSD', '13.6'),
        ('Lenovo IdeaPad 3', 'notebook lenovo ideapad 3 ryzen 7', 'Ryzen 7', '12GB', '512GB SSD', '15.6')
      ON CONFLICT (termo_busca) DO NOTHING;
    `);

    console.log('Produtos fixos inseridos com sucesso!');
  } catch (err) {
    console.error('Erro ao configurar o banco:', err);
  } finally {
    await client.end();
    console.log('Desconectado do banco.');
  }
}

setupDatabase();
