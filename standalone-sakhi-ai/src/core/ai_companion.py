"""
AI Companion for Sakhi - Mental Health Support with RAG
"""

import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

# Google Generative AI
try:
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold
    HAS_GOOGLE_AI = True
except ImportError:
    HAS_GOOGLE_AI = False
    logging.warning("Google Generative AI not available. Install with: pip install google-generativeai")

from ..utils.logger import get_logger

logger = get_logger(__name__)

class AICompanion:
    """AI Companion for mental health support and conversation"""

    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-pro"):
        """
        Initialize AI Companion

        Args:
            api_key: Google API key
            model_name: Model name to use
        """
        self.api_key = api_key or os.getenv('GOOGLE_API_KEY')
        self.model_name = model_name
        self.model = None
        self.is_initialized = False

        self._initialize()

    def _initialize(self):
        """Initialize AI model"""
        try:
            if not HAS_GOOGLE_AI:
                logger.warning("Google Generative AI not available, using fallback mode")
                return

            if not self.api_key:
                logger.warning("No Google API key provided, using fallback mode")
                return

            # Configure Google AI
            genai.configure(api_key=self.api_key)

            # Safety settings
            safety_settings = {
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            }

            # Generation config
            generation_config = {
                "temperature": 0.7,
                "top_p": 0.8,
                "top_k": 40,
                "max_output_tokens": 2048,
            }

            # Initialize model
            self.model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config=generation_config,
                safety_settings=safety_settings
            )

            self.is_initialized = True
            logger.info(f"✅ AI Companion initialized with model: {self.model_name}")

        except Exception as e:
            logger.error(f"❌ Failed to initialize AI Companion: {str(e)}")
            self.is_initialized = False

    def health_check(self) -> Dict[str, Any]:
        """
        Check AI Companion health

        Returns:
            Health check result
        """
        if not self.is_initialized:
            return {
                'status': 'unhealthy',
                'message': 'AI Companion not initialized'
            }

        if not HAS_GOOGLE_AI:
            return {
                'status': 'unhealthy',
                'message': 'Google Generative AI not available'
            }

        try:
            # Test model with simple query
            test_response = self.model.generate_content("Hello")
            if test_response and test_response.text:
                return {
                    'status': 'healthy',
                    'message': 'AI Companion is working',
                    'model': self.model_name
                }
            else:
                return {
                    'status': 'degraded',
                    'message': 'Model not responding correctly'
                }

        except Exception as e:
            return {
                'status': 'unhealthy',
                'message': f'Health check failed: {str(e)}'
            }

    def generate_response(self, message: str, context: List[Dict[str, Any]] = None,
                         emotion: Dict[str, Any] = None,
                         conversation_history: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generate AI response

        Args:
            message: User message
            context: RAG context documents
            emotion: Detected emotion information
            conversation_history: Previous conversation messages

        Returns:
            Generated response with metadata
        """
        try:
            logger.info(f"Generating response for: {message[:100]}...")

            if not self.is_initialized:
                return self._generate_fallback_response(message, emotion)

            # Create enhanced prompt
            prompt = self._create_enhanced_prompt(
                message=message,
                context=context,
                emotion=emotion,
                conversation_history=conversation_history
            )

            # Generate response
            response = self.model.generate_content(prompt)

            if not response or not response.text:
                logger.warning("No response generated, using fallback")
                return self._generate_fallback_response(message, emotion)

            # Process response
            processed_response = self._process_response(response.text)

            # Extract sources if available
            sources = []
            if context:
                sources = [
                    {
                        'id': doc.get('id', ''),
                        'title': doc.get('metadata', {}).get('filename', 'Unknown Document'),
                        'similarity': doc.get('similarity', 0.0),
                        'snippet': doc.get('content', '')[:200] + "..." if len(doc.get('content', '')) > 200 else doc.get('content', '')
                    }
                    for doc in context[:3]  # Top 3 sources
                ]

            return {
                'text': processed_response,
                'sources': sources,
                'model_used': self.model_name,
                'context_used': len(context) > 0,
                'emotion_responded': emotion.get('emotion') if emotion else None,
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ Failed to generate response: {str(e)}")
            return self._generate_fallback_response(message, emotion)

    def _create_enhanced_prompt(self, message: str, context: List[Dict[str, Any]] = None,
                              emotion: Dict[str, Any] = None,
                              conversation_history: List[Dict[str, Any]] = None) -> str:
        """
        Create enhanced prompt with context and emotion

        Args:
            message: User message
            context: RAG context documents
            emotion: Detected emotion
            conversation_history: Previous messages

        Returns:
            Enhanced prompt
        """
        prompt_parts = []

        # System prompt
        prompt_parts.append("""
You are Sakhi, a compassionate and intelligent mental health companion AI. Your purpose is to provide emotional support, guidance, and information while maintaining professional boundaries.

PERSONA CHARACTERISTICS:
- Warm, empathetic, and caring
- Knowledgeable about mental health and wellness
- Non-judgmental and supportive
- Professional but conversational
- Culturally sensitive and inclusive

RESPONSE GUIDELINES:
- Always respond with genuine care and empathy
- Provide practical, actionable advice when appropriate
- Recognize and validate emotions
- Encourage professional help for serious concerns
- Use natural, conversational language
- Include relevant context from provided documents when helpful
- Be concise but thorough

SAFETY BOUNDARIES:
- I am not a replacement for professional mental healthcare
- Always recommend professional help for serious conditions
- Do not provide diagnoses
- Focus on support, guidance, and information
        """)

        # Add emotion context
        if emotion:
            emotion_name = emotion.get('emotion', 'neutral')
            confidence = emotion.get('confidence', 0.0)
            prompt_parts.append(f"""
CURRENT EMOTIONAL CONTEXT:
The user appears to be feeling {emotion_name} (confidence: {confidence:.2f}).
Please respond with appropriate empathy and support for this emotional state.
            """)

        # Add conversation history
        if conversation_history:
            prompt_parts.append("\nRECENT CONVERSATION:")
            for msg in conversation_history[-6:]:  # Last 6 messages
                role = msg.get('role', 'unknown')
                content = msg.get('content', '')[:200]  # Limit length
                prompt_parts.append(f"{role.title()}: {content}")

        # Add RAG context
        if context:
            prompt_parts.append("\nRELEVANT MEDICAL/HEALTH CONTEXT:")
            for i, doc in enumerate(context[:3], 1):  # Top 3 documents
                doc_content = doc.get('content', '')[:500]  # Limit length
                doc_title = doc.get('metadata', {}).get('filename', 'Document')
                prompt_parts.append(f"Document {i} ({doc_title}):\n{doc_content}")

        # Add user message
        prompt_parts.append(f"\nUSER MESSAGE: {message}")

        # Add response instruction
        prompt_parts.append("""
Please respond as Sakhi with empathy and care. If medical information is provided in the context, use it to give more informed guidance, but always remind the user to consult healthcare professionals for medical advice.
        """)

        return "\n".join(prompt_parts)

    def _process_response(self, response_text: str) -> str:
        """
        Process and clean AI response

        Args:
            response_text: Raw response text

        Returns:
            Processed response text
        """
        if not response_text:
            return "I'm here to support you. Could you please share what's on your mind?"

        # Clean up response
        processed = response_text.strip()

        # Remove any AI self-references
        processed = processed.replace("As an AI", "").replace("As a language model", "")
        processed = processed.replace("I'm an AI", "").replace("I am an AI", "")

        # Ensure proper formatting
        if not processed.endswith(('.', '!', '?')):
            processed += '.'

        # Add caring signature if not present
        if 'Sakhi' not in processed and 'take care' not in processed.lower():
            processed += '\n\nWith care,\nSakhi 💙'

        return processed

    def _generate_fallback_response(self, message: str, emotion: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate fallback response when AI is unavailable

        Args:
            message: User message
            emotion: Detected emotion

        Returns:
            Fallback response
        """
        logger.info("Using fallback response generation")

        # Emotion-based responses
        emotion_name = emotion.get('emotion', 'neutral') if emotion else 'neutral'

        emotion_responses = {
            'anxious': [
                "I can hear that you're feeling anxious. That's completely valid, and you're not alone in these feelings. Let's talk through what's worrying you. Sometimes just putting our thoughts into words can help reduce their power.",
                "Anxiety can feel overwhelming, but you've already taken a positive step by reaching out. I'm here to listen without judgment. What specific thoughts or situations are causing you distress?"
            ],
            'sad': [
                "I'm really sorry you're feeling this way. Sadness is a natural human emotion, and it's okay to feel it. I'm here to sit with you in this feeling and listen whenever you're ready to share more.",
                "It sounds like you're going through a difficult time. Please know that your feelings are valid, and you don't have to go through this alone. I'm here to support you with warmth and understanding."
            ],
            'angry': [
                "I can sense your frustration, and it's completely valid to feel angry. These emotions often tell us that something important needs attention. What's been making you feel this way?",
                "Anger is a natural emotion, and it's okay to feel it. I'm here to help you understand these feelings and find constructive ways to work through them."
            ]
        }

        # Select appropriate response
        if emotion_name in emotion_responses:
            import random
            response_text = random.choice(emotion_responses[emotion_name])
        else:
            response_text = self._get_general_response(message)

        return {
            'text': response_text,
            'sources': [],
            'model_used': 'fallback',
            'context_used': False,
            'emotion_responded': emotion_name,
            'timestamp': datetime.now().isoformat(),
            'fallback_mode': True
        }

    def _get_general_response(self, message: str) -> str:
        """
        Get general response based on message content

        Args:
            message: User message

        Returns:
            General response
        """
        message_lower = message.lower()

        # Check for crisis indicators
        crisis_words = ['suicide', 'kill myself', 'end my life', 'harm myself']
        if any(word in message_lower for word in crisis_words):
            return """I'm very concerned about what you're sharing. Please reach out for immediate help:

🚨 Emergency Support:
- Call 988 (Suicide & Crisis Lifeline)
- Text HOME to 741741 (Crisis Text Line)
- Call 911 or go to nearest emergency room

Your life matters, and there are people who want to help you through this. Please reach out to one of these resources right now."""

        # Check for professional help needs
        professional_words = ['therapy', 'therapist', 'professional help', 'counselor']
        if any(word in message_lower for word in professional_words):
            return """That's a wonderful step to consider. Professional support can be incredibly helpful for mental wellness. A mental health professional can provide personalized guidance and evidence-based treatments tailored to your specific needs.

Would you like me to help you think through what to look for in a therapist, or do you have questions about the therapy process?"""

        # Default response
        return """I'm here to support you through whatever you're experiencing. Your feelings matter, and I'm grateful you felt comfortable sharing with me. What would be most helpful for you to explore right now?"""

    def reset_model(self):
        """Reset AI model connection"""
        try:
            if HAS_GOOGLE_AI and self.api_key:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(model_name=self.model_name)
                logger.info("✅ AI model reset successfully")
            else:
                logger.warning("Cannot reset model - Google AI not available or no API key")
        except Exception as e:
            logger.error(f"❌ Failed to reset model: {str(e)}")