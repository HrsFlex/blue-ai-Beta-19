#!/bin/bash

# Sakhi Multi-Service Startup Script
# Starts both Express server and ML service

echo "🚀 Starting Sakhi Advanced Emotion Detection Services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check Python environment
check_python() {
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python 3 is not installed${NC}"
        exit 1
    fi

    if ! python3 -c "import fastapi" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Installing Python dependencies...${NC}"
        cd ml-service
        pip3 install -r requirements.txt
        cd ..
    fi
}

# Function to check Node.js environment
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi

    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⚠️  Installing Node.js dependencies...${NC}"
        npm install
    fi
}

# Kill existing processes on ports 5000 and 8000
echo -e "${BLUE}🔧 Cleaning up existing processes...${NC}"
if check_port 5000; then
    echo "Stopping process on port 5000..."
    lsof -ti:5000 | xargs kill -9 2>/dev/null || true
fi

if check_port 8000; then
    echo "Stopping process on port 8000..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
fi

# Check environments
echo -e "${BLUE}🔍 Checking environment requirements...${NC}"
check_python
check_node

# Start ML Service
echo -e "${BLUE}🧠 Starting ML Service on port 8000...${NC}"
cd ml-service
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Creating .env file for ML service...${NC}"
    cat > .env << EOF
# Google Gemini AI API Key (required for advanced responses)
GEMINI_API_KEY=your_gemini_api_key_here

# Service Configuration
PORT=8000
HOST=0.0.0.0
LOG_LEVEL=info

# Model Thresholds
EMOTION_THRESHOLD=0.6
INTENT_THRESHOLD=0.6
EOF
fi

# Start ML service in background
python3 main.py > ../ml-service.log 2>&1 &
ML_PID=$!
cd ..

# Wait for ML service to start
echo -e "${YELLOW}⏳ Waiting for ML service to start...${NC}"
for i in {1..30}; do
    if check_port 8000; then
        echo -e "${GREEN}✅ ML Service started successfully (PID: $ML_PID)${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ ML Service failed to start${NC}"
        echo "Check ml-service.log for details:"
        tail -10 ml-service.log
        exit 1
    fi
    sleep 1
done

# Start Express Server
echo -e "${BLUE}🌐 Starting Express Server on port 5000...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Creating .env file for Express server...${NC}"
    cat > .env << EOF
# Server Configuration
PORT=5000

# ML Service Configuration
ML_SERVICE_URL=http://localhost:8000

# Optional: Add your API keys here
# GEMINI_API_KEY=your_gemini_api_key_here
EOF
fi

# Start Express server in background
node server.js > server.log 2>&1 &
SERVER_PID=$!

# Wait for Express server to start
echo -e "${YELLOW}⏳ Waiting for Express server to start...${NC}"
for i in {1..30}; do
    if check_port 5000; then
        echo -e "${GREEN}✅ Express Server started successfully (PID: $SERVER_PID)${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Express Server failed to start${NC}"
        echo "Check server.log for details:"
        tail -10 server.log
        # Kill ML service before exit
        kill $ML_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Success message
echo ""
echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo ""
echo "📊 Service Status:"
echo "  • ML Service:      http://localhost:8000"
echo "  • Express Server:  http://localhost:5000"
echo "  • API Docs:        http://localhost:8000/docs"
echo "  • Health Check:    http://localhost:5000/api/emotion/health"
echo ""
echo "📋 Service PIDs:"
echo "  • ML Service:      $ML_PID"
echo "  • Express Server:  $SERVER_PID"
echo ""
echo "🛠️  Logs:"
echo "  • ML Service:      ml-service.log"
echo "  • Express Server:  server.log"
echo ""
echo -e "${BLUE}🔗 Available Endpoints:${NC}"
echo "  • Enhanced Chat:       POST /chatbot"
echo "  • Text Emotion:        POST /api/emotion/text"
echo "  • Facial Emotion:      POST /api/emotion/facial"
echo "  • Voice Emotion:       POST /api/emotion/voice"
echo "  • Multi-Modal:         POST /api/emotion/multimodal"
echo "  • Emotion Dashboard:   GET /api/emotion/dashboard"
echo "  • Health Check:        GET /api/emotion/health"
echo ""
echo -e "${YELLOW}💡 To stop all services:${NC}"
echo "  ./stop-services.sh"
echo "  or run: kill $ML_PID $SERVER_PID"
echo ""
echo -e "${GREEN}✨ Sakhi is now running with advanced emotion detection!${NC}"