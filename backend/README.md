# Sakhi Advanced Emotion Detection Backend

A sophisticated multi-modal emotion detection system that combines text analysis, facial recognition, and voice processing to provide intelligent mental health support through AI-powered conversations.

## 🧠 Architecture Overview

### Multi-Modal Emotion Detection
- **Text Analysis**: BERT-based emotion classification (6 emotions) + intent detection
- **Facial Recognition**: CNN-based real-time emotion detection from webcam
- **Voice Analysis**: Speech-to-text with sentiment polarity analysis
- **Fusion Layer**: Combines all modalities for comprehensive emotion understanding

### AI Stack
- **FastAPI**: Modern Python web framework for ML services
- **Express.js**: Node.js server for React frontend integration
- **ChromaDB**: Vector database for mental health knowledge base
- **Google Gemini AI**: Advanced empathetic response generation
- **Transformers**: BERT models for text understanding
- **OpenCV**: Real-time facial emotion detection

## 🚀 Quick Start

### Prerequisites
```bash
# Python 3.8+ with ML libraries
sudo apt update
sudo apt install python3-pip python3-venv

# Node.js 16+
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# System dependencies for facial recognition
sudo apt install libgl1-mesa-glx libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1
```

### Installation

1. **Clone and setup**
```bash
cd backend
npm install
```

2. **Start all services**
```bash
./start-services.sh
```

3. **Access the services**
- ML Service: http://localhost:8000
- Express Server: http://localhost:5000
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:5000/api/emotion/health

## 📡 API Endpoints

### Enhanced Chatbot
```http
POST /chatbot
Content-Type: application/json

{
  "message": "I'm feeling anxious about my exams",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "answer": "I understand you're feeling anxious about exams. This is completely normal...",
  "emotion": "Fear",
  "confidence": 0.85,
  "intent": "seek_support",
  "multimodal": false,
  "context": "Anxiety disorders are the most common mental health concern...",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Text Emotion Analysis
```http
POST /api/emotion/text
Content-Type: application/json

{
  "text": "I'm so happy and excited today!",
  "include_context": true,
  "userId": "user123"
}
```

### Facial Emotion Detection
```http
POST /api/emotion/facial
Content-Type: application/json

{
  "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "userId": "user123"
}
```

### Voice Emotion Analysis
```http
POST /api/emotion/voice
Content-Type: application/json

{
  "audio_data": "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA...",
  "userId": "user123"
}
```

### Multi-Modal Analysis
```http
POST /api/emotion/multimodal
Content-Type: application/json

{
  "text": "I'm not sure how I feel",
  "image_data": "data:image/jpeg;base64,",
  "audio_data": "data:audio/wav;base64,",
  "userId": "user123"
}
```

### Emotion Analytics Dashboard
```http
GET /api/emotion/dashboard?userId=user123&timeRange=24h
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalEntries": 15,
    "timeRange": "24h",
    "primaryEmotion": "Joyful",
    "multimodalCount": 8,
    "multimodalPercentage": "53.33",
    "emotionDistribution": {
      "Joyful": 6,
      "Sadness": 3,
      "Fear": 2,
      "Anger": 1,
      "Love": 2,
      "Surprise": 1
    },
    "averageConfidence": {
      "Joyful": 0.82,
      "Sadness": 0.75,
      "Fear": 0.68
    },
    "recentEntries": [...]
  }
}
```

## 🧩 Service Architecture

### ML Service (Port 8000)
```
ml-service/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── models/              # ML model files
│   ├── model.h5        # Facial emotion CNN
│   └── haarcascade_frontalface_default.xml
├── chroma_db/          # Vector database
├── assets/             # Knowledge base PDFs
├── intent_model/       # BERT intent classifier
└── .env               # Environment variables
```

### Express Server (Port 5000)
```
backend/
├── server.js           # Main Express application
├── package.json        # Node.js dependencies
├── emotion-utils.js    # Emotion processing utilities
├── start-services.sh   # Service startup script
├── stop-services.sh    # Service stop script
└── .env               # Environment variables
```

## 🎯 Emotion Detection Capabilities

### Text Emotions (6 classes)
- **Sadness**: Depression, loneliness, grief
- **Joyful**: Happiness, contentment, excitement
- **Love**: Affection, care, relationships
- **Anger**: Frustration, irritation, anger
- **Fear**: Anxiety, worry, phobias
- **Surprise**: Unexpected emotions, reactions

### Facial Emotions (7 classes)
- Happy, Sad, Angry, Fearful, Surprised, Disgust, Neutral

### Voice Sentiment
- Positive polarity (> 0.3) → Happy
- Negative polarity (< -0.3) → Sad
- Neutral (-0.3 to 0.3) → Neutral

### Intents (6 classes)
- Greeting, Seek Support, Information, Goodbye, Smalltalk, Affirmation

## 🛠️ Configuration

### Environment Variables

**ML Service (.env)**
```bash
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8000
EMOTION_THRESHOLD=0.6
INTENT_THRESHOLD=0.6
CHROMA_PERSIST_DIR=./chroma_db
```

**Express Server (.env)**
```bash
PORT=5000
ML_SERVICE_URL=http://localhost:8000
```

## 📊 Analytics & Monitoring

### Real-time Features
- WebSocket emotion updates
- Live confidence scoring
- Multi-modal processing indicators
- Emotion trend visualization

### Analytics Features
- Emotion distribution charts
- Confidence trend analysis
- Multi-modal usage statistics
- Time-based emotion tracking

## 🔄 Service Management

### Start Services
```bash
./start-services.sh
```

### Stop Services
```bash
./stop-services.sh
```

### Check Logs
```bash
# ML Service logs
tail -f ml-service.log

