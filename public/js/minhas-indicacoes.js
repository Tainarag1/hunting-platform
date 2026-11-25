let usuarioLogado = null;
let minhasIndicacoes = [];

// Verificar acesso ao carregar
document.addEventListener('DOMContentLoaded', () => {
  verificarAcesso();
  carregarMinhasIndicacoes();
});

// Verificar se é funcionário logado
function verificarAcesso() {
  const usuario = localStorage.getItem('usuarioLogado');

  if (!usuario) {
    alert('Você precisa estar logado como funcionário para acessar esta página');
    window.location.href = '/landing.html';
    return;
  }

  usuarioLogado = JSON.parse(usuario);

  if (usuarioLogado.perfil !== 'funcionario') {
    alert('Apenas funcionários podem acessar esta página');
    window.location.href = '/landing.html';
    return;
  }

  // Atualizar nome no menu
  document.getElementById('userName').textContent = usuarioLogado.nome;
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
  } else if (usuarioLogado && usuarioLogado.perfil === 'candidato') {
    window.location.href = '/dashboard-candidato.html';
  } else {
    window.location.href = '/landing.html';
  }
}

// Carregar minhas indicações
async function carregarMinhasIndicacoes() {
  try {
    // Buscar todas as indicações e filtrar pelo email do usuário logado
    const response = await fetch('/api/indicacoes');
    const todasIndicacoes = await response.json();

    minhasIndicacoes = todasIndicacoes.filter(i => i.emailIndicador === usuarioLogado.email);

    renderStats();
    renderIndicacoes();
  } catch (error) {
    console.error('Erro ao carregar indicações:', error);
    alert('Erro ao carregar suas indicações');
  }
}

// Renderizar estatísticas
function renderStats() {
  const total = minhasIndicacoes.length;
  const pendentes = minhasIndicacoes.filter(i => i.status === 'pendente').length;
  const aceitas = minhasIndicacoes.filter(i => i.status === 'aceita').length;
  const recusadas = minhasIndicacoes.filter(i => i.status === 'recusada').length;

  const statsGrid = document.getElementById('statsGrid');

  if (total === 0) {
    statsGrid.style.display = 'none';
    return;
  }

  statsGrid.style.display = 'grid';
  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${total}</div>
      <div class="stat-label">Total de Indicações</div>
    </div>
    <div class="stat-card stat-pendente">
      <div class="stat-number">${pendentes}</div>
      <div class="stat-label">Pendentes</div>
    </div>
    <div class="stat-card stat-aceita">
      <div class="stat-number">${aceitas}</div>
      <div class="stat-label">Aceitas</div>
    </div>
    <div class="stat-card stat-recusada">
      <div class="stat-number">${recusadas}</div>
      <div class="stat-label">Recusadas</div>
    </div>
  `;
}

// Renderizar indicações
function renderIndicacoes() {
  const container = document.getElementById('indicacoesList');

  if (minhasIndicacoes.length === 0) {
    container.innerHTML = `
      <div class="empty-state-large">
        <div class="empty-icon">📋</div>
        <h2>Nenhuma indicação realizada</h2>
        <p>Você ainda não fez nenhuma indicação. Que tal indicar um colega para uma vaga?</p>
        <button class="btn-primary btn-large" onclick="window.location.href='/indicacao.html'">
          Fazer minha primeira indicação
        </button>
      </div>
    `;
    return;
  }

  // Ordenar por data (mais recentes primeiro)
  const ordenadas = [...minhasIndicacoes].sort((a, b) =>
    new Date(b.dataIndicacao) - new Date(a.dataIndicacao)
  );

  container.innerHTML = ordenadas.map(indicacao => {
    const statusClass = indicacao.status === 'pendente' ? 'status-pendente' :
                        indicacao.status === 'aceita' ? 'status-aceita' : 'status-recusada';

    const statusText = indicacao.status === 'pendente' ? '⏳ Aguardando avaliação' :
                       indicacao.status === 'aceita' ? '✅ Aceita' : '❌ Recusada';

    const statusMessage = indicacao.status === 'aceita' ?
      'O candidato foi adicionado ao processo seletivo!' :
      indicacao.status === 'recusada' ?
      'Infelizmente esta indicação não foi aceita.' :
      'Aguardando avaliação do recrutador';

    return `
      <div class="minha-indicacao-card ${indicacao.status !== 'pendente' ? 'indicacao-processada' : ''}">
        <div class="indicacao-status-header">
          <span class="status-badge ${statusClass}">${statusText}</span>
          <span class="indicacao-data">📅 ${formatDate(indicacao.dataIndicacao)}</span>
        </div>

        <div class="indicacao-content">
          <div class="indicacao-candidato-info">
            <h3>${indicacao.nomeCandidato}</h3>
            <p class="vaga-nome">Vaga: <strong>${indicacao.vagaNome}</strong></p>
          </div>

          <div class="indicacao-links">
            ${indicacao.linkedin ? `
              <a href="${indicacao.linkedin}" target="_blank" class="link-badge">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            ` : ''}
            ${indicacao.github ? `
              <a href="${indicacao.github}" target="_blank" class="link-badge">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            ` : ''}
            ${indicacao.portfolio ? `
              <a href="${indicacao.portfolio}" target="_blank" class="link-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                Portfólio
              </a>
            ` : ''}
          </div>

          <div class="status-message ${indicacao.status}">
            <p>${statusMessage}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Formatar data
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}
