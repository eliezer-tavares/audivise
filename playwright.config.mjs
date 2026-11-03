// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0 — configuração do Playwright (E2E + a11y)
// CONTEXT / CONTEXTO: continuação do Projeto Integrador V (UNIVESP).
// Arquitetado por Eliezer Tavares de Oliveira. Licença: GPLv3.
// ===========================================================================
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 30_000,
    expect: { timeout: 7_000 },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: 'http://127.0.0.1:8500',
        // Determinismo: o app detecta o idioma do navegador no 1º uso; nos
        // testes o idioma inicial esperado é pt-BR (padrão do projeto).
        locale: 'pt-BR',
        trace: 'on-first-retry',
        // Câmera falsa: permite testar o fluxo "Iniciar Assistente" sem
        // hardware real (nenhum rosto existe no vídeo falso).
        launchOptions: {
            args: [
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
            ],
        },
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
        command: 'node servidor.js --porta 8500 --sem-navegador',
        url: 'http://127.0.0.1:8500/index.html',
        reuseExistingServer: !process.env.CI,
        timeout: 20_000,
    },
});
