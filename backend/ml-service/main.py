"""
Advanced Emotion Detection ML Service for Sakhi Mental Health Companion
Multi-modal emotion detection combining text, facial, and voice analysis
"""

from fastapi import FastAPI, Request, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import torch
import cv2
import numpy as np
import os
import sys
import json
import base64
from io import BytesIO
from PIL import Image
import uvicorn
from contextlib import asynccontextmanager
import logging

# Add local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import ML components
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import google.generativeai as genai
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
import fitz  # PyMuPDF
from textblob import TextBlob
import speech_recognition as sr
from datetime import datetime, timedelta
import tempfile

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Enhanced Pydantic Models
class ChatRequest(BaseModel):
    prompt: str = Field(..., description="User input text for emotion analysis")
    user_id: Optional[str] = Field(None, description="User identifier for tracking")
    session_id: Optional[str] = Field(None, description="Session identifier")

class EmotionAnalysisRequest(BaseModel):
    text: str = Field(..., description="Text for emotion analysis")
    include_context: bool = Field(True, description="Include contextual knowledge base")

class FacialEmotionRequest(BaseModel):
    image_data: str = Field(..., description="Base64 encoded image")
    user_id: Optional[str] = Field(None)

class VoiceEmotionRequest(BaseModel):
    audio_data: str = Field(..., description="Base64 encoded audio")
    user_id: Optional[str] = Field(None)

class MultiModalEmotionRequest(BaseModel):
    text: Optional[str] = Field(None, description="Text input")
    image_data: Optional[str] = Field(None, description="Base64 encoded image")
    audio_data: Optional[str] = Field(None, description="Base64 encoded audio")
    user_id: Optional[str] = Field(None)

class EmotionResponse(BaseModel):
    emotion: str
    confidence: float
    intent: Optional[str] = None
    confidence_score: float
    context: Optional[str] = None
    response: str
    multimodal: bool = False
    timestamp: str

class HealthResponse(BaseModel):
    status: str
    models_loaded: Dict[str, bool]
    services: Dict[str, str]
    uptime: str

# Global variables for models
emotion_model = None
emotion_tokenizer = None
intent_model = None
intent_tokenizer = None
face_classifier = None
facial_emotion_model = None
vectorstore = None
retriever = None
gemini_model = None

# Emotion labels
EMOTION_LABELS = {
    0: "Sadness",
    1: "Joyful",
    2: "Love",
    3: "Anger",
    4: "Fear",
    5: "Surprise"
}

FACIAL_EMOTION_LABELS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']

