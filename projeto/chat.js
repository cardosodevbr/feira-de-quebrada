
class PersonaJessica {
    constructor() {
        this.nomeUsuario = "";
        this.esperandoNome = true;

        this.respostas = [
            { 
                match: /\b(oi|olá|ola|hi|hello|salve|eai|eaí|boa tarde|bom dia|boa noite|oii)\b/i, 
                reply: (n) => `Oii, ${n}! Tudo bem? 👋 Como posso te ajudar hoje na Feira da Quebrada?` 
            },
            { 
                match: /\b(tchau|valeu|até mais|ate mais|obrigado|obrigada|flw|tmj)\b/i, 
                reply: (n) => `Imagina, ${n}! Qualquer dúvida é só chamar por aqui. Tmj! ✨` 
            },
            { 
                match: /\b(bairro|bairros|onde funciona|regiao|região|mapa)\b/i, 
                reply: (n) => `A gente atende várias regiões! Você pode dar uma olhada na lista lateral ou navegar direto nos círculos pelo mapa, ${n}.` 
            },
            { 
                match: /\b(gratis|grátis|taxa|quanto custa|pago|pagar|cobram)\b/i, 
                reply: (n) => `É 100% gratuito, ${n}! Não cobramos nenhuma taxa de quem compra e nem de quem vende.` 
            },
            { 
                match: /\b(cadastrar|cadastro|criar conta|novo usuario|nova conta)\b/i,
                reply: (n) => `Para se cadastrar é bem tranquilo, ${n}:\n\n1. Clica em 'Cadastre-se' no menu;\n2. Escolha 'Empreendedor';\n3. Preencha seus dados e adicione fotos dos seus produtos!` 
            },
            { 
                match: /\b(golpe|fraude|falso|fake|link|whatsapp|zap|contato|chave pix|pix)\b/i, 
                reply: (n) => `Dicas importantes de segurança, ${n}:\n\n1. Use sempre o botão oficial 'Chamar no WhatsApp' na página do vendedor;\n2. Desconfie de mensagens de números estranhos se dizendo representantes do site;\n3. A Feira da Quebrada não faz cobranças nem solicita Pix via chat!` 
            },
            { 
                match: /\b(e seguro|é seguro|é seguro?|segurança|seguranca|confiavel|risco|garantia|confiar)\b/i, 
                reply: (n) => `É seguro sim, ${n}! Mas recomendo sempre combinar certinho os detalhes e evitar pagamentos antecipados sem conhecer o vendedor.` 
            },
            { 
                match: /\b(entrega|entregas|entrega|frete|entregam|entregar|envio|enviar)\b/i, 
                reply: (n) => `Sobre as entregas, ${n}:\n\nA Feira da Quebrada conecta você direto ao vendedor! A forma de envio ou retirada (em mãos, motoboy, etc.) é combinada diretamente entre vocês pelo WhatsApp.` 
            },
            { 
                match: /\b(pagamento|pagar|forma de pagamento|cartao|cartão|dinheiro|aceita pix)\b/i, 
                reply: (n) => `As formas de pagamento são combinadas direto com o empreendedor, ${n}! Geralmente aceitam Pix, dinheiro e cartão na hora da entrega.` 
            },
            { 
                match: /\b(editar|mudar|alterar|atualizar|foto|produto|produtos|anuncio|anúncio)\b/i, 
                reply: (n) => `Para atualizar seus produtos ou informações, ${n}:\n\n1. Faça login na sua conta;\n2. Vá no seu 'Painel do Empreendedor';\n3. Clique em 'Meus Produtos' para editar fotos, descrições.` 
            },
            { 
                match: /\b(ajuda|suporte|problema|contato|alguem|humano|pessoa|atendente)\b/i, 
                reply: (n) => `Precisa de suporte diretamente com a equipe, ${n}? Você pode mandar um e-mail para contato@feiradaquebrada.com ou usar o formulário da página 'Fale Conosco'!` 
            },
            { 
                match: /\b(quem somos|sobre|projeto|historia|o que e|o que é)\b/i, 
                reply: (n) => `A Feira da Quebrada é uma plataforma criada para dar visibilidade e fortalecer os pequenos comerciantes e empreendedores das periferias ${n}! 🚀` 
            },
            { 
                match: /\b(link suspeito|link estranho|hackear|hacker|invasao|invadir)\b/i, 
                reply: (n) => `Cuidado, ${n}! Nunca clique em links suspeitos enviados por terceiros. Os links oficiais da plataforma sempre abrem diretamente o WhatsApp do comércio cadastrado.` 
            },
            { 
                match: /\b(pedir senha|codigo|código|sms|whatsapp clonado|verificacao)\b/i, 
                reply: (n) => `Atenção, ${n}: a equipe da Feira da Quebrada nunca vai te ligar pedindo código de SMS, senha ou confirmação de WhatsApp. Se pedirem, é golpe!` 
            },
            { 
                match: /\b(perfil suspeito|fraude no perfil|denunciar loja)\b/i, 
                reply: (n) => `Se notar algum perfil estranho ou atitude suspeita, envie uma mensagem para o nosso suporte pelo formulário 'Fale Conosco', ${n}!` 
            },
            { 
                match: /\b(editar|mudar|alterar|atualizar|foto|produto|produtos|anuncio|anúncio)\b/i, 
                reply: (n) => `Para atualizar seus produtos ou informações, ${n}:\n\n1. Faça login na sua conta;\n2. Vá no seu 'Painel do Empreendedor';\n3. Clique em 'Meus Produtos' para editar fotos, descrições.` 
            },
            { 
                match: /\b(esqueci senha|recuperar senha|mudar senha|trocar senha|senha)\b/i, 
                reply: (n) => `Para recuperar seu acesso, ${n}:\n\n1. Vá na tela de Login;\n2. Clique em 'Esqueci minha senha';\n3. Digite seu e-mail e o codigo de segurança e a nova senha.` 
            },
            { 
                match: /\b(logo|sua foto|foto de perfil|imagem de perfil)\b/i, 
                reply: (n) => `Para trocar a logo do seu negócio, ${n}:\n\n1. Acesse o 'Painel do Empreendedor';\n2. Vá em 'Dados do Negócio';\n3. Faça o upload da sua nova foto ou logo e clique em Salvar.` 
            },
            { 
                match: /\b(excluir|deletar|apagar conta|apagar loja|cancelar cadastro)\b/i, 
                reply: (n) => `Você tem total controle sobre seus dados, ${n}! É possível ocultar ou excluir seu perfil comercial diretamente nas configurações do seu Painel.` 
            },
            { 
                match: /\b(comissao|comissão|porcentagem|taxa de venda|cobram porcentagem)\b/i, 
                reply: (n) => `Zero comissão, ${n}! Todo o dinheiro das suas vendas vai 100% direto para você. Não intermediamos pagamentos nem cobramos taxas.` 
            },
            { 
                match: /\b(quem pode cadastrar|qualquer loja|sou autônomo|sou mei|posso cadastrar)\b/i, 
                reply: (n) => `Qualquer microempreendedor, Cliente, ou comerciante da quebrada pode se cadastrar gratuitamente, ${n}!` 
            },
            { 
                match: /\b(mudar whatsapp|trocar numero|trocar telefone)\b/i, 
                reply: (n) => `Para atualizar o WhatsApp onde você recebe os pedidos, basta ir em 'Meu Negócio' no seu Painel do Empreendedor e salvar o novo número, ${n}.` 
            },
            { 
                match: /\b(pagamento|pagar|forma de pagamento|cartao|cartão|dinheiro|aceita pix)\b/i, 
                reply: (n) => `As formas de pagamento são combinadas direto com o empreendedor, ${n}! Geralmente aceitam Pix, dinheiro e cartão na hora da entrega ou hora marcada.` 
            },
            { 
                match: /\b(categoria|categorias|tipo de loja|cardapio|servico|servicos|empreendedores)\b/i, 
                reply: (n) => `Você pode usar os filtros do topo da página para Pesquisar ou ir ate a aba categoria e usar o filtro, Moda, Serviços e muito mais, ${n}!` 
            },
            { 
                match: /\b(mais proximo|mais perto|perto de mim|localizacao|onde fica|localização)\b/i, 
                reply: (n) => `Use o nosso Mapa Interativo, ${n}! Ele mostra os pinos de localização de cada comércio para você encontrar os serviços mais próximos de você.` 
            },
            { 
                match: /\b(precisa cadastrar para comprar|criar conta para comprar)\b/i, 
                reply: (n) => `Sim precisa de cadastro para Visualizar os empreendedores, ${n}! Você pode navegar livremente pelo site e chamar os comerciantes no WhatsApp.` 
            },
            { 
                match: /\b(app|aplicativo|baixar|play store|app store|instalar)\b/i, 
                reply: (n) => `Não precisa baixar nada, ${n}! A Feira da Quebrada funciona direto no navegador do seu celular ou computador de forma leve e rápida.` 
            },
            { 
                match: /\b(acessibilidade|leitor de tela|contraste|escuro|modo escuro)\b/i, 
                reply: (n) => `Estamos trabalhando para implementar opções de alto contraste e melhorias para leitores de tela em breve, ${n}!` 
            },
        ];
    }

