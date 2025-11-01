# !pip install pymupdf langchain langchain-community chromadb sentence-transformers transformers accelerate
import fitz  # PyMuPDF
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings
# from main import predict_emotion, predict_intent

# from createKB import documents
import os

# persist_dir = "./chroma_db"
# embedding_model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

# vectorstore = Chroma.from_documents(
#     embedding_function=embedding_model,
#     persist_directory=persist_dir,
#     collection_name="mental_health_knowledge"
# )

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


import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Load your fine-tuned emotion classifier
MODEL_PATH = "./bert_model_corrected.pt"
tokenizer_emotion = AutoTokenizer.from_pretrained("bert-base-uncased")

if os.path.exists(MODEL_PATH):
    saved_data = torch.load(MODEL_PATH, map_location="cpu")
    model_emotion = AutoModelForSequenceClassification.from_pretrained("bert-base-uncased", num_labels=6)
    model_emotion.load_state_dict(saved_data if isinstance(saved_data, dict) else saved_data.state_dict())
    model_emotion.eval()
    print("Emotion classifier loaded ✅")
else:
    print("Emotion model not found!")

emotion_labels = ["sad", "anxious", "angry", "happy", "fearful", "surprised"]

def classify_emotion(text):
    inputs = tokenizer_emotion(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model_emotion(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        pred = torch.argmax(probs, dim=-1).item()
        return emotion_labels[pred], probs[0][pred].item()

tokenizer_intent = AutoTokenizer.from_pretrained("yeniguno/bert-uncased-intent-classification")
model_intent = AutoModelForSequenceClassification.from_pretrained("yeniguno/bert-uncased-intent-classification")
model_intent.eval()

intent_labels = ["greeting", "seek_support", "information", "goodbye", "smalltalk", "affirmation"]  # adjust to actual model

def classify_intent(text):
    inputs = tokenizer_intent(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model_intent(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        pred = torch.argmax(probs, dim=-1).item()
        return intent_labels[pred], probs[0][pred].item()

from transformers import pipeline

generator = pipeline("text2text-generation", model="google/flan-t5-small") # or any suitable model (GEMINI 2.0 Flash-Pro)

def fusion_chatbot(user_input):
    # Step 1: Classify emotion + intent
    emotion, emo_conf = classify_emotion(user_input)
    intent, intent_conf = classify_intent(user_input)

    # Step 2: Retrieve knowledge
    docs = retriever.get_relevant_documents(user_input)
    context = "\n".join([d.page_content for d in docs]) if docs else "No relevant resources found."

    # Step 3: Fusion prompt
    prompt = f"""
    You are a safe, empathetic mental health chatbot.
    
    User: {user_input}
    Detected Emotion: {emotion} (confidence {emo_conf:.2f})
    Detected Intent: {intent} (confidence {intent_conf:.2f})
    
    Relevant Mental Health Resources:
    {context}
    
    Respond in a kind, safe, supportive way. 
    """

    response = generator(prompt, max_length=200)[0]['generated_text']
    return response


user_query = "I'm feeling nervous about my exams and can't sleep."
print(fusion_chatbot(user_query))
