// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE
// DATE / DATA: 23 DE MAIO DE 2026 / MAY 23, 2026
// CONTEXT / CONTEXTO: 
// [PT] Projeto Integrador V - Engenharia de Computação
//      Universidade Virtual do Estado de São Paulo (UNIVESP)
// [EN] Integrative Project V - Computer Engineering
//      Virtual University of the State of São Paulo (UNIVESP)
// LICENSE / LICENÇA: GNU General Public License v3.0 (GPLv3)
// ===========================================================================

use vercel_runtime::{run, Body, Error, Request, Response, StatusCode};
use serde::{Deserialize, Serialize};

// === CONFIGURATION / CONFIGURAÇÃO ===
// Thresholds for framing logic / Limites para a lógica de enquadramento
const THRESHOLD_X_LEFT: f32   = 0.40;   // Left limit / Limite esquerdo
const THRESHOLD_X_RIGHT: f32  = 0.60;   // Right limit / Limite direito
const THRESHOLD_Y_TOP: f32    = 0.35;   // Top limit / Limite superior
const THRESHOLD_Y_BOTTOM: f32 = 0.65;   // Bottom limit / Limite inferior
const MIN_FACE_AREA: f32      = 0.10;   // Too far / Muito longe
const MAX_FACE_AREA: f32      = 0.35;   // Too close / Muito perto

// Structure to receive face coordinates from the frontend
// Estrutura para receber as coordenadas do rosto do frontend
#[derive(Deserialize, Serialize, Debug, Clone)]
struct FaceData {
    x_center: f32,
    y_center: f32,
    width: f32,
    height: f32,
}

// Structure for the API response
// Estrutura para a resposta da API
#[derive(Serialize)]
struct ApiResponse {
    message: String,
    is_perfect: bool,
    debug: Option<FaceData>, // Helpful for debugging / Útil para depuração
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    // In version 1.1.x, we pass the handler function directly to run
    // Na versão 1.1.x, passamos a função handler diretamente para o run
    run(handler).await
}

// Main handler for the serverless function
// Manipulador principal para a função serverless
pub async fn handler(req: Request) -> Result<Response<Body>, Error> {
    
    // In version 1.1.x, req.body() returns the Body type which implements AsRef<[u8]>
    // Na versão 1.1.x, req.body() retorna o tipo Body que implementa AsRef<[u8]>
    let body_bytes = req.body();
    
    // Parse JSON into FaceData struct
    // Converte o JSON para a estrutura FaceData
    let face: FaceData = match serde_json::from_slice(body_bytes.as_ref()) {
        Ok(data) => data,
        Err(_) => return bad_request("JSON inválido / Invalid JSON"),
    };

    // Logging for server-side monitoring
    // Log para monitoramento no lado do servidor
    println!("Received / Recebido → x:{:.3} y:{:.3} w:{:.3} h:{:.3}", 
             face.x_center, face.y_center, face.width, face.height);

    let mut instructions = Vec::new();
    let area = face.width * face.height;

    // === X AXIS LOGIC (Left/Right) / LÓGICA EIXO X (Esquerda/Direita) ===
    if face.x_center < THRESHOLD_X_LEFT {
        instructions.push("mova o celular para a direita / move the phone to the right");
    } else if face.x_center > THRESHOLD_X_RIGHT {
        instructions.push("mova o celular para a esquerda / move the phone to the left");
    }

    // === Y AXIS LOGIC (Up/Down) / LÓGICA EIXO Y (Cima/Baixo) ===
    if face.y_center < THRESHOLD_Y_TOP {
        instructions.push("abaixe um pouco a câmera / tilt the camera down slightly");
    } else if face.y_center > THRESHOLD_Y_BOTTOM {
        instructions.push("levante um pouco a câmera / tilt the camera up slightly");
    }

    // === DEPTH LOGIC (Area) / LÓGICA DE PROFUNDIDADE (Área) ===
    if area < MIN_FACE_AREA {
        instructions.push("aproxime o rosto da câmera / move your face closer to the camera");
    } else if area > MAX_FACE_AREA {
        instructions.push("afaste o rosto da câmera / move your face further from the camera");
    }

    // Build the final response
    // Constrói a resposta final
    let response = if instructions.is_empty() {
        ApiResponse {
            message: "Enquadramento perfeito! Pode gravar. / Perfect framing! Ready to record.".to_string(),
            is_perfect: true,
            debug: Some(face),
        }
    } else {
        ApiResponse {
            message: instructions.join(". "),
            is_perfect: false,
            debug: Some(face),
        }
    };

    let json = serde_json::to_string(&response).unwrap();

    // Return success response
    // Retorna resposta de sucesso
    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(Body::Text(json))?)
}

// Helper function for error responses
// Função auxiliar para respostas de erro
fn bad_request(msg: &str) -> Result<Response<Body>, Error> {
    let response = ApiResponse {
        message: msg.to_string(),
        is_perfect: false,
        debug: None,
    };
    let json = serde_json::to_string(&response).unwrap();

    Ok(Response::builder()
        .status(StatusCode::BAD_REQUEST)
        .header("Content-Type", "application/json")
        .body(Body::Text(json))?)
}