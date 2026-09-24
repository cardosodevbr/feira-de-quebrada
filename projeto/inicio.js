// ============================================================================
// Carrossel do Hero
// ============================================================================
// Alterna os slides automaticamente a cada INTERVALO_SLIDE_MS, expõe controle
// de pausa/retomada ao usuário e respeita a preferência do sistema por
// movimento reduzido (prefers-reduced-motion), além de suspender a troca
// automática quando a aba está em segundo plano.
(function () {
    const INTERVALO_SLIDE_MS = 10000;

    const container = document.querySelector('.carrossel-slides');
    const slides = document.querySelectorAll('.carrossel-slides .slide');

    if (!container || slides.length === 0) return;

    const preferenciaMovimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');

    let indiceAtual = 0;
    let intervaloId = null;
    let emReproducao = false;

    // Identifica o carrossel como uma região de conteúdo rotativo para
    // tecnologias assistivas, e cada slide como um item dentro dela.
    container.setAttribute('role', 'region');
    container.setAttribute('aria-roledescription', 'carrossel');
    container.setAttribute('aria-label', 'Destaques da Feira de Quebrada');

    slides.forEach((slide, indice) => {
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'slide');
        slide.setAttribute('aria-label', `${indice + 1} de ${slides.length}`);
        slide.setAttribute('aria-hidden', indice === 0 ? 'false' : 'true');
    });

    slides[0].classList.add('ativo');

    // Botão de pausa/retomada, inserido antes das mídias. O rótulo e o
    // estado "aria-pressed" são mantidos em sincronia com a reprodução.
    const botaoPausa = document.createElement('button');
    botaoPausa.type = 'button';
    botaoPausa.className = 'carrossel-botao-pausa';
    container.insertAdjacentElement('beforebegin', botaoPausa);

    function atualizarBotaoPausa() {
        botaoPausa.textContent = emReproducao ? 'Pausar apresentação' : 'Retomar apresentação';
        botaoPausa.setAttribute('aria-pressed', String(!emReproducao));
    }

    function irParaSlide(novoIndice) {
        slides[indiceAtual].classList.remove('ativo');
        slides[indiceAtual].setAttribute('aria-hidden', 'true');

        indiceAtual = novoIndice;

        slides[indiceAtual].classList.add('ativo');
        slides[indiceAtual].setAttribute('aria-hidden', 'false');
    }

    function avancarSlide() {
        irParaSlide((indiceAtual + 1) % slides.length);
    }

    function iniciarReproducao() {
        if (intervaloId !== null) return;
        intervaloId = setInterval(avancarSlide, INTERVALO_SLIDE_MS);
        emReproducao = true;
        atualizarBotaoPausa();
    }

    function pausarReproducao() {
        clearInterval(intervaloId);
        intervaloId = null;
        emReproducao = false;
        atualizarBotaoPausa();
    }

    // O botão é a única forma de pausar: o carrossel não para ao passar o
    // mouse sobre ele, por decisão do projeto.
    botaoPausa.addEventListener('click', () => {
        emReproducao ? pausarReproducao() : iniciarReproducao();
    });

    // Em segundo plano a troca automática é suspensa para não desperdiçar
    // processamento; ao voltar, só é retomada se o usuário estava, de fato,
    // com a reprodução ativa antes da aba perder o foco.
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(intervaloId);
            intervaloId = null;
        } else if (emReproducao) {
            intervaloId = setInterval(avancarSlide, INTERVALO_SLIDE_MS);
        }
    });

    // Usuários com preferência por movimento reduzido começam com a
    // apresentação pausada; a troca automática só começa por ação explícita.
    if (preferenciaMovimentoReduzido.matches) {
        atualizarBotaoPausa();
    } else {
        iniciarReproducao();
    }
})();

// ============================================================================
// Header: escurece ao sair da área do hero
// ============================================================================
// A altura do hero e do header só mudam com o layout da página (resize),
// não a cada pixel rolado — por isso o limite de troca é calculado uma
// única vez e reaproveitado a cada evento de scroll, em vez de forçar
// reflow do navegador continuamente.
(function () {
    const header = document.querySelector('.cabecalho-principal');
    const hero = document.querySelector('.hero-carrossel');

    if (!header || !hero) return;

    let limiteHero = 0;

    function recalcularLimite() {
        limiteHero = hero.offsetHeight - header.offsetHeight;
    }

    function atualizarHeader() {
        header.classList.toggle('header-escuro', window.scrollY > limiteHero);
    }

    recalcularLimite();
    atualizarHeader();

    window.addEventListener('scroll', atualizarHeader, { passive: true });
    window.addEventListener('resize', () => {
        recalcularLimite();
        atualizarHeader();
    });
})();

// ============================================================================
// Funcionalidade do Menu Dropdown (Balãozinho de Categorias)
// ============================================================================
(function () {
    // 1. Identificamos os elementos na página HTML
    const btnCategorias = document.getElementById('btn-categorias');
    const listaCategorias = document.getElementById('lista-categorias');

    // Se a página não tiver este menu, paramos o código por aqui para evitar erros
    if (!btnCategorias || !listaCategorias) return;

    // 2. Ação de clicar no botão "Categorias"
    btnCategorias.addEventListener('click', function(evento) {
        // Impede que o ecrã salte para o topo da página (comportamento padrão dos links com "#")
        evento.preventDefault(); 
        
        // Verifica se o balãozinho está escondido
        if (listaCategorias.classList.contains('escondido')) {
            // Se estiver escondido, mostra-o!
            listaCategorias.classList.remove('escondido');
            listaCategorias.classList.add('mostrar');
            btnCategorias.setAttribute('aria-expanded', 'true'); // Acessibilidade para leitores de ecrã
        } else {
            // Se já estiver aberto, esconde-o!
            listaCategorias.classList.add('escondido');
            listaCategorias.classList.remove('mostrar');
            btnCategorias.setAttribute('aria-expanded', 'false');
        }
    });

    // 3. Ação para fechar o balãozinho quando o utilizador clica fora dele
    document.addEventListener('click', function(evento) {
        // Verifica se o clique ocorreu FORA do botão 'Categorias' e FORA do balãozinho
        if (!btnCategorias.contains(evento.target) && !listaCategorias.contains(evento.target)) {
            // Se o utilizador clicou fora, escondemos o balãozinho por segurança
            listaCategorias.classList.add('escondido');
            listaCategorias.classList.remove('mostrar');
            btnCategorias.setAttribute('aria-expanded', 'false');
        }
    });
})();