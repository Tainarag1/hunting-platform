let usuarioLogado = null;
let vagasAbertas = [];

// Verificar se há usuário logado ao carregar
document.addEventListener('DOMContentLoaded', async () => {
  verificarUsuarioLogado();
  await carregarVagas();
});

// Carregar vagas abertas
async function carregarVagas() {
  try {
    const response = await fetch('/api/vagas');
    const vagas = await response.json();
    vagasAbertas = vagas.filter(v => v.status === 'Aberta');
    renderVagas();
  } catch (error) {
    console.error('Erro ao carregar vagas:', error);
  }
}

// Renderizar vagas na seção "Trabalhe Conosco"
function renderVagas() {
  const container = document.getElementById('vagasList');

  if (vagasAbertas.length === 0) {
    container.innerHTML = '<p class="empty-message">Não há vagas abertas no momento.</p>';
    return;
  }

  container.innerHTML = vagasAbertas.map(vaga => `
    <div class="vaga-landing-card">
      <div class="vaga-landing-info">
        <span class="vaga-id">ID: ${vaga.id}</span>
        <h3>${vaga.nome}</h3>
        <p>${vaga.descricao?.substring(0, 150) || 'Sem descrição'}${vaga.descricao?.length > 150 ? '...' : ''}</p>
      </div>
      <button class="btn-candidatar" onclick="abrirModalCandidatura('${vaga.id}', '${vaga.nome}')">
        Candidatar-se
      </button>
    </div>
  `).join('');
}

// Verificar usuário logado
function verificarUsuarioLogado() {
  const usuario = localStorage.getItem('usuarioLogado');
  if (usuario) {
    usuarioLogado = JSON.parse(usuario);
    atualizarInterfaceUsuario();
  }
}

// Atualizar interface após login
function atualizarInterfaceUsuario() {
  const navAuth = document.querySelector('.nav-auth');
  const navUser = document.getElementById('navUser');
  const userNome = document.getElementById('userNome');
  const linkDashboard = document.getElementById('linkDashboard');

  if (usuarioLogado) {
    navAuth.style.display = 'none';
    navUser.style.display = 'block';
    userNome.textContent = usuarioLogado.nome;

    // Atualizar link do dashboard conforme perfil
    if (usuarioLogado.perfil === 'funcionario') {
      linkDashboard.textContent = 'Fazer Indicação';
      linkDashboard.href = '/indicacao.html';
    } else if (usuarioLogado.perfil === 'recrutador') {
      linkDashboard.textContent = 'Processos Seletivos';
      linkDashboard.href = '/';
    }
  } else {
    navAuth.style.display = 'flex';
    navUser.style.display = 'none';
  }
}

// Ir para dashboard
function irParaDashboard() {
  if (usuarioLogado) {
    if (usuarioLogado.perfil === 'funcionario') {
      window.location.href = '/indicacao.html';
    } else if (usuarioLogado.perfil === 'recrutador') {
      window.location.href = '/';
    }
  }
}

// Logout
function logout() {
  localStorage.removeItem('usuarioLogado');
  usuarioLogado = null;
  atualizarInterfaceUsuario();
  alert('Logout realizado com sucesso!');
}

// === MODAIS ===

// Modal Login
function abrirModalLogin() {
  document.getElementById('modalLogin').classList.add('active');
}

function fecharModalLogin() {
  document.getElementById('modalLogin').classList.remove('active');
  document.getElementById('formLogin').reset();
}

// Modal Registro
function abrirModalRegistro() {
  document.getElementById('modalRegistro').classList.add('active');
  // Sempre iniciar na seleção de tipo
  voltarSelecaoTipo();
}

function fecharModalRegistro() {
  document.getElementById('modalRegistro').classList.remove('active');
  voltarSelecaoTipo();
}

// Modal Candidatura
function abrirModalCandidatura(vagaId, vagaNome) {
  document.getElementById('candidaturaVagaId').value = vagaId;
  document.getElementById('vagaNomeCandidatura').textContent = vagaNome;
  document.getElementById('modalCandidatura').classList.add('active');
}

function fecharModalCandidatura() {
  document.getElementById('modalCandidatura').classList.remove('active');
  document.getElementById('formCandidatura').reset();
}

// Fechar modais ao clicar fora
document.getElementById('modalLogin').addEventListener('click', (e) => {
  if (e.target.id === 'modalLogin') fecharModalLogin();
});

