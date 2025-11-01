#!/usr/bin/env python3
"""
Sakhi AI - Standalone Mental Health Companion with RAG
A comprehensive Python application for mental health support with voice,
document processing, and AI-powered conversations.
"""

import os
import sys
import logging
from pathlib import Path
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import uuid
from datetime import datetime
import json
import base64
import io
from werkzeug.utils import secure_filename

# Add the project root to Python path
sys.path.append(str(Path(__file__).parent))

# Import our custom modules
from src.core.rag_engine import RAGEngine
from src.core.ai_companion import AICompanion
from src.core.voice_engine import VoiceEngine
from src.core.emotion_detector import EmotionDetector
from src.core.document_processor import DocumentProcessor
from src.core.mental_health_assessor import MentalHealthAssessor
from src.utils.config import Config
from src.utils.database import DatabaseManager
from src.utils.logger import setup_logger

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__,
    template_folder='templates',
    static_folder='static'
)

# Configuration
Config.init_app(app)
CORS(app, origins=app.config['CORS_ORIGINS'])

# Setup logging
logger = setup_logger('sakhi_ai', app.config['LOG_FILE'], level=app.config['LOG_LEVEL'])

# Initialize core components
try:
    logger.info("Initializing Sakhi AI components...")

    # Database
    db_manager = DatabaseManager(app.config['DATABASE_URL'])
    db_manager.init_db()

    # Core engines
    rag_engine = RAGEngine(
        persist_directory=app.config['CHROMA_PERSIST_DIRECTORY'],
        collection_name=app.config['CHROMA_COLLECTION_NAME'],
        embedding_model=app.config['EMBEDDING_MODEL']
    )

    ai_companion = AICompanion(
        api_key=app.config.get('GOOGLE_API_KEY'),
        model_name="gemini-pro"
    )

    voice_engine = VoiceEngine(
        elevenlabs_api_key=app.config.get('ELEVENLABS_API_KEY'),
        default_voice_id=app.config.get('ELEVENLABS_VOICE_ID'),
        tts_engine=app.config['TTS_ENGINE']
    )

    emotion_detector = EmotionDetector(
        enable_face_detection=app.config['ENABLE_FACE_EMOTION_DETECTION'],
        enable_voice_analysis=app.config['ENABLE_VOICE_RECOGNITION']
    )

    document_processor = DocumentProcessor(
        upload_folder=app.config['UPLOAD_FOLDER'],
        max_file_size=app.config['MAX_CONTENT_LENGTH']
    )

    mental_health_assessor = MentalHealthAssessor()

    logger.info("✅ All components initialized successfully")

except Exception as e:
    logger.error(f"❌ Failed to initialize components: {str(e)}")
    raise

# Global state for sessions
user_sessions = {}

def get_or_create_session(session_id=None):
    """Get or create a user session"""
    if not session_id:
        session_id = str(uuid.uuid4())

    if session_id not in user_sessions:
        user_sessions[session_id] = {
            'id': session_id,
            'created_at': datetime.now(),
            'chat_history': [],
            'documents': [],
            'emotions': [],
            'assessments': []
        }

    return user_sessions[session_id]

# Routes
@app.route('/')
def index():
    """Main application page"""
    return render_template('index.html')

