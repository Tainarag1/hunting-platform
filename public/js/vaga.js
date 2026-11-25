let vagaId = null;
let candidatos = [];
let candidatoParaVoltar = null;
let usuarioLogado = null;

const etapas = ['Triagem', 'Entrevista', 'Teste Técnico', 'Finalistas'];

// Verificar acesso ao carregar
document.addEventListener('DOMContentLoaded', () => {
  verificarAcesso();
  loadVaga();
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

// Obter ID da vaga da URL
function getVagaId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Carregar dados da vaga
async function loadVaga() {
  vagaId = getVagaId();
  if (!vagaId) {
    window.location.href = '/';
    return;
  }

  try {
    // Carregar vaga
    const vagaResponse = await fetch(`/api/vagas/${vagaId}`);
    const vaga = await vagaResponse.json();

    document.getElementById('vagaNome').textContent = vaga.nome;
    document.getElementById('vagaData').textContent = formatDate(vaga.dataCriacao);
    document.getElementById('vagaStatus').textContent = vaga.status;
    document.getElementById('vagaStatus').className = `value status-badge ${getStatusClass(vaga.status)}`;
    document.getElementById('vagaCandidatos').textContent = vaga.candidatos;
    document.getElementById('vagaResponsavel').textContent = vaga.responsavel;

    // Carregar candidatos
    await loadCandidatos();
  } catch (error) {
    console.error('Erro ao carregar vaga:', error);
  }
}

// Carregar candidatos
async function loadCandidatos() {
  try {
    const response = await fetch(`/api/vagas/${vagaId}/candidatos`);
    candidatos = await response.json();
    renderCandidatos();
  } catch (error) {
    console.error('Erro ao carregar candidatos:', error);
  }
}

// Renderizar candidatos por etapa
function renderCandidatos() {
  const container = document.getElementById('candidatosContainer');
  const desclassificadosSection = document.getElementById('desclassificadosSection');
  const desclassificadosList = document.getElementById('desclassificadosList');

  // Agrupar por etapa (não desclassificados)
  const candidatosAtivos = candidatos.filter(c => !c.desclassificado);
  const candidatosDesclassificados = candidatos.filter(c => c.desclassificado);

  // Renderizar etapas
  container.innerHTML = etapas.map(etapa => {
    const candidatosEtapa = candidatosAtivos
      .filter(c => c.etapa === etapa)
      .sort((a, b) => b.compatibilidade - a.compatibilidade);

    if (candidatosEtapa.length === 0) return '';

    return `
      <div class="etapa-section">
        <h3 class="section-title">${etapa} (${candidatosEtapa.length})</h3>
        <div class="candidatos-list">
          ${candidatosEtapa.map(c => renderCandidatoCard(c, false)).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Renderizar desclassificados
  if (candidatosDesclassificados.length > 0) {
    desclassificadosSection.style.display = 'block';
    desclassificadosList.innerHTML = candidatosDesclassificados
      .sort((a, b) => b.compatibilidade - a.compatibilidade)
      .map(c => renderCandidatoCard(c, true))
      .join('');
  } else {
    desclassificadosSection.style.display = 'none';
  }
}

// Renderizar card de candidato
function renderCandidatoCard(candidato, isDesclassificado) {
  const scoreClass = candidato.compatibilidade >= 80 ? 'score-alto' :
                      candidato.compatibilidade >= 60 ? 'score-medio' : 'score-baixo';

  // Tornar o nome do candidato clicável
  const nomeCandidatoHTML = `<a href="/candidato-detalhes.html?candidatoId=${candidato.id}&vagaId=${vagaId}" class="candidato-nome-link">${candidato.nome}</a>`;

  if (isDesclassificado) {
    return `
      <div class="candidato-card candidato-desclassificado">
        <img src="${candidato.foto}" alt="${candidato.nome}" class="candidato-foto">
        <div class="candidato-info">
          ${nomeCandidatoHTML}
          <span class="candidato-score ${scoreClass}">${candidato.compatibilidade}%</span>
          <span style="color: #dc2626; font-size: 0.85rem;">Desclassificado</span>
        </div>
        <div class="candidato-acoes">
          <button class="btn-acao btn-voltar" onclick="abrirVoltarModal('${candidato.id}')">
            Voltar para o processo
          </button>
          <button class="btn-expandir" onclick="toggleDetalhes('${candidato.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="candidato-card">
      <img src="${candidato.foto}" alt="${candidato.nome}" class="candidato-foto">
      <div class="candidato-info">
        ${nomeCandidatoHTML}
        <span class="candidato-score ${scoreClass}">${candidato.compatibilidade}%</span>
      </div>
      <div class="candidato-acoes">
        <button class="btn-acao btn-classificar" onclick="classificarCandidato('${candidato.id}', '${candidato.etapa}')">
          Classificar para próxima etapa
        </button>
        <button class="btn-acao btn-desclassificar" onclick="desclassificarCandidato('${candidato.id}')">
          Desclassificar
        </button>
        <button class="btn-expandir" onclick="toggleDetalhes('${candidato.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    </div>
  `;
}

// Classificar candidato
async function classificarCandidato(id, etapaAtual) {
  const etapaIndex = etapas.indexOf(etapaAtual);
  if (etapaIndex === -1 || etapaIndex >= etapas.length - 1) {
    alert('Candidato já está na última etapa!');
    return;
  }

  const proximaEtapa = etapas[etapaIndex + 1];

  try {
    await fetch(`/api/candidatos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etapa: proximaEtapa })
    });
    await loadCandidatos();
  } catch (error) {
    console.error('Erro ao classificar candidato:', error);
  }
}

