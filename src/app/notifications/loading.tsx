import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="flex min-h-screen bg-[#15191a]">
      {/* Sidebar skeleton */}
      <div className="hidden lg:block w-64 border-r border-[#2a2f2f] p-4">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full bg-[#2a2f2f]" />
          <Skeleton className="h-8 w-3/4 bg-[#2a2f2f]" />
          <Skeleton className="h-8 w-3/4 bg-[#2a2f2f]" />
          <Skeleton className="h-8 w-3/4 bg-[#2a2f2f]" />
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-40 bg-[#2a2f2f]" />
            <Skeleton className="h-10 w-32 bg-[#2a2f2f]" />
          </div>
          
          {/* Notification list */}
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-[#2a2f2f] bg-[#1a1f1f]">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full bg-[#2a2f2f]" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4 bg-[#2a2f2f]" />
                    <Skeleton className="h-4 w-full bg-[#2a2f2f]" />
                    <Skeleton className="h-3 w-24 bg-[#2a2f2f]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

