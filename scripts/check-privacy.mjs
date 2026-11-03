// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0 — verificação estática de privacidade
// AUDIVISE-IDENTIDADE-EXCECAO (este arquivo cita palavras proibidas apenas
// dentro das expressões regulares que as detectam)
// CONTEXT / CONTEXTO: continuação do Projeto Integrador V (UNIVESP).
// Arquitetado por Eliezer Tavares de Oliveira. Licença: GPLv3.
// ===========================================================================
// Varre o código do app em busca de QUALQUER chamada que possa sair para a
// internet (script externo, fetch, XHR, WebSocket, sendBeacon, import de
// URL). Privacidade por construção é verificada aqui E em runtime
// (tests/e2e/privacy.spec.js). Sai com código 1 se encontrar algo.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ALVOS = [
    'index.html', 'app.js', 'i18n.js', 'voice.js', 'prefs.js', 'frases.js',
    'styles.css', 'service-worker.js', 'manifest.webmanifest',
];

const PADROES_PERIGOSOS = [
    { nome: 'script/fonte externa', re: /<script[^>]+src=["']https?:/i },
    { nome: 'link externo carregável', re: /<link[^>]+href=["']https?:/i },
    { nome: 'fetch para URL absoluta', re: /fetch\(\s*["']https?:/i },
    { nome: 'XMLHttpRequest', re: /new\s+XMLHttpRequest/i },
    { nome: 'WebSocket', re: /new\s+WebSocket\s*\(/i },
    { nome: 'sendBeacon', re: /navigator\.sendBeacon/i },
    { nome: 'import dinâmico de URL', re: /import\(\s*["']https?:/i },
    { nome: 'URL absoluto em código', re: /["']https?:\/\/(?!www\.w3\.org\/2000\/svg)/i },
];

let falhas = 0;
for (const alvo of ALVOS) {
    const bruto = readFileSync(join(process.cwd(), alvo), 'utf-8');
    for (const { nome, re } of PADROES_PERIGOSOS) {
        const m = bruto.match(re);
        if (m) {
            console.error(`FALHA: ${alvo} — ${nome} → ${m[0].slice(0, 80)}`);
            falhas += 1;
        }
    }
}

// O service worker e os ícones SVG embutidos podem citar xmlns (W3C) —
// exceção já tratada acima. O MediaPipe fica em vendor/ e é verificado em
// runtime pelo E2E de privacidade (interceptação de todas as requisições).

if (falhas > 0) {
    console.error(`\ncheck:privacy — ${falhas} violação(ões). O Audivise é 100% local por construção.`);
    process.exit(1);
}
console.log('check:privacy — nenhuma chamada externa no código do app. ✔');
