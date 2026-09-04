@echo off
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js를 찾지 못했어요. 먼저 템플릿의 처음 설치를 마쳐 주세요.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo 설치된 패키지를 찾지 못했어요. 먼저 npm install을 한 번 실행해 주세요.
  pause
  exit /b 1
)

call npm run map
