// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0
// CONTEXT / CONTEXTO:
//   Continuação do Projeto Integrador V - Engenharia de Computação (UNIVESP).
//   Projeto pessoal e não acadêmico.
//   Arquitetado por Eliezer Tavares de Oliveira.
// LICENSE / LICENÇA: GNU General Public License v3.0 (GPLv3)
// ===========================================================================
// Internacionalização do Audivise: 27 idiomas, todos embutidos no pacote
// (nenhuma tradução vem da internet). A interface e a voz têm seleção
// independentes. Hebraico, árabe e persa ativam o modo RTL (direita para
// esquerda) por meio de propriedades lógicas de CSS.

// Todos os idiomas suportados (arquivo i18n/<codigo>.json).
export const CODIGOS_IDIOMAS = [
    'pt-BR', 'en-US', 'es-ES', 'fr-FR', 'it-IT', 'de-DE', 'nl-NL',
    'pl-PL', 'ro-RO', 'cs-CZ', 'uk-UA', 'sv-SE', 'hu-HU', 'sr-RS',
    'sw-KE', 'he-IL', 'ar-SA', 'zh-CN', 'ru-RU', 'hi-IN', 'ja-JP',
    'ko-KR', 'id-ID', 'fa-IR', 'tr-TR', 'vi-VN', 'th-TH',
];

export const IDIOMA_PADRAO_FINAL = 'pt-BR'; // origem do projeto

const registro = new Map();      // codigo -> objeto i18n completo
const achatados = new Map();     // codigo -> { 'status.ready': '...' }
let atual = null;

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

/** [PT] Carrega todos os pacotes de idioma (fetch local, em paralelo).
    [EN] Loads every language pack (local fetch, in parallel). */
export async function carregarIdiomas(base = './i18n') {
    const pedidos = CODIGOS_IDIOMAS.map(async (codigo) => {
        const resposta = await fetch(`${base}/${codigo}.json`);
        if (!resposta.ok) throw new Error(`i18n ${codigo}: HTTP ${resposta.status}`);
        const dados = await resposta.json();
        registro.set(codigo, dados);
        achatados.set(codigo, achatar(dados));
    });
    await Promise.all(pedidos);
    return registro.size;
}

/** [PT] True se o idioma já foi carregado.
    [EN] True if the language pack is loaded. */
export function idiomaDisponivel(codigo) {
    return registro.has(codigo);
}

/** [PT] Código do idioma ativo.
    [EN] Code of the active language. */
export function idiomaAtual() {
    return atual;
}

/** [PT] Metadados do idioma (nome nativo, bcp47, direção...).
    [EN] Language metadata (native name, bcp47, direction...). */
export function metaDe(codigo = atual) {
    const dados = registro.get(codigo);
    return dados ? dados.meta : null;
}

/** [PT] Lista de idiomas para popular seletores.
    [EN] Language list for populating select boxes. */
export function listaIdiomas() {
    return CODIGOS_IDIOMAS
        .filter((c) => registro.has(c))
        .map((c) => ({
            codigo: c,
            bcp47: registro.get(c).meta.bcp47,
            nativeName: registro.get(c).meta.nativeName,
            englishName: registro.get(c).meta.englishName,
            dir: registro.get(c).meta.dir,
        }));
}

/** [PT] Traduz o caminho (ex.: 'status.ready') com interpolação {param}.
 *  Cai para inglês e então para português se a chave faltar.
    [EN] Translates a dot path (e.g. 'status.ready') with {param}
 *  interpolation; falls back to English, then Portuguese. */
export function t(caminho, params = null) {
    const ordem = [atual, 'en-US', IDIOMA_PADRAO_FINAL];
    for (const codigo of ordem) {
        const achatado = achatados.get(codigo);
        if (achatado && Object.prototype.hasOwnProperty.call(achatado, caminho)) {
            let texto = String(achatado[caminho]);
            if (params) {
                for (const [chave, valor] of Object.entries(params)) {
                    texto = texto.split(`{${chave}}`).join(String(valor));
                }
            }
            return texto;
        }
    }
    return caminho;
}

/** [PT] Pistas de nomes de vozes comuns para o idioma (meta.voiceHints).
    [EN] Common voice-name hints for the language (meta.voiceHints). */
export function pistasDeVoz(codigo) {
    const dados = registro.get(codigo);
    return dados && dados.meta && Array.isArray(dados.meta.voiceHints)
        ? dados.meta.voiceHints
        : [];
}

/** [PT] Traduz usando um idioma específico (usado para os textos FALADOS,
 *  que seguem o idioma da voz, não o da interface).
    [EN] Translates using a specific language (used for SPOKEN texts, which
 *  follow the voice language, not the interface language). */
export function tDe(codigo, caminho, params = null) {
    const guardado = atual;
    atual = codigo;
    const resultado = t(caminho, params);
    atual = guardado;
    return resultado;
}

/** [PT] Aplica traduções a todos os elementos marcados com data-i18n*.
    [EN] Applies translations to every element marked with data-i18n*. */
export function aplicarDom(raiz = document) {
    raiz.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    raiz.querySelectorAll('[data-i18n-aria]').forEach((el) => {
        el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    raiz.querySelectorAll('[data-i18n-title]').forEach((el) => {
        el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
    const titulo = t('app.title');
    const slogan = t('app.tagline');
    if (titulo !== 'app.title') {
        document.title = titulo === slogan ? titulo : `${titulo} — ${slogan}`;
    }
}

/** [PT] Define o idioma da interface e aplica no DOM (inclui dir RTL).
    [EN] Sets the interface language and applies it to the DOM (incl. RTL). */
export function definirIdioma(codigo) {
    if (!registro.has(codigo)) return false;
    atual = codigo;
    const meta = registro.get(codigo).meta;
    document.documentElement.lang = meta.bcp47;
    document.documentElement.dir = meta.dir || 'ltr';
    aplicarDom();
    return true;
}

/** [PT] Escolhe o idioma inicial a partir das línguas preferidas do
 *  navegador: correspondência exata, depois base (pt-PT → pt-BR), depois
 *  inglês, depois o padrão do projeto.
    [EN] Picks the initial language from the browser's preferred languages:
 *  exact match, then base match, then English, then project default. */
export function detectarIdiomaPadrao(preferidas = null) {
    const candidatos = preferidas
        || (globalThis.navigator && navigator.languages)
        || (globalThis.navigator && [navigator.language])
        || [];
    for (const bruto of candidatos) {
        if (!bruto) continue;
        const tag = String(bruto).replace('_', '-');
        if (registro.has(tag)) return tag;
        const base = tag.split('-')[0];
        const peloBase = CODIGOS_IDIOMAS.find((c) => c.split('-')[0] === base);
        if (peloBase) return peloBase;
    }
    return IDIOMA_PADRAO_FINAL;
}
