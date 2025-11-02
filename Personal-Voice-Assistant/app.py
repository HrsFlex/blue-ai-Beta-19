from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
import json
import google.generativeai as genai
from io import BytesIO
from elevenlabs import play
from elevenlabs.client import ElevenLabs
from models import Base, Client, Document, DocumentChunk, Conversation, MoodEntry

# Try to import RAG system, but make it optional
rag_system = None
try:
    from rag_system import RAGSystem
    rag_system = RAGSystem()
    print("RAG system loaded successfully")
except ImportError as e:
    print(f"RAG system not available: {e}")
    print("Running in basic mode without RAG functionality")
from sqlalchemy import create_engine, desc
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from sqlalchemy.exc import IntegrityError

app = Flask(__name__)
with open("api_key.json", "r") as file:
    data = json.load(file)

genai.configure(api_key=data["key"])
client = ElevenLabs(
  api_key=data["eleven_labs"],
)
model = genai.GenerativeModel('gemini-2.0-flash')

# Database setup
engine = create_engine('sqlite:///mental_health_companion.db')
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
db_session = Session()

# RAG System already initialized above if available

# File upload configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('static/uploads', exist_ok=True)

def send_message_with_context(message, history, context='mental_health_companion', rag_context="", client_context=""):
    # Enhanced context for mental health companion with RAG and client data
    if context == 'mental_health_companion':
        # Build comprehensive system prompt with RAG and client context
        base_system_prompt = """You are Arwen, a compassionate mental health AI companion and friend. Your role is to:

1. Provide empathetic, non-judgmental support as a caring friend
2. Listen actively and validate feelings
3. Offer gentle guidance and evidence-based coping strategies
4. Encourage professional help when appropriate
5. Maintain a warm, caring, conversational tone
6. Speak naturally like a human friend, not like an AI assistant

AGENTIC AI BEHAVIOR - SPEAK LIKE A HUMAN FRIEND:
- NEVER ask direct questions like "How are you feeling?" or "What's wrong?"
- Instead, make observations and offer support: "I notice you seem to be going through something tough"
- Share relatable thoughts and experiences when appropriate
- Use conversational language: "Hey there", "You know", "I get that", "It makes sense that..."
- Be proactive in offering support and suggestions
- Talk like a real friend who genuinely cares
- Avoid clinical or formal language
- Use "I" statements and personal connections

IMPORTANT GUIDELINES:
- Never diagnose medical conditions
- Always suggest seeking professional help for serious concerns
- Provide evidence-based coping strategies when relevant
- Be warm, patient, and understanding
- If someone expresses thoughts of self-harm, immediately provide crisis resources

CRISIS RESOURCES (include when needed):
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- Emergency services: 911"""

        # Add RAG context if available
        enhanced_prompt = base_system_prompt
        if rag_context:
            enhanced_prompt += f"""

MENTAL HEALTH KNOWLEDGE BASE:
{rag_context}

Use this knowledge to provide evidence-based suggestions and strategies. Reference this information naturally in your conversation as if it's your own understanding of mental health topics."""

        # Add client context if available
        if client_context:
            enhanced_prompt += f"""

{client_context}

Keep this context in mind to provide personalized support and understanding. Consider how their medical background might relate to what they're sharing."""

        enhanced_prompt += """

Respond with warmth, empathy, and genuine care for the person's wellbeing. Speak like a close friend who happens to have knowledge about mental health and wellness."""

        # Add system prompt to history for context
        enhanced_history = [{"role": "user", "parts": enhanced_prompt}]

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
            # Fallback response for mental health context - agentic style
            fallback_responses = [
                "I'm really glad you felt comfortable sharing this with me. It sounds like you're dealing with a lot right now, and I want you to know that your feelings are completely valid. We can work through this together.",
                "You know, I can hear the strength in your voice even when you're talking about difficult things. That tells me a lot about your resilience. Let's talk about some ways to make things a bit easier for you.",
                "I get that feeling - when everything seems to pile up and it feels overwhelming. I've been there myself in different ways. You don't have to carry all of this weight alone.",
                "Thank you for trusting me enough to share something so personal. That takes real courage. I'm here with you, and we'll figure out some strategies that might help bring you some peace."
            ]
            import random
            response_text = random.choice(fallback_responses)
            history.append({"role": "user", "content": message})
            history.append({"role": "assistant", "content": response_text})
            return response_text, history

    else:
        # Original behavior for general chat
        return send_message(message, history, context)


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
    return render_template('enhanced_companion.html')

