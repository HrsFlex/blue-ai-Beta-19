import os
import json
import re
from typing import List, Dict, Tuple
import PyPDF2
import pdfplumber
import chromadb
from sentence_transformers import SentenceTransformer
import numpy as np
from sqlalchemy import create_engine, desc
from sqlalchemy.orm import sessionmaker
from models import Document, DocumentChunk, Client, KnowledgeBase, Base
from datetime import datetime

class RAGSystem:
    def __init__(self, db_path="mental_health_companion.db"):
        self.db_path = db_path
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chunk_size = 500
        self.chunk_overlap = 100

        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.chroma_client.get_or_create_collection(
            name="mental_health_knowledge",
            metadata={"description": "Mental health PDF knowledge base"}
        )

        # Initialize database
        self.engine = create_engine(f'sqlite:///{db_path}', echo=True)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

        print("RAG System initialized successfully")

    def process_pdf(self, pdf_path: str, document_title: str = None) -> bool:
        """Process a PDF file and add it to the RAG system"""
        try:
            filename = os.path.basename(pdf_path)

            # Create document record
            session = self.Session()
            document = Document(
                filename=filename,
                original_filename=document_title or filename,
                file_type='application/pdf',
                file_size=os.path.getsize(pdf_path)
            )
            session.add(document)
            session.commit()
            document_id = document.id

            # Extract text from PDF
            text_content = self._extract_text_from_pdf(pdf_path)

            # Split into chunks
            chunks = self._split_text_into_chunks(text_content)

            # Process chunks and add to vector database
            for i, chunk in enumerate(chunks):
                # Add to ChromaDB
                chunk_id = f"{filename}_chunk_{i}"
                self.collection.add(
                    documents=[chunk],
                    metadatas={
                        "document_id": document_id,
                        "chunk_index": i,
                        "filename": filename,
                        "title": document_title or filename
                    },
                    ids=[chunk_id]
                )

                # Add to SQL database
                doc_chunk = DocumentChunk(
                    document_id=document_id,
                    chunk_index=i,
                    content=chunk,
                    embedding_model="all-MiniLM-L6-v2",
                    embedding_dimension=384,
                    processed_at=datetime.utcnow()
                )
                session.add(doc_chunk)

            # Update document status
            document.processed = True
            document.processing_error = None
            document.content_summary = chunks[0][:500] + "..." if chunks else ""
            session.commit()
            session.close()

            print(f"Successfully processed {filename}: {len(chunks)} chunks")
            return True

        except Exception as e:
            print(f"Error processing PDF {pdf_path}: {str(e)}")
            if 'document' in locals():
                document.processing_error = str(e)
                session.commit()
            session.close()
            return False

    def _extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF using multiple methods"""
        text = ""

        # Method 1: PyPDF2
        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            print(f"PyPDF2 extraction failed: {e}")

        # Method 2: pdfplumber (better for complex layouts)
        if not text.strip():
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    for page in pdf.pages:
                        text += page.extract_text() + "\n"
            except Exception as e:
                print(f"pdfplumber extraction failed: {e}")

        return self._clean_text(text)

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)

        # Remove page numbers and headers/footers
        text = re.sub(r'\n\s*\d+\s*\n', '\n', text)

        # Remove special characters that might interfere
        text = re.sub(r'[^\w\s\.\,\;\:\!\?\-\(\)]', ' ', text)

        return text.strip()

    def _split_text_into_chunks(self, text: str) -> List[str]:
        """Split text into overlapping chunks"""
        if not text:
            return []

        words = text.split()
        chunks = []

        for i in range(0, len(words), self.chunk_size - self.chunk_overlap):
            chunk_words = words[i:i + self.chunk_size]
            if chunk_words:
                chunks.append(' '.join(chunk_words))

        return chunks

    def search_knowledge(self, query: str, k: int = 5) -> List[Dict]:
        """Search the knowledge base for relevant information"""
        try:
            # Query ChromaDB
            results = self.collection.query(
                query_texts=[query],
                n_results=k,
                include=["documents", "metadatas", "distances"]
            )

            search_results = []
            for i, (doc, metadata, distance) in enumerate(zip(
                results['documents'][0],
                results['metadatas'][0],
                results['distances'][0]
            )):
                search_results.append({
                    'content': doc,
                    'metadata': metadata,
                    'similarity_score': 1 - distance,  # Convert distance to similarity
                    'rank': i + 1
                })

            return search_results

        except Exception as e:
            print(f"Error searching knowledge base: {e}")
            return []

    def get_context_for_ai(self, query: str, client_id: int = None, max_context: int = 2000) -> str:
        """Get relevant context for AI response"""
        search_results = self.search_knowledge(query, k=10)

        if not search_results:
            return ""

        # Prioritize and select the most relevant chunks
        context_chunks = []
        total_length = 0

        for result in search_results:
            chunk_content = result['content']
            similarity_score = result['similarity_score']

            # Only include high-quality matches
            if similarity_score > 0.3 and total_length + len(chunk_content) < max_context:
                context_chunks.append({
                    'content': chunk_content,
                    'source': result['metadata'].get('filename', 'Unknown'),
                    'similarity': similarity_score
                })
                total_length += len(chunk_content)

        # Format context for AI
        if context_chunks:
            context_text = "\n\n".join([
                f"[From {chunk['source']} - Relevance: {chunk['similarity']:.2f}]\n{chunk['content']}"
                for chunk in context_chunks
            ])

            return f"Based on the following mental health resources:\n\n{context_text}\n\n"

        return ""

    def process_reference_pdfs(self, pdfs_directory: str = "pdfs") -> int:
        """Process all PDFs in the reference directory"""
        if not os.path.exists(pdfs_directory):
            print(f"PDFs directory not found: {pdfs_directory}")
            return 0

        processed_count = 0
        pdf_files = [f for f in os.listdir(pdfs_directory) if f.lower().endswith('.pdf')]

        for pdf_file in pdf_files:
            pdf_path = os.path.join(pdfs_directory, pdf_file)
            print(f"Processing PDF: {pdf_file}")

            # Generate title from filename
            title = pdf_file.replace('.pdf', '').replace('-', ' ').replace('_', ' ')
            title = ' '.join(word.capitalize() for word in title.split())

            if self.process_pdf(pdf_path, title):
                processed_count += 1

        print(f"Processed {processed_count} out of {len(pdf_files)} PDFs")
        return processed_count

    def add_knowledge_base_entries(self):
        """Add structured knowledge base entries"""
        knowledge_entries = [
            {
                "title": "Anxiety Self-Help Techniques",
                "category": "Anxiety Management",
                "content": """Deep breathing exercises: Inhale for 4 counts, hold for 4, exhale for 6.
