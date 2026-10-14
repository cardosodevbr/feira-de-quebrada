import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let botaoCliente = document.getElementById("btn-cliente");
let botaoEmpreendedor = document.getElementById("btn-empreendedor");

let formCliente = document.querySelector(".form-cliente");
let formEmpreendedor = document.querySelector(".form-empreendedor");

let imagemCadastro = document.getElementById("imagem-cadastro");

function sanitizarEntrada(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .trim();
}

function validarEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
}

botaoEmpreendedor.addEventListener("click", function() {
    formCliente.style.display = "none";
    formEmpreendedor.style.display = "block";

    botaoCliente.classList.remove("ativo");
    botaoEmpreendedor.classList.add("ativo");

    imagemCadastro.src = "imagens/empreendedor.jpg";
});

botaoCliente.addEventListener("click", function() {
    formCliente.style.display = "block";
    formEmpreendedor.style.display = "none";

    botaoCliente.classList.add("ativo");
    botaoEmpreendedor.classList.remove("ativo");

    imagemCadastro.src = "imagens/trancista.png";
});

async function cadastrarUsuario(nome, email, senha, palavraSeguranca, tipoPerfil) {
    const nomeLimpo = sanitizarEntrada(nome);
    const emailLimpo = email.trim().toLowerCase();
    const palavraLimpa = sanitizarEntrada(palavraSeguranca);

    if (!validarEmail(emailLimpo)) {
        alert("Por favor, informe um endereço de e-mail válido.");
        return;
    }

    if (senha.length < 8) {
        alert("Por segurança, sua senha precisa ter no mínimo 8 caracteres.");
        return;
    }

    if (palavraLimpa.length < 8) {
        alert("A palavra de segurança precisa ter no mínimo 8 caracteres.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, emailLimpo, senha);
        const user = userCredential.user;

        if (tipoPerfil === "cliente") {
            await set(ref(db, 'cadastro/' + user.uid), {
                id: user.uid,
                nome_responsavel: nomeLimpo,
                email: emailLimpo,
                tipo: "cliente",
                palavra_chave: palavraLimpa,
                criado_em: new Date().toISOString()
            });

            alert("Conta de cliente criada com sucesso!");
            window.location.href = "inicio.html";
        } 
        else if (tipoPerfil === "empreendedor") {
            await set(ref(db, 'cadastro/' + user.uid), {
                id: user.uid,
                nome_responsavel: nomeLimpo,
                email: emailLimpo,
                tipo: "empreendedor",
                palavra_chave: palavraLimpa,
                criado_em: new Date().toISOString()
            });

            await set(ref(db, 'Comercio/' + user.uid), {
                id: user.uid,
                nomeEmpreendedor: nomeLimpo,
                "e-mail": emailLimpo,
                palavra_chave: palavraLimpa,
                nomeComercio: "",
                descricao: "",
                categoria: "",
                bairro: "",
                endereco: "",
                horarioFuncionamento: "",
                formaPagamento: "",
                whatsapp: "",
                instagram: "",
                fotoUrl: "",
                ativo: false,
                atualizadoEm: new Date().toISOString()
            });

            alert("Conta de empreendedor criada! Complete o cadastro do seu comércio no painel.");
            window.location.href = "painel.html";
        }

    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            alert("Este e-mail já está cadastrado em nosso sistema!");
        } else if (error.code === 'auth/weak-password') {
            alert("A senha precisa ter no mínimo 8 caracteres.");
        } else {
            alert("Erro ao realizar cadastro: As informações enviadas são inválidas.");
        }
    }
}

formCliente.addEventListener("submit", function(e) {
    e.preventDefault();
    const nome = document.getElementById("name-cliente").value;
    const email = document.getElementById("email-cliente").value;
    const senha = document.getElementById("password-cliente").value;
    const palavra = document.getElementById("palavra-cliente").value;

    cadastrarUsuario(nome, email, senha, palavra, "cliente");
});

formEmpreendedor.addEventListener("submit", function(e) {
    e.preventDefault();
    const nome = document.getElementById("name-emp").value;
    const email = document.getElementById("email-emp").value;
    const senha = document.getElementById("password-emp").value;
    const palavra = document.getElementById("palavra-emp").value;

    cadastrarUsuario(nome, email, senha, palavra, "empreendedor");
});