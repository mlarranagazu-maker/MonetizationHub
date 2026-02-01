@echo off
REM OfertasFlash Bot - Script de ejecución automática
cd /d "c:\Temp Mikel\New VSCode\10 Agentes\MonetizationHub\projects\01-ofertasflash-bot"
call node --import tsx src/index.ts >> logs\bot_%date:~-4,4%%date:~-7,2%%date:~-10,2%.log 2>&1
