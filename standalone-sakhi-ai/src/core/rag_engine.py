"""
RAG (Retrieval-Augmented Generation) Engine for Sakhi AI
"""

import os
import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

# Vector database
import chromadb
from chromadb.config import Settings

# Text processing
from sentence_transformers import SentenceTransformer
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
import re

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

from ..utils.logger import get_logger

logger = get_logger(__name__)

class RAGEngine:
    """RAG Engine for document retrieval and context augmentation"""

    def __init__(self, persist_directory: str = "./chroma_db",
                 collection_name: str = "sakhi_medical_docs",
                 embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"):
        """
        Initialize RAG Engine

        Args:
            persist_directory: Directory to persist ChromaDB
            collection_name: Name of ChromaDB collection
            embedding_model: Sentence transformer model name
        """
        self.persist_directory = persist_directory
        self.collection_name = collection_name
        self.embedding_model_name = embedding_model

        # Create persist directory if it doesn't exist
        os.makedirs(persist_directory, exist_ok=True)

        # Initialize components
        self.embedding_model = None
        self.chroma_client = None
        self.collection = None

        self._initialize()

    def _initialize(self):
        """Initialize RAG components"""
        try:
            logger.info("Initializing RAG Engine...")

            # Initialize embedding model
            logger.info(f"Loading embedding model: {self.embedding_model_name}")
            self.embedding_model = SentenceTransformer(self.embedding_model_name)

            # Initialize ChromaDB
            logger.info(f"Initializing ChromaDB with persist directory: {self.persist_directory}")
            self.chroma_client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )

            # Get or create collection
            try:
                self.collection = self.chroma_client.get_collection(name=self.collection_name)
                logger.info(f"Connected to existing collection: {self.collection_name}")
            except Exception:
                self.collection = self.chroma_client.create_collection(
                    name=self.collection_name,
                    metadata={"description": "Sakhi AI Medical Documents Collection"}
                )
                logger.info(f"Created new collection: {self.collection_name}")

            logger.info("✅ RAG Engine initialized successfully")

        except Exception as e:
            logger.error(f"❌ Failed to initialize RAG Engine: {str(e)}")
            raise

    def health_check(self) -> Dict[str, Any]:
        """
        Check RAG Engine health

        Returns:
            Health check result
        """
        try:
            if not self.embedding_model or not self.collection:
                return {
                    'status': 'unhealthy',
                    'message': 'Components not initialized'
                }

            # Test embedding
            test_embedding = self.embedding_model.encode("test query")
            if test_embedding is None or len(test_embedding) == 0:
                return {
                    'status': 'unhealthy',
                    'message': 'Embedding model not working'
                }

            # Test collection
            collection_count = self.collection.count()
            return {
                'status': 'healthy',
                'message': 'RAG Engine is working',
                'document_count': collection_count,
                'embedding_model': self.embedding_model_name
            }

        except Exception as e:
            return {
                'status': 'unhealthy',
                'message': f'Health check failed: {str(e)}'
            }

    def add_document(self, document_id: str, content: str,
                    metadata: Dict[str, Any] = None,
                    user_id: str = "default") -> Dict[str, Any]:
        """
        Add document to RAG system

        Args:
            document_id: Unique document identifier
            content: Document text content
            metadata: Document metadata
            user_id: User ID for access control

        Returns:
            Addition result
        """
        try:
            logger.info(f"Adding document {document_id} to RAG system")

            # Split content into chunks
            chunks = self._chunk_text(content, chunk_size=1000, overlap=200)

            if not chunks:
                return {
                    'success': False,
                    'error': 'No content chunks created'
                }

            # Prepare data for ChromaDB
            ids = []
            documents = []
            metadatas = []

            for i, chunk in enumerate(chunks):
                chunk_id = f"{document_id}_chunk_{i}"
                ids.append(chunk_id)
                documents.append(chunk)

                chunk_metadata = {
                    'document_id': document_id,
                    'chunk_index': i,
                    'user_id': user_id,
                    'created_at': datetime.now().isoformat(),
                    **(metadata or {})
                }
                metadatas.append(chunk_metadata)

            # Add to collection
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )

            logger.info(f"✅ Added {len(chunks)} chunks for document {document_id}")

            return {
                'success': True,
                'chunk_count': len(chunks),
                'document_id': document_id
            }

        except Exception as e:
            logger.error(f"❌ Failed to add document: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def retrieve_context(self, query: str, user_id: str = "default",
                        top_k: int = 5, threshold: float = 0.5) -> List[Dict[str, Any]]:
        """
        Retrieve relevant context for query

        Args:
            query: Query text
            user_id: User ID for access control
            top_k: Number of top results to retrieve
            threshold: Similarity threshold

        Returns:
            List of relevant document chunks
        """
        try:
            logger.info(f"Retrieving context for query: {query[:100]}...")

            # Generate query embedding
            query_embedding = self.embedding_model.encode(query)

            # Search in collection
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where={"user_id": user_id},
                include=["documents", "metadatas", "distances"]
            )

            # Process results
            context_docs = []
            if results['ids'] and results['ids'][0]:
                for i, doc_id in enumerate(results['ids'][0]):
                    distance = results['distances'][0][i]
                    similarity = 1 - distance  # Convert distance to similarity

                    if similarity >= threshold:
                        context_docs.append({
                            'id': doc_id,
                            'content': results['documents'][0][i],
                            'metadata': results['metadatas'][0][i],
                            'similarity': similarity,
                            'document_id': results['metadatas'][0][i].get('document_id'),
                            'chunk_index': results['metadatas'][0][i].get('chunk_index')
                        })

            logger.info(f"Retrieved {len(context_docs)} relevant context chunks")
            return context_docs

        except Exception as e:
            logger.error(f"❌ Failed to retrieve context: {str(e)}")
            return []

    def delete_document(self, document_id: str, user_id: str = "default") -> bool:
        """
        Delete document from RAG system

        Args:
            document_id: Document ID to delete
            user_id: User ID for access control

        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"Deleting document {document_id} from RAG system")

            # Find all chunks for this document
            results = self.collection.get(
                where={"document_id": document_id, "user_id": user_id}
            )

            if results['ids']:
                self.collection.delete(ids=results['ids'])
                logger.info(f"✅ Deleted {len(results['ids'])} chunks for document {document_id}")
                return True
            else:
                logger.warning(f"No chunks found for document {document_id}")
                return False

        except Exception as e:
            logger.error(f"❌ Failed to delete document: {str(e)}")
            return False

    def get_user_documents(self, user_id: str = "default") -> List[Dict[str, Any]]:
        """
        Get all documents for a user

        Args:
            user_id: User ID

        Returns:
            List of documents
        """
        try:
            # Get all chunks for user
            results = self.collection.get(
                where={"user_id": user_id},
                include=["metadatas"]
            )

            # Group chunks by document_id
            documents = {}
            if results['ids'] and results['metadatas']:
                for metadata in results['metadatas']:
                    doc_id = metadata.get('document_id')
                    if doc_id and doc_id not in documents:
                        documents[doc_id] = {
                            'id': doc_id,
                            'filename': metadata.get('filename', 'Unknown'),
                            'upload_date': metadata.get('created_at'),
                            'chunks': 0,
                            'metadata': metadata
                        }
                    documents[doc_id]['chunks'] += 1

            return list(documents.values())

        except Exception as e:
            logger.error(f"❌ Failed to get user documents: {str(e)}")
            return []

    def _chunk_text(self, text: str, chunk_size: int = 1000,
                   overlap: int = 200) -> List[str]:
        """
        Split text into chunks

        Args:
            text: Text to chunk
            chunk_size: Maximum chunk size
            overlap: Overlap between chunks

        Returns:
            List of text chunks
        """
        try:
            # Clean text
            text = re.sub(r'\s+', ' ', text).strip()

            if len(text) <= chunk_size:
                return [text]

            chunks = []
            start = 0

            while start < len(text):
                end = start + chunk_size

                # Try to break at sentence boundary
                if end < len(text):
                    # Find last sentence ending in chunk
                    last_period = text.rfind('.', start, end)
                    last_exclamation = text.rfind('!', start, end)
                    last_question = text.rfind('?', start, end)
                    last_sentence = max(last_period, last_exclamation, last_question)

                    if last_sentence > start + chunk_size // 2:
                        end = last_sentence + 1
                    else:
                        # Find last space
                        last_space = text.rfind(' ', start, end)
                        if last_space > start:
                            end = last_space

                chunk = text[start:end].strip()
                if chunk:
                    chunks.append(chunk)

                start = max(start + 1, end - overlap)

            return chunks

        except Exception as e:
            logger.error(f"❌ Failed to chunk text: {str(e)}")
            return []

    def reset_collection(self) -> bool:
        """
        Reset the entire collection

        Returns:
            True if successful, False otherwise
        """
        try:
            logger.warning("Resetting RAG collection")
            self.chroma_client.delete_collection(name=self.collection_name)
            self.collection = self.chroma_client.create_collection(
                name=self.collection_name,
                metadata={"description": "Sakhi AI Medical Documents Collection"}
            )
            logger.info("✅ RAG collection reset successfully")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to reset collection: {str(e)}")
            return False

    def get_stats(self) -> Dict[str, Any]:
        """
        Get RAG system statistics

        Returns:
            Statistics dictionary
        """
        try:
            total_chunks = self.collection.count()

            # Get unique document count
            results = self.collection.get(include=["metadatas"])
            unique_docs = set()
            if results['metadatas']:
                for metadata in results['metadatas']:
                    doc_id = metadata.get('document_id')
                    if doc_id:
                        unique_docs.add(doc_id)

            return {
                'total_chunks': total_chunks,
                'unique_documents': len(unique_docs),
                'embedding_model': self.embedding_model_name,
                'collection_name': self.collection_name,
                'persist_directory': self.persist_directory
            }

        except Exception as e:
            logger.error(f"❌ Failed to get stats: {str(e)}")
            return {}