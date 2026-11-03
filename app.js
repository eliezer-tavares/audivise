// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0
// CONTEXT / CONTEXTO:
//   Continuação do Projeto Integrador V - Engenharia de Computação (UNIVESP).
//   Projeto pessoal e não acadêmico.
//   Arquitetado por Eliezer Tavares de Oliveira.
// LICENSE / LICENÇA: GNU General Public License v3.0 (GPLv3)
// ===========================================================================
// Lógica principal do Audivise: câmera → MediaPipe (local) → motor
// Rust/WebAssembly (local) → voz no idioma escolhido (Web Speech API do
// sistema). Nenhuma requisição externa: tudo abaixo roda no dispositivo.

import init, { analisar_enquadramento, versao_motor, info_motor }
    from './engine/pkg/audivise_engine.js';
import * as i18n from './i18n.js';
import * as voz from './voice.js';
import * as prefs from './prefs.js';
import { unirInstrucoes } from './frases.js';

// ============================ ELEMENTOS ============================
const videoElement = document.getElementById('inputVideo');
const startBtn = document.getElementById('startBtn');
const repeatBtn = document.getElementById('repeatBtn');
const cameraBtn = document.getElementById('cameraBtn');
const aboutBtn = document.getElementById('aboutBtn');
const settingsBtn = document.getElementById('settingsBtn');
const statusText = document.getElementById('statusText');
const engineStatus = document.getElementById('engineStatus');
const deviceInfo = document.getElementById('deviceInfo');
const settingsDialog = document.getElementById('settingsDialog');
const voiceInstallDialog = document.getElementById('voiceInstallDialog');
const interfaceLangSelect = document.getElementById('interfaceLangSelect');
const voiceLangSelect = document.getElementById('voiceLangSelect');
const voiceSelect = document.getElementById('voiceSelect');
const rateRange = document.getElementById('rateRange');
const rateValue = document.getElementById('rateValue');
const testVoiceBtn = document.getElementById('testVoiceBtn');
const settingsCloseBtn = document.getElementById('settingsCloseBtn');
const voiceInstallIntro = document.getElementById('voiceInstallIntro');
const voiceInstallSteps = document.getElementById('voiceInstallSteps');
const voiceRecheckBtn = document.getElementById('voiceRecheckBtn');
const voiceOkBtn = document.getElementById('voiceOkBtn');

// ============================ ESTADO ============================
let assistenteAtivo = false;
// Aviso de voz pendente: o usuário trocou o idioma da voz dentro das
// configurações e o diálogo de instalação só poderá abrir após fechá-las.
let avisoPendenteAposFechar = false;
let motorPronto = false;
let lastAnalysisTime = 0;
let lastFaceTime = 0;
let ultimaFala = '';
let facingMode = 'user'; // 'user' = frontal | 'environment' = traseira
let camera = null;
let isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Preferências (interface, voz, velocidade)
let idiomaInterface = prefs.obter('idiomaInterface', null);
let idiomaVoz = prefs.obter('idiomaVoz', null);
let velocidade = Number(prefs.obter('velocidade', 1.0));
let vozEscolhida = null; // objeto SpeechSynthesisVoice ou null (padrão)

// ============================ I18N ============================
await i18n.carregarIdiomas();
if (!idiomaInterface || !i18n.idiomaDisponivel(idiomaInterface)) {
    idiomaInterface = i18n.detectarIdiomaPadrao();
}
i18n.definirIdioma(idiomaInterface);
if (!idiomaVoz || !i18n.idiomaDisponivel(idiomaVoz)) {
    idiomaVoz = idiomaInterface;
}

// Pistas de nomes de voz por idioma-base (para melhorVoz())
globalThis.__AUDIVISE_PISTAS__ = {};
for (const codigo of i18n.CODIGOS_IDIOMAS) {
    const pistas = i18n.pistasDeVoz(codigo);
    if (pistas.length) {
        globalThis.__AUDIVISE_PISTAS__[codigo.split('-')[0]] = pistas;
    }
}

// ============================ FALA ============================
function bcp47Voz() {
    const meta = i18n.metaDe(idiomaVoz);
    return meta ? meta.bcp47 : idiomaVoz;
}

function separadorFrases() {
    const meta = i18n.metaDe(idiomaVoz);
    return (meta && meta.sentenceSeparator) || '. ';
}

/** [PT] Traduz no idioma da VOZ (textos falados seguem a voz).
    [EN] Translates in the VOICE language (spoken text follows the voice). */
const falarT = (caminho, params) => i18n.tDe(idiomaVoz, caminho, params);

