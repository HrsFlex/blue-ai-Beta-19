const _ = require('lodash');

class ContextRetriever {
  constructor(vectorStore, config) {
    this.vectorStore = vectorStore;
    this.config = config;
    this.topKDocuments = config.TOP_K_DOCUMENTS;
    this.maxContextLength = config.MAX_CONTEXT_LENGTH;
  }

  /**
   * Retrieve relevant context for a user query
   * @param {string} query - User query
   * @param {string} userId - User ID
   * @param {Object} options - Retrieval options
   * @returns {Promise<Object>} Retrieved context with metadata
   */
  async retrieveContext(query, userId, options = {}) {
    try {
      console.log(`🎯 Retrieving context for query: "${query.substring(0, 100)}..."`);

      const optionsWithDefaults = {
        maxResults: options.maxResults || this.topKDocuments,
        minScore: options.minScore || this.config.SIMILARITY_THRESHOLD,
        includeMetadata: options.includeMetadata !== false,
        maxContextLength: options.maxContextLength || this.maxContextLength,
        ...options
      };

      // Search vector store
      const searchResults = await this.vectorStore.search(
        query,
        userId,
        optionsWithDefaults.maxResults
      );

      if (!searchResults || searchResults.length === 0) {
        console.log('⚠️  No relevant context found');
        return {
          context: '',
          sources: [],
          query,
          userId,
          retrievedAt: new Date().toISOString(),
          totalChunks: 0
        };
      }

      // Filter by minimum score if specified
      const filteredResults = searchResults.filter(result =>
        result.score >= optionsWithDefaults.minScore
      );

      console.log(`📚 Found ${filteredResults.length} relevant chunks (filtered from ${searchResults.length})`);

      // Build context from retrieved chunks
      const contextData = this.buildContext(filteredResults, optionsWithDefaults);

      // Add query information
      contextData.query = query;
      contextData.userId = userId;
      contextData.retrievedAt = new Date().toISOString();

      console.log(`✅ Context built successfully`);
      console.log(`   - Context length: ${contextData.context.length} characters`);
      console.log(`   - Sources: ${contextData.sources.length}`);

      return contextData;

    } catch (error) {
      console.error('❌ Error retrieving context:', error);
      throw new Error(`Context retrieval failed: ${error.message}`);
    }
  }

  /**
   * Build formatted context from search results
   * @param {Array} searchResults - Vector search results
   * @param {Object} options - Context building options
   * @returns {Object} Formatted context with sources
   */
  buildContext(searchResults, options) {
    let context = '';
    const sources = [];
    let currentLength = 0;
    const maxContextLength = options.maxContextLength;

    // Sort results by relevance score and document order
    const sortedResults = _.orderBy(
      searchResults,
      ['score', ['documentTitle', 'chunkIndex']],
      ['desc', 'asc']
    );

    // Group chunks by document for better context flow
    const documentGroups = _.groupBy(sortedResults, 'documentId');

    // Process each document
    Object.entries(documentGroups).forEach(([documentId, chunks]) => {
      if (currentLength >= maxContextLength) return;

      const documentInfo = {
        documentId,
        title: chunks[0].documentTitle,
        filename: chunks[0].filename,
        uploadDate: chunks[0].uploadDate,
        chunks: []
      };

      // Add document header
      const documentHeader = `\n--- ${chunks[0].documentTitle} (${chunks[0].filename}) ---\n`;

      if (currentLength + documentHeader.length > maxContextLength) {
        return; // Skip this document if header won't fit
      }

      context += documentHeader;
      currentLength += documentHeader.length;

      // Add chunks from this document
      chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

      chunks.forEach(chunk => {
        if (currentLength >= maxContextLength) return;

        const chunkText = `\n${chunk.text}\n`;

        if (currentLength + chunkText.length <= maxContextLength) {
          context += chunkText;
          currentLength += chunkText.length;

          // Add to sources
          documentInfo.chunks.push({
            id: chunk.id,
            chunkIndex: chunk.chunkIndex,
            text: chunk.text,
            score: chunk.score,
            metadata: chunk.metadata
          });
        }
      });

      if (documentInfo.chunks.length > 0) {
        sources.push(documentInfo);
      }
    });

    // Clean up context
    context = context.trim();

    return {
      context,
      sources,
      totalChunks: sources.reduce((total, doc) => total + doc.chunks.length, 0),
      truncated: currentLength >= maxContextLength && searchResults.length > sources.reduce((total, doc) => total + doc.chunks.length, 0)
    };
  }

