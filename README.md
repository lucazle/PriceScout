# Passo a Passo para rodar o Scraper com Playwright

### 1. Pré-requisitos

- Node.js (recomendado instalar via NVM)
- PostgreSQL
- npm (gerenciador de pacotes do Node.js)

### 2. Clonar o repositório e instalar dependências

```bash
git clone <seu-repo>
cd PriceScout
```

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd ../frontend
npm install
```

#### Scraper (Playwright)

```bash
cd ../backend/scraper
npm install
npx playwright install
# (Linux/WSL) Instale dependências do navegador:
sudo npx playwright install-deps
```

### 3. Configurar variáveis de ambiente

No diretório `backend`, crie um arquivo `.env` com:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=radar_admin
DB_PASSWORD=sua_senha_segura
DB_NAME=radar_db
JWT_SECRET=meu_jwt_secret_super_forte
```

### 4. Inicializar o banco de dados

```bash
cd backend
node init-db.js
```

### 5. Rodar o projeto

- **Backend**:  
	```bash
	cd backend
	npm run dev
	```
- **Frontend**:  
	```bash
	cd frontend
	npm run dev
	```
- **Scraper (Playwright)**:  
	```bash
	cd backend/scraper
	node run.js
	```
(PriceScout)
Um monitor de preços de notebooks que permite aos usuários seguir produtos específicos e receber alertas.

🚀 Tecnologias Usadas
Frontend: React (Vite), React Router, Axios

Backend: Node.js, Express.js, PostgreSQL

Buscador (Worker): Playwright

Autenticação: JWT (Tokens), bcryptjs (Hash de senha)

Ambiente: WSL (Ubuntu), VS Code

⚙️ Instalação e Configuração (Passo a Passo)
Siga estes passos dentro do seu terminal WSL (Ubuntu).

1. Pré-requisitos (Ambiente)
Instale o Node.js (via NVM):

Bash

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install --lts
nvm use --lts
Instale e inicie o PostgreSQL:

Bash

sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
2. Configurar o Banco de Dados
Acesse o Postgres:

Bash

sudo -u postgres psql
Crie o usuário e o banco (troque sua_senha_segura por uma senha real):

SQL

CREATE ROLE radar_admin LOGIN PASSWORD 'sua_senha_segura';
CREATE DATABASE radar_db OWNER radar_admin;
\q
3. Instalar o Projeto
Configurar o Backend:

Bash

# Navegue até a pasta do backend
cd backend
npm install
Crie um arquivo chamado .env na pasta backend com este conteúdo (e troque a senha):

DB_HOST=localhost
DB_PORT=5432
DB_USER=radar_admin
DB_PASSWORD=sua_senha_segura # <-- TROQUE PELA SENHA DO PASSO 2
DB_NAME=radar_db
JWT_SECRET=meu_jwt_secret_super_forte
Abra o arquivo backend/init-db.js e atualize a connectionString com a mesma senha que você colocou no .env.

Crie as tabelas (rode o script uma vez):

Bash

node init-db.js 
Configurar o Frontend:

Bash

# Volte para a raiz e entre no frontend
cd ../frontend
npm install
Configurar o Worker (Buscador):

Bash

# Volte para a raiz e entre no worker
cd ../worker
npm install

# Baixa os navegadores (Chromium)
npx playwright install

# Instala dependências do Linux para o Playwright
sudo npx playwright install-deps 
🏃‍♂️ Como Rodar a Aplicação
Você precisará de dois (ou três) terminais abertos.

Terminal 1: Rodar o Backend

Bash

cd backend
npm run dev
(API rodando em http://localhost:3001)

Terminal 2: Rodar o Frontend

Bash

cd frontend
npm run dev
(Acesse http://localhost:5173 no seu navegador)

Terminal 3: Rodar o Buscador (Quando quiser)

Bash

cd worker
node run-discovery.js
(Este script busca os preços e os salva no banco de dados)
