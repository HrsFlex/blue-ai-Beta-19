// In-Memory Vector Store for RAG System
// Simple alternative to ChromaDB for demonstration purposes

const { v4: uuidv4 } = require('uuid');

class MemoryVectorStore {
  constructor() {
    this.documents = new Map(); // documentId -> document
    this.embeddings = new Map(); // embeddingId -> { documentId, text, embedding, metadata }
    this.initialized = false;
  }

  async initialize() {
    console.log('🧠 Initializing In-Memory Vector Store...');
    this.initialized = true;
    console.log('✅ In-Memory Vector Store initialized');
  }

  // Simple text similarity (placeholder for real embeddings)
  async generateEmbedding(text) {
    // This is a very simple similarity measure
    // In production, you'd use a real embedding model like sentence-transformers
    const words = text.toLowerCase().split(/\W+/);
    const wordCount = {};

    words.forEach(word => {
      if (word.length > 2) { // Skip very short words
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    return wordCount;
  }

  // Simple cosine-like similarity for word counts
  calculateSimilarity(embedding1, embedding2) {
    const words1 = Object.keys(embedding1);
    const words2 = Object.keys(embedding2);
    const allWords = new Set([...words1, ...words2]);

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    allWords.forEach(word => {
      const v1 = embedding1[word] || 0;
      const v2 = embedding2[word] || 0;
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    });

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  async addDocument(document) {
    console.log(`📄 Adding document: ${document.filename}`);

    // Store the document
    this.documents.set(document.id, {
      id: document.id,
      userId: document.userId,
      filename: document.filename,
      metadata: document.metadata,
      chunks: document.chunks,
      createdAt: new Date().toISOString()
    });

    // Generate and store embeddings for each chunk
    for (let i = 0; i < document.chunks.length; i++) {
      const chunk = document.chunks[i];
      const embeddingId = uuidv4();
      const embedding = await this.generateEmbedding(chunk.text);

      this.embeddings.set(embeddingId, {
        id: embeddingId,
        documentId: document.id,
        chunkIndex: i,
        text: chunk.text,
        embedding: embedding,
        metadata: {
          documentId: document.id,
          userId: document.userId,
          filename: document.filename,
          chunkIndex: i,
          textPreview: chunk.text.substring(0, 200) + '...'
        }
      });
    }

    console.log(`✅ Added document with ${document.chunks.length} chunks`);
    return document.id;
  }

  async search(query, userId, options = {}) {
    const { maxResults = 5, threshold = 0.1 } = options;

    console.log(`🔍 Searching for: "${query}" (max: ${maxResults}, threshold: ${threshold})`);

    // Generate embedding for the query
    const queryEmbedding = await this.generateEmbedding(query);

    // Calculate similarities
    const results = [];

    for (const [embeddingId, data] of this.embeddings) {
      // Only search documents belonging to the user
      if (data.metadata.userId !== userId) continue;

      const similarity = this.calculateSimilarity(queryEmbedding, data.embedding);

      if (similarity >= threshold) {
        results.push({
          id: embeddingId,
          documentId: data.documentId,
          text: data.text,
          metadata: data.metadata,
          score: similarity
        });
      }
    }

    // Sort by similarity score (descending) and take top results
    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, maxResults);

    console.log(`📊 Found ${topResults.length} matching chunks`);

    return topResults.map(result => ({
      content: result.text,
      metadata: result.metadata,
      score: result.score
    }));
  }

  async getDocument(documentId, userId) {
    const document = this.documents.get(documentId);

    // Check if document exists and belongs to the user
    if (!document || document.userId !== userId) {
      return null;
    }

    return document;
  }

  async deleteDocument(documentId, userId) {
    const document = this.documents.get(documentId);

    // Check if document exists and belongs to the user
    if (!document || document.userId !== userId) {
      return false;
    }

    // Remove the document
    this.documents.delete(documentId);

    // Remove all embeddings for this document
    const toDelete = [];
    for (const [embeddingId, data] of this.embeddings) {
      if (data.documentId === documentId) {
        toDelete.push(embeddingId);
      }
    }

    toDelete.forEach(id => this.embeddings.delete(id));

    console.log(`🗑️ Deleted document: ${documentId}`);
    return true;
  }

  async listDocuments(userId) {
    const documents = [];

    for (const [id, document] of this.documents) {
      if (document.userId === userId) {
        documents.push({
          id: document.id,
          filename: document.filename,
          metadata: document.metadata,
          chunksCount: document.chunks.length,
          createdAt: document.createdAt
        });
      }
    }

    return documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getStats() {
    const documentsByUser = {};

    for (const [id, document] of this.documents) {
      const userId = document.userId;
      documentsByUser[userId] = (documentsByUser[userId] || 0) + 1;
    }

    return {
      totalDocuments: this.documents.size,
      totalChunks: this.embeddings.size,
      documentsByUser,
      initialized: this.initialized
    };
  }
}

module.exports = MemoryVectorStore;