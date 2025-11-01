const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class SakhiDatabase {
  constructor(dbPath = null) {
    this.dbPath = dbPath || path.join(process.cwd(), 'data', 'sakhi.db');
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize database connection and create tables
   */
  initialize() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Create database connection
      this.db = new Database(this.dbPath);

      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      // Create tables
      this.createTables();

      // Prepare statements
      this.prepareStatements();

      this.initialized = true;
      console.log('✅ SQLite database initialized successfully');
      console.log(`📁 Database path: ${this.dbPath}`);

    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  createTables() {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        phone TEXT,
        address TEXT,
        age INTEGER,
        height REAL,
        weight REAL,
        gender TEXT CHECK(gender IN ('male', 'female', 'other')),
        medical_condition TEXT,
        medical_history TEXT,
        emergency_contact_1 TEXT,
        emergency_contact_2 TEXT,
        profile_image TEXT,
        preferences TEXT, -- JSON string for user preferences
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_id TEXT UNIQUE NOT NULL,
        device_info TEXT, -- JSON string for device/browser info
        ip_address TEXT,
        location TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Chat conversations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_id TEXT NOT NULL,
        title TEXT,
        is_active BOOLEAN DEFAULT 1,
        metadata TEXT, -- JSON string for additional conversation metadata
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Chat messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT CHECK(role IN ('user', 'assistant', 'system')) NOT NULL,
        message TEXT NOT NULL,
        message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'image', 'audio', 'file')),
        metadata TEXT, -- JSON string for additional message data (sources, rag_context, etc.)
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // User documents table (for RAG system)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        document_id TEXT UNIQUE NOT NULL, -- RAG engine document ID
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT,
        file_size INTEGER,
        file_type TEXT,
        document_type TEXT, -- 'blood_test', 'xray', 'prescription', etc.
        metadata TEXT, -- JSON string for extracted medical data
        processing_status TEXT DEFAULT 'pending' CHECK(processing_status IN ('pending', 'processing', 'completed', 'failed')),
        processing_error TEXT,
        chunks_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // User health metrics table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS health_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        metric_type TEXT NOT NULL, -- 'mood', 'anxiety', 'sleep', 'stress', etc.
        value REAL NOT NULL,
        unit TEXT,
        notes TEXT,
        source TEXT, -- 'self_report', 'assessment', 'ai_analysis'
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // User mood tracking table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mood_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        mood_score INTEGER CHECK(mood_score >= 1 AND mood_score <= 10),
        mood_label TEXT, -- 'happy', 'sad', 'anxious', 'calm', etc.
        emotions TEXT, -- JSON array of detected emotions
        context TEXT, -- What was happening when mood was recorded
        ai_analysis TEXT, -- AI-generated insights
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // System settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    this.createIndexes();

    // Insert default system settings
    this.insertDefaultSettings();
  }

  /**
   * Create database indexes
   */
  createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON user_sessions(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_documents_user_id ON user_documents(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_documents_document_id ON user_documents(document_id)',
      'CREATE INDEX IF NOT EXISTS idx_documents_status ON user_documents(processing_status)',
      'CREATE INDEX IF NOT EXISTS idx_health_metrics_user_id ON health_metrics(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_health_metrics_recorded_at ON health_metrics(recorded_at)',
      'CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at ON mood_entries(created_at)'
    ];

    indexes.forEach(sql => this.db.exec(sql));
  }

  /**
   * Insert default system settings
   */
  insertDefaultSettings() {
    const settings = [
      ['app_version', '1.0.0', 'Current application version'],
      ['database_version', '1.0.0', 'Database schema version'],
      ['rag_enabled', 'true', 'RAG system enabled status'],
      ['voice_chat_enabled', 'true', 'Voice chat feature enabled'],
      ['max_file_size', '10485760', 'Maximum file upload size in bytes (10MB)'],
      ['default_language', 'en', 'Default language for responses'],
      ['auto_cleanup_days', '30', 'Days to keep old session data']
    ];

    const insertSetting = this.db.prepare(`
      INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      settings.forEach(([key, value, description]) => {
        insertSetting.run(key, value, description);
      });
    });

    transaction();
  }

  /**
   * Prepare frequently used statements
   */
  prepareStatements() {
    // User statements
    this.statements = {
      createUser: this.db.prepare(`
        INSERT INTO users (firebase_uid, email, name, phone, address, age, height, weight, gender, medical_condition, medical_history, emergency_contact_1, emergency_contact_2, profile_image, preferences)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),

      getUserByEmail: this.db.prepare(`
        SELECT * FROM users WHERE email = ?
      `),

      getUserByFirebaseUid: this.db.prepare(`
        SELECT * FROM users WHERE firebase_uid = ?
      `),

      updateUser: this.db.prepare(`
        UPDATE users SET name = ?, phone = ?, address = ?, age = ?, height = ?, weight = ?, gender = ?, medical_condition = ?, medical_history = ?, emergency_contact_1 = ?, emergency_contact_2 = ?, profile_image = ?, preferences = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),

      createSession: this.db.prepare(`
        INSERT INTO user_sessions (user_id, session_id, device_info, ip_address, location, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `),

      getSession: this.db.prepare(`
        SELECT us.*, u.name, u.email FROM user_sessions us
        JOIN users u ON us.user_id = u.id
        WHERE us.session_id = ? AND us.is_active = 1 AND (us.expires_at IS NULL OR us.expires_at > CURRENT_TIMESTAMP)
      `),

      updateSessionActivity: this.db.prepare(`
        UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = ?
      `),

      createConversation: this.db.prepare(`
        INSERT INTO conversations (user_id, session_id, title, metadata)
        VALUES (?, ?, ?, ?)
      `),

      getConversation: this.db.prepare(`
        SELECT * FROM conversations WHERE id = ? AND user_id = ?
      `),

      createMessage: this.db.prepare(`
        INSERT INTO messages (conversation_id, user_id, role, message, message_type, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `),

      getMessages: this.db.prepare(`
        SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC
      `),

      createDocument: this.db.prepare(`
        INSERT INTO user_documents (user_id, document_id, filename, original_name, file_path, file_size, file_type, document_type, metadata, processing_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),

      getUserDocuments: this.db.prepare(`
        SELECT * FROM user_documents WHERE user_id = ? ORDER BY created_at DESC
      `),

      createMoodEntry: this.db.prepare(`
        INSERT INTO mood_entries (user_id, mood_score, mood_label, emotions, context, ai_analysis)
        VALUES (?, ?, ?, ?, ?, ?)
      `),

      getMoodEntries: this.db.prepare(`
        SELECT * FROM mood_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
      `)
    };
  }

  // User Management Methods
  createUser(userData) {
    const result = this.statements.createUser.run(
      userData.firebase_uid,
      userData.email,
      userData.name,
      userData.phone,
      userData.address,
      userData.age,
      userData.height,
      userData.weight,
      userData.gender,
      userData.medical_condition,
      userData.medical_history,
      userData.emergency_contact_1,
      userData.emergency_contact_2,
      userData.profile_image,
      JSON.stringify(userData.preferences || {})
    );

    return this.getUserById(result.lastInsertRowid);
  }

  getUserByEmail(email) {
    return this.statements.getUserByEmail.get(email);
  }

  getUserByFirebaseUid(firebaseUid) {
    return this.statements.getUserByFirebaseUid.get(firebaseUid);
  }

  getUserById(id) {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  updateUser(id, userData) {
    return this.statements.updateUser.run(
      userData.name,
      userData.phone,
      userData.address,
      userData.age,
      userData.height,
      userData.weight,
      userData.gender,
      userData.medical_condition,
      userData.medical_history,
      userData.emergency_contact_1,
      userData.emergency_contact_2,
      userData.profile_image,
      JSON.stringify(userData.preferences || {}),
      id
    );
  }

  // Session Management Methods
  createSession(userId, sessionId, deviceInfo = {}, ipAddress = null, location = null, expiresAt = null) {
    return this.statements.createSession.run(
      userId,
      sessionId,
      JSON.stringify(deviceInfo),
      ipAddress,
      location,
      expiresAt
    );
  }

  getSession(sessionId) {
    const session = this.statements.getSession.get(sessionId);
    if (session) {
      // Update last activity
      this.statements.updateSessionActivity.run(sessionId);
    }
    return session;
  }

  // Conversation Methods
  createConversation(userId, sessionId, title = null, metadata = {}) {
    const result = this.statements.createConversation.run(
      userId,
      sessionId,
      title,
      JSON.stringify(metadata)
    );
    return this.getConversationById(result.lastInsertRowid);
  }

  getConversationById(id) {
    return this.db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
  }

  getConversationsByUserId(userId, limit = 50) {
    return this.db.prepare(`
      SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?
    `).all(userId, limit);
  }

  // Message Methods
  createMessage(conversationId, userId, role, message, messageType = 'text', metadata = {}) {
    return this.statements.createMessage.run(
      conversationId,
      userId,
      role,
      message,
      messageType,
      JSON.stringify(metadata)
    );
  }

  getMessages(conversationId, limit = 100) {
    return this.db.prepare(`
      SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC LIMIT ?
    `).all(conversationId, limit);
  }

  // Document Methods
  createDocument(userId, documentData) {
    return this.statements.createDocument.run(
      userId,
      documentData.document_id,
      documentData.filename,
      documentData.original_name,
      documentData.file_path,
      documentData.file_size,
      documentData.file_type,
      documentData.document_type,
      JSON.stringify(documentData.metadata || {}),
      documentData.processing_status || 'pending'
    );
  }

  getUserDocuments(userId, limit = 50) {
    return this.statements.getUserDocuments.all(userId, limit);
  }

  updateDocumentStatus(documentId, status, error = null) {
    return this.db.prepare(`
      UPDATE user_documents SET processing_status = ?, processing_error = ?, updated_at = CURRENT_TIMESTAMP
      WHERE document_id = ?
    `).run(status, error, documentId);
  }

  // Mood Tracking Methods
  createMoodEntry(userId, moodData) {
    return this.statements.createMoodEntry.run(
      userId,
      moodData.mood_score,
      moodData.mood_label,
      JSON.stringify(moodData.emotions || []),
      moodData.context,
      moodData.ai_analysis
    );
  }

  getMoodEntries(userId, limit = 30) {
    return this.statements.getMoodEntries.all(userId, limit);
  }

  // Utility Methods
  getSystemSetting(key) {
    return this.db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key);
  }

  setSystemSetting(key, value, description = null) {
    return this.db.prepare(`
      INSERT OR REPLACE INTO system_settings (key, value, description, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(key, value, description);
  }

  // Health and maintenance
  cleanupOldSessions(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.db.prepare(`
      DELETE FROM user_sessions WHERE last_activity < ? OR (expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP)
    `).run(cutoffDate.toISOString());
  }

  getDatabaseStats() {
    const stats = {
      users: this.db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      sessions: this.db.prepare('SELECT COUNT(*) as count FROM user_sessions WHERE is_active = 1').get().count,
      conversations: this.db.prepare('SELECT COUNT(*) as count FROM conversations').get().count,
      messages: this.db.prepare('SELECT COUNT(*) as count FROM messages').get().count,
      documents: this.db.prepare('SELECT COUNT(*) as count FROM user_documents').get().count,
      moodEntries: this.db.prepare('SELECT COUNT(*) as count FROM mood_entries').get().count,
      databaseSize: this.getDatabaseSize()
    };

    return stats;
  }

  getDatabaseSize() {
    try {
      const stats = fs.statSync(this.dbPath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      this.initialized = false;
      console.log('Database connection closed');
    }
  }

  // Backup and restore methods
  backup(backupPath) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    return this.db.backup(backupPath);
  }

  vacuum() {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    return this.db.exec('VACUUM');
  }
}

// Singleton instance
let databaseInstance = null;

function getDatabase(dbPath = null) {
  if (!databaseInstance) {
    databaseInstance = new SakhiDatabase(dbPath);
    databaseInstance.initialize();
  }
  return databaseInstance;
}

module.exports = {
  SakhiDatabase,
  getDatabase
};