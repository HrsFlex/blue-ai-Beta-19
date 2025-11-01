"""
Document Processor for Sakhi AI - PDF and text document processing
"""

import os
import uuid
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from werkzeug.utils import secure_filename

# PDF processing
try:
    import pypdf
    import pdfplumber
    HAS_PDF_PROCESSING = True
except ImportError:
    HAS_PDF_PROCESSING = False
    logging.warning("PDF processing libraries not available. Install with: pip install pypdf pdfplumber")

# Text processing
import re
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

from ..utils.logger import get_logger

logger = get_logger(__name__)

class DocumentProcessor:
    """Document processor for handling PDF and text files"""

    def __init__(self, upload_folder: str = "uploads", max_file_size: int = 16777216):
        """
        Initialize Document Processor

        Args:
            upload_folder: Folder to store uploaded files
            max_file_size: Maximum file size in bytes
        """
        self.upload_folder = upload_folder
        self.max_file_size = max_file_size
        self.allowed_extensions = {'pdf', 'txt', 'md'}

        # Create upload folder if it doesn't exist
        os.makedirs(upload_folder, exist_ok=True)

    def allowed_file(self, filename: str) -> bool:
        """
        Check if file extension is allowed

        Args:
            filename: File name

        Returns:
            True if file is allowed, False otherwise
        """
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in self.allowed_extensions

    def process_document(self, file, user_id: str = "default") -> Dict[str, Any]:
        """
        Process uploaded document

        Args:
            file: Uploaded file object
            user_id: User ID for access control

        Returns:
            Processing result
        """
        try:
            if not file or not file.filename:
                return {
                    'success': False,
                    'error': 'No file provided'
                }

            filename = secure_filename(file.filename)
            if not self.allowed_file(filename):
                return {
                    'success': False,
                    'error': f'File type not allowed. Allowed types: {", ".join(self.allowed_extensions)}'
                }

            # Check file size
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)

            if file_size > self.max_file_size:
                return {
                    'success': False,
                    'error': f'File too large. Maximum size: {self.max_file_size // (1024*1024)}MB'
                }

            logger.info(f"Processing document: {filename} ({file_size} bytes)")

            # Generate unique document ID
            document_id = f"doc_{uuid.uuid4().hex[:12]}"

            # Save file
            file_path = os.path.join(self.upload_folder, f"{document_id}_{filename}")
            file.save(file_path)

            # Extract content based on file type
            file_extension = filename.rsplit('.', 1)[1].lower()
            content, metadata = self._extract_content(file_path, file_extension)

            if not content:
                return {
                    'success': False,
                    'error': 'Failed to extract content from document'
                }

            # Clean and process content
            processed_content = self._clean_content(content)

            # Prepare result
            result = {
                'success': True,
                'document_id': document_id,
                'filename': filename,
                'file_path': file_path,
                'file_size': file_size,
                'content': processed_content,
                'metadata': {
                    'filename': filename,
                    'file_size': file_size,
                    'file_type': file_extension,
                    'upload_date': datetime.now().isoformat(),
                    'user_id': user_id,
                    'pages': metadata.get('pages', 0),
                    'word_count': len(processed_content.split()),
                    'char_count': len(processed_content),
                    **metadata
                }
            }

            logger.info(f"✅ Document processed successfully: {document_id}")
            return result

        except Exception as e:
            logger.error(f"❌ Document processing failed: {str(e)}")
            return {
                'success': False,
                'error': f'Document processing failed: {str(e)}'
            }

    def _extract_content(self, file_path: str, file_extension: str) -> tuple[str, Dict[str, Any]]:
        """
        Extract content from file

        Args:
            file_path: Path to file
            file_extension: File extension

        Returns:
            Tuple of (content, metadata)
        """
        try:
            if file_extension == 'pdf':
                return self._extract_pdf_content(file_path)
            elif file_extension in ['txt', 'md']:
                return self._extract_text_content(file_path)
            else:
                return "", {}

        except Exception as e:
            logger.error(f"Content extraction failed: {str(e)}")
            return "", {}

    def _extract_pdf_content(self, file_path: str) -> tuple[str, Dict[str, Any]]:
        """
        Extract content from PDF file

        Args:
            file_path: Path to PDF file

        Returns:
            Tuple of (content, metadata)
        """
        if not HAS_PDF_PROCESSING:
            raise Exception("PDF processing libraries not available")

        content = []
        metadata = {
            'pages': 0,
            'has_images': False,
            'processing_method': 'pypdf'
        }

        try:
            # Try pypdf first
            with open(file_path, 'rb') as file:
                pdf_reader = pypdf.PdfReader(file)
                metadata['pages'] = len(pdf_reader.pages)

                for page_num, page in enumerate(pdf_reader.pages, 1):
                    try:
                        page_text = page.extract_text()
                        if page_text.strip():
                            content.append(f"Page {page_num}:\n{page_text.strip()}")
                    except Exception as e:
                        logger.warning(f"Failed to extract page {page_num}: {str(e)}")

                # Check for images
                for page in pdf_reader.pages:
                    if '/XObject' in page.get('/Resources', {}):
                        metadata['has_images'] = True
                        break

        except Exception as e:
            logger.warning(f"pypdf extraction failed, trying pdfplumber: {str(e)}")

            # Fall back to pdfplumber
            try:
                with pdfplumber.open(file_path) as pdf:
                    metadata['pages'] = len(pdf.pages)
                    metadata['processing_method'] = 'pdfplumber'

                    for page_num, page in enumerate(pdf.pages, 1):
                        try:
                            page_text = page.extract_text()
                            if page_text and page_text.strip():
                                content.append(f"Page {page_num}:\n{page_text.strip()}")
                        except Exception as e:
                            logger.warning(f"Failed to extract page {page_num} with pdfplumber: {str(e)}")

            except Exception as e:
                logger.error(f"Both PDF extraction methods failed: {str(e)}")
                raise

        return "\n\n".join(content), metadata

    def _extract_text_content(self, file_path: str) -> tuple[str, Dict[str, Any]]:
        """
        Extract content from text file

        Args:
            file_path: Path to text file

        Returns:
            Tuple of (content, metadata)
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()

            # Detect line endings and normalize
            content = content.replace('\r\n', '\n').replace('\r', '\n')

            # Count lines
            lines = content.split('\n')
            non_empty_lines = [line for line in lines if line.strip()]

            metadata = {
                'pages': 1,  # Text files considered as 1 page
                'lines': len(lines),
                'non_empty_lines': len(non_empty_lines),
                'processing_method': 'text'
            }

            return content, metadata

        except UnicodeDecodeError:
            # Try with different encoding
            try:
                with open(file_path, 'r', encoding='latin-1') as file:
                    content = file.read()
                return content, {'pages': 1, 'processing_method': 'text_latin1'}
            except Exception as e:
                raise Exception(f"Failed to read text file: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to extract text content: {str(e)}")

    def _clean_content(self, content: str) -> str:
        """
        Clean and normalize text content

        Args:
            content: Raw text content

        Returns:
            Cleaned text content
        """
        if not content:
            return ""

        # Remove excessive whitespace
        content = re.sub(r'\s+', ' ', content)

        # Remove page headers/footers (simple heuristic)
        lines = content.split('\n')
        cleaned_lines = []

        for line in lines:
            line = line.strip()
            # Skip very short lines that are likely headers/footers
            if len(line) > 3:
                # Skip lines that look like page numbers
                if not re.match(r'^\d+$', line):
                    cleaned_lines.append(line)

        # Rejoin content
        cleaned_content = '\n'.join(cleaned_lines)

        # Remove multiple consecutive newlines
        cleaned_content = re.sub(r'\n\s*\n\s*\n', '\n\n', cleaned_content)

        return cleaned_content.strip()

    def get_document_summary(self, content: str, max_sentences: int = 3) -> str:
        """
        Generate a summary of document content

        Args:
            content: Document content
            max_sentences: Maximum sentences in summary

        Returns:
            Document summary
        """
        try:
            # Split into sentences
            sentences = sent_tokenize(content)

            if not sentences:
                return "No content available for summary."

            # Simple extractive summarization - take first few sentences
            # In a real implementation, you might want more sophisticated summarization
            summary_sentences = sentences[:max_sentences]

            return " ".join(summary_sentences)

        except Exception as e:
            logger.error(f"Summary generation failed: {str(e)}")
            return "Summary generation failed."

    def detect_document_type(self, filename: str, content: str) -> str:
        """
        Detect document type based on filename and content

        Args:
            filename: File name
            content: Document content

        Returns:
            Detected document type
        """
        filename_lower = filename.lower()
        content_lower = content.lower()

        # Medical document keywords
        medical_keywords = [
            'patient', 'diagnosis', 'treatment', 'prescription', 'medication',
            'blood', 'test', 'report', 'doctor', 'hospital', 'clinical',
            'medical', 'health', 'symptoms', 'therapy', 'surgery'
        ]

        # Check filename and content for medical keywords
        medical_score = 0

        # Check filename
        for keyword in medical_keywords:
            if keyword in filename_lower:
                medical_score += 2

        # Check content
        for keyword in medical_keywords:
            if keyword in content_lower:
                medical_score += content_lower.count(keyword)

        # Determine document type
        if medical_score >= 5:
            if 'blood' in filename_lower or 'lab' in filename_lower:
                return 'blood_report'
            elif 'prescription' in filename_lower or 'medication' in filename_lower:
                return 'prescription'
            elif 'x-ray' in filename_lower or 'radiology' in filename_lower:
                return 'imaging'
            else:
                return 'medical_report'
        else:
            return 'general'

    def delete_document_file(self, file_path: str) -> bool:
        """
        Delete document file from storage

        Args:
            file_path: Path to file

        Returns:
            True if successful, False otherwise
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Document file deleted: {file_path}")
                return True
            else:
                logger.warning(f"Document file not found: {file_path}")
                return False
        except Exception as e:
            logger.error(f"Failed to delete document file: {str(e)}")
            return False

    def get_processing_stats(self) -> Dict[str, Any]:
        """
        Get document processing statistics

        Returns:
            Processing statistics
        """
        stats = {
            'upload_folder': self.upload_folder,
            'max_file_size_mb': self.max_file_size // (1024 * 1024),
            'allowed_extensions': list(self.allowed_extensions),
            'pdf_processing_available': HAS_PDF_PROCESSING
        }

        # Count files in upload folder
        try:
            if os.path.exists(self.upload_folder):
                files = os.listdir(self.upload_folder)
                stats['uploaded_files_count'] = len([f for f in files if os.path.isfile(os.path.join(self.upload_folder, f))])
            else:
                stats['uploaded_files_count'] = 0
        except Exception as e:
            logger.error(f"Failed to get upload folder stats: {str(e)}")
            stats['uploaded_files_count'] = 0

        return stats