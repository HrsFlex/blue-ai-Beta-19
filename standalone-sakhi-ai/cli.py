#!/usr/bin/env python3
"""
Sakhi AI CLI - Command Line Interface for Mental Health Companion
"""

import argparse
import sys
import os
from pathlib import Path

# Add project root to Python path
sys.path.append(str(Path(__file__).parent))

from src.core.ai_companion import AICompanion
from src.core.voice_engine import VoiceEngine
from src.core.emotion_detector import EmotionDetector
from src.core.mental_health_assessor import MentalHealthAssessor
from src.utils.config import Config
from src.utils.logger import setup_logger

class SakhiCLI:
    """Command Line Interface for Sakhi AI"""

    def __init__(self):
        """Initialize CLI"""
        self.logger = setup_logger('sakhi_cli', None, level='INFO')

        # Initialize components
        self.ai_companion = None
        self.voice_engine = None
        self.emotion_detector = None
        self.mental_health_assessor = None

    def initialize_components(self):
        """Initialize AI components"""
        try:
            print("🚀 Initializing Sakhi AI components...")

            # Load configuration
            Config.init_app(type('App', (), {
                'config': {
                    'GOOGLE_API_KEY': os.getenv('GOOGLE_API_KEY'),
                    'ELEVENLABS_API_KEY': os.getenv('ELEVENLABS_API_KEY'),
                    'TTS_ENGINE': 'pyttsx3'
                }
            })())

            # Initialize AI Companion
            self.ai_companion = AICompanion(
                api_key=os.getenv('GOOGLE_API_KEY')
            )

            # Initialize Voice Engine
            self.voice_engine = VoiceEngine(
                elevenlabs_api_key=os.getenv('ELEVENLABS_API_KEY')
            )

            # Initialize Emotion Detector
            self.emotion_detector = EmotionDetector()

            # Initialize Mental Health Assessor
            self.mental_health_assessor = MentalHealthAssessor()

            # Check health
            ai_health = self.ai_companion.health_check()
            voice_health = self.voice_engine.health_check()
            emotion_health = self.emotion_detector.health_check()

            print(f"✅ AI Companion: {ai_health['status']}")
            print(f"✅ Voice Engine: {voice_health['status']}")
            print(f"✅ Emotion Detector: {emotion_health['status']}")

            return True

        except Exception as e:
            self.logger.error(f"Failed to initialize components: {str(e)}")
            print(f"❌ Failed to initialize: {str(e)}")
            return False

    def chat_mode(self):
        """Interactive chat mode"""
        print("\n🤖 Sakhi AI Chat Mode")
        print("Type 'help' for commands, 'quit' to exit\n")

        while True:
            try:
                user_input = input("You: ").strip()

                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("👋 Goodbye! Take care of yourself.")
                    break

                if user_input.lower() == 'help':
                    self.show_help()
                    continue

                if user_input.lower() == 'health':
                    self.show_health_status()
                    continue

                if user_input.lower() == 'assessment':
                    self.run_assessment()
                    continue

                if user_input.lower().startswith('voice '):
                    text = user_input[6:]
                    self.synthesize_speech(text)
                    continue

                if not user_input:
                    continue

                # Generate response
                print("🤔 Thinking...")
                response = self.ai_companion.generate_response(user_input)

                if response:
                    print(f"\n🤖 Sakhi: {response['text']}")

                    if response.get('sources'):
                        print("\n📚 Sources:")
                        for source in response['sources']:
                            print(f"   • {source.get('title', 'Unknown Document')}")

                    if response.get('emotion_responded'):
                        emotion = response['emotion_responded']
                        print(f"\n💭 Emotion detected: {emotion}")

                print()

            except KeyboardInterrupt:
                print("\n👋 Goodbye! Take care of yourself.")
                break
            except Exception as e:
                self.logger.error(f"Chat error: {str(e)}")
                print(f"❌ Error: {str(e)}")

    def show_help(self):
        """Show help information"""
        print("\n📖 Available Commands:")
        print("  help        - Show this help message")
        print("  health      - Show system health status")
        print("  assessment  - Run mental health assessment")
        print("  voice <text> - Convert text to speech")
        print("  quit/exit   - Exit the application")
        print("\n💬 Just type your message to chat with Sakhi AI")

    def show_health_status(self):
        """Show system health status"""
        print("\n🏥 System Health Status:")

        # AI Companion
        ai_health = self.ai_companion.health_check()
        print(f"  🤖 AI Companion: {ai_health['status']}")
        if ai_health['status'] == 'unhealthy':
            print(f"     Issue: {ai_health.get('message', 'Unknown')}")

        # Voice Engine
        voice_health = self.voice_engine.health_check()
        print(f"  🎤 Voice Engine: {voice_health['status']}")
        print(f"     Available engines: {voice_health.get('available_engines', [])}")

        # Emotion Detector
        emotion_health = self.emotion_detector.health_check()
        print(f"  😊 Emotion Detector: {emotion_health['status']}")
        print(f"     Available capabilities: {emotion_health.get('available_capabilities', [])}")

    def run_assessment(self):
        """Run mental health assessment"""
        print("\n📋 Mental Health Assessment")
        print("This is a brief screening tool, not a diagnostic instrument.")
        print("Please answer honestly based on how you've felt over the past 2 weeks.\n")

        # Get assessment template
        template = self.mental_health_assessor.get_assessment_template('depression_phq9')
        questions = template['questions'][:3]  # Use first 3 questions for demo

        responses = []

        for i, question in enumerate(questions, 1):
            print(f"\nQuestion {i}: {question['text']}")

            for j, option in enumerate(question['options']):
                print(f"  {j+1}. {option['text']}")

            while True:
                try:
                    choice = int(input("Enter your choice (1-4): ")) - 1
                    if 0 <= choice < len(question['options']):
                        responses.append({
                            'question_id': question['id'],
                            'value': question['options'][choice]['value']
                        })
                        break
                    else:
                        print("Invalid choice. Please enter 1-4.")
                except ValueError:
                    print("Please enter a number.")

        # Process assessment
        print("\n📊 Processing your assessment...")
        result = self.mental_health_assessor.assess(responses, 'depression')

        if result.get('success'):
            print(f"\n📈 Assessment Results:")
            print(f"  Score: {result['total_score']}/{result['max_possible_score']}")
            print(f"  Category: {result['category'].replace('_', ' ').title()}")
            print(f"  Risk Level: {result['risk_level'].title()}")

            if result.get('requires_professional_help'):
                print("\n⚠️  Based on your responses, we recommend speaking with a mental health professional.")

            print("\n💡 Recommendations:")
            for rec in result['recommendations']:
                print(f"  • {rec}")
        else:
            print(f"❌ Assessment failed: {result.get('error', 'Unknown error')}")

    def synthesize_speech(self, text):
        """Synthesize speech from text"""
        if not text.strip():
            print("Please provide text to synthesize.")
            return

        print(f"🔊 Synthesizing speech: '{text}'")
        result = self.voice_engine.synthesize_speech(text)

        if result.get('success'):
            print(f"✅ Speech synthesized successfully!")
            print(f"   Engine: {result['engine']}")
            print(f"   Duration: {result['duration']:.2f}s")
            print(f"   File: {result['filename']}")

            # Try to play the audio
            try:
                import pygame
                pygame.mixer.init()
                pygame.mixer.music.load(result['filepath'])
                pygame.mixer.music.play()
                print("🔊 Playing audio...")

                # Wait for audio to finish
                while pygame.mixer.music.get_busy():
                    pygame.time.Clock().tick(10)

            except ImportError:
                print("📁 Audio file saved. Install pygame for audio playback: pip install pygame")
            except Exception as e:
                print(f"❌ Failed to play audio: {str(e)}")
        else:
            print(f"❌ Speech synthesis failed: {result.get('error', 'Unknown error')}")

    def run_server_mode(self, host='127.0.0.1', port=5000):
        """Run in server mode"""
        print(f"🌐 Starting Sakhi AI server on http://{host}:{port}")

        try:
            # Import and run Flask app
            from app import app
            app.run(host=host, port=port, debug=False)
        except Exception as e:
            self.logger.error(f"Failed to start server: {str(e)}")
            print(f"❌ Failed to start server: {str(e)}")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Sakhi AI - Mental Health Companion CLI')
    parser.add_argument('--mode', choices=['chat', 'server'], default='chat',
                       help='Mode to run in (chat or server)')
    parser.add_argument('--host', default='127.0.0.1',
                       help='Host for server mode')
    parser.add_argument('--port', type=int, default=5000,
                       help='Port for server mode')
    parser.add_argument('--config', help='Path to configuration file')

    args = parser.parse_args()

    # Load environment file if exists
    env_file = args.config or '.env'
    if os.path.exists(env_file):
        from dotenv import load_dotenv
        load_dotenv(env_file)

    # Initialize CLI
    cli = SakhiCLI()

    # Initialize components
    if not cli.initialize_components():
        sys.exit(1)

    # Run in selected mode
    if args.mode == 'chat':
        cli.chat_mode()
    elif args.mode == 'server':
        cli.run_server_mode(args.host, args.port)

if __name__ == '__main__':
    main()