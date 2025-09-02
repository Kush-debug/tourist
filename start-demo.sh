#!/bin/bash
echo "🚀 Starting Travel Safe Shield Demo..."
echo "====================================="

# Start backend server
echo "📡 Starting backend server..."
cd backend && npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Demo servers started!"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo "WebSocket: ws://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop
wait $FRONTEND_PID $BACKEND_PID
