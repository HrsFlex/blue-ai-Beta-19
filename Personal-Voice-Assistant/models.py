from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

# Association table for many-to-many relationship between clients and documents
client_documents = Table(
    'client_documents',
    Base.metadata,
    Column('client_id', Integer, ForeignKey('clients.id')),
    Column('document_id', Integer, ForeignKey('documents.id'))
)

class Client(Base):
    __tablename__ = 'clients'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Medical History
    medical_conditions = Column(Text, nullable=True)  # JSON string
    current_medications = Column(Text, nullable=True)  # JSON string
    mental_health_history = Column(Text, nullable=True)  # JSON string
    trauma_history = Column(Text, nullable=True)  # JSON string
    treatment_preferences = Column(Text, nullable=True)  # JSON string

    # Progress tracking
    initial_mood_score = Column(Float, nullable=True)
    current_mood_score = Column(Float, nullable=True)
    session_count = Column(Integer, default=0)

    # Privacy settings
    data_sharing_consent = Column(Boolean, default=False)
    emergency_contact = Column(String(200), nullable=True)

    # Relationships
    documents = relationship("Document", secondary=client_documents, back_populates="clients")
    conversations = relationship("Conversation", back_populates="client")
    mood_entries = relationship("MoodEntry", back_populates="client")

class Document(Base):
    __tablename__ = 'documents'

    id = Column(Integer, primary_key=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)

    # Document processing status
    processed = Column(Boolean, default=False)
    processing_error = Column(Text, nullable=True)

    # Content analysis
    content_summary = Column(Text, nullable=True)
    key_topics = Column(Text, nullable=True)  # JSON string
    relevance_score = Column(Float, nullable=True)

    # Privacy
    is_sensitive = Column(Boolean, default=False)
    access_level = Column(String(20), default='private')  # public, private, restricted

    # Relationships
    clients = relationship("Client", secondary=client_documents, back_populates="documents")

class DocumentChunk(Base):
    __tablename__ = 'document_chunks'

    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey('documents.id'), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)

    # Vector embedding information
    embedding_model = Column(String(100), nullable=True)
    embedding_dimension = Column(Integer, nullable=True)

    # Metadata
    page_number = Column(Integer, nullable=True)
    section_title = Column(String(255), nullable=True)
    chunk_type = Column(String(50), default='text')  # text, table, image_caption

    # Processing
    processed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document")

class Conversation(Base):
    __tablename__ = 'conversations'

    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey('clients.id'), nullable=False)
    session_id = Column(String(100), nullable=False)

    # Conversation content
    user_message = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)

    # Context information
    detected_emotion = Column(String(50), nullable=True)
    context_sources = Column(Text, nullable=True)  # JSON string of relevant document chunks
    response_time = Column(Float, nullable=True)  # Response time in seconds

    # Quality metrics
    satisfaction_rating = Column(Integer, nullable=True)  # 1-5 scale
    was_helpful = Column(Boolean, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    client = relationship("Client", back_populates="conversations")

class MoodEntry(Base):
    __tablename__ = 'mood_entries'

    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey('clients.id'), nullable=False)

    # Mood data
    mood_score = Column(Float, nullable=False)  # 1-10 scale
    anxiety_level = Column(Float, nullable=True)  # 1-10 scale
    stress_level = Column(Float, nullable=True)  # 1-10 scale
    sleep_quality = Column(Float, nullable=True)  # 1-10 scale

    # Context
    mood_description = Column(Text, nullable=True)
    triggers = Column(Text, nullable=True)  # JSON string
    coping_mechanisms = Column(Text, nullable=True)

    # Automated analysis
    sentiment_score = Column(Float, nullable=True)  # -1 to 1
    emotion_classification = Column(String(50), nullable=True)

    # Timestamps
    recorded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    client = relationship("Client", back_populates="mood_entries")

class KnowledgeBase(Base):
    __tablename__ = 'knowledge_base'

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    source_document = Column(String(255), nullable=True)

    # Content
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)

    # Metadata
    keywords = Column(Text, nullable=True)  # JSON string
    relevance_score = Column(Float, default=0.0)
    last_accessed = Column(DateTime, nullable=True)
    access_count = Column(Integer, default=0)

    # Classification
    content_type = Column(String(50), nullable=True)  # article, exercise, technique, resource
    difficulty_level = Column(String(20), nullable=True)  # beginner, intermediate, advanced
    time_to_read = Column(Integer, nullable=True)  # minutes

    # Credibility
    author = Column(String(255), nullable=True)
    publication_date = Column(DateTime, nullable=True)
    verified_medical = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SystemConfig(Base):
    __tablename__ = 'system_config'

    id = Column(Integer, primary_key=True)
    config_key = Column(String(100), unique=True, nullable=False)
    config_value = Column(Text, nullable=False)
    config_type = Column(String(50), nullable=True)  # string, integer, boolean, json

    # Metadata
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)
    is_public = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)