# Hunting Platform

[Português (Brasil)](README.pt-BR.md)

## Overview

Hunting Platform is a web application for managing recruitment and talent-hunting workflows. The project includes a Node.js/Express backend, static frontend pages served by the same server, and JSON files used for local data persistence.

The application covers job postings, candidate registration, candidate evaluation, referrals, recruiter notes, and suggestion endpoints for job creation.

## Features

- **Public landing page**: presents the platform, areas of activity, and open job listings.
- **Authentication**: basic registration and login endpoints for users with profile types (`funcionario`, `recrutador`, `candidato`).
- **Job management**: list, view, create, and update job postings.
- **Candidate management**: register candidates, list candidates, view candidate details, update candidate stage/status, and store recruiter observations.
- **Talent hunting**: list passive talent profiles from local data.
- **Referral workflow**: create referrals, list referrals, get next pending referral, accept or reject referrals.
- **Job creation assistance**: suggestion endpoint that returns hard skills, soft skills, competencies, technologies, and an improved description based on job information.
- **FAQ data**: endpoint for frequently asked questions.

## Technology Stack

### Runtime and dependencies

| Dependency | Version | Purpose |
|---|---:|---|
| Node.js | Compatible with Node 18+ (recommended) | JavaScript runtime |
| npm | Compatible with Node installation | Package manager |
| express | ^4.18.2 | HTTP server, routing, JSON body parsing, static file serving |

### Built-in Node.js modules used

- `fs`: read and write JSON data files.
- `path`: resolve file paths.

### Frontend

- Static HTML, CSS, and JavaScript files in `public/`.
- No frontend build step or bundler is required.

## Project Structure

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

## How the Application Works

### Backend (`server.js`)

The backend is implemented in [server.js](server.js) using Express.

- Starts an HTTP server on port `3200`.
- Parses JSON request bodies with `express.json()`.
- Serves static files from `public/`.
- Serves `public/index.html` for requests to `/`.
- Stores and reads data from JSON files in `data/` through helper functions:
  - `loadData(file)`: reads and parses a JSON file.
  - `saveData(file, data)`: writes JSON data with indentation.

### Frontend (`public/`)

The frontend is composed of static HTML pages with corresponding JavaScript files in `public/js/` and styles in `public/css/`.

| Page | Purpose |
|---|---|
| `index.html` / `landing.html` | Landing page, login/register modal, and public job listing. |
| `dashboard-candidato.html` | Candidate dashboard. |
| `vaga.html` | Job details and candidates associated with a job. |
| `candidato-detalhes.html` | Detailed candidate view and recruiter observations. |
| `candidatos.html` | Candidate listing and registration flow. |
| `candidatos-hunting.html` | Passive talent/hunting candidates view. |
| `criar-vaga.html` | Job creation form with suggestion support. |
| `indicacao.html` | Referral submission form. |
| `indicacoes-recrutador.html` | Recruiter view for managing referrals. |
| `minhas-indicacoes.html` | User view for submitted referrals. |

## Data Files

The application uses local JSON files in `data/` as its persistence layer.

| File | Purpose |
|---|---|
| `vagas.json` | Job postings. |
| `candidatos.json` | Candidates and related evaluation/profile data. |
| `candidatos-hunting.json` | Passive talent profiles used by the hunting view. |
| `candidatos-vagas.json` | Candidate-job mapping/compatibility data. |
| `indicacoes.json` | Referral records. |
| `usuarios.json` | User records for basic authentication. |
| `faq.json` | FAQ entries. |

Important notes:

- Some data files are listed in `.gitignore` because they may contain sensitive or local data.
- The project currently uses file-based persistence. It does not use an external database.
- JSON file writes are synchronous and do not include concurrency control.

## API Endpoints

### Jobs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/vagas` | List all jobs. |
| GET | `/api/vagas/:id` | Get a job by ID. |
| POST | `/api/vagas` | Create a new job. |
| PUT | `/api/vagas/:id` | Update a job. |
| GET | `/api/vagas/:id/candidatos` | List candidates associated with a job. |

### Candidates

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/candidatos-todos` | List all candidates, including calculated average compatibility when available. |
| GET | `/api/candidatos/:id` | Get a candidate by ID. |
| POST | `/api/candidatos` | Register a new candidate. |
| PATCH | `/api/candidatos/:id` | Update candidate fields, such as stage or status. |
| GET | `/api/candidatos-hunting` | List passive talent candidates. |
| GET | `/api/candidatos/:id/recrutador` | Get recruiter observations for a candidate. |
| POST | `/api/candidatos/:id/recrutador` | Save recruiter observations for a candidate. |

### Referrals

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/indicacoes` | List all referrals. |
| GET | `/api/indicacoes/proxima` | Get the next pending referral. |
| POST | `/api/indicacoes` | Create a referral. |
| POST | `/api/indicacoes/:id/aceitar` | Accept a referral and create a candidate record from it. |
| POST | `/api/indicacoes/:id/recusar` | Reject a referral. |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate a user with email and password. |
| POST | `/api/auth/register` | Register a new user. |

### Other

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/faq` | List FAQ entries. |
| POST | `/api/sugestoes-vaga` | Generate job suggestions based on provided job information. |

## Setup and Execution

### Prerequisites

- Node.js installed.
- npm installed.

### Install dependencies

```bash
npm install
```

### Run the application

```bash
npm start
```

The server starts at `http://localhost:3200`.

## Development Notes

- The project has no automated tests configured in `package.json`.
- The project has no lint or format scripts configured in `package.json`.
- Authentication is basic and file-based; it does not include password hashing, sessions, or token-based authorization.
- The suggestion endpoint uses rule-based logic in the backend.
- The application is suitable as a local prototype/demo. Additional work is needed for production use, such as secure authentication, database persistence, validation, logging, tests, and deployment configuration.

## Security and Data Handling

- Do not commit real personal data, credentials, or sensitive information.
- Review files in `data/` before pushing changes to a remote repository.
- `.gitignore` includes common local/environment entries and selected sensitive data files. Review it before adding new data files.
