// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0 — teste espelho dos limiares do PI-V
// CONTEXT / CONTEXTO: continuação do Projeto Integrador V (UNIVESP).
// Arquitetado por Eliezer Tavares de Oliveira. Licença: GPLv3.
// ===========================================================================
// GARANTIA DE PARIDADE COM O PI-V: o motor Rust é a fonte da verdade, mas
// este teste lê o código-fonte e o README para provar que os limiares
// documentados, os do código e os do Lean 4 são sempre os mesmos. Qualquer
// alteração de limiar quebre este teste e force revisão consciente.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = process.cwd();

// Os limiares oficiais do Projeto Integrador V (fonte: README + Lean 4).
// IMPORTANTE: valores como STRING para preservar os literais exatos do
// código Rust ("0.40" em JS é o número 0.4 e quebraria a âncora \b).
const LIMIARES_PI_V = {
    THRESHOLD_X_LEFT: '0.40',
    THRESHOLD_X_RIGHT: '0.60',
    THRESHOLD_Y_TOP: '0.35',
    THRESHOLD_Y_BOTTOM: '0.65',
    MIN_FACE_AREA: '0.10',
    MAX_FACE_AREA: '0.35',
};

describe('paridade de limiares entre Rust, Lean 4 e documentação', () => {
    const libRs = readFileSync(join(RAIZ, 'engine', 'src', 'lib.rs'), 'utf-8');
    const lean = readFileSync(
        join(RAIZ, 'formal-verification', 'logic_proof.lean'), 'utf-8');
    const readme = readFileSync(join(RAIZ, 'README.md'), 'utf-8');

    it('engine/src/lib.rs declara exatamente os limiares do PI-V', () => {
        for (const [nome, valor] of Object.entries(LIMIARES_PI_V)) {
            const re = new RegExp(`${nome}\\s*:\\s*f32\\s*=\\s*(${valor})\\b`);
            expect(re.test(libRs), `${nome} deve ser ${valor}`).toBe(true);
        }
    });

    it('a ordem de avaliação X → Y → Área está no código Rust', () => {
        const pos = {
            x: libRs.indexOf('X AXIS LOGIC'),
            y: libRs.indexOf('Y AXIS LOGIC'),
            area: libRs.indexOf('DEPTH LOGIC'),
        };
        expect(pos.x).toBeGreaterThan(-1);
        expect(pos.y).toBeGreaterThan(pos.x);
        expect(pos.area).toBeGreaterThan(pos.y);
    });

    it('os códigos de instrução estáveis existem no motor', () => {
        for (const codigo of ['MOVE_RIGHT', 'MOVE_LEFT', 'LOWER_CAMERA',
            'RAISE_CAMERA', 'MOVE_CLOSER', 'MOVE_AWAY']) {
            expect(libRs.includes(`"${codigo}"`), `faltou ${codigo}`).toBe(true);
        }
    });

    it('o Lean 4 usa os mesmos limites do eixo X (0.4 / 0.6)', () => {
        expect(lean.includes('x < 0.4')).toBe(true);
        expect(lean.includes('x > 0.6')).toBe(true);
    });

    it('o README documenta a tabela oficial de limiares', () => {
        for (const linha of [
            'x < 0.40', 'x > 0.60', 'y < 0.35', 'y > 0.65',
            'área < 0.10', 'área > 0.35',
        ]) {
            expect(readme.includes(linha), `faltou "${linha}" no README`).toBe(true);
        }
    });

    it('a normalização defensiva (NaN → 0, clamp 0–1) está no motor', () => {
        expect(libRs.includes('is_nan')).toBe(true);
        expect(libRs.includes('clamp(0.0, 1.0)')).toBe(true);
    });
});
