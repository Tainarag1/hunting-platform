let usuarioLogado = null;
let minhasCandidaturas = [];

// Verificar acesso ao carregar
document.addEventListener('DOMContentLoaded', () => {
  verificarAcesso();
  carregarCandidaturas();
});

// Verificar se é candidato logado
function verificarAcesso() {
  const usuario = localStorage.getItem('usuarioLogado');

  if (!usuario) {
    alert('Você precisa estar logado como candidato para acessar esta página');
    window.location.href = '/landing.html';
    return;
  }

  usuarioLogado = JSON.parse(usuario);

  if (usuarioLogado.perfil !== 'candidato') {
    alert('Apenas candidatos podem acessar esta página');
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

// Carregar candidaturas
async function carregarCandidaturas() {
  try {
    // Buscar candidatos pelo email do usuário logado
    const response = await fetch('/api/candidatos-todos');
    const todosCandidatos = await response.json();
    
    minhasCandidaturas = todosCandidatos.filter(c => 
      c.linkedin && c.linkedin.includes(usuarioLogado.email.split('@')[0])
    );

    // Se não encontrar por LinkedIn, criar dados de exemplo
    if (minhasCandidaturas.length === 0) {
      minhasCandidaturas = [
        {
          id: 'C001',
          vagaId: 'V001',
          vagaNome: 'Desenvolvedor Full Stack Sênior',
          compatibilidade: 92,
          etapa: 'Triagem',
          desclassificado: false,
          dataCandidatura: '2026-02-20',
          status: 'Em andamento'
        },
        {
          id: 'C002',
          vagaId: 'V002',
          vagaNome: 'Engenheiro de Dados Pleno',
          compatibilidade: 85,
          etapa: 'Entrevista',
          desclassificado: false,
          dataCandidatura: '2026-02-15',
          status: 'Em andamento'
        },
        {
          id: 'C003',
          vagaId: 'V003',
          vagaNome: 'Tech Lead',
          compatibilidade: 70,
          etapa: 'Teste Técnico',
          desclassificado: true,
          dataCandidatura: '2026-02-10',
          status: 'Encerrado'
        }
      ];
    }

    renderCandidaturas();
  } catch (error) {
    console.error('Erro ao carregar candidaturas:', error);
    alert('Erro ao carregar suas candidaturas');
  }
}

// Mostrar aba
function mostrarAba(aba) {
  // Atualizar botões
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  // Mostrar/esconder conteúdo
  document.getElementById('tab-em-andamento').style.display = aba === 'em-andamento' ? 'block' : 'none';
  document.getElementById('tab-historico').style.display = aba === 'historico' ? 'block' : 'none';
}

// Renderizar candidaturas
function renderCandidaturas() {
  const emAndamento = minhasCandidaturas.filter(c => !c.desclassificado && c.status === 'Em andamento');
  const historico = minhasCandidaturas.filter(c => c.desclassificado || c.status !== 'Em andamento');

  // Em andamento
  const containerEmAndamento = document.getElementById('vagasEmAndamento');
  if (emAndamento.length === 0) {
    containerEmAndamento.innerHTML = `
      <div class="empty-state-large">
        <div class="empty-icon">💼</div>
        <h2>Nenhuma candidatura em andamento</h2>
        <p>Você ainda não se candidatou a nenhuma vaga ou suas candidaturas já foram encerradas.</p>
        <button class="btn-primary btn-large" onclick="window.location.href='/landing.html#trabalhe-conosco'">
          Ver vagas disponíveis
        </button>
      </div>
    `;
  } else {
    containerEmAndamento.innerHTML = emAndamento.map(candidatura => `
      <div class="candidatura-card" onclick="abrirDetalhes('${candidatura.id}')">
        <div class="candidatura-header">
          <h3>${candidatura.vagaNome}</h3>
          <span class="status-badge status-em-andamento">Em andamento</span>
        </div>
        <div class="candidatura-info">
          <div class="info-item">
            <span class="info-label">Compatibilidade:</span>
            <span class="info-value compatibilidade-${candidatura.compatibilidade >= 80 ? 'alta' : candidatura.compatibilidade >= 60 ? 'media' : 'baixa'}">${candidatura.compatibilidade}%</span>
          </div>
          <div class="info-item">
            <span class="info-label">Etapa atual:</span>
            <span class="info-value">${candidatura.etapa}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Candidatou-se em:</span>
            <span class="info-value">${formatDate(candidatura.dataCandidatura)}</span>
          </div>
        </div>
        <div class="etapas-progress">
          ${renderEtapasProgress(candidatura.etapa)}
        </div>
        <button class="btn-ver-detalhes">Ver detalhes →</button>
      </div>
    `).join('');
  }

  // Histórico
  const containerHistorico = document.getElementById('vagasHistorico');
  if (historico.length === 0) {
    containerHistorico.innerHTML = `
      <div class="empty-state-large">
        <div class="empty-icon">📋</div>
        <h2>Nenhum histórico</h2>
        <p>Você ainda não possui candidaturas encerradas ou desclassificadas.</p>
      </div>
    `;
  } else {
    containerHistorico.innerHTML = historico.map(candidatura => `
      <div class="candidatura-card candidatura-encerrada" onclick="abrirDetalhes('${candidatura.id}')">
        <div class="candidatura-header">
          <h3>${candidatura.vagaNome}</h3>
          <span class="status-badge ${candidatura.desclassificado ? 'status-desclassificado' : 'status-encerrado'}">${candidatura.desclassificado ? 'Desclassificado' : 'Encerrado'}</span>
        </div>
        <div class="candidatura-info">
          <div class="info-item">
            <span class="info-label">Compatibilidade:</span>
            <span class="info-value">${candidatura.compatibilidade}%</span>
          </div>
          <div class="info-item">
            <span class="info-label">Última etapa:</span>
            <span class="info-value">${candidatura.etapa}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Candidatou-se em:</span>
            <span class="info-value">${formatDate(candidatura.dataCandidatura)}</span>
          </div>
        </div>
        <button class="btn-ver-detalhes">Ver detalhes →</button>
      </div>
    `).join('');
  }
}

// Renderizar etapas de progresso
function renderEtapas(etapaAtual) {
  const etapas = ['Triagem', 'Entrevista', 'Teste Técnico', 'Finalistas'];
  const etapaIndex = etapas.indexOf(etapaAtual);

  return etapas.map((etapa, index) => {
    let status = '';
    if (index < etapaIndex) {
      status = 'completa';
    } else if (index === etapaIndex) {
      status = 'atual';
    } else {
      status = 'pendente';
    }

    return `
      <div class="etapa-item ${status}">
        <div class="etapa-circulo"></div>
        <span class="etapa-texto">${etapa}</span>
      </div>
    `;
  }).join('<div class="etapa-linha"></div>');
}

// Renderizar progresso simples
function renderEtapasProgress(etapaAtual) {
  const etapas = ['Triagem', 'Entrevista', 'Teste Técnico', 'Finalistas'];
  const etapaIndex = etapas.indexOf(etapaAtual);
  const progresso = ((etapaIndex + 1) / etapas.length) * 100;

  return `
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${progresso}%"></div>
    </div>
    <div class="progress-labels">
      ${etapas.map((etapa, index) => `
        <span class="progress-label ${index <= etapaIndex ? 'active' : ''}">${etapa}</span>
      `).join('')}
    </div>
  `;
}

// Abrir detalhes
function abrirDetalhes(candidaturaId) {
  const candidatura = minhasCandidaturas.find(c => c.id === candidaturaId);
  if (!candidatura) return;

  document.getElementById('modalVagaNome').textContent = candidatura.vagaNome;
  
  const etapas = ['Triagem', 'Entrevista', 'Teste Técnico', 'Finalistas'];
  const etapaIndex = etapas.indexOf(candidatura.etapa);

  document.getElementById('modalConteudo').innerHTML = `
    <div class="detalhes-candidatura">
      <div class="detalhe-status ${candidatura.desclassificado ? 'desclassificado' : ''}">
        <span class="status-grande ${candidatura.desclassificado ? 'status-desclassificado' : 'status-em-andamento'}">
          ${candidatura.desclassificado ? '❌ Desclassificado' : '✅ Em andamento'}
        </span>
      </div>

      <div class="detalhe-item">
        <span class="detalhe-label">Código da vaga:</span>
        <span class="detalhe-value">${candidatura.vagaId}</span>
      </div>

      <div class="detalhe-item">
        <span class="detalhe-label">Data da candidatura:</span>
        <span class="detalhe-value">${formatDate(candidatura.dataCandidatura)}</span>
      </div>

      <div class="detalhe-item">
        <span class="detalhe-label">Compatibilidade com a vaga:</span>
        <span class="detalhe-value compatibilidade-${candidatura.compatibilidade >= 80 ? 'alta' : candidatura.compatibilidade >= 60 ? 'media' : 'baixa'}">${candidatura.compatibilidade}%</span>
      </div>

      <div class="etapas-container">
        <h4>Progresso no Processo Seletivo</h4>
        <div class="etapas-visual">
          ${etapas.map((etapa, index) => {
            let status = '';
            let icone = '';
            if (index < etapaIndex) {
              status = 'completa';
              icone = '✓';
            } else if (index === etapaIndex) {
              status = 'atual';
              icone = '●';
            } else {
              status = 'pendente';
              icone = '○';
            }
            return `
              <div class="etapa-visual-item ${status}">
                <div class="etapa-icone">${icone}</div>
                <span class="etapa-nome">${etapa}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      ${candidatura.desclassificado ? `
        <div class="mensagem-resultado">
          <p>Infelizmente você não foi selecionado para continuar neste processo seletivo. Continue se candidatando a outras vagas!</p>
        </div>
      ` : `
        <div class="mensagem-resultado positiva">
          <p>Parabéns! Você está no processo seletivo. Aguarde o contato da equipe de recrutamento para os próximos passos.</p>
        </div>
      `}
    </div>
  `;

  document.getElementById('modalDetalhes').classList.add('active');
}

// Fechar modal
function fecharModalDetalhes() {
  document.getElementById('modalDetalhes').classList.remove('active');
}

// Formatar data
function formatDate(dateStr) {
  if (!dateStr) return '--';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Fechar modal ao clicar fora
document.getElementById('modalDetalhes').addEventListener('click', (e) => {
  if (e.target.id === 'modalDetalhes') fecharModalDetalhes();
});
