import { useEffect, useRef } from "react";

interface CartoonImageProps {
  src: string;
  alt?: string;
  className?: string;
}

// Helper function: Convert to grayscale
function toGrayscale(data: Uint8ClampedArray): Uint8ClampedArray {
  const gray = new Uint8ClampedArray(data.length / 4);
  for (let i = 0; i < data.length; i += 4) {
    // Weighted grayscale conversion
    gray[i / 4] = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    );
  }
  return gray;
}

// Helper function: Median blur (simplified - uses box blur as approximation)
function medianBlur(gray: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  const result = new Uint8ClampedArray(gray.length);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const values: number[] = [];
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = Math.max(0, Math.min(height - 1, y + dy));
          const nx = Math.max(0, Math.min(width - 1, x + dx));
          values.push(gray[ny * width + nx]);
        }
      }
      
      // Sort and take median
      values.sort((a, b) => a - b);
      result[y * width + x] = values[Math.floor(values.length / 2)];
    }
  }
  
  return result;
}

// Helper function: Adaptive threshold (simplified version)
function adaptiveThreshold(
  gray: Uint8ClampedArray,
  width: number,
  height: number,
  blockSize: number,
  C: number
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(gray.length);
  const halfBlock = Math.floor(blockSize / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate local mean
      let sum = 0;
      let count = 0;
      
      for (let dy = -halfBlock; dy <= halfBlock; dy++) {
        for (let dx = -halfBlock; dx <= halfBlock; dx++) {
          const ny = Math.max(0, Math.min(height - 1, y + dy));
          const nx = Math.max(0, Math.min(width - 1, x + dx));
          sum += gray[ny * width + nx];
          count++;
        }
      }
      
      const mean = sum / count;
      const threshold = mean - C;
      result[y * width + x] = gray[y * width + x] > threshold ? 255 : 0;
    }
  }
  
  return result;
}

// Helper function: Bilateral filter (simplified - uses box filter approximation)
function bilateralFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  d: number,
  sigmaColor: number,
  sigmaSpace: number
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data.length);
  const halfD = Math.floor(d / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      let sumR = 0, sumG = 0, sumB = 0, weightSum = 0;
      
      for (let dy = -halfD; dy <= halfD; dy++) {
        for (let dx = -halfD; dx <= halfD; dx++) {
          const ny = Math.max(0, Math.min(height - 1, y + dy));
          const nx = Math.max(0, Math.min(width - 1, x + dx));
          const nIdx = (ny * width + nx) * 4;
          
          const nr = data[nIdx];
          const ng = data[nIdx + 1];
          const nb = data[nIdx + 2];
          
          // Color similarity (simplified)
          const colorDiff = Math.sqrt(
            Math.pow(r - nr, 2) + Math.pow(g - ng, 2) + Math.pow(b - nb, 2)
          );
          const colorWeight = Math.exp(-(colorDiff * colorDiff) / (2 * sigmaColor * sigmaColor));
          
          // Spatial similarity
          const spaceDiff = Math.sqrt(dx * dx + dy * dy);
          const spaceWeight = Math.exp(-(spaceDiff * spaceDiff) / (2 * sigmaSpace * sigmaSpace));
          
          const weight = colorWeight * spaceWeight;
          
          sumR += nr * weight;
          sumG += ng * weight;
          sumB += nb * weight;
          weightSum += weight;
        }
      }
      
      result[idx] = Math.round(sumR / weightSum);
      result[idx + 1] = Math.round(sumG / weightSum);
      result[idx + 2] = Math.round(sumB / weightSum);
      result[idx + 3] = data[idx + 3]; // Alpha
    }
  }
  
  return result;
}

export default function CartoonImage({ src, alt, className }: CartoonImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      // Limit canvas size for performance (max 800px on longest side)
      const maxSize = 800;
      let width = img.width;
      let height = img.height;
      
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and scale original image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Step 1: Convert to grayscale
      const gray = toGrayscale(data);
      
      // Step 2: Apply median blur (noise reduction)
      const blurred = medianBlur(gray, width, height, 2);
      
      // Step 3: Detect edges using adaptive threshold
      const edges = adaptiveThreshold(blurred, width, height, 9, 9);
      
      // Step 4: Apply bilateral filter for color smoothing (preserves edges)
      const smoothed = bilateralFilter(data, width, height, 9, 250, 250);
      
      // Step 5: Combine smoothed color with edges (cartoon effect)
      const result = new Uint8ClampedArray(data.length);
      for (let i = 0; i < data.length; i += 4) {
        const pixelIdx = i / 4;
        const edgeValue = edges[pixelIdx];
        
        if (edgeValue > 128) {
          // Edge: use darker version
          result[i] = Math.max(0, smoothed[i] * 0.7);
          result[i + 1] = Math.max(0, smoothed[i + 1] * 0.7);
          result[i + 2] = Math.max(0, smoothed[i + 2] * 0.7);
        } else {
          // Smooth area: use smoothed color
          result[i] = smoothed[i];
          result[i + 1] = smoothed[i + 1];
          result[i + 2] = smoothed[i + 2];
        }
        result[i + 3] = data[i + 3]; // Preserve alpha
      }
      
      // Put processed image data back
      const outputImageData = new ImageData(result, width, height);
      ctx.putImageData(outputImageData, 0, 0);
    };
    
    img.onerror = () => {
      // If image fails to load, clear canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label={alt || "cartoon image"}
      style={{
        filter: 'contrast(1.15) saturate(1.2) brightness(1.05)',
      }}
    />
  );
}

