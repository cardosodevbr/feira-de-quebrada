import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get, child, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlLP8kRaLVsnqQ-BHnFa6_neoEklqWT9c",
  authDomain: "feira-da-quebrada.firebaseapp.com",
  databaseURL: "https://feira-da-quebrada-default-rtdb.firebaseio.com",
  projectId: "feira-da-quebrada",
  storageBucket: "feira-da-quebrada.firebasestorage.app",
  messagingSenderId: "109312191536",
  appId: "1:109312191536:web:a4d382be3c353d2199d1f5",
  measurementId: "G-7V93SNZJ2D"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const nomeSaudacao = document.getElementById('nomeSaudacao');
const inputNome = document.getElementById('nomeCompleto');
const inputTelefone = document.getElementById('telefoneContato');
const inputEmail = document.getElementById('emailContato');
const formPerfil = document.getElementById('formPerfil');
const btnSalvar = document.getElementById('btnSalvar');

const formSenha = document.getElementById('formSenha');
const inputSenhaAtual = document.getElementById('senhaAtual');
const inputNovaSenha = document.getElementById('novaSenha');
const inputConfirmaSenha = document.getElementById('confirmaSenha');
const btnSalvarSenha = document.getElementById('btnSalvarSenha');

const btnTabPerfil = document.getElementById('btnTabPerfil');
const btnTabSenha = document.getElementById('btnTabSenha');
const btnTabFavoritos = document.getElementById('btnTabFavoritos');
const btnSairConta = document.getElementById('btnSairConta');

const secaoPerfil = document.getElementById('secaoPerfil');
const secaoSenha = document.getElementById('secaoSenha');
const secaoFavoritos = document.getElementById('secaoFavoritos');
const listaFavoritos = document.getElementById('listaFavoritos');

if (btnTabPerfil && btnTabSenha && btnTabFavoritos) {
  btnTabPerfil.addEventListener('click', () => {
    btnTabPerfil.classList.add('active');
    btnTabSenha.classList.remove('active');
    btnTabFavoritos.classList.remove('active');
    secaoPerfil.classList.remove('hidden');
    secaoSenha.classList.add('hidden');
    secaoFavoritos.classList.add('hidden');
  });

  btnTabSenha.addEventListener('click', () => {
    btnTabSenha.classList.add('active');
    btnTabPerfil.classList.remove('active');
    btnTabFavoritos.classList.remove('active');
    secaoSenha.classList.remove('hidden');
    secaoPerfil.classList.add('hidden');
    secaoFavoritos.classList.add('hidden');
  });

  btnTabFavoritos.addEventListener('click', () => {
    btnTabFavoritos.classList.add('active');
    btnTabPerfil.classList.remove('active');
    btnTabSenha.classList.remove('active');
    secaoFavoritos.classList.remove('hidden');
    secaoPerfil.classList.add('hidden');
    secaoSenha.classList.add('hidden');
  });
}

// Sair da Conta
if (btnSairConta) {
  btnSairConta.addEventListener('click', async () => {
    if (confirm("Deseja realmente sair da conta?")) {
      try {
        await signOut(auth);
        window.location.href = 'inicio.html';
      } catch (error) {
        console.error("Erro ao terminar sessão:", error);
        alert("Erro ao sair da conta: " + error.message);
      }
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (inputEmail) inputEmail.value = user.email || '';

    let nomeExibicao = user.displayName || user.email.split('@')[0];

    try {
      const dbRef = ref(db);
      
      const snapshot = await child(dbRef, `cadastro/${user.uid}`);
      const snapVal = await get(snapshot);

      if (snapVal.exists()) {
        const data = snapVal.val();
        if (data.nome || data.name) {
          nomeExibicao = data.nome || data.name;
        }
        const telefoneEncontrado = data.telefone || data.celular || data.cel || data.phone || '';
        if (inputTelefone) inputTelefone.value = telefoneEncontrado;
      }

      const favSnapshot = await child(dbRef, `favoritos/${user.uid}`);
      const favVal = await get(favSnapshot);

      if (favVal.exists()) {
        const favoritosObj = favVal.val();
        listaFavoritos.innerHTML = '';

        for (const [comercioId, comercioData] of Object.entries(favoritosObj)) {
          const card = document.createElement('div');
          card.className = 'favorito-card';
          card.innerHTML = `
            <div class="favorito-info">
              <h3>${comercioData.nome || 'Comércio Local'}</h3>
              <p>${comercioData.categoria || 'Serviços'}</p>
            </div>
            <a href="detalhes.html?id=${comercioId}" class="btn-ver-comercio">Ver Comércio</a>
          `;
          listaFavoritos.appendChild(card);
        }
      } else {
        listaFavoritos.innerHTML = `<p class="sem-favoritos">Ainda não tens nenhum comércio favorito guardado.</p>`;
      }

    } catch (error) {
      console.error("Erro ao carregar dados do Firebase:", error);
    }

    if (inputNome) inputNome.value = nomeExibicao;
    if (nomeSaudacao) {
      const primeiroNome = nomeExibicao.trim().split(' ')[0];
      nomeSaudacao.textContent = primeiroNome;
    }

  } else {
    window.location.href = 'inicio.html';
  }
});

// Atualizar Dados do Perfil
if (formPerfil) {
  formPerfil.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    btnSalvar.disabled = true;
    btnSalvar.textContent = "Salvando...";

    try {
      const userRef = ref(db, `cadastro/${user.uid}`);
      const dadosParaAtualizar = {
        nome: inputNome.value,
        telefone: inputTelefone.value,
        email: user.email,
        atualizadoEm: new Date().toISOString()
      };

      await update(userRef, dadosParaAtualizar);

      const primeiroNome = inputNome.value.trim().split(' ')[0];
      if (nomeSaudacao) nomeSaudacao.textContent = primeiroNome;

      alert("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      alert("Erro ao salvar alterações: " + error.message);
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = "Atualizar Dados do Perfil";
    }
  });
}

// Alterar Senha 
if (formSenha) {
  formSenha.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !user.email) return;

    const senhaAtual = inputSenhaAtual.value;
    const novaSenha = inputNovaSenha.value;
    const confirmaSenha = inputConfirmaSenha.value;

    if (novaSenha !== confirmaSenha) {
      alert("As novas senhas não coincidem!");
      return;
    }

    if (novaSenha.length < 6) {
      alert("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    btnSalvarSenha.disabled = true;
    btnSalvarSenha.textContent = "Salvando...";

    try {
      const credential = EmailAuthProvider.credential(user.email, senhaAtual);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, novaSenha);

      alert("Senha alterada com sucesso!");
      formSenha.reset();
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        alert("A senha atual está incorreta.");
      } else {
        alert("Erro ao alterar senha: " + error.message);
      }
    } finally {
      btnSalvarSenha.disabled = false;
      btnSalvarSenha.textContent = "Atualizar Senha";
    }
  });
}