// This is a compatibility layer to replace Firebase with SQLite

class LocalDatabase {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    // Import and initialize the actual database
    const { getDatabase } = require('./Database');
    this.db = getDatabase();
    this.initialized = true;
    return this.db;
  }

  // Firebase-like API for compatibility
  collection(name) {
    return new Collection(this.db, name);
  }

  // Firestore-like methods
  async doc(path) {
    return new Document(this.db, path);
  }
}

class Collection {
  constructor(database, name) {
    this.db = database;
    this.name = name;
  }

  async add(data) {
    // Convert collection name to appropriate table
    const tableName = this.getTableName();

    if (tableName === 'users') {
      return this.db.createUser(data);
    } else if (tableName === 'conversations') {
      return this.db.createConversation(data.user_id, data.session_id, data.title, data.metadata);
    } else if (tableName === 'messages') {
      return this.db.createMessage(data.conversation_id, data.user_id, data.role, data.message, data.message_type, data.metadata);
    } else if (tableName === 'documents') {
      return this.db.createDocument(data.user_id, data);
    } else if (tableName === 'mood_entries') {
      return this.db.createMoodEntry(data.user_id, data);
    }

    throw new Error(`Unsupported collection: ${name}`);
  }

  where(field, operator, value) {
    return new Query(this.db, this.name, field, operator, value);
  }

  getTableName() {
    const collectionMap = {
      'users': 'users',
      'conversations': 'conversations',
      'messages': 'messages',
      'documents': 'user_documents',
      'mood': 'mood_entries',
      'sessions': 'user_sessions'
    };
    return collectionMap[this.name] || this.name;
  }
}

class Query {
  constructor(database, collection, field, operator, value) {
    this.db = database;
    this.collection = collection;
    this.field = field;
    this.operator = operator;
    this.value = value;
  }

  async get() {
    const tableName = this.getTableName();

    try {
      if (tableName === 'users' && this.field === 'email' && this.operator === '==') {
        const user = this.db.getUserByEmail(this.value);
        return {
          docs: user ? [this.convertToFirestoreDoc(user, user.id)] : [],
          empty: !user
        };
      } else if (tableName === 'users' && this.field === 'firebase_uid' && this.operator === '==') {
        const user = this.db.getUserByFirebaseUid(this.value);
        return {
          docs: user ? [this.convertToFirestoreDoc(user, user.id)] : [],
          empty: !user
        };
      } else if (tableName === 'conversations' && this.field === 'user_id' && this.operator === '==') {
        const conversations = this.db.getConversationsByUserId(this.value, 50);
        return {
          docs: conversations.map(conv => this.convertToFirestoreDoc(conv, conv.id)),
          empty: conversations.length === 0
        };
      }
    } catch (error) {
      console.error('Query error:', error);
      return { docs: [], empty: true };
    }

    return { docs: [], empty: true };
  }

  getTableName() {
    const collectionMap = {
      'users': 'users',
      'conversations': 'conversations',
      'messages': 'messages',
      'documents': 'user_documents',
      'mood': 'mood_entries',
      'sessions': 'user_sessions'
    };
    return collectionMap[this.collection] || this.collection;
  }

  convertToFirestoreDoc(data, id) {
    return {
      id: id,
      data: () => data,
      exists: true
    };
  }
}

class Document {
  constructor(database, path) {
    this.db = database;
    this.path = path;
  }

  async get() {
    // Extract table and ID from path
    const parts = this.path.split('/');
    if (parts.length !== 2) {
      throw new Error('Invalid document path');
    }

    const [collection, id] = parts;
    const tableName = this.getTableName(collection);

    try {
      if (tableName === 'users') {
        const user = this.db.getUserById(id);
        if (user) {
          return this.convertToFirestoreDoc(user, id);
        }
      } else if (tableName === 'conversations') {
        const conversation = this.db.getConversationById(id);
        if (conversation) {
          return this.convertToFirestoreDoc(conversation, id);
        }
      }
    } catch (error) {
      console.error('Document get error:', error);
    }

    return { exists: false };
  }

  async set(data) {
    const parts = this.path.split('/');
    if (parts.length !== 2) {
      throw new Error('Invalid document path');
    }

    const [collection, id] = parts;
    const tableName = this.getTableName(collection);

    try {
      if (tableName === 'users') {
        return this.db.updateUser(id, data);
      }
    } catch (error) {
      console.error('Document set error:', error);
      throw error;
    }
  }

  getTableName(collection) {
    const collectionMap = {
      'users': 'users',
      'conversations': 'conversations',
      'messages': 'messages',
      'documents': 'user_documents',
      'mood': 'mood_entries',
      'sessions': 'user_sessions'
    };
    return collectionMap[collection] || collection;
  }

  convertToFirestoreDoc(data, id) {
    return {
      id: id,
      data: () => data,
      exists: true
    };
  }
}

// Export Firebase-like interface
const db = new LocalDatabase();

export { db };
export const firestore = db;

// For compatibility with existing Firebase imports
export default {
  db,
  firestore,
  initializeApp: () => ({
    firestore: () => firestore
  })
};