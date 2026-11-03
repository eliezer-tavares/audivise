// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0 — testes da junção de instruções faladas
// CONTEXT / CONTEXTO: continuação do Projeto Integrador V (UNIVESP).
// Arquitetado por Eliezer Tavares de Oliveira. Licença: GPLv3.
// ===========================================================================
// Usa os 27 pacotes reais de idioma para provar que a fala nunca sai com
// pontuação duplicada (ex.: "direita. . levante" ou "。。") e que a ORDEM
// do PI-V (X, Y, Área) é preservada.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { unirInstrucoes } from '../../frases.js';

const PASTA = join(process.cwd(), 'i18n');
const ARQUIVOS = readdirSync(PASTA).filter((f) => f.endsWith('.json'));

// Mesmo caso do teste nativo caso_8 (X + Y + Área)
const ORDEM_PI_V = ['MOVE_RIGHT', 'RAISE_CAMERA', 'MOVE_CLOSER'];

describe('unirInstrucoes com os dados reais dos 27 idiomas', () => {
    for (const arquivo of ARQUIVOS) {
        const codigo = basename(arquivo, '.json');
        const dados = JSON.parse(readFileSync(join(PASTA, arquivo), 'utf-8'));
        const sep = dados.meta.sentenceSeparator;

        it(`${codigo}: três instruções sem pontuação duplicada`, () => {
            const fragmentos = ORDEM_PI_V.map((c) => dados.issues[c]);
            const fala = unirInstrucoes(fragmentos, sep);

            // A ordem de avaliação do PI-V é preservada no texto final.
            // (Busca pelo fragmento normalizado, sem o separador final —
            // a mesma normalização feita por unirInstrucoes.)
            const compacto = sep.trim();
            const base = (t) => {
                let x = t.trim();
                if (compacto && x.endsWith(compacto)) {
                    x = x.slice(0, x.length - compacto.length).trim();
                }
                return x;
            };
            const pos = ORDEM_PI_V.map((c) => fala.indexOf(base(dados.issues[c])));
            expect(pos.every((p) => p >= 0)).toBe(true);
            expect([...pos].sort((a, b) => a - b)).toEqual(pos);

            // Nenhuma ocorrência de separador duplicado
            if (sep === '. ') {
                expect(fala.includes('. .')).toBe(false);
                expect(fala.includes('..')).toBe(false);
            } else {
                const dobrado = sep.repeat(2);
                expect(fala.includes(dobrado)).toBe(false);
            }

            // Exatamente dois separadores (três fragmentos)
            const ocorrencias = fala.split(sep).length - 1;
            expect(ocorrencias).toBe(2);
        });

        it(`${codigo}: caso perfeito não é afetado e entrada vazia é aceita`, () => {
            expect(unirInstrucoes([], sep)).toBe('');
            expect(unirInstrucoes([''], sep)).toBe('');
        });
    }

    it('padrão ". " quando o separador vem vazio', () => {
        expect(unirInstrucoes(['a', 'b'], undefined)).toBe('a. b');
    });
});
