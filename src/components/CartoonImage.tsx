import React, { useEffect, useRef } from "react";

interface CartoonImageProps {
  src: string;
  alt?: string;
  className?: string;
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
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original
      ctx.drawImage(img, 0, 0);
      
      // Step 1: Apply posterization effect
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const levels = 6; // lower = more cartoonish
      
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.floor(data[i] / levels) * levels;
        data[i + 1] = Math.floor(data[i + 1] / levels) * levels;
        data[i + 2] = Math.floor(data[i + 2] / levels) * levels;
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Step 2: Add subtle outline edges
      ctx.globalCompositeOperation = "overlay";
      ctx.filter = "contrast(1.3) brightness(1.05)";
      ctx.drawImage(canvas, 0, 0);
      
      ctx.globalCompositeOperation = "source-over";
      ctx.filter = "none";
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
        filter: 'contrast(1.25) saturate(1.3) brightness(1.05)',
      }}
    />
  );
}

