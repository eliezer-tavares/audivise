# Audivise 1.0 — Assistente de Enquadramento 100% Local

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![CI](https://github.com/eliezer-tavares/audivise/actions/workflows/ci.yml/badge.svg)](https://github.com/eliezer-tavares/audivise/actions/workflows/ci.yml)
[![ORCID](https://img.shields.io/badge/ORCID-0009--0007--2577--8635-brightgreen)](https://orcid.org/0009-0007-2577-8635)

> **Audivise é um sistema arquitetado por Eliezer Tavares de Oliveira.**
> Esta versão é a **continuação do trabalho iniciado no Projeto Integrador V**
> do curso de **Engenharia de Computação da UNIVESP** (entregue em maio de
> 2026). O Audivise nasceu acadêmico; a versão 1.0 é **pessoal e não
> acadêmica** — uma continuação direta daquela arquitetura, agora voltada à
> autonomia plena do usuário no seu próprio dispositivo.

**Nota Importante:** O autor deste projeto é **deficiente visual total**.

---

## English summary

Audivise is an assistive technology that guides blind users to frame their
face during video calls, with spoken feedback in real time. Version 1.0 runs
**entirely on the user's device**: face detection (MediaPipe) and the
decision engine (Rust compiled to WebAssembly) execute inside the browser —
no server, no cloud, no network. The interface and the voice are available
in **27 languages** (user-selectable independently), RTL is supported
(Hebrew, Arabic, Persian), and a first-use helper tells the user how to
install a system voice when none exists for the chosen language. Launchers
are included for **Windows, macOS, Linux and Android (Termux/PWA)**. The
repository ships unit tests, end-to-end tests, automated accessibility
audits (axe-core/WCAG), a privacy suite that proves zero network requests,
and a CI/CD pipeline that even compiles the Lean 4 formal verification. See
the [English summary](#english-summary-detalhado) below for details.

---

## O que é o Audivise

O Audivise é um sistema assistivo de enquadramento facial para pessoas com
deficiência visual. Durante videoconferências e gravações, ele acompanha a
posição do rosto do usuário pela câmera e fornece feedback falado em tempo
real — "mova o celular para a direita", "abaixe um pouco a câmera",
"aproxime o rosto da câmera" — até anunciar "Enquadramento perfeito! Pode
gravar."

## De onde veio e por que esta versão

A entrega do Projeto Integrador V (v0.x) dividia o trabalho entre o
navegador (detecção facial com MediaPipe) e uma função serverless escrita em
**Rust** hospedada na **Vercel**. Esse desenho funcionava plenamente no
ambiente local (via Vercel CLI), mas o deploy na nuvem mostrou-se instável
na comunicação entre frontend e backend — além de depender de
infraestrutura externa para uma tarefa que, por natureza, é pessoal e
íntima.

A versão 1.0 elimina esse ponto único de fragilidade: **o motor de análise
geométrica em Rust foi compilado para WebAssembly e passou a rodar dentro do
próprio navegador**. Não existe mais servidor, não existe deploy, não existe
nuvem. O resultado é mais estável, mais rápido e — pela primeira vez em toda
a história do projeto — **privado por construção, não por promessa**.

A lógica de decisão é **idêntica à do PI-V**: mesmos limiares (0.40/0.60 no
eixo X, 0.35/0.65 no eixo Y, área 0.10–0.35), mesma ordem de avaliação e
mesmas decisões — agora garantidos por testes automatizados em Rust,
WebAssembly e pela verificação formal em Lean 4.

## Privacidade por construção

Todas as afirmações abaixo são verificáveis — no desenho arquitetural e nos
testes que rodam a cada commit:

- **Nenhuma requisição de rede durante o funcionamento**: as bibliotecas de
  detecção facial, o modelo neural e o motor de decisão estão embutidos no
  repositório. O app funciona com a internet fisicamente desligada. O E2E
  de privacidade intercepta **todas** as requisições do navegador e falha se
  qualquer uma escapar de `127.0.0.1`.
- **O vídeo nunca sai do dispositivo**: os quadros da câmera são processados
  na memória do navegador e descartados.
- **Nada é gravado em disco**: não há banco de dados, cache de conteúdo nem
  telemetria (as preferências de idioma/voz ficam apenas no `localStorage`
  do navegador).
- **Sem contas, sem cookies de rastreamento, sem anúncios.**
- **Verificação estática e formal**: `scripts/check-privacy.mjs` varre o
  código atrás de qualquer chamada de rede; os teoremas em
  `formal-verification/` provam não-interferência e ausência de escrita em
  disco.

## Idiomas e vozes (27 idiomas)

A interface e a voz são selecionáveis **independentemente** em:
Português (Brasil), Inglês, Espanhol, Francês, Italiano, Alemão, Holandês,
Polonês, Romeno, Tcheco, Ucraniano, Sueco, Húngaro, Sérvio, Suaíli,
Hebraico, Árabe, Mandarim, Russo, Hindi, Japonês, Coreano, Bahasa
Indonésio, Persa, Turco, Vietnamita e Tailandês.

- Hebraico, árabe e persa ativam automaticamente a **direção RTL** da
  interface.
- O texto **falado** segue o idioma da voz; a interface segue o idioma
  escolhido — podem ser diferentes.
- Se o sistema não tiver voz instalada para o idioma da voz escolhido, o
  Audivise mostra **uma única vez** (por idioma) instruções passo a passo de
  como instalar a voz no Windows, macOS, Android, iPhone/iPad e Linux — e
  continua funcionando normalmente por texto.
- Todos os 27 pacotes de idioma estão embutidos no repositório; nenhuma
  tradução vem da internet.

## Como usar

1. Baixe o repositório (`Code → Download ZIP`) e descompacte em qualquer
   pasta.
2. Dê duplo clique no iniciador do seu sistema:
   - **Windows:** `INICIAR-AUDIVISE.bat`
   - **macOS:** `iniciar-audivise-mac.command`
   - **Linux:** `bash iniciar-audivise-linux.sh`
   - **Android:** `iniciar-audivise-android.sh` dentro do
     [Termux](https://f-droid.org/packages/com.termux/) — veja o guia
     completo em [INICIAR-NO-ANDROID.txt](INICIAR-NO-ANDROID.txt)
3. Uma janela do servidor local abre (deixe-a aberta) e o navegador surge
   sozinho em `http://127.0.0.1:8437`.
4. Clique em **Iniciar Assistente** e permita o acesso à câmera.
5. No botão **Idioma e Voz**, escolha o idioma da interface e o idioma da
   voz (podem ser diferentes).

Pré-requisito: **Python 3 ou Node.js** instalados (qualquer um dos dois; o
iniciador detecta automaticamente). Eles servem apenas de servidor de
arquivos local — nenhuma dependência é baixada da internet. No Android, o
Termux oferece instalar o Python com um toque.

> Por que não basta dar duplo clique no `index.html`? Por regras de
> segurança dos navegadores, acesso à câmera e módulos WebAssembly exigem
> uma origem de servidor (o `file://` bloqueia ambos — e o app avisa disso
> imediatamente). O servidor local incluído resolve isso em um duplo
> clique, sem tocar na internet.

### Acessibilidade incluída

- Toda a comunicação de estado usa `aria-live` (leitores de tela anunciam
  cada orientação).
- Botão **Repetir Última Orientação**, para ruído ou leitor de tela ocupado.
- Aviso falado quando **nenhum rosto é encontrado** por mais de cinco
  segundos.
- Botão **Sobre o Audivise** narra a história do projeto no idioma da voz.
- Troca real de câmera frontal/traseira.
- Foco visível reforçado (contorno amarelo); auditoria automática com
  **axe-core** (WCAG) em todos os estados principais da interface.

## Arquitetura técnica

```
┌────────────────────────── SEU DISPOSITIVO ─────────────────────────┐
│                                                                    │
│  Navegador (Chrome / Edge / Firefox / Android)                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Câmera (getUserMedia) — somente memória, sem upload         │  │
│  │        │ quadros de vídeo                                    │  │
│  │        ▼                                                     │  │
│  │  MediaPipe Face Detection (WASM + modelo .tflite locais)     │  │
│  │        │ boundingBox: x_center, y_center, width, height      │  │
│  │        ▼                                                     │  │
│  │  MOTOR DE ENQUADRAMENTO — Rust → WebAssembly (engine/)       │  │
│  │        │ JSON: { message, is_perfect, issues[], verdict,     │  │
│  │        │        debug }                                      │  │
│  │        ▼                                                     │  │
│  │  Voz: Web Speech API no idioma escolhido + aria-live         │  │
│  │  Interface: 27 pacotes i18n locais + RTL                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  servidor.py / servidor.js — arquivo local em 127.0.0.1:8437       │
│  (só serve os arquivos do repositório; sem rede)                   │
└────────────────────────────────────────────────────────────────────┘

                    ✗ nenhuma conexão externa ✗
```

### O motor em Rust/WebAssembly (`engine/`)

Porta fiel do `api/analyze.rs` da v0.x: **mesmos limiares, mesma ordem de
avaliação, mesmas decisões**.

| Eixo | Condição | Instrução falada (pt-BR) |
| --- | --- | --- |
| X | x < 0.40 | "mova o celular para a direita" |
| X | x > 0.60 | "mova o celular para a esquerda" |
| Y | y < 0.35 | "abaixe um pouco a câmera" |
| Y | y > 0.65 | "levante um pouco a câmera" |
| Área | área < 0.10 | "aproxime o rosto da câmera" |
| Área | área > 0.35 | "afaste o rosto da câmera" |

Quando nenhuma condição dispara: **"Enquadramento perfeito! Pode gravar."**
(orientações múltiplas são unidas com ponto final, como na v0.x).

Desde a 1.0 o motor também devolve **códigos de instrução** estáveis
(`MOVE_RIGHT`, `LOWER_CAMERA`, …), na mesma ordem de avaliação — é o que
permite a mesma orientação ser falada nos 27 idiomas. O campo `message`
mantém a redação original em português (contrato da v0.x preservado).

Contrato público do módulo (`engine/pkg/`):

- `analisar_enquadramento(x, y, w, h) -> JSON` — substitui, no navegador, a
  antiga chamada `POST /api/analyze` da Vercel.
- `versao_motor() -> string` — versão do motor ("1.0.0").
- `info_motor() -> JSON` — limiares ativos, para exibição na tela.

Antes do núcleo de decisão, os valores passam por uma normalização defensiva
(limites 0–1 e rejeição de NaN). O núcleo de decisão em si permanece
idêntico ao verificado formalmente.

### Detecção facial embutida — `vendor/mediapipe/`

O repositório carrega consigo a biblioteca MediaPipe Face Detection
(BlazeFace, modelo `short`), os dois binários WebAssembly (SIMD e fallback)
e o modelo neural `face_detection_short_range.tflite` — nada é baixado da
internet.

A versão embutida é fixada em **0.4.1646425229**, anterior à release de
março de 2022 que introduziu uma falha de carregamento na detecção facial
(fato confirmado no issue
[#3504 do MediaPipe](https://github.com/google-ai-edge/mediapipe/issues/3504),
que afetava `face_detection` e `face_mesh` a partir de 0.4.1657299874).
Fixar a versão garante que o pacote permaneça estável e reproduzível no
tempo — requisito coerente com uma edição que precisa funcionar por anos,
offline. A biblioteca `camera_utils` acompanha o pacote na mesma linha.

### Verificação formal (Lean 4) — `formal-verification/`

A pasta mantém, integralmente, as provas da entrega acadêmica, agora
compiladas no CI a cada commit:

- **Teorema 1 — Segurança do enquadramento:** a resposta "Perfect" implica
  que o rosto está dentro da zona central.
- **Teorema 2 — Disponibilidade:** para qualquer entrada, o sistema sempre
  emite uma resposta.
- **Teorema 3 — Neutralidade de memória:** o processamento não altera o uso
  de memória do estado.
- **Teorema 4 — Privacidade de disco:** nada é gravado em disco.
- **Teorema 5 — Não-interferência:** a saída de voz é independente dos
  pixels da imagem (duas imagens quaisquer produzem a mesma instrução para
  as mesmas coordenadas).

Na versão local, esses dois últimos teoremas deixam de ser apenas um modelo
matemático e passam a descrever a realidade física do sistema: **não existe
canal de saída além da tela e dos alto-falantes**.

## Qualidade de engenharia: testes e CI/CD

O repositório é verificado de ponta a ponta a cada push/pull request
(`.github/workflows/ci.yml`):

| Camada | Ferramenta | O que garante |
| --- | --- | --- |
| Testes nativos do motor | `cargo test` + `clippy` + `fmt` | Os 10 casos de julgamento do PI-V, fronteiras, NaN, contrato JSON |
| Testes no WebAssembly | `wasm-bindgen-test` (Chromium) | O contrato sobrevive à travessia JS ↔ WASM |
| Testes unitários web | Vitest | 27 pacotes i18n íntegros, junção de frases sem pontuação duplicada, preferências locais, seleção de voz, espelho dos limiares Rust ↔ Lean ↔ README |
| Testes ponta a ponta | Playwright (Chromium) | App real: motor carregado, câmera falsa, 27 idiomas trocados na tela, RTL, persistência, `file://`, pipeline completo com foto de rosto |
| Acessibilidade | axe-core (WCAG) | Zero violações graves na página inicial, nos diálogos e em RTL |
| Privacidade | Intercepção de rede + varredura estática | Zero requisições fora de `127.0.0.1` |
| Integridade do projeto | `check:integrity` | A frase de atribuição "Arquitetado por Eliezer Tavares de Oliveira" e a versão 1.0 intactas |
| Verificação formal | Lean 4 (`lake build`) | As provas do PI-V continuam compilando |

Para rodar localmente:

```bash
npm install
npm run test          # testes unitários (Vitest)
npm run check         # integridade + privacidade estática
npx playwright install chromium   # uma única vez
npm run test:e2e      # E2E + acessibilidade + privacidade em runtime
cd engine && cargo test           # testes nativos do motor
```

A cada tag `v*` (ex.: `v1.0.0`), o workflow de release compila o motor,
executa a suíte completa e publica o pacote local pronto para usuários
(`Audivise-<versão>-Local.zip`) na página de Releases.

## English summary (detalhado)

- **Stack:** MediaPipe Face Detection (vendored, pinned 0.4.1646425229) →
  bounding box → Rust/WASM decision engine (wasm-bindgen, same thresholds
  as the academic v0.x: 0.40/0.60 X, 0.35/0.65 Y, area 0.10–0.35) →
  Web Speech API in the user-selected voice language → `aria-live` for
  screen readers.
- **Languages:** 27 interface + voice locales (pt-BR, en-US, es-ES, fr-FR,
  it-IT, de-DE, nl-NL, pl-PL, ro-RO, cs-CZ, uk-UA, sv-SE, hu-HU, sr-RS,
  sw-KE, he-IL, ar-SA, zh-CN, ru-RU, hi-IN, ja-JP, ko-KR, id-ID, fa-IR,
  tr-TR, vi-VN, th-TH). RTL for he/ar/fa. Voice and interface languages are
  chosen independently; missing system voices trigger a one-time
  install-how-to dialog.
- **Platforms:** Windows (.bat), macOS (.command), Linux (.sh), Android
  (Termux launcher + installable PWA with a local-only service worker).
- **Testing:** Rust unit tests (10 PI-V judgment cases + boundaries + NaN),
  wasm-bindgen tests in a real browser, Vitest unit suite (i18n integrity
  for all 27 locales, sentence-joining without duplicated punctuation,
  local prefs, voice selection, threshold mirror Rust ↔ Lean ↔ README),
  Playwright E2E (real app, fake camera, full face-photo pipeline through
  MediaPipe + WASM, 27 languages, RTL, persistence, file:// warning), axe
  accessibility audits across states and directions, network interception
  proving zero external requests, and an integrity suite enforcing the
  attribution ("Architected by Eliezer Tavares de Oliveira" — the
  attribution phrase claiming the work was manufactured by someone else is
  banned repository-wide) and the 1.0 version.
- **CI/CD:** GitHub Actions pipeline (`ci.yml`) with parallel jobs for Rust,
  web, E2E/a11y, privacy, integrity and Lean 4 compilation (`lake build`);
  `release.yml` builds and attaches the end-user ZIP on version tags;
  Dependabot keeps GitHub Actions and npm dependencies fresh.

## Estrutura do repositório

```
audivise/
├── INICIAR-AUDIVISE.bat          Iniciador (Windows)
├── iniciar-audivise-mac.command  Iniciador (macOS)
├── iniciar-audivise-linux.sh     Iniciador (Linux)
├── iniciar-audivise-android.sh   Iniciador (Android/Termux)
├── INICIAR-NO-ANDROID.txt        Guia completo do Android
├── servidor.py                   Servidor local (Python, sem dependências)
├── servidor.js                   Servidor local (Node.js, sem dependências)
├── index.html                    Aplicação (interface, voz e integração)
├── app.js / i18n.js / voice.js / prefs.js / frases.js
├── styles.css                    Estilo escuro de alto contraste (RTL)
├── i18n/                         27 pacotes de idioma (JSON)
├── manifest.webmanifest          PWA (instalação no Android)
├── service-worker.js             Cache 100% local (offline)
├── icons/                        Ícones do PWA
├── engine/                       Motor de enquadramento
│   ├── Cargo.toml                Fonte Rust do motor (v1.0.0)
│   ├── src/lib.rs                Lógica de decisão + testes unitários
│   ├── tests/wasm_tests.rs       Testes dentro do WebAssembly
│   └── pkg/                      Módulo compilado (WebAssembly + glue JS)
├── vendor/mediapipe/             MediaPipe embutido (JS, WASM e modelo)
├── formal-verification/          Provas formais em Lean 4
├── tests/                        unitários (Vitest) e E2E/a11y (Playwright)
├── scripts/                      build-wasm, check-attribution, check-privacy
├── docs/                         ARCHITECTURE.md, PRIVACY.md
├── .github/workflows/            ci.yml, release.yml (+ Dependabot)
├── LEIA-ME-PRIMEIRO.txt          Guia de uso passo a passo
├── CHANGELOG.md                  Histórico de versões
├── LICENSE                       GNU GPL v3.0
└── README.md                     Este documento
```

## Recompilando o motor (opcional)

O repositório já traz o motor compilado. Para recompilar a partir da fonte
`engine/src/lib.rs`:

```bash
cd engine
rustup target add wasm32-unknown-unknown
cargo build --release --target wasm32-unknown-unknown
wasm-bindgen --target web --out-dir pkg \
    target/wasm32-unknown-unknown/release/audivise_engine.wasm
```

Ou simplesmente `npm run build:wasm`. Versões utilizadas na compilação
original: Rust stable 1.99, wasm-bindgen 0.2.130.

## Origem acadêmica

- **Projeto Integrador V** — Engenharia de Computação, UNIVESP
  (Universidade Virtual do Estado de São Paulo), entregue em maio de 2026.
- Repositório da entrega acadêmica e desta continuação:
  [github.com/eliezer-tavares/audivise](https://github.com/eliezer-tavares/audivise)

## Autor e créditos

**Arquitetado por Eliezer Tavares de Oliveira.**

- **E-mail:** contact@eliezertavaresdeoliveira.com
- **ORCID:** [0009-0007-2577-8635](https://orcid.org/0009-0007-2577-8635)
- **Formação:** Engenharia de Computação — UNIVESP

## Licença

Este projeto está licenciado sob a **GNU General Public License v3.0**.
Veja o arquivo [LICENSE](LICENSE) para o texto completo e o aviso de
direitos autorais.
