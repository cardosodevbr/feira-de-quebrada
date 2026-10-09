import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const botaoCliente = document.getElementById("btn-cliente");
const botaoEmpreendedor = document.getElementById("btn-empreendedor");
const imagemCadastro = document.getElementById("imagem-cadastro");
const labelNome = document.getElementById("label-nome");
const camposEmpreendedor = document.getElementById("campos-empreendedor");

const inputNomeNegocio = document.getElementById("nome-negocio");
const inputDocumento = document.getElementById("documento");

let tipoContaSelecionado = "Cliente";

// Alternar para Empreendedor
botaoEmpreendedor.addEventListener("click", () => {
    tipoContaSelecionado = "Empreendedor";
    
    botaoCliente.classList.remove("ativo");
    botaoEmpreendedor.classList.add("ativo");
    
    labelNome.textContent = "Nome do Titular:";
    imagemCadastro.src = "../imagens/capa2.jpg";
    
    // Revela os campos e torna-os obrigatórios
    camposEmpreendedor.classList.remove("escondido");
    inputNomeNegocio.required = true;
    inputDocumento.required = true;
});

// Alternar para Cliente
botaoCliente.addEventListener("click", () => {
    tipoContaSelecionado = "Cliente";
    
    botaoCliente.classList.add("ativo");
    botaoEmpreendedor.classList.remove("ativo");
    
    labelNome.textContent = "Nome Completo:";
    imagemCadastro.src = "../imagens/trancista.jpg";
    
    // Oculta os campos e remove a obrigatoriedade
    camposEmpreendedor.classList.add("escondido");
    inputNomeNegocio.required = false;
    inputDocumento.required = false;
});

// Envio e Processamento do Cadastro
const formCadastro = document.getElementById("form-cadastro");

formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("password").value;
    const palavraSeguranca = document.getElementById("palavra-seguranca").value.trim();

    try {
        // 1. Cria a conta no Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        // 2. Prepara a estrutura do documento do utilizador
        const dadosUsuario = {
            uid: user.uid,
            nome: nome,
            email: email,
            tipoConta: tipoContaSelecionado,
            palavraSeguranca: palavraSeguranca,
            dataCadastro: new Date().toISOString()
        };

        // 3. Adiciona os campos específicos de Empreendedor se aplicável
        if (tipoContaSelecionado === "Empreendedor") {
            dadosUsuario.nomeEmpreendimento = inputNomeNegocio.value.trim();
            dadosUsuario.documento = inputDocumento.value.trim();
        }

        // 4. Grava na coleção 'usuarios' do Firestore
        await setDoc(doc(db, "usuarios", user.uid), dadosUsuario);

        alert("Conta criada com sucesso!");

        // 5. Encaminhamento baseado no tipo de perfil
        if (tipoContaSelecionado === "Empreendedor") {
            window.location.href = "painel.html";
        } else {
            window.location.href = "../index.html";
        }

    } catch (error) {
        console.error("Erro no cadastro:", error);
        if (error.code === "auth/email-already-in-use") {
            alert("Este e-mail já está associado a uma conta existente.");
        } else if (error.code === "auth/weak-password") {
            alert("A senha deve ter pelo menos 6 caracteres.");
        } else {
            alert("Ocorreu um erro ao registar a conta. Verifique os dados inseridos.");
        }
    }
});