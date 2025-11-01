const fs = require('fs-extra');
const path = require('path');
const pdf = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');

class PDFProcessor {
  constructor(config) {
    this.config = config;
    this.uploadDir = config.UPLOAD_DIR;
    this.chunkSize = config.CHUNK_SIZE;
    this.chunkOverlap = config.CHUNK_OVERLAP;
  }

  /**
   * Process uploaded PDF file and extract text chunks
   * @param {Object} file - Multer file object
   * @param {string} userId - User ID for file organization
   * @returns {Promise<Object>} Processed document data
   */
  async processPDF(file, userId) {
    try {
      // Create user-specific directory
      const userDir = path.join(this.uploadDir, userId);
      await fs.ensureDir(userDir);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(userDir, uniqueFilename);

      // Save uploaded file
      await fs.writeFile(filePath, file.buffer);

      // Extract text from PDF
      const pdfData = await this.extractTextFromPDF(filePath);

      // Split text into chunks
      const chunks = this.splitTextIntoChunks(pdfData.text);

      // Extract metadata
      const metadata = this.extractMetadata(pdfData, file, userId);

      // Create document object
      const document = {
        id: uuidv4(),
        userId,
        filename: file.originalname,
        filePath,
        uploadDate: new Date().toISOString(),
        metadata,
        chunks,
        totalChunks: chunks.length,
        pageCount: pdfData.numpages,
        fileSize: file.size
      };

      console.log(`✅ PDF processed successfully: ${file.originalname}`);
      console.log(`   - Pages: ${pdfData.numpages}`);
      console.log(`   - Chunks: ${chunks.length}`);
      console.log(`   - Text length: ${pdfData.text.length} characters`);

      return document;

    } catch (error) {
      console.error('❌ Error processing PDF:', error);
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  /**
   * Extract text content from PDF file
   * @param {string} filePath - Path to PDF file
   * @returns {Promise<Object>} PDF data with text and metadata
   */
  async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);

      // Clean and normalize text
      const cleanedText = this.cleanText(data.text);

      return {
        text: cleanedText,
        numpages: data.numpages,
        info: data.info,
        metadata: data.metadata
      };
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Clean and normalize extracted text
   * @param {string} text - Raw extracted text
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove weird characters
      .replace(/[^\x00-\x7F\u0900-\u097F]/g, '')
      // Fix line breaks
      .replace(/\.+\s*/g, '.\n')
      // Remove extra spaces at line start
      .replace(/^\s+/gm, '')
      // Remove multiple consecutive newlines
      .replace(/\n\s*\n/g, '\n\n')
      // Trim
      .trim();
  }

