
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
