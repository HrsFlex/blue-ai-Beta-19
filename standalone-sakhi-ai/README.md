# Sakhi AI - Standalone Mental Health Companion

A comprehensive Python-based mental health companion application with RAG (Retrieval-Augmented Generation) capabilities, voice interaction, and intelligent document processing.

## 🌟 Features

### 🤖 AI-Powered Conversations
- **Intelligent Chat**: Context-aware conversations using Google's Gemini AI
- **Emotion Detection**: Real-time emotion analysis from text input
- **RAG Integration**: Personalized responses based on uploaded medical documents
- **Fallback Support**: Graceful degradation when AI services are unavailable

### 📚 Document Intelligence
- **PDF Processing**: Extract and process medical documents, reports, and prescriptions
- **Vector Storage**: ChromaDB for efficient document retrieval and semantic search
- **Smart Chunking**: Intelligent text segmentation for better context retrieval
- **Metadata Extraction**: Automatic categorization and indexing of medical documents

### 🎤 Voice Capabilities
- **Text-to-Speech**: Natural voice synthesis using pyttsx3 (local) and ElevenLabs (cloud)
- **Emotion-Aware Speech**: Voice modulation based on detected emotions
- **Multiple Voice Options**: Support for different voice profiles and languages

### 🧠 Mental Health Assessment
- **PHQ-9 Depression Screening**: Evidence-based depression assessment
- **GAD-7 Anxiety Screening**: Standardized anxiety evaluation
- **PSS-4 Stress Assessment**: Perceived stress measurement
- **Comprehensive Analysis**: Combined scoring with personalized recommendations

### 🌐 Multiple Interfaces
- **Web Interface**: Modern, responsive web UI with real-time chat
- **CLI Tool**: Command-line interface for power users and automation
- **API-First**: RESTful API for integration with other applications

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip package manager
- Google AI API key (for AI features)
- ElevenLabs API key (optional, for premium voice synthesis)

### Installation

1. **Clone or download the application:**
   ```bash
   cd standalone-sakhi-ai
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Run the application:**

   **Web Interface:**
   ```bash
   python app.py
   ```
   Then open http://localhost:5000 in your browser.

   **Command Line Interface:**
   ```bash
   python cli.py --mode chat
   ```

   **Server Mode:**
   ```bash
   python cli.py --mode server --host 0.0.0.0 --port 5000
   ```

## 📖 Usage Guide

### Web Interface

1. **Chat**: Simply type your messages and Sakhi will respond with personalized support
2. **Upload Documents**: Drag and drop PDF medical reports for enhanced, context-aware responses
3. **Voice Interaction**: Click the microphone button for voice input (if supported)
4. **Assessments**: Take mental health screenings for personalized recommendations

### CLI Interface

**Interactive Chat Mode:**
```bash
python cli.py --mode chat
```

Available commands in chat mode:
- `help` - Show available commands
- `health` - Display system health status
- `assessment` - Run mental health assessment
- `voice <text>` - Convert text to speech
- `quit/exit` - Exit the application

### API Usage

**Health Check:**
```bash
curl http://localhost:5000/api/v1/health
```

**Send Chat Message:**
```bash
curl -X POST http://localhost:5000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How are you feeling today?", "session_id": "test_session"}'
```

**Upload Document:**
```bash
curl -X POST http://localhost:5000/api/v1/documents/upload \
  -F "file=@medical_report.pdf" \
  -F "session_id=test_session"
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# AI Model Configuration
GOOGLE_API_KEY=your_google_api_key_here
OPENAI_API_KEY=your_openai_api_key_here  # Optional
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here  # Optional

# Database Configuration
DATABASE_URL=sqlite:///sakhi_ai.db

# Application Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your_secret_key_here

# Voice Configuration
ELEVENLABS_VOICE_ID=your_voice_id_here
TTS_ENGINE=pyttsx3

# RAG Configuration
CHROMA_PERSIST_DIRECTORY=./chroma_db
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Feature Flags
ENABLE_VOICE_RECOGNITION=True
ENABLE_FACE_EMOTION_DETECTION=True
ENABLE_DOCUMENT_UPLOAD=True
ENABLE_RAG_SYSTEM=True
ENABLE_MENTAL_HEALTH_ASSESSMENT=True
```

## 📁 Project Structure

```
standalone-sakhi-ai/
├── app.py                          # Main Flask application
├── cli.py                          # Command-line interface
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment template
├── README.md                       # This file
├── src/
│   ├── core/
│   │   ├── ai_companion.py         # AI chat companion
│   │   ├── voice_engine.py         # Text-to-speech engine
│   │   ├── emotion_detector.py     # Emotion analysis
│   │   ├── document_processor.py   # PDF/document processing
│   │   ├── mental_health_assessor.py # Mental health assessments
│   │   └── rag_engine.py           # RAG implementation
│   └── utils/
│       ├── config.py               # Configuration management
│       ├── database.py             # Database operations
│       └── logger.py               # Logging utilities
├── templates/
│   └── index.html                  # Web interface
├── static/
│   └── audio/                      # Generated audio files
├── uploads/                        # Uploaded documents
├── chroma_db/                      # Vector database
├── logs/                           # Application logs
└── models/                         # ML model files
```

## 🛠️ Development

### Running Tests

```bash
# Run health check
curl http://localhost:5000/api/v1/health

# Test chat endpoint
curl -X POST http://localhost:5000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Sakhi!"}'
```

### Adding New Features

1. **New Assessment Types**: Add templates to `mental_health_assessor.py`
2. **Voice Engines**: Extend `voice_engine.py` with new TTS providers
3. **Document Types**: Update `document_processor.py` for new file formats
4. **Emotion Detection**: Enhance `emotion_detector.py` with new models

### Logging

Logs are automatically written to `logs/sakhi_ai.log` with different levels:
- `INFO`: General operational information
- `WARNING`: Non-critical issues
- `ERROR`: Errors that need attention
- `DEBUG`: Detailed debugging information

## 🔒 Privacy & Security

- **Local Processing**: Most processing happens locally on your machine
- **Data Encryption**: Sensitive data is encrypted at rest
- **No Data Sharing**: Your personal data is never shared with third parties
- **Secure APIs**: All API communications use HTTPS when available
- **Session Isolation**: Each user session is isolated and protected

## 🆘 Support & Resources

### Crisis Support
If you or someone you know is in crisis:
- **National Suicide Prevention Lifeline**: 988
- **Crisis Text Line**: Text HOME to 741741
- **Emergency Services**: 911

### Professional Help
This application is not a substitute for professional medical care. Always consult with qualified healthcare providers for medical advice and treatment.

### Troubleshooting

**Common Issues:**

1. **Module Import Errors**: Ensure all dependencies are installed
   ```bash
   pip install -r requirements.txt
   ```

2. **API Key Issues**: Verify your Google AI API key is valid and has sufficient quota

3. **Voice Issues**: pyttsx3 works offline, ElevenLabs requires internet and API key

4. **Document Upload Fails**: Check file size (max 16MB) and format (PDF only)

5. **Memory Issues**: Vector database may use significant RAM with large document collections

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- **Google AI**: For providing the Gemini AI model
- **ElevenLabs**: For high-quality voice synthesis
- **ChromaDB**: For efficient vector storage and retrieval
- **NLTK & TextBlob**: For natural language processing
- **Flask**: For the web framework
- **Tailwind CSS**: For the beautiful UI components

---

**Built with ❤️ for mental health support and wellness**