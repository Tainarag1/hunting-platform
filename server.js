const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3200;

app.use(express.json());
app.use(express.static('public'));

// Carregar dados
const loadData = (file) => {
  const data = fs.readFileSync(path.join(__dirname, 'data', file), 'utf-8');
  return JSON.parse(data);
};

const saveData = (file, data) => {
  fs.writeFileSync(path.join(__dirname, 'data', file), JSON.stringify(data, null, 2));
};

// API: Listar vagas
app.get('/api/vagas', (req, res) => {
  const vagas = loadData('vagas.json');
  res.json(vagas);
});

// API: Obter vaga por ID
app.get('/api/vagas/:id', (req, res) => {
  const vagas = loadData('vagas.json');
  const vaga = vagas.find(v => v.id === req.params.id);
  if (!vaga) return res.status(404).json({ error: 'Vaga não encontrada' });
  res.json(vaga);
});

// API: Criar vaga
app.post('/api/vagas', (req, res) => {
  const vagas = loadData('vagas.json');
  const novaVaga = {
    id: `V${Date.now()}`,
    ...req.body,
    dataCriacao: req.body.dataInicio || new Date().toISOString().split('T')[0],
    candidatos: 0,
    etapaAtual: 'Triagem'
  };
  vagas.push(novaVaga);
  saveData('vagas.json', vagas);
  res.json(novaVaga);
});

