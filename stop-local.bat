@echo off
REM ============================================================
REM  Custom Clothing Platform - local dev stopper (Windows)
REM
REM  Closes the windows opened by start-local.bat and, if it was
REM  started that way, stops the ccp-redis Docker container.
REM  Your data (Postgres database, Redis container itself) is not
REM  deleted - only the running processes are stopped.
REM ============================================================

echo.
echo === Stopping Custom Clothing Platform local environment ===
echo.

taskkill /FI "WINDOWTITLE eq CCP Backend*" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq CCP Frontend*" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq CCP Queue Worker*" /T /F >nul 2>nul

where docker >nul 2>nul
if not errorlevel 1 (
    docker stop ccp-redis >nul 2>nul
)

echo Done. (If a window did not close, it may not have been started by
echo start-local.bat - close it manually with Ctrl+C.)
echo.
pause
