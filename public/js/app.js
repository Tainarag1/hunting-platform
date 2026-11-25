let vagas = [];
let filteredVagas = [];
let currentPage = 1;
const itemsPerPage = 20;
let usuarioLogado = null;

// Verificar login ao carregar
document.addEventListener('DOMContentLoaded', () => {
  verificarAcesso();
  loadVagas();
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

// Carregar vagas
async function loadVagas() {
  try {
    const response = await fetch('/api/vagas');
    vagas = await response.json();
    filteredVagas = [...vagas];
    populateResponsaveis();
    renderVagas();
  } catch (error) {
    console.error('Erro ao carregar vagas:', error);
  }
}

// Popular filtro de responsáveis
function populateResponsaveis() {
  const responsaveis = [...new Set(vagas.map(v => v.responsavel))];
  const select = document.getElementById('filterResponsavel');

  responsaveis.forEach(r => {
    const option = document.createElement('option');
    option.value = r;
    option.textContent = r;
    select.appendChild(option);
  });
}

// Filtrar vagas
function filterVagas() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('filterStatus').value;
  const responsavel = document.getElementById('filterResponsavel').value;

  filteredVagas = vagas.filter(vaga => {
    const matchSearch = vaga.nome.toLowerCase().includes(search) || vaga.id.toLowerCase().includes(search);
    const matchStatus = !status || vaga.status === status;
    const matchResponsavel = !responsavel || vaga.responsavel === responsavel;
    return matchSearch && matchStatus && matchResponsavel;
  });

  currentPage = 1;
  renderVagas();
}

// Limpar filtros
function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterResponsavel').value = '';
  filteredVagas = [...vagas];
  currentPage = 1;
  renderVagas();
}

// Toggle painel de filtros
function toggleFilters() {
  const panel = document.getElementById('filterPanel');
  panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
}

// Mapear status para classe CSS
function getStatusClass(status) {
  const map = {
    'Aberta': 'status-aberta',
    'Em andamento': 'status-em-andamento',
    'Encerrada': 'status-encerrada',
    'Cancelada': 'status-cancelada'
  };
  return map[status] || 'status-aberta';
}

// Renderizar vagas
function renderVagas() {
  const grid = document.getElementById('vagasGrid');
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedVagas = filteredVagas.slice(start, end);

  grid.innerHTML = paginatedVagas.map(vaga => `
    <div class="vaga-card" onclick="abrirVaga('${vaga.id}')">
      <div class="vaga-card-header">
        <h3>${vaga.nome}</h3>
        <span class="status-badge ${getStatusClass(vaga.status)}">${vaga.status}</span>
      </div>
      <div class="vaga-card-body">
        <span>📅 ${formatDate(vaga.dataCriacao)}</span>
        <span>👥 ${vaga.candidatos} candidatos</span>
        <span>📍 ${vaga.etapaAtual}</span>
        <span>👤 ${vaga.responsavel}</span>
      </div>
    </div>
  `).join('');

  updatePagination();
}

// Formatar data
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Atualizar paginação
function updatePagination() {
  const totalPages = Math.ceil(filteredVagas.length / itemsPerPage);
  const pageInfo = document.getElementById('pageInfo');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage >= totalPages;
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderVagas();
  }
}

function nextPage() {
  const totalPages = Math.ceil(filteredVagas.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderVagas();
  }
}

// Abrir vaga
function abrirVaga(id) {
  window.location.href = `/vaga.html?id=${id}`;
}

// Toggle menu hamburguer
function toggleMenu() {
  const menu = document.getElementById('dropdownMenu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// Fechar menu ao clicar fora
document.addEventListener('click', (e) => {
  const menu = document.getElementById('dropdownMenu');
  const hamburger = document.querySelector('.hamburger-menu');
  
  if (menu && hamburger && !menu.contains(e.target) && !hamburger.contains(e.target)) {
    menu.style.display = 'none';
  }
});

// Inicializar
document.addEventListener('DOMContentLoaded', loadVagas);
