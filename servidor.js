// ===========================================================================
// COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
// PROJECT / PROJETO: AUDIVISE 1.0
// CONTEXT / CONTEXTO:
//   Continuação do Projeto Integrador V - Engenharia de Computação (UNIVESP).
//   Projeto pessoal e não acadêmico.
//   Arquitetado por Eliezer Tavares de Oliveira.
// LICENSE / LICENÇA: GNU General Public License v3.0 (GPLv3)
// ===========================================================================
// Servidor local mínimo do Audivise 1.0 (alternativa em Node.js).
// Serve apenas os arquivos desta pasta em 127.0.0.1 (nunca na rede externa),
// com os tipos MIME corretos para WebAssembly, e abre o navegador sozinho.
// Nenhum dado sai do dispositivo: este servidor não repassa nada a ninguém.
//
// Opções (para testes automatizados e para o Termux do Android):
//   --porta N          fixa a porta (sem varredura de portas alternativas)
//   --sem-navegador    não abre o navegador automaticamente

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PORTA_INICIAL = 8437;
const PORTA_LIMITE = 8447;
const PASTA = path.dirname(fileURLToPath(import.meta.url));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.wasm': 'application/wasm',
  '.tflite': 'application/octet-stream',
  '.binarypb': 'application/octet-stream',
  '.json': 'application/json',
  '.css': 'text/css',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.toml': 'text/plain; charset=utf-8',
  '.rs': 'text/plain; charset=utf-8',
  '.lean': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
};

function abrirNavegador(url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd, () => { /* ignora falha de abertura automática */ });
}

function iniciar(porta, abrir = true) {
  return new Promise((resolve) => {
    const servidor = http.createServer((req, res) => {
      let caminho = decodeURIComponent((req.url || '/').split('?')[0]);
      if (caminho.endsWith('/')) caminho += 'index.html';

      const arquivo = path.normalize(path.join(PASTA, caminho));
      if (arquivo !== PASTA && !arquivo.startsWith(PASTA + path.sep)) {
        // Bloqueia qualquer acesso fora da pasta do Audivise
        res.writeHead(403); res.end('Acesso negado'); return;
      }

      fs.readFile(arquivo, (erro, conteudo) => {
        if (erro) { res.writeHead(404); res.end('Arquivo não encontrado'); return; }
        const ext = path.extname(arquivo).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME[ext] || 'application/octet-stream',
          'Cache-Control': 'no-store',
        });
        res.end(conteudo);
      });
    });

    servidor.on('error', () => resolve(false));
    servidor.listen(porta, '127.0.0.1', () => resolve(true));
  });
}

function anunciar(url, abrir) {
  console.log('='.repeat(62));
  console.log('AUDIVISE 1.0 - SERVIDOR LOCAL ATIVO');
  console.log(`Endereço no navegador: ${url}`);
  if (abrir) console.log('O navegador deve abrir sozinho em alguns segundos.');
  else console.log('Navegador não aberto automaticamente (--sem-navegador).');
  console.log('Se não abrir, digite o endereço acima manualmente.');
  console.log('IMPORTANTE: deixe esta janela aberta enquanto usar o Audivise.');
  console.log('Para encerrar: feche esta janela ou pressione Ctrl+C.');
  console.log('='.repeat(62));
}

(async () => {
  const args = process.argv.slice(2);
  const semNavegador = args.includes('--sem-navegador');
  const indicePorta = args.indexOf('--porta');
  const portaFixa = indicePorta !== -1 ? Number(args[indicePorta + 1]) : null;

  if (portaFixa) {
    const ok = await iniciar(portaFixa, !semNavegador);
    if (!ok) {
      console.log(`Porta ${portaFixa} ocupada. Feche o outro Audivise e tente de novo.`);
      process.exit(1);
    }
    anunciar(`http://127.0.0.1:${portaFixa}/index.html`, !semNavegador);
    if (!semNavegador) setTimeout(() => abrirNavegador(`http://127.0.0.1:${portaFixa}/index.html`), 1200);
    return;
  }

  let porta = PORTA_INICIAL;
  let ok = false;
  while (porta <= PORTA_LIMITE && !ok) {
    ok = await iniciar(porta, !semNavegador);
    if (!ok) { console.log(`Porta ${porta} ocupada, tentando a próxima…`); porta++; }
  }
  if (!ok) {
    console.log(`Não foi possível abrir nenhuma porta entre ${PORTA_INICIAL} e ${PORTA_LIMITE}.`);
    console.log('Feche outros Audivise abertos e tente de novo.');
    return;
  }

  const url = `http://127.0.0.1:${porta}/index.html`;
  anunciar(url, !semNavegador);
  if (!semNavegador) setTimeout(() => abrirNavegador(url), 1200);
})();
