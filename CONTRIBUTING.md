# Contribuir com o Audivise

> **Audivise é um sistema arquitetado por Eliezer Tavares de Oliveira.**
> Continuação do Projeto Integrador V (Engenharia de Computação, UNIVESP),
> hoje um projeto pessoal e não acadêmico. Licença: **GPLv3**.

Obrigado por querer contribuir! Este documento resume as regras do
repositório para que qualquer contribuição — código, tradução, teste,
documento ou ideia — chegue com a mesma qualidade e o mesmo respeito à
identidade do projeto.

## A identidade do projeto não é negociável

1. **Atribuição**: o projeto é sempre apresentado como *arquitetado* por
   Eliezer Tavares de Oliveira. A terminologia de fabricação (o particípio
   que descreve quem codifica) é proibida nos textos oficiais do
   repositório — há um teste automatizado de integridade que rejeita o
   commit se a frase de fabricação aparecer em qualquer arquivo.
2. **Versão**: a versão corrente é **1.0.x** (SemVer). Nenhum rastro de
   numeração herdada da edição acadêmica.
3. **Paridade com o PI-V**: os limiares oficiais (X: 0.40/0.60, Y:
   0.35/0.65, área: 0.10–0.35) e a ordem de avaliação (X → Y → Área) só
   mudam com discussão prévia em issue — eles são a assinatura do projeto e
   estão protegidos por testes de paridade em Rust, Lean 4 e README.

## Privacidade por construção

O Audivise roda 100% no dispositivo do usuário. Nenhuma contribuição pode
introduzir chamadas de rede, telemetria, CDNs externos ou qualquer canal de
saída além da tela e dos alto-falantes. O CI executa uma varredura estática
e uma prova em navegador real (interceptação de requisições) — se uma
contribuição depender de algo externo, ela será rejeitada. Dependências
novas (npm ou crates) precisam de justificativa explícita na PR.

## Como contribuir

1. Abra uma *issue* descrevendo o problema ou a proposta (em português,
   inglês ou espanhol — qualquer uma das três é bem-vinda).
2. Faça um *fork*, crie um ramo descritivo
   (`feat/traducao-italiano`, `fix/contraste-botao`, ...).
3. Rode a suíte completa localmente antes de abrir a PR:

   ```bash
   npm ci                 # dependências de teste
   npm test               # testes unitários (Vitest)
   npm run check          # identidade + privacidade estática
   npm run test:e2e       # E2E + acessibilidade (Playwright + axe)
   cd engine
   cargo test --release   # testes nativos do motor
   cd ../formal-verification
   lake build             # verificação formal (Lean 4)
   ```

4. Abra a PR preenchendo a descrição: o que muda, por quê, e quais testes
   cobrem a mudança.

## Padrões de código

- **Rust** (`engine/`): `cargo fmt` e `cargo clippy` sem avisos (o CI
  falha com qualquer aviso). Testes nativos para cada novo caso de
  julgamento.
- **JavaScript** (`app.js`, `i18n.js`, `voice.js`, ...): módulos ES,
  indentação de 4 espaços, comentários bilíngues [PT]/[EN] nas funções
  exportadas.
- **Acessibilidade**: toda mudança de interface precisa passar nas
  auditorias axe-core sem violações graves. Botões com texto visível não
  recebem `aria-label` (WCAG 2.5.3 — Label in Name).
- **Traduções** (`i18n/*.json`): os 27 idiomas são cobertos por um teste
  de completude — uma chave nova precisa existir em todos os arquivos.

## Reportar defeitos

Abra uma *issue* com: sistema operacional, navegador e versão, passos para
reproduzir, comportamento esperado e observado. Se envolver a voz,
diga qual voz do sistema estava selecionada. Capturas de tela ajudam;
vídeos com o rosto em evidência **não** — lembre-se de que privacidade é o
propósito do projeto.
