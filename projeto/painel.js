import { db, auth } from "./firebase-config.js";
import { ref, set, get, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { onAuthStateChanged, signOut, deleteUser } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let usuarioAtual = null;

// ==========================================
// FUNÇÕES DE SEGURANÇA E SANITIZAÇÃO
// ==========================================
function sanitizar(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .trim();
}

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
// MINI-MAPA INTERATIVO NO PAINEL
// ==========================================
let miniMapa = null;
let miniMarker = null;

function inicializarMiniMapa(latInicial = -23.5505, lngInicial = -46.6333) {
  const el = document.getElementById('miniMapaSeletor');
  if (!el || typeof L === 'undefined') return;

  if (!miniMapa) {
    miniMapa = L.map('miniMapaSeletor').setView([latInicial, lngInicial], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(miniMapa);

    miniMarker = L.marker([latInicial, lngInicial], { draggable: true }).addTo(miniMapa);

    miniMarker.on('dragend', function (e) {
      const pos = e.target.getLatLng();
      setCoordenadasManuais(pos.lat, pos.lng);
    });

    miniMapa.on('click', function (e) {
      miniMarker.setLatLng(e.latlng);
      setCoordenadasManuais(e.latlng.lat, e.latlng.lng);
    });
  } else {
    miniMapa.setView([latInicial, lngInicial], 14);
    miniMarker.setLatLng([latInicial, lngInicial]);
  }
}

function setCoordenadasManuais(lat, lng) {
  const inputLat = document.getElementById('inputLatManual');
  const inputLng = document.getElementById('inputLngManual');
  if (inputLat) inputLat.value = lat;
  if (inputLng) inputLng.value = lng;
}

// ==========================================
// BOTÃO EXPANSÍVEL DO MINI-MAPA MANUAL
// ==========================================
const btnToggleMapaManual = document.getElementById('btnToggleMapaManual');
const containerMiniMapa = document.getElementById('containerMiniMapa');
const setaMapa = document.getElementById('setaMapa');

if (btnToggleMapaManual && containerMiniMapa) {
  btnToggleMapaManual.addEventListener('click', () => {
    const estaOculto = containerMiniMapa.classList.contains('hidden');

    if (estaOculto) {
      containerMiniMapa.classList.remove('hidden');
      if (setaMapa) setaMapa.innerText = '▲';
      
      setTimeout(() => {
        if (miniMapa) {
          miniMapa.invalidateSize();
        } else {
          inicializarMiniMapa();
        }
      }, 200);
    } else {
      containerMiniMapa.classList.add('hidden');
      if (setaMapa) setaMapa.innerText = '▼';
    }
  });
}

// ==========================================
// AUTENTICAÇÃO E CARREGAMENTO
// ==========================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    usuarioAtual = user;
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
    window.location.href = 'login.html';
  }
});

function atualizarNomeLojistaTopo(nomeNegocio = null) {
  const elem = document.getElementById('nomeLojista');
  if (!elem) return;

  if (nomeNegocio && nomeNegocio.trim() !== '') {
    elem.innerText = sanitizar(nomeNegocio);
    return;
  }

  const perfilSalvo = JSON.parse(localStorage.getItem(getChaveUsuario('perfilResponsavel')) || '{}');
  if (perfilSalvo.nome) {
    elem.innerText = sanitizar(perfilSalvo.nome);
  } else if (usuarioAtual && usuarioAtual.displayName) {
    elem.innerText = sanitizar(usuarioAtual.displayName);
  } else if (usuarioAtual && usuarioAtual.email) {
    elem.innerText = sanitizar(usuarioAtual.email.split('@')[0]);
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
        alert("Erro ao encerrar sessão.");
      }
    }
  });
}

// ==========================================
// GERENCIAR STATUS DA CONTA (COM PRAZO DE 24H) E EXCLUSÃO
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
      btn.innerText = "Desativar Conta (até 24h)";
      btn.className = "btn-warning";
    } else {
      lbl.innerText = "Desativação Pendente / Desativado";
      lbl.className = "status-desativado";
      btn.innerText = "Ativar Conta Novamente";
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
    const acaoTexto = novoStatus ? "reativar a sua conta" : "solicitar a desativação da sua conta (será concluída em até 24 horas)";

    if (confirm(`Tem certeza que deseja ${acaoTexto}?`)) {
      contaAtiva = novoStatus;
      atualizarUIStatusConta();

      try {
        await set(ref(db, `Comercio/${usuarioAtual.uid}/statusConta`), {
          ativa: contaAtiva,
          atualizadoEm: new Date().toISOString(),
          prazoProcessamento: novoStatus ? null : "24 horas"
        });
        
        if (novoStatus) {
          alert("Conta reativada com sucesso!");
        } else {
          alert("Solicitação registrada com sucesso! A sua conta será totalmente desativada em até 24 horas.");
        }
      } catch (err) {
        alert("Erro ao alterar o status da conta no banco de dados.");
      }
    }
  });
}