/** [PT] Exibe e fala uma orientação. aria-live anuncia para leitores de
 *  tela; a síntese de voz usa o idioma/voz/velocidade escolhidos.
    [EN] Shows and speaks a guidance. aria-live announces it to screen
 *  readers; speech synthesis uses the chosen language/voice/rate. */
function falar(texto, forcar = false) {
    ultimaFala = texto;
    statusText.textContent = texto;
    voz.falar(texto, {
        bcp47: bcp47Voz(),
        voice: vozEscolhida,
        rate: velocidade,
        forcar,
    });
}

// ============================ MOTOR WASM ============================
try {
    await init();
    motorPronto = true;
    engineStatus.textContent =
        i18n.t('status.engineReady', { version: versao_motor() });
} catch (e) {
    engineStatus.textContent =
        i18n.t('status.engineError', { error: (e && e.message) || String(e) });
    engineStatus.classList.add('erro');
}

// ============================ FILE:// ============================
if (location.protocol === 'file:') {
    engineStatus.textContent = i18n.t('fileProtocol.warning');
    engineStatus.classList.add('erro');
}

// ============================ CÂMERA / DETECÇÃO ============================
const faceDetection = new FaceDetection({
    locateFile: (file) => `vendor/mediapipe/${file}`,
});

faceDetection.setOptions({
    minDetectionConfidence: 0.6,
    model: 'short', // otimizado para câmera frontal (selfie)
});

// Resolvedor usado apenas pelos testes automatizados (imagem estática).
let resolverTeste = null;

faceDetection.onResults((results) => {
    if (resolverTeste) {
        const r = resolverTeste;
        resolverTeste = null;
        r(results);
        return;
    }
    if (!assistenteAtivo || !motorPronto) return;

    // Evita sobreposição de voz e enxurrada de falas (como na v0.x)
    if (Date.now() - lastAnalysisTime < 2500 || voz.estaFalando()) return;

    if (results.detections && results.detections.length > 0) {
        lastAnalysisTime = Date.now();
        lastFaceTime = Date.now();
        const face = results.detections[0].boundingBox;
        try {
            const data = JSON.parse(analisar_enquadramento(
                face.xCenter, face.yCenter, face.width, face.height));
            // As instruções são traduzidas no idioma da VOZ, na mesma ordem
            // de avaliação do PI-V (X, depois Y, depois Área).
            if (data.is_perfect) {
                falar(falarT('verdict.perfect'));
            } else if (Array.isArray(data.issues) && data.issues.length) {
                const texto = unirInstrucoes(
                    data.issues.map((codigo) => falarT(`issues.${codigo}`)),
                    separadorFrases()
                );
                falar(texto);
            } else if (data.message) {
                falar(data.message);
            }
        } catch (e) {
            console.error('Erro no motor:', e);
        }
    } else if (Date.now() - lastFaceTime > 5000) {
        // Aviso acessório para o usuário cego: a lógica de enquadramento
        // (limiares e mensagens) permanece idêntica à do PI-V.
        lastFaceTime = Date.now();
        falar(falarT('speech.noFace'));
    }
});

function criarCamera() {
    return new Camera(videoElement, {
        onFrame: async () => {
            if (assistenteAtivo) {
                await faceDetection.send({ image: videoElement });
            }
        },
        width: 640,
        height: 480,
        facingMode,
    });
}

// ============================ RÓTULOS DINÂMICOS ============================
function renderizarRotulos() {
    startBtn.textContent = assistenteAtivo
        ? i18n.t('buttons.stop')
        : i18n.t('buttons.start');
    const frontal = facingMode === 'user';
    cameraBtn.textContent = frontal
        ? i18n.t('buttons.cameraFront')
        : i18n.t('buttons.cameraBack');
    deviceInfo.textContent = frontal
        ? (isMobile
            ? i18n.t('status.deviceMobile')
            : i18n.t('status.deviceDesktop'))
        : i18n.t('status.cameraBackMode');
    if (motorPronto && location.protocol !== 'file:') {
        engineStatus.textContent =
            i18n.t('status.engineReady', { version: versao_motor() });
        engineStatus.classList.remove('erro');
    }
    // O seletor "Voz instalada" tem opções geradas dinamicamente (placeholder
    // "Nenhuma voz instalada…"), que precisam acompanhar o idioma da interface.
    popularVozes();
}

