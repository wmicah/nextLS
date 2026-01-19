import { Skeleton } from "@/components/ui/skeleton";

export default function ClientsLoading() {
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
          {/* Header with search */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32 bg-[#2a2f2f]" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-64 bg-[#2a2f2f]" />
              <Skeleton className="h-10 w-32 bg-[#2a2f2f]" />
            </div>
          </div>
          
          {/* Client cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-[#2a2f2f] bg-[#1a1f1f]">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-12 w-12 rounded-full bg-[#2a2f2f]" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32 bg-[#2a2f2f]" />
                    <Skeleton className="h-3 w-24 bg-[#2a2f2f]" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full bg-[#2a2f2f]" />
                <Skeleton className="h-4 w-3/4 mt-2 bg-[#2a2f2f]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

