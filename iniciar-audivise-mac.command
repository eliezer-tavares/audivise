#!/bin/bash
# ===========================================================================
# COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
# PROJECT / PROJETO: AUDIVISE 1.0
# CONTEXT / CONTEXTO:
#   Continuação do Projeto Integrador V - Engenharia de Computação (UNIVESP).
#   Projeto pessoal e não acadêmico.
#   Arquitetado por Eliezer Tavares de Oliveira.
# LICENSE / LICENÇA: GNU General Public License v3.0 (GPLv3)
# ===========================================================================
# Inicia o servidor local do Audivise e abre o navegador (macOS).
# Deixe esta janela aberta enquanto usar o Audivise.
# Se o sistema reclamar de permissão, rode uma única vez no Terminal:
#   chmod +x iniciar-audivise-mac.command
# ===========================================================================

cd "$(dirname "$0")" || exit 1

if command -v python3 >/dev/null 2>&1; then
  python3 servidor.py
elif command -v python >/dev/null 2>&1; then
  python servidor.py
elif command -v node >/dev/null 2>&1; then
  node servidor.js
else
  echo "============================================================"
  echo " NÃO ENCONTREI PYTHON NEM NODE NESTE COMPUTADOR."
  echo " Instale o Python gratuito em https://www.python.org/downloads/"
  echo " ou o Node.js gratuito em https://nodejs.org/"
  echo " Depois, rode este arquivo novamente."
  echo "============================================================"
  read -r -p "Pressione Enter para sair…" _
fi