const btnExcluirConta = document.getElementById('btnExcluirConta');
if (btnExcluirConta) {
  btnExcluirConta.addEventListener('click', async () => {
    if (!usuarioAtual) return;

    if (confirm("⚠️ ATENÇÃO: Esta ação é irreversível!\n\nDeseja realmente excluir sua conta por completo?")) {
      try {
        const uid = usuarioAtual.uid;
        await remove(ref(db, `Comercio/${uid}`));
        limparDadosLocais();
        await deleteUser(usuarioAtual);
        alert("Sua conta foi excluída com sucesso.");
        window.location.href = 'inicio.html';
      } catch (err) {
        if (err.code === 'auth/requires-recent-login') {
          alert("Por segurança, saia e faça login novamente antes de excluir sua conta.");
        } else {
          alert("Erro ao excluir conta.");
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

    if (btn.dataset.aba === 'negocio') {
      setTimeout(() => {
        if (miniMapa) miniMapa.invalidateSize();
      }, 300);
    }

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

    if (btn.dataset.sub === 'dados') {
      setTimeout(() => {
        if (miniMapa) miniMapa.invalidateSize();
      }, 300);
    }
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
    } catch (e) {}
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
    } catch (err) {}
  }
  carregarEstatisticas();
}

async function registrarCliqueWhatsApp() {
  let clicks = parseInt(localStorage.getItem(getChaveUsuario('metrica_cliques_zap')) || '0') + 1;
  localStorage.setItem(getChaveUsuario('metrica_cliques_zap'), clicks);

  if (usuarioAtual) {
    try {
      await set(ref(db, `Comercio/${usuarioAtual.uid}/metricas/cliquesZap`), clicks);
    } catch (err) {}
  }
  carregarEstatisticas();
}

const btnWhatsappVitrine = document.getElementById('btnWhatsappVitrine');
if (btnWhatsappVitrine) {
  btnWhatsappVitrine.addEventListener('click', registrarCliqueWhatsApp);
}

// ==========================================
// FUNÇÃO AUXILIAR DE BUSCA DE CEP (BrasilAPI + ViaCEP Fallback)
// ==========================================
async function consultarCepResiliente(cepLimpo) {
  let dadosCep = null;

  try {
    const respBrasil = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
    if (respBrasil.ok) {
      const jsonBrasil = await respBrasil.json();
      if (!jsonBrasil.errors) {
        dadosCep = {
          cep: jsonBrasil.cep,
          logradouro: jsonBrasil.street,
          bairro: jsonBrasil.neighborhood,
          localidade: jsonBrasil.city,
          uf: jsonBrasil.state
        };
      }
    }
  } catch (err) {
    console.warn("BrasilAPI instável, alternando para ViaCEP...", err);
  }

  if (!dadosCep) {
    try {
      const respVia = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const jsonVia = await respVia.json();
      if (!jsonVia.erro) {
        dadosCep = {
          cep: jsonVia.cep,
          logradouro: jsonVia.logradouro,
          bairro: jsonVia.bairro,
          localidade: jsonVia.localidade,
          uf: jsonVia.uf
        };
      }
    } catch (err) {
      console.warn("ViaCEP também falhou.", err);
    }
  }

  return dadosCep;
}

// ==========================================
// BUSCA AUTOMÁTICA DE CEP AO DIGITAR
// ==========================================
const inputCep = document.getElementById('inputCepComercio');
if (inputCep) {
  inputCep.addEventListener('blur', async () => {
    const cepLimpo = inputCep.value.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      const dados = await consultarCepResiliente(cepLimpo);

      if (!dados) {
        alert("CEP não encontrado.");
        return;
      }

      if (dados.uf !== 'SP') {
        alert(`O cadastro é permitido apenas para o estado de SP. Este CEP pertence a ${dados.uf}.`);
        return;
      }

      if (dados.bairro && document.getElementById('inputBairroComercio')) {
        document.getElementById('inputBairroComercio').value = dados.bairro;
      }

      try {
        const logradouro = dados.logradouro || '';
        const bairro = dados.bairro || '';
        const cidade = dados.localidade || 'São Paulo';
        const query = `${logradouro}, ${bairro}, ${cidade}, SP, Brasil`;
        const spViewbox = "&viewbox=-48.2,-25.3,-44.1,-19.7&bounded=1";

        const respGeo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}${spViewbox}&countrycodes=br&limit=1`);
        const dadosGeo = await respGeo.json();

        if (dadosGeo && dadosGeo.length > 0) {
          const lat = parseFloat(dadosGeo[0].lat);
          const lng = parseFloat(dadosGeo[0].lon);
          inicializarMiniMapa(lat, lng);
          setCoordenadasManuais(lat, lng);
        }
      } catch (err) {
        console.warn("Erro ao buscar coordenadas automáticas:", err);
      }
    }
  });
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

    const cepEl = document.getElementById('inputCepComercio');
    const cepInput = cepEl ? sanitizar(cepEl.value.replace(/\D/g, '')) : '';
    const bairroInput = sanitizar(document.getElementById('inputBairroComercio').value);

    let lat = parseFloat(document.getElementById('inputLatManual').value) || null;
    let lng = parseFloat(document.getElementById('inputLngManual').value) || null;

    if (cepInput.length !== 8) {
      alert("Por favor, digite um CEP válido com 8 dígitos.");
      return;
    }

    const dadosCep = await consultarCepResiliente(cepInput);

    if (!dadosCep) {
      alert("CEP não encontrado. Verifique o número digitado.");
      return;
    }

    if (dadosCep.uf !== 'SP') {
      alert(`O cadastro é permitido apenas para o estado de São Paulo (SP). O CEP digitado pertence ao estado de ${dadosCep.uf}.`);
      return;
    }

    if (!lat || !lng) {
      try {
        const logradouro = dadosCep.logradouro || '';
        const bairroOficial = dadosCep.bairro || bairroInput;
        const cidadeOficial = 'São Paulo';
        const spViewbox = "&viewbox=-46.82,-23.35,-46.35,-24.00&bounded=1";

        if (logradouro) {
          const queryRua = `${logradouro}, ${bairroOficial}, ${cidadeOficial}, SP, Brasil`;
          const respRua = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryRua)}${spViewbox}&countrycodes=br&limit=1`);
          const dadosRua = await respRua.json();

          if (dadosRua && dadosRua.length > 0) {
            lat = parseFloat(dadosRua[0].lat);
            lng = parseFloat(dadosRua[0].lon);
          }
        }

        if ((!lat || !lng) && bairroOficial) {
          const queryBairro = `${bairroOficial}, ${cidadeOficial}, SP, Brasil`;
          const respBairro = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryBairro)}${spViewbox}&countrycodes=br&limit=1`);
          const dadosBairro = await respBairro.json();

          if (dadosBairro && dadosBairro.length > 0) {
            lat = parseFloat(dadosBairro[0].lat);
            lng = parseFloat(dadosBairro[0].lon);
          }
        }
      } catch (err) {
        console.warn("Erro ao buscar geolocalização:", err);
      }
    }

    if (!lat || !lng || lat > -20 || lat < -25 || lng < -48 || lng > -44) {
      lat = -23.5505;
      lng = -46.6333;
    }

    const offsetLat = (Math.random() - 0.5) * 0.0015;
    const offsetLng = (Math.random() - 0.5) * 0.0015;
    lat = parseFloat((lat + offsetLat).toFixed(6));
    lng = parseFloat((lng + offsetLng).toFixed(6));

    const modalidades = Array.from(document.querySelectorAll('input[name="modalidade"]:checked')).map(cb => sanitizar(cb.value));
    const pagamentos = Array.from(document.querySelectorAll('input[name="pagamento"]:checked')).map(cb => sanitizar(cb.value));

    let instagramInput = sanitizar(document.getElementById('inputInstagramComercio').value.trim());
    if (instagramInput && !instagramInput.startsWith('@')) {
      instagramInput = `@${instagramInput}`;
    }

    const dados = {
      nome: sanitizar(document.getElementById('inputNomeComercio').value),
      cep: cepInput,
      bairro: bairroInput,
      whatsapp: sanitizar(document.getElementById('inputWhatsappComercio').value),
      instagram: instagramInput,
      categoria: sanitizar(document.getElementById('selectCategoria').value),
      descricao: sanitizar(document.getElementById('textDescricao').value),
      modalidades: modalidades,
      pagamentos: pagamentos,
      lat: lat,
      lng: lng,
      atualizadoEm: new Date().toISOString()
    };
    
    localStorage.setItem(getChaveUsuario('dadosNegocio'), JSON.stringify(dados));
    atualizarNomeLojistaTopo(dados.nome);

    try {
      await set(ref(db, `Comercio/${usuarioAtual.uid}/dadosNegocio`), dados);
      alert('Dados do comércio e localização salvos com sucesso!');
    } catch (err) {
      alert('Erro ao salvar no banco online.');
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
    } catch (err) {}
  }

  if (!dados) {
    const salvos = localStorage.getItem(getChaveUsuario('dadosNegocio'));
    if (salvos) dados = JSON.parse(salvos);
  }

  if (dados) {
    if (document.getElementById('inputNomeComercio')) document.getElementById('inputNomeComercio').value = dados.nome || '';
    if (document.getElementById('inputCepComercio')) document.getElementById('inputCepComercio').value = dados.cep || '';
    if (document.getElementById('inputBairroComercio')) document.getElementById('inputBairroComercio').value = dados.bairro || '';
    if (document.getElementById('inputWhatsappComercio')) document.getElementById('inputWhatsappComercio').value = dados.whatsapp || '';
    if (document.getElementById('inputInstagramComercio')) document.getElementById('inputInstagramComercio').value = dados.instagram || '';
    if (document.getElementById('selectCategoria')) document.getElementById('selectCategoria').value = dados.categoria || '';
    if (document.getElementById('textDescricao')) document.getElementById('textDescricao').value = dados.descricao || '';
    
    if (dados.lat && dados.lng) {
      setCoordenadasManuais(dados.lat, dados.lng);
      inicializarMiniMapa(dados.lat, dados.lng);
    } else {
      inicializarMiniMapa();
    }

    if (dados.nome) atualizarNomeLojistaTopo(dados.nome);

    document.querySelectorAll('input[name="modalidade"]').forEach(cb => {
      cb.checked = dados.modalidades ? dados.modalidades.includes(cb.value) : false;
    });

    document.querySelectorAll('input[name="pagamento"]').forEach(cb => {
      cb.checked = dados.pagamentos ? dados.pagamentos.includes(cb.value) : false;
    });
  } else {
    inicializarMiniMapa();
  }
}

// ==========================================
// UPLOAD DE LOGO
// ==========================================
const btnUploadLogo = document.getElementById('btnUploadLogo');
const logoInput = document.getElementById('logoInput');
if (btnUploadLogo && logoInput) {
  btnUploadLogo.addEventListener('click', () => logoInput.click());
  
  logoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Por favor, selecione apenas arquivos de imagem.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("A imagem da logo deve ter no máximo 10MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = async function(evt) {
        const logoData = evt.target.result;
        localStorage.setItem(getChaveUsuario('logoComercio'), logoData);
        carregarLogo();
        renderizarVitrine();

        if (usuarioAtual) {
          try {
            await set(ref(db, `Comercio/${usuarioAtual.uid}/logo`), logoData);
          } catch (err) {}
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
      } catch (err) {}
    }
  });
}

// ==========================================
// UPLOAD DE GALERIA
// ==========================================
const btnEscolherFoto = document.getElementById('btnEscolherFoto');
const fotoInput = document.getElementById('fotoInput');
if (btnEscolherFoto && fotoInput) {
  btnEscolherFoto.addEventListener('click', () => fotoInput.click());

  fotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Por favor, selecione apenas arquivos de imagem.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("A foto da galeria deve ter no máximo 10MB.");
        return;
      }

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
          } catch (err) {}
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
    } catch (err) {}
  }
}

const btnSalvarHorarios = document.getElementById('btnSalvarHorarios');
if (btnSalvarHorarios) {
  btnSalvarHorarios.addEventListener('click', async () => {
    if (!usuarioAtual) return;

    const horarios = {
      segAfeInic: sanitizar(document.getElementById('segAfeInic').value),
      segAfeFim: sanitizar(document.getElementById('segAfeFim').value),
      sabInic: sanitizar(document.getElementById('sabInic').value),
      sabFim: sanitizar(document.getElementById('sabFim').value),
      domInic: sanitizar(document.getElementById('domInic').value),
      domFim: sanitizar(document.getElementById('domFim').value)
    };

    localStorage.setItem(getChaveUsuario('horariosLojista'), JSON.stringify(horarios));

    try {
      await set(ref(db, `Comercio/${usuarioAtual.uid}/horarios`), horarios);
      alert('Horários salvos com sucesso!');
    } catch (err) {}

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

  document.getElementById('vitrineNome').innerText = sanitizar(dados.nome || 'Nome do Negócio');
  document.getElementById('vitrineCategoria').innerText = sanitizar(dados.categoria || 'Categoria');
  
  if (document.getElementById('vitrineBairro')) {
    document.getElementById('vitrineBairro').innerText = dados.bairro ? `📍 Bairro: ${sanitizar(dados.bairro)}` : '📍 Bairro não informado';
  }

  const linkInsta = document.getElementById('linkInstagramVitrine');
  if (linkInsta) {
    if (dados.instagram) {
      const handleSemAt = sanitizar(dados.instagram.replace('@', ''));
      linkInsta.innerText = `Instagram: ${dados.instagram}`;
      linkInsta.href = `https://instagram.com/${handleSemAt}`;
    } else {
      linkInsta.innerText = 'Instagram não informado';
      linkInsta.href = '#';
    }
  }

  if (document.getElementById('vitrineZapNum')) {
    document.getElementById('vitrineZapNum').innerText = sanitizar(dados.whatsapp || 'Não informado');
  }

  if (document.getElementById('btnWhatsappVitrine')) {
    const zapLimpo = dados.whatsapp ? dados.whatsapp.replace(/\D/g, '') : '';
    document.getElementById('btnWhatsappVitrine').href = zapLimpo ? `https://wa.me/55${zapLimpo}` : '#';
  }

  document.getElementById('vitrineDescricao').innerText = sanitizar(dados.descricao || 'Nenhuma descrição informada ainda.');

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
    modEl.innerHTML = dados.modalidades.map(m => `<span class="tag">🚀 ${sanitizar(m)}</span>`).join('');
  } else {
    modEl.innerHTML = '<span class="sub-titulo">Nenhuma selecionada</span>';
  }

  const pagEl = document.getElementById('vitrinePagamentos');
  if (dados.pagamentos && dados.pagamentos.length > 0) {
    pagEl.innerHTML = dados.pagamentos.map(p => `<span class="tag">💳 ${sanitizar(p)}</span>`).join('');
  } else {
    pagEl.innerHTML = '<span class="sub-titulo">Nenhuma selecionada</span>';
  }

  const horEl = document.getElementById('vitrineHorarios');
  let htmlHorarios = '';
  if (horarios.segAfeInic) htmlHorarios += `<li>• Seg-Sex: ${sanitizar(horarios.segAfeInic)} às ${sanitizar(horarios.segAfeFim)}</li>`;
  if (horarios.sabInic) htmlHorarios += `<li>• Sáb: ${sanitizar(horarios.sabInic)} às ${sanitizar(horarios.sabFim)}</li>`;
  if (horarios.domInic) htmlHorarios += `<li>• Dom/Fer: ${sanitizar(horarios.domInic)} às ${sanitizar(horarios.domFim)}</li>`;

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

    const nome = sanitizar(document.getElementById('inputNomeUser').value);
    const email = document.getElementById('inputEmailUser').value.trim();
    const tipoDoc = sanitizar(document.getElementById('selectTipoDoc').value);
    const doc = sanitizar(document.getElementById('inputDocUser').value);

    const perfil = { nome, email, tipoDoc, doc };
    localStorage.setItem(getChaveUsuario('perfilResponsavel'), JSON.stringify(perfil));

    try {
      await set(ref(db, `Comercio/${usuarioAtual.uid}/perfilResponsavel`), perfil);
      atualizarNomeLojistaTopo();
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      alert('Erro ao salvar perfil.');
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
    } catch (err) {}
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
    const motivo = sanitizar(document.getElementById('motivoReport').value);
    const detalhes = sanitizar(document.getElementById('detalhesReport').value);

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
      } catch (err) {}
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