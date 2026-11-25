let candidatoId = null;
let vagaId = null;
let candidatoData = null;
let chart = null;
let usuarioLogado = null;

// Obter IDs da URL
function getIds() {
  const params = new URLSearchParams(window.location.search);
  candidatoId = params.get('candidatoId');
  vagaId = params.get('vagaId');
}

// Verificar acesso ao carregar
document.addEventListener('DOMContentLoaded', () => {
  verificarAcesso();
  loadCandidato();
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

// Carregar dados do candidato
async function loadCandidato() {
  getIds();
  
  if (!candidatoId) {
    alert('Candidato não encontrado');
    window.location.href = '/';
    return;
  }

  try {
    // Carregar dados da vaga se disponível
    if (vagaId) {
      const vagaResponse = await fetch(`/api/vagas/${vagaId}`);
      const vaga = await vagaResponse.json();
      document.getElementById('vagaNome').textContent = vaga.nome;
    } else {
      document.getElementById('vagaNome').textContent = 'Perfil do Candidato';
    }

    // Carregar dados do candidato
    const candidatoResponse = await fetch(`/api/candidatos/${candidatoId}`);
    candidatoData = await candidatoResponse.json();

    renderCandidatoCard();
    renderRelatorioIA();
    loadRelatorioRecrutador();
    renderGraficoCompatibilidade();
  } catch (error) {
    console.error('Erro ao carregar candidato:', error);
    alert('Erro ao carregar dados do candidato');
  }
}

// Renderizar card principal
function renderCandidatoCard() {
  document.getElementById('candidatoFoto').src = candidatoData.foto;
  document.getElementById('candidatoFoto').alt = candidatoData.nome;
  document.getElementById('candidatoNome').textContent = candidatoData.nome;

  const compatibilidade = candidatoData.compatibilidade || 0;
  document.querySelector('.compatibilidade-valor').textContent = `${compatibilidade}%`;

  // Status
  const statusEl = document.getElementById('statusCandidato');
  if (candidatoData.desclassificado) {
    statusEl.textContent = 'Desclassificado';
    statusEl.className = 'status-candidato status-desclassificado';
  } else {
    statusEl.textContent = 'Classificado';
    statusEl.className = 'status-candidato status-classificado';
  }

  // Cor do badge de compatibilidade
  const badgeClass = compatibilidade >= 80 ? 'compatibilidade-alta' :
                     compatibilidade >= 60 ? 'compatibilidade-media' : 'compatibilidade-baixa';
  document.getElementById('compatibilidadeBadge').className = `compatibilidade-badge ${badgeClass}`;
}

// Renderizar relatório de análise
function renderRelatorioIA() {
  // Informações básicas
  document.getElementById('iaNome').textContent = candidatoData.nome;
  document.getElementById('iaSenioridade').textContent = candidatoData.senioridade || 'Não informado';
  document.getElementById('iaEscolaridade').textContent = candidatoData.formacao || 'Não informado';
  document.getElementById('iaExperiencia').textContent = candidatoData.experiencia || 'Não informado';
  document.getElementById('iaCursos').textContent = candidatoData.cursos || 'Não informado';

  // Soft Skills
  const softSkillsContainer = document.getElementById('iaSoftSkills');
  if (candidatoData.softSkills && candidatoData.softSkills.length > 0) {
    softSkillsContainer.innerHTML = candidatoData.softSkills
      .map(skill => `<span class="skill-tag skill-soft">${skill}</span>`)
      .join('');
  } else {
    softSkillsContainer.innerHTML = '<p class="info-vazia">Não identificado</p>';
  }

  // Hard Skills
  const hardSkillsContainer = document.getElementById('iaHardSkills');
  if (candidatoData.hardSkills && candidatoData.hardSkills.length > 0) {
    hardSkillsContainer.innerHTML = candidatoData.hardSkills
      .map(skill => {
        const nivel = candidatoData.hardSkillsNiveis?.[skill] || '';
        return `<span class="skill-tag skill-hard">${skill}${nivel ? ` <small>(${nivel})</small>` : ''}</span>`;
      })
      .join('');
  } else {
    hardSkillsContainer.innerHTML = '<p class="info-vazia">Não identificado</p>';
  }

  // Linguagens GitHub
  const linguagensSection = document.getElementById('linguagensSection');
  const linguagensContainer = document.getElementById('iaLinguagens');
  if (candidatoData.linguagensGitHub && candidatoData.linguagensGitHub.length > 0) {
    linguagensSection.style.display = 'block';
    linguagensContainer.innerHTML = candidatoData.linguagensGitHub
      .map(lang => `
        <div class="linguagem-item">
          <div class="linguagem-cor" style="background: ${lang.cor || '#ccc'}"></div>
          <span class="linguagem-nome">${lang.nome}</span>
          <span class="linguagem-porcentagem">${lang.porcentagem}%</span>
        </div>
      `)
      .join('');
  } else {
    linguagensSection.style.display = 'none';
  }

  // Repositórios
  const repositoriosSection = document.getElementById('repositoriosSection');
  const repositoriosContainer = document.getElementById('iaRepositorios');
  if (candidatoData.repositorios && candidatoData.repositorios.length > 0) {
    repositoriosSection.style.display = 'block';
    repositoriosContainer.innerHTML = candidatoData.repositorios.slice(0, 5)
      .map(repo => `
        <a href="${repo.url}" target="_blank" class="repositorio-item">
          <div class="repo-header">
            <span class="repo-nome">${repo.nome}</span>
            ${repo.estrelas ? `<span class="repo-estrelas">⭐ ${repo.estrelas}</span>` : ''}
          </div>
          <p class="repo-descricao">${repo.descricao || 'Sem descrição'}</p>
          <div class="repo-footer">
            <span class="repo-linguagem">${repo.linguagem || 'Várias'}</span>
            <span class="repo-relevancia">Relevância: ${repo.relevancia || 'Alta'}</span>
          </div>
        </a>
      `)
      .join('');
  } else {
    repositoriosSection.style.display = 'none';
  }
}

// Carregar relatório do recrutador
async function loadRelatorioRecrutador() {
  try {
    const response = await fetch(`/api/candidatos/${candidatoId}/recrutador`);
    const data = await response.json();
    document.getElementById('observacoesRecrutador').value = data.observacoes || '';
  } catch (error) {
    console.error('Erro ao carregar relatório do recrutador:', error);
  }
}

// Salvar observações
async function salvarObservacoes() {
  const observacoes = document.getElementById('observacoesRecrutador').value;

  try {
    await fetch(`/api/candidatos/${candidatoId}/recrutador`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observacoes })
    });
    
    alert('Observações salvas com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar observações:', error);
    alert('Erro ao salvar observações');
  }
}

