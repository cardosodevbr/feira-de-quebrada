let botaoCliente = document.getElementById("btn-cliente");
let botaoEmpreendedor = document.getElementById("btn-empreendedor");

let formCliente = document.querySelector(".form-cliente");
let formEmpreendedor = document.querySelector(".form-empreendedor");

let imagemCadastro = document.getElementById("imagem-cadastro");


botaoEmpreendedor.addEventListener("click", function() {

    formCliente.style.display = "none";
    formEmpreendedor.style.display = "block";

    botaoCliente.classList.remove("ativo");
    botaoEmpreendedor.classList.add("ativo");

    imagemCadastro.src = "empreendedor.png";
});

botaoCliente.addEventListener("click", function() {

    formCliente.style.display = "block";
    formEmpreendedor.style.display = "none";

    botaoCliente.classList.add("ativo");
    botaoEmpreendedor.classList.remove("ativo");

    imagemCadastro.src = "trancista.png";
});