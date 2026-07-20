import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface PDFProcessingResult {
  text: string;
  numPages: number;
  title?: string;
  author?: string;
  generatedPortrait?: string;
  extractedBasicInfo?: {
    name?: string;
    birthYear?: string;
    deathYear?: string;
    nationality?: string;
    occupation?: string;
    timePeriod?: string;
  };
}

export class PDFProcessor {
  static async extractTextFromFile(file: File): Promise<PDFProcessingResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const numPages = pdf.numPages;
      
      // Get document metadata
      const metadata = await pdf.getMetadata();
      
      // Extract text from all pages
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return {
        text: fullText.trim(),
        numPages,
        title: metadata.info?.Title,
        author: metadata.info?.Author,
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error('Failed to process PDF file');
    }
  }
  
  static validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf'];
    
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Only PDF files are allowed' };
    }
    
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 10MB' };
    }
    
    return { isValid: true };
  }
  
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}