INTENT_LABELS = {
    0: "greeting",
    1: "seek_support",
    2: "information",
    3: "goodbye",
    4: "smalltalk",
    5: "affirmation"
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize ML models on startup"""
    logger.info("🚀 Starting Sakhi ML Service...")

    # Initialize text emotion detection
    await initialize_text_models()

    # Initialize facial emotion detection
    await initialize_facial_models()

    # Initialize RAG system
    await initialize_knowledge_base()

    # Initialize Gemini AI
    await initialize_gemini()

    logger.info("✅ All ML models initialized successfully!")
    yield

    logger.info("🛑 Shutting down ML Service...")

app = FastAPI(
    title="Sakhi Advanced Emotion Detection API",
    description="Multi-modal emotion detection with AI-powered mental health support",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def initialize_text_models():
    """Initialize BERT-based emotion and intent classifiers"""
    global emotion_model, emotion_tokenizer, intent_model, intent_tokenizer

    try:
        # Check for local models, otherwise use pre-trained
        emotion_model_path = os.path.join(os.path.dirname(__file__), "models", "emotion_model.pt")

        if os.path.exists(emotion_model_path):
            logger.info("Loading local emotion model...")
            saved_data = torch.load(emotion_model_path, map_location="cpu", weights_only=False)
            emotion_tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
            emotion_model = AutoModelForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=6)

            if isinstance(saved_data, dict) and 'state_dict' in saved_data:
                emotion_model.load_state_dict(saved_data['state_dict'])
            else:
                emotion_model.load_state_dict(saved_data)
        else:
            logger.info("Using pre-trained emotion model...")
            emotion_tokenizer = AutoTokenizer.from_pretrained('j-hartmann/emotion-english-distilroberta-base')
            emotion_model = AutoModelForSequenceClassification.from_pretrained('j-hartmann/emotion-english-distilroberta-base')

        emotion_model.eval()

        # Initialize intent model
        intent_model_path = os.path.join(os.path.dirname(__file__), "intent_model")

        if os.path.exists(intent_model_path):
            logger.info("Loading local intent model...")
            intent_tokenizer = AutoTokenizer.from_pretrained(intent_model_path)
            intent_model = AutoModelForSequenceClassification.from_pretrained(intent_model_path)
        else:
            logger.info("Using pre-trained intent model...")
            intent_tokenizer = AutoTokenizer.from_pretrained('yeniguno/bert-uncased-intent-classification')
            intent_model = AutoModelForSequenceClassification.from_pretrained('yeniguno/bert-uncased-intent-classification')

        intent_model.eval()

        logger.info("✅ Text models loaded successfully")

    except Exception as e:
        logger.error(f"❌ Error loading text models: {e}")
        # Set models to None to indicate they're not available
        emotion_model = None
        emotion_tokenizer = None
        intent_model = None
        intent_tokenizer = None

async def initialize_facial_models():
    """Initialize facial emotion detection models"""
    global face_classifier, facial_emotion_model

    try:
        # Initialize face detection
        face_cascade_path = os.path.join(os.path.dirname(__file__), "models", "haarcascade_frontalface_default.xml")
        if os.path.exists(face_cascade_path):
            face_classifier = cv2.CascadeClassifier(face_cascade_path)
            logger.info("✅ Face cascade loaded")
        else:
            logger.warning("⚠️ Face cascade file not found, using OpenCV default")
            face_classifier = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

        # Initialize facial emotion model
        facial_model_path = os.path.join(os.path.dirname(__file__), "models", "model.h5")
        if os.path.exists(facial_model_path):
            try:
                from keras.models import load_model
                facial_emotion_model = load_model(facial_model_path)
                logger.info("✅ Facial emotion model loaded")
            except ImportError:
                logger.warning("⚠️ Keras not available, facial emotion detection disabled")
                facial_emotion_model = None
        else:
            logger.warning("⚠️ Facial emotion model file not found")
            facial_emotion_model = None

    except Exception as e:
        logger.error(f"❌ Error loading facial models: {e}")
        face_classifier = None
        facial_emotion_model = None

async def initialize_knowledge_base():
    """Initialize ChromaDB vector store with mental health knowledge"""
    global vectorstore, retriever

    try:
        persist_dir = os.path.join(os.path.dirname(__file__), "chroma_db")

        if os.path.exists(persist_dir):
            logger.info("Loading existing knowledge base...")
            embedding_model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
            vectorstore = Chroma(
                embedding_function=embedding_model,
                persist_directory=persist_dir,
                collection_name="mental_health_knowledge"
            )
        else:
            logger.info("Creating new knowledge base...")
            await create_knowledge_base()

        retriever = vectorstore.as_retriever(
            search_type="similarity_score_threshold",
            search_kwargs={"score_threshold": 0.3, "k": 3}
        )

        logger.info("✅ Knowledge base initialized")

    except Exception as e:
        logger.error(f"❌ Error initializing knowledge base: {e}")
        vectorstore = None
        retriever = None

async def create_knowledge_base():
    """Create knowledge base from PDF assets"""
    try:
        assets_dir = os.path.join(os.path.dirname(__file__), "assets")
        if not os.path.exists(assets_dir):
            os.makedirs(assets_dir)
            # Create sample knowledge base
            sample_docs = [
                Document(page_content="Anxiety disorders are the most common mental health concern in the United States. Over 40 million adults in the U.S. have an anxiety disorder. Effective treatments are available."),
                Document(page_content="Depression is a mood disorder that causes a persistent feeling of sadness and loss of interest. It affects how you feel, think and behave and can lead to emotional and physical problems."),
                Document(page_content="Self-care is important for mental health. Regular exercise, adequate sleep, healthy eating, and stress management techniques can help improve mental wellbeing."),
                Document(page_content="If you are having thoughts of suicide, please seek immediate help. Call or text 988 in the US and Canada, or call 111 in the UK. These services are free, confidential, and available 24/7."),
                Document(page_content="Mindfulness and meditation can help reduce stress and anxiety. Regular practice can improve focus, emotional regulation, and overall mental wellbeing.")
            ]

            embedding_model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
            vectorstore = Chroma.from_documents(
                documents=sample_docs,
                embedding=embedding_model,
                persist_directory=os.path.join(os.path.dirname(__file__), "chroma_db"),
                collection_name="mental_health_knowledge"
            )

    except Exception as e:
        logger.error(f"❌ Error creating knowledge base: {e}")

async def initialize_gemini():
    """Initialize Google Gemini AI"""
    global gemini_model

    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            gemini_model = genai.GenerativeModel('gemini-2.5-flash')
            logger.info("✅ Gemini AI initialized")
        else:
            logger.warning("⚠️ Gemini API key not found, using fallback responses")
            gemini_model = None

    except Exception as e:
        logger.error(f"❌ Error initializing Gemini: {e}")
        gemini_model = None

def predict_text_emotion(text: str, threshold: float = 0.6) -> tuple:
    """Predict emotion from text using BERT model"""
    if not emotion_model or not emotion_tokenizer:
        return "uncertain", 0.0

    try:
        inputs = emotion_tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
        with torch.no_grad():
            outputs = emotion_model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1).squeeze()
            confidence, pred_idx = torch.max(probs, dim=0)
            confidence = confidence.item()
            pred_idx = pred_idx.item()

        emotion = EMOTION_LABELS.get(pred_idx, "uncertain")

        if confidence < threshold:
            return "uncertain", confidence
        return emotion, confidence

    except Exception as e:
        logger.error(f"Error in text emotion prediction: {e}")
        return "uncertain", 0.0

def predict_intent(text: str, threshold: float = 0.6) -> tuple:
    """Predict intent from text using BERT model"""
    if not intent_model or not intent_tokenizer:
        return "uncertain", 0.0

    try:
        inputs = intent_tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
        with torch.no_grad():
            outputs = intent_model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1).squeeze()
            confidence, pred_idx = torch.max(probs, dim=0)
            confidence = confidence.item()
            pred_idx = pred_idx.item()

        intent = INTENT_LABELS.get(pred_idx, "uncertain")

        if confidence < threshold:
            return "uncertain", confidence
        return intent, confidence

    except Exception as e:
        logger.error(f"Error in intent prediction: {e}")
        return "uncertain", 0.0

def predict_facial_emotion(image_data: str) -> tuple:
    """Predict emotion from facial image using CNN model"""
    if not face_classifier or not facial_emotion_model:
        return "uncertain", 0.0, None

    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
        image = Image.open(BytesIO(image_bytes))

        # Convert to OpenCV format
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)

        # Detect faces
        faces = face_classifier.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

        if len(faces) == 0:
            return "no_face", 0.0, None

        # Process first detected face
        (x, y, w, h) = faces[0]
        roi_gray = gray[y:y+h, x:x+w]
        roi_gray = cv2.resize(roi_gray, (48, 48), interpolation=cv2.INTER_AREA)

        if np.sum([roi_gray]) != 0:
            roi = roi_gray.astype('float') / 255.0
            roi = np.expand_dims(roi, axis=0)
            roi = np.expand_dims(roi, axis=-1)

            # Predict emotion
            prediction = facial_emotion_model.predict(roi)[0]
            emotion_idx = np.argmax(prediction)
            confidence = float(prediction[emotion_idx])
            emotion = FACIAL_EMOTION_LABELS[emotion_idx]

            return emotion, confidence, (x, y, w, h)

        return "uncertain", 0.0, None

    except Exception as e:
        logger.error(f"Error in facial emotion prediction: {e}")
        return "uncertain", 0.0, None

def analyze_voice_emotion(audio_data: str) -> tuple:
    """Analyze emotion from voice using sentiment analysis"""
    try:
        # Decode base64 audio
        audio_bytes = base64.b64decode(audio_data.split(',')[1] if ',' in audio_data else audio_data)

        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name

        # Recognize speech
        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_file_path) as source:
            audio = recognizer.record(source)
            text = recognizer.recognize_google(audio)

        # Analyze sentiment
        blob = TextBlob(text)
        sentiment = blob.sentiment.polarity

        # Convert sentiment to emotion
        if sentiment > 0.3:
            emotion = "Happy"
        elif sentiment < -0.3:
            emotion = "Sad"
        else:
            emotion = "Neutral"

        confidence = abs(sentiment)

        # Clean up
        os.unlink(temp_file_path)

        return emotion, confidence, text

    except Exception as e:
        logger.error(f"Error in voice emotion analysis: {e}")
        return "uncertain", 0.0, ""

def retrieve_knowledge(query: str) -> str:
    """Retrieve relevant knowledge from vector store"""
    if not retriever:
        return ""

    try:
        docs = retriever.get_relevant_documents(query)
        context = "\n".join([d.page_content for d in docs]) if docs else ""
        return context
    except Exception as e:
        logger.error(f"Error retrieving knowledge: {e}")
        return ""

def generate_empathetic_response(user_input: str, emotion: str, emotion_conf: float,
                                intent: str, intent_conf: float, context: str) -> str:
    """Generate empathetic response using Gemini or fallback"""

    prompt = f"""You are a compassionate and professional mental health support chatbot. Your responses should be empathetic, supportive, and safe.

User Input: "{user_input}"

Analysis:
- Detected Emotion: {emotion} (confidence: {emotion_conf:.2f})
- Detected Intent: {intent} (confidence: {intent_conf:.2f})

Relevant Mental Health Knowledge:
{context if context else "No specific knowledge base information available."}

Instructions:
1. Acknowledge the user's emotional state with empathy
2. Provide supportive and constructive guidance
3. If the situation seems serious (e.g., suicidal thoughts), gently suggest professional help
4. Keep your response conversational and caring
5. Provide a detailed, thoughtful response so that the user feels heard and supported

Response:"""

    if gemini_model:
        try:
            response = gemini_model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")

    # Fallback responses
    fallback_responses = {
        "Sadness": f"I understand you're feeling sad. It's brave of you to share this with me. Remember that difficult feelings are temporary, and you're stronger than you might think.",
        "Joyful": f"I'm so glad to hear you're feeling joyful! It's wonderful to cherish these positive moments. What's bringing you this happiness today?",
        "Anger": f"I can sense your frustration or anger. These feelings are valid and important. Taking a moment to understand what's triggering these emotions can be helpful.",
        "Fear": f"It sounds like you're experiencing fear or anxiety. These feelings are your body's way of protecting you. Let's work through this together.",
        "Love": f"That's beautiful that you're feeling love and connection. These positive emotions are so important for our wellbeing and relationships.",
        "Surprise": f"Something unexpected has happened! Whether positive or challenging surprises can take time to process. How are you feeling about this situation?"
    }

    return fallback_responses.get(emotion, f"I understand you're feeling {emotion.lower()}. I'm here to support you. Could you tell me more about what you're experiencing?")

def create_fusion_response(emotions: List[Dict], user_input: str, user_id: Optional[str] = None) -> EmotionResponse:
    """Create fusion response from multiple emotion detections"""

    # Primary emotion (highest confidence)
    primary_emotion = max(emotions, key=lambda x: x['confidence'])

    # Retrieve knowledge context
    context = retrieve_knowledge(user_input)

    # Generate empathetic response
    response = generate_empathetic_response(
        user_input=user_input,
        emotion=primary_emotion['emotion'],
        emotion_conf=primary_emotion['confidence'],
        intent=primary_emotion.get('intent', 'uncertain'),
        intent_conf=primary_emotion.get('intent_conf', 0.0),
        context=context
    )

    return EmotionResponse(
        emotion=primary_emotion['emotion'],
        confidence=primary_emotion['confidence'],
        intent=primary_emotion.get('intent'),
        confidence_score=primary_emotion['confidence'],
        context=context if context else None,
        response=response,
        multimodal=len(emotions) > 1,
        timestamp=datetime.now().isoformat()
    )

# API Endpoints
@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint with service health"""
    return HealthResponse(
        status="healthy",
        models_loaded={
            "text_emotion": emotion_model is not None,
            "intent_classifier": intent_model is not None,
            "facial_emotion": facial_emotion_model is not None,
            "face_detector": face_classifier is not None,
            "knowledge_base": vectorstore is not None,
            "gemini_ai": gemini_model is not None
        },
        services={
            "text_analysis": "online" if emotion_model else "offline",
            "facial_analysis": "online" if facial_emotion_model else "offline",
            "voice_analysis": "online",
            "knowledge_retrieval": "online" if vectorstore else "offline",
            "ai_generation": "online" if gemini_model else "fallback"
        },
        uptime="active"
    )

@app.post("/api/emotion/text", response_model=EmotionResponse)
async def analyze_text_emotion(request: EmotionAnalysisRequest):
    """Analyze emotion from text input"""
    try:
        # Predict emotion and intent
        emotion, emo_conf = predict_text_emotion(request.text)
        intent, intent_conf = predict_intent(request.text)

        # Retrieve knowledge if requested
        context = retrieve_knowledge(request.text) if request.include_context else ""

        # Generate response
        response = generate_empathetic_response(
            user_input=request.text,
            emotion=emotion,
            emotion_conf=emo_conf,
            intent=intent,
            intent_conf=intent_conf,
            context=context
        )

        return EmotionResponse(
            emotion=emotion,
            confidence=emo_conf,
            intent=intent,
            confidence_score=emo_conf,
            context=context if context else None,
            response=response,
            multimodal=False,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Error in text emotion analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/emotion/facial", response_model=EmotionResponse)
async def analyze_facial_emotion(request: FacialEmotionRequest):
    """Analyze emotion from facial image"""
    try:
        emotion, confidence, face_box = predict_facial_emotion(request.image_data)

        # Generate contextually appropriate response
        if emotion == "no_face":
            response = "I couldn't detect a face in the image. Please ensure your face is clearly visible and well-lit."
        elif emotion == "uncertain":
            response = "I'm having difficulty detecting the emotion from this image. Could you try again with a clearer photo?"
        else:
            response = f"I can see you're expressing {emotion.lower()} emotions. Remember, all emotions are valid and it's important to acknowledge how you're feeling."

        return EmotionResponse(
            emotion=emotion,
            confidence=confidence,
            intent=None,
            confidence_score=confidence,
            context=None,
            response=response,
            multimodal=False,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Error in facial emotion analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/emotion/voice", response_model=EmotionResponse)
async def analyze_voice_emotion(request: VoiceEmotionRequest):
    """Analyze emotion from voice input"""
    try:
        emotion, confidence, transcribed_text = analyze_voice_emotion(request.audio_data)

        # If we have transcribed text, also analyze it
        intent = None
        intent_conf = 0.0
        context = ""

        if transcribed_text:
            intent, intent_conf = predict_intent(transcribed_text)
            context = retrieve_knowledge(transcribed_text)

        # Generate response
        if transcribed_text:
            response = generate_empathetic_response(
                user_input=transcribed_text,
                emotion=emotion,
                emotion_conf=confidence,
                intent=intent,
                intent_conf=intent_conf,
                context=context
            )
        else:
            response = f"I can hear you're feeling {emotion.lower()}. I'm here to listen and support you."

        return EmotionResponse(
            emotion=emotion,
            confidence=confidence,
            intent=intent,
            confidence_score=confidence,
            context=context if context else None,
            response=response,
            multimodal=False,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Error in voice emotion analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/emotion/multimodal", response_model=EmotionResponse)
async def analyze_multimodal_emotion(request: MultiModalEmotionRequest):
    """Analyze emotion from multiple modalities (text, face, voice)"""
    try:
        emotions = []

        # Text analysis
        if request.text:
            text_emotion, text_conf = predict_text_emotion(request.text)
            text_intent, text_intent_conf = predict_intent(request.text)
            emotions.append({
                'emotion': text_emotion,
                'confidence': text_conf,
                'source': 'text',
                'intent': text_intent,
                'intent_conf': text_intent_conf
            })

        # Facial analysis
        if request.image_data:
            face_emotion, face_conf, _ = predict_facial_emotion(request.image_data)
            if face_emotion != "no_face" and face_emotion != "uncertain":
                emotions.append({
                    'emotion': face_emotion,
                    'confidence': face_conf,
                    'source': 'facial'
                })

        # Voice analysis
        if request.audio_data:
            voice_emotion, voice_conf, transcribed_text = analyze_voice_emotion(request.audio_data)
            emotions.append({
                'emotion': voice_emotion,
                'confidence': voice_conf,
                'source': 'voice',
                'transcribed_text': transcribed_text
            })

        if not emotions:
            raise HTTPException(status_code=400, detail="No valid input provided")

        # Use text as primary input for response generation
        primary_input = request.text or ""
        if not primary_input and request.audio_data:
            voice_data = next((e for e in emotions if e['source'] == 'voice' and 'transcribed_text' in e), None)
            if voice_data:
                primary_input = voice_data['transcribed_text']

        if not primary_input:
            primary_input = "I'm here to support you."

        # Create fusion response
        response = create_fusion_response(emotions, primary_input, request.user_id)

        return response

    except Exception as e:
        logger.error(f"Error in multimodal emotion analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v/chat", response_model=EmotionResponse)
async def enhanced_chat(request: ChatRequest):
    """Enhanced chat endpoint with emotion detection (maintains compatibility)"""
    try:
        # Analyze text emotion and intent
        emotion, emo_conf = predict_text_emotion(request.prompt)
        intent, intent_conf = predict_intent(request.prompt)

        # Retrieve relevant knowledge
        context = retrieve_knowledge(request.prompt)

        # Generate empathetic response
        response = generate_empathetic_response(
            user_input=request.prompt,
            emotion=emotion,
            emotion_conf=emo_conf,
            intent=intent,
            intent_conf=intent_conf,
            context=context
        )

        return EmotionResponse(
            emotion=emotion,
            confidence=emo_conf,
            intent=intent,
            confidence_score=emo_conf,
            context=context if context else None,
            response=response,
            multimodal=False,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Error in enhanced chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy", "message": "Sakhi ML Service is running"}

# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )