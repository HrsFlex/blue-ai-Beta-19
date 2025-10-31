#!/bin/bash

# Blue.ai Mental Health Companion - Startup Script
# This script starts both the frontend and backend servers

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="Blue.ai Mental Health Companion"
BACKEND_PORT=5000
FRONTEND_PORT=3000
PROJECT_DIR="/home/hrsflex/SakhiClient"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  $PROJECT_NAME${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on specific port
kill_port() {
    local port=$1
    print_warning "Attempting to free port $port..."

    # Get process IDs using the port
    local pids=$(lsof -ti:$port 2>/dev/null)

    if [ -n "$pids" ]; then
        print_status "Killing processes on port $port: $pids"
        echo "$pids" | xargs kill -9 2>/dev/null
        sleep 2
        print_status "Port $port is now free"
    else
        print_status "Port $port is already free"
    fi
}

# Function to start backend server
start_backend() {
    print_status "Starting Backend Server..."

    # Check if backend port is in use
    if check_port $BACKEND_PORT; then
        kill_port $BACKEND_PORT
    fi

    # Start backend server
    print_status "Starting backend on port $BACKEND_PORT..."
    cd "$PROJECT_DIR"
    node backend/server.js &
    BACKEND_PID=$!

    # Wait a moment for server to start
    sleep 3

    # Check if backend started successfully
    if check_port $BACKEND_PORT; then
        print_status "✅ Backend Server started successfully (PID: $BACKEND_PID)"
        print_status "📡 Backend URL: http://localhost:$BACKEND_PORT"
        print_status "🔗 API Documentation: http://localhost:$BACKEND_PORT/api"
    else
        print_error "❌ Failed to start Backend Server"
        return 1
    fi
}

# Function to start frontend server
start_frontend() {
    print_status "Starting Frontend Server..."

    # Check if frontend port is in use
    if check_port $FRONTEND_PORT; then
        kill_port $FRONTEND_PORT
    fi

    # Start frontend server
    print_status "Starting frontend on port $FRONTEND_PORT..."
    cd "$PROJECT_DIR"
    npm start &
    FRONTEND_PID=$!

    print_status "Frontend starting... (PID: $FRONTEND_PID)"
    print_status "🌐 Frontend URL: http://localhost:$FRONTEND_PORT"
}

# Function to show server status
show_status() {
    echo ""
    print_header
    echo -e "${PURPLE}🔍 Server Status:${NC}"
    echo "================================"

    if check_port $BACKEND_PORT; then
        echo -e "${GREEN}✅ Backend Server: RUNNING (http://localhost:$BACKEND_PORT)${NC}"
    else
        echo -e "${RED}❌ Backend Server: STOPPED${NC}"
    fi

    if check_port $FRONTEND_PORT; then
        echo -e "${GREEN}✅ Frontend Server: RUNNING (http://localhost:$FRONTEND_PORT)${NC}"
    else
        echo -e "${RED}❌ Frontend Server: STOPPED${NC}"
    fi
}

# Main execution
main() {
    print_header
    echo -e "${PURPLE}🚀 Starting $PROJECT_NAME${NC}"
    echo ""

    # Start backend
    start_backend
    if [ $? -ne 0 ]; then
        print_error "Backend startup failed. Exiting."
        exit 1
    fi

    echo ""
    # Start frontend
    start_frontend

    echo ""
    print_status "✅ Servers are starting up..."
    echo ""
    show_status

    echo ""
    print_header
    echo -e "${GREEN}🎉 $PROJECT_NAME is starting!${NC}"
    echo ""
    echo -e "${CYAN}📱 Access the application at:${NC}"
    echo -e "   Frontend: ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "   Backend API: ${BLUE}http://localhost:$BACKEND_PORT/api${NC}"
    echo ""
    echo -e "${CYAN}🔧 Available Commands:${NC}"
    echo -e "   ${YELLOW}./start.sh status${NC} - Show server status"
    echo -e "   ${YELLOW}./start.sh stop${NC} - Stop all servers"
    echo -e "   ${YELLOW}./start.sh help${NC} - Show help"
    echo ""
    echo -e "${PURPLE}Frontend may take 1-2 minutes to fully compile${NC}"
    echo -e "${PURPLE}Check http://localhost:$FRONTEND_PORT in your browser${NC}"
    echo ""

    # Exit the script, letting the servers run in background
    exit 0
}

# Handle command line arguments
case "${1:-}" in
    "status")
        show_status
        exit 0
        ;;
    "stop")
        print_status "Stopping all servers..."
        kill_port $BACKEND_PORT
        kill_port $FRONTEND_PORT
        pkill -f "node backend/server.js" 2>/dev/null
        pkill -f "npm start" 2>/dev/null
        pkill -f "react-scripts start" 2>/dev/null
        print_status "All servers stopped."
        exit 0
        ;;
    "help"|"-h"|"--help")
        echo "Blue.ai Startup Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Start both frontend and backend servers"
        echo "  status     Show current server status"
        echo "  stop       Stop all servers"
        echo "  help       Show this help message"
        echo ""
        exit 0
        ;;
    "")
        # Default behavior - start servers
        main
        ;;
    *)
        print_error "Unknown command: $1"
        print_error "Use '$0 help' for available commands"
        exit 1
        ;;
esac