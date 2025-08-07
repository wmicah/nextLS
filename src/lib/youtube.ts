export function extractYouTubeVideoId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

export function extractPlaylistId(url: string): string | null {
  const regex = /[&?]list=([^&]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

export async function fetchYouTubeVideoInfo(videoId: string, apiKey?: string) {
  if (!apiKey) {
    console.warn("YouTube API key not provided, using fallback data")
    return {
      title: `YouTube Video ${videoId}`,
      description: "YouTube video imported without API",
      thumbnail: getYouTubeThumbnail(videoId),
      duration: null,
    }
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails`
    )

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.items?.length === 0) {
      throw new Error("Video not found")
    }

    const video = data.items[0]

    return {
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail:
        video.snippet.thumbnails?.medium?.url || getYouTubeThumbnail(videoId),
      duration: video.contentDetails?.duration,
    }
  } catch (error) {
    console.error("YouTube API error:", error)
    return {
      title: `YouTube Video ${videoId}`,
      description: "YouTube video imported with API error",
      thumbnail: getYouTubeThumbnail(videoId),
      duration: null,
    }
  }
}

export async function fetchPlaylistVideos(playlistId: string, apiKey?: string) {
  if (!apiKey) {
    console.warn("YouTube API key not provided, cannot fetch playlist")
    return []
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlistId}&key=${apiKey}&part=snippet&maxResults=50`
    )

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()

    return (
      data.items?.map((item: any) => ({
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.medium?.url,
      })) || []
    )
  } catch (error) {
    console.error("YouTube playlist API error:", error)
    return []
  }
}
