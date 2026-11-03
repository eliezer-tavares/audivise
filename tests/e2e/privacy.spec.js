// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0 — E2E: privacidade por construção
// CONTEXT / CONTEXTO: continuação do Projeto Integrador V (UNIVESP).
// Arquitetado por Eliezer Tavares de Oliveira. Licença: GPLv3.
// ===========================================================================
// Intercepta TODA requisição da página e prova que nada sai da origem
// local: nenhuma CDN, nenhuma nuvem, nenhum domínio externo. Também roda o
// fluxo completo (câmera falsa + detecção + motor + configurações) sob
// interceptação, para cobrir caminhos alternativos.

import { test, expect } from '@playwright/test';

test.describe('privacidade: zero requisições externas', () => {
    test('nenhuma requisição fora de 127.0.0.1 durante carga e uso', async ({ page }) => {
        const externas = [];
        page.on('request', (pedido) => {
            const url = new URL(pedido.url());
            if (url.hostname !== '127.0.0.1') {
                externas.push(pedido.url());
            }
        });
        page.on('websocket', (ws) => {
            const url = new URL(ws.url());
            if (url.hostname !== '127.0.0.1') externas.push(ws.url());
        });

        await page.goto('/');
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');

        // Fluxo completo sob vigilância:
        await page.getByRole('button', { name: /Iniciar Assistente/ }).click();
        await expect(page.locator('#statusText')).toContainText('Câmera ligada');
        await page.getByRole('button', { name: /Parar Assistente/ }).click();
        await page.getByRole('button', { name: /Sobre o Audivise/ }).click();
        await page.getByRole('button', { name: /Idioma e Voz/ }).click();
        await page.locator('#interfaceLangSelect').selectOption('ja-JP');
        await page.locator('#voiceLangSelect').selectOption('fr-FR');
        await page.locator('#settingsCloseBtn').click();

        // Pipeline com foto (MediaPipe local carrega os binários embutidos)
        const detections = await page.evaluate(async () => {
            const r = await globalThis.__AUDIVISE_TESTE__
                .detectarEmImagem('/tests/fixtures/face-photo.jpg');
            return (r.detections || []).length;
        });
        expect(detections).toBeGreaterThan(0);

        expect(externas, `requisições externas: ${externas}`).toEqual([]);
    });

    test('o service worker só cacheia a origem local', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');
        // O registro do SW é assíncrono; aguarda existir:
        const registrado = await page.evaluate(async () => {
            for (let i = 0; i < 40; i++) {
                const r = await navigator.serviceWorker.getRegistration();
                if (r) return true;
                await new Promise((res) => setTimeout(res, 250));
            }
            return false;
        });
        expect(registrado).toBe(true);
        // O código do SW não contém origem externa:
        const sw = await page.evaluate(async () => {
            const resposta = await fetch('./service-worker.js');
            return resposta.text();
        });
        expect(sw).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
    });
});