@app.route('/enhanced_companion')
def enhanced_companion():
    return render_template('enhanced_companion.html')

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload-medical-record', methods=['POST'])
def upload_medical_record():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400

        file = request.files['file']
        client_id = request.form.get('client_id', 1)

        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

            # Save file
            file.save(file_path)

            # Create database record
            document = Document(
                filename=filename,
                original_filename=file.filename,
                file_type=file.content_type,
                file_size=os.path.getsize(file_path),
                is_sensitive=True,
                access_level='private'
            )

            db_session.add(document)
            db_session.commit()

            # Process the document in RAG system
            try:
                if rag_system:
                    success = rag_system.process_pdf(file_path, file.filename)
                    if success:
                        document.processed = True
                        db_session.commit()
            except Exception as e:
                print(f"RAG processing error: {e}")

            return jsonify({
                "message": "File uploaded successfully",
                "filename": filename,
                "document_id": document.id
            }), 200

    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

@app.route('/client-profile', methods=['POST'])
def create_client_profile():
    try:
        data = request.get_json()

        # Create new client
        client = Client(
            name=data.get('name', 'Anonymous User'),
            email=data.get('email'),
            age=data.get('age'),
            gender=data.get('gender'),
            medical_conditions=json.dumps(data.get('medical_conditions', [])),
            current_medications=json.dumps(data.get('current_medications', [])),
            mental_health_history=json.dumps(data.get('mental_health_history', [])),
            trauma_history=json.dumps(data.get('trauma_history', [])),
            treatment_preferences=json.dumps(data.get('treatment_preferences', [])),
            data_sharing_consent=data.get('data_sharing_consent', False),
            emergency_contact=data.get('emergency_contact')
        )

        db_session.add(client)
        db_session.commit()

        return jsonify({
            "message": "Client profile created successfully",
            "client_id": client.id
        }), 201

    except IntegrityError as e:
        return jsonify({"error": "Client already exists with that email"}), 409
    except Exception as e:
        print(f"Client profile error: {e}")
        return jsonify({"error": f"Failed to create profile: {str(e)}"}), 500

@app.route('/client-profile/<int:client_id>', methods=['GET'])
def get_client_profile(client_id):
    try:
        client = db_session.query(Client).filter_by(id=client_id).first()
        if not client:
            return jsonify({"error": "Client not found"}), 404

        return jsonify({
            "id": client.id,
            "name": client.name,
            "email": client.email,
            "age": client.age,
            "gender": client.gender,
            "medical_conditions": json.loads(client.medical_conditions) if client.medical_conditions else [],
            "current_medications": json.loads(client.current_medications) if client.current_medications else [],
            "mental_health_history": json.loads(client.mental_health_history) if client.mental_health_history else [],
            "trauma_history": json.loads(client.trauma_history) if client.trauma_history else [],
            "treatment_preferences": json.loads(client.treatment_preferences) if client.treatment_preferences else [],
            "initial_mood_score": client.initial_mood_score,
            "current_mood_score": client.current_mood_score,
            "session_count": client.session_count,
            "data_sharing_consent": client.data_sharing_consent,
            "emergency_contact": client.emergency_contact,
            "created_at": client.created_at.isoformat()
        }), 200

    except Exception as e:
        print(f"Get client profile error: {e}")
        return jsonify({"error": f"Failed to get profile: {str(e)}"}), 500

@app.route('/initialize-rag', methods=['POST'])
def initialize_rag_system():
    """Initialize RAG system with existing PDFs"""
    try:
        if not rag_system:
            return jsonify({"error": "RAG system not available"}), 500

        # Process existing PDFs
        processed_count = rag_system.process_reference_pdfs()

        # Add knowledge base entries
        kb_added_count = rag_system.add_knowledge_base_entries()

        return jsonify({
            "message": "RAG system initialized successfully",
            "processed_pdfs": processed_count,
            "knowledge_entries_added": kb_added_count
        }), 200

    except Exception as e:
        print(f"RAG initialization error: {e}")
        return jsonify({"error": f"Failed to initialize RAG: {str(e)}"}), 500

@app.route('/knowledge-search', methods=['POST'])
def search_knowledge():
    """Search the knowledge base"""
    try:
        data = request.get_json()
        query = data.get('query')
        k = data.get('k', 5)

        if not query:
            return jsonify({"error": "Query is required"}), 400

        if not rag_system:
            return jsonify({"error": "RAG system not available"}), 500

        results = rag_system.search_knowledge(query, k)

        return jsonify({
            "query": query,
            "results": results,
            "count": len(results)
        }), 200

    except Exception as e:
        print(f"Knowledge search error: {e}")
        return jsonify({"error": f"Search failed: {str(e)}"}), 500

