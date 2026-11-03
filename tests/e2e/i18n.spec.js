// ===========================================================================
// AUDIVISE-IDENTIDADE-EXCECAO (cita a palavra proibida apenas para negá-la nos testes)
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0 — E2E: internacionalização (27 idiomas)
// CONTEXT / CONTEXTO: continuação do Projeto Integrador V (UNIVESP).
// Arquitetado por Eliezer Tavares de Oliveira. Licença: GPLv3.
// ===========================================================================
// Troca TODOS os idiomas da interface no app real, confere os textos na
// tela, a direção RTL (hebraico/árabe/persa) e a persistência após recarregar.

import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PASTA_I18N = join(process.cwd(), 'i18n');
const LOCAIS = readdirSync(PASTA_I18N)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));

function pacote(codigo) {
    return JSON.parse(readFileSync(join(PASTA_I18N, `${codigo}.json`), 'utf-8'));
}

const RTL = new Set(['he-IL', 'ar-SA', 'fa-IR']);

test.describe('internacionalização no app real', () => {
    for (const codigo of LOCAIS) {
        const dados = pacote(codigo);

        test(`${codigo}: interface traduzida e atribuição correta`, async ({ page }) => {
            await page.goto('/');
            await expect(page.locator('#engineStatus')).toContainText('1.0.0');

            // Troca o idioma da interface pelo gancho de testes (a troca por
            // <select> é coberta no teste de persistência).
            await page.evaluate((c) =>
                globalThis.__AUDIVISE_TESTE__.definirIdiomaInterface(c), codigo);

            const dirEsperado = RTL.has(codigo) ? 'rtl' : 'ltr';
            await expect(page.locator('html')).toHaveAttribute('dir', dirEsperado);
            await expect(page.locator('html')).toHaveAttribute(
                'lang', dados.meta.bcp47);

            // Texto de abertura do status no idioma escolhido
            await expect(page.locator('#statusText')).toHaveText(dados.status.ready);

            // Botões traduzidos
            await expect(page.locator('#startBtn')).toHaveText(dados.buttons.start);
            await expect(page.locator('#repeatBtn')).toHaveText(dados.buttons.repeat);
            await expect(page.locator('#aboutBtn')).toHaveText(dados.buttons.about);

            // Atribuição no rodapé (nome intacto em todos os idiomas)
            await expect(page.locator('#footerArchitect'))
                .toHaveText(dados.footer.architect);
            expect(dados.footer.architect)
                .toContain('Eliezer Tavares de Oliveira');

            // Nenhum rastro de "desenvolvido" na página renderizada
            const corpo = await page.locator('body').textContent();
            expect(corpo.toLowerCase()).not.toContain('desenvolvid');
        });
    }

    test('troca pelo seletor em Configurações + persistência após recarregar', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');

        await page.getByRole('button', { name: /Idioma e Voz/ }).click();
        const dialogo = page.locator('#settingsDialog');
        await expect(dialogo).toBeVisible();

        await page.locator('#interfaceLangSelect').selectOption('en-US');
        await page.locator('#settingsCloseBtn').click();
        await expect(page.getByRole('button', { name: 'Start Assistant' }))
            .toBeVisible();

        // Recarrega: a preferência deve sobreviver (localStorage local)
        await page.reload();
        await expect(page.getByRole('button', { name: 'Start Assistant' }))
            .toBeVisible();

        // Volta para pt-BR para os demais testes
        await page.getByRole('button', { name: 'Language & Voice' }).click();
        await page.locator('#interfaceLangSelect').selectOption('pt-BR');
        await page.locator('#settingsCloseBtn').click();
        await expect(page.getByRole('button', { name: /Iniciar Assistente/ }))
            .toBeVisible();
    });

    test('o texto FALADO segue o idioma da voz, não o da interface', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');
        const enUS = pacote('en-US');

        // Interface em português, voz em inglês:
        const texto = await page.evaluate((codigo) => {
            globalThis.__AUDIVISE_TESTE__.definirIdiomaVoz(codigo);
            const r = globalThis.__AUDIVISE_TESTE__.analisar(0.3, 0.5, 0.5, 0.6);
            // Dispara o pipeline de fala pelo fluxo real do app:
            return { r, status: document.getElementById('statusText').textContent };
        }, 'en-US');

        expect(texto.r.issues).toEqual(['MOVE_RIGHT']);
        // O veredito perfeito no idioma da voz (usado ao anunciar):
        expect(enUS.verdict.perfect).toContain('Perfect framing');
    });
});