document.getElementById('modalRegistro').addEventListener('click', (e) => {
  if (e.target.id === 'modalRegistro') fecharModalRegistro();
});

document.getElementById('modalCandidatura').addEventListener('click', (e) => {
  if (e.target.id === 'modalCandidatura') fecharModalCandidatura();
});

// === AUTENTICAÇÃO ===

// Fazer Login
async function fazerLogin(event) {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const senha = document.getElementById('loginSenha').value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();

    if (response.ok) {
      usuarioLogado = data.usuario;
      localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
      atualizarInterfaceUsuario();
      fecharModalLogin();
      
      // Redirecionar conforme perfil após login
      if (usuarioLogado.perfil === 'recrutador') {
        window.location.href = '/';
      } else if (usuarioLogado.perfil === 'funcionario') {
        window.location.href = '/indicacao.html';
      } else if (usuarioLogado.perfil === 'candidato') {
        window.location.href = '/dashboard-candidato.html';
      } else {
        alert(`Bem-vindo(a), ${usuarioLogado.nome}!`);
      }
    } else {
      alert(data.error || 'Erro ao fazer login');
    }
  } catch (error) {
    console.error('Erro no login:', error);
    alert('Erro ao fazer login. Verifique suas credenciais.');
  }
}

// Fazer Registro
async function fazerRegistro(event) {
  event.preventDefault();

  const nome = document.getElementById('registroNome').value;
  const email = document.getElementById('registroEmail').value;
  const senha = document.getElementById('registroSenha').value;
  const confirmarSenha = document.getElementById('registroConfirmarSenha').value;
  const perfil = document.getElementById('registroPerfil').value;

  // Validações
  if (senha !== confirmarSenha) {
    alert('As senhas não coincidem');
    return;
  }

  if (!perfil) {
    alert('Selecione um tipo de usuário');
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha, perfil })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Registro realizado com sucesso! Faça login para continuar.');
      fecharModalRegistro();
      abrirModalLogin();
    } else {
      alert(data.error || 'Erro ao registrar');
    }
  } catch (error) {
    console.error('Erro no registro:', error);
    alert('Erro ao registrar. Tente novamente.');
  }
}

// === SELEÇÃO DE TIPO DE USUÁRIO ===

const tipoUsuarioLabels = {
  'candidato': '👤 Usuário Candidato',
  'funcionario': '🏢 Funcionário',
  'recrutador': '🔍 Recrutador'
};

function selecionarTipoUsuario(tipo) {
  document.getElementById('registroPerfil').value = tipo;
  document.getElementById('tipoUsuarioSelecionado').textContent = tipoUsuarioLabels[tipo];
  
  // Esconder seletor e mostrar formulário
  document.getElementById('seletorTipoUsuario').style.display = 'none';
  document.getElementById('formRegistro').style.display = 'block';
}

function voltarSelecaoTipo() {
  // Mostrar seletor e esconder formulário
  document.getElementById('seletorTipoUsuario').style.display = 'block';
  document.getElementById('formRegistro').style.display = 'none';
  
  // Limpar campos
  document.getElementById('formRegistro').reset();
  document.getElementById('registroPerfil').value = '';
}

// Fechar modal de registro e resetar para seleção
function fecharModalRegistroReset() {
  fecharModalRegistro();
  voltarSelecaoTipo();
}

// === CANDIDATURA ===

// Enviar candidatura
async function enviarCandidatura(event) {
  event.preventDefault();

  const vagaId = document.getElementById('candidaturaVagaId').value;
  const nome = document.getElementById('candidaturaNome').value;
  const linkedin = document.getElementById('candidaturaLinkedIn').value;
  const github = document.getElementById('candidaturaGitHub').value || null;
  const portfolio = document.getElementById('candidaturaPortfolio').value || null;
  const foto = document.getElementById('candidaturaFoto').value || null;

  try {
    const response = await fetch('/api/candidatos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        linkedin,
        github,
        portfolio,
        foto,
        vagaId // Associar diretamente à vaga
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Candidatura enviada com sucesso! A análise do seu perfil será iniciada.');
      fecharModalCandidatura();
    } else {
      alert(data.error || 'Erro ao enviar candidatura');
    }
  } catch (error) {
    console.error('Erro na candidatura:', error);
    alert('Erro ao enviar candidatura');
  }
}

// === CONTATO ===

// Enviar mensagem (simulação)
function enviarMensagem(event) {
  event.preventDefault();
  alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
  event.target.reset();
}
