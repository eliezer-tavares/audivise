// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE
// CONTEXT / CONTEXTO:
// [PT] Continuação do Projeto Integrador V - Engenharia de Computação (UNIVESP).
//      Versão 1.0 - projeto pessoal, não acadêmico.
//      Arquitetado por Eliezer Tavares de Oliveira.
// [EN] Continuation of Integrative Project V - Computer Engineering (UNIVESP).
//      Version 1.0 - personal, non-academic project.
//      Architected by Eliezer Tavares de Oliveira.
// LICENSE / LICENÇA: GNU General Public License v3.0 (GPLv3)
// ===========================================================================
//
// [PT] MOTOR GEOMÉTRICO DE ENQUADRAMENTO - compilado para WebAssembly.
//      Porta fiel do api/analyze.rs (v0.x, função serverless da Vercel):
//      mesmos limiares, mesma ordem de avaliação e mesmas decisões,
//      verificadas formalmente em Lean 4 (pasta formal-verification).
//      Executa inteiramente no navegador do usuário: nenhuma coordenada e
//      nenhuma imagem sai do computador.
//
//      Desde a versão 1.0 o motor também devolve códigos de instrução
//      ("issues"), permitindo que a interface fale os mesmos orientamentos
//      em qualquer um dos 27 idiomas suportados. O campo "message" mantém,
//      sem alteração, a redação original em português do PI-V (contrato da
//      API v0.x preservado).
//
// [EN] GEOMETRIC FRAMING ENGINE - compiled to WebAssembly. Faithful port
//      of api/analyze.rs (v0.x, Vercel serverless function): same thresholds,
//      same evaluation order, same decisions, formally verified in Lean 4.
//      It runs entirely in the user's browser: no coordinate and no image
//      ever leaves the computer.
//
//      Since 1.0 the engine also returns instruction codes ("issues"), so
//      the interface can speak the very same guidance in any of the 27
//      supported languages. The "message" field keeps the original
//      Portuguese wording of PI-V untouched (v0.x API contract preserved).

use wasm_bindgen::prelude::*;

// === CONFIGURATION / CONFIGURAÇÃO (idêntica à v0.x do PI-V) ===
// Thresholds for framing logic / Limites para a lógica de enquadramento
const THRESHOLD_X_LEFT: f32 = 0.40; // Left limit / Limite esquerdo
const THRESHOLD_X_RIGHT: f32 = 0.60; // Right limit / Limite direito
const THRESHOLD_Y_TOP: f32 = 0.35; // Top limit / Limite superior
const THRESHOLD_Y_BOTTOM: f32 = 0.65; // Bottom limit / Limite inferior
const MIN_FACE_AREA: f32 = 0.10; // Too far / Muito longe
const MAX_FACE_AREA: f32 = 0.35; // Too close / Muito perto

/// [PT] Normalização defensiva: mantém cada valor dentro de [0, 1] e rejeita
/// NaN. O núcleo de decisão abaixo permanece bit a bit idêntico ao da v0.x
/// (que já recebia valores nesse intervalo do MediaPipe).
/// [EN] Defensive normalization: keeps every value within [0, 1] and rejects
/// NaN. The decision core below remains bit-for-bit identical to v0.x.
fn normalizar(v: f32) -> f32 {
    if v.is_nan() {
        0.0
    } else {
        v.clamp(0.0, 1.0)
    }
}

/// [PT] Versão do motor, para exibição na interface.
/// [EN] Engine version, shown in the interface.
#[wasm_bindgen]
pub fn versao_motor() -> String {
    "1.0.0".to_string()
}

