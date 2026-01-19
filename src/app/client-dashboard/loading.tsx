import { Skeleton } from "@/components/ui/skeleton";

export default function ClientDashboardLoading() {
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
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-[#2a2f2f]" />
            <Skeleton className="h-4 w-48 bg-[#2a2f2f]" />
          </div>
          
          {/* Today's Program section */}
          <div className="p-4 rounded-lg border border-[#2a2f2f] bg-[#1a1f1f]">
            <Skeleton className="h-6 w-40 mb-4 bg-[#2a2f2f]" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-[#2a2f2f] rounded-lg">
                  <Skeleton className="h-10 w-10 rounded bg-[#2a2f2f]" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-[#2a2f2f]" />
                    <Skeleton className="h-3 w-1/2 bg-[#2a2f2f]" />
                  </div>
                  <Skeleton className="h-8 w-20 bg-[#2a2f2f]" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Upcoming sessions */}
          <div className="p-4 rounded-lg border border-[#2a2f2f] bg-[#1a1f1f]">
            <Skeleton className="h-6 w-48 mb-4 bg-[#2a2f2f]" />
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-[#2a2f2f]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

