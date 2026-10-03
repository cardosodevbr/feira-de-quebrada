import { db, auth } from "./firebase-config.js";
import { ref, set, get, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { onAuthStateChanged, signOut, deleteUser } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let usuarioAtual = null;


function getChaveUsuario(chave) {
  return usuarioAtual ? `${chave}_${usuarioAtual.uid}` : chave;
}

function limparDadosLocais() {
  if (!usuarioAtual) return;
  const uid = usuarioAtual.uid;
  const chaves = [
    `dadosNegocio_${uid}`,
    `logoComercio_${uid}`,
    `galeriaFotos_${uid}`,
    `horariosLojista_${uid}`,
    `perfilResponsavel_${uid}`,
    `metrica_visualizacoes_${uid}`,
    `metrica_cliques_zap_${uid}`,
    `avaliacoesReportadas_${uid}`,
    `statusConta_${uid}`
  ];
  chaves.forEach(k => localStorage.removeItem(k));
}

// ==========================================
// AUTENTICAÇÃO E CARREGAMENTO ESPECÍFICO
// ==========================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    usuarioAtual = user;
    console.log("Usuário autenticado:", user.uid);
    
    atualizarNomeLojistaTopo();

   
    await carregarEstatisticas();
    await carregarDadosNegocio();
    await carregarHorarios();
    await carregarPerfil();
    await carregarLogo();
    await carregarGaleria();
    await carregarStatusConta();
    renderizarVitrine();
    atualizarStatusReportados();
  } else {
    console.warn("Nenhum usuário logado. Redirecionando para login...");
    window.location.href = 'login.html';
  }
});

function atualizarNomeLojistaTopo(nomeNegocio = null) {
  const elem = document.getElementById('nomeLojista');
  if (!elem) return;

  if (nomeNegocio && nomeNegocio.trim() !== '') {
    elem.innerText = nomeNegocio;
    return;
  }


  const perfilSalvo = JSON.parse(localStorage.getItem(getChaveUsuario('perfilResponsavel')) || '{}');
  if (perfilSalvo.nome) {
    elem.innerText = perfilSalvo.nome;
  } else if (usuarioAtual && usuarioAtual.displayName) {
    elem.innerText = usuarioAtual.displayName;
  } else if (usuarioAtual && usuarioAtual.email) {
    elem.innerText = usuarioAtual.email.split('@')[0];
  } else {
    elem.innerText = 'Meu Comércio';
  }
}

// ==========================================
// SAIR DA CONTA
// ==========================================
const btnSairConta = document.getElementById('btnSairConta');
if (btnSairConta) {
  btnSairConta.addEventListener('click', async () => {
    if (confirm("Tem certeza que deseja sair da sua conta?")) {
      try {
        limparDadosLocais();
        await signOut(auth);
        window.location.href = 'inicio.html';
      } catch (err) {
        console.error("Erro ao sair:", err);
        alert("Erro ao encerrar sessão: " + err.message);
      }
    }
  });
}

// ==========================================
// DESATIVAR / ATIVAR E EXCLUIR CONTA
// ==========================================
let contaAtiva = true;

async function carregarStatusConta() {
  if (!usuarioAtual) return;
  try {
    const snapshot = await get(ref(db, `Comercio/${usuarioAtual.uid}/statusConta`));
    if (snapshot.exists()) {
      contaAtiva = snapshot.val().ativa;
    } else {
      contaAtiva = true;
    }
  } catch (err) {
    const salvo = localStorage.getItem(getChaveUsuario('statusConta'));
    if (salvo !== null) contaAtiva = JSON.parse(salvo);
  }
  atualizarUIStatusConta();
}

function atualizarUIStatusConta() {
  const lbl = document.getElementById('lblStatusConta');
  const btn = document.getElementById('btnToggleStatusConta');
  if (lbl && btn) {
    if (contaAtiva) {
      lbl.innerText = "Ativo";
      lbl.className = "status-ativo";
      btn.innerText = "Desativar Anúncio / Conta";
      btn.className = "btn-warning";
    } else {
      lbl.innerText = "Desativado";
      lbl.className = "status-desativado";
      btn.innerText = "Ativar Anúncio / Conta";
      btn.className = "btn-success";
    }
  }
  localStorage.setItem(getChaveUsuario('statusConta'), JSON.stringify(contaAtiva));
}

