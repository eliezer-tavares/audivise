// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE - testes de integração do motor
// CONTEXT / CONTEXTO:
//   Continuação do Projeto Integrador V - Engenharia de Computação (UNIVESP).
//   Arquitetado por Eliezer Tavares de Oliveira.
// LICENSE / LICENÇA: GNU General Public License v3.0 (GPLv3)
// ===========================================================================
// Testes executados dentro do WebAssembly real (em navegador headless):
//   cargo test --target wasm32-unknown-unknown
//   (runner configurado com wasm-bindgen-test-runner + Chrome headless)
// Garantem que o contrato JSON sobrevive à travessia JS ↔ WASM.

#![cfg(target_arch = "wasm32")]

extern crate wasm_bindgen_test;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn centro_produz_verdict_perfect() {
    let r = audivise_engine::analisar_enquadramento(0.5, 0.5, 0.25, 0.25);
    assert!(r.contains("\"is_perfect\":true"));
    assert!(r.contains("\"verdict\":\"PERFECT\""));
    assert!(r.contains("\"issues\":[]"));
    assert!(r.contains("Enquadramento perfeito! Pode gravar."));
}

#[wasm_bindgen_test]
fn fora_do_centro_produz_codigos_estaveis() {
    let r = audivise_engine::analisar_enquadramento(0.2, 0.9, 0.05, 0.05);
    assert!(r.contains("\"is_perfect\":false"));
    assert!(r.contains("MOVE_RIGHT"));
    assert!(r.contains("RAISE_CAMERA"));
    assert!(r.contains("MOVE_CLOSER"));
    // A ordem X, Y, Área da v0.x deve ser preservada no vetor:
    let x = r.find("MOVE_RIGHT").unwrap();
    let y = r.find("RAISE_CAMERA").unwrap();
    let a = r.find("MOVE_CLOSER").unwrap();
    assert!(x < y && y < a);
}

#[wasm_bindgen_test]
fn versao_do_motor_e_1_0_0() {
    assert_eq!(audivise_engine::versao_motor(), "1.0.0");
    assert!(audivise_engine::info_motor().contains("\"versao\":\"1.0.0\""));
}

#[wasm_bindgen_test]
fn nan_nunca_quebra_o_contrato_json() {
    let r = audivise_engine::analisar_enquadramento(f32::NAN, f32::NAN, f32::NAN, f32::NAN);
    // NaN -> 0.0 em todos os eixos; a resposta continua sendo JSON válido
    // e as instruções continuam sendo códigos estáveis.
    assert!(r.contains("MOVE_RIGHT"));
    assert!(r.contains("MOVE_CLOSER"));
    assert!(!r.contains("NaN"));
}
