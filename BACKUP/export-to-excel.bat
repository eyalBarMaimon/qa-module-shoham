@echo off
cd /d "%~dp0"

:: ניתן לשנות את הנתיב כאן בלבד
SET SAVE_PATH=E:\Downloads

echo מייצא נתונים מ-Firebase לאקסל...
echo.
node export-to-excel.js "%SAVE_PATH%"
echo.
echo הקובץ נשמר ב:
echo %SAVE_PATH%
echo.
pause