# Express Server logs
tail -f server.log
```

### Health Check
```bash
curl http://localhost:5000/api/emotion/health
```

## 🧪 Testing

### Test Text Emotion Detection
```bash
curl -X POST http://localhost:5000/api/emotion/text \
  -H "Content-Type: application/json" \
  -d '{"text": "I am feeling very happy today!", "userId": "test"}'
```

### Test Enhanced Chatbot
```bash
curl -X POST http://localhost:5000/chatbot \
  -H "Content-Type: application/json" \
  -d '{"message": "I am worried about my future", "userId": "test"}'
```

### Test Health
```bash
curl http://localhost:5000/api/emotion/health
curl http://localhost:8000/health
```

## 🔧 Development

### Adding New Emotion Models
1. Place model files in `ml-service/models/`
2. Update model loading in `ml-service/main.py`
3. Add emotion mapping in `emotion-utils.js`

### Extending Knowledge Base
1. Add PDF files to `ml-service/assets/`
2. Update `create_knowledge_base()` function
3. Restart ML service

### Custom Response Generation
1. Modify Gemini prompts in `generate_empathetic_response()`
2. Update fallback responses in `getFallbackResponse()`

## 🚨 Error Handling

### Fallback Mechanisms
- ML Service unavailable → Pre-defined empathetic responses
- Model loading failures → Graceful degradation
- Network issues → Local response cache
- Invalid inputs → Clear error messages

### Monitoring
- Service health checks
- Model loading status
- Request/response logging
- Error rate tracking

## 🌐 Frontend Integration

### React Components
```javascript
import EmotionChatBot from './components/ChatBot/EmotionChatBot';
import EmotionDashboard from './components/EmotionDashboard/EmotionDashboard';

// Usage
<EmotionChatBot
  userId="user123"
  onEmotionUpdate={(emotion) => console.log(emotion)}
/>
<EmotionDashboard userId="user123" />
```

### WebSocket Integration
```javascript
const ws = new WebSocket('ws://localhost:5000');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'emotion_update') {
    // Update UI with real-time emotion data
  }
};
```

## 📝 Performance Considerations

### Optimization
- Model caching and lazy loading
- Request batching for high volume
- Connection pooling for ML service
- Response compression

### Scaling
- Horizontal scaling with load balancers
- Model service replicas
- Database connection pooling
- Caching layer integration

## 🔒 Security Considerations

### Data Privacy
- No audio/video storage by default
- Encrypted communication
- User data anonymization
- GDPR compliance considerations

### API Security
- Rate limiting
- Input validation
- CORS configuration
- Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Check the logs for error details
- Verify all services are running
- Ensure dependencies are installed
- Test with the provided examples

---

**Built with ❤️ for mental health support using advanced AI technology**