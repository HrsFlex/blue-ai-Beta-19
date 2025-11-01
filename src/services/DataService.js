import { getDatabase } from '../database/Database';

class DataService {
  constructor() {
    this.db = null;
    this.currentUserId = null;
    this.currentSessionId = null;
    this.currentConversationId = null;
    this.initialized = false;
  }

  /**
   * Initialize the data service
   */
  async initialize() {
    try {
      this.db = getDatabase();

      // Try to restore session from localStorage
      this.restoreSession();

      this.initialized = true;
      console.log('✅ DataService initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize DataService:', error);
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * User Management
   */
  async createUser(userData) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const user = this.db.createUser(userData);
      this.currentUserId = user.id;
      this.createSession(); // Create session for new user
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getUserByEmail(email);
  }

  async getCurrentUser() {
    if (!this.db || !this.currentUserId) return null;
    return this.db.getUserById(this.currentUserId);
  }

  async updateUser(userData) {
    if (!this.db || !this.currentUserId) throw new Error('No user session');

    try {
      const result = this.db.updateUser(this.currentUserId, userData);
      return result;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Session Management
   */
  createSession(deviceInfo = {}) {
    if (!this.db || !this.currentUserId) throw new Error('No user to create session for');

    try {
      // Generate unique session ID
      const sessionId = this.generateSessionId();

      // Set expiry to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      this.db.createSession(
        this.currentUserId,
        sessionId,
        deviceInfo,
        null, // IP address (can be added later)
        null, // Location (can be added later)
        expiresAt.toISOString()
      );

      this.currentSessionId = sessionId;
      this.saveSession();

      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async validateSession(sessionId) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const session = this.db.getSession(sessionId);
      if (session) {
        this.currentUserId = session.user_id;
        this.currentSessionId = sessionId;
        this.saveSession();
        return session;
      }
      return null;
    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  clearSession() {
    this.currentUserId = null;
    this.currentSessionId = null;
    this.currentConversationId = null;
    localStorage.removeItem('sakhi_session');
  }

  /**
   * Conversation Management
   */
  async createConversation(title = null) {
    if (!this.db || !this.currentUserId || !this.currentSessionId) {
      throw new Error('No active session');
    }

    try {
      const conversation = this.db.createConversation(
        this.currentUserId,
        this.currentSessionId,
        title || `Conversation ${new Date().toLocaleString()}`
      );

      this.currentConversationId = conversation.id;
      this.saveSession();

      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async getConversations(limit = 20) {
    if (!this.db || !this.currentUserId) return [];

    try {
      return this.db.getConversationsByUserId(this.currentUserId, limit);
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  }

  async getCurrentConversation() {
    if (!this.db || !this.currentConversationId) return null;

    try {
      return this.db.getConversationById(this.currentConversationId);
    } catch (error) {
      console.error('Error getting current conversation:', error);
      return null;
    }
  }

  async setCurrentConversation(conversationId) {
    if (!this.db || !this.currentUserId) return false;

    try {
      const conversation = this.db.getConversationById(conversationId);
      if (conversation && conversation.user_id === this.currentUserId) {
        this.currentConversationId = conversationId;
        this.saveSession();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting current conversation:', error);
      return false;
    }
  }

  /**
   * Message Management
   */
  async saveMessage(role, message, messageType = 'text', metadata = {}) {
    if (!this.db || !this.currentUserId || !this.currentConversationId) {
      throw new Error('No active conversation');
    }

    try {
      // Ensure conversation exists
      const conversation = await this.getCurrentConversation();
      if (!conversation) {
        throw new Error('Current conversation not found');
      }

      const messageId = this.db.createMessage(
        this.currentConversationId,
        this.currentUserId,
        role,
        message,
        messageType,
        metadata
      );

      return messageId;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async getMessages(conversationId = null, limit = 100) {
    if (!this.db || !this.currentUserId) return [];

    try {
      const targetConversationId = conversationId || this.currentConversationId;
      if (!targetConversationId) return [];

      return this.db.getMessages(targetConversationId, limit);
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async saveChatHistory(messages, conversationId = null) {
    if (!this.db || !this.currentUserId) return false;

    try {
      const targetConversationId = conversationId || this.currentConversationId;
      if (!targetConversationId) {
        // Create new conversation if none exists
        const newConversation = await this.createConversation();
        targetConversationId = newConversation.id;
      }

      const transaction = this.db.db.transaction(() => {
        messages.forEach(msg => {
          this.db.createMessage(
            targetConversationId,
            this.currentUserId,
            msg.role,
            msg.message,
            msg.messageType || 'text',
            msg.metadata || {}
          );
        });
      });

      transaction();
      return true;
    } catch (error) {
      console.error('Error saving chat history:', error);
      return false;
    }
  }

  /**
   * Document Management (for RAG system)
   */
  async saveDocument(documentData) {
    if (!this.db || !this.currentUserId) throw new Error('No active session');

    try {
      const result = this.db.createDocument(this.currentUserId, documentData);
      return result;
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  }

  async getDocuments(limit = 50) {
    if (!this.db || !this.currentUserId) return [];

    try {
      return this.db.getUserDocuments(this.currentUserId, limit);
    } catch (error) {
      console.error('Error getting documents:', error);
      return [];
    }
  }

  async updateDocumentStatus(documentId, status, error = null) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      return this.db.updateDocumentStatus(documentId, status, error);
    } catch (error) {
      console.error('Error updating document status:', error);
      throw error;
    }
  }

  /**
   * Mood Tracking
   */
  async saveMoodEntry(moodData) {
    if (!this.db || !this.currentUserId) throw new Error('No active session');

    try {
      return this.db.createMoodEntry(this.currentUserId, moodData);
    } catch (error) {
      console.error('Error saving mood entry:', error);
      throw error;
    }
  }

  async getMoodEntries(limit = 30) {
    if (!this.db || !this.currentUserId) return [];

    try {
      return this.db.getMoodEntries(this.currentUserId, limit);
    } catch (error) {
      console.error('Error getting mood entries:', error);
      return [];
    }
  }

  /**
   * Settings and Preferences
   */
  async getSystemSetting(key) {
    if (!this.db) return null;

    try {
      const result = this.db.getSystemSetting(key);
      return result ? result.value : null;
    } catch (error) {
      console.error('Error getting system setting:', error);
      return null;
    }
  }

  async setSystemSetting(key, value, description = null) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      return this.db.setSystemSetting(key, value, description);
    } catch (error) {
      console.error('Error setting system setting:', error);
      throw error;
    }
  }

  /**
   * Utility Methods
   */
  generateSessionId() {
    return `SAKHI_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  saveSession() {
    const sessionData = {
      userId: this.currentUserId,
      sessionId: this.currentSessionId,
      conversationId: this.currentConversationId,
      timestamp: Date.now()
    };
    localStorage.setItem('sakhi_session', JSON.stringify(sessionData));
  }

  restoreSession() {
    try {
      const sessionData = localStorage.getItem('sakhi_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);

        // Check if session is not too old (7 days)
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        if (Date.now() - session.timestamp < maxAge) {
          this.validateSession(session.sessionId);
        } else {
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      this.clearSession();
    }
  }

  /**
   * Analytics and Statistics
   */
  async getUserStats() {
    if (!this.db || !this.currentUserId) return null;

    try {
      const stats = {
        totalConversations: this.db.db.prepare('SELECT COUNT(*) as count FROM conversations WHERE user_id = ?').get(this.currentUserId).count,
        totalMessages: this.db.db.prepare('SELECT COUNT(*) as count FROM messages WHERE user_id = ?').get(this.currentUserId).count,
        totalDocuments: this.db.db.prepare('SELECT COUNT(*) as count FROM user_documents WHERE user_id = ?').get(this.currentUserId).count,
        totalMoodEntries: this.db.db.prepare('SELECT COUNT(*) as count FROM mood_entries WHERE user_id = ?').get(this.currentUserId).count,
        lastActivity: this.db.db.prepare('SELECT MAX(last_activity) as last_active FROM user_sessions WHERE user_id = ?').get(this.currentUserId).last_active
      };

      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  async getDatabaseStats() {
    if (!this.db) return null;

    try {
      return this.db.getDatabaseStats();
    } catch (error) {
      console.error('Error getting database stats:', error);
      return null;
    }
  }

  /**
   * Data Export and Backup
   */
  async exportUserData() {
    if (!this.db || !this.currentUserId) return null;

    try {
      const userData = await this.getCurrentUser();
      const conversations = await this.getConversations(100);
      const documents = await this.getDocuments(100);
      const moodEntries = await this.getMoodEntries(100);

      // Get messages for each conversation
      const conversationsWithMessages = await Promise.all(
        conversations.map(async (conv) => {
          const messages = await this.getMessages(conv.id, 1000);
          return { ...conv, messages };
        })
      );

      return {
        user: userData,
        conversations: conversationsWithMessages,
        documents,
        moodEntries,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      return null;
    }
  }

  /**
   * Cleanup and Maintenance
   */
  async cleanupOldData(daysOld = 30) {
    if (!this.db) return false;

    try {
      const result = this.db.cleanupOldSessions(daysOld);
      console.log(`Cleaned up ${result.changes} old sessions`);
      return true;
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      return false;
    }
  }
}

// Create singleton instance
const dataService = new DataService();

export default dataService;