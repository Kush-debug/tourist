@echo off
echo 🚀 Starting Travel Safe Shield Demo...
echo =====================================

echo 📡 Starting backend server...
start /B cmd /c "cd backend && npm start"

timeout /t 3 /nobreak > nul

echo 🌐 Starting frontend server...
start /B cmd /c "npm run dev"

echo ✅ Demo servers started!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo WebSocket: ws://localhost:8080
echo.
echo Press any key to stop servers
pause > nul

taskkill /F /IM node.exe