const btnToggleStatusConta = document.getElementById('btnToggleStatusConta');
if (btnToggleStatusConta) {
  btnToggleStatusConta.addEventListener('click', async () => {
    if (!usuarioAtual) return;
    const novoStatus = !contaAtiva;
    const acao = novoStatus ? "ativar" : "desativar";

    if (confirm(`Tem certeza que deseja ${acao} a sua conta/anúncio na plataforma?`)) {
      contaAtiva = novoStatus;
      atualizarUIStatusConta();

      try {
        await set(ref(db, `Comercio/${usuarioAtual.uid}/statusConta`), {
          ativa: contaAtiva,
          atualizadoEm: new Date().toISOString()
        });
        alert(`Conta ${novoStatus ? 'ativada' : 'desativada'} com sucesso!`);
      } catch (err) {
        console.error("Erro ao alterar status da conta:", err);
        alert("Erro ao alterar status no banco de dados: " + err.message);
      }
    }
  });
}

const btnExcluirConta = document.getElementById('btnExcluirConta');
if (btnExcluirConta) {
  btnExcluirConta.addEventListener('click', async () => {
    if (!usuarioAtual) return;

    const confirmacao = confirm(
      "⚠️ ATENÇÃO: Esta ação é irreversível!\n\n" +
      "Ao excluir sua conta, todos os seus dados e anúncios serão permanentemente removidos.\n\n" +
      "Deseja realmente excluir sua conta?"
    );

    if (confirmacao) {
      try {
        const uid = usuarioAtual.uid;
        await remove(ref(db, `Comercio/${uid}`));
        limparDadosLocais();
        await deleteUser(usuarioAtual);

        alert("Sua conta foi excluída com sucesso.");
        window.location.href = 'inicial.html';
      } catch (err) {
        console.error("Erro ao excluir conta:", err);
        if (err.code === 'auth/requires-recent-login') {
          alert("Por segurança, saia e faça login novamente antes de excluir sua conta.");
        } else {
          alert("Erro ao excluir conta: " + err.message);
        }
      }
    }
  });
}

// ==========================================
// NAVEGAÇÃO
// ==========================================
document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.aba-conteudo').forEach(a => a.classList.remove('active'));

    btn.classList.add('active');
    const abaId = `aba-${btn.dataset.aba}`;
    const abaEl = document.getElementById(abaId);
    if (abaEl) abaEl.classList.add('active');

    if (btn.dataset.aba === 'vitrine') {
      incrementarVisualizacoes();
      renderizarVitrine();
    }
  });
});

document.querySelectorAll('.sub-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.sub-aba-conteudo').forEach(s => s.classList.remove('active'));

    btn.classList.add('active');
    const subId = `sub-${btn.dataset.sub}`;
    const subEl = document.getElementById(subId);
    if (subEl) subEl.classList.add('active');
  });
});

function trocarAba(abaPrincipal, subAba = null) {
  const btnPrincipal = document.querySelector(`[data-aba="${abaPrincipal}"]`);
  if (btnPrincipal) btnPrincipal.click();
  
  if (subAba) {
    const btnSub = document.querySelector(`[data-sub="${subAba}"]`);
    if (btnSub) btnSub.click();
  }
}

const btnIrGaleria = document.getElementById('btnIrGaleria');
if (btnIrGaleria) {
  btnIrGaleria.addEventListener('click', () => trocarAba('negocio', 'galeria'));
}

// ==========================================
// ESTATÍSTICAS
// ==========================================
async function carregarEstatisticas() {
  let views = 0;
  let clicks = 0;

  if (usuarioAtual) {
    try {
      const snap = await get(ref(db, `Comercio/${usuarioAtual.uid}/metricas`));
      if (snap.exists()) {
        const m = snap.val();
        views = m.visualizacoes || 0;
        clicks = m.cliquesZap || 0;
      }
    } catch (e) {
      console.warn("Erro ao buscar métricas online:", e);
    }
  }

  if (document.getElementById('statViews')) document.getElementById('statViews').innerText = views;
  if (document.getElementById('statClicks')) document.getElementById('statClicks').innerText = clicks;
}

