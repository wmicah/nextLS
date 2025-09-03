import React from 'react';
import { useThumbnail } from '@/hooks/useThumbnail';
import { Play, Video, FileText } from 'lucide-react';

interface VideoThumbnailProps {
  item: any;
  videoType: 'master' | 'local';
  className?: string;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ 
  item, 
  videoType, 
  className = "h-28 lg:h-32" 
}) => {
  const { thumbnailUrl, isGenerating, error } = useThumbnail(
    item.filename || item.url?.split('/').pop(),
    videoType,
    item.type === 'video'
  );

  // For YouTube videos, use the existing YouTubePlayer
  if (item.isYoutube && item.youtubeId) {
    return (
      <div className={`${className} rounded-t-xl flex items-center justify-center overflow-hidden relative`}>
        <iframe
          src={`https://www.youtube.com/embed/${item.youtubeId}?controls=0&showinfo=0&rel=0&modestbranding=1`}
          title={item.title}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    );
  }

  // For uploaded videos with generated thumbnails
  if (thumbnailUrl && item.type === 'video') {
    return (
      <div className={`${className} rounded-t-xl flex items-center justify-center overflow-hidden relative`}>
        <img
          src={thumbnailUrl}
          alt={item.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to emoji if thumbnail fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        {/* Fallback emoji (hidden by default) */}
        <div className="text-4xl hidden">
          🎥
        </div>
      </div>
    );
  }

  // For videos without thumbnails or other file types
  return (
    <div className={`${className} rounded-t-xl flex items-center justify-center overflow-hidden relative`}>
      <div className="text-4xl flex items-center gap-2">
        {item.type === 'video' ? (
          <>
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-400">Generating...</span>
              </div>
            ) : (
              <>
                <Video className="h-8 w-8" style={{ color: "#ABA4AA" }} />
                <span className="text-sm text-gray-400">Video</span>
              </>
            )}
          </>
        ) : (
          <>
            <FileText className="h-8 w-8" style={{ color: "#ABA4AA" }} />
            <span className="text-sm text-gray-400">Document</span>
          </>
        )}
      </div>
    </div>
  );
};
