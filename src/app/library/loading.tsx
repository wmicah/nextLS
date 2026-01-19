import { Skeleton } from "@/components/ui/skeleton";

export default function LibraryLoading() {
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
            <Skeleton className="h-8 w-32 bg-[#2a2f2f]" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32 bg-[#2a2f2f]" />
              <Skeleton className="h-10 w-32 bg-[#2a2f2f]" />
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 bg-[#2a2f2f]" />
            <Skeleton className="h-10 w-28 bg-[#2a2f2f]" />
          </div>
          
          {/* Filter bar */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-64 bg-[#2a2f2f]" />
            <Skeleton className="h-10 w-32 bg-[#2a2f2f]" />
          </div>
          
          {/* Video grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-lg border border-[#2a2f2f] bg-[#1a1f1f] overflow-hidden">
                <Skeleton className="h-32 w-full bg-[#2a2f2f]" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-full bg-[#2a2f2f]" />
                  <Skeleton className="h-3 w-2/3 bg-[#2a2f2f]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

