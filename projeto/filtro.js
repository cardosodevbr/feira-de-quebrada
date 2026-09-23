let parametros = new URLSearchParams(window.location.search);

let categoria = parametros.get("categoria");

let seletorCategoria = document.getElementById("categoria");

let campoBusca = document.getElementById("busca");

seletorCategoria.value = categoria;

let resultado = document.getElementById("resultado");

let cards = document.querySelectorAll(".card-resultados");

if (categoria) {

    seletorCategoria.value = categoria;}

cards.forEach(function(card) {

    if (card.dataset.categoria === categoria) {
        card.style.display = "block";
    } else {
        card.style.display = "none";
    }

});

let botaoFiltro = document.querySelector(".aplica-filtro");

botaoFiltro.addEventListener("click", function() {

    let categoriaSelecionada = seletorCategoria.value;
    let textoBusca = campoBusca.value.toLowerCase();

    let quantidadeResultados = 0;

    cards.forEach(function(card) {
        let nomeEstabelecimento = card.querySelector("h3").textContent.toLowerCase();

        if (categoriaSelecionada === "todas" && nomeEstabelecimento.includes(textoBusca)
        ) {
        card.style.display = "block";
        quantidadeResultados++;

    } else if (card.dataset.categoria === categoriaSelecionada && nomeEstabelecimento.includes(textoBusca)
    ) {
    card.style.display = "block";
    quantidadeResultados++;

    } else {
    card.style.display = "none";
    }
    });
    resultado.textContent = quantidadeResultados; // ← COLOCA AQUI

});

