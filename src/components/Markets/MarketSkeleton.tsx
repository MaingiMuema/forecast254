export default function MarketSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="bg-gray-900 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 bg-gray-800 rounded animate-pulse" />
          <div className="flex items-center space-x-4">
            <div className="h-5 w-16 bg-gray-800 rounded animate-pulse" />
            <div className="h-5 w-20 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-8 w-3/4 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between animate-pulse"
            >
              <div className="h-6 w-20 bg-gray-700 rounded" />
              <div className="h-6 w-16 bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Description Skeleton */}
      <div className="bg-gray-900 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-800">
          <div className="px-6 py-4">
            <div className="h-5 w-24 bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="px-6 py-4">
            <div className="h-5 w-32 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Activity Skeleton */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-gray-800 rounded animate-pulse" />
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-8 w-12 bg-gray-800 rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between animate-pulse"
            >
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-700 rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-700 rounded" />
                  <div className="h-3 w-32 bg-gray-700 rounded" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-4 w-20 bg-gray-700 rounded" />
                <div className="h-3 w-24 bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
