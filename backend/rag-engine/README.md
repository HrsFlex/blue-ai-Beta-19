# Sakhi RAG Engine

A comprehensive Retrieval-Augmented Generation (RAG) system for the Sakhi mental health companion, enabling personalized AI responses based on user's medical documents and historical reports.

## 🚀 Features

### Core Capabilities
- **📄 PDF Processing**: Extract and process medical reports, lab results, and health documents
- **🔍 Vector Search**: ChromaDB-powered semantic search for context retrieval
- **🧠 AI Integration**: Gemini LLM for intelligent, context-aware responses
- **🗣️ Voice Synthesis**: ElevenLabs API for bilingual (Hindi/English) speech generation
- **🏥 Medical Context**: Specialized processing for medical terminology and data

### Language Support
- **Hindi**: Native Devanagari script support with appropriate voice synthesis
- **English**: Standard English responses with medical terminology
- **Mixed Language**: Automatic detection and handling of Hinglish content

### Medical Intelligence
- **Report Analysis**: Blood tests, X-rays, lab results, prescriptions
- **Context Extraction**: Patient information, vital signs, medical history
- **Semantic Search**: Find relevant medical context based on user queries
- **Privacy-First**: User-isolated vector spaces for data security

## 📋 Prerequisites

### Required Services
1. **ChromaDB** (Vector Database)
   ```bash
   docker run -d --name chromadb -p 8000:8000 chromadb/chromadb
   ```

2. **Node.js** (v16 or higher)
   ```bash
   node --version  # Should be v16+
   npm --version   # Should be v8+
   ```

### API Keys Required
- **Google Gemini API Key**: For LLM responses
- **ElevenLabs API Key**: For voice synthesis

## ⚙️ Installation

### 1. Clone and Setup
```bash
cd backend/rag-engine
npm install
```

### 2. Environment Configuration
Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required API Keys
GEMINI_API_KEY=your_gemini_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Server Configuration
RAG_ENGINE_PORT=6000

# Vector Database (ChromaDB)
CHROMA_HOST=localhost
CHROMA_PORT=8000

# Voice Configuration
ELEVENLABS_VOICE_ID_HINDI=pNInz6obpgDQGcFmaJgB
ELEVENLABS_VOICE_ID_ENGLISH=21m00Tcm4TlvDq8ikWAM

# Processing Configuration
CHUNK_SIZE=1000
TOP_K_DOCUMENTS=5
SIMILARITY_THRESHOLD=0.7
```

### 3. Start ChromaDB
```bash
docker run -d --name chromadb -p 8000:8000 chromadb/chromadb
```

### 4. Start RAG Engine
```bash
# Development
npm run dev

# Production
npm start
```

The server will start on `http://localhost:6000`

## 🔌 API Documentation

### Health Check
```http
GET /health
```

### Document Management
```http
# Upload PDF document
POST /api/documents/upload
Content-Type: multipart/form-data

# Get user documents
GET /api/documents?userId={userId}&limit={limit}

# Delete document
DELETE /api/documents/{documentId}?userId={userId}
```

### Chat & RAG
```http
# Text chat with RAG
POST /api/chat
{
  "query": "What do my blood test results show?",
  "userId": "user123",
  "language": "en",
  "options": {
    "includeMedicalAdvice": true,
    "includeSources": true
  }
}

# Voice chat with RAG
POST /api/chat/voice
{
  "query": "मेरे ब्लड टेस्ट रिपोर्ट क्या दिखाते हैं?",
  "userId": "user123",
  "emotion": "caring"
}
```

### Voice Synthesis
```http
# Basic speech synthesis
POST /api/voice/synthesize
{
  "text": "Hello, how can I help you today?",
  "language": "auto"
}

# Emotional speech synthesis
POST /api/voice/emotional
{
  "text": "I understand your concern about your health.",
  "emotion": "caring",
  "options": {
    "language": "hi"
  }
}
```

### Vector Store Management
```http
# Get vector store statistics
GET /api/vector/stats

# Check vector store health
GET /api/vector/health
```

## 🏗️ Architecture

### System Components
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   RAG Engine     │    │   External      │
│                 │    │                  │    │   Services      │
│  • ChatBot UI   │◄──►│  • PDF Processor │◄──►│  • ChromaDB     │
│  • PDF Upload   │    │  • Vector Store  │    │  • Gemini AI    │
│  • Voice Chat   │    │  • Context       │    │  • ElevenLabs   │
│                 │    │    Retriever     │    │                 │
└─────────────────┘    │  • LLM Service   │    └─────────────────┘
                       │  • Voice Service │
                       └──────────────────┘
