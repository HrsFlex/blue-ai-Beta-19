// Simple Vector Store that automatically falls back to memory storage
const MemoryVectorStore = require('./memoryVectorStore');

class SimpleVectorStore {
  constructor(config) {
    this.config = config;
    this.memoryStore = new MemoryVectorStore();
    this.useChroma = config.USE_CHROMA;
    this.chromaClient = null;
    this.collection = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('🔧 Initializing Simple Vector Store...');

      if (this.useChroma) {
        try {
          console.log('🔗 Attempting to connect to ChromaDB...');
          const { ChromaClient } = require('chromadb');

          this.chromaClient = new ChromaClient({
            path: `http://${this.config.CHROMA_HOST}:${this.config.CHROMA_PORT}`
          });

          await this.chromaClient.heartbeat();
          console.log(`✅ ChromaDB connected`);

          // Try to get or create collection
          try {
            this.collection = await this.chromaClient.getCollection({
              name: this.config.VECTOR_COLLECTION_NAME
            });
            console.log(`✅ Using existing ChromaDB collection`);
          } catch (error) {
            if (error.message.includes('does not exist')) {
              this.collection = await this.chromaClient.createCollection({
                name: this.config.VECTOR_COLLECTION_NAME,
                metadata: {
                  description: 'Patient medical reports and documents',
                  created: new Date().toISOString()
                }
              });
              console.log(`✅ Created new ChromaDB collection`);
            } else {
              throw error;
            }
          }

          console.log('🎯 Using ChromaDB for vector storage');
          this.initialized = true;
          return;

        } catch (error) {
          console.warn('⚠️ ChromaDB not available, falling back to memory storage:', error.message);
          this.useChroma = false;
        }
      }

      // Use Memory Store
      console.log('🧠 Using In-Memory Vector Store');
      await this.memoryStore.initialize();
      this.initialized = true;
      console.log('✅ Simple Vector Store initialized with memory storage');

    } catch (error) {
      console.error('❌ Failed to initialize vector store:', error);
      throw new Error(`Vector store initialization failed: ${error.message}`);
    }
  }

  async addDocument(document) {
    if (!this.initialized) {
      throw new Error('Vector store not initialized');
    }

    if (this.useChroma && this.collection) {
      return await this._addDocumentToChroma(document);
    } else {
      return await this.memoryStore.addDocument(document);
    }
  }

  async search(query, userId, options = {}) {
    if (!this.initialized) {
      throw new Error('Vector store not initialized');
    }

    if (this.useChroma && this.collection) {
      return await this._searchChroma(query, userId, options);
    } else {
      return await this.memoryStore.search(query, userId, options);
    }
  }

  async getDocument(documentId, userId) {
    if (!this.initialized) {
      throw new Error('Vector store not initialized');
    }

    if (this.useChroma && this.collection) {
      return await this._getDocumentFromChroma(documentId, userId);
    } else {
      return await this.memoryStore.getDocument(documentId, userId);
    }
  }

  async deleteDocument(documentId, userId) {
    if (!this.initialized) {
      throw new Error('Vector store not initialized');
    }

    if (this.useChroma && this.collection) {
      return await this._deleteDocumentFromChroma(documentId, userId);
    } else {
      return await this.memoryStore.deleteDocument(documentId, userId);
    }
  }

  async listDocuments(userId) {
    if (!this.initialized) {
      throw new Error('Vector store not initialized');
    }

    if (this.useChroma && this.collection) {
      return await this._listDocumentsFromChroma(userId);
    } else {
      return await this.memoryStore.listDocuments(userId);
    }
  }

  async getStats() {
    if (!this.initialized) {
      throw new Error('Vector store not initialized');
    }

    if (this.useChroma && this.collection) {
      return await this._getStatsFromChroma();
    } else {
      return await this.memoryStore.getStats();
    }
  }

  isInitialized() {
    return this.initialized;
  }

  // ChromaDB-specific methods
  async _addDocumentToChroma(document) {
    const ids = [];
    const documents = [];
    const metadatas = [];

    document.chunks.forEach((chunk, index) => {
      const chunkId = `${document.id}_chunk_${index}`;
      ids.push(chunkId);
      documents.push(chunk.text);
      metadatas.push({
        documentId: document.id,
        userId: document.userId,
        filename: document.filename,
        chunkIndex: index,
        textPreview: chunk.text.substring(0, 200) + '...',
        ...document.metadata
      });
    });

    await this.collection.add({
      ids,
      documents,
      metadatas
    });

    console.log(`✅ Added document to ChromaDB: ${document.filename}`);
    return document.id;
  }

  async _searchChroma(query, userId, options = {}) {
    const { maxResults = 5 } = options;

    const results = await this.collection.query({
      queryTexts: [query],
      where: { userId },
      nResults: maxResults
    });

    return results.documents[0].map((doc, index) => ({
      content: doc,
      metadata: results.metadatas[0][index],
      score: results.distances[0][index] || 0
    }));
  }

  async _getDocumentFromChroma(documentId, userId) {
    // ChromaDB doesn't have direct document retrieval, so we search for chunks
    const results = await this.collection.get({
      where: { documentId, userId }
    });

    if (results.ids.length === 0) {
      return null;
    }

    // Reconstruct document from chunks
    const chunks = results.documents.map((text, index) => ({
      text,
      index: results.metadatas[index].chunkIndex
    })).sort((a, b) => a.index - b.index);

    return {
      id: documentId,
      userId: results.metadatas[0].userId,
      filename: results.metadatas[0].filename,
      chunks,
      metadata: results.metadatas[0]
    };
  }

  async _deleteDocumentFromChroma(documentId, userId) {
    await this.collection.delete({
      where: { documentId, userId }
    });
    return true;
  }

  async _listDocumentsFromChroma(userId) {
    const results = await this.collection.get({
      where: { userId }
    });

    // Group chunks by documentId
    const documents = {};
    results.metadatas.forEach((meta, index) => {
      const docId = meta.documentId;
      if (!documents[docId]) {
        documents[docId] = {
          id: docId,
          filename: meta.filename,
          metadata: meta,
          chunksCount: 0
        };
      }
      documents[docId].chunksCount++;
    });

    return Object.values(documents);
  }

  async _getStatsFromChroma() {
    const results = await this.collection.get();
    const documentsByUser = {};

    results.metadatas.forEach(meta => {
      const userId = meta.userId;
      documentsByUser[userId] = (documentsByUser[userId] || 0) + 1;
    });

    return {
      totalDocuments: Object.keys(documentsByUser).length,
      totalChunks: results.ids.length,
      documentsByUser,
      initialized: this.initialized
    };
  }
}

module.exports = SimpleVectorStore;