@echo off
rem ===========================================================================
rem COPYRIGHT (C) 2026 ELIEZER TAVARES DE OLIVEIRA
rem PROJECT / PROJETO: AUDIVISE 1.0
rem CONTEXT / CONTEXTO:
rem   Continuacao do Projeto Integrador V - Engenharia de Computacao (UNIVESP).
rem   Projeto pessoal e nao academico.
rem   Arquitetado por Eliezer Tavares de Oliveira.
rem LICENSE / LICENCA: GNU General Public License v3.0 (GPLv3)
rem ===========================================================================
rem Este arquivo inicia o servidor local do Audivise e abre o navegador.
rem Funciona com Python ou Node.js, o que estiver instalado no computador.
rem Deixe esta janela aberta enquanto usar o Audivise.
rem ===========================================================================

title Audivise 1.0 - Servidor Local
cd /d "%~dp0"

set "RUNTIME="
py -3 --version >nul 2>nul && set "RUNTIME=py -3"
if not defined RUNTIME (
  python --version >nul 2>nul && set "RUNTIME=python"
)
if defined RUNTIME (
  %RUNTIME% "servidor.py"
  goto :fim
)

node --version >nul 2>nul && (
  node "servidor.js"
  goto :fim
)

echo.
echo ============================================================
echo   NAO ENCONTREI PYTHON NEM NODE NESTE COMPUTADOR.
echo.
echo   O Audivise precisa de um deles para iniciar o
echo   servidor local. Escolha uma opcao:
echo.
echo   OPCAO 1 (recomendada): instale o Python gratuito em:
echo     https://www.python.org/downloads/
echo     IMPORTANTE: durante a instalacao, marque a opcao
echo     "Add Python to PATH" (Adicionar ao PATH).
echo.
echo   OPCAO 2: instale o Node.js gratuito em:
echo     https://nodejs.org/
echo.
echo   Depois de instalar, dê duplo clique neste arquivo
echo   INICIAR-AUDIVISE.bat novamente.
echo ============================================================
echo.
pause

:fim
