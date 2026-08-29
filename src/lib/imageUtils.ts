
/**
 * Image format validation and compression utilities for Lokal platform
 */

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/jpg'
];

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file type and size before upload
 */
export function validateImageFile(
  file: File, 
  maxSizeBytes: number = MAX_IMAGE_FILE_SIZE_BYTES,
  allowedTypes: string[] = ALLOWED_IMAGE_TYPES
): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // Type check
  const isAllowedType = allowedTypes.includes(file.type.toLowerCase()) || file.type.startsWith('image/');
  if (!isAllowedType) {
    return { 
      valid: false, 
      error: `Unsupported file format (${file.type || 'unknown'}). Please upload a JPG, PNG, WebP, or SVG file.` 
    };
  }

  // Size check
  if (file.size > maxSizeBytes) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const maxInMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return { 
      valid: false, 
      error: `File size (${sizeInMB}MB) exceeds the maximum limit of ${maxInMB}MB. Please choose a smaller image.` 
    };
  }

  return { valid: true };
}

/**
 * Compresses a base64 image string to be under a certain size limit by resizing it.
 * @param base64Str The original base64 string
 * @param maxWidth Max width of the resulting image
 * @param maxHeight Max height of the resulting image
 * @param quality Compression quality (0 to 1)
 * @returns Promise resolving to compressed base64 string
 */
export async function compressImage(base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's an SVG data URL, keep it as is to preserve vector quality
    if (base64Str.startsWith('data:image/svg+xml') || base64Str.includes('<svg')) {
      return resolve(base64Str);
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Could not get canvas context');
      
      ctx.drawImage(img, 0, 0, width, height);
      // Convert to JPEG for better compression
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (e) => reject(e);
  });
}

/**
 * Validates, reads, and compresses an image file in one clean step
 */
export async function processImageUpload(
  file: File,
  options?: {
    maxSizeBytes?: number;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }
): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
  const maxSizeBytes = options?.maxSizeBytes ?? MAX_IMAGE_FILE_SIZE_BYTES;
  const validation = validateImageFile(file, maxSizeBytes);
  
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const rawBase64 = reader.result as string;
        if (!rawBase64) {
          return resolve({ success: false, error: 'Failed to read image file.' });
        }

        // If SVG, return directly
        if (file.type === 'image/svg+xml' || rawBase64.startsWith('data:image/svg+xml')) {
          return resolve({ success: true, dataUrl: rawBase64 });
        }

        const compressed = await compressImage(
          rawBase64, 
          options?.maxWidth ?? 800, 
          options?.maxHeight ?? 800, 
          options?.quality ?? 0.75
        );
        resolve({ success: true, dataUrl: compressed });
      } catch (err) {
        console.warn("Image compression warning, using raw base64:", err);
        resolve({ success: true, dataUrl: reader.result as string });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, error: 'An error occurred while reading the image file.' });
    };
    reader.readAsDataURL(file);
  });
}

