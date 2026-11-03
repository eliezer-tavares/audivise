// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0
// CONTEXT / CONTEXTO:
//   Continuação do Projeto Integrador V - Engenharia de Computação (UNIVESP).
//   Projeto pessoal e não acadêmico.
//   Arquitetado por Eliezer Tavares de Oliveira.
// LICENSE / LICENÇA: GNU General Public License v3.0 (GPLv3)
// ===========================================================================
// Service worker do Audivise: garante que o app funcione 100% offline
// depois da primeira abertura (útil no Android, onde o usuário instala o
// Audivise pela opção "Adicionar à tela inicial"). Ele cacheia SOMENTE os
// arquivos locais deste pacote e nunca contata rede externa alguma:
// nenhuma busca sai da origem local.

const CACHE = 'audivise-1.0.0';

const ARQUIVOS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './i18n.js',
    './voice.js',
    './prefs.js',
    './manifest.webmanifest',
    // Motor de decisão (Rust → WebAssembly)
    './engine/pkg/audivise_engine.js',
    './engine/pkg/audivise_engine_bg.wasm',
    // Detecção facial embutida (MediaPipe + modelo)
    './vendor/mediapipe/camera_utils.js',
    './vendor/mediapipe/face_detection.js',
    './vendor/mediapipe/face_detection_solution_simd_wasm_bin.js',
    './vendor/mediapipe/face_detection_solution_simd_wasm_bin.wasm',
    './vendor/mediapipe/face_detection_solution_wasm_bin.js',
    './vendor/mediapipe/face_detection_solution_wasm_bin.wasm',
    './vendor/mediapipe/face_detection_short.binarypb',
    './vendor/mediapipe/face_detection_short_range.tflite',
    // Identidade visual
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png',
];

// Os pacotes de idioma são descobertos dinamicamente para evitar
// duplicação manual da lista (fonte única de verdade em i18n.js).
async function incluirIdiomas(cache) {
    for (let codigo of [
        'pt-BR', 'en-US', 'es-ES', 'fr-FR', 'it-IT', 'de-DE', 'nl-NL',
        'pl-PL', 'ro-RO', 'cs-CZ', 'uk-UA', 'sv-SE', 'hu-HU', 'sr-RS',
        'sw-KE', 'he-IL', 'ar-SA', 'zh-CN', 'ru-RU', 'hi-IN', 'ja-JP',
        'ko-KR', 'id-ID', 'fa-IR', 'tr-TR', 'vi-VN', 'th-TH',
    ]) {
        try {
            await cache.add(`./i18n/${codigo}.json`);
        } catch (e) { /* arquivo ausente: segue sem ele */ }
    }
}

self.addEventListener('install', (evento) => {
    evento.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        await Promise.all(ARQUIVOS.map((c) => cache.add(c).catch(() => {})));
        await incluirIdiomas(cache);
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (evento) => {
    evento.waitUntil((async () => {
        const nomes = await caches.keys();
        await Promise.all(
            nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))
        );
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (evento) => {
    // Estratégia: cache primeiro, rede local como reserva. Requisições
    // cross-origin (que nunca deveriam existir) não são interceptadas
    // com benefício algum — respondem normalmente e ficam fora do cache.
    const pedido = evento.request;
    if (pedido.method !== 'GET') return;
    evento.respondWith((async () => {
        const cache = await caches.open(CACHE);
        const doCache = await cache.match(pedido, { ignoreSearch: true });
        if (doCache) return doCache;
        try {
            const daRede = await fetch(pedido);
            if (daRede.ok && new URL(pedido.url).origin === self.location.origin) {
                cache.put(pedido, daRede.clone());
            }
            return daRede;
        } catch (e) {
            const indice = await cache.match('./index.html');
            return indice || Response.error();
        }
    })());
});
