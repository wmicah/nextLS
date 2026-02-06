"use client";

/**
 * Lightweight skeleton shown while coach layout determines mobile vs desktop (isClient).
 * Gives Speed Insights a visible LCP target instead of blank content.
 * Responsive: mobile-like on narrow viewports, neutral on wide.
 */
export default function CoachPageSkeleton() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#15191a" }}
      aria-hidden
    >
      {/* Mobile-style header bar (visible on small viewports) */}
      <div
        className="border-b px-4 py-3 md:invisible md:h-0 md:overflow-hidden md:py-0"
        style={{
          paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 rounded bg-white/5" />
          <div className="h-8 w-8 rounded bg-white/5" />
        </div>
      </div>

      {/* Content area - same on both */}
      <div className="p-4 pb-20 md:pb-4 md:max-w-4xl md:mx-auto">
        <div className="space-y-4">
          <div
            className="rounded-lg border p-4 animate-pulse"
            style={{
              backgroundColor: "rgba(255,255,255,0.02)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <div className="h-5 w-40 rounded bg-white/5 mb-4" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="h-16 rounded bg-white/5"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          </div>
          <div
            className="rounded-lg border p-4 animate-pulse"
            style={{
              backgroundColor: "rgba(255,255,255,0.02)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <div className="h-5 w-48 rounded bg-white/5 mb-4" />
            <div className="space-y-2">
              <div className="h-12 rounded bg-white/5" />
              <div className="h-12 rounded bg-white/5" />
              <div className="h-12 rounded bg-white/5" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav placeholder (hidden on desktop) */}
      <div
        className="fixed bottom-0 left-0 right-0 h-14 border-t md:invisible md:h-0 md:overflow-hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          backgroundColor: "#15191a",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <div className="flex justify-around items-center h-full px-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-8 w-8 rounded-full bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
