let usuarioLogado = null;
let vagasAbertas = [];
let vagasFiltradas = [];
let vagaSelecionada = null;

// Verificar login ao carregar
document.addEventListener('DOMContentLoaded', async () => {
  verificarAcesso();
  await carregarVagas();
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
    alert('Apenas funcionários podem fazer indicações');
    window.location.href = '/landing.html';
    return;
  }

  // Atualizar nome no menu
  document.getElementById('userName').textContent = usuarioLogado.nome;

  // Preencher informações do usuário
  document.getElementById('usuarioInfo').innerHTML = `
    <div class="usuario-card">
      <span class="usuario-label">Logado como:</span>
      <span class="usuario-nome">${usuarioLogado.nome}</span>
      <span class="usuario-email">(${usuarioLogado.email})</span>
    </div>
  `;
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

// Carregar vagas abertas
async function carregarVagas() {
  try {
    const response = await fetch('/api/vagas');
    const vagas = await response.json();
    vagasAbertas = vagas.filter(v => v.status === 'Aberta');
    vagasFiltradas = [...vagasAbertas];
    renderVagas();
  } catch (error) {
    console.error('Erro ao carregar vagas:', error);
    alert('Erro ao carregar vagas');
  }
}

// Filtrar vagas
function filtrarVagas() {
  const termo = document.getElementById('searchVaga').value.toLowerCase();

  if (termo === '') {
    vagasFiltradas = [...vagasAbertas];
  } else {
    vagasFiltradas = vagasAbertas.filter(v =>
      v.nome.toLowerCase().includes(termo) ||
      v.id.toLowerCase().includes(termo)
    );
  }

  renderVagas();
}

// Renderizar vagas
function renderVagas() {
  const container = document.getElementById('vagasLista');

  if (vagasFiltradas.length === 0) {
    container.innerHTML = '<p class="empty-message">Nenhuma vaga encontrada</p>';
    return;
  }

  container.innerHTML = vagasFiltradas.map(vaga => `
    <div class="vaga-option ${vagaSelecionada?.id === vaga.id ? 'selected' : ''}" onclick="selecionarVaga('${vaga.id}')">
      <div class="vaga-option-header">
        <span class="vaga-id">${vaga.id}</span>
        <span class="status-badge status-aberta">${vaga.status}</span>
      </div>
      <h3>${vaga.nome}</h3>
      <p>${vaga.descricao?.substring(0, 100) || 'Sem descrição'}${vaga.descricao?.length > 100 ? '...' : ''}</p>
      <div class="vaga-option-footer">
        <span>📍 ${vaga.etapaAtual}</span>
        <span>👤 ${vaga.responsavel}</span>
      </div>
    </div>
  `).join('');
}

// Selecionar vaga
function selecionarVaga(vagaId) {
  vagaSelecionada = vagasAbertas.find(v => v.id === vagaId);

  if (!vagaSelecionada) return;

  // Atualizar visual
  renderVagas();

  // Mostrar card da vaga selecionada
  document.getElementById('vagaSelecionada').style.display = 'block';
  document.getElementById('vagaCardSelecionada').innerHTML = `
    <span class="vaga-id">${vagaSelecionada.id}</span>
    <h4>${vagaSelecionada.nome}</h4>
    <p>${vagaSelecionada.descricao?.substring(0, 150) || 'Sem descrição'}</p>
    <div class="vaga-info-row">
      <span>Responsável: ${vagaSelecionada.responsavel}</span>
    </div>
  `;

  // Mostrar botão de indicar
  document.getElementById('btnIndicar').style.display = 'block';

  // Scroll para a vaga selecionada
  document.getElementById('vagaSelecionada').scrollIntoView({ behavior: 'smooth' });
}

// Abrir modal de indicação
function abrirModalIndicacao() {
  if (!vagaSelecionada) {
    alert('Selecione uma vaga primeiro');
    return;
  }

  // Pré-preencher dados do indicador
  document.getElementById('indicadorNome').value = usuarioLogado.nome;
  document.getElementById('indicadorEmail').value = usuarioLogado.email;

  document.getElementById('modalIndicacao').classList.add('active');
}

// Fechar modal
function fecharModalIndicacao() {
  document.getElementById('modalIndicacao').classList.remove('active');
  document.getElementById('formIndicacao').reset();

  // Restaurar dados do indicador
  document.getElementById('indicadorNome').value = usuarioLogado.nome;
  document.getElementById('indicadorEmail').value = usuarioLogado.email;
}

// Enviar indicação
async function enviarIndicacao(event) {
  event.preventDefault();

  const indicadorNome = document.getElementById('indicadorNome').value;
  const indicadorEmail = document.getElementById('indicadorEmail').value;
  const candidatoNome = document.getElementById('candidatoNome').value;
  const candidatoLinkedIn = document.getElementById('candidatoLinkedIn').value;
  const candidatoGitHub = document.getElementById('candidatoGitHub').value || null;
  const candidatoPortfolio = document.getElementById('candidatoPortfolio').value || null;

  try {
    const response = await fetch('/api/indicacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vagaId: vagaSelecionada.id,
        vagaNome: vagaSelecionada.nome,
        nomeIndicador: indicadorNome,
        emailIndicador: indicadorEmail,
        nomeCandidato: candidatoNome,
        linkedin: candidatoLinkedIn,
        github: candidatoGitHub,
        portfolio: candidatoPortfolio
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Indicação enviada com sucesso! O recrutador avaliará a candidatura.');
      fecharModalIndicacao();

      // Limpar seleção
      vagaSelecionada = null;
      document.getElementById('vagaSelecionada').style.display = 'none';
      document.getElementById('btnIndicar').style.display = 'none';
      renderVagas();
    } else {
      alert(data.error || 'Erro ao enviar indicação');
    }
  } catch (error) {
    console.error('Erro ao enviar indicação:', error);
    alert('Erro ao enviar indicação');
  }
}

// Fechar modal ao clicar fora
document.getElementById('modalIndicacao').addEventListener('click', (e) => {
  if (e.target.id === 'modalIndicacao') fecharModalIndicacao();
});