// Renderizar gráfico de compatibilidade
function renderGraficoCompatibilidade() {
  const compatibilidade = candidatoData.compatibilidade || 0;
  
  document.getElementById('graficoCompatibilidade').textContent = `${compatibilidade}%`;

  // Gráfico de rosca
  const ctx = document.getElementById('compatibilidadeChart').getContext('2d');
  
  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [compatibilidade, 100 - compatibilidade],
        backgroundColor: [
          compatibilidade >= 80 ? '#10b981' : compatibilidade >= 60 ? '#f59e0b' : '#ef4444',
          '#f3f4f6'
        ],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '70%',
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });

  // Breakdown detalhado
  const breakdown = candidatoData.compatibilidadeBreakdown || {
    hardSkills: Math.round(compatibilidade * 0.4),
    softSkills: Math.round(compatibilidade * 0.3),
    experiencia: Math.round(compatibilidade * 0.2),
    senioridade: Math.round(compatibilidade * 0.1)
  };

  document.getElementById('compatibilidadeBreakdown').innerHTML = `
    <div class="breakdown-item">
      <span class="breakdown-label">Hard Skills</span>
      <div class="breakdown-bar">
        <div class="breakdown-fill" style="width: ${breakdown.hardSkills}%"></div>
      </div>
      <span class="breakdown-valor">${breakdown.hardSkills}%</span>
    </div>
    <div class="breakdown-item">
      <span class="breakdown-label">Soft Skills</span>
      <div class="breakdown-bar">
        <div class="breakdown-fill" style="width: ${breakdown.softSkills}%"></div>
      </div>
      <span class="breakdown-valor">${breakdown.softSkills}%</span>
    </div>
    <div class="breakdown-item">
      <span class="breakdown-label">Experiência</span>
      <div class="breakdown-bar">
        <div class="breakdown-fill" style="width: ${breakdown.experiencia}%"></div>
      </div>
      <span class="breakdown-valor">${breakdown.experiencia}%</span>
    </div>
    <div class="breakdown-item">
      <span class="breakdown-label">Senioridade</span>
      <div class="breakdown-bar">
        <div class="breakdown-fill" style="width: ${breakdown.senioridade}%"></div>
      </div>
      <span class="breakdown-valor">${breakdown.senioridade}%</span>
    </div>
  `;
}

// Voltar para vaga
function voltarParaVaga() {
  window.location.href = `/vaga.html?id=${vagaId}`;
}

// Inicializar
document.addEventListener('DOMContentLoaded', loadCandidato);