async function incrementarVisualizacoes() {
  let views = parseInt(localStorage.getItem(getChaveUsuario('metrica_visualizacoes')) || '0') + 1;
  localStorage.setItem(getChaveUsuario('metrica_visualizacoes'), views);

  if (usuarioAtual) {
    try {
      await set(ref(db, `Comercio/${usuarioAtual.uid}/metricas/visualizacoes`), views);
    } catch (err) {
      console.error("Erro ao atualizar visualizações no Firebase:", err);
    }
  }
  carregarEstatisticas();
}

async function registrarCliqueWhatsApp() {
  let clicks = parseInt(localStorage.getItem(getChaveUsuario('metrica_cliques_zap')) || '0') + 1;
  localStorage.setItem(getChaveUsuario('metrica_cliques_zap'), clicks);

  if (usuarioAtual) {
    try {
      await set(ref(db, `Comercio/${usuarioAtual.uid}/metricas/cliquesZap`), clicks);
    } catch (err) {
      console.error("Erro ao atualizar cliques no Firebase:", err);
    }
  }
  carregarEstatisticas();
}

const btnWhatsappVitrine = document.getElementById('btnWhatsappVitrine');
if (btnWhatsappVitrine) {
  btnWhatsappVitrine.addEventListener('click', registrarCliqueWhatsApp);
}

// ==========================================
// DADOS DO NEGÓCIO
// ==========================================
const formNegocio = document.getElementById('formDadosNegocio');
if (formNegocio) {
  formNegocio.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!usuarioAtual) {
      alert('Sua sessão expirou ou você não está logado.');
      return;
    }
    
    const modalidades = Array.from(document.querySelectorAll('input[name="modalidade"]:checked')).map(cb => cb.value);
    const pagamentos = Array.from(document.querySelectorAll('input[name="pagamento"]:checked')).map(cb => cb.value);

    let instagramInput = document.getElementById('inputInstagramComercio').value.trim();
    if (instagramInput && !instagramInput.startsWith('@')) {
      instagramInput = `@${instagramInput}`;
    }

    const dados = {
      nome: document.getElementById('inputNomeComercio').value,
      bairro: document.getElementById('inputBairroComercio').value,
      whatsapp: document.getElementById('inputWhatsappComercio').value,
      instagram: instagramInput,
      categoria: document.getElementById('selectCategoria').value,
      descricao: document.getElementById('textDescricao').value,
      modalidades: modalidades,
      pagamentos: pagamentos,
      atualizadoEm: new Date().toISOString()
    };
    
    localStorage.setItem(getChaveUsuario('dadosNegocio'), JSON.stringify(dados));
    atualizarNomeLojistaTopo(dados.nome);

    try {
      await set(ref(db, `Comercio/${usuarioAtual.uid}/dadosNegocio`), dados);
      alert('Dados do comércio salvos com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar no Firebase:', err);
      alert('Erro ao salvar no banco online: ' + err.message);
    }

    renderizarVitrine();
  });
}

async function carregarDadosNegocio() {
  let dados = null;

  if (usuarioAtual) {
    try {
      const snapshot = await get(ref(db, `Comercio/${usuarioAtual.uid}/dadosNegocio`));
      if (snapshot.exists()) {
        dados = snapshot.val();
        localStorage.setItem(getChaveUsuario('dadosNegocio'), JSON.stringify(dados));
      }
    } catch (err) {
      console.warn('Erro ao ler do Firebase, carregando localmente:', err);
    }
  }

  if (!dados) {
    const salvos = localStorage.getItem(getChaveUsuario('dadosNegocio'));
    if (salvos) dados = JSON.parse(salvos);
  }

  
  if (dados) {
    if (document.getElementById('inputNomeComercio')) document.getElementById('inputNomeComercio').value = dados.nome || '';
    if (document.getElementById('inputBairroComercio')) document.getElementById('inputBairroComercio').value = dados.bairro || '';
    if (document.getElementById('inputWhatsappComercio')) document.getElementById('inputWhatsappComercio').value = dados.whatsapp || '';
    if (document.getElementById('inputInstagramComercio')) document.getElementById('inputInstagramComercio').value = dados.instagram || '';
    if (document.getElementById('selectCategoria')) document.getElementById('selectCategoria').value = dados.categoria || '';
    if (document.getElementById('textDescricao')) document.getElementById('textDescricao').value = dados.descricao || '';
    
    if (dados.nome) atualizarNomeLojistaTopo(dados.nome);

    document.querySelectorAll('input[name="modalidade"]').forEach(cb => {
      cb.checked = dados.modalidades ? dados.modalidades.includes(cb.value) : false;
    });

    document.querySelectorAll('input[name="pagamento"]').forEach(cb => {
      cb.checked = dados.pagamentos ? dados.pagamentos.includes(cb.value) : false;
    });
  } else {
    
    if (document.getElementById('inputNomeComercio')) document.getElementById('inputNomeComercio').value = '';
    if (document.getElementById('inputBairroComercio')) document.getElementById('inputBairroComercio').value = '';
    if (document.getElementById('inputWhatsappComercio')) document.getElementById('inputWhatsappComercio').value = '';
    if (document.getElementById('inputInstagramComercio')) document.getElementById('inputInstagramComercio').value = '';
    if (document.getElementById('selectCategoria')) document.getElementById('selectCategoria').value = '';
    if (document.getElementById('textDescricao')) document.getElementById('textDescricao').value = '';
    document.querySelectorAll('input[name="modalidade"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="pagamento"]').forEach(cb => cb.checked = false);
  }
}


