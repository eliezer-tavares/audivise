/* tslint:disable */
/* eslint-disable */

/**
 * [PT] FUNÇÃO PRINCIPAL - substitui a chamada POST /api/analyze da v0.x.
 *      Recebe as coordenadas normalizadas do rosto (boundingBox do
 *      MediaPipe) e devolve, em JSON, o contrato da API v0.x ampliado com
 *      os campos "issues" (códigos estáveis, na MESMA ORDEM de avaliação
 *      da v0.x: X, depois Y, depois Área) e "verdict" ("PERFECT" quando
 *      nenhuma instrução é necessária). O campo "message" mantém, sem
 *      alteração, a redação original em português do PI-V (paridade).
 *
 * [EN] MAIN FUNCTION - replaces the v0.x POST /api/analyze call. Receives
 *      the normalized face bounding box from MediaPipe and returns, as
 *      JSON, the v0.x contract extended with machine-readable fields:
 *      "issues" (stable codes, same evaluation order as v0.x: X, then Y,
 *      then Area) and "verdict" ("PERFECT" when no correction is needed).
 *      "message" keeps the original Portuguese wording for parity.
 */
export function analisar_enquadramento(x_center: number, y_center: number, width: number, height: number): string;

/**
 * [PT] Metadados do motor (limiares ativos), em JSON, para a tela de status.
 * [EN] Engine metadata (active thresholds) as JSON, for the status screen.
 */
export function info_motor(): string;

/**
 * [PT] Versão do motor, para exibição na interface.
 * [EN] Engine version, shown in the interface.
 */
export function versao_motor(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly analisar_enquadramento: (a: number, b: number, c: number, d: number) => [number, number];
    readonly info_motor: () => [number, number];
    readonly versao_motor: () => [number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