Progressive muscle relaxation: Tense and release muscle groups systematically.
Mindfulness meditation: Focus on present moment without judgment.
5-4-3-2-1 grounding technique: Name 5 things you see, 4 things you can touch, 3 things you hear, 2 things you smell, 1 thing you taste.""",
                "keywords": ["anxiety", "breathing", "relaxation", "grounding", "mindfulness"],
                "content_type": "technique"
            },
            {
                "title": "Trauma-Informed Care Principles",
                "category": "Trauma Support",
                "content": """Safety: Ensure physical and emotional safety.
Trustworthiness: Maintain transparency and consistency.
Choice: Prioritize client choice and control.
Collaboration: Work together in partnership.
Empowerment: Support skill building and self-advocacy.
Cultural, Historical, and Gender Issues: Recognize and address biases.""",
                "keywords": ["trauma", "safety", "trust", "choice", "collaboration", "empowerment"],
                "content_type": "principles"
            },
            {
                "title": "Mental Health Coping Strategies",
                "category": "General Mental Health",
                "content": """Daily routine: Establish consistent sleep, meals, and activity.
Social connection: Maintain relationships with supportive people.
Physical activity: Regular exercise improves mood and reduces stress.
Creative expression: Art, music, writing as emotional outlets.
Limit alcohol and caffeine: They can worsen anxiety and sleep problems.
Seek professional help: Therapy or counseling when needed.""",
                "keywords": ["coping", "routine", "social", "exercise", "creativity", "professional"],
                "content_type": "strategies"
            },
            {
                "title": "Better Safety Conversation Guide",
                "category": "Communication",
                "content": """Active listening: Give full attention and reflect understanding.
Open-ended questions: Encourage detailed responses rather than yes/no.
Non-judgmental stance: Accept feelings without criticism.
Validation: Acknowledge emotions as legitimate.
Appropriate pace: Allow time for processing and reflection.
Crisis awareness: Know when and how to escalate concerns.""",
                "keywords": ["communication", "listening", "questions", "validation", "safety", "crisis"],
                "content_type": "communication"
            }
        ]

        session = self.Session()
        added_count = 0

        for entry_data in knowledge_entries:
            # Check if entry already exists
            existing = session.query(KnowledgeBase).filter_by(title=entry_data["title"]).first()
            if existing:
                continue

            entry = KnowledgeBase(
                title=entry_data["title"],
                category=entry_data["category"],
                content=entry_data["content"],
                keywords=json.dumps(entry_data["keywords"]),
                content_type=entry_data["content_type"],
                verified_medical=True,
                relevance_score=1.0
            )

            session.add(entry)
            added_count += 1

        session.commit()
        session.close()

        print(f"Added {added_count} knowledge base entries")
        return added_count

    def get_conversation_context(self, client_id: int, limit: int = 5) -> str:
        """Get recent conversation context for a client"""
        session = self.Session()

        # Get recent conversations
        conversations = session.query(Conversation).filter_by(
            client_id=client_id
        ).order_by(desc(Conversation.created_at)).limit(limit).all()

        context = ""
        if conversations:
            context = "Recent conversation history:\n"
            for conv in reversed(conversations):  # Oldest first
                context += f"User: {conv.user_message}\n"
                context += f"AI: {conv.ai_response}\n\n"

        session.close()
        return context