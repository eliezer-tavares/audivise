// ===========================================================================
// AUDIVISE-IDENTIDADE-EXCECAO (cita a palavra proibida apenas para negá-la nos testes)
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0 — E2E: aplicação e motor no navegador
// CONTEXT / CONTEXTO: continuação do Projeto Integrador V (UNIVESP).
// Arquitetado por Eliezer Tavares de Oliveira. Licença: GPLv3.
// ===========================================================================
// Testa o app real em Chromium headless: carga do motor Rust/WebAssembly,
// contrato JSON, os 10 casos de julgamento do PI-V executados NO WASM,
// botões, fluxo da câmera falsa e o pipeline completo MediaPipe → motor
// com uma foto de rosto (tudo local, sem rede).

import { test, expect } from '@playwright/test';

const URL_FIXTURE = 'http://127.0.0.1:8500/tests/fixtures/face-photo.jpg';

// Os 10 casos de julgamento do PI-V (idênticos aos testes nativos em Rust)
const CASOS_PI_V = [
    { nome: 'centro perfeito', x: 0.5, y: 0.5, w: 0.5, h: 0.6,
      perfeito: true, issues: [] },
    { nome: 'à esquerda', x: 0.3, y: 0.5, w: 0.5, h: 0.6,
      perfeito: false, issues: ['MOVE_RIGHT'] },
    { nome: 'à direita', x: 0.7, y: 0.5, w: 0.5, h: 0.6,
      perfeito: false, issues: ['MOVE_LEFT'] },
    { nome: 'alto demais', x: 0.5, y: 0.2, w: 0.5, h: 0.6,
      perfeito: false, issues: ['LOWER_CAMERA'] },
    { nome: 'baixo demais', x: 0.5, y: 0.8, w: 0.5, h: 0.6,
      perfeito: false, issues: ['RAISE_CAMERA'] },
    { nome: 'longe demais', x: 0.5, y: 0.5, w: 0.1, h: 0.1,
      perfeito: false, issues: ['MOVE_CLOSER'] },
    { nome: 'perto demais', x: 0.5, y: 0.5, w: 0.7, h: 0.6,
      perfeito: false, issues: ['MOVE_AWAY'] },
    { nome: 'três defeitos na ordem X,Y,Área', x: 0.2, y: 0.9, w: 0.05, h: 0.05,
      perfeito: false, issues: ['MOVE_RIGHT', 'RAISE_CAMERA', 'MOVE_CLOSER'] },
    { nome: 'fronteiras não disparam', x: 0.4, y: 0.35, w: 0.2, h: 0.5,
      perfeito: true, issues: [] },
    // Paridade com o caso_10 nativo (Rust): NaN vira 0 no eixo e, com
    // w/h reduzidos, a área também dispara MOVE_CLOSER.
    { nome: 'NaN normalizado', x: NaN, y: NaN, w: 0.05, h: 0.05,
      perfeito: false, issues: ['MOVE_RIGHT', 'LOWER_CAMERA', 'MOVE_CLOSER'] },
];

test.describe('motor Rust/WebAssembly no navegador', () => {
    test('carrega o motor e mostra a versão 1.0.0', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#engineStatus')).toContainText('1.0.0', {
            timeout: 15_000,
        });
        const versao = await page.evaluate(() => globalThis.__AUDIVISE_TESTE__.versao());
        expect(versao).toBe('1.0.0');
    });

    test('info_motor expõe os limiares oficiais do PI-V', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');
        const info = await page.evaluate(() => globalThis.__AUDIVISE_TESTE__.info());
        expect(info.limiares).toEqual({
            x_esquerdo: 0.4, x_direito: 0.6,
            y_superior: 0.35, y_inferior: 0.65,
            area_minima: 0.1, area_maxima: 0.35,
        });
        expect(info.rede).toBe('nenhuma');
    });

    for (const caso of CASOS_PI_V) {
        test(`PI-V: ${caso.nome}`, async ({ page }) => {
            await page.goto('/');
            await expect(page.locator('#engineStatus')).toContainText('1.0.0');
            const data = await page.evaluate(([x, y, w, h]) =>
                globalThis.__AUDIVISE_TESTE__.analisar(x, y, w, h),
            [caso.x, caso.y, caso.w, caso.h]);
            expect(data.is_perfect).toBe(caso.perfeito);
            expect(data.issues).toEqual(caso.issues);
            expect(data.verdict).toBe(caso.perfeito ? 'PERFECT' : 'ADJUST');
            // Contrato da v0.x preservado:
            expect(typeof data.message).toBe('string');
            expect(data.message.length).toBeGreaterThan(0);
            expect(data.debug).toHaveProperty('area');
        });
    }

    test('pipeline completo: foto de rosto → MediaPipe → motor', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');
        const detections = await page.evaluate(async (url) => {
            const resultados = await globalThis.__AUDIVISE_TESTE__
                .detectarEmImagem(url);
            return (resultados.detections || []).map((d) => ({
                xCenter: d.boundingBox.xCenter,
                yCenter: d.boundingBox.yCenter,
                width: d.boundingBox.width,
                height: d.boundingBox.height,
            }));
        }, URL_FIXTURE);

        // A fixture é um retrato frontal: o MediaPipe local DEVE detectar.
        expect(detections.length).toBeGreaterThan(0);
        const rosto = detections[0];
        expect(rosto.xCenter).toBeGreaterThan(0);
        expect(rosto.xCenter).toBeLessThan(1);

        // As coordenadas detectadas alimentam o motor real:
        const veredito = await page.evaluate(([x, y, w, h]) =>
            globalThis.__AUDIVISE_TESTE__.analisar(x, y, w, h),
        [rosto.xCenter, rosto.yCenter, rosto.width, rosto.height]);
        expect(['PERFECT', 'ADJUST']).toContain(veredito.verdict);
        expect(Array.isArray(veredito.issues)).toBe(true);
    });
});

