# Política de Segurança

> **Audivise é um sistema arquitetado por Eliezer Tavares de Oliveira.**
> Continuação do Projeto Integrador V (Engenharia de Computação, UNIVESP).
> Licença: GPLv3.

## Filosofia de segurança

A superfície de ataque do Audivise é, por construção, mínima:

- **Zero rede**: o aplicativo não faz nenhuma requisição externa. Isso é
  verificado por varredura estática (`npm run check:privacy`) e por prova
  em navegador real (interceptação de todas as requisições durante o uso —
  `tests/e2e/privacy.spec.js`), executadas a cada commit pelo CI.
- **Zero armazenamento de conteúdo**: nenhum quadro de vídeo, foto ou
  resultado de análise é persistido. As únicas preferências gravadas em
  `localStorage` são idiomas, voz e velocidade da fala.
- **Superfície local**: o servidor local escuta **apenas** em `127.0.0.1`
  (nunca em `0.0.0.0`), dentro de uma faixa fixa de portas, e bloqueia
  qualquer caminho fora da pasta do aplicativo.
- **Verificação formal**: as garantias de privacidade estão enunciadas
  como teoremas em Lean 4 (`formal-verification/`) e a compilação dessa
  prova é portão obrigatório no CI.

## Reportando uma vulnerabilidade

Se você encontrou uma vulnerabilidade, **abra uma *issue* marcada como
`security`** ou escreva diretamente para o contato indicado no perfil do
autor no GitHub. Por se tratar de um projeto pessoal mantido com recursos
limitados, não há programa de recompensas — mas todo relato responsável
será tratado com prioridade e com crédito público, se o relator desejar.

Inclua no relato: versão (`v1.0.x`), sistema operacional, navegador, passos
para reproduzir e impacto estimado. Evite divulgar publicamente detalhes
exploráveis antes da correção.

## Escopo

- **No escopo**: o servidor local (`servidor.py` / `servidor.js`), o motor
  WebAssembly (`engine/`), a camada web (`app.js`, `voice.js`, `i18n.js`),
  o service worker e os iniciadores.
- **Fora do escopo**: o MediaPipe embutido (`vendor/mediapipe/`, artefatos
  do Google) e o navegador do usuário. Questões nesses componentes devem
  ser reportadas aos projetos correspondentes.

## Boas práticas para quem contribui

Qualquer contribuição que precise de dependência nova, canal de rede ou
armazenamento adicional será rejeitada no processo de revisão — ver
`CONTRIBUTING.md`.