// Desclassificar candidato
async function desclassificarCandidato(id) {
  try {
    await fetch(`/api/candidatos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ desclassificado: true })
    });
    await loadCandidatos();
  } catch (error) {
    console.error('Erro ao desclassificar candidato:', error);
  }
}

// Toggle detalhes (abre modal)
function toggleDetalhes(id) {
  const candidato = candidatos.find(c => c.id === id);
  if (!candidato) return;

  document.getElementById('modalNome').textContent = candidato.nome;
  document.getElementById('modalSenioridade').textContent = candidato.senioridade;
  document.getElementById('modalFormacao').textContent = candidato.formacao;

  document.getElementById('modalHardSkills').innerHTML = candidato.hardSkills
    .map(s => `<span class="skill-tag">${s}</span>`).join('');

  document.getElementById('modalSoftSkills').innerHTML = candidato.softSkills
    .map(s => `<span class="skill-tag">${s}</span>`).join('');

  document.getElementById('candidatoModal').classList.add('active');
}

function closeModal() {
  document.getElementById('candidatoModal').classList.remove('active');
}

// Modal de voltar para o processo
function abrirVoltarModal(id) {
  candidatoParaVoltar = id;
  document.getElementById('voltarModal').classList.add('active');
}

function closeVoltarModal() {
  document.getElementById('voltarModal').classList.remove('active');
  candidatoParaVoltar = null;
}

async function confirmarVoltar() {
  if (!candidatoParaVoltar) return;

  const novaEtapa = document.getElementById('etapaSelect').value;

  try {
    await fetch(`/api/candidatos/${candidatoParaVoltar}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ desclassificado: false, etapa: novaEtapa })
    });
    closeVoltarModal();
    await loadCandidatos();
  } catch (error) {
    console.error('Erro ao voltar candidato:', error);
  }
}

// Helpers
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function getStatusClass(status) {
  const map = {
    'Aberta': 'status-aberta',
    'Em andamento': 'status-em-andamento',
    'Encerrada': 'status-encerrada',
    'Cancelada': 'status-cancelada'
  };
  return map[status] || 'status-aberta';
}

// Fechar modais ao clicar fora
document.getElementById('candidatoModal').addEventListener('click', (e) => {
  if (e.target.id === 'candidatoModal') closeModal();
});

document.getElementById('voltarModal').addEventListener('click', (e) => {
  if (e.target.id === 'voltarModal') closeVoltarModal();
});

// Inicializar
document.addEventListener('DOMContentLoaded', loadVaga);
