# Feira de Quebrada

> Plataforma que conecta moradores aos comércios e serviços locais do seu bairro.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

---

## Sobre o projeto

**Feira de Quebrada** é uma plataforma pensada para dar visibilidade a pequenos empreendedores, valorizando o comércio local e aproximando moradores dos produtos e serviços produzidos dentro da própria comunidade.

Este projeto foi desenvolvido pelos estudantes da turma **SP09** durante o curso de **Front End do Instituto Proa**, em parceria com a **Serasa Experian**.

Este repositório contém a **página inicial** do produto: header com busca e autenticação, carrossel de destaque, vitrine de profissionais, categorias populares, seção institucional e um espaço reservado para a futura integração com mapa interativo.

> Este é o README da primeira versão do projeto. Novas páginas, funcionalidades e documentação serão adicionadas conforme o desenvolvimento avança.

---

## Tecnologias

O projeto foi construído com tecnologias web puras, sem frameworks ou bibliotecas externas:

- **HTML5** — marcação semântica (`header`, `nav`, `main`, `section`, `article`, `footer`, `search`)
- **CSS3** — variáveis nativas (`:root`), Grid e Flexbox, aninhamento nativo (`&`), `prefers-reduced-motion` e `:focus-visible` para acessibilidade
- **JavaScript (Vanilla)** — carrossel do hero e comportamento do header, sem dependências

---

## Como rodar localmente

Por ser um projeto estático (HTML, CSS e JS puros), não há build nem instalação de pacotes.

1. Clone o repositório:
   ```bash
   git clone https://github.com/<seu-usuario>/feira-de-quebrada.git
   ```
2. Entre na pasta do projeto:
   ```bash
   cd feira-de-quebrada
   ```
3. Abra o arquivo `inicio.html` diretamente no navegador, **ou** sirva a pasta com um servidor local (recomendado, evita problemas de path relativo):
   ```bash
   npx serve .
   ```
   ou, com a extensão **Live Server** do VS Code, clique em "Go Live" sobre o `inicio.html`.

### Estrutura de pastas

```
feira-de-quebrada/
├── inicio.html
├── styleinicio.css
├── inicio.js
├── logo.png
├── icones/
└── imagens/
```

---

## Acessibilidade

Acessibilidade foi tratada como parte do desenvolvimento, não como um ajuste posterior:

- Marcação semântica e hierarquia de headings consistente
- Textos alternativos descritivos em todas as imagens de conteúdo; imagens decorativas marcadas com `alt=""` e `aria-hidden`
- Indicador de foco visível (`:focus-visible`) em links, botões e campos de formulário
- Suporte a `prefers-reduced-motion`, desativando animações e rolagem suave para quem tem essa preferência ativada no sistema
- Carrossel do hero com região identificada (`role="region"`), rótulos por slide e botão de pausa/retomada — a troca automática também respeita a preferência por movimento reduzido e é suspensa quando a aba está em segundo plano

Ainda há espaço para evoluir (por exemplo, testes com leitores de tela reais e navegação por teclado ponta a ponta), e isso segue como parte do roadmap do projeto.

---

## Contato

Projeto desenvolvido pela turma **SP09** — Instituto Proa × Serasa Experian.

- 📷 Instagram: [@feiradaquebrada](https://www.instagram.com/feiradaquebrada)
- ✉️ E-mail: [feiradaquebrada@gmail.com](mailto:feiradaquebrada@gmail.com)