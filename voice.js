// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0
// CONTEXT / CONTEXTO:
//   Continuação do Projeto Integrador V - Engenharia de Computação (UNIVESP).
//   Projeto pessoal e não acadêmico.
//   Arquitetado por Eliezer Tavares de Oliveira.
// LICENSE / LICENÇA: GNU General Public License v3.0 (GPLv3)
// ===========================================================================
// Gerenciador de voz: Web Speech API 100% local (as vozes são as do
// sistema do usuário — nenhuma nuvem). Escolhe a melhor voz para o idioma
// pedido, ajuda o usuário a instalar uma voz ausente (aviso exibido uma
// única vez por idioma) e sintetiza a fala com a velocidade preferida.

import * as prefs from './prefs.js';

let sintese = null;
let vozes = [];
let ouvintes = [];
let vozesConfirmadas = false; // true quando o sistema já expôs a lista real
let modoTeste = false;        // vozes injetadas pelos testes: lista congelada
let assinaturaVozes = null;   // assinatura da última lista notificada
let notificando = false;      // trava de reentrância (impede ciclo infinito)

function normalizarTag(tag) {
    return String(tag || '').toLowerCase().replace(/_/g, '-');
}

function assinaturaDa(lista) {
    return lista.map((v) => `${v.voiceURI}|${v.lang}|${v.name}`).join('\u0001');
}

/** Notifica os ouvintes registrados. A trava `notificando` garante que um
    ouvinte que chame atualizarVozes()/popularVozes() de volta não provoque
    recursão infinita (regressão corrigida na 1.0.0). */
function notificarOuvintes() {
    if (notificando) return;
    notificando = true;
    try {
        ouvintes.forEach((fn) => {
            try { fn(vozes); } catch (e) { /* um ouvinte com falha não derruba os demais */ }
        });
    } finally {
        notificando = false;
    }
}

/** [PT] Recarrega a lista de vozes instaladas no sistema. Só notifica os
    ouvintes quando a lista realmente mudou (ou com forcarNotificacao).
    [EN] Reloads the list of system-installed voices. Notifies listeners
    only when the list actually changed (or when forced). */
export function atualizarVozes(forcarNotificacao = false) {
    try {
        if (!sintese && 'speechSynthesis' in globalThis) {
            sintese = globalThis.speechSynthesis;
        }
        if (sintese && !modoTeste) vozes = sintese.getVoices() || [];
    } catch (e) {
        vozes = [];
    }
    if (vozes.length > 0) vozesConfirmadas = true;
    const assinatura = assinaturaDa(vozes);
    if (forcarNotificacao || assinatura !== assinaturaVozes) {
        assinaturaVozes = assinatura;
        notificarOuvintes();
    }
    return vozes;
}

/** [PT] True quando a lista de vozes do sistema já foi de fato carregada
 *  (o Chrome entrega as vozes de forma assíncrona).
    [EN] True once the system voice list has actually loaded (Chrome
 *  delivers voices asynchronously). */
export function vozesCarregadas() {
    return vozesConfirmadas;
}

/** [PT] Observa mudanças na lista de vozes (vozeschanged).
    [EN] Observes voice list changes (voiceschanged). */
export function aoMudarVozes(fn) {
    ouvintes.push(fn);
    if (sintese && sintese.addEventListener) {
        sintese.addEventListener('voiceschanged', fn);
    } else if (sintese) {
        sintese.onvoiceschanged = fn;
    }
}

export function iniciarVozes() {
    atualizarVozes();
    if (sintese) {
        // Chrome carrega as vozes de forma assíncrona; alguns ambientes
        // só as expõem depois de uma segunda leitura. Após um teto de
        // tempo consideramos a lista definitiva (sistemas sem voz alguma
        // merecem o aviso de instalação).
        setTimeout(atualizarVozes, 300);
        setTimeout(atualizarVozes, 1200);
        setTimeout(() => {
            // A lista é declarada definitiva ANTES da notificação forçada:
            // é este o momento em que "o sistema não tem vozes" fica provado,
            // e o app precisa reavaliar o aviso de instalação (1º uso).
            vozesConfirmadas = true;
            atualizarVozes(true);
        }, 2500);
    } else {
        // Sem Web Speech API: nada a instalar; o app segue só por texto.
        vozesConfirmadas = true;
    }
}

/** [PT] Vozes candidatas para o idioma pedido (exata ou mesma base).
    [EN] Candidate voices for the requested language (exact or same base). */
