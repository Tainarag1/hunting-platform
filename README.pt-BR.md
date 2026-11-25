# Hunting Platform

[English](README.md)

## Visão geral

Hunting Platform é uma aplicação web para gerenciamento de processos de recrutamento e hunting de talentos. O projeto inclui um backend Node.js/Express, páginas frontend estáticas servidas pelo mesmo servidor e arquivos JSON usados para persistência local de dados.

A aplicação cobre cadastro de vagas, cadastro de candidatos, avaliação de candidatos, indicações, observações do recrutador e endpoints de sugestão para criação de vagas.

## Funcionalidades

- **Página inicial pública**: apresenta a plataforma, áreas de atuação e vagas abertas.
- **Autenticação**: endpoints básicos de cadastro e login para usuários com perfis (`funcionario`, `recrutador`, `candidato`).
- **Gestão de vagas**: listar, visualizar, criar e atualizar vagas.
- **Gestão de candidatos**: cadastrar candidatos, listar candidatos, visualizar detalhes, atualizar etapa/status e salvar observações do recrutador.
- **Hunting de talentos**: listar perfis de talentos passivos a partir de dados locais.
- **Fluxo de indicações**: criar indicações, listar indicações, obter próxima indicação pendente, aceitar ou recusar indicações.
- **Auxílio na criação de vagas**: endpoint de sugestões que retorna hard skills, soft skills, competências, tecnologias e uma descrição melhorada com base nas informações da vaga.
- **Dados de FAQ**: endpoint para perguntas frequentes.

## Stack tecnológica

### Runtime e dependências

| Dependência | Versão | Finalidade |
|---|---:|---|
| Node.js | Compatível com Node 18+ (recomendado) | Runtime JavaScript |
| npm | Compatível com a instalação do Node | Gerenciador de pacotes |
| express | ^4.18.2 | Servidor HTTP, rotas, parsing de JSON, serviço de arquivos estáticos |

### Módulos nativos do Node.js utilizados

- `fs`: leitura e escrita de arquivos JSON de dados.
- `path`: resolução de caminhos de arquivos.

### Frontend

- Arquivos estáticos HTML, CSS e JavaScript em `public/`.
- Não é necessário etapa de build ou bundler no frontend.

## Estrutura do projeto

```text
.
|-- .gitignore
|-- package.json
|-- package-lock.json
|-- server.js
|-- data/
|   |-- candidatos-hunting.json
|   |-- candidatos-vagas.json
|   |-- candidatos.json
|   |-- faq.json
|   |-- indicacoes.json
|   |-- usuarios.json
|   `-- vagas.json
`-- public/
    |-- candidato-detalhes.html
    |-- candidatos-hunting.html
    |-- candidatos.html
    |-- criar-vaga.html
    |-- dashboard-candidato.html
    |-- index.html
    |-- indicacao.html
    |-- indicacoes-recrutador.html
    |-- landing.html
    |-- minhas-indicacoes.html
    |-- vaga.html
    |-- css/
    |   |-- landing.css
    |   `-- styles.css
    `-- js/
        |-- app.js
        |-- candidato-detalhes.js
        |-- candidatos.js
        |-- criar-vaga.js
        |-- dashboard-candidato.js
        |-- indicacao.js
        |-- indicacoes-recrutador.js
        |-- landing.js
        |-- minhas-indicacoes.js
        `-- vaga.js
