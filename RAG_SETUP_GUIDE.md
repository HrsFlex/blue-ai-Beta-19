# Sakhi RAG System Setup Guide

This guide will help you set up and configure the complete RAG-based medical companion system for Sakhi.

## 🎯 Overview

The RAG (Retrieval-Augmented Generation) system enables Sakhi to:
- Process and understand medical documents (PDFs)
- Provide personalized responses based on patient history
- Support bilingual voice interactions (Hindi/English)
- Maintain context-aware conversations

## 📋 Prerequisites

### Required Software
1. **Node.js** (v16 or higher)
2. **Docker** (for ChromaDB)
3. **Git** (for version control)

### Required API Keys
1. **Google Gemini API Key** - For LLM responses
2. **ElevenLabs API Key** - For voice synthesis

## 🚀 Step-by-Step Setup

### Step 1: Set Up ChromaDB (Vector Database)

Start ChromaDB using Docker:

```bash
docker run -d --name chromadb -p 8000:8000 chromadb/chromadb
```

Verify ChromaDB is running:
```bash
curl http://localhost:8000/api/v1/heartbeat
```

### Step 2: Configure RAG Engine

Navigate to the RAG engine directory:

```bash
cd backend/rag-engine
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
# Required API Keys
GEMINI_API_KEY=your_gemini_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Server Configuration
RAG_ENGINE_PORT=6000
NODE_ENV=development

# Vector Database (ChromaDB)
CHROMA_HOST=localhost
CHROMA_PORT=8000
VECTOR_COLLECTION_NAME=patient_reports

# Voice Configuration
ELEVENLABS_VOICE_ID_HINDI=pNInz6obpgDQGcFmaJgB
ELEVENLABS_VOICE_ID_ENGLISH=21m00Tcm4TlvDq8ikWAM

# Processing Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_DOCUMENTS=5
SIMILARITY_THRESHOLD=0.7

# Security (optional)
API_KEY_REQUIRED=false
```

### Step 3: Start RAG Engine

```bash
# Development mode
npm run dev

# Or production mode
npm start
```

The RAG engine will start on `http://localhost:6000`

### Step 4: Configure Frontend

Navigate to the root directory:

```bash
cd ../..
```

Copy the RAG environment template:

```bash
cp .env.rag.example .env.local
```

Edit `.env.local` to enable RAG features:

```env
# Enable RAG Engine
REACT_APP_RAG_ENABLED=true
REACT_APP_RAG_BASE_URL=http://localhost:6000

# Optional: Add API key if RAG engine requires it
# REACT_APP_RAG_API_KEY=your_rag_api_key

# Enable RAG features
REACT_APP_ENABLE_DOCUMENT_UPLOAD=true
REACT_APP_ENABLE_MEDICAL_CONTEXT=true
```

### Step 5: Start Frontend

```bash
npm start
```

The frontend will start on `http://localhost:3000`

## ✅ Verification

### 1. Check RAG Engine Health

Open your browser and navigate to:
```
http://localhost:6000/health
```

You should see a healthy status response.

### 2. Check Frontend Integration

Open the Sakhi application and look for:
- "📄 Upload" button in the chat interface
- Document upload section in the chat window
- RAG-enabled indicators in responses

### 3. Test Document Upload

1. Click the "📄 Upload" button in the chat interface
2. Select a PDF medical report
3. Verify the upload progress completes
4. Check for success message in chat

### 4. Test RAG Chat

After uploading a document, ask questions like:
- "What do my medical reports show?"
- "मेरे ब्लड टेस्ट रिजल्ट्स क्या हैं?"
- "Based on my reports, what should I be concerned about?"

## 🔧 Configuration Options

### RAG Engine Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `CHUNK_SIZE` | 1000 | Text chunk size for processing |
| `TOP_K_DOCUMENTS` | 5 | Number of documents to retrieve |
| `SIMILARITY_THRESHOLD` | 0.7 | Minimum similarity score for relevance |

### Voice Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `ELEVENLABS_VOICE_ID_HINDI` | pNInz6obpgDQGcFmaJgB | Hindi voice ID |
| `ELEVENLABS_VOICE_ID_ENGLISH` | 21m00Tcm4TlvDq8ikWAM | English voice ID |

