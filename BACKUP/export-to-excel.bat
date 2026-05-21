@echo off
cd /d "%~dp0"

:: Change this path to set where the Excel file is saved
SET SAVE_PATH=E:\Downloads

echo Exporting data from Firebase to Excel...
echo.
node export-to-excel.js "%SAVE_PATH%"
echo.
echo File saved to: %SAVE_PATH%
echo.
echo Press any key to close...
pause >nul