const btnUploadLogo = document.getElementById('btnUploadLogo');
const logoInput = document.getElementById('logoInput');
if (btnUploadLogo && logoInput) {
  btnUploadLogo.addEventListener('click', () => logoInput.click());
  
  logoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async function(evt) {
        const logoData = evt.target.result;
        localStorage.setItem(getChaveUsuario('logoComercio'), logoData);
        carregarLogo();
        renderizarVitrine();

        if (usuarioAtual) {
          try {
            await set(ref(db, `Comercio/${usuarioAtual.uid}/logo`), logoData);
          } catch (err) {
            console.error('Erro ao salvar logo:', err);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

async function carregarLogo() {
  let logo = null;
  if (usuarioAtual) {
    try {
      const snap = await get(ref(db, `Comercio/${usuarioAtual.uid}/logo`));
      if (snap.exists()) logo = snap.val();
    } catch (e) {}
  }
  if (!logo) logo = localStorage.getItem(getChaveUsuario('logoComercio'));

  const previewBox = document.getElementById('logoPreviewBox');
  if (!previewBox) return;

  if (logo) {
    previewBox.style.backgroundImage = `url('${logo}')`;
    previewBox.innerHTML = '';
  } else {
    previewBox.style.backgroundImage = 'none';
    previewBox.innerHTML = '<span>Sem Logo</span>';
  }
}

const btnRemoverLogo = document.getElementById('btnRemoverLogo');
if (btnRemoverLogo) {
  btnRemoverLogo.addEventListener('click', async () => {
    localStorage.removeItem(getChaveUsuario('logoComercio'));
    carregarLogo();
    renderizarVitrine();

    if (usuarioAtual) {
      try {
        await set(ref(db, `Comercio/${usuarioAtual.uid}/logo`), null);
      } catch (err) {
        console.error('Erro ao remover logo:', err);
      }
    }
  });
}


const btnEscolherFoto = document.getElementById('btnEscolherFoto');
const fotoInput = document.getElementById('fotoInput');
if (btnEscolherFoto && fotoInput) {
  btnEscolherFoto.addEventListener('click', () => fotoInput.click());

  fotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async function(evt) {
        const fotos = JSON.parse(localStorage.getItem(getChaveUsuario('galeriaFotos')) || '[]');
        fotos.push(evt.target.result);
        localStorage.setItem(getChaveUsuario('galeriaFotos'), JSON.stringify(fotos));
        carregarGaleria();
        renderizarVitrine();

        if (usuarioAtual) {
          try {
            await set(ref(db, `Comercio/${usuarioAtual.uid}/galeria`), fotos);
          } catch (err) {
            console.error('Erro ao salvar galeria:', err);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

async function carregarGaleria() {
  const container = document.getElementById('galeriaPreview');
  if (!container) return;
  
  let fotos = null;
  if (usuarioAtual) {
    try {
      const snap = await get(ref(db, `Comercio/${usuarioAtual.uid}/galeria`));
      if (snap.exists()) fotos = snap.val();
    } catch (e) {}
  }
  if (!fotos) fotos = JSON.parse(localStorage.getItem(getChaveUsuario('galeriaFotos')) || '[]');

  container.innerHTML = '';
  fotos.forEach((src, index) => {
    const isCapa = index === 0;
    const item = document.createElement('div');
    item.className = `foto-item-card ${isCapa ? 'is-capa' : ''}`;
    item.innerHTML = `
      ${isCapa ? '<span class="badge-capa">CAPA</span>' : ''}
      <img src="${src}">
      <button class="btn-del-foto" data-index="${index}">×</button>
    `;
    container.appendChild(item);
  });

  container.querySelectorAll('.btn-del-foto').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.target.dataset.index;
      removerFoto(idx);
    });
  });
}

async function removerFoto(index) {
  let fotos = JSON.parse(localStorage.getItem(getChaveUsuario('galeriaFotos')) || '[]');
  fotos.splice(index, 1);
  localStorage.setItem(getChaveUsuario('galeriaFotos'), JSON.stringify(fotos));
  carregarGaleria();
  renderizarVitrine();

  if (usuarioAtual) {
    try {
      await set(ref(db, `Comercio/${usuarioAtual.uid}/galeria`), fotos);
    } catch (err) {
      console.error('Erro ao atualizar galeria:', err);
    }
  }
}


const btnSalvarHorarios = document.getElementById('btnSalvarHorarios');
if (btnSalvarHorarios) {
  btnSalvarHorarios.addEventListener('click', async () => {
    if (!usuarioAtual) return;

    const horarios = {
      segAfeInic: document.getElementById('segAfeInic').value,
      segAfeFim: document.getElementById('segAfeFim').value,
      sabInic: document.getElementById('sabInic').value,
      sabFim: document.getElementById('sabFim').value,
      domInic: document.getElementById('domInic').value,
      domFim: document.getElementById('domFim').value
    };

    localStorage.setItem(getChaveUsuario('horariosLojista'), JSON.stringify(horarios));

    try {
      await set(ref(db, `Comercio/${usuarioAtual.uid}/horarios`), horarios);
      alert('Horários salvos com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar horários:', err);
    }

    renderizarVitrine();
  });
}

async function carregarHorarios() {
  let h = null;

  if (usuarioAtual) {
    try {
      const snapshot = await get(ref(db, `Comercio/${usuarioAtual.uid}/horarios`));
      if (snapshot.exists()) h = snapshot.val();
    } catch (err) {}
  }

  if (!h) {
    const guardados = localStorage.getItem(getChaveUsuario('horariosLojista'));
    if (guardados) h = JSON.parse(guardados);
  }

  if (h) {
    if (h.segAfeInic) document.getElementById('segAfeInic').value = h.segAfeInic;
    if (h.segAfeFim) document.getElementById('segAfeFim').value = h.segAfeFim;
    if (h.sabInic) document.getElementById('sabInic').value = h.sabInic;
    if (h.sabFim) document.getElementById('sabFim').value = h.sabFim;
    if (h.domInic) document.getElementById('domInic').value = h.domInic;
    if (h.domFim) document.getElementById('domFim').value = h.domFim;
  }
}


function renderizarVitrine() {
  const dados = JSON.parse(localStorage.getItem(getChaveUsuario('dadosNegocio')) || '{}');
  const fotos = JSON.parse(localStorage.getItem(getChaveUsuario('galeriaFotos')) || '[]');
  const logo = localStorage.getItem(getChaveUsuario('logoComercio'));
  const horarios = JSON.parse(localStorage.getItem(getChaveUsuario('horariosLojista')) || '{}');

  document.getElementById('vitrineNome').innerText = dados.nome || 'Nome do Negócio';
  document.getElementById('vitrineCategoria').innerText = dados.categoria || 'Categoria';
  
  if (document.getElementById('vitrineBairro')) {
    document.getElementById('vitrineBairro').innerText = dados.bairro ? `📍 Bairro: ${dados.bairro}` : '📍 Bairro não informado';
  }

  const linkInsta = document.getElementById('linkInstagramVitrine');
  if (linkInsta) {
    if (dados.instagram) {
      const handleSemAt = dados.instagram.replace('@', '');
      linkInsta.innerText = `Instagram: ${dados.instagram}`;
      linkInsta.href = `https://instagram.com/${handleSemAt}`;
    } else {
      linkInsta.innerText = 'Instagram não informado';
      linkInsta.href = '#';
    }
  }

  if (document.getElementById('vitrineZapNum')) {
    document.getElementById('vitrineZapNum').innerText = dados.whatsapp || 'Não informado';
  }

  if (document.getElementById('btnWhatsappVitrine')) {
    const zapLimpo = dados.whatsapp ? dados.whatsapp.replace(/\D/g, '') : '';
    document.getElementById('btnWhatsappVitrine').href = zapLimpo ? `https://wa.me/55${zapLimpo}` : '#';
  }

  document.getElementById('vitrineDescricao').innerText = dados.descricao || 'Nenhuma descrição informada ainda.';

  const logoEl = document.getElementById('vitrineLogo');
  if (logo) {
    logoEl.style.backgroundImage = `url('${logo}')`;
    logoEl.innerHTML = '';
  } else {
    logoEl.style.backgroundImage = 'none';
    logoEl.innerHTML = '<span>🏬</span>';
  }

  const capaEl = document.getElementById('vitrineCapa');
  const avisoEl = document.getElementById('semFotoAviso');
  if (fotos.length > 0) {
    capaEl.style.backgroundImage = `url('${fotos[0]}')`;
    if (avisoEl) avisoEl.style.display = 'none';
  } else {
    capaEl.style.backgroundImage = 'none';
    if (avisoEl) avisoEl.style.display = 'block';
  }

  const galeriaProdEl = document.getElementById('vitrineGaleriaProdutos');
  if (fotos.length > 0) {
    galeriaProdEl.innerHTML = fotos.map((f, i) => `<img src="${f}" title="Foto ${i + 1}">`).join('');
  } else {
    galeriaProdEl.innerHTML = '<p class="sem-fotos-txt">Nenhuma foto enviada para exibir.</p>';
  }

  const modEl = document.getElementById('vitrineModalidades');
  if (dados.modalidades && dados.modalidades.length > 0) {
    modEl.innerHTML = dados.modalidades.map(m => `<span class="tag">🚀 ${m}</span>`).join('');
  } else {
    modEl.innerHTML = '<span class="sub-titulo">Nenhuma selecionada</span>';
  }

  const pagEl = document.getElementById('vitrinePagamentos');
  if (dados.pagamentos && dados.pagamentos.length > 0) {
    pagEl.innerHTML = dados.pagamentos.map(p => `<span class="tag">💳 ${p}</span>`).join('');
  } else {
    pagEl.innerHTML = '<span class="sub-titulo">Nenhuma selecionada</span>';
  }

  const horEl = document.getElementById('vitrineHorarios');
  let htmlHorarios = '';
  if (horarios.segAfeInic) htmlHorarios += `<li>• Seg-Sex: ${horarios.segAfeInic} às ${horarios.segAfeFim}</li>`;
  if (horarios.sabInic) htmlHorarios += `<li>• Sáb: ${horarios.sabInic} às ${horarios.sabFim}</li>`;
  if (horarios.domInic) htmlHorarios += `<li>• Dom/Fer: ${horarios.domInic} às ${horarios.domFim}</li>`;

  horEl.innerHTML = htmlHorarios || '<li>• Horários não definidos</li>';
}

// ==========================================
// PERFIL DO RESPONSÁVEL
// ==========================================
const selectTipoDoc = document.getElementById('selectTipoDoc');
if (selectTipoDoc) {
  selectTipoDoc.addEventListener('change', () => {
    const tipo = selectTipoDoc.value;
    const inputDoc = document.getElementById('inputDocUser');
    if (tipo === 'cpf') {
      inputDoc.placeholder = '000.000.000-00';
      inputDoc.maxLength = 14;
    } else {
      inputDoc.placeholder = '00.000.000/0001-00';
      inputDoc.maxLength = 18;
    }
  });
}

const formPerfil = document.getElementById('formPerfil');
if (formPerfil) {
  formPerfil.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!usuarioAtual) {
      alert('Sua sessão expirou ou você não está logado.');
      return;
    }

    const nome = document.getElementById('inputNomeUser').value;
    const email = document.getElementById('inputEmailUser').value;
    const tipoDoc = document.getElementById('selectTipoDoc').value;
    const doc = document.getElementById('inputDocUser').value;

    const perfil = { nome, email, tipoDoc, doc };
    localStorage.setItem(getChaveUsuario('perfilResponsavel'), JSON.stringify(perfil));

    try {
      await set(ref(db, `Comercio/${usuarioAtual.uid}/perfilResponsavel`), perfil);
      atualizarNomeLojistaTopo();
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      alert('Erro ao salvar perfil no Firebase: ' + err.message);
    }
  });
}

async function carregarPerfil() {
  let perfil = null;

  if (usuarioAtual) {
    try {
      const snapshot = await get(ref(db, `Comercio/${usuarioAtual.uid}/perfilResponsavel`));
      if (snapshot.exists()) {
        perfil = snapshot.val();
        localStorage.setItem(getChaveUsuario('perfilResponsavel'), JSON.stringify(perfil));
      }
    } catch (err) {
      console.warn('Erro ao carregar perfil do Firebase:', err);
    }
  }

  if (!perfil) {
    perfil = JSON.parse(localStorage.getItem(getChaveUsuario('perfilResponsavel')) || '{}');
  }

 
  if (document.getElementById('inputNomeUser')) {
    document.getElementById('inputNomeUser').value = perfil.nome || (usuarioAtual ? usuarioAtual.displayName || '' : '');
  }
  if (document.getElementById('inputEmailUser')) {
    document.getElementById('inputEmailUser').value = perfil.email || (usuarioAtual ? usuarioAtual.email || '' : '');
  }
  if (perfil.tipoDoc && document.getElementById('selectTipoDoc')) {
    document.getElementById('selectTipoDoc').value = perfil.tipoDoc;
  }
  if (document.getElementById('inputDocUser')) {
    document.getElementById('inputDocUser').value = perfil.doc || '';
  }
  
  atualizarNomeLojistaTopo();
}


document.querySelectorAll('.btn-reportar').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const id = e.target.dataset.reportId;
    document.getElementById('reportAvaliacaoId').value = id;
    document.getElementById('motivoReport').value = "";
    document.getElementById('detalhesReport').value = "";
    document.getElementById('modalReportar').classList.remove('hidden');
  });
});

