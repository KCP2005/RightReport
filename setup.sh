#!/bin/bash

# ReportRight Setup Script

echo "🚀 Setting up ReportRight..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   Run: mongod"
    exit 1
fi

echo "✅ MongoDB is running"

# Start backend
echo "📦 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Create default admin
echo "👤 Creating default admin user..."
curl -X POST http://localhost:5000/api/admin/create \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","role":"super_admin"}' \
  2>/dev/null

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Default admin credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo "   Admin:    http://localhost:5173/admin/login"
echo ""
echo "Press Ctrl+C to stop the backend server"

# Keep script running
wait $BACKEND_PID