/// [PT] Metadados do motor (limiares ativos), em JSON, para a tela de status.
/// [EN] Engine metadata (active thresholds) as JSON, for the status screen.
#[wasm_bindgen]
pub fn info_motor() -> String {
    format!(
        "{{\"motor\":\"Rust/WebAssembly\",\"versao\":\"{versao}\",\
        \"limiares\":{{\"x_esquerdo\":{xl},\"x_direito\":{xr},\
        \"y_superior\":{yt},\"y_inferior\":{yb},\"area_minima\":{amin},\
        \"area_maxima\":{amax}}},\"rede\":\"nenhuma\"}}",
        versao = versao_motor(),
        xl = THRESHOLD_X_LEFT,
        xr = THRESHOLD_X_RIGHT,
        yt = THRESHOLD_Y_TOP,
        yb = THRESHOLD_Y_BOTTOM,
        amin = MIN_FACE_AREA,
        amax = MAX_FACE_AREA
    )
}

/// [PT] FUNÇÃO PRINCIPAL - substitui a chamada POST /api/analyze da v0.x.
///      Recebe as coordenadas normalizadas do rosto (boundingBox do
///      MediaPipe) e devolve, em JSON, o contrato da API v0.x ampliado com
///      os campos "issues" (códigos estáveis, na MESMA ORDEM de avaliação
///      da v0.x: X, depois Y, depois Área) e "verdict" ("PERFECT" quando
///      nenhuma instrução é necessária). O campo "message" mantém, sem
///      alteração, a redação original em português do PI-V (paridade).
///
/// [EN] MAIN FUNCTION - replaces the v0.x POST /api/analyze call. Receives
///      the normalized face bounding box from MediaPipe and returns, as
///      JSON, the v0.x contract extended with machine-readable fields:
///      "issues" (stable codes, same evaluation order as v0.x: X, then Y,
///      then Area) and "verdict" ("PERFECT" when no correction is needed).
///      "message" keeps the original Portuguese wording for parity.
#[wasm_bindgen]
pub fn analisar_enquadramento(x_center: f32, y_center: f32, width: f32, height: f32) -> String {
    let x = normalizar(x_center);
    let y = normalizar(y_center);
    let w = normalizar(width);
    let h = normalizar(height);

    let mut issues: Vec<&str> = Vec::new();
    let area = w * h;

    // === X AXIS LOGIC (Left/Right) / LÓGICA EIXO X (Esquerda/Direita) ===
    if x < THRESHOLD_X_LEFT {
        issues.push("MOVE_RIGHT");
    } else if x > THRESHOLD_X_RIGHT {
        issues.push("MOVE_LEFT");
    }

    // === Y AXIS LOGIC (Up/Down) / LÓGICA EIXO Y (Cima/Baixo) ===
    if y < THRESHOLD_Y_TOP {
        issues.push("LOWER_CAMERA");
    } else if y > THRESHOLD_Y_BOTTOM {
        issues.push("RAISE_CAMERA");
    }

    // === DEPTH LOGIC (Area) / LÓGICA DE PROFUNDIDADE (Área) ===
    if area < MIN_FACE_AREA {
        issues.push("MOVE_CLOSER");
    } else if area > MAX_FACE_AREA {
        issues.push("MOVE_AWAY");
    }

    // Build the final response / Constrói a resposta final
    let (message, is_perfect) = if issues.is_empty() {
        ("Enquadramento perfeito! Pode gravar.".to_string(), true)
    } else {
        (
            issues
                .iter()
                .map(|code| match *code {
                    "MOVE_RIGHT" => "mova o celular para a direita",
                    "MOVE_LEFT" => "mova o celular para a esquerda",
                    "LOWER_CAMERA" => "abaixe um pouco a câmera",
                    "RAISE_CAMERA" => "levante um pouco a câmera",
                    "MOVE_CLOSER" => "aproxime o rosto da câmera",
                    "MOVE_AWAY" => "afaste o rosto da câmera",
                    _ => unreachable!(),
                })
                .collect::<Vec<&str>>()
                .join(". "),
            false,
        )
    };

    let verdict = if is_perfect { "PERFECT" } else { "ADJUST" };
    let issues_json = issues
        .iter()
        .map(|code| format!("\"{}\"", code))
        .collect::<Vec<String>>()
        .join(",");

    format!(
        "{{\"message\":\"{msg}\",\"is_perfect\":{perfect},\
        \"issues\":[{issues}],\"verdict\":\"{verdict}\",\
        \"debug\":{{\"x_center\":{x:.3},\"y_center\":{y:.3},\
        \"width\":{w:.3},\"height\":{h:.3},\"area\":{area:.3}}},\
        \"motor\":\"Rust/WebAssembly\",\"versao\":\"{versao}\"}}",
        msg = message,
        perfect = is_perfect,
        issues = issues_json,
        verdict = verdict,
        x = x,
        y = y,
        w = w,
        h = h,
        area = area,
        versao = versao_motor()
    )
}

