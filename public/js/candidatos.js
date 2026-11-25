let todosCandidatos = [];
let candidatosFiltrados = [];
let paginaAtual = 1;
const itensPorPagina = 12;
let indicacaoAtual = null;
let usuarioLogado = null;

// Verificar login ao carregar
document.addEventListener('DOMContentLoaded', () => {
  verificarAcesso();
  loadCandidatos();
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
  
  // Atualizar nome no sidebar
  document.getElementById('sidebarUserName').textContent = usuarioLogado.nome;
}

// Toggle sidebar
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
}

// Sair da conta
function sairDaConta() {
  localStorage.removeItem('usuarioLogado');
  window.location.href = '/landing.html';
}

// Ir para dashboard
function irParaDashboard() {
  if (usuarioLogado && usuarioLogado.perfil === 'recrutador') {
    window.location.href = '/';
  } else if (usuarioLogado && usuarioLogado.perfil === 'funcionario') {
    window.location.href = '/indicacao.html';
  } else {
    window.location.href = '/landing.html';
  }
}

// Carregar candidatos
async function loadCandidatos() {
  try {
    const response = await fetch('/api/candidatos-todos');
    todosCandidatos = await response.json();
    candidatosFiltrados = [...todosCandidatos];
    renderCandidatos();
  } catch (error) {
    console.error('Erro ao carregar candidatos:', error);
  }
}

// Buscar candidatos
function buscarCandidatos() {
  const termo = document.getElementById('searchInput').value.toLowerCase();
  
  if (termo === '') {
    candidatosFiltrados = [...todosCandidatos];
  } else {
    candidatosFiltrados = todosCandidatos.filter(c => 
      c.nome.toLowerCase().includes(termo)
    );
  }
  
  paginaAtual = 1;
  renderCandidatos();
}

