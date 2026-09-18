@echo off
chcp 65001 > nul
title 봉사 보고 관리 시스템 - 로컬 실행

echo ========================================================
echo   봉사 보고 관리 시스템 (Ministry Hub) 실행 중...
echo ========================================================
echo.
echo  * 기본 접속 (전도인 보고): http://localhost:5173/
echo  * 관리자 접속:             http://localhost:5173/?page=manager
echo.
echo  잠시 후 웹 브라우저가 자동으로 실행됩니다.
echo  종료하려면 이 창을 닫거나 Ctrl+C 를 누르세요.
echo ========================================================
echo.

npm run dev
pause
