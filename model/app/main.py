from fastapi import FastAPI, Request, HTTPException
from app.schemas import ChatRequest, ChatResponse, ErrorResponse
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os 
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings
from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

app = FastAPI()

# Load model once at startup
EMOTION_MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "bert_model_corrected.pt")
INTENT_MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "intent_model.pt")    
model = None
tokenizer = None
intent_model = None
intent_tokenizer = None

# Initialize Chroma vector store and setup retriever 
if 'vectorstore' not in locals():
    persist_dir = "./chroma_db"
    embedding_model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
    vectorstore = Chroma(
        embedding_function=embedding_model,
        persist_directory=persist_dir,
        collection_name="mental_health_knowledge"
    )

retriever = vectorstore.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={"score_threshold": 0.5, "k": 5}
)

@app.on_event("startup")
async def load_model():
	global model, tokenizer, intent_model, intent_tokenizer
	if os.path.exists(EMOTION_MODEL_PATH):
		
		try:
			# Load the saved model
			saved_data = torch.load(EMOTION_MODEL_PATH, map_location=torch.device("cpu"), weights_only=False)
			
			# Initialize tokenizer
			tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')

			intent_tokenizer = AutoTokenizer.from_pretrained(os.path.join(os.path.dirname(__file__), "intent_model"))
			intent_model = torch.load(INTENT_MODEL_PATH, map_location=torch.device("cpu"), weights_only=False)
			intent_model.eval()
			print("Intent model loaded successfully")
			
			# Check if it's a state dict or full model
			if isinstance(saved_data, dict) and 'state_dict' in saved_data:
				# If it's a checkpoint with state_dict
				model = AutoModelForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=6)
				model.load_state_dict(saved_data['state_dict'])
			elif isinstance(saved_data, dict) and any(key.startswith('bert.') for key in saved_data.keys()):
				# If it's a direct state dict, check classifier size to determine num_labels
				classifier_weight_shape = saved_data.get('classifier.weight', torch.tensor([[]])).shape
				num_labels = classifier_weight_shape[0] if len(classifier_weight_shape) > 0 else 6
				
				model = AutoModelForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=num_labels)
				model.load_state_dict(saved_data)
			else:
				# If it's a full model object
				model = saved_data
			
			model.eval()  # Set to evaluation mode
			print("Emotion model loaded successfully")
		except Exception as e:
			print(f"Error loading model: {e}")
			model = None
			tokenizer = None
			intent_model = None
			intent_tokenizer = None
				
	else:
		print(f"Model file not found: {EMOTION_MODEL_PATH}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if model is None or tokenizer is None or intent_model is None or intent_tokenizer is None:
        raise HTTPException(status_code=503, detail="Models not loaded properly")
    
    return {
        "status": "healthy",
        "models_loaded": {
            "emotion_model": model is not None,
            "emotion_tokenizer": tokenizer is not None,
            "intent_model": intent_model is not None,
            "intent_tokenizer": intent_tokenizer is not None
        }
    }

def predict_intent(text: str, threshold: float = 0.6):
    inputs = intent_tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = intent_model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1).squeeze()
        confidence, pred_idx = torch.max(probs, dim=0)
        confidence = confidence.item()
        pred_idx = pred_idx.item()

    label = intent_model.config.id2label[pred_idx]

    if confidence < threshold:
        return "uncertain", confidence
    return label, confidence

def predict_emotion(text: str, threshold: float = 0.6):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1).squeeze()
        confidence, pred_idx = torch.max(probs, dim=0)
        confidence = confidence.item()
        pred_idx = pred_idx.item()

    class_responses = {
        0: "Sadness",
        1: "Joyful",
        2: "Love",
        3: "Anger",
        4: "Fear",
        5: "Surprise"
    }

    if confidence < threshold:
        return "uncertain", confidence
    return class_responses.get(pred_idx, "I'm here to listen."), confidence

import google.generativeai as genai

# Configure Gemini API from .env
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Gemini model
gemini_model = genai.GenerativeModel('gemini-2.5-flash')

def fusion_chatbot(user_input):
    # Step 1: Classify emotion + intent
    emotion, emo_conf = predict_emotion(user_input)
    intent, intent_conf = predict_intent(user_input)

	# backend emotion classifier and intent classifier log in a single print
    print(f"[FusionChatbot] User Input: {user_input} | Emotion: {emotion} (conf: {emo_conf:.2f}) | Intent: {intent} (conf: {intent_conf:.2f})")

    # Step 2: Retrieve knowledge
    docs = retriever.get_relevant_documents(user_input)
    context = "\n".join([d.page_content for d in docs]) if docs else "No relevant resources found."

    # Step 3: Fusion prompt for Gemini
    prompt = f"""You are a compassionate and professional mental health support chatbot. Your responses should be empathetic, supportive, and safe.

User Input: "{user_input}"

Analysis:
- Detected Emotion: {emotion} (confidence: {emo_conf:.2f})
- Detected Intent: {intent} (confidence: {intent_conf:.2f})

Relevant Mental Health Knowledge:
{context}

Instructions:
1. Acknowledge the user's emotional state with empathy
2. Provide supportive and constructive guidance
3. If the situation seems serious (i.e. - suicidal), gently suggest professional help
4. Keep your response conversational and caring
5. Provide a detailed, thoughtful response so that the user feels heard and supported.

Response:"""

    try:
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        return f"I understand you're feeling {emotion.lower()}. I'm here to support you. Could you tell me more about what you're experiencing?"

@app.post("/api/v/chat", 
         response_model=ChatResponse,
         responses={
             400: {"model": ErrorResponse, "description": "Bad Request"},
             500: {"model": ErrorResponse, "description": "Internal Server Error"}
         })
async def chat(request: ChatRequest) -> ChatResponse:
	if not request.prompt:
		raise HTTPException(status_code=400, detail="Prompt is required.")
	if model is None or tokenizer is None:
		raise HTTPException(status_code=500, detail="Model not loaded.")

	try:
		# Use the enhanced fusion chatbot with Gemini
		response = fusion_chatbot(request.prompt)
		return ChatResponse(response=response)

	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")