// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0 — testes unitários das preferências
// CONTEXT / CONTEXTO: continuação do Projeto Integrador V (UNIVESP).
// Arquitetado por Eliezer Tavares de Oliveira. Licença: GPLv3.
// ===========================================================================
// As preferências vivem só no navegador (localStorage); nenhuma rede. Aqui
// provamos o contrato do módulo com um storage falso, incluindo os casos
// de storage ausente (file:// em alguns navegadores) e JSON corrompido.

import { describe, it, expect, beforeEach, vi } from 'vitest';

function storageFalso() {
    const mapa = new Map();
    return {
        getItem: (k) => (mapa.has(k) ? mapa.get(k) : null),
        setItem: (k, v) => mapa.set(k, String(v)),
        removeItem: (k) => mapa.delete(k),
        _mapa: mapa,
    };
}

let prefs;

describe('prefs.js (preferências locais)', () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.stubGlobal('localStorage', storageFalso());
        prefs = await import('../../prefs.js');
    });

    it('gravar + obter faz ida e volta com JSON', () => {
        expect(prefs.gravar('idiomaInterface', 'pt-BR')).toBe(true);
        expect(prefs.obter('idiomaInterface')).toBe('pt-BR');
        prefs.gravar('velocidade', 1.4);
        expect(prefs.obter('velocidade')).toBe(1.4);
    });

    it('obter devolve o padrão quando a chave não existe', () => {
        expect(prefs.obter('inexistente')).toBeNull();
        expect(prefs.obter('inexistente', 'padrao')).toBe('padrao');
        expect(prefs.obter('inexistente', 42)).toBe(42);
    });

    it('JSON corrompido devolve o padrão sem lançar erro', () => {
        globalThis.localStorage.setItem('audivise.quebrado', '{não é json');
        expect(prefs.obter('quebrado', 'seguro')).toBe('seguro');
    });

    it('remover apaga a chave e volta ao padrão', () => {
        prefs.gravar('chave', 'valor');
        prefs.remover('chave');
        expect(prefs.obter('chave', null)).toBeNull();
    });

    it('storage ausente (file:// em alguns navegadores) não quebra o app', async () => {
        vi.resetModules();
        vi.stubGlobal('localStorage', undefined);
        prefs = await import('../../prefs.js');
        expect(prefs.gravar('x', 1)).toBe(false);
        expect(prefs.obter('x', 'fallback')).toBe('fallback');
        expect(() => prefs.remover('x')).not.toThrow();
    });

    it('storage que lança exceção ao tocar não derruba o app', async () => {
        vi.resetModules();
        vi.stubGlobal('localStorage', {
            get getItem() { throw new Error('SecurityError'); },
            setItem() { throw new Error('SecurityError'); },
            removeItem() { throw new Error('SecurityError'); },
        });
        prefs = await import('../../prefs.js');
        expect(prefs.obter('a', 'ok')).toBe('ok');
        expect(prefs.gravar('a', 1)).toBe(false);
    });

    it('todas as chaves ficam sob o prefixo audivise.', () => {
        prefs.gravar('teste', 1);
        const chaves = [...globalThis.localStorage._mapa.keys()];
        expect(chaves).toEqual(['audivise.teste']);
    });
});