// ===========================================================================
// UNIT TESTS / TESTES UNITÁRIOS (nativos: `cargo test`)
// Os 10 casos de julgamento do PI-V + casos de fronteira e normalização.
// The 10 PI-V judgment cases + boundary and normalization cases.
// ===========================================================================
#[cfg(test)]
mod tests {
    use super::*;

    struct Resposta {
        message: String,
        is_perfect: bool,
        issues: Vec<String>,
        verdict: String,
    }

    fn analisar(x: f32, y: f32, w: f32, h: f32) -> Resposta {
        let raw = analisar_enquadramento(x, y, w, h);
        // Leitor JSON mínimo (o crate não depende de serde para não inflar o WASM)
        let msg = raw
            .split("\"message\":\"")
            .nth(1)
            .unwrap()
            .split("\",\"is_perfect")
            .next()
            .unwrap()
            .to_string();
        let perfect = raw.contains("\"is_perfect\":true");
        let issues_raw = raw
            .split("\"issues\":[")
            .nth(1)
            .unwrap()
            .split(']')
            .next()
            .unwrap();
        let issues: Vec<String> = issues_raw
            .split(',')
            .filter(|s| !s.trim().is_empty())
            .map(|s| s.trim().trim_matches('"').to_string())
            .collect();
        let verdict = raw
            .split("\"verdict\":\"")
            .nth(1)
            .unwrap()
            .split('"')
            .next()
            .unwrap()
            .to_string();
        Resposta {
            message: msg,
            is_perfect: perfect,
            issues,
            verdict,
        }
    }

    #[test]
    fn caso_1_centro_perfeito() {
        // Rosto centrado, área média: nada a corrigir.
        let Resposta {
            message: msg,
            is_perfect: perfect,
            issues,
            verdict,
        } = analisar(0.5, 0.5, 0.5, 0.6);
        assert!(perfect);
        assert_eq!(verdict, "PERFECT");
        assert!(issues.is_empty());
        assert_eq!(msg, "Enquadramento perfeito! Pode gravar.");
    }

    #[test]
    fn caso_2_rosto_a_esquerda_manda_direita() {
        let Resposta { issues, .. } = analisar(0.30, 0.5, 0.5, 0.6);
        assert_eq!(issues, vec!["MOVE_RIGHT".to_string()]);
    }

    #[test]
    fn caso_3_rosto_a_direita_manda_esquerda() {
        let Resposta { issues, .. } = analisar(0.70, 0.5, 0.5, 0.6);
        assert_eq!(issues, vec!["MOVE_LEFT".to_string()]);
    }

    #[test]
    fn caso_4_rosto_alto_abaixa_camera() {
        let Resposta { issues, .. } = analisar(0.5, 0.20, 0.5, 0.6);
        assert_eq!(issues, vec!["LOWER_CAMERA".to_string()]);
    }

    #[test]
    fn caso_5_rosto_baixo_levanta_camera() {
        let Resposta { issues, .. } = analisar(0.5, 0.80, 0.5, 0.6);
        assert_eq!(issues, vec!["RAISE_CAMERA".to_string()]);
    }

    #[test]
    fn caso_6_rosto_longe_aproxima() {
        let Resposta { issues, .. } = analisar(0.5, 0.5, 0.10, 0.10);
        assert_eq!(issues, vec!["MOVE_CLOSER".to_string()]);
    }

