import React from 'react';

export const HomeSkeleton = () => {
  return (
    <div className="animate-pulse bg-background min-h-screen w-full overflow-hidden">
      {/* Hero Skeleton */}
      <div className="relative w-full h-[70vh] md:h-[85vh] bg-zinc-900">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-background to-transparent"></div>
        <div className="absolute bottom-20 left-4 md:left-12 space-y-4 w-3/4 md:w-1/3">
           <div className="h-4 bg-zinc-800 rounded w-24"></div>
           <div className="h-12 md:h-20 bg-zinc-800 rounded w-full"></div>
           <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
           <div className="flex gap-3 pt-4">
              <div className="h-12 w-32 bg-zinc-700 rounded"></div>
              <div className="h-12 w-32 bg-zinc-800 rounded"></div>
           </div>
        </div>
      </div>

      {/* Rows Skeleton */}
      <div className="space-y-8 -mt-20 relative z-10 px-4 md:px-12 pb-20">
        {[1, 2, 3].map((row) => (
            <div key={row} className="space-y-4">
                <div className="h-6 w-48 bg-zinc-800 rounded"></div>
                <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6].map((card) => (
                        <div key={card} className="min-w-[140px] md:min-w-[220px] aspect-[2/3] bg-zinc-900 rounded-lg border border-zinc-800"></div>
                    ))}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};