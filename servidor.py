#!/usr/bin/env python3
# ===========================================================================
# COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
# PROJECT / PROJETO: AUDIVISE 1.0
# CONTEXT / CONTEXTO:
#   Continuação do Projeto Integrador V - Engenharia de Computação (UNIVESP).
#   Projeto pessoal e não acadêmico.
#   Arquitetado por Eliezer Tavares de Oliveira.
# LICENSE / LICENÇA: GNU General Public License v3.0 (GPLv3)
# ===========================================================================
# Servidor local mínimo do Audivise 1.0.
# Serve apenas os arquivos desta pasta em 127.0.0.1 (nunca na rede externa),
# com os tipos MIME corretos para WebAssembly, e abre o navegador sozinho.
# Nenhum dado sai do dispositivo: este servidor não repassa nada a ninguém.
#
# Opções (para testes automatizados e para o Termux do Android):
#   --porta N          fixa a porta (sem varredura de portas alternativas)
#   --sem-navegador    não abre o navegador automaticamente

import argparse
import http.server
import json
import os
import socketserver
import sys
import threading
import webbrowser

PORTA_INICIAL = 8437
PORTA_LIMITE = 8447

PASTA = os.path.dirname(os.path.abspath(__file__))


class Manipulador(http.server.SimpleHTTPRequestHandler):
    """Servidor de arquivos estáticos com MIME correto para WASM."""

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".wasm": "application/wasm",
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".tflite": "application/octet-stream",
        ".binarypb": "application/octet-stream",
        ".json": "application/json",
        ".html": "text/html",
        ".webmanifest": "application/manifest+json",
        ".svg": "image/svg+xml",
        ".png": "image/png",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PASTA, **kwargs)

    def end_headers(self):
        # Impede que o navegador guarde versões antigas dos arquivos locais
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, formato, *args):
        # Silencioso: evita poluir a janela para usuários de leitor de tela
        pass


def iniciar(porta, abrir_navegador=True):
    """Sobe o servidor na porta dada; devolve True se conseguiu."""
    try:
        socketserver.TCPServer.allow_reuse_address = True
        servidor = socketserver.ThreadingTCPServer(("127.0.0.1", porta), Manipulador)
    except OSError:
        return False

    url = f"http://127.0.0.1:{porta}/index.html"
    print("=" * 62)
    print("AUDIVISE 1.0 - SERVIDOR LOCAL ATIVO")
    print(f"Endereço no navegador: {url}")
    if abrir_navegador:
        print("O navegador deve abrir sozinho em alguns segundos.")
    else:
        print("Navegador não aberto automaticamente (--sem-navegador).")
    print("Se não abrir, digite o endereço acima manualmente.")
    print("IMPORTANTE: deixe esta janela aberta enquanto usar o Audivise.")
    print("Para encerrar: feche esta janela ou pressione Ctrl+C.")
    print("=" * 62, flush=True)

    if abrir_navegador:
        threading.Timer(1.2, lambda: webbrowser.open(url)).start()
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        servidor.server_close()
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Servidor local do Audivise 1.0")
    parser.add_argument("--porta", type=int, default=None,
                        help="porta fixa (padrão: varre 8437-8447)")
    parser.add_argument("--sem-navegador", action="store_true",
                        help="não abre o navegador automaticamente")
    args = parser.parse_args()

    if args.porta is not None:
        ok = iniciar(args.porta, abrir_navegador=not args.sem_navegador)
        if not ok:
            print(f"Porta {args.porta} ocupada. Feche o outro Audivise e tente de novo.")
            sys.exit(1)
        sys.exit(0)

    porta = PORTA_INICIAL
    while porta <= PORTA_LIMITE:
        if iniciar(porta, abrir_navegador=not args.sem_navegador):
            sys.exit(0)
        print(f"Porta {porta} ocupada, tentando a próxima…")
        porta += 1
    print("Não foi possível abrir nenhuma porta entre "
          f"{PORTA_INICIAL} e {PORTA_LIMITE}. Feche outros Audivise abertos e tente de novo.")
    input("Pressione Enter para sair…")