    responder(mensagem) {
        const texto = mensagem.trim();

        if (this.esperandoNome) {
            let primeiroNome = texto.split(" ")[0];
            this.nomeUsuario = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();
            this.esperandoNome = false;

            return `Prazer, ${this.nomeUsuario}! Como posso te ajudar? Pode me perguntar sobre como se cadastrar, se o site é gratuito ou sobre segurança!`;
        }

        for (const item of this.respostas) {
            if (item.match.test(texto)) {
                return item.reply(this.nomeUsuario);
            }
        }

        return `Poxa, ${this.nomeUsuario}, não entendi muito bem. Tenta me perguntar de forma mais direta, tipo "Como me cadastrar?", "É gratuito?" ou "É seguro?".`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const chatToggle = document.getElementById('chatToggle');
    const chatWidget = document.getElementById('chatWidget');
    const closeChat = document.getElementById('closeChat');
    const messageInput = document.getElementById('chatInput');
    const chatBox = document.getElementById('chatBox');
    const submitBtn = document.getElementById('submitBtn');

    const jessica = new PersonaJessica();

    function adicionarBolha(papel, texto) {
        if (!chatBox) return;
        const bolha = document.createElement('div');
        bolha.classList.add('bubble', papel);
        bolha.innerHTML = texto.replace(/\n/g, '<br>');
        chatBox.appendChild(bolha);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function mostrarDigitando() {
        const indicador = document.createElement('div');
        indicador.classList.add('bubble', 'assistant', 'typing-dots');
        indicador.innerHTML = '<span></span><span></span><span></span>';
        chatBox.appendChild(indicador);
        chatBox.scrollTop = chatBox.scrollHeight;
        return indicador;
    }

    if (chatBox && chatBox.children.length === 0) {
        adicionarBolha('assistant', 'Olá! Sou a Fey, assistente virtual da Feira da Quebrada.\n\nAntes de começarmos, qual é o seu nome?');
    }

    if (chatToggle && chatWidget) {
        chatToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            chatWidget.classList.toggle('hidden');

            if (!chatWidget.classList.contains('hidden') && messageInput) {
                messageInput.focus();
            }
        });
    }

