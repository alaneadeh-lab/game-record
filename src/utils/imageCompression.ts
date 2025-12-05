/**
 * Compress an image to reduce its size for localStorage storage
 * @param base64String - Base64 encoded image string
 * @param maxWidth - Maximum width in pixels (default: 400)
 * @param maxHeight - Maximum height in pixels (default: 400)
 * @param quality - JPEG quality 0-1 (default: 0.7)
 * @returns Compressed base64 string
 */
export async function compressImage(
  base64String: string,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      
      // Check if compression actually reduced size
      if (compressedBase64.length < base64String.length) {
        resolve(compressedBase64);
      } else {
        // If compression didn't help, return original but warn
        console.warn('Image compression did not reduce size, using original');
        resolve(base64String);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = base64String;
  });
}

/**
 * Check if a base64 string is likely too large for localStorage
 * @param base64String - Base64 encoded string
 * @param maxSizeKB - Maximum size in KB (default: 200)
 * @returns true if image is too large
 */
export function isImageTooLarge(base64String: string, maxSizeKB: number = 200): boolean {
  // Approximate size: base64 is ~33% larger than binary
  const sizeInBytes = (base64String.length * 3) / 4;
  const sizeInKB = sizeInBytes / 1024;
  return sizeInKB > maxSizeKB;
}

