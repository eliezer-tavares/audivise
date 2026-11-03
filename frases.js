// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0
// CONTEXT / CONTEXTO:
//   Continuação do Projeto Integrador V - Engenharia de Computação (UNIVESP).
//   Projeto pessoal e não acadêmico.
//   Arquitetado por Eliezer Tavares de Oliveira.
// LICENSE / LICENÇA: GNU General Public License v3.0 (GPLv3)
// ===========================================================================
// Junção das instruções faladas. Cada idioma tem seu separador de frases
// (". " na maioria, "。" em chinês e japonês) e alguns pacotes terminam os
// fragmentos com pontuação própria; esta função normaliza os fragmentos
// para nunca produzir pontuação duplicada ("direita. . levante" ou "。。").
// Módulo puro (sem DOM) para ser testável em unit tests.

/** [PT] Remove UMA ocorrência do separador (sem espaços) do fim do texto.
    [EN] Strips ONE occurrence of the separator (whitespace-free) from the
 *  end of the text. */
function cortarSeparadorFinal(texto, separadorCompacto) {
    let saida = texto.trim();
    if (separadorCompacto && saida.endsWith(separadorCompacto)) {
        saida = saida
            .slice(0, saida.length - separadorCompacto.length)
            .trim();
    }
    return saida;
}

/** [PT] Junta os fragmentos com o separador do idioma, sem duplicar
 *  pontuação. Ordem dos fragmentos é preservada (contrato do PI-V).
    [EN] Joins fragments with the language separator without duplicated
 *  punctuation. Fragment order is preserved (PI-V contract). */
export function unirInstrucoes(fragmentos, separador = '. ') {
    const compacto = String(separador).trim();
    const limpos = (fragmentos || [])
        .map((f) => String(f))
        .filter((f) => f.trim().length > 0)
        .map((f) => cortarSeparadorFinal(f, compacto))
        .filter((f) => f.length > 0);
    return limpos.join(String(separador));
}
