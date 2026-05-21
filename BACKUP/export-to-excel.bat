@echo off
cd /d "%~dp0"

:: Change these to configure the backup
SET SAVE_PATH=E:\Downloads
SET GITHUB_REPO=eyalBarMaimon/qa-module-shoham

echo Starting QA Backup...
echo.
node export-to-excel.js "%SAVE_PATH%" "%GITHUB_REPO%"
echo.
echo Press any key to close...
pause >nul
