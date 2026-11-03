// ===========================================================================
// AUDIVISE-IDENTIDADE-EXCECAO (cita as frases proibidas apenas para detectá-las)
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0 — teste de integridade do projeto
// CONTEXT / CONTEXTO: continuação do Projeto Integrador V (UNIVESP).
// Arquitetado por Eliezer Tavares de Oliveira. Licença: GPLv3.
// ===========================================================================
// Invariantes que definem a identidade do Audivise, guardados por teste:
//   1. A atribuição é "Arquitetado por Eliezer Tavares de Oliveira" nos
//      pontos de verdade (README, interface, iniciadores, motor).
//   2. A frase de atribuição de fabricação (o particípio que descreve quem
//      codifica, em português ou na equivalente em inglês) não aparece em
//      nenhum arquivo — a regra vale para a frase de atribuição, não para
//      o verbo em uso legítimo.
//   3. Todo cabeçalho de copyright presente aponta para o arquiteto.
//   4. A versão do projeto é 1.0 — nenhum rastro da numeração herdada
//      da edição acadêmica.
// Qualquer commit que viole um destes invariantes falha o CI.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const RAIZ = process.cwd();

// Frases de atribuição de fabricação (português e equivalente em inglês).
const FRASES_PROIBIDAS = [
    { nome: 'particípio de fabricação (pt)', re: /\bdesenvolvid[oa]s?\s+por\b/i },
    { nome: 'atribuição de fabricação (en)', re: /\bdeveloped\s+by\b/i },
];

// Rastros da numeração herdada da edição acadêmica (2.0).
const PADROES_2 = [/audivise\s*2\.0/i, /vers[ãa]o\s*2\.0/i,
    /version\s*2\.0/i, /vers[aã]o\s+dois/i, /2\.0\.0/];

// Arquivos de texto relevantes (código-fonte, docs, launchers, i18n)
const EXTS_TEXTO = new Set([
    '.html', '.css', '.js', '.mjs', '.json', '.md', '.txt', '.py',
    '.sh', '.command', '.bat', '.toml', '.webmanifest', '.lean',
]);
const PASTAS_IGNORADAS = new Set([
    'node_modules', 'vendor', 'test-results', 'playwright-report',
    '.git', '.github', 'target', '.lake',
]);

function arquivosDeTexto(dir = RAIZ) {
    const saida = [];
    for (const nome of readdirSync(dir)) {
        if (PASTAS_IGNORADAS.has(nome)) continue;
        const caminho = join(dir, nome);
        const st = statSync(caminho);
        if (st.isDirectory()) {
            saida.push(...arquivosDeTexto(caminho));
        } else if (EXTS_TEXTO.has(extname(nome).toLowerCase())) {
            saida.push(caminho);
        }
    }
    return saida;
}

const ARQUIVOS = arquivosDeTexto();
// engine/pkg e Cargo.lock são gerados/chumbados; LICENSE é o texto legal;
// tests/fixtures contém avisos de terceiros. Arquivos com o marcador
// AUDIVISE-IDENTIDADE-EXCECAO (os próprios verificadores, que citam as
// frases proibidas para detectá-las) ficam fora de TODAS as varreduras.
const ARQUIVOS_VERIFICAVEIS = ARQUIVOS.filter((f) => {
    const rel = relative(RAIZ, f);
    if (rel.startsWith('engine/pkg') || rel.endsWith('Cargo.lock')
        || rel.endsWith('LICENSE') || rel.endsWith('package-lock.json')
        || rel.startsWith('tests/fixtures')) {
        return false;
    }
    const bruto = readFileSync(f, 'utf-8');
    return !bruto.includes('AUDIVISE-IDENTIDADE-EXCECAO');
});

