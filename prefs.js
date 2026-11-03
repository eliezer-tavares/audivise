// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0
// CONTEXT / CONTEXTO:
//   Continuação do Projeto Integrador V - Engenharia de Computação (UNIVESP).
//   Projeto pessoal e não acadêmico.
//   Arquitetado por Eliezer Tavares de Oliveira.
// LICENSE / LICENÇA: GNU General Public License v3.0 (GPLv3)
// ===========================================================================
// Preferências do usuário, guardadas apenas no navegador local
// (localStorage). Nada é enviado a servidor algum — privacidade por
// construção. Módulo puro, sem DOM, para ser testável em unit tests.

const PREFIXO = 'audivise.';

// Referências ao storage podem ser substituídas nos testes.
let storage = null;

function getStorage() {
    if (storage) return storage;
    // Acesso preguiçoso: alguns contextos (file://, navegadores antigos)
    // lançam exceção ao tocar em localStorage.
    try {
        storage = globalThis.localStorage;
    } catch (e) {
        storage = null;
    }
    return storage;
}

/** [PT] Substitui o storage (usado pelos testes unitários).
    [EN] Replaces the storage (used by unit tests). */
export function _setStorage(s) {
    storage = s;
}

export function obter(chave, padrao = null) {
    const s = getStorage();
    if (!s) return padrao;
    try {
        const bruto = s.getItem(PREFIXO + chave);
        if (bruto === null || bruto === undefined) return padrao;
        return JSON.parse(bruto);
    } catch (e) {
        return padrao;
    }
}

export function gravar(chave, valor) {
    const s = getStorage();
    if (!s) return false;
    try {
        s.setItem(PREFIXO + chave, JSON.stringify(valor));
        return true;
    } catch (e) {
        return false;
    }
}

export function remover(chave) {
    const s = getStorage();
    if (!s) return;
    try {
        s.removeItem(PREFIXO + chave);
    } catch (e) { /* irrelevante */ }
}
