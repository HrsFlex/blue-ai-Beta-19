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

# Configure CORS to allow requests from localhost:8001
CORS(app, resources={
    r"/chat": {"origins": ["http://localhost:8001", "http://127.0.0.1:8001"]},
    r"/process-text": {"origins": ["http://localhost:8001", "http://127.0.0.1:8001"]},
    r"/health": {"origins": ["http://localhost:8001", "http://127.0.0.1:8001"]},
    r"/upload-*": {"origins": ["http://localhost:8001", "http://127.0.0.1:8001"]},
    r"/user-reports": {"origins": ["http://localhost:8001", "http://127.0.0.1:8001"]},
    r"/reload-medical-context": {"origins": ["http://localhost:8001", "http://127.0.0.1:8001"]}
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

def send_suzi_message(message, history=None):
    """Send message to Suzi with medical context and mental health focus"""
    if not model:
        return "I'm sorry, I'm having trouble connecting right now. Please check back later.", []

    # Get relevant medical context (reference + user reports)
    medical_context = medical_manager.search_context(message, max_chars=1800)

    # Create Suzi's personality prompt
    suzi_prompt = f"""You are Suzi, a warm, caring mental health companion and close friend. Your name is Suzi and you speak naturally like a real friend would.

IMPORTANT: You must ONLY provide information and advice based on the provided PDF context below. If the context doesn't contain relevant information for the user's concern, say so gently and suggest what might be helpful.

Your approach:
- NEVER ask questions to the user - be proactive and supportive
- Use friendly, conversational language like "Hey there", "You know", "I get that", "It makes sense that..."
- Share advice naturally as if speaking to a close friend
- Focus on mental health recovery, relaxation techniques, and emotional wellness
- Be proactive in offering specific strategies and advice
- Speak like someone who genuinely cares and understands mental health

RESPONSE STYLE:
- Start with warm, empathetic acknowledgment
- Provide specific advice from the PDF context when available
- If no relevant context exists, say: "I wish I had specific information about that in my resources, but here's what generally helps..."
- Include relaxation techniques, coping strategies, or recovery methods
- End with supportive encouragement

SAFETY: Always include crisis resources for serious concerns:
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- Emergency services: 911

{f"MEDICAL KNOWLEDGE BASE (Reference + User Reports):\n{medical_context}\n\n" if medical_context else "No specific medical context available for this query.\n\n"}

Remember: You are Suzi, speak as a caring friend, use only the provided context, and focus on mental health recovery and relaxation advice."""

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
            "Hey there, I'm really sorry you're going through this. I wish I had more specific information about what you're asking about in my resources. From what I know, taking some deep breaths and finding a quiet space can really help when things feel overwhelming. You're stronger than you think, and I'm here for you.",
            "You know, I want to help you with this, but I don't have specific details about it in my current materials. Still, I've found that gentle movement like stretching, listening to calming music, or even just talking things through can make a real difference. You're not alone in this journey.",
            "I get that this is really tough, and I wish I had more targeted information for you. What I do know is that taking it one moment at a time and being kind to yourself is so important for mental health recovery. You're doing great just by reaching out.",
            "Hey, I'm here with you even though I don't have specific details about this in my resources. Remember that healing isn't linear, and some days are harder than others. Be gentle with yourself, try some deep breathing, and know that this feeling will pass. You've got this."
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

@app.route('/chat', methods=['POST'])
def chat():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        user_message = request.json.get('message')
        history = request.json.get('history', [])

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        print(f"User message: {user_message}")
        print(f"History length: {len(history)}")

        response, updated_history = send_suzi_message(user_message, history)

        # Check if medical context was used
        medical_context_used = bool(medical_manager.search_context(user_message, max_chars=100))

        return jsonify({
            'message': response,
            "history": updated_history,
            "medical_context_used": medical_context_used,
            "user_reports_count": len(medical_manager.user_reports),
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

if __name__ == '__main__':
    print("🌸 Starting Suzi - Enhanced Mental Health Companion with 3D Avatar...")
    print("🌐 Standard interface: http://127.0.0.1:8001")
    print("✨ Enhanced 3D interface: http://127.0.0.1:8001/suzi-enhanced")
    print("🤖 Immersive AI Avatar Chat: http://127.0.0.1:8001/ai-avatar-chat")
    print("📋 Embed examples: http://127.0.0.1:8001/embed-example")
    print("💚 Health check: http://127.0.0.1:8001/health")
    print("📚 Medical context: Loaded" if medical_manager.loaded else "❌ Medical context: Not loaded")
    print(f"📖 Reference files: {len([f for f in os.listdir('pdfs') if f.endswith('.pdf')]) if os.path.exists('pdfs') else 0}")
    print(f"📄 User reports: {len(medical_manager.user_reports)}")
    print("🎭 3D Avatar: Enhanced with realistic rendering")
    print("🎵 Audio Player: Advanced controls with seek/volume")
    print("💬 Integrated Chat: Talk with Suzi like a real person")

    app.run(debug=True, port=8001)