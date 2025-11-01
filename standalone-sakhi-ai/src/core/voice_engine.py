"""
Voice Engine for Sakhi AI - Text-to-Speech and Voice Processing
"""

import os
import uuid
import logging
import io
import base64
from typing import Dict, Any, Optional
from datetime import datetime

# TTS engines
try:
    import pyttsx3
    HAS_PYTTSX3 = True
except ImportError:
    HAS_PYTTSX3 = False
    logging.warning("pyttsx3 not available. Install with: pip install pyttsx3")

try:
    import elevenlabs
    from elevenlabs.client import ElevenLabs
    from elevenlabs import VoiceSettings
    HAS_ELEVENLABS = True
except ImportError:
    HAS_ELEVENLABS = False
    logging.warning("ElevenLabs not available. Install with: pip install elevenlabs")

# Audio processing
try:
    import soundfile as sf
    import numpy as np
    HAS_AUDIO_PROCESSING = True
except ImportError:
    HAS_AUDIO_PROCESSING = False
    logging.warning("Audio processing libraries not available")

from ..utils.logger import get_logger

logger = get_logger(__name__)

class VoiceEngine:
    """Voice Engine for text-to-speech conversion"""

    def __init__(self, elevenlabs_api_key: Optional[str] = None,
                 default_voice_id: str = "Rachel",
                 tts_engine: str = "pyttsx3"):
        """
        Initialize Voice Engine

        Args:
            elevenlabs_api_key: ElevenLabs API key
            default_voice_id: Default voice ID for ElevenLabs
            tts_engine: Preferred TTS engine ("pyttsx3" or "elevenlabs")
        """
        self.elevenlabs_api_key = elevenlabs_api_key or os.getenv('ELEVENLABS_API_KEY')
        self.default_voice_id = default_voice_id
        self.tts_engine = tts_engine

        # Audio output directory
        self.audio_output_dir = "static/audio"
        os.makedirs(self.audio_output_dir, exist_ok=True)

        # Initialize engines
        self.pyttsx3_engine = None
        self.elevenlabs_client = None

        self._initialize_engines()

    def _initialize_engines(self):
        """Initialize TTS engines"""
        # Initialize pyttsx3
        if HAS_PYTTSX3:
            try:
                self.pyttsx3_engine = pyttsx3.init()
                logger.info("✅ pyttsx3 TTS engine initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize pyttsx3: {str(e)}")
                self.pyttsx3_engine = None

        # Initialize ElevenLabs
        if HAS_ELEVENLABS and self.elevenlabs_api_key:
            try:
                self.elevenlabs_client = ElevenLabs(api_key=self.elevenlabs_api_key)
                logger.info("✅ ElevenLabs TTS engine initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize ElevenLabs: {str(e)}")
                self.elevenlabs_client = None

    def health_check(self) -> Dict[str, Any]:
        """
        Check Voice Engine health

        Returns:
            Health check result
        """
        engines_status = {}

        if self.pyttsx3_engine:
            try:
                voices = self.pyttsx3_engine.getProperty('voices')
                engines_status['pyttsx3'] = {
                    'available': True,
                    'voice_count': len(voices) if voices else 0
                }
            except Exception as e:
                engines_status['pyttsx3'] = {
                    'available': False,
                    'error': str(e)
                }
        else:
            engines_status['pyttsx3'] = {'available': False}

        if self.elevenlabs_client:
            try:
                # Test ElevenLabs with a simple request
                voices = list(self.elevenlabs_client.voices.get_all())
                engines_status['elevenlabs'] = {
                    'available': True,
                    'voice_count': len(voices),
                    'default_voice': self.default_voice_id
                }
            except Exception as e:
                engines_status['elevenlabs'] = {
                    'available': False,
                    'error': str(e)
                }
        else:
            engines_status['elevenlabs'] = {'available': False}

        # Determine overall status
        available_engines = [name for name, status in engines_status.items() if status['available']]

        return {
            'status': 'healthy' if available_engines else 'unhealthy',
            'available_engines': available_engines,
            'preferred_engine': self.tts_engine,
            'engines': engines_status,
            'audio_output_dir': self.audio_output_dir
        }

    def synthesize_speech(self, text: str, emotion: str = "caring",
                         voice_id: Optional[str] = None,
                         engine: Optional[str] = None) -> Dict[str, Any]:
        """
        Synthesize speech from text

        Args:
            text: Text to synthesize
            emotion: Emotion for voice modulation
            voice_id: Voice ID (for ElevenLabs)
            engine: TTS engine to use

        Returns:
            Speech synthesis result
        """
        try:
            if not text.strip():
                return {
                    'success': False,
                    'error': 'Text is required for speech synthesis'
                }

            logger.info(f"Synthesizing speech for: {text[:50]}...")

            # Use specified engine or preferred engine
            selected_engine = engine or self.tts_engine

            # Try ElevenLabs first if available and preferred
            if selected_engine == "elevenlabs" and self.elevenlabs_client:
                return self._synthesize_with_elevenlabs(text, emotion, voice_id)

            # Fall back to pyttsx3
            elif self.pyttsx3_engine:
                return self._synthesize_with_pyttsx3(text, emotion)

            else:
                return {
                    'success': False,
                    'error': 'No TTS engine available'
                }

        except Exception as e:
            logger.error(f"❌ Speech synthesis failed: {str(e)}")
            return {
                'success': False,
                'error': f'Speech synthesis failed: {str(e)}'
            }

    def _synthesize_with_elevenlabs(self, text: str, emotion: str = "caring",
                                   voice_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Synthesize speech using ElevenLabs

        Args:
            text: Text to synthesize
            emotion: Emotion for voice modulation
            voice_id: Voice ID

        Returns:
            Speech synthesis result
        """
        try:
            if not self.elevenlabs_client:
                raise Exception("ElevenLabs client not initialized")

            # Use provided voice ID or default
            selected_voice_id = voice_id or self.default_voice_id

            # Adjust voice settings based on emotion
            voice_settings = self._get_voice_settings_for_emotion(emotion)

            # Generate speech
            logger.info(f"Using ElevenLabs with voice: {selected_voice_id}")

            response = self.elevenlabs_client.text_to_speech.convert(
                text=text,
                voice_id=selected_voice_id,
                output_format="mp3_22050_32",
                voice_settings=voice_settings
            )

            # Save audio file
            filename = f"speech_{uuid.uuid4().hex[:8]}.mp3"
            filepath = os.path.join(self.audio_output_dir, filename)

            with open(filepath, "wb") as f:
                for chunk in response:
                    f.write(chunk)

            # Get audio duration (approximate)
            duration = len(text) * 0.08  # Rough estimate: 80ms per character

            logger.info(f"✅ ElevenLabs speech synthesis complete: {filename}")

            return {
                'success': True,
                'filename': filename,
                'filepath': filepath,
                'duration': duration,
                'engine': 'elevenlabs',
                'voice_id': selected_voice_id,
                'emotion': emotion
            }

        except Exception as e:
            logger.error(f"❌ ElevenLabs synthesis failed: {str(e)}")
            # Fall back to pyttsx3
            if self.pyttsx3_engine:
                logger.info("Falling back to pyttsx3")
                return self._synthesize_with_pyttsx3(text, emotion)
            else:
                raise

    def _synthesize_with_pyttsx3(self, text: str, emotion: str = "caring") -> Dict[str, Any]:
        """
        Synthesize speech using pyttsx3

        Args:
            text: Text to synthesize
            emotion: Emotion for voice modulation

        Returns:
            Speech synthesis result
        """
        try:
            if not self.pyttsx3_engine:
                raise Exception("pyttsx3 engine not initialized")

            # Adjust voice properties based on emotion
            self._set_pyttsx3_emotion_properties(emotion)

            # Generate filename
            filename = f"speech_{uuid.uuid4().hex[:8]}.mp3"
            filepath = os.path.join(self.audio_output_dir, filename)

            # Save to file
            self.pyttsx3_engine.save_to_file(text, filepath)
            self.pyttsx3_engine.runAndWait()

            # Get approximate duration
            words_per_minute = self.pyttsx3_engine.getProperty('rate') / 10
            word_count = len(text.split())
            duration = (word_count / words_per_minute) * 60 if words_per_minute > 0 else len(text) * 0.08

            logger.info(f"✅ pyttsx3 speech synthesis complete: {filename}")

            return {
                'success': True,
                'filename': filename,
                'filepath': filepath,
                'duration': duration,
                'engine': 'pyttsx3',
                'emotion': emotion
            }

        except Exception as e:
            logger.error(f"❌ pyttsx3 synthesis failed: {str(e)}")
            raise

    def _get_voice_settings_for_emotion(self, emotion: str) -> VoiceSettings:
        """
        Get voice settings for specific emotion

        Args:
            emotion: Emotion name

        Returns:
            VoiceSettings object
        """
        # Default settings
        stability = 0.75
        similarity_boost = 0.75
        style = 0.5
        use_speaker_boost = True

        # Adjust based on emotion
        if emotion == "caring":
            stability = 0.85
            similarity_boost = 0.8
            style = 0.6
        elif emotion == "empathetic":
            stability = 0.7
            similarity_boost = 0.75
            style = 0.7
        elif emotion == "calm":
            stability = 0.9
            similarity_boost = 0.7
            style = 0.3
        elif emotion == "encouraging":
            stability = 0.6
            similarity_boost = 0.8
            style = 0.8
        elif emotion == "concerned":
            stability = 0.65
            similarity_boost = 0.7
            style = 0.6

        return VoiceSettings(
            stability=stability,
            similarity_boost=similarity_boost,
            style=style,
            use_speaker_boost=use_speaker_boost
        )

    def _set_pyttsx3_emotion_properties(self, emotion: str):
        """
        Set pyttsx3 voice properties based on emotion

        Args:
            emotion: Emotion name
        """
        if not self.pyttsx3_engine:
            return

        # Default properties
        rate = 200
        volume = 0.9

        # Adjust based on emotion
        if emotion == "caring":
            rate = 180
            volume = 0.85
        elif emotion == "empathetic":
            rate = 170
            volume = 0.8
        elif emotion == "calm":
            rate = 160
            volume = 0.75
        elif emotion == "encouraging":
            rate = 220
            volume = 0.95
        elif emotion == "concerned":
            rate = 175
            volume = 0.8

        # Set properties
        self.pyttsx3_engine.setProperty('rate', rate)
        self.pyttsx3_engine.setProperty('volume', volume)

    def get_available_voices(self, engine: str = None) -> Dict[str, Any]:
        """
        Get available voices for specified engine

        Args:
            engine: TTS engine name

        Returns:
            Available voices information
        """
        voices_info = {}

        # pyttsx3 voices
        if self.pyttsx3_engine:
            try:
                pyttsx3_voices = self.pyttsx3_engine.getProperty('voices')
                voices_info['pyttsx3'] = [
                    {
                        'id': voice.id,
                        'name': voice.name,
                        'gender': voice.gender,
                        'languages': voice.languages
                    }
                    for voice in pyttsx3_voices or []
                ]
            except Exception as e:
                logger.error(f"Failed to get pyttsx3 voices: {str(e)}")
                voices_info['pyttsx3'] = []

        # ElevenLabs voices
        if self.elevenlabs_client:
            try:
                elevenlabs_voices = list(self.elevenlabs_client.voices.get_all())
                voices_info['elevenlabs'] = [
                    {
                        'id': voice.voice_id,
                        'name': voice.name,
                        'category': voice.category,
                        'description': voice.description
                    }
                    for voice in elevenlabs_voices
                ]
            except Exception as e:
                logger.error(f"Failed to get ElevenLabs voices: {str(e)}")
                voices_info['elevenlabs'] = []

        return voices_info

    def cleanup_old_files(self, max_age_hours: int = 24):
        """
        Clean up old audio files

        Args:
            max_age_hours: Maximum age of files in hours
        """
        try:
            import time
            current_time = time.time()
            max_age_seconds = max_age_hours * 3600

            for filename in os.listdir(self.audio_output_dir):
                filepath = os.path.join(self.audio_output_dir, filename)
                if os.path.isfile(filepath):
                    file_age = current_time - os.path.getmtime(filepath)
                    if file_age > max_age_seconds:
                        os.remove(filepath)
                        logger.debug(f"Removed old audio file: {filename}")

        except Exception as e:
            logger.error(f"Failed to cleanup old audio files: {str(e)}")

    def get_engine_info(self) -> Dict[str, Any]:
        """
        Get detailed information about voice engines

        Returns:
            Engine information
        """
        info = {
            'engines_available': [],
            'default_engine': self.tts_engine,
            'audio_output_dir': self.audio_output_dir
        }

        if self.pyttsx3_engine:
            info['engines_available'].append('pyttsx3')
            try:
                voices = self.pyttsx3_engine.getProperty('voices')
                info['pyttsx3'] = {
                    'voice_count': len(voices) if voices else 0,
                    'current_rate': self.pyttsx3_engine.getProperty('rate'),
                    'current_volume': self.pyttsx3_engine.getProperty('volume')
                }
            except:
                info['pyttsx3'] = {'error': 'Failed to get properties'}

        if self.elevenlabs_client:
            info['engines_available'].append('elevenlabs')
            info['elevenlabs'] = {
                'default_voice_id': self.default_voice_id,
                'api_configured': bool(self.elevenlabs_api_key)
            }

        return info