    if (closeChat && chatWidget) {
        closeChat.addEventListener('click', (e) => {
            e.stopPropagation();
            chatWidget.classList.add('hidden');
        });
    }

    function enviarMensagem() {
        if (!messageInput) return;
        const texto = messageInput.value.trim();
        if (!texto) return;

        adicionarBolha('user', texto);
        messageInput.value = '';

        const indicador = mostrarDigitando();
        const resposta = jessica.responder(texto);

        setTimeout(() => {
            if (indicador) indicador.remove();
            adicionarBolha('assistant', resposta);
        }, 700);
    }

    if (submitBtn) submitBtn.addEventListener('click', enviarMensagem);

    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                enviarMensagem();
            }
        });
    }
const helpTooltip = document.getElementById('chatHelpTooltip');
const chatWidgetRef = document.getElementById('chatWidget');

function exibirNotificacaoAjuda() {
    if (helpTooltip && chatWidgetRef && chatWidgetRef.classList.contains('hidden')) {
        helpTooltip.classList.add('show');

        setTimeout(() => {
            helpTooltip.classList.remove('show');
        }, 6000);
    }
}

// 5 segundos da página carregar
setTimeout(exibirNotificacaoAjuda, 5000);

// aviso a cada 2 minutos 
setInterval(exibirNotificacaoAjuda, 120000);

if (chatToggle) {
    chatToggle.addEventListener('click', () => {
        if (helpTooltip) helpTooltip.classList.remove('show');
    });
}
});