function renderCandidatos() {
  const grid = document.getElementById('candidatosGrid');
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const candidatosPagina = candidatosFiltrados.slice(inicio, fim);

  if (candidatosPagina.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>Nenhum candidato encontrado</p>
      </div>
    `;
    document.getElementById('pagination').style.display = 'none';
    return;
  }

  grid.innerHTML = candidatosPagina.map(candidato => {
    const compatibilidadeMedia = candidato.compatibilidadeMedia || null;
    const scoreClass = compatibilidadeMedia >= 80 ? 'score-alto' :
                       compatibilidadeMedia >= 60 ? 'score-medio' : 
                       compatibilidadeMedia ? 'score-baixo' : '';

    return `
      <div class="candidato-grid-card" onclick="abrirDetalhes('${candidato.id}')">
        <div class="card-foto-container">
          <img src="${candidato.foto || 'https://via.placeholder.com/100'}" alt="${candidato.nome}" class="card-foto">
        </div>
        <div class="card-info">
          <h3 class="card-nome">${candidato.nome}</h3>
          <div class="card-skills">
            ${(candidato.hardSkills || []).slice(0, 3).map(skill => 
              `<span class="skill-mini">${skill}</span>`
            ).join('')}
          </div>
          ${compatibilidadeMedia !== null ? `
            <div class="card-compatibilidade">
              <span class="compat-label">Compatibilidade média</span>
              <span class="compat-valor ${scoreClass}">${compatibilidadeMedia}%</span>
            </div>
          ` : ''}
        </div>
        <button class="btn-ver-detalhes">Ver detalhes →</button>
      </div>
    `;
  }).join('');

  // Atualizar paginação
  const totalPaginas = Math.ceil(candidatosFiltrados.length / itensPorPagina);
  document.getElementById('pageInfo').textContent = `Página ${paginaAtual} de ${totalPaginas}`;
  document.getElementById('prevBtn').disabled = paginaAtual === 1;
  document.getElementById('nextBtn').disabled = paginaAtual >= totalPaginas;
  document.getElementById('pagination').style.display = totalPaginas > 1 ? 'flex' : 'none';
}

// Abrir detalhes do candidato
function abrirDetalhes(candidatoId) {
  // Buscar vaga associada ao candidato (se houver)
  const candidato = todosCandidatos.find(c => c.id === candidatoId);
  
  if (candidato && candidato.vagaId) {
    // Redireciona para a tela de detalhes com a vaga associada
    window.location.href = `/candidato-detalhes.html?candidatoId=${candidatoId}&vagaId=${candidato.vagaId}`;
  } else {
    // Se não tem vaga associada, mostra as informações gerais
    // Por enquanto, abre sem vaga
    window.location.href = `/candidato-detalhes.html?candidatoId=${candidatoId}&vagaId=`;
  }
}

// Paginação
function prevPage() {
  if (paginaAtual > 1) {
    paginaAtual--;
    renderCandidatos();
  }
}

function nextPage() {
  const totalPaginas = Math.ceil(candidatosFiltrados.length / itensPorPagina);
  if (paginaAtual < totalPaginas) {
    paginaAtual++;
    renderCandidatos();
  }
}

// Modal Cadastrar
function abrirModalCadastrar() {
  document.getElementById('modalCadastrar').classList.add('active');
}

function fecharModalCadastrar() {
  document.getElementById('modalCadastrar').classList.remove('active');
  document.getElementById('formCadastrar').reset();
}

// Cadastrar candidato
async function cadastrarCandidato(event) {
  event.preventDefault();

  const dados = {
    nome: document.getElementById('cadastrarNome').value,
    foto: document.getElementById('cadastrarFoto').value || null,
    linkedin: document.getElementById('cadastrarLinkedIn').value,
    github: document.getElementById('cadastrarGitHub').value || null,
    portfolio: document.getElementById('cadastrarPortfolio').value || null
  };

  try {
    const response = await fetch('/api/candidatos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    if (response.ok) {
      alert('Candidato cadastrado com sucesso! A análise será iniciada.');
      fecharModalCadastrar();
      await loadCandidatos();
    } else {
      const error = await response.json();
      alert(error.error || 'Erro ao cadastrar candidato');
    }
  } catch (error) {
    console.error('Erro ao cadastrar:', error);
    alert('Erro ao cadastrar candidato');
  }
}

// Modal Indicação
function abrirModalIndicacao() {
  carregarProximaIndicacao();
  document.getElementById('modalIndicacao').classList.add('active');
}

function fecharModalIndicacao() {
  document.getElementById('modalIndicacao').classList.remove('active');
  indicacaoAtual = null;
}

// Carregar próxima indicação
async function carregarProximaIndicacao() {
  try {
    const response = await fetch('/api/indicacoes/proxima');
    const indicacao = await response.json();

    if (!indicacao || indicacao.vazia) {
      document.getElementById('indicacaoConteudo').innerHTML = `
        <div class="empty-indicacao">
          <p>Não há indicações pendentes no momento.</p>
        </div>
      `;
      document.querySelector('.modal-acoes').style.display = 'none';
      return;
    }

    indicacaoAtual = indicacao;
    document.querySelector('.modal-acoes').style.display = 'flex';

    document.getElementById('indicacaoConteudo').innerHTML = `
      <div class="indicacao-dados">
        <div class="indicacao-header">
          <h4>${indicacao.nomeCandidato}</h4>
          <span class="indicacao-data">Indicado em ${formatDate(indicacao.dataIndicacao)}</span>
        </div>

        <div class="indicacao-links">
          ${indicacao.linkedin ? `
            <a href="${indicacao.linkedin}" target="_blank" class="link-item">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
          ` : ''}
          ${indicacao.github ? `
            <a href="${indicacao.github}" target="_blank" class="link-item">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          ` : ''}
          ${indicacao.portfolio ? `
            <a href="${indicacao.portfolio}" target="_blank" class="link-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              Portfólio
            </a>
          ` : ''}
        </div>

        <div class="indicacao-info">
          <div class="info-row">
            <span class="info-label">Indicador:</span>
            <span class="info-value">${indicacao.nomeIndicador}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Vaga desejada:</span>
            <span class="info-value">${indicacao.vagaNome}</span>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Erro ao carregar indicação:', error);
    document.getElementById('indicacaoConteudo').innerHTML = `
      <div class="empty-indicacao">
        <p>Erro ao carregar indicações</p>
      </div>
    `;
    document.querySelector('.modal-acoes').style.display = 'none';
  }
}

// Aceitar indicação
async function aceitarIndicacao() {
  if (!indicacaoAtual) return;

  try {
    const response = await fetch(`/api/indicacoes/${indicacaoAtual.id}/aceitar`, {
      method: 'POST'
    });

    if (response.ok) {
      alert('Indicação aceita! O candidato foi vinculado à vaga.');
      await carregarProximaIndicacao();
      await loadCandidatos();
    } else {
      const error = await response.json();
      alert(error.error || 'Erro ao aceitar indicação');
    }
  } catch (error) {
    console.error('Erro ao aceitar indicação:', error);
    alert('Erro ao aceitar indicação');
  }
}

// Recusar indicação
async function recusarIndicacao() {
  if (!indicacaoAtual) return;

  if (!confirm('Tem certeza que deseja recusar esta indicação?')) return;

  try {
    const response = await fetch(`/api/indicacoes/${indicacaoAtual.id}/recusar`, {
      method: 'POST'
    });

    if (response.ok) {
      alert('Indicação recusada.');
      await carregarProximaIndicacao();
    } else {
      const error = await response.json();
      alert(error.error || 'Erro ao recusar indicação');
    }
  } catch (error) {
    console.error('Erro ao recusar indicação:', error);
    alert('Erro ao recusar indicação');
  }
}

// Helper
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Fechar modais ao clicar fora
document.getElementById('modalCadastrar').addEventListener('click', (e) => {
  if (e.target.id === 'modalCadastrar') fecharModalCadastrar();
});

document.getElementById('modalIndicacao').addEventListener('click', (e) => {
  if (e.target.id === 'modalIndicacao') fecharModalIndicacao();
});

// Inicializar
document.addEventListener('DOMContentLoaded', loadCandidatos);
