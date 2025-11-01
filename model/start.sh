#!/bin/bash

# Blue-ai Backend Startup Script
# This script sets up the virtual environment, installs dependencies, and starts the FastAPI server

set -e  # Exit on any error

echo "🚀 Starting Blue-ai Backend Setup..."
echo "========================================"

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed or not in PATH"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "📦 Virtual environment already exists"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip --quiet

# Install dependencies
echo "📥 Installing dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt --quiet
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Error: requirements.txt not found"
    exit 1
fi

# Check if model file exists
if [ ! -f "bert_model_corrected.pt" ]; then
    echo "⚠️  Warning: bert_model_corrected.pt not found"
    echo "   Make sure to place your trained model file in the backend directory"
fi

# Start the FastAPI server
echo "🌟 Starting FastAPI server..."
echo "========================================"
echo "🔗 Server will be available at: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo "📖 ReDoc Documentation: http://localhost:8000/redoc"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"

# Run the server with auto-reload for development
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