// ============================ SELETORES ============================
function popularSeletoresDeIdioma() {
    const lista = i18n.listaIdiomas();
    for (const seletor of [interfaceLangSelect, voiceLangSelect]) {
        seletor.innerHTML = '';
        for (const item of lista) {
            const opcao = document.createElement('option');
            opcao.value = item.codigo;
            opcao.textContent = item.nativeName;
            seletor.appendChild(opcao);
        }
        seletor.value = seletor === interfaceLangSelect
            ? idiomaInterface
            : idiomaVoz;
    }
}

function popularVozes() {
    voz.atualizarVozes();
    voiceSelect.innerHTML = '';
    const candidatas = voz.vozesParaIdioma(i18n.metaDe(idiomaVoz).bcp47);
    const padrao = document.createElement('option');
    padrao.value = '';
    padrao.textContent = candidatas.length
        ? i18n.t('settings.voiceSystemDefault')
        : i18n.t('settings.voiceNone');
    voiceSelect.appendChild(padrao);
    for (const v of candidatas) {
        const opcao = document.createElement('option');
        opcao.value = v.voiceURI;
        opcao.textContent = v.name + (v.localService ? ' ●' : '');
        voiceSelect.appendChild(opcao);
    }
    vozEscolhida = prefs.obter('vozURI', null)
        ? voz.vozPorURI(prefs.obter('vozURI', null))
        : null;
    if (!vozEscolhida) vozEscolhida = voz.melhorVoz(i18n.metaDe(idiomaVoz).bcp47);
    voiceSelect.value = vozEscolhida ? vozEscolhida.voiceURI : '';
    rateRange.value = String(velocidade);
    rateValue.textContent = velocidade.toFixed(1);
}

function mostrarAvisoVozSeNecessario() {
    const meta = i18n.metaDe(idiomaVoz);
    if (!meta) return;
    // Espera a lista de vozes do sistema estar realmente carregada (o
    // Chrome as entrega de forma assíncrona) para não alertar sem motivo.
    if (!voz.vozesCarregadas()) return;
    const base = meta.bcp47.split('-')[0];
    if (!voz.haVozPara(meta.bcp47) && !voz.avisoJaMostrado(base)) {
        abrirAvisoVoz();
    }
}

function abrirAvisoVoz() {
    const meta = i18n.metaDe(idiomaVoz);
    const rotulo = `${meta.nativeName} (${meta.englishName})`;
    voiceInstallIntro.textContent =
        i18n.t('voiceInstall.intro', { language: rotulo });
    // Os passos por plataforma também citam o idioma ({language}); o
    // data-i18n genérico não interpola parâmetros, então preenchemos aqui,
    // a cada abertura, com o idioma DA VOZ (não o da interface).
    const chaves = ['windows', 'macos', 'android', 'ios', 'linux', 'chrome'];
    voiceInstallSteps.querySelectorAll('li').forEach((li, i) => {
        li.textContent = i18n.t(`voiceInstall.${chaves[i]}`, { language: meta.nativeName });
    });
    voiceInstallDialog.showModal();
}

interfaceLangSelect.addEventListener('change', () => {
    idiomaInterface = interfaceLangSelect.value;
    prefs.gravar('idiomaInterface', idiomaInterface);
    i18n.definirIdioma(idiomaInterface);
    renderizarRotulos();
});

voiceLangSelect.addEventListener('change', () => {
    idiomaVoz = voiceLangSelect.value;
    prefs.gravar('idiomaVoz', idiomaVoz);
    vozEscolhida = null;
    prefs.remover('vozURI');
    popularVozes();
    // UX: o aviso modal NÃO abre sobre o diálogo de configurações ainda
    // aberto (o backdrop bloquearia o próprio botão "Fechar"); fica
    // pendente e é reavaliado quando as configurações fecharem.
    if (settingsDialog.open) {
        avisoPendenteAposFechar = true;
    } else {
        mostrarAvisoVozSeNecessario();
    }
});

settingsDialog.addEventListener('close', () => {
    if (avisoPendenteAposFechar) {
        avisoPendenteAposFechar = false;
        mostrarAvisoVozSeNecessario();
    }
});

voiceSelect.addEventListener('change', () => {
    const uri = voiceSelect.value;
    vozEscolhida = uri ? voz.vozPorURI(uri) : null;
    if (uri && !vozEscolhida) {
        // Voz sumiu do sistema; volta ao padrão e atualiza a lista.
        vozEscolhida = null;
        popularVozes();
    }
    if (vozEscolhida) prefs.gravar('vozURI', vozEscolhida.voiceURI);
    else prefs.remover('vozURI');
});

rateRange.addEventListener('input', () => {
    velocidade = Number(rateRange.value);
    rateValue.textContent = velocidade.toFixed(1);
    prefs.gravar('velocidade', velocidade);
});

