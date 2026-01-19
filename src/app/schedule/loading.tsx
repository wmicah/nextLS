import { Skeleton } from "@/components/ui/skeleton";

export default function ScheduleLoading() {
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
              <Skeleton className="h-10 w-10 bg-[#2a2f2f]" />
              <Skeleton className="h-10 w-32 bg-[#2a2f2f]" />
              <Skeleton className="h-10 w-10 bg-[#2a2f2f]" />
            </div>
          </div>
          
          {/* Calendar grid */}
          <div className="border border-[#2a2f2f] rounded-lg p-4 bg-[#1a1f1f]">
            {/* Days header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Skeleton key={day} className="h-8 w-full bg-[#2a2f2f]" />
              ))}
            </div>
            
            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-2">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="aspect-square p-2 border border-[#2a2f2f] rounded">
                  <Skeleton className="h-4 w-6 mb-2 bg-[#2a2f2f]" />
                  <Skeleton className="h-3 w-full bg-[#2a2f2f]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

