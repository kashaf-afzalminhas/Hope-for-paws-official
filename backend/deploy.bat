@echo off
echo 🚀 Deploying Hope for Paws Backend to Vercel...

REM Check if vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Vercel CLI is not installed. Please install it first:
    echo npm install -g vercel
    pause
    exit /b 1
)

REM Check if we're in the backend directory
if not exist "app.js" (
    echo ❌ Please run this script from the backend directory
    pause
    exit /b 1
)

REM Deploy to Vercel
echo 📦 Deploying...
vercel --prod

echo ✅ Deployment completed!
echo 🔗 Your backend should be available at: https://hope-for-paws-official-backend.vercel.app
echo.
echo 🧪 To test the deployment, run:
echo node test-deployment.js
pause 