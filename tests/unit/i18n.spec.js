// ===========================================================================
// AUDIVISE-IDENTIDADE-EXCECAO (cita a palavra proibida apenas para detectá-la)
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0 — testes unitários do i18n (arquivos)
// CONTEXT / CONTEXTO: continuação do Projeto Integrador V (UNIVESP).
// Arquitetado por Eliezer Tavares de Oliveira. Licença: GPLv3.
// ===========================================================================
// Garante a integridade dos 27 pacotes de idioma: mesma estrutura de
// chaves, direção de texto correta (RTL para hebraico, árabe e persa),
// placeholders preservados, pistas de voz presentes e a regra de atribuição
// ("Arquitetado por", jamais a frase de atribuição de fabricação).

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const PASTA = join(process.cwd(), 'i18n');
const ARQUIVOS = readdirSync(PASTA).filter((f) => f.endsWith('.json'));

const RTL_ESPERADO = new Set(['he-IL', 'ar-SA', 'fa-IR']);

const PLACEHOLDERS = ['{language}', '{version}', '{error}'];
const TERMOS_PROTEGIDOS = [
    'Audivise', 'Rust', 'WebAssembly', 'UNIVESP', 'Termux',
    'Eliezer Tavares de Oliveira',
];

function achatar(obj, prefixo = '') {
    const saida = {};
    for (const [chave, valor] of Object.entries(obj)) {
        const caminho = prefixo ? `${prefixo}.${chave}` : chave;
        if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
            Object.assign(saida, achatar(valor, caminho));
        } else {
            saida[caminho] = valor;
        }
    }
    return saida;
}

const referencia = achatar(JSON.parse(readFileSync(join(PASTA, 'pt-BR.json'), 'utf-8')));

describe('pacotes de idioma (i18n/*.json)', () => {
    it('existem exatamente 27 idiomas', () => {
        expect(ARQUIVOS.length).toBe(27);
    });

    for (const arquivo of ARQUIVOS) {
        const codigo = basename(arquivo, '.json');

        it(`${codigo}: estrutura íntegra`, () => {
            const bruto = readFileSync(join(PASTA, arquivo), 'utf-8');
            const dados = JSON.parse(bruto); // JSON válido
            const chaves = achatar(dados);

            // Mesmo conjunto de chaves da referência (nada a mais, a menos)
            const faltando = Object.keys(referencia).filter((k) => !(k in chaves));
            const extras = Object.keys(chaves).filter((k) => !(k in referencia));
            expect(faltando, `chaves faltando: ${faltando}`).toEqual([]);
            expect(extras, `chaves extras: ${extras}`).toEqual([]);

            // Nenhum texto vazio
            for (const [k, v] of Object.entries(chaves)) {
                if (typeof v === 'string') expect(v.trim().length, k).toBeGreaterThan(0);
            }

            // Metadados coerentes
            expect(dados.meta.bcp47).toBe(codigo);
            const dirEsperado = RTL_ESPERADO.has(codigo) ? 'rtl' : 'ltr';
            expect(dados.meta.dir).toBe(dirEsperado);
            expect(typeof dados.meta.nativeName).toBe('string');
            expect(dados.meta.nativeName.length).toBeGreaterThan(1);
            expect(Array.isArray(dados.meta.voiceHints)).toBe(true);
            expect(dados.meta.voiceHints.length).toBeGreaterThanOrEqual(4);
            expect(typeof dados.meta.sentenceSeparator).toBe('string');
        });

        it(`${codigo}: placeholders preservados`, () => {
            const bruto = readFileSync(join(PASTA, arquivo), 'utf-8');
            for (const ph of PLACEHOLDERS) {
                expect(bruto.includes(ph), `faltou ${ph}`).toBe(true);
            }
        });

        it(`${codigo}: termos protegidos e atribuição`, () => {
            const bruto = readFileSync(join(PASTA, arquivo), 'utf-8');
            for (const termo of TERMOS_PROTEGIDOS) {
                expect(bruto.includes(termo), `faltou termo "${termo}"`).toBe(true);
            }
            // REGRA DO PROJETO: atribuição como "arquitetado/desenhado",
            // jamais a frase de atribuição de fabricação (guardada em
            // integrity.spec.js).
            expect(/\bdesenvolvid[oa]s?\s+por\b/i.test(bruto)).toBe(false);
        });

        it(`${codigo}: instruções faladas (issues) distintos e sem duplicação`, () => {
            const dados = JSON.parse(readFileSync(join(PASTA, arquivo), 'utf-8'));
            const codigos = ['MOVE_RIGHT', 'MOVE_LEFT', 'LOWER_CAMERA',
                'RAISE_CAMERA', 'MOVE_CLOSER', 'MOVE_AWAY'];
            const textos = codigos.map((c) => dados.issues[c]);
            expect(new Set(textos).size).toBe(codigos.length);
            for (const texto of textos) {
                expect(texto.trim().length).toBeGreaterThan(0);
            }
            // A junção real (com normalização de pontuação) é coberta por
            // tests/unit/frases.spec.js usando estes mesmos dados.
        });
    }
});