// API: Atualizar vaga
app.put('/api/vagas/:id', (req, res) => {
  const vagas = loadData('vagas.json');
  const index = vagas.findIndex(v => v.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Vaga não encontrada' });
  vagas[index] = { ...vagas[index], ...req.body };
  saveData('vagas.json', vagas);
  res.json(vagas[index]);
});

// API: Listar candidatos de uma vaga
app.get('/api/vagas/:id/candidatos', (req, res) => {
  const candidatos = loadData('candidatos.json');
  const candidatosVaga = candidatos.filter(c => c.vagaId === req.params.id);
  res.json(candidatosVaga);
});

// API: Obter candidato específico
app.get('/api/candidatos/:id', (req, res) => {
  const candidatos = loadData('candidatos.json');
  const candidato = candidatos.find(c => c.id === req.params.id);
  if (!candidato) return res.status(404).json({ error: 'Candidato não encontrado' });
  res.json(candidato);
});

// API: Atualizar etapa do candidato
app.patch('/api/candidatos/:id', (req, res) => {
  const candidatos = loadData('candidatos.json');
  const index = candidatos.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Candidato não encontrado' });
  candidatos[index] = { ...candidatos[index], ...req.body };
  saveData('candidatos.json', candidatos);
  res.json(candidatos[index]);
});

// API: Listar todos os candidatos (para página de candidatos)
app.get('/api/candidatos-todos', (req, res) => {
  const candidatos = loadData('candidatos.json');
  
  // Calcular compatibilidade média para cada candidato
  const candidatosComMedia = candidatos.map(c => {
    const compatibilidades = [c.compatibilidade].filter(x => x !== undefined);
    return {
      ...c,
      compatibilidadeMedia: compatibilidades.length > 0 
        ? Math.round(compatibilidades.reduce((a, b) => a + b, 0) / compatibilidades.length)
        : null
    };
  });
  
  res.json(candidatosComMedia);
});

// API: Listar candidatos hunting (talentos passivos)
app.get('/api/candidatos-hunting', (req, res) => {
  const candidatos = loadData('candidatos-hunting.json');
  res.json(candidatos);
});

// API: Listar FAQ
app.get('/api/faq', (req, res) => {
  const faq = loadData('faq.json');
  res.json(faq);
});

// API: Cadastrar novo candidato
app.post('/api/candidatos', (req, res) => {
  const candidatos = loadData('candidatos.json');
  const { nome, foto, linkedin, github, portfolio } = req.body;

  // Verificar duplicidade por LinkedIn ou GitHub
  const duplicado = candidatos.find(c => 
    (linkedin && c.linkedin === linkedin) || 
    (github && c.github === github)
  );

  if (duplicado) {
    return res.status(400).json({ error: 'Candidato já cadastrado com este LinkedIn ou GitHub' });
  }

  const novoCandidato = {
    id: `C${Date.now()}`,
    nome,
    foto: foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=4f46e5&color=fff`,
    linkedin,
    github,
    portfolio,
    vagaId: null,
    compatibilidade: null,
    etapa: null,
    desclassificado: false,
    senioridade: null,
    formacao: null,
    hardSkills: [],
    softSkills: [],
    dataCadastro: new Date().toISOString().split('T')[0]
  };

  candidatos.push(novoCandidato);
  saveData('candidatos.json', candidatos);

  // Iniciar análise automática do candidato
  console.log(`[Análise] Iniciando análise do candidato ${nome}`);

  res.json(novoCandidato);
});

// API: Salvar observações do recrutador
app.post('/api/candidatos/:id/recrutador', (req, res) => {
  const { observacoes } = req.body;
  const candidatos = loadData('candidatos.json');
  const index = candidatos.findIndex(c => c.id === req.params.id);
  
  if (index === -1) return res.status(404).json({ error: 'Candidato não encontrado' });
  
  if (!candidatos[index].relatorioRecrutador) {
    candidatos[index].relatorioRecrutador = {};
  }
  
  candidatos[index].relatorioRecrutador.observacoes = observacoes;
  candidatos[index].relatorioRecrutador.dataAtualizacao = new Date().toISOString();
  
  saveData('candidatos.json', candidatos);
  res.json({ success: true });
});

// API: Obter observações do recrutador
app.get('/api/candidatos/:id/recrutador', (req, res) => {
  const candidatos = loadData('candidatos.json');
  const candidato = candidatos.find(c => c.id === req.params.id);
  
  if (!candidato) return res.status(404).json({ error: 'Candidato não encontrado' });
  
  res.json(candidato.relatorioRecrutador || { observacoes: '' });
});

// API: Listar todas as indicações (para recrutador)
app.get('/api/indicacoes', (req, res) => {
  const indicacoes = loadData('indicacoes.json');
  res.json(indicacoes);
});

// API: Listar indicações pendentes
app.get('/api/indicacoes/proxima', (req, res) => {
  const indicacoes = loadData('indicacoes.json');
  const proxima = indicacoes.find(i => i.status === 'pendente');
  
  if (!proxima) {
    return res.json({ vazia: true });
  }
  
  res.json(proxima);
});

// API: Aceitar indicação
app.post('/api/indicacoes/:id/aceitar', (req, res) => {
  const indicacoes = loadData('indicacoes.json');
  const candidatos = loadData('candidatos.json');
  const index = indicacoes.findIndex(i => i.id === req.params.id);
  
  if (index === -1) return res.status(404).json({ error: 'Indicação não encontrada' });
  
  const indicacao = indicacoes[index];
  
  // Criar candidato a partir da indicação
  const novoCandidato = {
    id: `C${Date.now()}`,
    nome: indicacao.nomeCandidato,
    foto: indicacao.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(indicacao.nomeCandidato)}&background=4f46e5&color=fff`,
    linkedin: indicacao.linkedin,
    github: indicacao.github,
    portfolio: indicacao.portfolio,
    vagaId: indicacao.vagaId,
    compatibilidade: null,
    etapa: 'Triagem',
    desclassificado: false,
    senioridade: null,
    formacao: null,
    hardSkills: [],
    softSkills: [],
    indicadoPor: indicacao.nomeIndicador,
    dataCadastro: new Date().toISOString().split('T')[0]
  };
  
  candidatos.push(novoCandidato);
  saveData('candidatos.json', candidatos);
  
  // Atualizar status da indicação
  indicacoes[index].status = 'aceita';
  indicacoes[index].dataDecisao = new Date().toISOString();
  saveData('indicacoes.json', indicacoes);
  
  console.log(`[Análise] Iniciando análise do candidato indicado: ${indicacao.nomeCandidato}`);
  
  res.json({ success: true, candidato: novoCandidato });
});

// API: Recusar indicação
app.post('/api/indicacoes/:id/recusar', (req, res) => {
  const indicacoes = loadData('indicacoes.json');
  const index = indicacoes.findIndex(i => i.id === req.params.id);
  
  if (index === -1) return res.status(404).json({ error: 'Indicação não encontrada' });
  
  indicacoes[index].status = 'recusada';
  indicacoes[index].dataDecisao = new Date().toISOString();
  saveData('indicacoes.json', indicacoes);
  
  res.json({ success: true });
});

// API: Sugerir melhorias para a vaga
app.post('/api/sugestoes-vaga', (req, res) => {
  const { nome, descricao, senioridade } = req.body;

  // Sugestões baseadas no nome da vaga
  const sugestoes = {
    hardSkills: [],
    softSkills: [],
    competencias: [],
    tecnologias: []
  };

  const nomeLower = (nome || '').toLowerCase();

  // Mapeamento básico de sugestões por tipo de vaga
  if (nomeLower.includes('full stack') || nomeLower.includes('fullstack')) {
    sugestoes.hardSkills = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'Git'];
    sugestoes.tecnologias = ['React ou Vue.js', 'Node.js ou Python', 'PostgreSQL ou MongoDB', 'Docker'];
    sugestoes.competencias = ['Desenvolvimento frontend e backend', 'APIs RESTful', 'Testes automatizados'];
  }

  if (nomeLower.includes('backend')) {
    sugestoes.hardSkills = ['Node.js', 'Python', 'Java', 'SQL', 'APIs REST', 'Docker'];
    sugestoes.tecnologias = ['Express ou FastAPI', 'PostgreSQL', 'Redis', 'AWS/GCP'];
    sugestoes.competencias = ['Arquitetura de microsserviços', 'Bancos de dados relacionais', 'Cache e filas'];
  }

  if (nomeLower.includes('frontend')) {
    sugestoes.hardSkills = ['JavaScript', 'TypeScript', 'React', 'CSS', 'HTML', 'Git'];
    sugestoes.tecnologias = ['React/Vue/Angular', 'Tailwind CSS', 'Jest', 'Webpack/Vite'];
    sugestoes.competencias = ['Componentização', 'Responsividade', 'Acessibilidade'];
  }

  if (nomeLower.includes('dados') || nomeLower.includes('data')) {
    sugestoes.hardSkills = ['Python', 'SQL', 'Pandas', 'Spark', 'Airflow', 'BigQuery'];
    sugestoes.tecnologias = ['Apache Spark', 'dbt', 'Snowflake/BigQuery', 'Airflow'];
    sugestoes.competencias = ['ETL/ELT', 'Modelagem de dados', 'Análise estatística'];
  }

  if (nomeLower.includes('lead') || nomeLower.includes('tech lead')) {
    sugestoes.softSkills = ['Liderança técnica', 'Mentoria', 'Comunicação', 'Visão estratégica'];
    sugestoes.competencias = ['Arquitetura de software', 'Code review', 'Tomada de decisão técnica'];
  }

  // Soft skills padrão
  if (sugestoes.softSkills.length === 0) {
    sugestoes.softSkills = ['Comunicação', 'Trabalho em equipe', 'Resolução de problemas', 'Proatividade'];
  }

  // Descrição melhorada
  let descricaoMelhorada = descricao || '';
  if (descricao && descricao.length < 100) {
    descricaoMelhorada = `## Sobre a vaga\n\n${descricao}\n\n## Responsabilidades\n\n- Desenvolver e manter soluções técnicas\n- Participar de code reviews\n- Colaborar com o time em decisões de arquitetura\n\n## O que esperamos\n\n- Proficiência nas tecnologias da vaga\n- Boa comunicação e trabalho em equipe\n- Vontade de aprender e compartilhar conhecimento`;
  }

  res.json({
    hardSkills: sugestoes.hardSkills,
    softSkills: sugestoes.softSkills,
    competencias: sugestoes.competencias,
    tecnologias: sugestoes.tecnologias,
    descricaoMelhorada
  });
});

