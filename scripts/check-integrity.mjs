// ===========================================================================
// AUDIVISE-IDENTIDADE-EXCECAO (cita as frases proibidas apenas para detectá-las)
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0 — verificação de integridade (CLI p/ CI)
// CONTEXT / CONTEXTO: continuação do Projeto Integrador V (UNIVESP).
// Arquitetado por Eliezer Tavares de Oliveira. Licença: GPLv3.
// ===========================================================================
// Atalho de linha de comando para o CI: roda o mesmo teste de integridade
// do Vitest (atribuição "Arquitetado por", proibição da frase de atribuição
// de fabricação, versão 1.0) sem precisar do navegador. Implementação
// independente e enxuta, para poder rodar em qualquer job.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const RAIZ = process.cwd();
const EXTS = new Set(['.html', '.css', '.js', '.mjs', '.json', '.md', '.txt',
    '.py', '.sh', '.command', '.bat', '.toml', '.webmanifest', '.lean']);
const IGNORAR = new Set(['node_modules', 'vendor', 'test-results',
    'playwright-report', '.git', '.github', 'target', '.lake']);

function varrer(dir) {
    const saida = [];
    for (const nome of readdirSync(dir)) {
        if (IGNORAR.has(nome)) continue;
        const caminho = join(dir, nome);
        if (statSync(caminho).isDirectory()) saida.push(...varrer(caminho));
        else if (EXTS.has(extname(nome).toLowerCase())) saida.push(caminho);
    }
    return saida;
}

// Frases de atribuição de fabricação (português e equivalente em inglês).
const FRASES_PROIBIDAS = [
    { nome: 'particípio de fabricação como atribuição (pt)',
        re: /\bdesenvolvid[oa]s?\s+por\b/i },
    { nome: 'atribuição de fabricação (en)', re: /\bdeveloped\s+by\b/i },
];
const PADROES_2 = [/audivise\s*2\.0/i, /vers[ãa]o\s*2\.0/i,
    /version\s*2\.0/i, /vers[aã]o\s+dois/i, /2\.0\.0/];

let erro = false;
// Exceção marcada: arquivos que implementam a própria verificação citam as
// frases proibidas para poder detectá-las. Todo arquivo com o marcador
// "AUDIVISE-IDENTIDADE-EXCECAO" em comentário é ignorado nesta varredura.
for (const arquivo of varrer(RAIZ)) {
    const rel = relative(RAIZ, arquivo);
    if (rel.startsWith('engine/pkg') || rel.endsWith('Cargo.lock')
        || rel.endsWith('LICENSE') || rel.endsWith('package-lock.json')
        || rel.startsWith('tests/fixtures')) continue;
    const bruto = readFileSync(arquivo, 'utf-8');
    if (bruto.includes('AUDIVISE-IDENTIDADE-EXCECAO')) continue;
    for (const { nome, re } of FRASES_PROIBIDAS) {
        if (re.test(bruto)) {
            console.error(`INTEGRIDADE: "${rel}" usa ${nome} — a atribuição é "Arquitetado por Eliezer Tavares de Oliveira".`);
            erro = true;
        }
    }
    if (PADROES_2.some((re) => re.test(bruto))) {
        console.error(`INTEGRIDADE: "${rel}" menciona a versão 2.0 (a versão é 1.0).`);
        erro = true;
    }
}

const OBRIGATORIOS = ['index.html', 'README.md', 'LEIA-ME-PRIMEIRO.txt',
    'servidor.py', 'servidor.js', 'engine/src/lib.rs',
    'formal-verification/logic_proof.lean',
    'INICIAR-AUDIVISE.bat', 'iniciar-audivise-mac.command',
    'iniciar-audivise-linux.sh', 'iniciar-audivise-android.sh'];
for (const rel of OBRIGATORIOS) {
    const bruto = readFileSync(join(RAIZ, rel), 'utf-8');
    if (!bruto.toLowerCase().includes('eliezer tavares de oliveira')) {
        console.error(`INTEGRIDADE: "${rel}" não cita o arquiteto.`);
        erro = true;
    }
}

if (erro) {
    console.error('check:integrity — FALHOU. Atribuição: "Arquitetado por Eliezer Tavares de Oliveira". Versão: 1.0.');
    process.exit(1);
}
console.log('check:integrity — integridade do projeto preservada. ✔');