```

### Data Flow
1. **Document Upload**: PDF → Text Extraction → Chunking → Vectorization
2. **User Query**: Text → Vector Search → Context Retrieval → LLM Response
3. **Voice Output**: LLM Response → Language Detection → Voice Synthesis

## 🔧 Configuration

### Vector Store Settings
- **CHUNK_SIZE**: Text chunk size for processing (default: 1000)
- **CHUNK_OVERLAP**: Overlap between chunks (default: 200)
- **TOP_K_DOCUMENTS**: Number of documents to retrieve (default: 5)
- **SIMILARITY_THRESHOLD**: Minimum similarity score (default: 0.7)

### AI Model Settings
- **GEMINI_MODEL**: Gemini model version (default: gemini-1.5-flash)
- **TEMPERATURE**: Response creativity (0.0-1.0)
- **MAX_TOKENS**: Maximum response length

### Voice Settings
- **EMOTION**: Voice emotion (neutral, happy, sad, caring, etc.)
- **LANGUAGE**: Auto-detection or manual language setting
- **VOICE_ID**: Specific voice ID for ElevenLabs

## 🔒 Security

### Data Privacy
- **User Isolation**: Each user has separate vector space
- **Local Processing**: All processing done on your server
- **No Data Retention**: Optional cleanup of old audio files
- **API Key Security**: Environment variable configuration

### HIPAA Considerations
- **Encrypted Storage**: Medical data encrypted at rest
- **Access Control**: User-based access controls
- **Audit Logging**: Optional logging of data access
- **Professional Advice**: AI clearly indicates limitations

## 🧪 Testing

### Health Checks
```bash
# Check all services
curl http://localhost:6000/health

# Check vector store
curl http://localhost:6000/api/vector/health

# Check AI services
curl http://localhost:6000/api/services/health
```

### Test Document Upload
```bash
curl -X POST http://localhost:6000/api/documents/upload \
  -F "pdf=@medical_report.pdf" \
  -F "userId=test_user"
```

### Test Chat
```bash
curl -X POST http://localhost:6000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are my normal blood test results?",
    "userId": "test_user",
    "language": "en"
  }'
```

## 🚀 Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 6000

CMD ["npm", "start"]
```

### Environment Variables
Set these in your deployment environment:
- `NODE_ENV=production`
- `GEMINI_API_KEY=your_key`
- `ELEVENLABS_API_KEY=your_key`
- `CHROMA_HOST=your_chroma_host`
- `RAG_ENGINE_PORT=6000`

### Scaling Considerations
- **Horizontal Scaling**: Multiple instances with shared ChromaDB
- **Load Balancing**: API gateway for request distribution
- **Caching**: Redis for frequent queries
- **Monitoring**: Health checks and metrics collection

## 🛠️ Development

### Project Structure
```
rag-engine/
├── src/
│   ├── config.js           # Configuration management
│   ├── pdfProcessor.js     # PDF text extraction
│   ├── vectorStore.js      # ChromaDB integration
│   ├── retriever.js        # Context retrieval
│   ├── geminiService.js    # Gemini AI integration
│   ├── elevenLabsService.js # Voice synthesis
│   └── server.js           # Main Express server
├── uploads/                # Temporary file storage
├── public/audio/          # Generated audio files
├── package.json
├── .env.example
└── README.md
```

### Adding New Features
1. **New Document Types**: Extend `pdfProcessor.js`
2. **Additional AI Models**: Modify `geminiService.js`
3. **Voice Options**: Update `elevenLabsService.js`
4. **Custom Retrieval**: Enhance `retriever.js`

## 📊 Monitoring

### Key Metrics
- **Document Processing**: Upload success rate, processing time
- **Vector Search**: Query response time, relevance scores
- **AI Responses**: Generation time, context usage
- **Voice Synthesis**: Audio generation time, language distribution

### Logging
```javascript
// Enable debug logging
DEBUG=rag:* npm start
```

## 🤝 Contributing

### Development Setup
1. Clone repository
2. Install dependencies
3. Set up environment variables
4. Start ChromaDB
5. Run development server

### Code Standards
- **ESLint**: Code linting and formatting
- **TypeScript**: Type safety (optional)
- **Testing**: Unit and integration tests
- **Documentation**: API documentation updates

## 📝 License

This project is part of the Sakhi mental health companion platform.

## 🆘 Support

### Common Issues
1. **ChromaDB Connection**: Ensure Docker container is running
2. **API Keys**: Verify keys are valid and have sufficient quota
3. **File Upload**: Check file size limits and format support
4. **Memory Usage**: Monitor chunk size and document limits

### Getting Help
- Check the [API Documentation](#-api-documentation)
- Review [Configuration Guide](#-configuration)
- Examine server logs for error details
- Test individual services via health endpoints

---

**Note**: This RAG engine is designed for medical information processing and should be used in compliance with healthcare regulations and professional medical advice requirements.