  /**
   * Retrieve context with medical-specific processing
   * @param {string} query - User query
   * @param {string} userId - User ID
   * @param {Object} medicalContext - Additional medical context
   * @returns {Promise<Object>} Enhanced medical context
   */
  async retrieveMedicalContext(query, userId, medicalContext = {}) {
    try {
      console.log(`🏥 Retrieving medical context for: "${query}"`);

      // Enhance query with medical terms
      const enhancedQuery = this.enhanceMedicalQuery(query);

      // Retrieve context
      const baseContext = await this.retrieveContext(enhancedQuery, userId, {
        includeMetadata: true,
        maxResults: Math.max(this.topKDocuments, 8) // Get more results for medical queries
      });

      // Add medical-specific processing
      const medicalData = this.processMedicalContext(baseContext, medicalContext);

      return {
        ...baseContext,
        ...medicalData,
        queryType: 'medical',
        enhancedQuery
      };

    } catch (error) {
      console.error('❌ Error retrieving medical context:', error);
      throw new Error(`Medical context retrieval failed: ${error.message}`);
    }
  }

  /**
   * Enhance query with medical terminology
   * @param {string} query - Original query
   * @returns {string} Enhanced query
   */
  enhanceMedicalQuery(query) {
    const medicalTerms = {
      'blood test': ['blood work', 'laboratory', 'test results', 'CBC', 'blood count'],
      'heart': ['cardiac', 'cardiovascular', 'ECG', 'EKG', 'heart rate'],
      'diabetes': ['blood sugar', 'glucose', 'HbA1c', 'insulin'],
      'blood pressure': ['hypertension', 'BP', 'systolic', 'diastolic'],
      'cholesterol': ['lipids', 'LDL', 'HDL', 'triglycerides'],
      'x-ray': ['radiology', 'imaging', 'radiograph'],
      'mri': ['magnetic resonance', 'scan', 'imaging'],
      'medication': ['prescription', 'drugs', 'pharmacy', 'medicine'],
      'symptoms': ['signs', 'complaints', 'presentation', 'clinical']
    };

    let enhancedQuery = query.toLowerCase();

    // Add related medical terms
    Object.entries(medicalTerms).forEach(([term, synonyms]) => {
      if (enhancedQuery.includes(term)) {
        enhancedQuery += ' ' + synonyms.join(' ');
      }
    });

    return enhancedQuery;
  }

