# CHANGELOG

Todas as mudanças notáveis deste projeto são documentadas aqui.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue [Semântica de Versão](https://semver.org/lang/pt-BR/).

## [1.0.0] — 2026

Primeira versão estável do Audivise como projeto pessoal e não acadêmico
(continuação do Projeto Integrador V — Engenharia de Computação, UNIVESP,
versão acadêmica 0.x). Arquitetado por Eliezer Tavares de Oliveira.

### Adicionado

- **Motor Rust/WebAssembly no navegador** — substitui, dentro do próprio
  dispositivo, a função serverless `api/analyze.rs` da Vercel da versão
  acadêmica 0.x. Mesmos limiares, mesma ordem de avaliação, mesmas decisões
  do PI-V (X: 0.40/0.60, Y: 0.35/0.65, área: 0.10–0.35), agora com
  normalização defensiva (NaN → 0, limite 0–1).
- **Códigos de instrução estáveis** (`MOVE_RIGHT`, `LOWER_CAMERA`, …)
  devolvidos pelo motor, na mesma ordem de avaliação, permitindo falar as
  orientações em qualquer idioma — o campo `message` preserva a redação
  original em português (contrato da v0.x).
- **27 idiomas de interface e de voz** (seleção independente): português
  (Brasil), inglês, espanhol, francês, italiano, alemão, holandês, polonês,
  romeno, tcheco, ucraniano, sueco, húngaro, sérvio, suaíli, hebraico,
  árabe, mandarim, russo, hindi, japonês, coreano, bahasa indonésio, persa,
  turco, vietnamita e tailandês — todos embutidos, sem rede.
- **Modo RTL automático** para hebraico, árabe e persa.
- **Onboarding de voz no primeiro uso**: quando o sistema não tem voz para
  o idioma da voz escolhido, instruções de instalação (Windows, macOS,
  Android, iPhone/iPad, Linux/Chrome) são mostradas uma única vez por
  idioma; o app segue funcional por texto.
- **Seletor de voz específica e velocidade da fala**, salvos localmente.
- **Iniciadores para Windows, macOS, Linux e Android (Termux)** + guia
  `INICIAR-NO-ANDROID.txt` + PWA instalável (manifest + service worker
  100% local) para uso offline no celular.
- **Suíte de qualidade de ponta a ponta**: testes nativos do motor
  (10 casos de julgamento do PI-V + fronteiras + NaN), testes dentro do
  WebAssembly (wasm-bindgen-test), testes unitários web (Vitest), testes
  E2E (Playwright) com câmera falsa e pipeline completo com foto de rosto,
  auditorias de acessibilidade (axe-core/WCAG) e prova de privacidade por
  interceptação de rede.
- **CI/CD (GitHub Actions)**: pipeline com jobs paralelos (Rust, web,
  E2E/a11y, Lean 4 `lake build`, integridade do projeto), Dependabot e
  workflow de release que publica o pacote local em ZIP a cada tag `v*`.
- **Verificações de integridade e privacidade**: o repositório inteiro leva
  a atribuição "Arquitetado por Eliezer Tavares de Oliveira", com um teste
  que garante a terminologia de arquitetura (e jamais a de fabricação)
  em todos os textos oficiais; varredura estática contra qualquer chamada
  de rede.

### Alterado

- A interface, que era apenas em português na entrega acadêmica, tornou-se
  multilíngue (27 idiomas) com voz multilíngue.
- O rodapé, o botão "Sobre" e a narração apresentam o projeto como
  continuação pessoal e não acadêmica do PI-V.
- A numeração da versão passa a refazer o histórico público do
  repositório: a continuação local da edição acadêmica 0.x é a **1.0.0**.

### Corrigido

- **Recursão infinita no gerenciador de vozes**: `atualizarVozes()`
  notificava os ouvintes incondicionalmente; o ouvinte do aplicativo
  chamava `popularVozes()` de volta e a pilha estourava
  (`RangeError: Maximum call stack size exceeded`), abortando a carga do
  aplicativo. Agora os ouvintes só são notificados quando a lista de vozes
  realmente muda (com trava de reentrância e notificação forçada no marco
  de 2,5 s) e há teste de regressão dedicado.
- **Acessibilidade real**: o azul dos botões (`#007bff`) tinha contraste
  3.97:1 com texto branco — abaixo do mínimo WCAG AA; agora `#0b5ed7`
  (5.84:1). Botões e campos com texto visível carregavam `aria-label`
  divergente do rótulo (WCAG 2.5.3 Label in Name); o nome acessível agora
  é o próprio texto visível. Ambos os problemas foram encontrados pelas
  auditorias axe-core da própria suíte.
- **Aviso de instalação de voz sobre as configurações**: ao trocar o
  idioma da voz dentro do diálogo de configurações, o aviso modal abria
  por cima e bloqueava o próprio botão "Fechar"; agora fica pendente e é
  reavaliado quando as configurações fecham.
- **Marcador `{language}` literal** nos passos de instalação de voz por
  plataforma; agora é interpolado com o nome nativo do idioma da voz.
- **Aviso de abertura por `file://`**: módulos ES não carregam pelo disco
  (CORS do navegador); o aviso passou a ser um script clássico inline,
  visível mesmo sem o motor.
- **Verificação formal nunca compilada**: o `lakefile.toml` declarava a
  biblioteca `FormalVerification`, mas o módulo real é `logic_proof.lean`
  — `lake build` reportava "Nothing to build" e a prova nunca chegou a ser
  verificada. Corrigido (`defaultTargets = ["logic_proof"]`) e confirmada
  a compilação no Lean estável (v4.35.0).

### Removido

- A dependência de servidor externo (Vercel) e a pasta `api/` da versão
  acadêmica — todo o processamento agora acontece no dispositivo.

### Segurança/Privacidade

- Privacidade por construção, verificada por testes: nenhuma requisição
  fora de `127.0.0.1`, nenhum dado persistido, nenhum canal de saída além
  da tela e dos alto-falantes — coerente com os teoremas 3, 4 e 5 da
  verificação formal em Lean 4.
