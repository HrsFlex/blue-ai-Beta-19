from flask import Flask, render_template, request, jsonify, send_file
import json
import google.generativeai as genai
from io import BytesIO
from elevenlabs import play
from elevenlabs.client import ElevenLabs

app = Flask(__name__)
with open("api_key.json", "r") as file:
    data = json.load(file)

genai.configure(api_key=data["key"])
client = ElevenLabs(
  api_key=data["eleven_labs"],
)
model = genai.GenerativeModel('gemini-2.0-flash')

def send_message(message, history, context='general'):
    # Enhanced context for mental health companion
    if context == 'mental_health_companion':
        system_prompt = """You are Arwen, a compassionate mental health AI companion. Your role is to:

1. Provide empathetic, non-judgmental support
2. Listen actively and validate feelings
3. Offer gentle guidance and coping strategies
4. Encourage professional help when appropriate
5. Maintain a warm, caring tone

IMPORTANT GUIDELINES:
- Never diagnose medical conditions
- Always suggest seeking professional help for serious concerns
- Use "I" statements and be personally supportive
- Ask gentle follow-up questions
- Provide evidence-based coping strategies when relevant
- Be warm, patient, and understanding
- If someone expresses thoughts of self-harm, immediately provide crisis resources

CRISIS RESOURCES (include when needed):
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- Emergency services: 911

Respond with warmth, empathy, and genuine care for the person's wellbeing."""

        # Add system prompt to history for context
        enhanced_history = [{"role": "user", "parts": system_prompt}]

        # Add conversation history (limit to last 10 exchanges for context)
        if history:
            recent_history = history[-10:] if len(history) > 10 else history
            for item in recent_history:
                if item.get('role') == 'user':
                    enhanced_history.append({"role": "user", "parts": item.get('content', item.get('parts', ''))})
                elif item.get('role') == 'assistant':
                    enhanced_history.append({"role": "model", "parts": item.get('content', item.get('parts', ''))})

        enhanced_history.append({"role": "user", "parts": message})

        try:
            chat = model.start_chat(history=enhanced_history[:-1])  # Exclude current message
            response = chat.send_message(message)

            # Update history with new messages
            if history is None:
                history = []
            history.append({"role": "user", "content": message})
            history.append({"role": "assistant", "content": response.text})

            return response.text, history

        except Exception as e:
            print(f"Error in AI response generation: {e}")
            # Fallback response for mental health context
            fallback_responses = [
                "I'm here for you, and I want to support you through this. Could you tell me more about what you're experiencing?",
                "Thank you for sharing that with me. It takes courage to reach out. I'm here to listen without judgment.",
                "I hear you, and your feelings are valid. Let's talk about what might help you feel better right now.",
                "I'm grateful you trusted me with this. You don't have to go through difficult times alone."
            ]
            import random
            response_text = random.choice(fallback_responses)
            history.append({"role": "user", "content": message})
            history.append({"role": "assistant", "content": response_text})
            return response_text, history

    else:
        # Original behavior for general chat
        if history is None:
            history = []
        history.append({"role":"user", "parts":message})
        chat = model.start_chat(history = history)
        response = chat.send_message(message)
        history.append({"role":"model", "parts":response.text})
        return response.text, history

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/companion')
def companion():
    return render_template('mental_health_companion.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        user_message = request.json.get('message')
        history = request.json.get('history')
        context = request.json.get('context', 'general')

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        # Initialize history if None
        if history is None:
            history = []

        print(f"User message: {user_message}")
        print(f"Context: {context}")
        print(f"History length: {len(history) if history else 0}")

        response, history = send_message(user_message, history, context)
        return jsonify({'message': response, "history":history, "context": context})

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
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

        print(f"Processing text: {user_text}")

        # Generate audio from text using ElevenLabs with more natural voice
        audio_generator = client.text_to_speech.convert(
            text=user_text,
            voice_id="21m00Tcm4TlvDq8ikWAM",  # Rachel voice ID
            model_id="eleven_multilingual_v2",
            voice_settings={
                "stability": 0.75,  # More stable emotion
                "similarity_boost": 0.75,  # Higher clarity
                "style": 0.5,  # Moderate expressiveness
                "use_speaker_boost": True  # Enhanced voice quality
            }
        )

        # Store audio in a BytesIO buffer
        audio_buffer = BytesIO()
        for chunk in audio_generator:
            audio_buffer.write(chunk)

        # Rewind the buffer to the beginning
        audio_buffer.seek(0)

        # Send the audio as a file-like response
        return send_file(audio_buffer, mimetype='audio/mpeg', as_attachment=False, download_name="response.mp3")

    except Exception as e:
        print(f"Error in process-text endpoint: {str(e)}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8001)