  /**
   * Process medical context and extract relevant information
   * @param {Object} contextData - Base context data
   * @param {Object} medicalContext - Additional medical context
   * @returns {Object} Processed medical context
   */
  processMedicalContext(contextData, medicalContext) {
    const processedData = {
      medicalInfo: {
        patientData: {},
        recentReports: [],
        labResults: [],
        medications: [],
        vitalSigns: []
      }
    };

    // Extract medical information from sources
    contextData.sources.forEach(source => {
      source.chunks.forEach(chunk => {
        const text = chunk.text.toLowerCase();

        // Extract patient information
        if (chunk.metadata.patientName) {
          processedData.medicalInfo.patientData.name = chunk.metadata.patientName;
        }
        if (chunk.metadata.age) {
          processedData.medicalInfo.patientData.age = chunk.metadata.age;
        }
        if (chunk.metadata.gender) {
          processedData.medicalInfo.patientData.gender = chunk.metadata.gender;
        }
        if (chunk.metadata.bloodType) {
          processedData.medicalInfo.patientData.bloodType = chunk.metadata.bloodType;
        }

        // Categorize reports by type
        if (chunk.metadata.reportType) {
          const reportInfo = {
            title: source.title,
            filename: source.filename,
            type: chunk.metadata.reportType,
            date: chunk.metadata.reportDate,
            uploadDate: source.uploadDate,
            score: chunk.score,
            text: chunk.text
          };

          if (['blood test', 'lab results', 'laboratory'].includes(chunk.metadata.reportType.toLowerCase())) {
            processedData.medicalInfo.labResults.push(reportInfo);
          } else {
            processedData.medicalInfo.recentReports.push(reportInfo);
          }
        }

        // Extract lab values and vital signs
        const labValues = this.extractLabValues(chunk.text);
        if (labValues.length > 0) {
          processedData.medicalInfo.labResults.push({
            source: `${source.title} - Chunk ${chunk.chunkIndex}`,
            values: labValues,
            score: chunk.score
          });
        }

        const vitalSigns = this.extractVitalSigns(chunk.text);
        if (vitalSigns.length > 0) {
          processedData.medicalInfo.vitalSigns.push({
            source: `${source.title} - Chunk ${chunk.chunkIndex}`,
            signs: vitalSigns,
            score: chunk.score
          });
        }
      });
    });

    // Sort by relevance and date
    processedData.medicalInfo.recentReports.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return new Date(b.date || b.uploadDate) - new Date(a.date || a.uploadDate);
    });

    processedData.medicalInfo.labResults.sort((a, b) => b.score - a.score);
    processedData.medicalInfo.vitalSigns.sort((a, b) => b.score - a.score);

    return processedData;
  }

  /**
   * Extract lab values from text
   * @param {string} text - Text to analyze
   * @returns {Array} Array of lab values
   */
  extractLabValues(text) {
    const labPatterns = {
      hemoglobin: /(?:hemoglobin|hb)[\s:]+(\d+(?:\.\d+)?)\s*(g\/dl|g%)/i,
      wbc: /(?:wbc|white\s*blood\s*cell)[\s:]+(\d+(?:\.\d+)?)\s*(k\/ul|cells\/ul)/i,
      rbc: /(?:rbc|red\s*blood\s*cell)[\s:]+(\d+(?:\.\d+)?)\s*(m\/ul|cells\/ul)/i,
      platelets: /(?:platelets|plt)[\s:]+(\d+(?:\.\d+)?)\s*(k\/ul|cells\/ul)/i,
      glucose: /(?:glucose|blood\s*sugar)[\s:]+(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)/i,
      cholesterol: /(?:cholesterol|total\s*cholesterol)[\s:]+(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)/i,
      ldl: /(?:ldl|low\s*density)[\s:]+(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)/i,
      hdl: /(?:hdl|high\s*density)[\s:]+(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)/i,
      triglycerides: /(?:triglycerides|tg)[\s:]+(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)/i
    };

    const labValues = [];

    Object.entries(labPatterns).forEach(([test, pattern]) => {
      const match = text.match(pattern);
      if (match) {
        labValues.push({
          test,
          value: parseFloat(match[1]),
          unit: match[2],
          text: match[0]
        });
      }
    });

    return labValues;
  }

  /**
   * Extract vital signs from text
   * @param {string} text - Text to analyze
   * @returns {Array} Array of vital signs
   */
  extractVitalSigns(text) {
    const vitalPatterns = {
      bloodPressure: /(?:bp|blood\s*pressure)[\s:]*(\d+)\/(\d+)\s*(mmhg)?/i,
      heartRate: /(?:heart\s*rate|hr|pulse)[\s:]+(\d+)\s*(bpm)?/i,
      respiratoryRate: /(?:respiratory\s*rate|rr)[\s:]+(\d+)\s*(breaths?\/min)?/i,
      temperature: /(?:temperature|temp)[\s:]+(\d+(?:\.\d+)?)\s*(f|c|°f|°c)?/i,
      oxygenSaturation: /(?:oxygen\s*sat|spo2|o2\s*sat)[\s:]+(\d+(?:\.\d+)?)\s*(%|percent)?/i,
      weight: /(?:weight|wt)[\s:]+(\d+(?:\.\d+)?)\s*(kg|kgs|lbs|pounds)?/i,
      height: /(?:height|ht)[\s:]+(\d+(?:\.\d+)?)\s*(cm|cms|ft|m)?/i
    };

    const vitalSigns = [];

    Object.entries(vitalPatterns).forEach(([vital, pattern]) => {
      const match = text.match(pattern);
      if (match) {
        const value = {
          vital,
          text: match[0]
        };

        // Handle different vital sign formats
        switch (vital) {
          case 'bloodPressure':
            value.systolic = parseInt(match[1]);
            value.diastolic = parseInt(match[2]);
            value.unit = match[3] || 'mmHg';
            break;
          case 'temperature':
            value.value = parseFloat(match[1]);
            value.unit = match[2] || 'F';
            break;
          default:
            value.value = parseFloat(match[1]);
            value.unit = match[2] || '';
        }

        vitalSigns.push(value);
      }
    });

    return vitalSigns;
  }

  /**
   * Get context summary for debugging
   * @param {Object} contextData - Context data
   * @returns {Object} Summary of context
   */
  getContextSummary(contextData) {
    return {
      contextLength: contextData.context?.length || 0,
      sourceCount: contextData.sources?.length || 0,
      totalChunks: contextData.totalChunks || 0,
      truncated: contextData.truncated || false,
      query: contextData.query?.substring(0, 100) + '...',
      retrievedAt: contextData.retrievedAt
    };
  }
}

module.exports = ContextRetriever;