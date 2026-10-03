/**
 * Optimizes and compresses banner image files to rasio 8:1 (max 1600x220px)
 * Keeps payload lightweight (~30KB-80KB) so reverse proxies, Cloudflare,
 * and mobile networks never reject with 413 Payload Too Large.
 */
export async function optimizeBannerImage(
  source: File | string,
  maxWidth = 1600,
  maxHeight = 220,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's an SVG data URI, SVG doesn't need canvas compression
    if (typeof source === 'string' && source.startsWith('data:image/svg+xml')) {
      return resolve(source);
    }

    const img = new Image();

    const handleLoaded = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          return resolve(typeof source === 'string' ? source : '');
        }

        // Target ratio is 8:1
        // Scale down if larger than maxWidth or maxHeight
        let scale = 1;
        if (width > maxWidth) {
          scale = maxWidth / width;
        }
        if (height * scale > maxHeight) {
          scale = maxHeight / height;
        }

        const targetWidth = Math.max(300, Math.round(width * scale));
        const targetHeight = Math.max(40, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(typeof source === 'string' ? source : '');
        }

        // Draw with smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Export as JPEG for maximum cross-browser compatibility and small file size
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn('Canvas compression failed, falling back to original:', err);
        resolve(typeof source === 'string' ? source : '');
      }
    };

    img.onload = handleLoaded;
    img.onerror = () => {
      resolve(typeof source === 'string' ? source : '');
    };

    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
      reader.readAsDataURL(source);
    } else {
      img.src = source;
    }
  });
}
