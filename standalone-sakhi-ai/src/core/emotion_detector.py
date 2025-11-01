"""
Emotion Detector for Sakhi AI - Text and voice emotion analysis
"""

import re
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

# Text analysis
try:
    from textblob import TextBlob
    HAS_TEXTBLOB = True
except ImportError:
    HAS_TEXTBLOB = False
    logging.warning("TextBlob not available. Install with: pip install textblob")

# Sentiment analysis
try:
    from transformers import pipeline
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False
    logging.warning("Transformers not available. Install with: pip install transformers torch")

# Face recognition (optional)
try:
    import cv2
    import face_recognition
    HAS_FACE_RECOGNITION = True
except ImportError:
    HAS_FACE_RECOGNITION = False
    logging.warning("Face recognition not available. Install with: pip install opencv-python face-recognition")

from ..utils.logger import get_logger

logger = get_logger(__name__)

class EmotionDetector:
    """Emotion detection for text, voice, and facial expressions"""

    def __init__(self, enable_face_detection: bool = True,
                 enable_voice_analysis: bool = True):
        """
        Initialize Emotion Detector

        Args:
            enable_face_detection: Enable facial emotion detection
            enable_voice_analysis: Enable voice emotion analysis
        """
        self.enable_face_detection = enable_face_detection and HAS_FACE_RECOGNITION
        self.enable_voice_analysis = enable_voice_analysis

        # Initialize models
        self.sentiment_analyzer = None
        self.emotion_classifier = None

        self._initialize_models()

    def _initialize_models(self):
        """Initialize emotion detection models"""
        try:
            # Initialize sentiment analyzer
            if HAS_TRANSFORMERS:
                logger.info("Initializing sentiment analysis models...")
                try:
                    self.sentiment_analyzer = pipeline(
                        "sentiment-analysis",
                        model="cardiffnlp/twitter-roberta-base-sentiment-latest"
                    )
                    logger.info("✅ Sentiment analyzer initialized")
                except Exception as e:
                    logger.warning(f"Failed to load sentiment analyzer: {str(e)}")
                    self.sentiment_analyzer = None

                try:
                    self.emotion_classifier = pipeline(
                        "text-classification",
                        model="j-hartmann/emotion-english-distilroberta-base"
                    )
                    logger.info("✅ Emotion classifier initialized")
                except Exception as e:
                    logger.warning(f"Failed to load emotion classifier: {str(e)}")
                    self.emotion_classifier = None

        except Exception as e:
            logger.error(f"❌ Failed to initialize emotion detection models: {str(e)}")

    def health_check(self) -> Dict[str, Any]:
        """
        Check Emotion Detector health

        Returns:
            Health check result
        """
        capabilities = {
            'text_sentiment': self.sentiment_analyzer is not None,
            'text_emotion': self.emotion_classifier is not None,
            'face_detection': self.enable_face_detection,
            'voice_analysis': self.enable_voice_analysis,
            'textblob_available': HAS_TEXTBLOB
        }

        available_capabilities = [name for name, available in capabilities.items() if available]

        return {
            'status': 'healthy' if available_capabilities else 'degraded',
            'available_capabilities': available_capabilities,
            'capabilities': capabilities
        }

    def analyze_text_emotion(self, text: str) -> Dict[str, Any]:
        """
        Analyze emotion from text

        Args:
            text: Text to analyze

        Returns:
            Emotion analysis result
        """
        try:
            if not text or not text.strip():
                return {
                    'emotion': 'neutral',
                    'confidence': 0.0,
                    'sentiment': 'neutral',
                    'sentiment_score': 0.0,
                    'method': 'rule_based'
                }

            logger.info(f"Analyzing text emotion: {text[:50]}...")

            # Try transformer models first
            if self.emotion_classifier or self.sentiment_analyzer:
                return self._analyze_with_transformers(text)

            # Fall back to TextBlob
            elif HAS_TEXTBLOB:
                return self._analyze_with_textblob(text)

            # Fall back to rule-based analysis
            else:
                return self._analyze_with_rules(text)

        except Exception as e:
            logger.error(f"❌ Text emotion analysis failed: {str(e)}")
            return {
                'emotion': 'neutral',
                'confidence': 0.0,
                'error': str(e),
                'method': 'error'
            }

    def _analyze_with_transformers(self, text: str) -> Dict[str, Any]:
        """
        Analyze emotion using transformer models

        Args:
            text: Text to analyze

        Returns:
            Emotion analysis result
        """
        result = {
            'method': 'transformers'
        }

        # Emotion classification
        if self.emotion_classifier:
            try:
                emotion_result = self.emotion_classifier(text[:512])  # Limit text length
                if emotion_result:
                    top_emotion = emotion_result[0]
                    result.update({
                        'emotion': top_emotion['label'].lower(),
                        'confidence': top_emotion['score']
                    })
            except Exception as e:
                logger.warning(f"Emotion classification failed: {str(e)}")

        # Sentiment analysis
        if self.sentiment_analyzer:
            try:
                sentiment_result = self.sentiment_analyzer(text[:512])
                if sentiment_result:
                    top_sentiment = sentiment_result[0]
                    sentiment_label = top_sentiment['label'].lower()

                    # Map sentiment to emotion
                    if sentiment_label in ['positive', 'pos']:
                        result['sentiment'] = 'positive'
                        result['sentiment_score'] = top_sentiment['score']
                    elif sentiment_label in ['negative', 'neg']:
                        result['sentiment'] = 'negative'
                        result['sentiment_score'] = -top_sentiment['score']
                    else:
                        result['sentiment'] = 'neutral'
                        result['sentiment_score'] = 0.0

            except Exception as e:
                logger.warning(f"Sentiment analysis failed: {str(e)}")

        # Ensure emotion is set
        if 'emotion' not in result:
            result['emotion'] = self._sentiment_to_emotion(result.get('sentiment', 'neutral'))
            result['confidence'] = 0.5

        return result

    def _analyze_with_textblob(self, text: str) -> Dict[str, Any]:
        """
        Analyze emotion using TextBlob

        Args:
            text: Text to analyze

        Returns:
            Emotion analysis result
        """
        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity
            subjectivity = blob.sentiment.subjectivity

            # Map polarity to sentiment
            if polarity > 0.1:
                sentiment = 'positive'
                sentiment_score = polarity
            elif polarity < -0.1:
                sentiment = 'negative'
                sentiment_score = polarity
            else:
                sentiment = 'neutral'
                sentiment_score = 0.0

            # Map to emotion
            emotion = self._sentiment_to_emotion(sentiment)

            return {
                'emotion': emotion,
                'confidence': min(abs(polarity) + 0.5, 1.0),
                'sentiment': sentiment,
                'sentiment_score': sentiment_score,
                'subjectivity': subjectivity,
                'method': 'textblob'
            }

        except Exception as e:
            logger.error(f"TextBlob analysis failed: {str(e)}")
            return self._analyze_with_rules(text)

    def _analyze_with_rules(self, text: str) -> Dict[str, Any]:
        """
        Analyze emotion using rule-based approach

        Args:
            text: Text to analyze

        Returns:
            Emotion analysis result
        """
        text_lower = text.lower()

        # Emotion keywords
        emotion_keywords = {
            'happy': ['happy', 'joy', 'excited', 'glad', 'delighted', 'pleased', 'cheerful'],
            'sad': ['sad', 'unhappy', 'depressed', 'down', 'blue', 'melancholy', 'grief'],
            'angry': ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'frustrated', 'outraged'],
            'anxious': ['anxious', 'worried', 'nervous', 'stressed', 'afraid', 'scared', 'panic'],
            'caring': ['care', 'love', 'concern', 'support', 'help', 'comfort', 'empathy'],
            'confused': ['confused', 'uncertain', 'unsure', 'puzzled', 'unclear', 'lost'],
            'hopeful': ['hope', 'optimistic', 'positive', 'looking forward', 'expectant']
        }

        # Count emotion keywords
        emotion_scores = {}
        for emotion, keywords in emotion_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > 0:
                emotion_scores[emotion] = score

        # Determine dominant emotion
        if emotion_scores:
            dominant_emotion = max(emotion_scores, key=emotion_scores.get)
            confidence = min(emotion_scores[dominant_emotion] / 10.0, 1.0)
        else:
            dominant_emotion = 'neutral'
            confidence = 0.3

        return {
            'emotion': dominant_emotion,
            'confidence': confidence,
            'sentiment': self._emotion_to_sentiment(dominant_emotion),
            'sentiment_score': confidence if dominant_emotion in ['happy', 'hopeful', 'caring'] else (-confidence if dominant_emotion in ['sad', 'angry', 'anxious'] else 0.0),
            'method': 'rule_based'
        }

    def _sentiment_to_emotion(self, sentiment: str) -> str:
        """
        Convert sentiment to emotion

        Args:
            sentiment: Sentiment label

        Returns:
            Emotion label
        """
        mapping = {
            'positive': 'happy',
            'negative': 'sad',
            'neutral': 'neutral'
        }
        return mapping.get(sentiment, 'neutral')

    def _emotion_to_sentiment(self, emotion: str) -> str:
        """
        Convert emotion to sentiment

        Args:
            emotion: Emotion label

        Returns:
            Sentiment label
        """
        positive_emotions = ['happy', 'hopeful', 'caring']
        negative_emotions = ['sad', 'angry', 'anxious', 'fearful']

        if emotion in positive_emotions:
            return 'positive'
        elif emotion in negative_emotions:
            return 'negative'
        else:
            return 'neutral'

    def analyze_voice_emotion(self, audio_data: bytes) -> Dict[str, Any]:
        """
        Analyze emotion from voice audio

        Args:
            audio_data: Audio data bytes

        Returns:
            Voice emotion analysis result
        """
        try:
            if not self.enable_voice_analysis:
                return {
                    'emotion': 'neutral',
                    'confidence': 0.0,
                    'error': 'Voice analysis not enabled',
                    'method': 'unavailable'
                }

            # This is a placeholder for voice emotion analysis
            # In a real implementation, you would use libraries like:
            # - librosa for audio processing
            # - praat for voice analysis
            # - or a pre-trained voice emotion model

            logger.info("Voice emotion analysis (placeholder implementation)")

            return {
                'emotion': 'neutral',
                'confidence': 0.5,
                'method': 'placeholder',
                'note': 'Voice emotion analysis not implemented yet'
            }

        except Exception as e:
            logger.error(f"❌ Voice emotion analysis failed: {str(e)}")
            return {
                'emotion': 'neutral',
                'confidence': 0.0,
                'error': str(e),
                'method': 'error'
            }

    def analyze_facial_emotion(self, image_data: bytes) -> Dict[str, Any]:
        """
        Analyze emotion from facial expression

        Args:
            image_data: Image data bytes

        Returns:
            Facial emotion analysis result
        """
        try:
            if not self.enable_face_detection:
                return {
                    'emotion': 'neutral',
                    'confidence': 0.0,
                    'error': 'Face detection not enabled',
                    'method': 'unavailable'
                }

            # This is a placeholder for facial emotion analysis
            # In a real implementation, you would use:
            # - face_recognition for face detection
            # - DeepFace or FER for emotion recognition
            # - OpenCV with pre-trained models

            logger.info("Facial emotion analysis (placeholder implementation)")

            return {
                'emotion': 'neutral',
                'confidence': 0.5,
                'method': 'placeholder',
                'note': 'Facial emotion analysis not implemented yet'
            }

        except Exception as e:
            logger.error(f"❌ Facial emotion analysis failed: {str(e)}")
            return {
                'emotion': 'neutral',
                'confidence': 0.0,
                'error': str(e),
                'method': 'error'
            }

    def get_emotion_categories(self) -> Dict[str, Dict[str, Any]]:
        """
        Get available emotion categories and descriptions

        Returns:
            Emotion categories dictionary
        """
        return {
            'happy': {
                'description': 'Feeling or showing pleasure or contentment',
                'color': '#FFD700',
                'icon': '😊'
            },
            'sad': {
                'description': 'Feeling or showing sorrow; unhappy',
                'color': '#4169E1',
                'icon': '😢'
            },
            'angry': {
                'description': 'Feeling or showing strong annoyance, displeasure, or hostility',
                'color': '#DC143C',
                'icon': '😠'
            },
            'anxious': {
                'description': 'Experiencing worry, unease, or nervousness',
                'color': '#FF8C00',
                'icon': '😰'
            },
            'caring': {
                'description': 'Displaying kindness and concern for others',
                'color': '#FF69B4',
                'icon': '🤗'
            },
            'neutral': {
                'description': 'Not having or showing strong emotion',
                'color': '#808080',
                'icon': '😐'
            },
            'hopeful': {
                'description': 'Feeling or inspiring optimism about a future event',
                'color': '#32CD32',
                'icon': '🌟'
            },
            'confused': {
                'description': 'Unable to think clearly; bewildered',
                'color': '#9370DB',
                'icon': '😕'
            }
        }

    def get_detection_capabilities(self) -> Dict[str, Any]:
        """
        Get information about detection capabilities

        Returns:
            Capabilities information
        """
        return {
            'text_analysis': {
                'available': True,
                'methods': ['transformers', 'textblob', 'rule_based'],
                'supported_emotions': list(self.get_emotion_categories().keys()),
                'max_text_length': 512 if HAS_TRANSFORMERS else None
            },
            'voice_analysis': {
                'available': self.enable_voice_analysis,
                'status': 'placeholder' if self.enable_voice_analysis else 'disabled'
            },
            'facial_analysis': {
                'available': self.enable_face_detection,
                'status': 'placeholder' if self.enable_face_detection else 'disabled'
            },
            'libraries': {
                'transformers': HAS_TRANSFORMERS,
                'textblob': HAS_TEXTBLOB,
                'face_recognition': HAS_FACE_RECOGNITION,
                'opencv': 'cv2' in globals()
            }
        }