let usuarioLogado = null;

// Verificar acesso ao carregar
document.addEventListener('DOMContentLoaded', () => {
  verificarAcesso();
});

// Verificar se é recrutador logado
function verificarAcesso() {
  const usuario = localStorage.getItem('usuarioLogado');
  
  if (!usuario) {
    alert('Você precisa estar logado como recrutador para acessar esta página');
    window.location.href = '/landing.html';
    return;
  }
  
  usuarioLogado = JSON.parse(usuario);
  
  if (usuarioLogado.perfil !== 'recrutador') {
    alert('Apenas recrutadores podem acessar esta página');
    window.location.href = '/landing.html';
    return;
  }
  
  // Atualizar nome no menu
  document.getElementById('userName').textContent = usuarioLogado.nome;
  document.getElementById('menuUser').style.display = 'block';
}

// Sair da conta
function sairDaConta() {
  localStorage.removeItem('usuarioLogado');
  window.location.href = '/landing.html';
}

// Armazenar tags
const tagsData = {
  compPrincipais: [],
  compDesejadas: [],
  tecnologias: [],
  softSkills: [],
  cursos: []
};

// Adicionar tag
function addTag(event, field) {
  if (event.key !== 'Enter') return;
  event.preventDefault();

  const input = document.getElementById(`${field}Input`);
  const value = input.value.trim();

  if (value && !tagsData[field].includes(value)) {
    tagsData[field].push(value);
    renderTags(field);
    input.value = '';
  }
}

// Remover tag
function removeTag(field, value) {
  tagsData[field] = tagsData[field].filter(t => t !== value);
  renderTags(field);
}

// Renderizar tags
function renderTags(field) {
  const container = document.getElementById(`${field}Tags`);
  container.innerHTML = tagsData[field].map(tag => `
    <span class="tag">
      ${tag}
      <button type="button" onclick="removeTag('${field}', '${tag}')">×</button>
    </span>
  `).join('');
}

// Adicionar row de skill
function addSkillRow() {
  const container = document.getElementById('hardSkillsContainer');
  const row = document.createElement('div');
  row.className = 'skill-row';
  row.innerHTML = `
    <input type="text" placeholder="Ex: React" class="skill-nome">
    <select class="skill-nivel">
      <option value="basico">Básico</option>
      <option value="intermediario" selected>Intermediário</option>
      <option value="avancado">Avançado</option>
    </select>
    <button type="button" class="btn-remove" onclick="removeSkillRow(this)">×</button>
  `;
  container.appendChild(row);
}

// Remover row de skill
function removeSkillRow(btn) {
  btn.parentElement.remove();
}

// Coletar hard skills do formulário
function collectHardSkills() {
  const rows = document.querySelectorAll('.skill-row');
  const skills = [];
  rows.forEach(row => {
    const nome = row.querySelector('.skill-nome').value.trim();
    const nivel = row.querySelector('.skill-nivel').value;
    if (nome) skills.push({ nome, nivel });
  });
  return skills;
}

// Preencher hard skills sugeridos
function fillHardSkills(skills) {
  const container = document.getElementById('hardSkillsContainer');
  container.innerHTML = '';

  skills.forEach(skill => {
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.innerHTML = `
      <input type="text" value="${skill}" class="skill-nome">
      <select class="skill-nivel">
        <option value="basico">Básico</option>
        <option value="intermediario" selected>Intermediário</option>
        <option value="avancado">Avançado</option>
      </select>
      <button type="button" class="btn-remove" onclick="removeSkillRow(this)">×</button>
    `;
    container.appendChild(row);
  });
}

// Sugestões automáticas
let sugestoesVaga = null;

async function buscarSugestoesVaga() {
  const nome = document.getElementById('nome').value;
  if (!nome) return;

  try {
    const response = await fetch('/api/sugestoes-vaga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, descricao: '', senioridade: '' })
    });
    sugestoesVaga = await response.json();
  } catch (error) {
    console.error('Erro ao buscar sugestões:', error);
  }
}

async function sugerirHardSkills() {
  await buscarSugestoesVaga();
  if (sugestoesVaga && sugestoesVaga.hardSkills.length > 0) {
    fillHardSkills(sugestoesVaga.hardSkills);
  }
}

async function sugerirSoftSkills() {
  await buscarSugestoesVaga();
  if (sugestoesVaga && sugestoesVaga.softSkills.length > 0) {
    sugestoesVaga.softSkills.forEach(skill => {
      if (!tagsData.softSkills.includes(skill)) {
        tagsData.softSkills.push(skill);
      }
    });
    renderTags('softSkills');
  }
}

async function melhorarDescricao() {
  const nome = document.getElementById('nome').value;
  const descricao = document.getElementById('descricaoPublica').value;

  try {
    const response = await fetch('/api/sugestoes-vaga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, descricao, senioridade: '' })
    });
    const data = await response.json();
    if (data.descricaoMelhorada) {
      document.getElementById('descricaoPublica').value = data.descricaoMelhorada;
    }
  } catch (error) {
    console.error('Erro ao melhorar descrição:', error);
  }
}

// Criar vaga
async function criarVaga(e) {
  e.preventDefault();

  const vaga = {
    nome: document.getElementById('nome').value,
    status: document.getElementById('status').value,
    responsavel: document.getElementById('responsavel').value,
    dataInicio: document.getElementById('dataInicio').value,
    dataTermino: document.getElementById('dataTermino').value,
    descricaoPublica: document.getElementById('descricaoPublica').value,
    descricaoInterna: document.getElementById('descricaoInterna').value,
    competenciasPrincipais: tagsData.compPrincipais,
    competenciasDesejadas: tagsData.compDesejadas,
    tecnologias: tagsData.tecnologias,
    contexto: document.getElementById('contexto').value,
    hardSkills: collectHardSkills(),
    softSkills: tagsData.softSkills,
    senioridade: document.getElementById('senioridade').value,
    formacao: document.getElementById('formacao').value,
    cursos: tagsData.cursos
  };

  try {
    const response = await fetch('/api/vagas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vaga)
    });

    if (response.ok) {
      window.location.href = '/';
    } else {
      alert('Erro ao criar vaga');
    }
  } catch (error) {
    console.error('Erro ao criar vaga:', error);
    alert('Erro ao criar vaga');
  }
}

// Definir data padrão como hoje
document.addEventListener('DOMContentLoaded', () => {
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('dataInicio').value = hoje;
});
