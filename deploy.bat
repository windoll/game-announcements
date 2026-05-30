@echo off
echo Starting deploy...

cd /d "C:\Users\charlie98783\Desktop\game-announcements"

:: 顯示目前 branch，避免推錯
for /f "tokens=*" %%b in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%b
echo Branch: %BRANCH%
if /i not "%BRANCH%"=="main" (
    echo WARNING: Not on main branch. Press Ctrl+C to abort, or any key to continue.
    pause
)

git add -A

:: commit message 帶時間戳，方便追蹤
for /f "tokens=*" %%t in ('powershell -NoProfile -Command "Get-Date -Format \"yyyy-MM-dd HH:mm\""') do set TS=%%t
git commit -m "update announcement tool %TS%"
if errorlevel 1 (
    echo Nothing to commit.
    goto push
)

:push
git pull --rebase origin main
if errorlevel 1 (
    echo Pull/rebase failed. Run "git rebase --abort" to cancel, or resolve conflicts then "git rebase --continue".
    pause
    exit /b 1
)

git push origin main
if errorlevel 1 (
    echo Push failed - check git output above.
    pause
    exit /b 1
)

echo Deploy done! (%TS%)
exit /b 0