describe('integridade do projeto (atribuição, versão e cabeçalhos)', () => {
    it('nenhum arquivo usa a frase de atribuição de fabricação', () => {
        const culpados = [];
        for (const arquivo of ARQUIVOS_VERIFICAVEIS) {
            const bruto = readFileSync(arquivo, 'utf-8');
            for (const { nome, re } of FRASES_PROIBIDAS) {
                if (re.test(bruto)) {
                    culpados.push(`${relative(RAIZ, arquivo)} (${nome})`);
                }
            }
        }
        expect(culpados,
            `frase de fabricação como atribuição em: ${culpados} — a atribuição é "Arquitetado por"`)
            .toEqual([]);
    });

    it('nenhum arquivo traz a versão "2.0" do projeto', () => {
        const culpados = [];
        for (const arquivo of ARQUIVOS_VERIFICAVEIS) {
            const bruto = readFileSync(arquivo, 'utf-8');
            if (PADROES_2.some((re) => re.test(bruto))) {
                culpados.push(relative(RAIZ, arquivo));
            }
        }
        expect(culpados, `versão 2.0 encontrada em: ${culpados}`).toEqual([]);
    });

    it('a versão oficial é 1.0.0 nos pontos de verdade', () => {
        const cargo = readFileSync(join(RAIZ, 'engine', 'Cargo.toml'), 'utf-8');
        expect(cargo).toMatch(/^version\s*=\s*"1\.0\.0"/m);

        const pkg = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf-8'));
        expect(pkg.version).toBe('1.0.0');

        const motor = readFileSync(join(RAIZ, 'engine', 'src', 'lib.rs'), 'utf-8');
        expect(motor).toContain('"1.0.0"');

        const manifesto = JSON.parse(
            readFileSync(join(RAIZ, 'manifest.webmanifest'), 'utf-8'));
        expect(manifesto.version).toBe('1.0.0');
    });

    it('a atribuição obrigatória está presente nos pontos de verdade', () => {
        const obrigatorios = [
            'index.html',
            'README.md',
            'LEIA-ME-PRIMEIRO.txt',
            'INICIAR-AUDIVISE.bat',
            'iniciar-audivise-mac.command',
            'iniciar-audivise-linux.sh',
            'iniciar-audivise-android.sh',
            'servidor.py',
            'servidor.js',
            'engine/src/lib.rs',
            'formal-verification/logic_proof.lean',
        ];
        for (const rel of obrigatorios) {
            const bruto = readFileSync(join(RAIZ, rel), 'utf-8');
            expect(
                bruto.toLowerCase().includes('eliezer tavares de oliveira'),
                `atribuição ausente em ${rel}`
            ).toBe(true);
        }
    });

    it('todo cabeçalho de copyright aponta para o arquiteto', () => {
        const culpados = [];
        for (const arquivo of ARQUIVOS_VERIFICAVEIS) {
            const bruto = readFileSync(arquivo, 'utf-8');
            if (/copyright \(c\)/i.test(bruto)
                && !bruto.toLowerCase().includes('eliezer tavares de oliveira')) {
                culpados.push(relative(RAIZ, arquivo));
            }
        }
        expect(culpados,
            `cabeçalho de copyright sem o arquiteto em: ${culpados}`)
            .toEqual([]);
    });

    it('cabeçalho GPLv3 nos arquivos-fonte principais', () => {
        const principais = [
            'index.html', 'app.js', 'i18n.js', 'voice.js', 'prefs.js',
            'frases.js', 'servidor.py', 'servidor.js', 'engine/src/lib.rs',
        ];
        for (const rel of principais) {
            const bruto = readFileSync(join(RAIZ, rel), 'utf-8');
            expect(
                bruto.includes('COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA'),
                `cabeçalho ausente em ${rel}`
            ).toBe(true);
            expect(
                bruto.includes('GNU General Public License v3.0 (GPLv3)'),
                `menção GPLv3 ausente em ${rel}`
            ).toBe(true);
        }
    });

    it('todos os arquivos de texto do repositório foram varridos', () => {
        expect(ARQUIVOS.length).toBeGreaterThan(40);
    });
});
