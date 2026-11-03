// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0 — E2E: acessibilidade (axe-core / WCAG)
// CONTEXT / CONTEXTO: continuação do Projeto Integrador V (UNIVESP).
// Arquitetado por Eliezer Tavares de Oliveira. Licença: GPLv3.
// ===========================================================================
// Auditoria automática de acessibilidade com axe-core sobre os estados
// principais do app, em três idiomas (LTR, RTL e o idioma de origem):
// página inicial, diálogo de configurações e diálogo de instalação de voz.
// Regras: violações "serious" e "critical" falham o teste.

import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const CAMINHO_AXE = require.resolve('axe-core/axe.min.js');

async function escanear(page) {
    await page.addScriptTag({ path: CAMINHO_AXE });
    const resultado = await page.evaluate(async () => {
        const axe = globalThis.axe;
        axe.configure({
            rules: [
                // O vídeo é decorativo (sem controles) e a página é
                // essencialmente de áudio; mantemos o restante estrito.
                { id: 'region', enabled: false },
            ],
        });
        return axe.run(document, {
            resultTypes: ['violations'],
        });
    });
    const graves = resultado.violations.filter((v) =>
        ['serious', 'critical'].includes(v.impact));
    return { graves, total: resultado.violations };
}

function resumo(violacoes) {
    return violacoes
        .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nó(s) — ${v.help}`)
        .join('\n');
}

test.describe('acessibilidade (axe-core)', () => {
    test('página inicial em pt-BR sem violações graves', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');
        const { graves, total } = await escanear(page);
        expect(graves, resumo(graves) || `violations: ${total.length}`).toEqual([]);
    });

    test('página inicial em inglês sem violações graves', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');
        await page.evaluate(() =>
            globalThis.__AUDIVISE_TESTE__.definirIdiomaInterface('en-US'));
        const { graves } = await escanear(page);
        expect(graves, resumo(graves)).toEqual([]);
    });

    test('página em árabe (RTL) sem violações graves', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');
        await page.evaluate(() =>
            globalThis.__AUDIVISE_TESTE__.definirIdiomaInterface('ar-SA'));
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
        const { graves } = await escanear(page);
        expect(graves, resumo(graves)).toEqual([]);
    });

    test('diálogo de configurações sem violações graves', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');
        await page.getByRole('button', { name: /Idioma e Voz/ }).click();
        await expect(page.locator('#settingsDialog')).toBeVisible();
        const { graves } = await escanear(page);
        expect(graves, resumo(graves)).toEqual([]);

        // O diálogo é modal: o foco deve estar dentro dele
        const focoDentro = await page.evaluate(() =>
            document.getElementById('settingsDialog').contains(
                document.activeElement));
        expect(focoDentro).toBe(true);
        // Esc fecha e devolve o foco
        await page.keyboard.press('Escape');
        await expect(page.locator('#settingsDialog')).not.toBeVisible();
    });

    test('diálogo de instalação de voz sem violações graves', async ({ page }) => {
        // Contexto sem NENHUMA voz instalada (sistema do usuário vazio):
        await page.addInitScript(() => {
            const ouvintes = [];
            // defineProperty: window.speechSynthesis é accessor só-leitura
            // no Chrome; atribuição simples seria silenciosamente ignorada.
            Object.defineProperty(globalThis, 'speechSynthesis', {
                configurable: true,
                writable: true,
                value: {
                    getVoices: () => [],
                    addEventListener: (t, fn) => ouvintes.push(fn),
                    removeEventListener: () => {},
                    dispatchEvent: () => {},
                    cancel: () => {},
                    speak: (u) => { setTimeout(() => u.onend && u.onend(), 0); },
                },
            });
            globalThis.SpeechSynthesisUtterance = class {
                constructor(t) { this.text = t; }
            };
        });
        await page.goto('/');
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');
        // O aviso aparece no primeiro uso (a lista de vozes é confirmada
        // após ~2,5 s nos navegadores que carregam vozes de forma assíncrona)
        await expect(page.locator('#voiceInstallDialog')).toBeVisible({
            timeout: 10_000,
        });
        const { graves } = await escanear(page);
        expect(graves, resumo(graves)).toEqual([]);

        // "Entendi" fecha e marca como visto (não reaparece ao recarregar)
        await page.locator('#voiceOkBtn').click();
        await expect(page.locator('#voiceInstallDialog')).not.toBeVisible();
        await page.reload();
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');
        await page.waitForTimeout(3_000);
        await expect(page.locator('#voiceInstallDialog')).not.toBeVisible();
    });

    test('contraste dos textos de status atende WCAG AA', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');
        // axe já cobre contraste na varredura acima; aqui garantimos os
        // estados de cor de erro também serem auditados:
        await page.evaluate(() => {
            const el = document.getElementById('engineStatus');
            el.classList.add('erro');
            el.textContent = 'Estado de erro de teste.';
        });
        const { graves } = await escanear(page);
        expect(graves, resumo(graves)).toEqual([]);
    });
});
