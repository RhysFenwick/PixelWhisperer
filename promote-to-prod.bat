@echo off
REM Promote files from /dev to production (root directory)
REM This script copies dev files to prod and updates paths

echo ============================================
echo  Pixel Whisperer: Promote Dev to Prod
echo ============================================
echo.
echo This will:
echo  - Copy dev/index.html to index.html
echo  - Copy dev/script.js to script.js
echo  - Copy dev/style.css to style.css
echo  - Update all paths (remove ../ prefixes)
echo  - Remove (DEV) indicators
echo.
echo WARNING: This will OVERWRITE production files!
echo.

set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" (
    echo.
    echo Cancelled by user.
    pause
    exit /b
)

echo.
echo Processing files...
echo.

REM Create temp directory for processing
if not exist temp mkdir temp

REM Process index.html - update paths and remove (DEV) indicators
echo [1/3] Processing index.html...
powershell -Command "(Get-Content 'dev\index.html') -replace '\.\./img/', 'img/' -replace '\.\./hashscript\.js', 'hashscript.js' -replace '\./script\.js', 'script.js' -replace '\./style\.css', 'style.css' -replace 'Pixel Whisperer \(DEV[^\)]*\)', 'Pixel Whisperer' -replace '\?v=[0-9.]+', '' | Set-Content 'temp\index.html'"
copy /Y temp\index.html index.html > nul
echo       - Copied and updated paths

REM Process script.js - update paths and remove DEV markers
echo [2/3] Processing script.js...
powershell -Command "(Get-Content 'dev\script.js') -replace '\.\./colours\.json', 'colours.json' -replace 'Pixel Whisperer \(DEV[^\)]*\)', 'Pixel Whisperer' -replace '// \*\*\* DEV VERSION.*\n', '' -replace 'console\.log\(''.* DEV SCRIPT LOADED.*''\);?\n?', '' | Set-Content 'temp\script.js'"
copy /Y temp\script.js script.js > nul
echo       - Copied and updated paths

REM Process style.css - direct copy (no path changes needed)
echo [3/3] Processing style.css...
copy /Y dev\style.css style.css > nul
echo       - Copied (no changes needed)

REM Clean up temp directory
rmdir /S /Q temp

echo.
echo ============================================
echo  SUCCESS! Dev changes promoted to prod.
echo ============================================
echo.
echo Next steps:
echo  1. Test the production version
echo  2. Commit changes: git add . ^&^& git commit -m "Promoted dev changes to prod"
echo  3. Push to GitHub: git push
echo.
pause
