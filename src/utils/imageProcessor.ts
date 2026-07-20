export interface ImageProcessingResult {
  dataUrl: string;
  originalName: string;
  size: number;
  dimensions: { width: number; height: number };
}

export class ImageProcessor {
  static async processImageFile(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<ImageProcessingResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress the image
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          resolve({
            dataUrl,
            originalName: file.name,
            size: dataUrl.length,
            dimensions: { width, height }
          });
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = event.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
  
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
    }
    
    if (file.size > maxSize) {
      return { isValid: false, error: 'Image size must be less than 10MB' };
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
  
  static createImagePreview(dataUrl: string, maxSize: number = 150): string {
    // For now, return the same dataUrl. In a more complex implementation,
    // you could create a smaller thumbnail version
    return dataUrl;
  }
}