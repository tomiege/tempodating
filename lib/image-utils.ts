/**
 * Compresses and downscales an image file to fit within the specified size limit
 * @param file - The image file to compress
 * @param maxSizeKB - Maximum size in kilobytes (default: 800KB)
 * @returns A compressed File object
 */
export async function downscaleImage(file: File, maxSizeKB: number = 800): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onerror = () => reject(new Error('Failed to load image'))
      
      img.onload = () => {
        let quality = 0.9
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        // Calculate scaled dimensions while maintaining aspect ratio
        let width = img.width
        let height = img.height
        const maxDimension = 1920 // Max width or height
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }
        
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        // Compress image iteratively until it's under the max size
        const tryCompress = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'))
                return
              }
              
              const sizeKB = blob.size / 1024
              
              // If size is acceptable or quality is too low, return the result
              if (sizeKB <= maxSizeKB || currentQuality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                // Try again with lower quality
                tryCompress(currentQuality - 0.1)
              }
            },
            'image/jpeg',
            currentQuality
          )
        }
        
        tryCompress(quality)
      }
      
      img.src = e.target?.result as string
    }
    
    reader.readAsDataURL(file)
  })
}
