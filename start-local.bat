@echo off
setlocal enabledelayedexpansion
REM ============================================================
REM  Custom Clothing Platform - local dev launcher (Windows)
REM
REM  Run this from the project root (the folder this file is in).
REM  It does first-time setup if needed, then opens 2-3 separate
REM  windows: the Laravel backend, the Next.js frontend, and (if
REM  your backend/.env uses QUEUE_CONNECTION=redis) a queue worker.
REM
REM  See docs\LOCAL_SETUP.md for what each step below actually
REM  does and how to configure everything by hand instead.
REM ============================================================

cd /d "%~dp0"

echo.
echo === Custom Clothing Platform: starting local environment ===
echo.

REM --- Backend .env ---
if not exist "backend\.env" (
    echo [setup] backend\.env not found - copying from backend\.env.example
    copy /y "backend\.env.example" "backend\.env" >nul
    echo [setup] Edit backend\.env now if you have not already ^(database, Cloudinary, Razorpay^),
    echo         then re-run this script. See docs\LOCAL_SETUP.md section E.
    pause
)

REM --- Frontend .env.local ---
if not exist "frontend\.env.local" (
    echo [setup] frontend\.env.local not found - copying from frontend\.env.example
    copy /y "frontend\.env.example" "frontend\.env.local" >nul
)

REM --- Backend dependencies ---
if not exist "backend\vendor" (
    echo [setup] backend\vendor not found - running composer install ^(this can take a few minutes^)...
    pushd backend
    call composer install
    popd
)

REM --- APP_KEY ---
findstr /r /c:"^APP_KEY=$" "backend\.env" >nul
if not errorlevel 1 (
    echo [setup] Generating Laravel APP_KEY...
    pushd backend
    call php artisan key:generate
    popd
)

REM --- Frontend dependencies ---
if not exist "frontend\node_modules" (
    echo [setup] frontend\node_modules not found - running npm install ^(this can take a few minutes^)...
    pushd frontend
    call npm install
    popd
)

REM --- Redis (only if this .env asks for it and Docker is available) ---
findstr /i /c:"CACHE_STORE=redis" "backend\.env" >nul
if not errorlevel 1 (
    where docker >nul 2>nul
    if not errorlevel 1 (
        echo [setup] backend\.env uses Redis - making sure the ccp-redis Docker container is running...
        docker start ccp-redis >nul 2>nul
        if errorlevel 1 (
            docker run -d --name ccp-redis -p 6379:6379 redis:7-alpine >nul 2>nul
        )
    ) else (
        echo [warn] backend\.env has CACHE_STORE=redis but Docker was not found on PATH.
        echo        Start Redis yourself, or switch CACHE_STORE/QUEUE_CONNECTION to file/sync
        echo        in backend\.env - see docs\LOCAL_SETUP.md section A.
    )
)

echo.
echo [start] Opening backend, frontend, and queue-worker windows...
echo.

start "CCP Backend (Laravel :8000)" cmd /k "cd /d "%~dp0backend" && php artisan serve"
start "CCP Frontend (Next.js :3000)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

findstr /i /c:"QUEUE_CONNECTION=redis" "backend\.env" >nul
if not errorlevel 1 (
    start "CCP Queue Worker" cmd /k "cd /d "%~dp0backend" && php artisan queue:work"
)

echo.
echo === Started ===
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   Admin:    http://localhost:3000/admin  ^(admin@example.com / ChangeMe123!^)
echo.
echo Three (or two) new windows just opened - leave them running.
echo Run stop-local.bat to shut everything down.
echo.
pause
