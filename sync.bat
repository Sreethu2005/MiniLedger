@echo off
setlocal
set "MSG=%*"
if "%MSG%"=="" set "MSG=chore: sync updates"

git add .
git diff-index --quiet HEAD --
if %errorlevel% equ 0 (
    echo [MiniLedger] No new changes to commit.
    exit /b 0
)

git commit -m "%MSG%"
git push origin main
echo [MiniLedger] Successfully committed and pushed to GitHub!
