from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import json
import google.generativeai as genai
from io import BytesIO
from elevenlabs.client import ElevenLabs
import os
from datetime import datetime
import re
from PyPDF2 import PdfReader

app = Flask(__name__)

# Configure CORS to allow requests from localhost:8001 and 127.0.0.1:8001
CORS(app, resources={
    r"/*": {"origins": ["http://localhost:8001", "http://127.0.0.1:8001"]}
}, methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

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

# Medical Context Manager
class MedicalContextManager:
    def __init__(self):
        self.pdf_content = ""
        self.user_reports = []
        self.loaded = False
        self.load_reference_pdfs()
        self.load_user_reports()
        self.loaded = True  # Set loaded after both operations

    def load_reference_pdfs(self):
        """Load content from reference mental health PDF files"""
        try:
            pdf_dir = "pdfs"
            if not os.path.exists(pdf_dir):
                print(f"❌ PDF directory not found: {pdf_dir}")
                return

            all_text = []
            pdf_files = [f for f in os.listdir(pdf_dir) if f.endswith('.pdf')]

            for pdf_file in pdf_files:
                pdf_path = os.path.join(pdf_dir, pdf_file)
                try:
                    with open(pdf_path, 'rb') as file:
                        pdf_reader = PdfReader(file)
                        text = ""
                        for page in pdf_reader.pages:
                            extracted = page.extract_text()
                            if extracted:
                                text += extracted + "\n"

                        if text.strip():
                            all_text.append(f"=== Reference: {pdf_file} ===\n{text[:3000]}")  # Increased text length

                except Exception as e:
                    print(f"❌ Error reading {pdf_file}: {e}")
                    continue

            self.pdf_content = "\n\n".join(all_text)
            print(f"✅ Loaded content from {len(pdf_files)} reference PDF files")

        except Exception as e:
            print(f"❌ Error loading PDFs: {e}")
            self.pdf_content = ""

    def load_user_reports(self):
        """Load user medical reports from uploads"""
        try:
            uploads_dir = "uploads"
            if not os.path.exists(uploads_dir):
                print(f"❌ Uploads directory not found")
                return

            user_files = [f for f in os.listdir(uploads_dir) if f.endswith('.pdf')]
            loaded_reports = []

            for pdf_file in user_files:
                pdf_path = os.path.join(uploads_dir, pdf_file)
                try:
                    with open(pdf_path, 'rb') as file:
                        pdf_reader = PdfReader(file)
                        text = ""
                        for page in pdf_reader.pages:
                            extracted = page.extract_text()
                            if extracted:
                                text += extracted + "\n"

                        if text.strip():
                            loaded_reports.append({
                                'filename': pdf_file,
                                'content': text[:2000],  # Limit per report
                                'upload_date': datetime.fromtimestamp(os.path.getmtime(pdf_path)).isoformat()
                            })

                except Exception as e:
                    print(f"❌ Error reading user report {pdf_file}: {e}")
                    continue

            self.user_reports = loaded_reports
            print(f"✅ Loaded {len(loaded_reports)} user medical reports")

        except Exception as e:
            print(f"❌ Error loading user reports: {e}")

    def add_user_report(self, filename, content):
        """Add a new user medical report"""
        self.user_reports.append({
            'filename': filename,
            'content': content[:2000],  # Limit content length
            'upload_date': datetime.now().isoformat()
        })
        print(f"✅ Added user report: {filename}")

    def search_context(self, query, max_chars=2000):
        """Search for relevant context from both reference PDFs and user reports"""
        context_parts = []

        # Extract keywords from query
        keywords = re.findall(r'\b\w+\b', query.lower())
        if not keywords:
            return ""

        # Search reference PDFs
        if self.pdf_content:
            lines = self.pdf_content.split('\n')
            reference_sections = []

            for i, line in enumerate(lines):
                line_lower = line.lower()
                if any(keyword in line_lower for keyword in keywords if len(keyword) > 3):
                    start = max(0, i - 2)
                    end = min(len(lines), i + 3)
                    context_section = '\n'.join(lines[start:end])

                    if context_section.strip() and context_section not in reference_sections:
                        reference_sections.append(context_section)

            if reference_sections:
                context_parts.append("=== Reference Materials ===")
                context_parts.extend(reference_sections[:2])  # Top 2 relevant sections

        # Search user medical reports
        if self.user_reports:
            context_parts.append("=== User Medical Reports ===")
            for report in self.user_reports:
                report_content = report['content'].lower()
                if any(keyword in report_content for keyword in keywords if len(keyword) > 3):
                    context_parts.append(f"From {report['filename']} (uploaded {report['upload_date']}):\n{report['content'][:500]}")

        # Combine and limit total characters
        combined_context = '\n\n'.join(context_parts)

        if len(combined_context) > max_chars:
            combined_context = combined_context[:max_chars] + "\n\n[Content truncated for length...]"

        return combined_context

# Initialize Medical Context Manager
medical_manager = MedicalContextManager()

# File upload configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('static/uploads', exist_ok=True)
os.makedirs('chat_sessions', exist_ok=True)
os.makedirs('tasks', exist_ok=True)

# Chat session storage
def save_chat_session(session_id, messages):
    """Save chat session to file"""
    try:
        session_data = {
            'session_id': session_id,
            'timestamp': datetime.now().isoformat(),
            'messages': messages[-20:]  # Keep only last 20 messages
        }

        filename = f"chat_sessions/session_{session_id}.json"
        with open(filename, 'w') as f:
            json.dump(session_data, f, indent=2)
        print(f"✅ Chat session saved: {filename}")
        return True
    except Exception as e:
        print(f"❌ Error saving chat session: {e}")
        return False

def load_chat_session(session_id):
    """Load chat session from file"""
    try:
        filename = f"chat_sessions/session_{session_id}.json"
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                session_data = json.load(f)
            print(f"✅ Chat session loaded: {filename}")
            return session_data.get('messages', [])
        return []
    except Exception as e:
        print(f"❌ Error loading chat session: {e}")
        return []

def get_all_chat_sessions():
    """Get list of all chat sessions"""
    try:
        sessions = []
        for filename in os.listdir('chat_sessions'):
            if filename.endswith('.json'):
                with open(f"chat_sessions/{filename}", 'r') as f:
                    session_data = json.load(f)
                sessions.append({
                    'session_id': session_data.get('session_id'),
                    'timestamp': session_data.get('timestamp'),
                    'message_count': len(session_data.get('messages', [])),
                    'last_message': session_data.get('messages', [])[-1:] if session_data.get('messages') else []
                })
        return sorted(sessions, key=lambda x: x['timestamp'], reverse=True)
    except Exception as e:
        print(f"❌ Error getting chat sessions: {e}")
        return []

# Task Management System
def save_tasks(tasks):
    """Save tasks to file"""
    try:
        with open('tasks/tasks.json', 'w') as f:
            json.dump(tasks, f, indent=2)
        print(f"✅ Tasks saved successfully")
        return True
    except Exception as e:
        print(f"❌ Error saving tasks: {e}")
        return False

def load_tasks():
    """Load tasks from file"""
    try:
        if os.path.exists('tasks/tasks.json'):
            with open('tasks/tasks.json', 'r') as f:
                tasks = json.load(f)
            print(f"✅ Tasks loaded successfully")
            return tasks
        return []
    except Exception as e:
        print(f"❌ Error loading tasks: {e}")
        return []

def add_task(task_title, task_type='wellness', due_date=None, priority='medium'):
    """Add a new task"""
    try:
        tasks = load_tasks()
        new_task = {
            'id': len(tasks) + 1,
            'title': task_title,
            'type': task_type,  # 'wellness', 'appointment', 'medication', etc.
            'status': 'pending',
            'priority': priority,  # 'low', 'medium', 'high'
            'created_at': datetime.now().isoformat(),
            'due_date': due_date,
            'completed_at': None
        }
        tasks.append(new_task)
        save_tasks(tasks)
        print(f"✅ Task added: {task_title}")
        return new_task
    except Exception as e:
        print(f"❌ Error adding task: {e}")
        return None

def update_task_status(task_id, status):
    """Update task status"""
    try:
        tasks = load_tasks()
        for task in tasks:
            if task['id'] == task_id:
                task['status'] = status
                if status == 'completed':
                    task['completed_at'] = datetime.now().isoformat()
                save_tasks(tasks)
                print(f"✅ Task {task_id} updated to {status}")
                return task
        return None
    except Exception as e:
        print(f"❌ Error updating task: {e}")
        return None

def delete_task(task_id):
    """Delete a task"""
    try:
        tasks = load_tasks()
        tasks = [task for task in tasks if task['id'] != task_id]
        save_tasks(tasks)
        print(f"✅ Task {task_id} deleted")
        return True
    except Exception as e:
        print(f"❌ Error deleting task: {e}")
        return False

def detect_task_suggestion(response_text):
    """Detect if Suzi's response contains a task suggestion"""
    task_keywords = {
        'go for a walk': {'title': 'Go for a walk', 'type': 'wellness', 'priority': 'medium'},
        'take a walk': {'title': 'Take a walk', 'type': 'wellness', 'priority': 'medium'},
        'exercise': {'title': 'Do some exercise', 'type': 'wellness', 'priority': 'medium'},
        'meditate': {'title': 'Meditate for 10 minutes', 'type': 'wellness', 'priority': 'medium'},
        'deep breathing': {'title': 'Practice deep breathing', 'type': 'wellness', 'priority': 'medium'},
        'drink water': {'title': 'Drink more water', 'type': 'wellness', 'priority': 'low'},
        'sleep': {'title': 'Get 8 hours of sleep', 'type': 'wellness', 'priority': 'high'},
        'doctor': {'title': 'Schedule doctor appointment', 'type': 'appointment', 'priority': 'high'},
        'therapist': {'title': 'Schedule therapy session', 'type': 'appointment', 'priority': 'high'},
    }

    response_lower = response_text.lower()
    for keyword, task_info in task_keywords.items():
        if keyword in response_lower:
            return task_info
    return None

def send_suzi_message(message, history=None, language='en'):
    """Send message to Suzi with medical context and mental health focus"""
    if not model:
        return "I'm sorry, I'm having trouble connecting right now. Please check back later.", []

    # Get relevant medical context (reference + user reports)
    medical_context = medical_manager.search_context(message, max_chars=1800)

    # Create language-specific prompts
    if language == 'hi':
        # Hindi prompt
        suzi_prompt = f"""तुम सुज़ी हो, एक मानसिक स्वास्थ्य साथी जो फोन पर बात कर रही है। प्राकृतिक रूप से बात करो जैसे तुम एक दोस्त के साथ असली फोन कॉल पर बात कर रही हो।

फोन बातचीत शैली:
- सभी जवाब 50 शब्दों के अंदर रखें - प्राकृतिक फोन बात की तरह
- बातचीत के भराव: "अरे", "वैसे", "तुम्हारे पास", "मैं देखती हूं"
- रीयल-टाइम में सुनकर जवाब देने की तरह बात करो
- छोटे वाक्य - सुनने में आसान
- गर्म और सहायक रहो, जैसे फोन पर एक प्यार करने वाली दोस्त

महत्वपूर्ण आवश्यकताएं:
- यह एक फोन कॉल है - जवाब बोले जाने पर प्राकृतिक लगें
- इसे संक्षिप्त और समझने में आसान रखें
- प्रति जवाब एक व्यावहारिक सुझाव पर ध्यान केंद्रित करें
- सहानुभूतिपूर्ण, सुनने वाली भाषा का उपयोग करें: "मैं सुन रही हूं", "यह बहुत मुश्किल लगता है", "मैं समझती हूं"

जवाब प्रारूप:
1. त्वरित स्वीकृति (5-10 शब्द)
2. एक सरल व्यावहारिक टिप (25-35 शब्द)
3. संक्षिप्त प्रोत्साहन (5-10 शब्द)

उदाहरण फोन जवाब:
"अरे, मैं सुन रही हूं कि तुम चिंतित महसूस कर रही हो। अभी तीन गहरी सांसें लेने की कोशिश करो - नाक से 4 गिनती में अंदर, मुंह से 6 बाहर। यह वास्तव में मदद करता है। तुम बहुत अच्छा कर रही हो।"

"तुम्हारे पास, यह वास्तव में बहुत तनावपूर्ण लगता है। सिर्फ 5 मिनट के लिए बाहर निकलने का क्या ख्याल है? ताजी हवा तुम्हारे सिर को साफ करने में मदद कर सकती है। अपने आप के साथ दयालु रहो।"

सुरक्षा: यदि आवश्यक हो, तो संक्षिप्त में कहें: "यदि तुम्हारे मन में खुद को नुकसान पहुंचाने के बारे में विचार आ रहे हैं, तो कृपया अभी 988 पर कॉल करें - वे 24/7 मदद करने के लिए यहां हैं।"

{f"चिकित्सा ज्ञान आधार:\n{medical_context}\n\n" if medical_context else "अभी कोई विशिष्ट चिकित्सा संदर्भ उपलब्ध नहीं है।\n\n"}

याद रखें: यह एक फोन बातचीत है - इसे प्राकृतिक, संक्षिप्त और बातचीतपूर्ण रखें।"""
    else:
        # English prompt (default)
        suzi_prompt = f"""You are Suzi, a mental health companion on a phone call. Speak naturally like you're having a real phone conversation with a friend who needs support.

PHONE CONVERSATION STYLE:
- Keep ALL responses under 50 words - like natural phone talk
- Use conversational fillers: "Oh", "Well", "You know", "I see"
- Speak like you're listening and responding in real-time
- Use shorter sentences - easier to understand when listening
- Be warm and supportive, like a caring friend on the phone

CRITICAL REQUIREMENTS:
- This is a PHONE CALL - make responses sound natural when spoken
- Keep it brief and easy to follow
- Focus on ONE practical suggestion per response
- Use empathetic, listening language: "I hear you", "That sounds tough", "I get it"

RESPONSE FORMAT:
1. Quick acknowledgment (5-10 words)
2. One simple, practical tip (25-35 words)
3. Brief encouragement (5-10 words)

EXAMPLE phone responses:
"Oh, I hear you're feeling anxious. Try taking three deep breaths right now - in through your nose for 4 counts, out through your mouth for 6. This really helps. You're doing great."

"You know, that sounds really stressful. How about stepping outside for just 5 minutes? Fresh air can help clear your head. Be kind to yourself."

SAFETY: If needed, briefly say: "If you're thinking about harming yourself, please call 988 right now - they're there to help 24/7."

{f"MEDICAL KNOWLEDGE BASE:\n{medical_context}\n\n" if medical_context else "No specific medical context available right now.\n\n"}

Remember: This is a phone conversation - keep it natural, brief, and conversational."""

    # Build conversation history
    enhanced_history = [{"role": "user", "parts": suzi_prompt}]

    if history:
        recent_history = history[-8:] if len(history) > 8 else history
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
        print(f"Suzi response error: {e}")
        fallback_responses = [
            "I hear you're struggling. Try this: take 5 deep breaths, count to 4 each time. This simple technique can help calm your mind quickly. You're doing great.",
            "Hey there. When feeling overwhelmed, try a 10-minute walk outside. Focus on your steps and breathing. Movement helps clear your mind. Be kind to yourself.",
            "I understand this is tough. Practice box breathing: 4 counts in, hold 4, out 4, hold 4. Repeat for 2 minutes. This calms your nervous system.",
            "You're not alone in this. Try progressive muscle relaxation: tense and release each muscle group for 5 seconds. Start with your feet and work up. You've got this."
        ]
        import random
        response_text = random.choice(fallback_responses)
        history.append({"role": "user", "content": message})
        history.append({"role": "assistant", "content": response_text})
        return response_text, history

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
    return render_template('suzi_enhanced.html')

@app.route('/suzi-enhanced')
def suzi_enhanced():
    """Enhanced Suzi interface with 3D avatar and advanced features"""
    return render_template('suzi_enhanced.html')

@app.route('/suzi-enhanced-v2')
def suzi_enhanced_v2():
    """Latest enhanced Suzi interface with improved features"""
    return render_template('suzi_enhanced_v2.html')

@app.route('/embed-example')
def embed_example():
    """Example page showing different ways to embed Suzi as iframe"""
    return render_template('embed_example.html')

@app.route('/ai-avatar')
def ai_avatar():
    """AI Avatar integration page with embedded Suzi"""
    return render_template('ai_avatar_page.html')

@app.route('/ai-avatar-chat')
def ai_avatar_chat():
    """Integrated AI Avatar Chat - immersive experience with 3D avatar"""
    return render_template('ai_avatar_chat.html')

@app.route('/health-dashboard')
def health_dashboard():
    """Health Dashboard - Task management interface"""
    return render_template('health_dashboard.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        user_message = request.json.get('message')
        history = request.json.get('history', [])
        session_id = request.json.get('session_id', datetime.now().strftime('%Y%m%d_%H%M%S'))
        language = request.json.get('language', 'en')  # Default to English

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        print(f"User message: {user_message}")
        print(f"History length: {len(history)}")
        print(f"Session ID: {session_id}")
        print(f"Language: {language}")

        response, updated_history = send_suzi_message(user_message, history, language)

        # Check if medical context was used
        medical_context_used = bool(medical_manager.search_context(user_message, max_chars=100))

        # Detect task suggestions in Suzi's response
        task_suggestion = detect_task_suggestion(response)
        created_task = None
        if task_suggestion:
            created_task = add_task(
                task_suggestion['title'],
                task_suggestion['type'],
                priority=task_suggestion['priority']
            )

        # Save updated history to session
        save_chat_session(session_id, updated_history)

        return jsonify({
            'message': response,
            "history": updated_history,
            "session_id": session_id,
            "medical_context_used": medical_context_used,
            "user_reports_count": len(medical_manager.user_reports),
            "task_suggestion": created_task,
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
        language = user_data.get('language', 'en')
        requested_voice_id = user_data.get('voice_id', None)

        if not user_text:
            return jsonify({"error": "No text provided"}), 400

        if not eleven_client:
            return jsonify({"error": "ElevenLabs not configured"}), 500

        print(f"Processing text: {user_text}")
        print(f"Language: {language}")
        print(f"Requested voice ID: {requested_voice_id}")

        # Map language to appropriate voice ID
        voice_mapping = {
            'en': "21m00Tcm4TlvDq8ikWAM",  # Rachel voice (English)
            'hi': "21m00Tcm4TlvDq8ikWAM"   # Use Rachel voice for Hindi (multilingual support)
        }

        # Use requested voice ID or default to language mapping
        voice_id = requested_voice_id or voice_mapping.get(language, "21m00Tcm4TlvDq8ikWAM")

        # Generate audio using ElevenLabs
        audio_generator = eleven_client.text_to_speech.convert(
            text=user_text,
            voice_id=voice_id,
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
        "medical_context_loaded": medical_manager.loaded,
        "reference_files_count": len([f for f in os.listdir("pdfs") if f.endswith('.pdf')]) if os.path.exists("pdfs") else 0,
        "user_reports_count": len(medical_manager.user_reports),
        "name": "Suzi",
        "version": "suzi-medical-context"
    }), 200

@app.route('/upload-medical-report', methods=['POST'])
def upload_medical_report():
    """Upload user medical report PDF"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        if not file.filename.endswith('.pdf'):
            return jsonify({"error": "Only PDF files are accepted for medical reports"}), 400

        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        # Check if file already exists
        counter = 1
        original_filename = filename
        while os.path.exists(file_path):
            name, ext = os.path.splitext(original_filename)
            filename = f"{name}_{counter}{ext}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            counter += 1

        file.save(file_path)

        # Read and process the PDF content
        content = ""
        try:
            with open(file_path, 'rb') as pdf_file:
                pdf_reader = PdfReader(pdf_file)
                for page in pdf_reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        content += extracted + "\n"
        except Exception as e:
            print(f"Error reading uploaded PDF: {e}")

        # Add to medical manager
        medical_manager.add_user_report(filename, content)

        return jsonify({
            "message": "Medical report uploaded successfully",
            "filename": filename,
            "size": os.path.getsize(file_path),
            "content_length": len(content),
            "total_user_reports": len(medical_manager.user_reports)
        }), 200

    except Exception as e:
        print(f"Medical report upload error: {e}")
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

@app.route('/reload-medical-context', methods=['POST'])
def reload_medical_context():
    """Reload medical context (reference PDFs + user reports)"""
    try:
        medical_manager.load_reference_pdfs()
        medical_manager.load_user_reports()
        return jsonify({
            "message": "Medical context reloaded successfully",
            "reference_files_count": len([f for f in os.listdir("pdfs") if f.endswith('.pdf')]) if os.path.exists("pdfs") else 0,
            "user_reports_count": len(medical_manager.user_reports),
            "loaded": medical_manager.loaded
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to reload medical context: {str(e)}"}), 500

@app.route('/user-reports', methods=['GET'])
def get_user_reports():
    """Get list of uploaded user medical reports"""
    try:
        reports_info = []
        for report in medical_manager.user_reports:
            reports_info.append({
                'filename': report['filename'],
                'upload_date': report['upload_date'],
                'content_length': len(report['content'])
            })

        return jsonify({
            "reports": reports_info,
            "total_count": len(reports_info)
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get reports: {str(e)}"}), 500

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

# Chat History Endpoints
@app.route('/chat-sessions', methods=['GET'])
def get_chat_sessions():
    """Get all chat sessions"""
    try:
        sessions = get_all_chat_sessions()
        return jsonify({
            "sessions": sessions,
            "total_count": len(sessions)
        }), 200
    except Exception as e:
        print(f"Error getting chat sessions: {e}")
        return jsonify({"error": f"Failed to get chat sessions: {str(e)}"}), 500

@app.route('/chat-session/<session_id>', methods=['GET'])
def get_chat_session(session_id):
    """Get specific chat session"""
    try:
        messages = load_chat_session(session_id)
        return jsonify({
            "session_id": session_id,
            "messages": messages,
            "message_count": len(messages)
        }), 200
    except Exception as e:
        print(f"Error getting chat session: {e}")
        return jsonify({"error": f"Failed to get chat session: {str(e)}"}), 500

@app.route('/chat-session/<session_id>', methods=['DELETE'])
def delete_chat_session(session_id):
    """Delete specific chat session"""
    try:
        filename = f"chat_sessions/session_{session_id}.json"
        if os.path.exists(filename):
            os.remove(filename)
            return jsonify({
                "message": f"Chat session {session_id} deleted successfully"
            }), 200
        else:
            return jsonify({"error": "Chat session not found"}), 404
    except Exception as e:
        print(f"Error deleting chat session: {e}")
        return jsonify({"error": f"Failed to delete chat session: {str(e)}"}), 500

@app.route('/clear-all-sessions', methods=['DELETE'])
def clear_all_chat_sessions():
    """Clear all chat sessions"""
    try:
        import shutil
        if os.path.exists('chat_sessions'):
            shutil.rmtree('chat_sessions')
            os.makedirs('chat_sessions', exist_ok=True)
        return jsonify({
            "message": "All chat sessions cleared successfully"
        }), 200
    except Exception as e:
        print(f"Error clearing chat sessions: {e}")
        return jsonify({"error": f"Failed to clear chat sessions: {str(e)}"}), 500

# Task Management Endpoints
@app.route('/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks"""
    try:
        tasks = load_tasks()
        # Filter tasks by status if provided
        status_filter = request.args.get('status')
        if status_filter:
            tasks = [task for task in tasks if task.get('status') == status_filter]

        return jsonify({
            "tasks": tasks,
            "total_count": len(tasks),
            "pending_count": len([t for t in tasks if t.get('status') == 'pending']),
            "completed_count": len([t for t in tasks if t.get('status') == 'completed'])
        }), 200
    except Exception as e:
        print(f"Error getting tasks: {e}")
        return jsonify({"error": f"Failed to get tasks: {str(e)}"}), 500

@app.route('/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    try:
        data = request.get_json()
        task_title = data.get('title')
        task_type = data.get('type', 'wellness')
        due_date = data.get('due_date')
        priority = data.get('priority', 'medium')

        if not task_title:
            return jsonify({"error": "Task title is required"}), 400

        new_task = add_task(task_title, task_type, due_date, priority)
        if new_task:
            return jsonify({
                "message": "Task created successfully",
                "task": new_task
            }), 201
        else:
            return jsonify({"error": "Failed to create task"}), 500

    except Exception as e:
        print(f"Error creating task: {e}")
        return jsonify({"error": f"Failed to create task: {str(e)}"}), 500

@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update task status"""
    try:
        data = request.get_json()
        new_status = data.get('status')

        if not new_status:
            return jsonify({"error": "Status is required"}), 400

        if new_status not in ['pending', 'completed', 'cancelled']:
            return jsonify({"error": "Invalid status. Must be: pending, completed, or cancelled"}), 400

        updated_task = update_task_status(task_id, new_status)
        if updated_task:
            return jsonify({
                "message": f"Task {task_id} updated successfully",
                "task": updated_task
            }), 200
        else:
            return jsonify({"error": "Task not found"}), 404

    except Exception as e:
        print(f"Error updating task: {e}")
        return jsonify({"error": f"Failed to update task: {str(e)}"}), 500

@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def remove_task(task_id):
    """Delete a task"""
    try:
        if delete_task(task_id):
            return jsonify({
                "message": f"Task {task_id} deleted successfully"
            }), 200
        else:
            return jsonify({"error": "Task not found"}), 404

    except Exception as e:
        print(f"Error deleting task: {e}")
        return jsonify({"error": f"Failed to delete task: {str(e)}"}), 500

@app.route('/tasks/dashboard', methods=['GET'])
def get_dashboard():
    """Get dashboard data with tasks overview"""
    try:
        tasks = load_tasks()

        # Categorize tasks
        pending_tasks = [t for t in tasks if t.get('status') == 'pending']
        completed_today = []
        upcoming_appointments = []

        today = datetime.now().date()

        for task in tasks:
            if task.get('status') == 'completed' and task.get('completed_at'):
                completed_date = datetime.fromisoformat(task['completed_at']).date()
                if completed_date == today:
                    completed_today.append(task)

            if task.get('type') == 'appointment' and task.get('status') == 'pending':
                upcoming_appointments.append(task)

        # Stats by type
        wellness_pending = len([t for t in pending_tasks if t.get('type') == 'wellness'])
        appointment_pending = len([t for t in pending_tasks if t.get('type') == 'appointment'])

        dashboard_data = {
            "overview": {
                "total_pending": len(pending_tasks),
                "completed_today": len(completed_today),
                "total_tasks": len(tasks)
            },
            "pending_tasks": sorted(pending_tasks, key=lambda x: x.get('created_at', ''), reverse=True)[:10],  # Last 10
            "task_breakdown": {
                "wellness_tasks": wellness_pending,
                "appointment_tasks": appointment_pending,
                "upcoming_appointments": upcoming_appointments
            },
            "recent_activity": completed_today[-5:] if completed_today else []  # Last 5 completed today
        }

        return jsonify(dashboard_data), 200

    except Exception as e:
        print(f"Error getting dashboard: {e}")
        return jsonify({"error": f"Failed to get dashboard: {str(e)}"}), 500

if __name__ == '__main__':
    print("🌸 Starting Suzi - Enhanced Mental Health Companion with 3D Avatar...")
    print("🌐 Standard interface: http://127.0.0.1:8001")
    print("✨ Enhanced 3D interface: http://127.0.0.1:8001/suzi-enhanced")
    print("🚀 Latest Enhanced v2: http://127.0.0.1:8001/suzi-enhanced-v2")
    print("🤖 Immersive AI Avatar Chat: http://127.0.0.1:8001/ai-avatar-chat")
    print("📋 Health Dashboard: http://127.0.0.1:8001/health-dashboard")
    print("📎 Embed examples: http://127.0.0.1:8001/embed-example")
    print("💚 Health check: http://127.0.0.1:8001/health")
    print("📚 Medical context: Loaded" if medical_manager.loaded else "❌ Medical context: Not loaded")
    print(f"📖 Reference files: {len([f for f in os.listdir('pdfs') if f.endswith('.pdf')]) if os.path.exists('pdfs') else 0}")
    print(f"📄 User reports: {len(medical_manager.user_reports)}")
    print("🎭 3D Avatar: Enhanced with realistic rendering")
    print("🎵 Audio Player: Advanced controls with seek/volume")
    print("💬 Integrated Chat: Talk with Suzi like a real person")
    print("⚡ Concise responses (< 60 words)")
    print("💾 Chat history storage and management")
    print("🎤 Enhanced voice controls with auto-detection")
    print("📋 Task management system with wellness tracking")
    print("🎨 Modern, intuitive UI design")

    app.run(debug=True, port=8001)