  /**
   * Split text into manageable chunks with overlap
   * @param {string} text - Text to split
   * @returns {Array<Object>} Array of text chunks
   */
  splitTextIntoChunks(text) {
    const chunks = [];

    // Split by paragraphs first
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      // If adding this paragraph exceeds chunk size, save current chunk and start new one
      if (currentChunk.length + paragraph.length > this.chunkSize && currentChunk.length > 0) {
        chunks.push({
          id: uuidv4(),
          index: chunkIndex++,
          text: currentChunk.trim(),
          length: currentChunk.length
        });

        // Start new chunk with overlap from previous chunk
        const words = currentChunk.split(' ');
        const overlapWords = Math.floor(this.chunkOverlap / 5); // Approximate 5 chars per word
        currentChunk = words.slice(-overlapWords).join(' ') + ' ' + paragraph;
      } else {
        // Add paragraph to current chunk
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    // Add the last chunk if it has content
    if (currentChunk.trim().length > 0) {
      chunks.push({
        id: uuidv4(),
        index: chunkIndex,
        text: currentChunk.trim(),
        length: currentChunk.length
      });
    }

    return chunks;
  }

  /**
   * Extract metadata from PDF and file information
   * @param {Object} pdfData - Parsed PDF data
   * @param {Object} file - Uploaded file information
   * @param {string} userId - User ID
   * @returns {Object} Metadata object
   */
  extractMetadata(pdfData, file, userId) {
    const metadata = {
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadDate: new Date().toISOString(),
      userId,
      pageCount: pdfData.numpages,
      // Try to extract common medical report fields
      title: pdfData.info?.Title || 'Untitled Medical Report',
      author: pdfData.info?.Author || 'Unknown',
      creator: pdfData.info?.Creator || 'Unknown',
      producer: pdfData.info?.Producer || 'Unknown',
      creationDate: pdfData.info?.CreationDate || null,
      modificationDate: pdfData.info?.ModDate || null
    };

    // Try to extract potential medical information from text
    const textSample = pdfData.text.substring(0, 2000); // First 2000 characters
    const medicalInfo = this.extractMedicalInfo(textSample);

    return {
      ...metadata,
      ...medicalInfo
    };
  }

  /**
   * Extract potential medical information from text
   * @param {string} text - Sample text to analyze
   * @returns {Object} Medical information extracted
   */
  extractMedicalInfo(text) {
    const medicalInfo = {};

    // Common medical report patterns
    const patterns = {
      patientName: /(?:patient|name)[:\s]+([A-Za-z\s]+)/i,
      age: /(?:age|aged?)[:\s]*(\d+)/i,
      gender: /(?:gender|sex)[:\s]+(male|female|other)/i,
      date: /(?:date)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      bloodType: /(?:blood\s*(?:group|type))[:\s]*([ABO][+-])/i,
      weight: /(?:weight|wt)[:\s]*(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilograms?)/i,
      height: /(?:height|ht)[:\s]*(\d+(?:\.\d+)?)\s*(?:cm|cms|centimeters?)/i
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = text.match(pattern);
      if (match && match[1]) {
        medicalInfo[key] = match[1].trim();
      }
    });

    // Try to identify report type
    const reportTypes = {
      'blood test': /(blood\s*(?:test|report|analysis|work))/i,
      'x-ray': /(x\s*ray|radiograph|chest\s*x)/i,
      'mri': /(mri|magnetic\s*resonance)/i,
      'ct scan': /(ct\s*scan|computed\s*tomography)/i,
      'ecg': /(ecg|ekg|electrocardiogram)/i,
      'pathology': /(pathology|histology|biopsy)/i,
      'prescription': /(prescription|medication|drugs?)/i
    };

    Object.entries(reportTypes).forEach(([type, pattern]) => {
      if (pattern.test(text)) {
        medicalInfo.reportType = type;
      }
    });

    return medicalInfo;
  }

  /**
   * Get processed document by ID
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Document data or null
   */
  async getDocument(documentId, userId) {
    try {
      const userDir = path.join(this.uploadDir, userId);
      const files = await fs.readdir(userDir);

      for (const file of files) {
        const filePath = path.join(userDir, file);
        const stats = await fs.stat(filePath);

        // This is a simplified approach - in production, you'd have a proper database
        // For now, we'll return the file info if it exists
        if (stats.isFile() && path.extname(file) === '.pdf') {
          const dataBuffer = await fs.readFile(filePath);
          const pdfData = await pdf(dataBuffer);

          return {
            id: documentId,
            userId,
            filename: file,
            filePath,
            text: pdfData.text,
            pageCount: pdfData.numpages,
            fileSize: stats.size
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting document:', error);
      return null;
    }
  }

  /**
   * Delete a document and its chunks
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteDocument(documentId, userId) {
    try {
      // In a real implementation, you'd track document files in a database
      // For now, this is a placeholder
      console.log(`Document ${documentId} for user ${userId} would be deleted`);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  /**
   * List all documents for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of document metadata
   */
  async listUserDocuments(userId) {
    try {
      const userDir = path.join(this.uploadDir, userId);
      await fs.ensureDir(userDir);

      const files = await fs.readdir(userDir);
      const documents = [];

      for (const file of files) {
        if (path.extname(file) === '.pdf') {
          const filePath = path.join(userDir, file);
          const stats = await fs.stat(filePath);

          documents.push({
            id: path.basename(file, path.extname(file)),
            filename: file,
            uploadDate: stats.birthtime.toISOString(),
            fileSize: stats.size,
            userId
          });
        }
      }

      return documents.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    } catch (error) {
      console.error('Error listing documents:', error);
      return [];
    }
  }
}

module.exports = PDFProcessor;