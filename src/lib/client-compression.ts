/**
 * Client-side file compression utilities
 */

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
  fileType?: string;
}

/**
 * Check if file is too large
 */
export function isFileTooLarge(file: File, maxSizeMB: number = 3): boolean {
  return file.size > maxSizeMB * 1024 * 1024;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

/**
 * Compress an image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    quality = 0.8,
    fileType = 'image/jpeg'
  } = options;

  // If not an image, return as-is
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = (height / width) * maxWidthOrHeight;
            width = maxWidthOrHeight;
          } else {
            width = (width / height) * maxWidthOrHeight;
            height = maxWidthOrHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try to compress to target size
        let currentQuality = quality;
        let attempts = 0;
        const maxAttempts = 5;

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const targetSize = maxSizeMB * 1024 * 1024;
              
              // If size is acceptable or we've tried enough times, use this version
              if (blob.size <= targetSize || attempts >= maxAttempts || currentQuality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: fileType,
                  lastModified: Date.now(),
                });
                
                console.log(`Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
                resolve(compressedFile);
              } else {
                // Try again with lower quality
                currentQuality -= 0.1;
                attempts++;
                tryCompress();
              }
            },
            fileType,
            currentQuality
          );
        };

        tryCompress();
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress multiple files
 */
export async function compressFiles(
  files: FileList | File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  const fileArray = Array.from(files);
  const compressed: File[] = [];

  for (const file of fileArray) {
    try {
      if (file.type.startsWith('image/')) {
        const compressedFile = await compressImage(file, options);
        compressed.push(compressedFile);
      } else {
        // Non-image files pass through unchanged
        compressed.push(file);
      }
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error);
      // If compression fails, use original
      compressed.push(file);
    }
  }

  return compressed;
}

/**
 * Convert file to base64 with optional compression
 */
export async function fileToBase64(
  file: File,
  compress: boolean = true,
  compressionOptions?: CompressionOptions
): Promise<{ filename: string; content: string; encoding: string; originalSize: number; compressedSize: number }> {
  const originalSize = file.size;
  
  // Compress if needed
  let processedFile = file;
  if (compress && file.type.startsWith('image/')) {
    processedFile = await compressImage(file, compressionOptions);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const base64Content = base64.split(',')[1];
      
      resolve({
        filename: file.name,
        content: base64Content,
        encoding: 'base64',
        originalSize,
        compressedSize: processedFile.size
      });
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(processedFile);
  });
}
