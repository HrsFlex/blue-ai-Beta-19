#!/usr/bin/env python3
"""
Setup script for Sakhi AI Standalone Application
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required.")
        print(f"   Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    print(f"✅ Python version: {version.major}.{version.minor}.{version.micro}")
    return True

def create_directories():
    """Create necessary directories"""
    directories = [
        'logs',
        'uploads',
        'static/audio',
        'chroma_db',
        'models'
    ]

    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def setup_environment():
    """Setup environment file"""
    env_file = Path('.env')
    env_example = Path('.env.example')

    if not env_file.exists() and env_example.exists():
        import shutil
        shutil.copy(env_example, env_file)
        print("✅ Created .env file from template")
        print("📝 Please edit .env file with your API keys")
    elif env_file.exists():
        print("✅ .env file already exists")
    else:
        print("⚠️  No .env.example file found")

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing Python dependencies...")
    try:
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'
        ])
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False
    return True

def download_nltk_data():
    """Download required NLTK data"""
    print("📚 Downloading NLTK data...")
    try:
        import nltk
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        print("✅ NLTK data downloaded")
    except Exception as e:
        print(f"⚠️  Failed to download NLTK data: {e}")

def check_optional_dependencies():
    """Check optional dependencies and provide guidance"""
    print("\n🔍 Checking optional dependencies...")

    optional_libs = {
        'pygame': ['Audio playback for CLI', 'pip install pygame'],
        'sounddevice': ['Advanced audio recording', 'pip install sounddevice'],
        'opencv-python': ['Facial emotion detection', 'pip install opencv-python'],
        'face_recognition': ['Face recognition features', 'pip install face-recognition'],
        'textblob': ['Enhanced sentiment analysis', 'pip install textblob'],
        'transformers': ['Advanced emotion detection', 'pip install transformers torch'],
        'elevenlabs': ['Premium voice synthesis', 'pip install elevenlabs']
    }

    missing_libs = []
    for lib, description in optional_libs.items():
        try:
            __import__(lib)
            print(f"✅ {lib}: {description[0]}")
        except ImportError:
            print(f"❌ {lib}: {description[0]} - {description[1]}")
            missing_libs.append(lib)

    if missing_libs:
        print(f"\n⚠️  {len(missing_libs)} optional dependencies missing")
        print("   The application will work without them, but some features may be limited")

def test_installation():
    """Test basic installation"""
    print("\n🧪 Testing installation...")

    try:
        # Test imports
        from src.core.ai_companion import AICompanion
        from src.core.voice_engine import VoiceEngine
        from src.core.emotion_detector import EmotionDetector
        from src.core.rag_engine import RAGEngine
        from src.utils.config import Config
        print("✅ Core modules imported successfully")

        # Test configuration
        config_status = Config.validate_config()
        if config_status['valid']:
            print("✅ Configuration is valid")
        else:
            print("⚠️  Configuration issues found:")
            for issue in config_status['issues']:
                print(f"   • {issue}")
            for warning in config_status['warnings']:
                print(f"   • {warning}")

        return True

    except Exception as e:
        print(f"❌ Installation test failed: {e}")
        return False

def show_next_steps():
    """Show next steps for the user"""
    print("\n🎉 Installation complete!")
    print("\n📋 Next steps:")
    print("1. Edit .env file with your API keys")
    print("2. Run the application:")
    print("   • Web interface: python app.py")
    print("   • CLI interface: python cli.py --mode chat")
    print("   • Server mode:   python cli.py --mode server")
    print("\n📖 For more information, see README.md")

def main():
    """Main setup function"""
    print("🚀 Sakhi AI Standalone Setup")
    print("=" * 40)

    # Check Python version
    if not check_python_version():
        sys.exit(1)

    # Create directories
    create_directories()

    # Setup environment
    setup_environment()

    # Install dependencies
    if not install_dependencies():
        sys.exit(1)

    # Download NLTK data
    download_nltk_data()

    # Check optional dependencies
    check_optional_dependencies()

    # Test installation
    if not test_installation():
        print("\n⚠️  Installation completed with some issues")
        print("   Check the error messages above for troubleshooting")
    else:
        # Show next steps
        show_next_steps()

if __name__ == '__main__':
    main()