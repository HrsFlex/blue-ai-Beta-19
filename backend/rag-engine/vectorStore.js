const { ChromaClient } = require('chromadb');
const MemoryVectorStore = require('./memoryVectorStore');
const _ = require('lodash');

class VectorStore {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.collection = null;
    this.collectionName = config.VECTOR_COLLECTION_NAME;
    this.initialized = false;
    this.memoryStore = null;
  }

  /**
   * Initialize vector store (ChromaDB or In-Memory)
   */
  async initialize() {
    try {
      if (this.config.USE_CHROMA) {
        console.log('🔧 Initializing ChromaDB vector store...');

        // Create ChromaDB client
        this.client = new ChromaClient({
          path: `http://${this.config.CHROMA_HOST}:${this.config.CHROMA_PORT}`
        });

        // Test connection
        await this.client.heartbeat();
        console.log(`✅ ChromaDB connected at ${this.config.CHROMA_HOST}:${this.config.CHROMA_PORT}`);

      // Get or create collection
      try {
        this.collection = await this.client.getCollection({ name: this.collectionName });
        console.log(`✅ Using existing collection: ${this.collectionName}`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          this.collection = await this.client.createCollection({
            name: this.collectionName,
            metadata: {
              description: 'Patient medical reports and documents',
              created: new Date().toISOString(),
              version: '1.0.0'
            }
          });
          console.log(`✅ Created new collection: ${this.collectionName}`);
        } else {
          throw error;
        }
      }

      this.initialized = true;
      console.log(`🎯 Vector store initialized successfully`);
      console.log(`   - Collection: ${this.collectionName}`);
      console.log(`   - Document count: ${await this.getDocumentCount()}`);

    } catch (error) {
      console.error('❌ Failed to initialize vector store:', error);
      throw new Error(`Vector store initialization failed: ${error.message}`);
    }
  }

  /**
   * Check if vector store is initialized
   * @returns {boolean} Initialization status
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Add document chunks to vector store
   * @param {Object} document - Processed document with chunks
   * @returns {Promise<Array>} Array of chunk IDs
   */
  async addDocument(document) {
    if (!this.initialized) {
      throw new Error('Vector store not initialized');
    }

    try {
      console.log(`📄 Adding document to vector store: ${document.filename}`);
      console.log(`   - Chunks to add: ${document.chunks.length}`);

      const chunkIds = [];

      // Prepare data for ChromaDB
      const ids = [];
      const documents = [];
      const metadatas = [];

      document.chunks.forEach((chunk, index) => {
        const chunkId = `${document.id}_chunk_${index}`;
        ids.push(chunkId);
        documents.push(chunk.text);

        // Create metadata for this chunk
        const metadata = {
          documentId: document.id,
          userId: document.userId,
          filename: document.filename,
          chunkIndex: index,
          chunkLength: chunk.length,
          documentTitle: document.metadata.title || 'Untitled Document',
          uploadDate: document.uploadDate,
          pageCount: document.pageCount,
          totalChunks: document.totalChunks,
          // Include medical metadata if available
          ...(document.metadata.patientName && { patientName: document.metadata.patientName }),
          ...(document.metadata.age && { age: document.metadata.age }),
          ...(document.metadata.gender && { gender: document.metadata.gender }),
          ...(document.metadata.reportType && { reportType: document.metadata.reportType }),
          ...(document.metadata.date && { reportDate: document.metadata.date }),
          ...(document.metadata.bloodType && { bloodType: document.metadata.bloodType }),
          // Add text preview for search
          textPreview: chunk.text.substring(0, 200) + (chunk.text.length > 200 ? '...' : '')
        };

        metadatas.push(metadata);
        chunkIds.push(chunkId);
      });

      // Add to ChromaDB in batches (ChromaDB has limits)
      const batchSize = 100;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batchEnd = Math.min(i + batchSize, ids.length);
        const batchIds = ids.slice(i, batchEnd);
        const batchDocuments = documents.slice(i, batchEnd);
        const batchMetadatas = metadatas.slice(i, batchEnd);

        await this.collection.add({
          ids: batchIds,
          documents: batchDocuments,
          metadatas: batchMetadatas
        });

        console.log(`   - Added batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(ids.length / batchSize)}`);
      }

      console.log(`✅ Successfully added ${document.chunks.length} chunks to vector store`);
      return chunkIds;

    } catch (error) {
      console.error('❌ Error adding document to vector store:', error);
      throw new Error(`Failed to add document: ${error.message}`);
    }
  }

  /**
   * Search for relevant documents based on query
   * @param {string} query - Search query
   * @param {string} userId - User ID for filtering
   * @param {number} nResults - Number of results to return
   * @returns {Promise<Array>} Search results with context
   */
  async search(query, userId, nResults = 5) {
    if (!this.initialized) {
      throw new Error('Vector store not initialized');
    }

    try {
      console.log(`🔍 Searching vector store for: "${query.substring(0, 100)}..."`);
      console.log(`   - User ID: ${userId}`);
      console.log(`   - Max results: ${nResults}`);

      // Search with user-specific filtering
      const results = await this.collection.query({
        queryTexts: [query],
        nResults: nResults,
        where: {
          userId: userId
        }
      });

      if (!results || !results.ids || !results.ids[0] || results.ids[0].length === 0) {
        console.log('⚠️  No results found in vector store');
        return [];
      }

      // Process and format results
      const searchResults = results.ids[0].map((id, index) => ({
        id,
        documentId: results.metadatas[0][index].documentId,
        userId: results.metadatas[0][index].userId,
        filename: results.metadatas[0][index].filename,
        chunkIndex: results.metadatas[0][index].chunkIndex,
        chunkLength: results.metadatas[0][index].chunkLength,
        documentTitle: results.metadatas[0][index].documentTitle,
        uploadDate: results.metadatas[0][index].uploadDate,
        pageCount: results.metadatas[0][index].pageCount,
        text: results.documents[0][index],
        distance: results.distances[0][index],
        score: 1 - results.distances[0][index], // Convert distance to similarity score
        metadata: {
          patientName: results.metadatas[0][index].patientName,
          age: results.metadatas[0][index].age,
          gender: results.metadatas[0][index].gender,
          reportType: results.metadatas[0][index].reportType,
          reportDate: results.metadatas[0][index].reportDate,
          bloodType: results.metadatas[0][index].bloodType,
          textPreview: results.metadatas[0][index].textPreview
        }
      }));

      // Filter by similarity threshold
      const filteredResults = searchResults.filter(result =>
        result.score >= this.config.SIMILARITY_THRESHOLD
      );

      console.log(`✅ Found ${filteredResults.length} relevant chunks (threshold: ${this.config.SIMILARITY_THRESHOLD})`);

      // Sort by relevance score
      return filteredResults.sort((a, b) => b.score - a.score);

    } catch (error) {
      console.error('❌ Error searching vector store:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Get documents by user ID
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of documents to return
   * @returns {Promise<Array>} User documents
   */
  async getUserDocuments(userId, limit = 50) {
    if (!this.initialized) {
      throw new Error('Vector store not initialized');
    }

    try {
      const results = await this.collection.get({
        where: { userId },
        limit: limit
      });

      // Group chunks by document ID
      const documents = {};
      results.ids.forEach((id, index) => {
        const documentId = results.metadatas[index].documentId;
        if (!documents[documentId]) {
          documents[documentId] = {
            documentId,
            userId: results.metadatas[index].userId,
            filename: results.metadatas[index].filename,
            documentTitle: results.metadatas[index].documentTitle,
            uploadDate: results.metadatas[index].uploadDate,
            pageCount: results.metadatas[index].pageCount,
            chunks: [],
            metadata: {}
          };
        }

        documents[documentId].chunks.push({
          id,
          text: results.documents[index],
          chunkIndex: results.metadatas[index].chunkIndex,
          chunkLength: results.metadatas[index].chunkLength
        });

        // Add medical metadata
        Object.keys(results.metadatas[index]).forEach(key => {
          if (!['documentId', 'userId', 'filename', 'documentTitle', 'uploadDate', 'pageCount', 'chunkIndex', 'chunkLength', 'textPreview'].includes(key)) {
            documents[documentId].metadata[key] = results.metadatas[index][key];
          }
        });
      });

      // Convert to array and sort by upload date
      return Object.values(documents).sort((a, b) =>
        new Date(b.uploadDate) - new Date(a.uploadDate)
      );

    } catch (error) {
      console.error('❌ Error getting user documents:', error);
      throw new Error(`Failed to get user documents: ${error.message}`);
    }
  }

  /**
   * Delete document from vector store
   * @param {string} documentId - Document ID to delete
   * @param {string} userId - User ID (for security)
   * @returns {Promise<boolean>} Success status
   */
  async deleteDocument(documentId, userId) {
    if (!this.initialized) {
      throw new Error('Vector store not initialized');
    }

    try {
      // First, get all chunk IDs for this document
      const results = await this.collection.get({
        where: {
          documentId,
          userId
        }
      });

      if (results.ids.length === 0) {
        console.log(`⚠️  No document found with ID: ${documentId}`);
        return false;
      }

      // Delete all chunks
      await this.collection.delete({
        ids: results.ids
      });

      console.log(`✅ Deleted document ${documentId} with ${results.ids.length} chunks`);
      return true;

    } catch (error) {
      console.error('❌ Error deleting document:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Get total document count
   * @returns {Promise<number>} Total number of chunks
   */
  async getDocumentCount() {
    if (!this.initialized) {
      return 0;
    }

    try {
      const results = await this.collection.get();
      return results.ids.length;
    } catch (error) {
      console.error('Error getting document count:', error);
      return 0;
    }
  }

  /**
   * Get collection statistics
   * @returns {Promise<Object>} Collection statistics
   */
  async getStats() {
    if (!this.initialized) {
      return {
        initialized: false,
        documentCount: 0,
        userCount: 0
      };
    }

    try {
      const results = await this.collection.get();
      const userIds = new Set();

      results.metadatas.forEach(metadata => {
        userIds.add(metadata.userId);
      });

      return {
        initialized: true,
        collectionName: this.collectionName,
        documentCount: results.ids.length,
        chunkCount: results.ids.length,
        userCount: userIds.size,
        totalUsers: Array.from(userIds)
      };

    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        initialized: false,
        error: error.message
      };
    }
  }

  /**
   * Health check for vector store
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      if (!this.initialized) {
        return {
          status: 'unhealthy',
          message: 'Vector store not initialized'
        };
      }

      // Test connection with heartbeat
      const heartbeat = await this.client.heartbeat();
      const stats = await this.getStats();

      return {
        status: 'healthy',
        message: 'Vector store operational',
        connection: heartbeat,
        stats
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message
      };
    }
  }

  /**
   * Clear all data (for testing/development)
   * @returns {Promise<boolean>} Success status
   */
  async clearAll() {
    if (!this.initialized) {
      return false;
    }

    try {
      await this.collection.delete();
      console.log('⚠️  Cleared all data from vector store');
      return true;
    } catch (error) {
      console.error('Error clearing vector store:', error);
      return false;
    }
  }
}

module.exports = VectorStore;