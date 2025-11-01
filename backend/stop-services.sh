#!/bin/bash

# Sakhi Services Stop Script
# Stops both Express server and ML service

echo "🛑 Stopping Sakhi Services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Kill processes on ports 5000 and 8000
if check_port 5000; then
    echo -e "${YELLOW}⏹️  Stopping Express Server (port 5000)...${NC}"
    lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ Express Server stopped${NC}"
else
    echo -e "${YELLOW}ℹ️  Express Server is not running${NC}"
fi

if check_port 8000; then
    echo -e "${YELLOW}⏹️  Stopping ML Service (port 8000)...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ ML Service stopped${NC}"
else
    echo -e "${YELLOW}ℹ️  ML Service is not running${NC}"
fi

# Also kill any remaining node or python processes with sakhi
echo -e "${YELLOW}🧹 Cleaning up remaining processes...${NC}"
pkill -f "node server.js" 2>/dev/null || true
pkill -f "python3 main.py" 2>/dev/null || true
pkill -f "python main.py" 2>/dev/null || true

echo -e "${GREEN}🎉 All Sakhi services stopped successfully!${NC}"