settingsBtn.addEventListener('click', () => {
    popularSeletoresDeIdioma();
    popularVozes();
    settingsDialog.showModal();
});

settingsCloseBtn.addEventListener('click', () => settingsDialog.close());

testVoiceBtn.addEventListener('click', () => {
    voz.falar(falarT('verdict.perfect'), {
        bcp47: bcp47Voz(),
        voice: vozEscolhida,
        rate: velocidade,
        forcar: true,
    });
});

voiceOkBtn.addEventListener('click', () => {
    const meta = i18n.metaDe(idiomaVoz);
    if (meta) voz.marcarAvisoMostrado(meta.bcp47.split('-')[0]);
    voiceInstallDialog.close();
});

voiceRecheckBtn.addEventListener('click', () => {
    voz.atualizarVozes();
    popularVozes();
    const meta = i18n.metaDe(idiomaVoz);
    if (meta && voz.haVozPara(meta.bcp47)) {
        voiceInstallDialog.close();
    }
});

// ============================ BOTÕES ============================
startBtn.addEventListener('click', () => {
    if (location.protocol === 'file:') {
        falar(i18n.t('fileProtocol.blocked'), true);
        return;
    }
    if (!motorPronto) {
        falar(falarT('speech.engineLoading'), true);
        return;
    }
    assistenteAtivo = !assistenteAtivo;
    renderizarRotulos();

    if (assistenteAtivo) {
        lastFaceTime = Date.now();
        if (!camera) camera = criarCamera();
        camera.start()
            .then(() => falar(falarT('speech.cameraOn'), true))
            .catch(() => falar(falarT('speech.cameraError'), true));
    } else {
        camera.stop();
        voz.pararFala();
        falar(falarT('speech.stopped'), true);
    }
});

repeatBtn.addEventListener('click', () => {
    if (ultimaFala) {
        falar(ultimaFala, true);
    } else {
        falar(falarT('speech.nothingToRepeat'), true);
    }
});

cameraBtn.addEventListener('click', async () => {
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    const frontal = facingMode === 'user';
    renderizarRotulos();
    if (assistenteAtivo) {
        try {
            camera.stop();
        } catch (e) { /* já parada */ }
        camera = criarCamera();
        try {
            await camera.start();
        } catch (e) {
            falar(falarT('speech.cameraRestartError'), true);
            return;
        }
    }
    falar(falarT(frontal ? 'speech.frontSelected' : 'speech.backSelected'), true);
});

aboutBtn.addEventListener('click', () => falar(falarT('about.narrative'), true));

// ============================ VOZES (async do Chrome) ============================
voz.iniciarVozes();
voz.aoMudarVozes(() => {
    popularVozes();
    mostrarAvisoVozSeNecessario();
});
popularVozes();
renderizarRotulos();
mostrarAvisoVozSeNecessario();

// ============================ PWA (instalação local) ============================
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    try {
        navigator.serviceWorker.register('./service-worker.js');
    } catch (e) { /* sem PWA: o app continua funcionando */ }
}

// ============================ GANCHO DE TESTES ============================
// Expõe funções internas apenas para a suíte automatizada (Playwright).
// Não envia dado algum para fora do navegador.
globalThis.__AUDIVISE_TESTE__ = {
    analisar: (x, y, w, h) => JSON.parse(analisar_enquadramento(x, y, w, h)),
    versao: () => versao_motor(),
    info: () => JSON.parse(info_motor()),
    idiomas: () => i18n.listaIdiomas(),
    idiomaInterface: () => idiomaInterface,
    idiomaVoz: () => idiomaVoz,
    definirIdiomaInterface: (codigo) => {
        idiomaInterface = codigo;
        i18n.definirIdioma(codigo);
        renderizarRotulos();
    },
    definirIdiomaVoz: (codigo) => {
        idiomaVoz = codigo;
        popularVozes();
        mostrarAvisoVozSeNecessario();
    },
    /** Envia uma imagem estática pelo pipeline real do MediaPipe e
        devolve as detecções (usado no E2E com foto de rosto). */
    detectarEmImagem: (url) => new Promise((resolver, rejeitar) => {
        const img = new Image();
        img.onload = () => {
            resolverTeste = resolver;
            faceDetection.send({ image: img })
                .catch((e) => { resolverTeste = null; rejeitar(e); });
        };
        img.onerror = rejeitar;
        img.src = url;
    }),
    estado: () => ({ assistenteAtivo, motorPronto, facingMode }),
    ultimaFala: () => ultimaFala,
};