    #[test]
    fn caso_7_rosto_perto_afasta() {
        let Resposta { issues, .. } = analisar(0.5, 0.5, 0.70, 0.60);
        assert_eq!(issues, vec!["MOVE_AWAY".to_string()]);
    }

    #[test]
    fn caso_8_defeitos_multiplos_na_ordem_x_y_area() {
        // Fora no eixo X, no eixo Y e na área — a ordem de avaliação da v0.x
        // é X, Y, Área e deve ser preservada.
        let Resposta { issues, .. } = analisar(0.20, 0.90, 0.05, 0.05);
        assert_eq!(
            issues,
            vec![
                "MOVE_RIGHT".to_string(),
                "RAISE_CAMERA".to_string(),
                "MOVE_CLOSER".to_string()
            ]
        );
    }

    #[test]
    fn caso_9_valores_de_fronteira_nao_disparam() {
        // Exatamente nos limiares (x=0.40, x=0.60, y=0.35, y=0.65,
        // área=0.10, área=0.35): a comparação é estrita, nada dispara.
        let Resposta {
            is_perfect: perfect,
            issues,
            ..
        } = analisar(0.40, 0.35, 0.20, 0.50); // área 0.10
        assert!(perfect && issues.is_empty());
        let Resposta {
            is_perfect: perfect,
            issues,
            ..
        } = analisar(0.60, 0.65, 0.50, 0.70); // área 0.35
        assert!(perfect && issues.is_empty());
    }

    #[test]
    fn caso_10_nan_e_fora_da_faixa_sao_normalizados() {
        // NaN vira 0.0 no eixo correspondente; valores fora de [0,1] são
        // limitados às bordas do intervalo — e o JSON nunca contém "NaN".
        let Resposta { issues, .. } = analisar(f32::NAN, 0.5, 0.25, 0.25);
        assert_eq!(
            issues,
            vec!["MOVE_RIGHT".to_string(), "MOVE_CLOSER".to_string()]
        );
        let Resposta { issues, .. } = analisar(0.5, f32::NAN, 0.5, 0.6);
        assert_eq!(issues, vec!["LOWER_CAMERA".to_string()]);
        let Resposta { issues, .. } = analisar(-1.0, 2.0, 0.5, 0.6);
        assert_eq!(
            issues,
            vec!["MOVE_RIGHT".to_string(), "RAISE_CAMERA".to_string()]
        );
    }

    #[test]
    fn contrato_json_contem_campos_da_v0_x() {
        let raw = analisar_enquadramento(0.5, 0.5, 0.25, 0.25);
        for campo in [
            "message",
            "is_perfect",
            "issues",
            "verdict",
            "debug",
            "motor",
            "versao",
        ] {
            assert!(
                raw.contains(&format!("\"{}\"", campo)),
                "faltou campo {}",
                campo
            );
        }
        assert!(raw.contains("\"motor\":\"Rust/WebAssembly\""));
        assert!(raw.contains("\"versao\":\"1.0.0\""));
    }

    #[test]
    fn versao_e_1_0_0() {
        assert_eq!(versao_motor(), "1.0.0");
    }

    #[test]
    fn info_motor_expoe_limiares_do_pi_v() {
        let raw = info_motor();
        assert!(raw.contains("\"x_esquerdo\":0.4"));
        assert!(raw.contains("\"x_direito\":0.6"));
        assert!(raw.contains("\"y_superior\":0.35"));
        assert!(raw.contains("\"y_inferior\":0.65"));
        assert!(raw.contains("\"area_minima\":0.1"));
        assert!(raw.contains("\"area_maxima\":0.35"));
        assert!(raw.contains("\"rede\":\"nenhuma\""));
    }

    #[test]
    fn mensagem_perfeita_mantem_redacao_do_pi_v() {
        let Resposta {
            is_perfect: perfect,
            issues,
            ..
        } = analisar(0.5, 0.5, 0.5, 0.6);
        assert!(perfect && issues.is_empty());
    }
}