const btnFecharModalReportar = document.getElementById('btnFecharModalReportar');
const btnCancelarReportar = document.getElementById('btnCancelarReportar');
if (btnFecharModalReportar) btnFecharModalReportar.addEventListener('click', fecharModal);
if (btnCancelarReportar) btnCancelarReportar.addEventListener('click', fecharModal);

function fecharModal() {
  document.getElementById('modalReportar').classList.add('hidden');
}

const btnEnviarDenuncia = document.getElementById('btnEnviarDenuncia');
if (btnEnviarDenuncia) {
  btnEnviarDenuncia.addEventListener('click', async () => {
    const id = document.getElementById('reportAvaliacaoId').value;
    const motivo = document.getElementById('motivoReport').value;
    const detalhes = document.getElementById('detalhesReport').value;

    if (!motivo) {
      alert('Por favor, selecione um motivo para a denúncia.');
      return;
    }

    const novaDenuncia = {
      avaliacaoId: id,
      motivo: motivo,
      detalhes: detalhes,
      data: new Date().toISOString()
    };

    if (usuarioAtual) {
      try {
        await set(ref(db, `Comercio/${usuarioAtual.uid}/denuncias/${id}`), novaDenuncia);
        alert('Denúncia enviada com sucesso!');
      } catch (err) {
        console.error('Erro ao enviar denúncia:', err);
      }
    }

    const reportadas = JSON.parse(localStorage.getItem(getChaveUsuario('avaliacoesReportadas')) || '[]');
    if (!reportadas.includes(String(id))) {
      reportadas.push(String(id));
      localStorage.setItem(getChaveUsuario('avaliacoesReportadas'), JSON.stringify(reportadas));
    }

    atualizarStatusReportados();
    fecharModal();
  });
}

function atualizarStatusReportados() {
  const reportadas = JSON.parse(localStorage.getItem(getChaveUsuario('avaliacoesReportadas')) || '[]');

  reportadas.forEach(id => {
    const container = document.getElementById(`area-reportar-${id}`);
    if (container) {
      container.innerHTML = `
        <span class="status-reportado">⏳ Já reportado. Aguarde análise em até 7 dias.</span>
      `;
    }
  });
}