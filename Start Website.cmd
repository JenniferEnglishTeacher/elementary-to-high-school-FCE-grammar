@echo off
setlocal
cd /d "%~dp0"
set "CODEX_NODE=C:\Users\Jennifer\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%CODEX_NODE%" (
  start "Grammar Review Website Server" "%CODEX_NODE%" server.mjs
) else (
  start "Grammar Review Website Server" node server.mjs
)
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8877/"
endlocal
