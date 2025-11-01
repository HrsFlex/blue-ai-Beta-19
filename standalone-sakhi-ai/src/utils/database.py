"""
Database management for Sakhi AI
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from .logger import get_logger

logger = get_logger(__name__)

class DatabaseManager:
    """SQLite database manager for Sakhi AI"""

    def __init__(self, database_url: str):
        """
        Initialize database manager

        Args:
            database_url: SQLite database URL
        """
        self.database_url = database_url
        self.db_path = database_url.replace('sqlite:///', '')
        self._ensure_db_directory()

    def _ensure_db_directory(self):
        """Ensure database directory exists"""
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)

    def init_db(self):
        """Initialize database with required tables"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                # Sessions table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS sessions (
                        id TEXT PRIMARY KEY,
                        created_at TIMESTAMP,
                        updated_at TIMESTAMP,
                        data TEXT,
                        chat_history_count INTEGER DEFAULT 0,
                        documents_count INTEGER DEFAULT 0,
                        emotions_count INTEGER DEFAULT 0,
                        assessments_count INTEGER DEFAULT 0
                    )
                ''')

                # Documents table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS documents (
                        id TEXT PRIMARY KEY,
                        session_id TEXT,
                        filename TEXT,
                        upload_date TIMESTAMP,
                        file_size INTEGER,
                        pages INTEGER,
                        chunks INTEGER,
                        metadata TEXT,
                        FOREIGN KEY (session_id) REFERENCES sessions (id)
                    )
                ''')

                # Emotions table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS emotions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_id TEXT,
                        emotion TEXT,
                        confidence REAL,
                        emotion_type TEXT,
                        timestamp TIMESTAMP,
                        FOREIGN KEY (session_id) REFERENCES sessions (id)
                    )
                ''')

                # Assessments table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS assessments (
                        id TEXT PRIMARY KEY,
                        session_id TEXT,
                        assessment_type TEXT,
                        score REAL,
                        category TEXT,
                        recommendations TEXT,
                        timestamp TIMESTAMP,
                        FOREIGN KEY (session_id) REFERENCES sessions (id)
                    )
                ''')

                # Chat history table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS chat_history (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_id TEXT,
                        role TEXT,
                        content TEXT,
                        timestamp TIMESTAMP,
                        sources TEXT,
                        rag_enabled BOOLEAN,
                        metadata TEXT,
                        FOREIGN KEY (session_id) REFERENCES sessions (id)
                    )
                ''')

                # Create indexes for better performance
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_id ON sessions (id)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_documents_session_id ON documents (session_id)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_emotions_session_id ON emotions (session_id)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_assessments_session_id ON assessments (session_id)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history (session_id)')

                conn.commit()
                logger.info("✅ Database initialized successfully")

        except Exception as e:
            logger.error(f"❌ Failed to initialize database: {str(e)}")
            raise

    def save_session(self, session_data: Dict[str, Any]) -> bool:
        """
        Save or update a session

        Args:
            session_data: Session data dictionary

        Returns:
            True if successful, False otherwise
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                # Update timestamp
                session_data['updated_at'] = datetime.now().isoformat()

                # Convert complex data to JSON
                session_json = json.dumps({
                    'chat_history': session_data.get('chat_history', []),
                    'documents': session_data.get('documents', []),
                    'emotions': session_data.get('emotions', []),
                    'assessments': session_data.get('assessments', [])
                })

                # Insert or replace session
                cursor.execute('''
                    INSERT OR REPLACE INTO sessions
                    (id, created_at, updated_at, data, chat_history_count, documents_count, emotions_count, assessments_count)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    session_data['id'],
                    session_data.get('created_at', datetime.now().isoformat()),
                    session_data['updated_at'],
                    session_json,
                    len(session_data.get('chat_history', [])),
                    len(session_data.get('documents', [])),
                    len(session_data.get('emotions', [])),
                    len(session_data.get('assessments', []))
                ))

                # Save individual components for better querying

                # Save documents
                if 'documents' in session_data:
                    cursor.execute('DELETE FROM documents WHERE session_id = ?', (session_data['id'],))
                    for doc in session_data['documents']:
                        cursor.execute('''
                            INSERT INTO documents (id, session_id, filename, upload_date, pages, chunks, metadata)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            doc['id'],
                            session_data['id'],
                            doc['filename'],
                            doc.get('upload_date'),
                            doc.get('pages', 0),
                            doc.get('chunks', 0),
                            json.dumps(doc.get('metadata', {}))
                        ))

                # Save emotions
                if 'emotions' in session_data:
                    cursor.execute('DELETE FROM emotions WHERE session_id = ?', (session_data['id'],))
                    for emotion in session_data['emotions']:
                        cursor.execute('''
                            INSERT INTO emotions (session_id, emotion, confidence, emotion_type, timestamp)
                            VALUES (?, ?, ?, ?, ?)
                        ''', (
                            session_data['id'],
                            emotion.get('emotion'),
                            emotion.get('confidence', 0.0),
                            emotion.get('type', 'text'),
                            emotion.get('timestamp')
                        ))

                # Save assessments
                if 'assessments' in session_data:
                    cursor.execute('DELETE FROM assessments WHERE session_id = ?', (session_data['id'],))
                    for assessment in session_data['assessments']:
                        cursor.execute('''
                            INSERT INTO assessments (id, session_id, assessment_type, score, category, recommendations, timestamp)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            assessment['id'],
                            session_data['id'],
                            assessment.get('type', 'mental_health'),
                            assessment.get('score'),
                            assessment.get('category'),
                            json.dumps(assessment.get('recommendations', [])),
                            assessment.get('timestamp')
                        ))

                # Save chat history
                if 'chat_history' in session_data:
                    cursor.execute('DELETE FROM chat_history WHERE session_id = ?', (session_data['id'],))
                    for i, message in enumerate(session_data['chat_history']):
                        cursor.execute('''
                            INSERT INTO chat_history (session_id, role, content, timestamp, sources, rag_enabled, metadata)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            session_data['id'],
                            message.get('role'),
                            message.get('content'),
                            message.get('timestamp'),
                            json.dumps(message.get('sources', [])),
                            message.get('rag_enabled', False),
                            json.dumps(message.get('metadata', {}))
                        ))

                conn.commit()
                logger.debug(f"Session {session_data['id']} saved successfully")
                return True

        except Exception as e:
            logger.error(f"Failed to save session: {str(e)}")
            return False

    def load_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Load a session from database

        Args:
            session_id: Session ID

        Returns:
            Session data dictionary or None if not found
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                # Get session data
                cursor.execute('SELECT * FROM sessions WHERE id = ?', (session_id,))
                row = cursor.fetchone()

                if not row:
                    return None

                # Parse session data
                session_data = json.loads(row[3]) if row[3] else {}
                session_data.update({
                    'id': row[0],
                    'created_at': row[1],
                    'updated_at': row[2]
                })

                logger.debug(f"Session {session_id} loaded successfully")
                return session_data

        except Exception as e:
            logger.error(f"Failed to load session: {str(e)}")
            return None

    def get_session_list(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get list of sessions

        Args:
            limit: Maximum number of sessions to return

        Returns:
            List of session summaries
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                cursor.execute('''
                    SELECT id, created_at, updated_at, chat_history_count, documents_count, emotions_count, assessments_count
                    FROM sessions
                    ORDER BY updated_at DESC
                    LIMIT ?
                ''', (limit,))

                rows = cursor.fetchall()
                sessions = []

                for row in rows:
                    sessions.append({
                        'id': row[0],
                        'created_at': row[1],
                        'updated_at': row[2],
                        'chat_history_count': row[3],
                        'documents_count': row[4],
                        'emotions_count': row[5],
                        'assessments_count': row[6]
                    })

                return sessions

        except Exception as e:
            logger.error(f"Failed to get session list: {str(e)}")
            return []

    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session and all related data

        Args:
            session_id: Session ID

        Returns:
            True if successful, False otherwise
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                # Delete related data
                cursor.execute('DELETE FROM documents WHERE session_id = ?', (session_id,))
                cursor.execute('DELETE FROM emotions WHERE session_id = ?', (session_id,))
                cursor.execute('DELETE FROM assessments WHERE session_id = ?', (session_id,))
                cursor.execute('DELETE FROM chat_history WHERE session_id = ?', (session_id,))

                # Delete session
                cursor.execute('DELETE FROM sessions WHERE id = ?', (session_id,))

                conn.commit()
                logger.info(f"Session {session_id} deleted successfully")
                return True

        except Exception as e:
            logger.error(f"Failed to delete session: {str(e)}")
            return False

    def get_database_stats(self) -> Dict[str, Any]:
        """
        Get database statistics

        Returns:
            Database statistics dictionary
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                stats = {}

                # Count sessions
                cursor.execute('SELECT COUNT(*) FROM sessions')
                stats['total_sessions'] = cursor.fetchone()[0]

                # Count documents
                cursor.execute('SELECT COUNT(*) FROM documents')
                stats['total_documents'] = cursor.fetchone()[0]

                # Count emotions
                cursor.execute('SELECT COUNT(*) FROM emotions')
                stats['total_emotions'] = cursor.fetchone()[0]

                # Count assessments
                cursor.execute('SELECT COUNT(*) FROM assessments')
                stats['total_assessments'] = cursor.fetchone()[0]

                # Count chat messages
                cursor.execute('SELECT COUNT(*) FROM chat_history')
                stats['total_chat_messages'] = cursor.fetchone()[0]

                # Database size
                stats['database_size_mb'] = os.path.getsize(self.db_path) / (1024 * 1024)

                return stats

        except Exception as e:
            logger.error(f"Failed to get database stats: {str(e)}")
            return {}