// API: Autenticação - Login
app.post('/api/auth/login', (req, res) => {
  const { email, senha } = req.body;
  const usuarios = loadData('usuarios.json');

  const usuario = usuarios.find(u => u.email === email && u.senha === senha);

  if (!usuario) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos' });
  }

  // Não retornar a senha
  const { senha: _, ...usuarioSemSenha } = usuario;

  res.json({ success: true, usuario: usuarioSemSenha });
});

// API: Autenticação - Registro
app.post('/api/auth/register', (req, res) => {
  const { nome, email, senha, perfil } = req.body;
  const usuarios = loadData('usuarios.json');

  // Verificar se já existe
  const existe = usuarios.find(u => u.email === email);
  if (existe) {
    return res.status(400).json({ error: 'Este e-mail já está cadastrado' });
  }

  const novoUsuario = {
    id: `U${Date.now()}`,
    nome,
    email,
    senha,
    perfil,
    dataCadastro: new Date().toISOString().split('T')[0]
  };

  usuarios.push(novoUsuario);
  saveData('usuarios.json', usuarios);

  res.json({ success: true, message: 'Usuário cadastrado com sucesso' });
});

// API: Criar indicação (Funcionário)
app.post('/api/indicacoes', (req, res) => {
  const indicacoes = loadData('indicacoes.json');
  const candidatos = loadData('candidatos.json');
  const {
    vagaId,
    vagaNome,
    nomeIndicador,
    emailIndicador,
    nomeCandidato,
    linkedin,
    github,
    portfolio
  } = req.body;

  // Verificar duplicidade (mesmo LinkedIn ou GitHub para mesma vaga)
  const indicacaoDuplicada = indicacoes.find(i =>
    i.vagaId === vagaId &&
    i.status === 'pendente' &&
    (i.linkedin === linkedin || (github && i.github === github))
  );

  if (indicacaoDuplicada) {
    return res.status(400).json({ error: 'Já existe uma indicação pendente deste candidato para esta vaga' });
  }

  // Verificar se candidato já está no processo
  const candidatoNoProcesso = candidatos.find(c =>
    c.vagaId === vagaId &&
    (c.linkedin === linkedin || (github && c.github === github))
  );

  if (candidatoNoProcesso) {
    return res.status(400).json({ error: 'Este candidato já está neste processo seletivo' });
  }

  const novaIndicacao = {
    id: `IND${Date.now()}`,
    vagaId,
    vagaNome,
    nomeIndicador,
    emailIndicador,
    nomeCandidato,
    linkedin,
    github,
    portfolio,
    dataIndicacao: new Date().toISOString().split('T')[0],
    status: 'pendente'
  };

  indicacoes.push(novaIndicacao);
  saveData('indicacoes.json', indicacoes);

  console.log(`[INDICAÇÃO] Nova indicação recebida: ${nomeCandidato} para ${vagaNome}`);

  res.json({ success: true, indicacao: novaIndicacao });
});

// Middleware para tornar a landing page a página inicial
app.get('/', (req, res, next) => {
  // Se for acesso direto à raiz, serve a landing page
  if (req.path === '/' && req.accepts('html')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});