@app.route('/api/v1/health')
def health_check():
    """Health check endpoint"""
    try:
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0',
            'services': {
                'rag_engine': rag_engine.health_check(),
                'ai_companion': ai_companion.health_check(),
                'voice_engine': voice_engine.health_check(),
                'emotion_detector': emotion_detector.health_check(),
                'database': 'connected'
            }
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/v1/chat', methods=['POST'])
def chat():
    """Main chat endpoint with RAG support"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        session_id = data.get('session_id')
        include_context = data.get('include_context', True)

        if not message:
            return jsonify({'error': 'Message is required'}), 400

        # Get or create session
        session = get_or_create_session(session_id)

        logger.info(f"Chat message from session {session['id']}: {message[:100]}...")

        # Add user message to history
        session['chat_history'].append({
            'role': 'user',
            'content': message,
            'timestamp': datetime.now().isoformat()
        })

        # Detect emotion from text
        emotion_result = emotion_detector.analyze_text_emotion(message)

        # Get RAG context if enabled and documents exist
        context_docs = []
        if include_context and session['documents']:
            try:
                context_docs = rag_engine.retrieve_context(
                    query=message,
                    user_id=session['id'],
                    top_k=5
                )
            except Exception as e:
                logger.warning(f"RAG retrieval failed: {str(e)}")

        # Generate AI response
        response = ai_companion.generate_response(
            message=message,
            context=context_docs,
            emotion=emotion_result,
            conversation_history=session['chat_history'][-10:]  # Last 10 messages
        )

        # Add AI response to history
        session['chat_history'].append({
            'role': 'assistant',
            'content': response['text'],
            'timestamp': datetime.now().isoformat(),
            'sources': response.get('sources', []),
            'rag_enabled': len(context_docs) > 0,
            'emotion': emotion_result
        })

        # Store emotion in session
        session['emotions'].append({
            'emotion': emotion_result.get('emotion', 'neutral'),
            'confidence': emotion_result.get('confidence', 0.0),
            'timestamp': datetime.now().isoformat()
        })

        # Save session to database
        db_manager.save_session(session)

        return jsonify({
            'response': response['text'],
            'session_id': session['id'],
            'sources': response.get('sources', []),
            'rag_enabled': len(context_docs) > 0,
            'emotion': emotion_result,
            'context_used': len(context_docs) > 0
        })

    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return jsonify({
            'error': 'Failed to process chat message',
            'response': 'I\'m here to support you. Sometimes I need a moment to process your thoughts. Could you please try again?'
        }), 500

@app.route('/api/v1/voice/synthesize', methods=['POST'])
def synthesize_speech():
    """Text-to-speech endpoint"""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        emotion = data.get('emotion', 'caring')
        voice_id = data.get('voice_id')

        if not text:
            return jsonify({'error': 'Text is required'}), 400

        logger.info(f"Synthesizing speech for: {text[:50]}...")

        result = voice_engine.synthesize_speech(
            text=text,
            emotion=emotion,
            voice_id=voice_id
        )

        return jsonify({
            'success': True,
            'audio_url': f"/api/v1/voice/audio/{result['filename']}",
            'duration': result.get('duration'),
            'text': text,
            'emotion': emotion
        })

    except Exception as e:
        logger.error(f"Speech synthesis error: {str(e)}")
        return jsonify({'error': 'Failed to synthesize speech'}), 500

@app.route('/api/v1/voice/audio/<filename>')
def get_audio_file(filename):
    """Serve generated audio files"""
    try:
        return send_from_directory(
            voice_engine.audio_output_dir,
            filename,
            as_attachment=False
        )
    except Exception as e:
        logger.error(f"Audio file error: {str(e)}")
        return jsonify({'error': 'Audio file not found'}), 404

@app.route('/api/v1/documents/upload', methods=['POST'])
def upload_document():
    """Upload and process medical documents"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        session_id = request.form.get('session_id')

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not document_processor.allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed. Only PDF files are supported.'}), 400

        # Get or create session
        session = get_or_create_session(session_id)

        logger.info(f"Processing document upload for session {session['id']}: {file.filename}")

        # Process document
        result = document_processor.process_document(file, session['id'])

        # Add to RAG engine
        if result['success']:
            rag_result = rag_engine.add_document(
                document_id=result['document_id'],
                content=result['content'],
                metadata=result['metadata'],
                user_id=session['id']
            )

            # Add to session
            session['documents'].append({
                'id': result['document_id'],
                'filename': file.filename,
                'upload_date': datetime.now().isoformat(),
                'pages': result['metadata'].get('pages', 0),
                'chunks': rag_result.get('chunk_count', 0)
            })

            # Save session
            db_manager.save_session(session)

            return jsonify({
                'success': True,
                'document_id': result['document_id'],
                'filename': file.filename,
                'pages': result['metadata'].get('pages', 0),
                'chunks': rag_result.get('chunk_count', 0),
                'message': 'Document uploaded and processed successfully'
            })
        else:
            return jsonify({'error': result['error']}), 500

    except Exception as e:
        logger.error(f"Document upload error: {str(e)}")
        return jsonify({'error': 'Failed to upload document'}), 500

