import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-[#15191a]">
      {/* Sidebar skeleton */}
      <div className="hidden lg:block w-64 border-r border-[#2a2f2f] p-4">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full bg-[#2a2f2f]" />
          <Skeleton className="h-8 w-3/4 bg-[#2a2f2f]" />
          <Skeleton className="h-8 w-3/4 bg-[#2a2f2f]" />
          <Skeleton className="h-8 w-3/4 bg-[#2a2f2f]" />
          <Skeleton className="h-8 w-3/4 bg-[#2a2f2f]" />
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-[#2a2f2f]" />
            <Skeleton className="h-4 w-64 bg-[#2a2f2f]" />
          </div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-[#2a2f2f] bg-[#1a1f1f]">
                <Skeleton className="h-4 w-20 mb-2 bg-[#2a2f2f]" />
                <Skeleton className="h-8 w-16 bg-[#2a2f2f]" />
              </div>
            ))}
          </div>
          
          {/* Content sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg border border-[#2a2f2f] bg-[#1a1f1f]">
              <Skeleton className="h-6 w-32 mb-4 bg-[#2a2f2f]" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-[#2a2f2f]" />
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg border border-[#2a2f2f] bg-[#1a1f1f]">
              <Skeleton className="h-6 w-32 mb-4 bg-[#2a2f2f]" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-[#2a2f2f]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

