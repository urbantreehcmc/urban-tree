@echo off
chcp 65001 >nul
echo ================================================
echo   UrbanTree GIS - Script Khoi Dong Nhanh
echo ================================================

set "LOCAL_DIR=C:\urban-tree-app"
set "GDRIVE_DIR=g:\My Drive\Web App\UrbanTree\urban-tree"

echo [1/3] Dong bo project sang %LOCAL_DIR%...
if not exist "%LOCAL_DIR%" mkdir "%LOCAL_DIR%"

REM Dong bo thu muc src (khong xoa cac file cu de giu nguyen node_modules)
xcopy /E /I /Y "%GDRIVE_DIR%\src" "%LOCAL_DIR%\src" >nul
copy /Y "%GDRIVE_DIR%\package.json" "%LOCAL_DIR%\" >nul
copy /Y "%GDRIVE_DIR%\tsconfig.json" "%LOCAL_DIR%\" >nul
copy /Y "%GDRIVE_DIR%\next.config.mjs" "%LOCAL_DIR%\" >nul
copy /Y "%GDRIVE_DIR%\postcss.config.mjs" "%LOCAL_DIR%\" >nul
echo Done sync!

echo [2/3] Kiem tra dependencies...
cd /d "%LOCAL_DIR%"
if not exist "node_modules" (
    echo Phat hien chua cai dat thu vien. Bat dau chay npm install...
    call npm.cmd install
    if %ERRORLEVEL% NEQ 0 (
        echo Loi cai dat!
        pause
        exit /b 1
    )
) else (
    echo node_modules da ton tai, bo qua cai dat (tiet kiem thoi gian).
)

echo [3/3] Khoi dong dev server...
echo Mo trinh duyet: http://localhost:3000
start http://localhost:3000
call npm.cmd run dev

