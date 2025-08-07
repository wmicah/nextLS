interface YouTubePlayerProps {
  videoId: string
  title?: string
  width?: string | number
  height?: string | number
  autoplay?: boolean
  className?: string
}

export default function YouTubePlayer({
  videoId,
  title = "YouTube Video",
  width = "100%",
  height = "315",
  autoplay = false,
  className = "",
}: YouTubePlayerProps) {
  const src = `https://www.youtube.com/embed/${videoId}${
    autoplay ? "?autoplay=1" : ""
  }`

  return (
    <div className={`relative ${className}`}>
      <iframe
        width={width}
        height={height}
        src={src}
        title={title}
        frameBorder='0'
        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
        allowFullScreen
        className='rounded-lg'
        style={{
          backgroundColor: "#606364",
        }}
      ></iframe>
    </div>
  )
}
