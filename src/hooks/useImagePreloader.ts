import { useEffect } from 'react';

export const useImagePreloader = (images: string[]) => {
  useEffect(() => {
    const preloadImages = async () => {
      const promises = images.map((src) => {
        return new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = src;
        });
      });

      try {
        await Promise.all(promises);
      } catch (error) {
        console.warn('Some images failed to preload:', error);
      }
    };

    if (images.length > 0) {
      preloadImages();
    }
  }, [images]);
};