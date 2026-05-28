# Audivise: Real-Time Automatic Face Framing / Enquadramento Facial em Tempo Real

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![ORCID](https://img.shields.io/badge/ORCID-0009--0007--2577--8635-brightgreen)](https://orcid.org/0009-0007-2577-8635)

## 🇧🇷 Português

### Sobre o Projeto
O **Audivise** é um sistema assistivo baseado em Internet das Coisas (IoT) e Visão Computacional, projetado para fornecer autonomia a pessoas com deficiência visual durante videoconferências. O sistema detecta a posição do rosto do usuário e fornece feedback auditivo em tempo real para auxiliar no enquadramento e centralização diante da câmera.

Este projeto constitui a entrega técnica do **Projeto Integrador V do curso de graduação em Engenharia de Computação da UNIVESP**, realizada em maio de 2026.

**Nota Importante:** O autor deste projeto é **deficiente visual total**.

### Status do Protótipo
O sistema é plenamente funcional em ambiente local (testado via Vercel CLI). Contudo, o protótipo disponível online na Vercel ainda apresenta instabilidades de comunicação entre o frontend e o backend serverless, podendo não estar 100% funcional no momento do acesso. O autor trabalha na resolução destes desafios técnicos de deploy cloud.

### Principais Diferenciais
*   **Privacidade (Edge Computing):** O processamento de imagem ocorre localmente no navegador via MediaPipe; nenhum dado de imagem é enviado para a nuvem.
*   **Performance em Rust:** O motor de análise geométrica foi desenvolvido em Rust, garantindo previsibilidade e segurança de memória.
*   **Métodos Formais (Lean 4):** A lógica de enquadramento foi verificada matematicamente utilizando o provador de teoremas Lean 4 para garantir que as instruções emitidas sejam semanticamente corretas e seguras.
*   **Código Aberto:** Licenciado sob GPLv3 para incentivar a colaboração na área de tecnologia assistiva.

### Tecnologias Utilizadas
*   **Backend:** Rust (Serverless Functions)
*   **Frontend:** HTML5, CSS3, JavaScript moderno
*   **Visão Computacional:** MediaPipe Face Landmarker
*   **Verificação Formal:** Lean 4
*   **Feedback de Voz:** Web Speech API
*   **Deploy:** Vercel

### Link Útil
*   **Protótipo Online:** [https://audivise.vercel.app/](https://audivise.vercel.app/)

---

## 🇺🇸 English

### About the Project
**Audivise** is an assistive system based on the Internet of Things (IoT) and Computer Vision, designed to provide autonomy to visually impaired people during videoconferences. The system detects the user's face position and provides real-time auditory feedback to assist in framing and centering in front of the camera.

This project constitutes the technical delivery for the **Integrated Project V of the Computer Engineering degree at UNIVESP**, in May 2026.

**Important Note:** The author of this project is **totally blind**.

### Prototype Status
The system is fully functional in a local environment (tested via Vercel CLI). However, the online prototype available on Vercel still presents communication instabilities between the frontend and the serverless backend, and may not be 100% functional at the time of access. The author is working on resolving these technical cloud deployment challenges.

### Key Features
*   **Privacy (Edge Computing):** Image processing occurs locally in the browser via MediaPipe; no image data is sent to the cloud.
*   **Performance in Rust:** The geometric analysis engine was developed in Rust, ensuring predictability and memory safety.
*   **Formal Methods (Lean 4):** The framing logic was mathematically verified using the Lean 4 theorem prover to ensure that the issued instructions are semantically correct and safe.
*   **Open Source:** Licensed under GPLv3 to encourage collaboration in the field of assistive technology.

### Technologies
*   **Backend:** Rust (Serverless Functions)
*   **Frontend:** HTML5, CSS3, modern JavaScript
*   **Computer Vision:** MediaPipe Face Landmarker
*   **Formal Verification:** Lean 4
*   **Voice Feedback:** Web Speech API
*   **Deployment:** Vercel

### Useful Link
*   **Live Prototype:** [https://audivise.vercel.app/](https://audivise.vercel.app/)

---

## ⚖️ License / Licença
This project is licensed under the **GNU General Public License v3.0**. See the [LICENSE](LICENSE) file for details. / Este projeto está licenciado sob a **GNU General Public License v3.0**. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👤 Author / Autor
**Eliezer Tavares de Oliveira**
*   **Email:** contact@eliezertavaresdeoliveira.com
*   **ORCID:** [0009-0007-2577-8635](https://orcid.org/0009-0007-2577-8635)
*   **University:** UNIVESP (Universidade Virtual do Estado de São Paulo)
