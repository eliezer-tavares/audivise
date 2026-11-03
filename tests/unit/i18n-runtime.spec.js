// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0 — testes unitários do módulo i18n
// CONTEXT / CONTEXTO: continuação do Projeto Integrador V (UNIVESP).
// Arquitetado por Eliezer Tavares de Oliveira. Licença: GPLv3.
// ===========================================================================
// Testa o comportamento do módulo i18n.js em runtime: carga dos 27
// pacotes, interpolação de placeholders, cadeia de fallback, seleção de
// idioma padrão pelas línguas do navegador e direção RTL.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Stub mínimo de DOM (i18n.js só toca no DOM em definirIdioma/aplicarDom;
// define lang/dir como PROPERTIES no documentElement, como no navegador)
const elementoHtml = {};
vi.stubGlobal('document', {
    documentElement: elementoHtml,
    title: '',
    querySelectorAll: () => [],
});

// fetch stub: serve os arquivos locais de verdade (nada de rede)
vi.stubGlobal('fetch', async (url) => {
    const caminho = join(process.cwd(), url.replace('./', ''));
    try {
        const conteudo = readFileSync(caminho, 'utf-8');
        return { ok: true, status: 200, json: async () => JSON.parse(conteudo) };
    } catch (e) {
        return { ok: false, status: 404, json: async () => ({}) };
    }
});

const i18n = await import('../../i18n.js');

describe('i18n.js (runtime)', () => {
    beforeEach(() => {
        delete elementoHtml.lang;
        delete elementoHtml.dir;
    });

    it('carrega os 27 idiomas', async () => {
        const total = await i18n.carregarIdiomas();
        expect(total).toBe(27);
    });

    it('t() interpola placeholders', async () => {
        await i18n.carregarIdiomas();
        i18n.definirIdioma('en-US');
        const texto = i18n.t('status.engineReady', { version: '9.9.9' });
        expect(texto).toContain('9.9.9');
        expect(texto.includes('{version}')).toBe(false);
    });

    it('tDe() fala no idioma da voz sem trocar a interface', async () => {
        await i18n.carregarIdiomas();
        i18n.definirIdioma('pt-BR');
        const emIngles = i18n.tDe('en-US', 'verdict.perfect');
        expect(emIngles).toBe('Perfect framing! You can start recording.');
        // A interface continua em português
        expect(i18n.t('verdict.perfect'))
            .toBe('Enquadramento perfeito! Pode gravar.');
    });

    it('fallback: chave ausente cai no inglês e depois no português', async () => {
        await i18n.carregarIdiomas();
        i18n.definirIdioma('ja-JP');
        // Chave existente no japonês:
        expect(i18n.t('verdict.perfect')).not.toBe('verdict.perfect');
        // Chave inexistente em todos: devolve o próprio caminho
        expect(i18n.t('chave.inexistente')).toBe('chave.inexistente');
    });

    it('definirIdioma aplica lang e dir (RTL em hebraico/árabe/persa)', async () => {
        await i18n.carregarIdiomas();
        expect(i18n.definirIdioma('he-IL')).toBe(true);
        expect(elementoHtml.lang).toBe('he-IL');
        expect(elementoHtml.dir).toBe('rtl');
        expect(i18n.definirIdioma('ar-SA')).toBe(true);
        expect(elementoHtml.dir).toBe('rtl');
        expect(i18n.definirIdioma('fa-IR')).toBe(true);
        expect(elementoHtml.dir).toBe('rtl');
        expect(i18n.definirIdioma('pt-BR')).toBe(true);
        expect(elementoHtml.dir).toBe('ltr');
    });

    it('definirIdioma recusa idioma inexistente', async () => {
        await i18n.carregarIdiomas();
        expect(i18n.definirIdioma('xx-XX')).toBe(false);
    });

    it('detectarIdiomaPadrao: exato, base, inglês e padrão do projeto', async () => {
        await i18n.carregarIdiomas();
        expect(i18n.detectarIdiomaPadrao(['en-GB', 'pt-BR'])).toBe('en-US');
        expect(i18n.detectarIdiomaPadrao(['pt-PT'])).toBe('pt-BR');
        expect(i18n.detectarIdiomaPadrao(['es-MX'])).toBe('es-ES');
        expect(i18n.detectarIdiomaPadrao(['ja'])).toBe('ja-JP');
        expect(i18n.detectarIdiomaPadrao(['da-DK', 'nb-NO'])).toBe('pt-BR');
        expect(i18n.detectarIdiomaPadrao([])).toBe('pt-BR');
    });

    it('listaIdiomas expõe 27 entradas com metadados', async () => {
        await i18n.carregarIdiomas();
        const lista = i18n.listaIdiomas();
        expect(lista.length).toBe(27);
        for (const item of lista) {
            expect(item.nativeName.length).toBeGreaterThan(1);
            expect(['ltr', 'rtl']).toContain(item.dir);
        }
    });

    it('pistasDeVoz devolve os nomes de voz do pacote', async () => {
        await i18n.carregarIdiomas();
        expect(i18n.pistasDeVoz('pt-BR')).toContain('Luciana');
        expect(i18n.pistasDeVoz('en-US').length).toBeGreaterThanOrEqual(4);
        expect(i18n.pistasDeVoz('xx-XX')).toEqual([]);
    });
});
