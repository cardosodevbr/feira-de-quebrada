
let parametros = new URLSearchParams(window.location.search);
let categoria = parametros.get("categoria");

let seletorCategoria = document.getElementById("categoria");
let campoBusca = document.getElementById("busca");
let campoLocalizacao = document.getElementById("localizacao");
let resultado = document.getElementById("resultado");

let cards = document.querySelectorAll(".card-resultados");
let botaoFiltro = document.querySelector(".aplica-filtro");

if (categoria && Array.from(seletorCategoria.options).some(function(opcao) {
    return opcao.value === categoria;
})) {
    seletorCategoria.value = categoria;
}

function aplicarFiltros() {

    let categoriaSelecionada = seletorCategoria.value;
    let textoBusca = campoBusca.value.toLowerCase().trim();
    let textoLocalizacao = campoLocalizacao.value.toLowerCase().trim();

    let quantidadeResultados = 0;

    cards.forEach(function(card) {

        let nomeEstabelecimento = card.querySelector("h3").textContent.toLowerCase();
        let bairro = card.querySelector(".bairro").textContent.toLowerCase();

        let correspondeCategoria =
            categoriaSelecionada === "todas" ||
            card.dataset.categoria === categoriaSelecionada;

        let correspondeBusca = nomeEstabelecimento.includes(textoBusca);

        let correspondeLocalizacao = bairro.includes(textoLocalizacao);

        if (correspondeCategoria && correspondeBusca && correspondeLocalizacao) {

            card.style.display = "flex";
            quantidadeResultados++;

        } else {

            card.style.display = "none";

        }

    });

    resultado.textContent = quantidadeResultados;
}

aplicarFiltros();

botaoFiltro.addEventListener("click", aplicarFiltros);


let botoesFavoritos = document.querySelectorAll(".top-favoritos");
let mensagemFavorito = document.getElementById("mensagem-favorito");

let tempoMensagem;

botoesFavoritos.forEach(function(botao) {

    botao.addEventListener("click", function() {

        let estrela = botao.querySelector(".estrela");

        if (!estrela) return;

        botao.classList.toggle("ativo");

        if (botao.classList.contains("ativo")) {
            estrela.textContent = "★";
            botao.setAttribute("aria-pressed", "true");

            mensagemFavorito.textContent = "★ Você adicionou este local aos favoritos!";
        } else {
            estrela.textContent = "☆";
            botao.setAttribute("aria-pressed", "false");

            mensagemFavorito.textContent = "☆ Você removeu este local dos favoritos!";
        }

        mensagemFavorito.style.display = "block";

        clearTimeout(tempoMensagem);

        tempoMensagem = setTimeout(function() {
            mensagemFavorito.style.display = "none";
        }, 3000);

    });

});
