// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0 — E2E: seleção de voz e aviso 1º uso
// CONTEXT / CONTEXTO: continuação do Projeto Integrador V (UNIVESP).
// Arquitetado por Eliezer Tavares de Oliveira. Licença: GPLv3.
// ===========================================================================
// Com o Web Speech API simulado, prova as regras de voz do Audivise:
//   • sem voz no sistema → aviso de instalação no primeiro uso;
//   • o aviso aparece UMA vez por idioma (não reaparece para o mesmo);
//   • idioma novo sem voz → aviso novo;
//   • voz instalada depois → "Verificar novamente" fecha o aviso;
//   • com voz já instalada → nenhum aviso.

import { test, expect } from '@playwright/test';

// Sistema SEM vozes (o usuário ainda não instalou nada)
test.describe('sistema sem vozes instaladas', () => {
    test.use({
        contextOptions: undefined,
    });

    test.beforeEach(async ({ context }) => {
        await context.addInitScript(() => {
            const ouvintes = [];
            globalThis.__AUdiviseOuvintes = ouvintes;
            // window.speechSynthesis é um accessor só-leitura no Chrome:
            // atribuição simples é silenciosamente ignorada; só defineProperty
            // substitui o objeto real (que no headless vem sem voz alguma).
            Object.defineProperty(globalThis, 'speechSynthesis', {
                configurable: true,
                writable: true,
                value: {
                    getVoices: () => globalThis.__VozesSimuladas || [],
                    addEventListener: (t, fn) => ouvintes.push(fn),
                    removeEventListener: () => {},
                    dispatchEvent: () => {},
                    cancel: () => {},
                    speak: (u) => { setTimeout(() => u.onend && u.onend(), 0); },
                },
            });
            globalThis.__VozesSimuladas = [];
            globalThis.SpeechSynthesisUtterance = class {
                constructor(t) { this.text = t; }
            };
            globalThis.__adicionarVozSimulada = (nome, lang) => {
                globalThis.__VozesSimuladas.push({
                    name: nome, lang, localService: true,
                    voiceURI: `sim-${nome}`,
                });
                ouvintes.forEach((fn) => fn());
            };
        });
    });

    test('primeiro uso sem voz → aviso de instalação (uma vez por idioma)', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');
        await expect(page.locator('#voiceInstallDialog')).toBeVisible({
            timeout: 10_000,
        });
        // O intro cita o idioma atual (pt-BR)
        await expect(page.locator('#voiceInstallIntro')).toContainText('Português');

        // Fecha: não reaparece para o mesmo idioma
        await page.locator('#voiceOkBtn').click();
        await expect(page.locator('#voiceInstallDialog')).not.toBeVisible();
        await page.reload();
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');
        await page.waitForTimeout(3_000);
        await expect(page.locator('#voiceInstallDialog')).not.toBeVisible();
    });

    test('idioma novo sem voz → aviso de novo; "Verificar novamente" resolve', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#voiceInstallDialog')).toBeVisible({
            timeout: 10_000,
        });
        await page.locator('#voiceOkBtn').click();

        // Usuário escolhe um idioma da voz sem voz instalada:
        await page.getByRole('button', { name: /Idioma e Voz/ }).click();
        await page.locator('#voiceLangSelect').selectOption('ko-KR');
        await page.locator('#settingsCloseBtn').click();
        await expect(page.locator('#voiceInstallDialog')).toBeVisible();
        await expect(page.locator('#voiceInstallIntro')).toContainText('한국어');

        // Uma voz coreana "é instalada" no sistema; reavaliar fecha o aviso:
        await page.evaluate(() =>
            globalThis.__adicionarVozSimulada('Google 한국어', 'ko-KR'));
        await page.locator('#voiceRecheckBtn').click();
        await expect(page.locator('#voiceInstallDialog')).not.toBeVisible();
    });

    test('seletor de voz lista apenas vozes do idioma da voz escolhido', async ({ page }) => {
        // Vozes presentes ANTES do app carregar. (page.evaluate antes do
        // goto executaria no about:blank e o estado se perderia na navegação.)
        await page.addInitScript(() => {
            globalThis.__VozesSimuladas = [
                { name: 'Luciana', lang: 'pt-BR', localService: true,
                    voiceURI: 'sim-Luciana' },
                { name: 'Google 日本語', lang: 'ja-JP', localService: true,
                    voiceURI: 'sim-Google 日本語' },
            ];
        });
        await page.goto('/');
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');
        await page.getByRole('button', { name: /Idioma e Voz/ }).click();

        // pt-BR (padrão herdado da interface): só Luciana
        await expect(page.locator('#voiceSelect option')).toHaveText([
            /Voz padrão do sistema/,
            /Luciana/,
        ]);

        // Trocando para japonês: só a voz japonesa
        await page.locator('#voiceLangSelect').selectOption('ja-JP');
        await expect(page.locator('#voiceSelect option')).toHaveText([
            /Voz padrão do sistema/,
            /Google 日本語/,
        ]);
        await page.locator('#settingsCloseBtn').click();
    });
});

// Sistema JÁ COM voz pt-BR instalada
test.describe('sistema com voz instalada', () => {
    test('nenhum aviso de instalação no primeiro uso', async ({ page }) => {
        await page.addInitScript(() => {
            const ouvintes = [];
            // defineProperty: ver nota no beforeEach do contexto acima.
            Object.defineProperty(globalThis, 'speechSynthesis', {
                configurable: true,
                writable: true,
                value: {
                    getVoices: () => [{
                        name: 'Luciana', lang: 'pt-BR', localService: true,
                        voiceURI: 'luciana',
                    }],
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
        await page.waitForTimeout(3_200);
        await expect(page.locator('#voiceInstallDialog')).not.toBeVisible();

        // E o teste de voz sintetiza com a voz escolhida:
        await page.getByRole('button', { name: /Idioma e Voz/ }).click();
        await expect(page.locator('#voiceSelect option')).toHaveText([
            /Voz padrão do sistema/,
            /Luciana/,
        ]);
        await page.locator('#testVoiceBtn').click(); // não deve lançar erro
        await page.locator('#settingsCloseBtn').click();
    });
});