```

## Como a aplicação funciona

### Backend (`server.js`)

O backend é implementado em [server.js](server.js) com Express.

- Inicia um servidor HTTP na porta `3200`.
- Faz parsing de corpos JSON com `express.json()`.
- Serve arquivos estáticos de `public/`.
- Serve `public/index.html` para requisições em `/`.
- Armazena e lê dados de arquivos JSON em `data/` por meio de funções auxiliares:
  - `loadData(file)`: lê e faz parse de um arquivo JSON.
  - `saveData(file, data)`: grava dados JSON com indentação.

### Frontend (`public/`)

O frontend é composto por páginas HTML estáticas, com arquivos JavaScript correspondentes em `public/js/` e estilos em `public/css/`.

| Página | Finalidade |
|---|---|
| `index.html` / `landing.html` | Página inicial, modal de login/cadastro e listagem pública de vagas. |
| `dashboard-candidato.html` | Painel do candidato. |
| `vaga.html` | Detalhes da vaga e candidatos associados à vaga. |
| `candidato-detalhes.html` | Visualização detalhada do candidato e observações do recrutador. |
| `candidatos.html` | Listagem e fluxo de cadastro de candidatos. |
| `candidatos-hunting.html` | Visualização de talentos passivos/hunting. |
| `criar-vaga.html` | Formulário de criação de vaga com suporte a sugestões. |
| `indicacao.html` | Formulário de envio de indicação. |
| `indicacoes-recrutador.html` | Visão do recrutador para gerenciar indicações. |
| `minhas-indicacoes.html` | Visão do usuário para indicações enviadas. |

## Arquivos de dados

A aplicação usa arquivos JSON locais em `data/` como camada de persistência.

| Arquivo | Finalidade |
|---|---|
| `vagas.json` | Vagas cadastradas. |
| `candidatos.json` | Candidatos e dados relacionados a avaliação/perfil. |
| `candidatos-hunting.json` | Perfis de talentos passivos usados na visão de hunting. |
| `candidatos-vagas.json` | Dados de mapeamento/compatibilidade entre candidato e vaga. |
| `indicacoes.json` | Registros de indicações. |
| `usuarios.json` | Registros de usuários para autenticação básica. |
| `faq.json` | Entradas de FAQ. |

Observações importantes:

- Alguns arquivos de dados estão listados no `.gitignore` porque podem conter dados sensíveis ou locais.
- O projeto atualmente usa persistência baseada em arquivos. Não utiliza banco de dados externo.
- As gravações em JSON são síncronas e não possuem controle de concorrência.

## Endpoints da API

### Vagas

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/vagas` | Lista todas as vagas. |
| GET | `/api/vagas/:id` | Obtém uma vaga por ID. |
| POST | `/api/vagas` | Cria uma nova vaga. |
| PUT | `/api/vagas/:id` | Atualiza uma vaga. |
| GET | `/api/vagas/:id/candidatos` | Lista candidatos associados a uma vaga. |

### Candidatos

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/candidatos-todos` | Lista todos os candidatos, incluindo média de compatibilidade quando disponível. |
| GET | `/api/candidatos/:id` | Obtém um candidato por ID. |
| POST | `/api/candidatos` | Cadastra um novo candidato. |
| PATCH | `/api/candidatos/:id` | Atualiza campos do candidato, como etapa ou status. |
| GET | `/api/candidatos-hunting` | Lista candidatos de hunting/talentos passivos. |
| GET | `/api/candidatos/:id/recrutador` | Obtém observações do recrutador para um candidato. |
| POST | `/api/candidatos/:id/recrutador` | Salva observações do recrutador para um candidato. |

### Indicações

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/indicacoes` | Lista todas as indicações. |
| GET | `/api/indicacoes/proxima` | Obtém a próxima indicação pendente. |
| POST | `/api/indicacoes` | Cria uma indicação. |
| POST | `/api/indicacoes/:id/aceitar` | Aceita uma indicação e cria um registro de candidato a partir dela. |
| POST | `/api/indicacoes/:id/recusar` | Recusa uma indicação. |

### Autenticação

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Autentica um usuário com e-mail e senha. |
| POST | `/api/auth/register` | Cadastra um novo usuário. |

### Outros

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/faq` | Lista entradas de FAQ. |
| POST | `/api/sugestoes-vaga` | Gera sugestões de vaga com base nas informações fornecidas. |

## Configuração e execução

### Pré-requisitos

- Node.js instalado.
- npm instalado.

### Instalar dependências

```bash
npm install
```

### Executar a aplicação

```bash
npm start
```

O servidor inicia em `http://localhost:3200`.

## Observações de desenvolvimento

- O projeto não possui testes automatizados configurados no `package.json`.
- O projeto não possui scripts de lint ou formatação configurados no `package.json`.
- A autenticação é básica e baseada em arquivo; não inclui hash de senha, sessões ou autorização por token.
- O endpoint de sugestões usa lógica baseada em regras no backend.
- A aplicação é adequada como protótipo/demo local. Para uso em produção, são necessários trabalhos adicionais, como autenticação segura, persistência em banco de dados, validação, logging, testes e configuração de deploy.

## Segurança e tratamento de dados

- Não versione dados pessoais reais, credenciais ou informações sensíveis.
- Revise os arquivos em `data/` antes de enviar alterações para um repositório remoto.
- O `.gitignore` inclui entradas comuns de ambiente/local e arquivos de dados sensíveis selecionados. Revise-o antes de adicionar novos arquivos de dados.