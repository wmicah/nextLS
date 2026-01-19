import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
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
      <div className="flex-1 flex">
        {/* Conversations list */}
        <div className="w-80 border-r border-[#2a2f2f] p-4">
          <Skeleton className="h-10 w-full mb-4 bg-[#2a2f2f]" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-[#2a2f2f]">
                <Skeleton className="h-10 w-10 rounded-full bg-[#2a2f2f]" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24 bg-[#2a2f2f]" />
                  <Skeleton className="h-3 w-full bg-[#2a2f2f]" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="p-4 border-b border-[#2a2f2f]">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full bg-[#2a2f2f]" />
              <Skeleton className="h-5 w-32 bg-[#2a2f2f]" />
            </div>
          </div>
          
          {/* Messages area */}
          <div className="flex-1 p-4 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'} rounded-lg bg-[#2a2f2f]`} />
              </div>
            ))}
          </div>
          
          {/* Input area */}
          <div className="p-4 border-t border-[#2a2f2f]">
            <Skeleton className="h-12 w-full bg-[#2a2f2f]" />
          </div>
        </div>
      </div>
    </div>
  );
}

