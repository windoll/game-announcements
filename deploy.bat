@echo off
echo Starting deploy...

cd /d "C:\Users\charlie98783\Desktop\game-announcements"

git add -A
git commit -m "update announcement tool"
if errorlevel 1 (
    echo Nothing to commit or commit failed
    pause
    exit /b 1
)

git pull --rebase origin main
if errorlevel 1 (
    echo Pull/rebase failed
    pause
    exit /b 1
)

git push origin main
if errorlevel 1 (
    echo Push failed - check git output above
    pause
    exit /b 1
)

echo Deploy done!
pause
