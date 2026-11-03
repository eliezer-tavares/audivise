#!/usr/bin/env bash
# ===========================================================================
# COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
# PROJECT / PROJETO: AUDIVISE 1.0 — script de compilação do motor WASM
# CONTEXT / CONTEXTO: continuação do Projeto Integrador V (UNIVESP).
# Arquitetado por Eliezer Tavares de Oliveira. Licença: GPLv3.
# ===========================================================================
# Compila o motor Rust para WebAssembly e regenera o glue JS em engine/pkg.
# Requisitos: rustup (stable) + target wasm32-unknown-unknown + wasm-bindgen
# CLI (mesma versão do wasm-bindgen do Cargo.toml).
#
#   rustup target add wasm32-unknown-unknown
#   cargo install wasm-bindgen-cli --version 0.2.130
#
set -euo pipefail

cd "$(dirname "$0")/../engine"

cargo build --release --target wasm32-unknown-unknown
wasm-bindgen --target web --out-dir pkg \
    target/wasm32-unknown-unknown/release/audivise_engine.wasm

echo "Motor Audivise compilado em engine/pkg/ ✔"