test.describe('interface e acessibilidade básica', () => {
    test('botões com nomes acessíveis e rótulos do PI-V', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('button', { name: /Iniciar Assistente/ }))
            .toBeVisible();
        await expect(page.getByRole('button', { name: /Repetir/ })).toBeVisible();
        await expect(page.getByRole('button', { name: /Sobre o Audivise/ }))
            .toBeVisible();
        await expect(page.getByRole('button', { name: /Idioma e Voz/ }))
            .toBeVisible();
        // statusText é região viva assertiva
        await expect(page.locator('#statusText')).toHaveAttribute(
            'aria-live', 'assertive');
    });

    test('Sobre narra a história (PI-V → projeto pessoal) e o rodapé cita o arquiteto', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: /Sobre o Audivise/ }).click();
        await expect(page.locator('#statusText')).toContainText(
            'Projeto Integrador V');
        await expect(page.locator('#footerArchitect')).toContainText(
            'Eliezer Tavares de Oliveira');
        await expect(page.locator('footer')).not.toContainText('desenvolvid');
    });

    test('Iniciar Assistente com câmera falsa anuncia "Câmera ligada"', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#engineStatus')).toContainText('1.0.0');
        await page.getByRole('button', { name: /Iniciar Assistente/ }).click();
        await expect(page.locator('#statusText')).toContainText('Câmera ligada');
        // O botão alterna para "Parar Assistente"
        await expect(page.getByRole('button', { name: /Parar Assistente/ }))
            .toBeVisible();
        await page.getByRole('button', { name: /Parar Assistente/ }).click();
        await expect(page.locator('#statusText')).toContainText('interrompido');
    });

    test('Repetir Última Orientação reapresenta o texto', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: /Sobre o Audivise/ }).click();
        const anterior = await page.locator('#statusText').textContent();
        await page.getByRole('button', { name: /Repetir Última Orientação/ })
            .click();
        await expect(page.locator('#statusText')).toHaveText(anterior);
    });

    test('navegação por teclado alcança todos os botões', async ({ page }) => {
        await page.goto('/');
        await page.keyboard.press('Tab'); // start
        await page.keyboard.press('Tab'); // repeat
        await page.keyboard.press('Tab'); // camera
        await page.keyboard.press('Tab'); // about
        const focado = await page.evaluate(() =>
            document.activeElement && document.activeElement.id);
        expect(['aboutBtn', 'settingsBtn']).toContain(focado);
    });
});

test.describe('abertura pelo disco (file://)', () => {
    test('avisa que precisa do iniciador local', async ({ page }) => {
        // O Playwright serve a página de um caminho real do disco:
        const { rootDir } = { rootDir: process.cwd() };
        await page.goto(`file://${rootDir}/index.html`);
        await expect(page.locator('#engineStatus')).toContainText(
            'INICIAR-AUDIVISE');
        // O módulo do motor não carrega em file:// (CORS do navegador) e o
        // app deve continuar mostrando a orientação sem travar.
        await expect(page.locator('#startBtn')).toBeVisible();
    });
});
