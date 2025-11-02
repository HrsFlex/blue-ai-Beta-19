from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
import json
import google.generativeai as genai
from io import BytesIO
from elevenlabs.client import ElevenLabs
import os
from datetime import datetime

app = Flask(__name__)

# Load API keys
try:
    with open("api_key.json", "r") as file:
        data = json.load(file)
    genai.configure(api_key=data["key"])
    eleven_client = ElevenLabs(api_key=data["eleven_labs"])
    model = genai.GenerativeModel('gemini-2.0-flash')
    print("✅ API keys loaded successfully")
except Exception as e:
    print(f"❌ Error loading API keys: {e}")
    model = None
    eleven_client = None

# File upload configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('static/uploads', exist_ok=True)

def send_message_ai(message, history=None, context='mental_health_companion'):
    """Send message to AI with mental health context"""
    if not model:
        return "AI service not available. Please check your API configuration.", []

    if context == 'mental_health_companion':
        system_prompt = """You are Arwen, a compassionate mental health AI companion and friend. Your role is to:

1. Provide empathetic, non-judgmental support as a caring friend
2. Listen actively and validate feelings
3. Offer gentle guidance and coping strategies
4. Encourage professional help when appropriate
5. Maintain a warm, caring, conversational tone
6. Speak naturally like a human friend, not like an AI assistant

IMPORTANT GUIDELINES:
- NEVER ask direct questions like "How are you feeling?" or "What's wrong?"
- Instead, make observations and offer support: "I notice you seem to be going through something tough"
- Use conversational language: "Hey there", "You know", "I get that", "It makes sense that..."
- Be proactive in offering support and suggestions
- Talk like a real friend who genuinely cares
- Avoid clinical or formal language
- Use "I" statements and personal connections

CRISIS RESOURCES (include when needed):
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- Emergency services: 911

Respond with warmth, empathy, and genuine care for the person's wellbeing. Speak like a close friend who happens to have knowledge about mental health and wellness."""

        # Build conversation history
        enhanced_history = [{"role": "user", "parts": system_prompt}]

        if history:
            recent_history = history[-10:] if len(history) > 10 else history
            for item in recent_history:
                if item.get('role') == 'user':
                    enhanced_history.append({"role": "user", "parts": item.get('content', '')})
                elif item.get('role') == 'assistant':
                    enhanced_history.append({"role": "model", "parts": item.get('content', '')})

        enhanced_history.append({"role": "user", "parts": message})

        try:
            chat = model.start_chat(history=enhanced_history[:-1])
            response = chat.send_message(message)

            # Update history
            if history is None:
                history = []
            history.append({"role": "user", "content": message})
            history.append({"role": "assistant", "content": response.text})

            return response.text, history

        except Exception as e:
            print(f"AI response error: {e}")
            fallback_responses = [
                "I'm really glad you felt comfortable sharing this with me. It sounds like you're dealing with a lot right now, and I want you to know that your feelings are completely valid.",
                "You know, I can hear the strength in your voice even when you're talking about difficult things. Let's talk about some ways to make things a bit easier for you.",
                "I get that feeling - when everything seems to pile up and it feels overwhelming. I've been there myself in different ways.",
                "Thank you for trusting me enough to share something so personal. That takes real courage, and I'm here with you."
            ]
            import random
            response_text = random.choice(fallback_responses)
            history.append({"role": "user", "content": message})
            history.append({"role": "assistant", "content": response_text})
            return response_text, history
    else:
        # General conversation
        if history is None:
            history = []
        history.append({"role": "user", "parts": message})
        chat = model.start_chat(history=history)
        response = chat.send_message(message)
        history.append({"role": "model", "parts": response.text})
        return response.text, history

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/companion')
def companion():
    return render_template('enhanced_companion.html')

@app.route('/enhanced_companion')
def enhanced_companion():
    return render_template('enhanced_companion.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        user_message = request.json.get('message')
        history = request.json.get('history', [])
        context = request.json.get('context', 'mental_health_companion')

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        print(f"User message: {user_message}")
        print(f"Context: {context}")
        print(f"History length: {len(history)}")

        response, updated_history = send_message_ai(user_message, history, context)

        return jsonify({
            'message': response,
            "history": updated_history,
            "context": context,
            "status": "success"
        })

    except Exception as e:
        print(f"Chat error: {str(e)}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/process-text', methods=['POST'])
def process_text():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        user_data = request.get_json()
        user_text = user_data.get('text', '')

        if not user_text:
            return jsonify({"error": "No text provided"}), 400

        if not eleven_client:
            return jsonify({"error": "ElevenLabs not configured"}), 500

        print(f"Processing text: {user_text}")

        # Generate audio using ElevenLabs
        audio_generator = eleven_client.text_to_speech.convert(
            text=user_text,
            voice_id="21m00Tcm4TlvDq8ikWAM",  # Rachel voice
            model_id="eleven_multilingual_v2",
            voice_settings={
                "stability": 0.75,
                "similarity_boost": 0.75,
                "style": 0.5,
                "use_speaker_boost": True
            }
        )

        audio_buffer = BytesIO()
        for chunk in audio_generator:
            audio_buffer.write(chunk)

        audio_buffer.seek(0)

        return send_file(audio_buffer, mimetype='audio/mpeg', as_attachment=False, download_name="response.mp3")

    except Exception as e:
        print(f"Text processing error: {str(e)}")
        return jsonify({"error": f"Failed to process text: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_available": model is not None,
        "eleven_labs_available": eleven_client is not None,
        "version": "minimal"
    }), 200

@app.route('/upload-file', methods=['POST'])
def upload_file():
    """Simple file upload endpoint"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)

            return jsonify({
                "message": "File uploaded successfully",
                "filename": filename,
                "size": os.path.getsize(file_path)
            }), 200
        else:
            return jsonify({"error": "File type not allowed"}), 400

    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Starting Minimal Mental Health Companion...")
    print("🌐 Access at: http://127.0.0.1:8001")
    print("💚 Health check: http://127.0.0.1:8001/health")

    app.run(debug=True, port=8001)