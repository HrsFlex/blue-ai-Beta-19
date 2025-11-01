// Browser-compatible Firebase mock for Sakhi Application
// Uses localStorage for data persistence in the browser

class MockFirestore {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      const stored = localStorage.getItem('sakhi_firestore_data');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      return {};
    }
  }

  saveData() {
    try {
      localStorage.setItem('sakhi_firestore_data', JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }

  collection(name) {
    return new MockCollection(this, name);
  }
}

class MockCollection {
  constructor(db, name) {
    this.db = db;
    this.name = name;
  }

  where(field, operator, value) {
    return new MockQuery(this.db, this.name, field, operator, value);
  }

  add(data) {
    const id = this.generateId();
    this.db.data[this.name] = this.db.data[this.name] || {};
    this.db.data[this.name][id] = { ...data, id };
    this.db.saveData();
    return Promise.resolve({ id });
  }

  doc(id) {
    return new MockDocument(this.db, this.name, id);
  }

  get() {
    const docs = Object.entries(this.db.data[this.name] || {}).map(([id, data]) => ({
      id,
      data: () => data,
      exists: true
    }));
    return Promise.resolve({ docs });
  }

  generateId() {
    return 'doc_' + Math.random().toString(36).substr(2, 9);
  }
}

class MockQuery {
  constructor(db, collection, field, operator, value) {
    this.db = db;
    this.collection = collection;
    this.field = field;
    this.operator = operator;
    this.value = value;
  }

  async get() {
    const allData = this.db.data[this.collection] || {};
    const filtered = Object.entries(allData).filter(([id, doc]) => {
      if (this.operator === '==') {
        return doc[this.field] === this.value;
      }
      return true;
    });

    const docs = filtered.map(([id, data]) => ({
      id,
      data: () => data,
      exists: true
    }));

    return { docs };
  }

  limit(count) {
    return this;
  }
}

class MockDocument {
  constructor(db, collection, id) {
    this.db = db;
    this.collection = collection;
    this.id = id;
  }

  get() {
    const data = this.db.data[this.collection]?.[this.id];
    return Promise.resolve({
      id: this.id,
      data: () => data || {},
      exists: !!data
    });
  }

  set(data) {
    this.db.data[this.collection] = this.db.data[this.collection] || {};
    this.db.data[this.collection][this.id] = { ...data, id: this.id };
    this.db.saveData();
    return Promise.resolve();
  }

  update(data) {
    this.db.data[this.collection] = this.db.data[this.collection] || {};
    this.db.data[this.collection][this.id] = {
      ...this.db.data[this.collection][this.id],
      ...data,
      id: this.id
    };
    this.db.saveData();
    return Promise.resolve();
  }
}

// Create instances
const firestore = new MockFirestore();
const db = firestore;

// Mock Firebase app initialization for compatibility
export const app = {
  firestore: () => firestore
};

// Export a mock initializeApp function
export const initializeApp = () => app;

// Export the database instances
export { firestore, db };
