@echo off
cd /d "C:\Hedi\MedTech\Freshman\ISS\frontend\smu-classroom-dashboard"
echo === Running npm install ===
call npm install
if errorlevel 1 (
    echo npm install failed with error level %errorlevel%
    exit /b 1
)
echo.
echo === Running npm run lint ===
call npm run lint
if errorlevel 1 (
    echo npm run lint failed with error level %errorlevel%
    exit /b 1
)
echo.
echo === Running npm run build ===
call npm run build
if errorlevel 1 (
    echo npm run build failed with error level %errorlevel%
    exit /b 1
)
echo.
echo All commands completed successfully!
