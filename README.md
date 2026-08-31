# ERP Modular

Sistema de gestão empresarial (ERP) modular, desenvolvido como projeto de portfólio para demonstrar arquitetura de software, boas práticas de engenharia e desenvolvimento full-stack ponta a ponta.

O projeto é dividido em módulos independentes — cada um com seu próprio ciclo de desenvolvimento, testes e documentação — cobrindo desde autenticação e dashboard até vendas, estoque e financeiro.

## Stack Tecnológica

### Back-end
- **Python** + **Django** + **Django REST Framework**
- **SQLite** (desenvolvimento)
- **JWT** (SimpleJWT) para autenticação, com blacklist de tokens
- **OAuth2** (Google e GitHub) via `social-auth-app-django`
- **django-cors-headers** para integração com o front-end
- **django-filter** para filtros avançados nas APIs

### Front-end
- **React** + **TypeScript** + **Vite**
- **Tailwind CSS v4**
- **React Router** (rotas protegidas por autenticação)
- **Recharts** (gráficos)
- **Framer Motion** (animações)
- **Axios** (consumo da API)
- **Lucide React** (ícones)

### Design
- Estilo visual inspirado no **Vision UI Pro**: fundo com gradiente vibrante, cards em **glassmorphism** (vidro fosco), sidebar com navegação lateral fixa.

## Estrutura do Projeto

```
erp_modular/
├── apps/                  # Apps Django (um por módulo)
│   ├── usuarios/          # Autenticação, cadastro, OAuth
│   ├── clientes/          # CRM
│   ├── produtos/          # Catálogo de produtos e fornecedores
│   ├── estoque/           # Movimentações de estoque
│   ├── vendas/             # Pedidos de venda
│   ├── financeiro/        # Lançamentos financeiros
│   ├── compras/           # Pedidos de compra
│   └── dashboard/         # Endpoints agregados para o painel
├── core/                  # Configurações do Django
├── frontend/               # Aplicação React (SPA)
│   └── src/
│       ├── components/    # Componentes reutilizáveis (Sidebar, Layout, etc.)
│       ├── pages/         # Telas (Login, Cadastro, Dashboard, etc.)
│       ├── services/      # Comunicação com a API (axios)
│       └── types/         # Tipos TypeScript
└── manage.py
```

## Módulos

| Módulo | Back-end | Front-end |
|---|---|---|
| Usuários / Autenticação | ✅ Concluído (JWT, OAuth Google/GitHub, recuperação de senha) | ✅ Login, Cadastro |
| Dashboard | ✅ Concluído (4 endpoints agregados) | ✅ Concluído |
| Clientes (CRM) | ✅ Concluído | ⏳ Em construção |
| Produtos | ✅ Concluído | ⏳ Em construção |
| Estoque | ✅ Concluído | ⏳ Em construção |
| Vendas | ✅ Concluído | ⏳ Em construção |
| Financeiro | ✅ Concluído | ⏳ Em construção |
| Compras | ✅ Concluído | ⏳ Em construção |
| RH | ⏳ Pendente | ⏳ Pendente |
| Relatórios | ⏳ Pendente | ⏳ Pendente |
| Agenda | ⏳ Pendente | ⏳ Pendente |
| Sistema de Tarefas | ⏳ Pendente | ⏳ Pendente |
| Administração | ⏳ Pendente | ⏳ Pendente |

## Como Rodar o Projeto Localmente

### Pré-requisitos
- Python 3.10+
- Node.js 18+
- Git

### Back-end (Django)

```bash
# Clonar o repositório
git clone https://github.com/PaNiiCz/erp-modular.git
cd erp-modular

# Criar e ativar o ambiente virtual
python -m venv venv
.\venv\Scripts\activate      # Windows
source venv/bin/activate     # Linux/Mac

# Instalar dependências
pip install -r requirements.txt

# Aplicar as migrations
python manage.py migrate

# Rodar o servidor
python manage.py runserver
```

O back-end sobe em `http://127.0.0.1:8000`.

### Front-end (React)

Em um novo terminal:

```bash
cd frontend
npm install
npm run dev
```

O front-end sobe em `http://localhost:5173`.

> Os dois servidores (back-end e front-end) precisam estar rodando simultaneamente para o sistema funcionar.

## Autenticação

O sistema utiliza autenticação via **JWT**, com suporte adicional a login social (**Google** e **GitHub**) configurado no back-end. Para criar uma conta, utilize a tela de cadastro (`/cadastro`) ou o Django Admin.

## Licença

Projeto pessoal de portfólio — uso livre para fins de estudo e referência.
