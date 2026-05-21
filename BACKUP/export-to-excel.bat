@echo off
cd /d "%~dp0"
echo מייצא נתונים מ-Firebase לאקסל...
echo.
node export-to-excel.js
echo.
pause
