# !pip install pymupdf langchain langchain-community chromadb sentence-transformers transformers accelerate
import fitz  # PyMuPDF
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings
import os

# --- Step 1: Extract text ---
def extract_text_from_pdf(pdf_path: str) -> str:
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        return ""
    doc = fitz.open(pdf_path)
    text = ""
    for page_num in range(len(doc)):
        page_text = doc[page_num].get_text()
        if page_text.strip():
            text += f"\n\n--- Page {page_num+1} ---\n\n{page_text}"
    doc.close()
    return text

pdf_paths = ["/content/assests/1636-CAMHS-Anxiety-self-help-A4-leaflet.pdf",
             "/content/assests/Fact-Sheet-What-is-Trauma-Informed-Care.pdf",
             "/content/assests/SHP_Better-Safety-Conversations.pdf",
             "/content/assests/mental-health-considerations.pdf"]
extracted_texts = {os.path.basename(p): extract_text_from_pdf(p) for p in pdf_paths if os.path.exists(p)}

# --- Step 2: Chunking ---
def create_chunks(text: str, source: str):
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
    chunks = splitter.split_text(text)
    return [Document(page_content=c, metadata={"source": source, "chunk_id": i}) for i, c in enumerate(chunks)]

documents = []
for source, text in extracted_texts.items():
    documents.extend(create_chunks(text, source))

print(f"Total chunks: {len(documents)}")

# --- Step 3: Build vector store ---
# persist_dir = "./content/mental_health_db"
# embedding_model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

# vectorstore = Chroma.from_documents(
#     documents=documents,
#     embedding=embedding_model,
#     persist_directory=persist_dir,
#     collection_name="mental_health_knowledge"
# )
# vectorstore.persist()

# Set up ChromaDB knowledge base for study materials
persist_directory = "/content/chroma_db"  # ✅ writable in Colab
embedding_model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

# Recreate vectorstore
vectorstore = Chroma.from_documents(
    documents=documents,
    embedding=embedding_model,
    persist_directory=persist_directory,
    collection_name="mental_health_knowledge_base"
)

# Persist the database
vectorstore.persist()
print(f"Knowledge base created with {len(documents)} chunks")
print(f"Database persisted to: {persist_directory}")