### Frontend Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `REACT_APP_RAG_ENABLED` | false | Enable RAG functionality |
| `REACT_APP_RAG_BASE_URL` | http://localhost:6000 | RAG engine URL |

## 📊 API Testing

### Test Document Upload

```bash
curl -X POST http://localhost:6000/api/documents/upload \
  -F "pdf=@medical_report.pdf" \
  -F "userId=test_user"
```

### Test RAG Chat

```bash
curl -X POST http://localhost:6000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are my blood test results?",
    "userId": "test_user",
    "language": "en"
  }'
```

### Test Voice Synthesis

```bash
curl -X POST http://localhost:6000/api/voice/emotional \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, I can help you understand your medical reports.",
    "emotion": "caring"
  }'
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. ChromaDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:8000
```
**Solution**: Ensure ChromaDB Docker container is running:
```bash
docker ps | grep chromadb
docker start chromadb
```

#### 2. API Key Errors
```
Error: GEMINI_API_KEY is required
```
**Solution**: Add your API keys to the `.env` file:
```env
GEMINI_API_KEY=your_actual_gemini_key
ELEVENLABS_API_KEY=your_actual_elevenlabs_key
```

#### 3. RAG Engine Not Found
```
Error: connect ECONNREFUSED 127.0.0.1:6000
```
**Solution**: Start the RAG engine:
```bash
cd backend/rag-engine
npm start
```

#### 4. PDF Upload Fails
```
Error: File type application/pdf not allowed
```
**Solution**: Ensure you're uploading a valid PDF file.

#### 5. Frontend Not Showing RAG Features
**Solution**: Check environment variables in `.env.local`:
```env
REACT_APP_RAG_ENABLED=true
```

### Debug Mode

Enable debug logging:

```bash
# RAG Engine debug mode
DEBUG=rag:* npm run dev

# Frontend debug mode
REACT_APP_DEBUG_MODE=true npm start
```

### Health Checks

Check all services:

```bash
# ChromaDB
curl http://localhost:8000/api/v1/heartbeat

# RAG Engine
curl http://localhost:6000/health

# Main Backend
curl http://localhost:5000/api/health
```

## 📈 Performance Optimization

### Vector Store Optimization
- Increase `CHUNK_SIZE` for larger documents
- Adjust `SIMILARITY_THRESHOLD` for better relevance
- Monitor ChromaDB memory usage

### Response Time Optimization
- Use smaller `TOP_K_DOCUMENTS` for faster responses
- Cache frequent queries
- Optimize PDF processing with parallel processing

### Memory Management
- Regular cleanup of old audio files
- Monitor vector store size
- Implement document limits per user

## 🔒 Security Considerations

### API Key Security
- Store API keys in environment variables
- Rotate keys regularly
- Use different keys for development/production

### Data Privacy
- Enable user isolation in vector store
- Implement document deletion policies
- Regular backup of vector data

### HIPAA Compliance
- Enable encryption for sensitive data
- Implement audit logging
- Use secure file upload practices

## 📚 Next Steps

### Production Deployment
1. Set up production ChromaDB instance
2. Configure load balancing for RAG engine
3. Implement monitoring and alerting
4. Set up automated backups

### Advanced Features
1. Implement multi-modal document processing
2. Add support for more languages
3. Create custom medical knowledge base
4. Implement real-time collaboration

### Monitoring and Analytics
1. Set up usage metrics
2. Track response quality
3. Monitor API quota usage
4. Implement error tracking

## 🆘 Support

If you encounter issues:

1. **Check logs**: Look at both RAG engine and frontend console logs
2. **Verify configuration**: Ensure all environment variables are set correctly
3. **Test API endpoints**: Use curl to test individual services
4. **Check dependencies**: Ensure all required services are running

### Documentation
- [RAG Engine README](backend/rag-engine/README.md)
- [API Documentation](backend/rag-engine/server.js)
- [Configuration Guide](backend/rag-engine/config.js)

---

**Note**: This RAG system is designed for medical information processing. Always ensure compliance with healthcare regulations and provide appropriate disclaimers about AI limitations.