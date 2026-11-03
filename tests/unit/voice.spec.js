// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0 — testes unitários do gerenciador de voz
// CONTEXT / CONTEXTO: continuação do Projeto Integrador V (UNIVESP).
// Arquitetado por Eliezer Tavares de Oliveira. Licença: GPLv3.
// ===========================================================================
// Prova a seleção de voz do Web Speech API: coincidência exata de idioma,
// coincidência de base (pt-PT serve pt-BR), preferência por pistas de nome
// e por vozes locais, aviso de instalação exibido UMA vez por idioma e o
// controle de sobreposição de fala.

import { describe, it, expect, beforeEach, vi } from 'vitest';

function storageFalso() {
    const mapa = new Map();
    return {
        getItem: (k) => (mapa.has(k) ? mapa.get(k) : null),
        setItem: (k, v) => mapa.set(k, String(v)),
        removeItem: (k) => mapa.delete(k),
    };
}

function vozFalsa(nome, lang, localService = true) {
    return { name: nome, lang, localService, voiceURI: `uri-${nome}` };
}

let voz;

describe('voice.js (gerenciador de voz)', () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.stubGlobal('localStorage', storageFalso());
        vi.stubGlobal('speechSynthesis', {
            getVoices: () => [],
            addEventListener: () => {},
            cancel: () => {},
            speak: () => {},
        });
        globalThis.__AUDIVISE_PISTAS__ = {
            'pt': ['Luciana', 'Francisca'],
            'en': ['Samantha'],
        };
        voz = await import('../../voice.js');
    });

    it('haVozPara: idioma exato e base contam; idioma estranho não', () => {
        voz._injetarVozes([vozFalsa('Luciana', 'pt-BR')]);
        expect(voz.haVozPara('pt-BR')).toBe(true);
        expect(voz.haVozPara('pt-PT')).toBe(true);   // mesma base
        expect(voz.haVozPara('ja-JP')).toBe(false);
    });

    it('melhorVoz prefere coincidência exata de idioma', () => {
        voz._injetarVozes([
            vozFalsa('Viz-PT', 'pt-PT'),
            vozFalsa('Luciana', 'pt-BR'),
        ]);
        const escolhida = voz.melhorVoz('pt-BR');
        expect(escolhida.name).toBe('Luciana');
    });

    it('melhorVoz usa a base quando não há idioma exato', () => {
        voz._injetarVozes([vozFalsa('Viz-PT', 'pt-PT')]);
        expect(voz.melhorVoz('pt-BR').name).toBe('Viz-PT');
    });

    it('melhorVoz usa pistas de nome quando empata', () => {
        voz._injetarVozes([
            vozFalsa('Voz-A', 'pt-BR'),
            vozFalsa('Microsoft Luciana', 'pt-BR'),
        ]);
        expect(voz.melhorVoz('pt-BR').name).toBe('Microsoft Luciana');
    });

    it('melhorVoz devolve null quando nada existe', () => {
        voz._injetarVozes([]);
        expect(voz.melhorVoz('ja-JP')).toBeNull();
    });

    it('vozes locais (offline) vencem empates técnicos', () => {
        voz._injetarVozes([
            vozFalsa('Google pt', 'pt-BR', false),
            vozFalsa('Sistema pt', 'pt-BR', true),
        ]);
        expect(voz.melhorVoz('pt-BR').name).toBe('Sistema pt');
    });

    it('tags com "_" são normalizadas para "-"', () => {
        voz._injetarVozes([vozFalsa('Antiga', 'pt_BR')]);
        expect(voz.haVozPara('pt-BR')).toBe(true);
    });

    it('o aviso de instalação aparece uma única vez por idioma', () => {
        expect(voz.avisoJaMostrado('pt')).toBe(false);
        voz.marcarAvisoMostrado('pt');
        expect(voz.avisoJaMostrado('pt')).toBe(true);
        expect(voz.avisoJaMostrado('ja')).toBe(false);
    });

    it('falar respeita a sobreposição e o forçar (semântica da v0.x)', () => {
        voz._injetarVozes([vozFalsa('Luciana', 'pt-BR')]);
        globalThis.SpeechSynthesisUtterance = class {
            constructor(texto) { this.text = texto; }
        };
        const falado = [];
        globalThis.speechSynthesis.speak = (u) => falado.push(u);
        globalThis.speechSynthesis.cancel = () => falado.push('__cancel__');

        expect(voz.falar('primeira')).toBe(true);
        expect(voz.falar('segunda')).toBe(false);          // bloqueada
        expect(voz.falar('urgente', { forcar: true })).toBe(true); // cancela+fala
        expect(falado[0].text).toBe('primeira');
        expect(falado[1]).toBe('__cancel__');
        expect(falado[2].text).toBe('urgente');
    });

    it('pararFala encerra o estado de fala', () => {
        voz._injetarVozes([vozFalsa('Luciana', 'pt-BR')]);
        globalThis.SpeechSynthesisUtterance = class {};
        globalThis.speechSynthesis.speak = () => {};
        globalThis.speechSynthesis.cancel = vi.fn();
        voz.falar('x');
        voz.pararFala();
        expect(voz.estaFalando()).toBe(false);
        expect(globalThis.speechSynthesis.cancel).toHaveBeenCalled();
    });

    // Regressão 1.0.0: atualizarVozes() notificava os ouvintes incondicional-
    // mente; o ouvinte do app chamava popularVozes() → atualizarVozes() →
    // notificava de novo → RangeError: Maximum call stack size exceeded.
    it('atualizarVozes não entra em recursão infinita com ouvinte reentrante', () => {
        let chamadas = 0;
        voz.aoMudarVozes(() => {
            chamadas += 1;
            if (chamadas < 100) voz.atualizarVozes(); // ciclo proposital
        });
        voz._injetarVozes([vozFalsa('Luciana', 'pt-BR')]);
        expect(() => voz.atualizarVozes()).not.toThrow();
        // A trava de reentrância impede a cascata: notifica o 1º nível e para.
        expect(chamadas).toBe(1);
    });

    it('notifica os ouvintes apenas quando a lista muda', () => {
        let chamadas = 0;
        voz.aoMudarVozes(() => { chamadas += 1; });
        voz._injetarVozes([vozFalsa('Luciana', 'pt-BR')]);
        voz.atualizarVozes();      // lista mudou → notifica
        expect(chamadas).toBe(1);
        voz.atualizarVozes();      // igual → não notifica de novo
        expect(chamadas).toBe(1);
        voz.atualizarVozes(true);  // forçada (marco de 2,5 s) → notifica
        expect(chamadas).toBe(2);
    });

    it('vozesCarregadas fica true após lista real ou teto de tempo', () => {
        expect(voz.vozesCarregadas()).toBe(false);
        voz._injetarVozes([vozFalsa('Luciana', 'pt-BR')]);
        voz.atualizarVozes();
        expect(voz.vozesCarregadas()).toBe(true);
    });
});
