#!/data/data/com.termux/files/usr/bin/bash
# ===========================================================================
# COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
# PROJECT / PROJETO: AUDIVISE 1.0
# CONTEXT / CONTEXTO:
#   Continuação do Projeto Integrador V - Engenharia de Computação (UNIVESP).
#   Projeto pessoal e não acadêmico.
#   Arquitetado por Eliezer Tavares de Oliveira.
# LICENSE / LICENÇA: GNU General Public License v3.0 (GPLv3)
# ===========================================================================
# Inicia o Audivise no ANDROID, dentro do aplicativo Termux.
# O que este script faz:
#   1. Verifica se o Python (ou o Node.js) está disponível no Termux;
#      se não estiver, oferece instalar o Python automaticamente.
#   2. Sobe o servidor local em 127.0.0.1 (só dentro do celular).
#   3. Abre o navegador padrão no endereço local.
# Dica: depois de aberto, use "Adicionar à tela inicial" no Chrome para
# transformar o Audivise em um aplicativo offline (PWA).
# ===========================================================================

cd "$(dirname "$0")" || exit 1

RUNTIME=""
if command -v python >/dev/null 2>&1; then
  RUNTIME="python"
elif command -v node >/dev/null 2>&1; then
  RUNTIME="node"
else
  echo "============================================================"
  echo " O Audivise precisa do Python para rodar no Termux."
  echo " Posso instalar o Python agora (baixa ~30 MB, uma única vez)."
  printf " Instalar agora? [s/N]: "
  read -r RESPOSTA
  case "$RESPOSTA" in
    s|S|sim|SIM|Sim)
      pkg update -y && pkg install -y python
      if command -v python >/dev/null 2>&1; then RUNTIME="python";
      else
        echo "A instalação não concluiu. Abra o Termux e rode:"
        echo "  pkg install python"
        echo "Depois execute este arquivo novamente."
        exit 1
      fi
      ;;
    *)
      echo "Sem o Python não dá para iniciar o servidor local."
      echo "Quando quiser, rode no Termux:  pkg install python"
      exit 1
      ;;
  esac
fi

# Descobre qual porta o servidor escolheu (8437 é a primeira tentativa)
PORTA=8437

if [ "$RUNTIME" = "python" ]; then
  python servidor.py --sem-navegador &
else
  node servidor.js --sem-navegador &
fi
PID_SERVIDOR=$!

sleep 2

URL="http://127.0.0.1:${PORTA}/index.html"
echo ""
echo "Audivise rodando em: ${URL}"
echo "Deixe o Termux aberto (tocar na notificação mantém a sessão viva)."
echo "Para encerrar: volte aqui e feche o Termux, ou pressione Ctrl+C."

# Tenta abrir o navegador: termux-open (Termux) → am start (Android) → nada
if command -v termux-open >/dev/null 2>&1; then
  termux-open "${URL}" >/dev/null 2>&1 || true
elif command -v termux-open-url >/dev/null 2>&1; then
  termux-open-url "${URL}" >/dev/null 2>&1 || true
else
  am start -a android.intent.action.VIEW -d "${URL}" >/dev/null 2>&1 || \
    echo "Não consegui abrir o navegador sozinho. Copie o endereço acima no Chrome."
fi

# Mantém o script vivo enquanto o servidor rodar
wait "${PID_SERVIDOR}"
