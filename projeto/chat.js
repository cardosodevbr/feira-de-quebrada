// ================= CHATBOT =================
document.addEventListener('DOMContentLoaded', () => {
    const chatToggle = document.getElementById('chatToggle');
    const chatWidget = document.getElementById('chatWidget');
    const closeChat = document.getElementById('closeChat');
    const messageInput = document.querySelector('.message');
    const chatBox = document.querySelector('.chat');
    const submitBtn = document.querySelector('.submit_message');

    let userName = "";
    let isWaitingForName = true;

    const scriptsChat = [
    { 
        match: /\b(oi|olá|ola|hi|hello|salve|eai|eaí|boa tarde|bom dia|boa noite|oii)\b/i, 
        reply: (n) => 
        `🤖 [Assistente]: Salve, ${n}! 👋 Em que posso te ajudar hoje na Feira da Quebrada?` 
    },
    { 
        match: /\b(tchau|valeu|até mais|ate mais|obrigado|obrigada|flw|tmj)\b/i, 
        reply: (n) => 
        `🤖 [Assistente]: Tamo junto, ${n}! Precisando, é só chamar.` 
    },
    { 
        match: /\b(bairro|bairros|onde funciona|regiao|região|mapa)\b/i, 
        reply: (n) => 
        `🤖 [Assistente]: Atendemos diversas periferias! Você pode navegar pela lista lateral ou pelos círculos no mapa, ${n}.` 
    },
    { 
        match: /\b(gratis|grátis|taxa|quanto custa|pago|pagar|cobram)\b/i, 
        reply: (n) => 
        `🤖 [Assistente]: O site é 100% gratuito, ${n}! Não cobramos nada de compradores nem de comerciantes.` 
    },
    { 
        match: /\b(cadastrar|cadastro|criar conta|novo usuario|nova conta)\b/i,
        reply: (n) => 
        `🤖 [Assistente]: Para se cadastrar, ${n}:\n1. Clique em 'Cadastre-se' no menu;\n2. Escolha 'Empreendedor';\n3. Preencha os dados e adicione fotos dos produtos!` 
    },
    { 
        match: /\b(golpe|fraude|falso|fake|link|whatsapp|zap|contato|chave pix|pix)\b/i, 
        reply: (n) => 
        `🤖 [Assistente]: Dicas para navegar com segurança na Feira da Quebrada, ${n}:\n1. Negocie e use apenas os links do botão oficial 'Chamar no WhatsApp' na página do empreendedor;\n2. Desconfie de mensagens de números estranhos se dizendo representantes do site;\n3. A plataforma Feira da Quebrada não faz cobranças, não pede senhas nem solicita Pix via chat!` 
    },
    { 
        match: /\b(e seguro|é seguro|é seguro?|segurança|seguranca|confiavel|risco|garantia|confiar)\b/i, 
        reply: (n) => 
        `🤖 [Assistente]: É seguro, ${n}! Mas lembre-se: prefira ver o produto pessoalmente e evite pagamentos antecipados sem conhecer o vendedor.` 
    }
];

    function processUserMessage(userInput) {
        const cleanInput = userInput.trim();

        if (isWaitingForName) {
            userName = cleanInput.split(" ")[0];
            userName = userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase();
            isWaitingForName = false;
            return `🤖 [Assistente]: Prazer, ${userName}!\n\nComo posso te ajudar agora? Pode me perguntar sobre como se cadastrar, se o site é gratuito, como funciona o mapa ou sobre segurança!`;
        }

        for (const item of scriptsChat) {
            if (item.match.test(cleanInput)) return item.reply(userName);
        }

        return `🤖 [Assistente]: Desculpa, ${userName}, não entendi muito bem. Tente perguntar de forma mais direta, como "Como me cadastrar?", "É gratuito?" ou "É seguro?".`;
    }

    function addBubble(role, text) {
        if (!chatBox) return;
        const bubble = document.createElement('div');
        bubble.classList.add('bubble', role);
        bubble.innerHTML = text.replace(/\n/g, '<br>');
        chatBox.appendChild(bubble);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function showTyping() {
        const indicator = document.createElement('div');
        indicator.classList.add('bubble', 'assistant');
        indicator.innerText = 'Digitando...';
        chatBox.appendChild(indicator);
        chatBox.scrollTop = chatBox.scrollHeight;
        return indicator;
    }

    if (chatBox && chatBox.children.length === 0) {
        addBubble('assistant', '🤖 [Assistente]: Olá! Sou o assistente virtual da Feira da Quebrada.\n\nAntes de começarmos, qual é o seu nome?');
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

    function submitMessage() {
        if (!messageInput) return;
        const text = messageInput.value.trim();
        if (!text) return;

        addBubble('user', text);
        messageInput.value = '';

        const replyText = processUserMessage(text);
        const indicator = showTyping();

        setTimeout(() => {
            if (indicator) indicator.remove();
            addBubble('assistant', replyText);
        }, 700);
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', submitMessage);
    }

    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitMessage();
            }
        });
    }
});