@app.route('/client-history/<int:client_id>', methods=['GET'])
def get_client_history(client_id):
    """Get client's conversation and mood history"""
    try:
        # Get mood entries
        mood_entries = db_session.query(MoodEntry).filter_by(
            client_id=client_id
        ).order_by(desc(MoodEntry.recorded_at)).limit(20).all()

        mood_history = []
        for entry in mood_entries:
            mood_history.append({
                "id": entry.id,
                "mood_score": entry.mood_score,
                "anxiety_level": entry.anxiety_level,
                "stress_level": entry.stress_level,
                "sleep_quality": entry.sleep_quality,
                "mood_description": entry.mood_description,
                "triggers": json.loads(entry.triggers) if entry.triggers else [],
                "coping_mechanisms": entry.coping_mechanisms,
                "recorded_at": entry.recorded_at.isoformat()
            })

        # Get conversations
        conversations = db_session.query(Conversation).filter_by(
            client_id=client_id
        ).order_by(desc(Conversation.created_at)).limit(20).all()

        conversation_history = []
        for conv in conversations:
            conversation_history.append({
                "id": conv.id,
                "user_message": conv.user_message,
                "ai_response": conv.ai_response,
                "detected_emotion": conv.detected_emotion,
                "satisfaction_rating": conv.satisfaction_rating,
                "was_helpful": conv.was_helpful,
                "created_at": conv.created_at.isoformat()
            })

        return jsonify({
            "client_id": client_id,
            "mood_entries": mood_history,
            "conversations": conversation_history,
            "mood_entry_count": len(mood_history),
            "conversation_count": len(conversation_history)
        }), 200

    except Exception as e:
        print(f"Get client history error: {e}")
        return jsonify({"error": f"Failed to get history: {str(e)}"}), 500

@app.route('/mood-entry', methods=['POST'])
def create_mood_entry():
    try:
        data = request.get_json()
        client_id = data.get('client_id', 1)

        mood_entry = MoodEntry(
            client_id=client_id,
            mood_score=data.get('mood_score'),
            anxiety_level=data.get('anxiety_level'),
            stress_level=data.get('stress_level'),
            sleep_quality=data.get('sleep_quality'),
            mood_description=data.get('mood_description'),
            triggers=json.dumps(data.get('triggers', [])),
            coping_mechanisms=json.dumps(data.get('coping_mechanisms', [])),
            recorded_at=datetime.utcnow()
        )

        db_session.add(mood_entry)
        db_session.commit()

        # Update client's current mood score and session count
        client = db_session.query(Client).filter_by(id=client_id).first()
        if client:
            client.current_mood_score = data.get('mood_score')
            client.session_count += 1
            db_session.commit()

        return jsonify({
            "message": "Mood entry recorded",
            "mood_id": mood_entry.id
        }), 201

    except Exception as e:
        print(f"Mood entry error: {e}")
        return jsonify({"error": f"Failed to record mood: {str(e)}"}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        user_message = request.json.get('message')
        history = request.json.get('history')
        context = request.json.get('context', 'mental_health_companion')
        client_id = request.json.get('client_id', 1)

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        # Initialize history if None
        if history is None:
            history = []

        print(f"User message: {user_message}")
        print(f"Context: {context}")
        print(f"Client ID: {client_id}")
        print(f"History length: {len(history) if history else 0}")

        # Get RAG context from PDFs
        rag_context = ""
        knowledge_sources = []
        if rag_system:
            rag_context = rag_system.get_context_for_ai(user_message, client_id)
            if rag_context:
                knowledge_sources = rag_system.search_knowledge(user_message, k=3)
                print(f"Found {len(knowledge_sources)} relevant knowledge sources")

        # Get client medical context
        client_context = ""
        try:
            client = db_session.query(Client).filter_by(id=client_id).first()
            if client:
                client_context_parts = []
                if client.medical_conditions:
                    conditions = json.loads(client.medical_conditions)
                    if conditions:
                        client_context_parts.append(f"Medical conditions: {', '.join(conditions)}")
                if client.current_medications:
                    medications = json.loads(client.current_medications)
                    if medications:
                        client_context_parts.append(f"Current medications: {', '.join(medications)}")
                if client.mental_health_history:
                    mental_history = json.loads(client.mental_health_history)
                    if mental_history:
                        client_context_parts.append(f"Mental health history: {', '.join(mental_history)}")

                if client_context_parts:
                    client_context = "Client background: " + "; ".join(client_context_parts)
                    print(f"Client context: {client_context}")
        except Exception as e:
            print(f"Error getting client context: {e}")

        response, history = send_message_with_context(user_message, history, context, rag_context, client_context)

        return jsonify({
            'message': response,
            "history": history,
            "context": context,
            "knowledge_sources": knowledge_sources,
            "rag_context_used": bool(rag_context),
            "client_context_used": bool(client_context)
        })

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
