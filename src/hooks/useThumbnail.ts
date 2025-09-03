import { useState, useEffect } from 'react';

interface ThumbnailData {
  thumbnailUrl: string;
  thumbnailPath: string;
}

export const useThumbnail = (filename: string, videoType: 'master' | 'local', isVideo: boolean) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filename || !isVideo) return;

    const generateThumbnail = async () => {
      try {
        setIsGenerating(true);
        setError(null);

        const response = await fetch('/api/generate-thumbnail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filename, videoType }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate thumbnail');
        }

        const data: ThumbnailData = await response.json();
        
        if (data.success) {
          setThumbnailUrl(data.thumbnailUrl);
        } else {
          throw new Error(data.error || 'Thumbnail generation failed');
        }
      } catch (err) {
        console.error('Thumbnail generation error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsGenerating(false);
      }
    };

    generateThumbnail();
  }, [filename, videoType, isVideo]);

  return {
    thumbnailUrl,
    isGenerating,
    error,
    regenerate: () => {
      setThumbnailUrl(null);
      setError(null);
      // Trigger regeneration by changing the dependency
      const newFilename = `${filename}?t=${Date.now()}`;
      setThumbnailUrl(null);
    }
  };
};
