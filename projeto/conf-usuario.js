import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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

onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (inputEmail) inputEmail.value = user.email || '';

    let nomeExibicao = user.displayName || user.email.split('@')[0];

    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `cadastro/${user.uid}`));

      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log("Dados carregados do Realtime Database:", data);

        if (data.nome || data.name) {
          nomeExibicao = data.nome || data.name;
        }

        const telefoneEncontrado = data.telefone || data.celular || data.cel || data.phone || '';
        if (inputTelefone) inputTelefone.value = telefoneEncontrado;
      } else {
        console.warn("Nenhum registo encontrado na nó 'cadastro' para este UID.");
      }
    } catch (error) {
      console.error("Erro ao procurar dados no Realtime Database:", error);
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