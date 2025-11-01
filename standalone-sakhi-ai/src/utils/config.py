"""
Configuration management for Sakhi AI
"""

import os
from typing import Dict, Any

class Config:
    """Configuration class for Sakhi AI application"""

    _app_config = {}

    @classmethod
    def init_app(cls, app):
        """Initialize Flask app with configuration"""
        cls._app_config = {
            # Flask Configuration
            'SECRET_KEY': os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production'),
            'FLASK_ENV': os.getenv('FLASK_ENV', 'development'),
            'FLASK_DEBUG': os.getenv('FLASK_DEBUG', 'True').lower() == 'true',

            # Database Configuration
            'DATABASE_URL': os.getenv('DATABASE_URL', 'sqlite:///sakhi_ai.db'),

            # API Configuration
            'API_HOST': os.getenv('API_HOST', '0.0.0.0'),
            'API_PORT': int(os.getenv('API_PORT', '5000')),
            'API_PREFIX': os.getenv('API_PREFIX', '/api/v1'),

            # File Upload Configuration
            'UPLOAD_FOLDER': os.getenv('UPLOAD_FOLDER', 'uploads'),
            'MAX_CONTENT_LENGTH': int(os.getenv('MAX_CONTENT_LENGTH', '16777216')),  # 16MB

            # AI Model Configuration
            'GOOGLE_API_KEY': os.getenv('GOOGLE_API_KEY'),
            'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY'),
            'ELEVENLABS_API_KEY': os.getenv('ELEVENLABS_API_KEY'),
            'ELEVENLABS_VOICE_ID': os.getenv('ELEVENLABS_VOICE_ID', 'Rachel'),
            'TTS_ENGINE': os.getenv('TTS_ENGINE', 'pyttsx3'),

            # RAG Configuration
            'CHROMA_PERSIST_DIRECTORY': os.getenv('CHROMA_PERSIST_DIRECTORY', './chroma_db'),
            'CHROMA_COLLECTION_NAME': os.getenv('CHROMA_COLLECTION_NAME', 'sakhi_medical_docs'),
            'EMBEDDING_MODEL': os.getenv('EMBEDDING_MODEL', 'sentence-transformers/all-MiniLM-L6-v2'),

            # Mental Health Assessment Configuration
            'ASSESSMENT_MODEL_PATH': os.getenv('ASSESSMENT_MODEL_PATH', './models/mental_health_classifier.joblib'),
            'SENTIMENT_MODEL_PATH': os.getenv('SENTIMENT_MODEL_PATH', './models/sentiment_analyzer.joblib'),

            # Logging Configuration
            'LOG_LEVEL': os.getenv('LOG_LEVEL', 'INFO'),
            'LOG_FILE': os.getenv('LOG_FILE', './logs/sakhi_ai.log'),

            # Security Configuration
            'CORS_ORIGINS': os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001,http://localhost:8050').split(','),
            'RATE_LIMIT_PER_MINUTE': int(os.getenv('RATE_LIMIT_PER_MINUTE', '60')),

            # Feature Flags
            'ENABLE_VOICE_RECOGNITION': os.getenv('ENABLE_VOICE_RECOGNITION', 'True').lower() == 'true',
            'ENABLE_FACE_EMOTION_DETECTION': os.getenv('ENABLE_FACE_EMOTION_DETECTION', 'True').lower() == 'true',
            'ENABLE_DOCUMENT_UPLOAD': os.getenv('ENABLE_DOCUMENT_UPLOAD', 'True').lower() == 'true',
            'ENABLE_RAG_SYSTEM': os.getenv('ENABLE_RAG_SYSTEM', 'True').lower() == 'true',
            'ENABLE_MENTAL_HEALTH_ASSESSMENT': os.getenv('ENABLE_MENTAL_HEALTH_ASSESSMENT', 'True').lower() == 'true',
        }

        # Update Flask app config
        app.config.update(cls._app_config)

        # Create necessary directories
        cls._create_directories()

    @classmethod
    def get(cls, key: str, default=None):
        """Get configuration value"""
        return cls._app_config.get(key, default)

    @classmethod
    def _create_directories(cls):
        """Create necessary directories if they don't exist"""
        directories = [
            cls.get('UPLOAD_FOLDER'),
            os.path.dirname(cls.get('LOG_FILE')),
            cls.get('CHROMA_PERSIST_DIRECTORY'),
            os.path.dirname(cls.get('ASSESSMENT_MODEL_PATH')),
            os.path.dirname(cls.get('SENTIMENT_MODEL_PATH')),
            'static/audio',
            'templates',
            'logs'
        ]

        for directory in directories:
            if directory and not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)

    @classmethod
    def validate_config(cls) -> Dict[str, Any]:
        """Validate configuration and return status"""
        issues = []
        warnings = []

        # Check required API keys
        if not cls.get('GOOGLE_API_KEY'):
            warnings.append("GOOGLE_API_KEY not set - AI features will use fallback mode")

        if not cls.get('ELEVENLABS_API_KEY'):
            warnings.append("ELEVENLABS_API_KEY not set - Voice synthesis will use local TTS")

        # Check directories
        if not os.path.exists(cls.get('UPLOAD_FOLDER')):
            issues.append(f"Upload folder does not exist: {cls.get('UPLOAD_FOLDER')}")

        if not os.path.exists(os.path.dirname(cls.get('LOG_FILE'))):
            issues.append(f"Log directory does not exist: {os.path.dirname(cls.get('LOG_FILE'))}")

        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'warnings': warnings,
            'config': {
                'rag_enabled': cls.get('ENABLE_RAG_SYSTEM'),
                'voice_enabled': cls.get('ENABLE_VOICE_RECOGNITION'),
                'emotion_detection_enabled': cls.get('ENABLE_FACE_EMOTION_DETECTION'),
                'document_upload_enabled': cls.get('ENABLE_DOCUMENT_UPLOAD'),
                'mental_health_assessment_enabled': cls.get('ENABLE_MENTAL_HEALTH_ASSESSMENT'),
            }
        }