@app.route('/api/v1/emotion/analyze', methods=['POST'])
def analyze_emotion():
    """Analyze emotion from text, voice, or image"""
    try:
        data = request.get_json()
        emotion_type = data.get('type', 'text')  # text, voice, image
        session_id = data.get('session_id')

        # Get or create session
        session = get_or_create_session(session_id)

        result = {}

        if emotion_type == 'text':
            text = data.get('text', '').strip()
            if not text:
                return jsonify({'error': 'Text is required for text emotion analysis'}), 400

            result = emotion_detector.analyze_text_emotion(text)

        elif emotion_type == 'voice':
            # This would handle voice emotion analysis
            # Implementation would depend on audio format and processing
            result = {'error': 'Voice emotion analysis not implemented yet'}

        elif emotion_type == 'image':
            # This would handle facial emotion detection
            # Implementation would depend on image format and processing
            result = {'error': 'Image emotion analysis not implemented yet'}

        else:
            return jsonify({'error': 'Invalid emotion analysis type'}), 400

        # Store emotion result
        if 'emotion' in result:
            session['emotions'].append({
                'emotion': result['emotion'],
                'confidence': result.get('confidence', 0.0),
                'timestamp': datetime.now().isoformat(),
                'type': emotion_type
            })

            db_manager.save_session(session)

        return jsonify(result)

    except Exception as e:
        logger.error(f"Emotion analysis error: {str(e)}")
        return jsonify({'error': 'Failed to analyze emotion'}), 500

@app.route('/api/v1/assessment/mental-health', methods=['POST'])
def mental_health_assessment():
    """Perform mental health assessment"""
    try:
        data = request.get_json()
        responses = data.get('responses', [])
        session_id = data.get('session_id')

        if not responses:
            return jsonify({'error': 'Assessment responses are required'}), 400

        # Get or create session
        session = get_or_create_session(session_id)

        logger.info(f"Performing mental health assessment for session {session['id']}")

        result = mental_health_assessor.assess(responses)

        # Store assessment result
        session['assessments'].append({
            'id': str(uuid.uuid4()),
            'type': 'mental_health',
            'score': result.get('overall_score'),
            'category': result.get('category'),
            'recommendations': result.get('recommendations', []),
            'timestamp': datetime.now().isoformat()
        })

        db_manager.save_session(session)

        return jsonify({
            'success': True,
            'assessment': result,
            'message': 'Assessment completed successfully'
        })

    except Exception as e:
        logger.error(f"Mental health assessment error: {str(e)}")
        return jsonify({'error': 'Failed to perform assessment'}), 500

@app.route('/api/v1/session/<session_id>')
def get_session(session_id):
    """Get session information"""
    try:
        session = user_sessions.get(session_id)
        if not session:
            # Try to load from database
            session = db_manager.load_session(session_id)
            if session:
                user_sessions[session_id] = session

        if not session:
            return jsonify({'error': 'Session not found'}), 404

        # Return session data without sensitive information
        return jsonify({
            'session_id': session['id'],
            'created_at': session['created_at'],
            'chat_history_count': len(session['chat_history']),
            'documents_count': len(session['documents']),
            'emotions_count': len(session['emotions']),
            'assessments_count': len(session['assessments']),
            'recent_emotion': session['emotions'][-1] if session['emotions'] else None
        })

    except Exception as e:
        logger.error(f"Get session error: {str(e)}")
        return jsonify({'error': 'Failed to get session'}), 500

@app.route('/api/v1/session/<session_id>/history')
def get_session_history(session_id):
    """Get session chat history"""
    try:
        session = user_sessions.get(session_id)
        if not session:
            session = db_manager.load_session(session_id)
            if session:
                user_sessions[session_id] = session

        if not session:
            return jsonify({'error': 'Session not found'}), 404

        return jsonify({
            'session_id': session['id'],
            'chat_history': session['chat_history']
        })

    except Exception as e:
        logger.error(f"Get session history error: {str(e)}")
        return jsonify({'error': 'Failed to get session history'}), 500

@app.errorhandler(413)
def too_large(e):
    """File too large error handler"""
    return jsonify({'error': 'File too large'}), 413

@app.errorhandler(404)
def not_found(e):
    """404 error handler"""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    """500 error handler"""
    logger.error(f"Internal server error: {str(e)}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    try:
        logger.info("🚀 Starting Sakhi AI Standalone Application")
        logger.info(f"🌐 Server running on http://{app.config['API_HOST']}:{app.config['API_PORT']}")
        logger.info(f"📚 RAG Engine: {'✅' if rag_engine.health_check()['status'] == 'healthy' else '❌'}")
        logger.info(f"🤖 AI Companion: {'✅' if ai_companion.health_check()['status'] == 'healthy' else '❌'}")
        logger.info(f"🎤 Voice Engine: {'✅' if voice_engine.health_check()['status'] == 'healthy' else '❌'}")

        app.run(
            host=app.config['API_HOST'],
            port=app.config['API_PORT'],
            debug=app.config['FLASK_DEBUG']
        )

    except Exception as e:
        logger.error(f"❌ Failed to start application: {str(e)}")
        sys.exit(1)