export function vozesParaIdioma(bcp47) {
    const alvo = normalizarTag(bcp47);
    const base = alvo.split('-')[0];
    return vozes.filter((v) => {
        const tag = normalizarTag(v.lang);
        return tag === alvo || tag.split('-')[0] === base;
    });
}

function pontuarVoz(vox, alvo, base, pistas) {
    const tag = normalizarTag(vox.lang);
    let pontos = 0;
    if (tag === alvo) pontos += 100;
    else if (tag.split('-')[0] === base) pontos += 50;
    const nome = vox.name || '';
    for (const pista of pistas || []) {
        if (pista && nome.toLowerCase().includes(String(pista).toLowerCase())) {
            pontos += 20;
            break;
        }
    }
    if (vox.localService) pontos += 5; // voz offline do sistema: preferida
    return pontos;
}

/** [PT] Melhor voz instalada para o idioma: (1) coincidência exata com
 *  nome conhecido, (2) idioma exato, (3) mesma base (pt-PT serve para
 *  pt-BR quando nada melhor existe). Devolve null se nada houver.
    [EN] Best installed voice for the language; null when none exists. */
export function melhorVoz(bcp47) {
    atualizarVozes();
    const alvo = normalizarTag(bcp47);
    const base = alvo.split('-')[0];
    // Pistas do pacote i18n do idioma (nomes de vozes comuns)
    let pistas = [];
    try {
        pistas = (globalThis.__AUDIVISE_PISTAS__ && globalThis.__AUDIVISE_PISTAS__[base]) || [];
    } catch (e) { /* sem pistas */ }
    const candidatas = vozesParaIdioma(bcp47);
    if (!candidatas.length) return null;
    return candidatas
        .map((v) => ({ v, pontos: pontuarVoz(v, alvo, base, pistas) }))
        .sort((a, b) => b.pontos - a.pontos)[0].v;
}

export function vozPorURI(uri) {
    return vozes.find((v) => v.voiceURI === uri) || null;
}

/** [PT] Existe voz instalada para o idioma?
    [EN] Is there an installed voice for the language? */
export function haVozPara(bcp47) {
    return vozesParaIdioma(bcp47).length > 0;
}

/** [PT] O aviso de instalação aparece uma única vez por idioma (base).
    [EN] The install notice shows once per (base) language. */
export function avisoJaMostrado(base) {
    return prefs.obter(`avisoVoz.${base}`, false) === true;
}

export function marcarAvisoMostrado(base) {
    prefs.gravar(`avisoVoz.${base}`, true);
}

let falando = false;

export function estaFalando() {
    return falando;
}

/** [PT] Fala o texto no idioma/voz/velocidade escolhidos. Cancela a fala
 *  em curso quando forçado (mesma semântica da v0.x).
    [EN] Speaks the text with the chosen language/voice/rate; cancels the
 *  ongoing speech when forced (same semantics as v0.x). */
export function falar(texto, { bcp47, voice = null, rate = 1, forcar = false } = {}) {
    if (!sintese && 'speechSynthesis' in globalThis) {
        sintese = globalThis.speechSynthesis;
    }
    if (!sintese) return false;
    if (falando && !forcar) return false;
    if (forcar) sintese.cancel();
    falando = true;
    try {
        const enunciado = new SpeechSynthesisUtterance(texto);
        enunciado.lang = bcp47;
        if (voice) enunciado.voice = voice;
        enunciado.rate = rate;
        const fim = () => { falando = false; };
        enunciado.onend = fim;
        enunciado.onerror = fim;
        sintese.speak(enunciado);
    } catch (e) {
        falando = false;
        return false;
    }
    return true;
}

export function pararFala() {
    if (!sintese && 'speechSynthesis' in globalThis) {
        sintese = globalThis.speechSynthesis;
    }
    if (sintese) sintese.cancel();
    falando = false;
}

/** [PT] Injeta vozes falsas (usado apenas pelos testes automatizados).
    Invalida a assinatura para que a próxima atualizarVozes() notifique.
    [EN] Injects fake voices (used only by the automated tests). Invalidates
    the signature so the next atualizarVozes() notifies listeners. */
export function _injetarVozes(lista) {
    modoTeste = true;
    vozes = lista;
    assinaturaVozes = null;
    if (lista.length > 0) vozesConfirmadas = true;
}
