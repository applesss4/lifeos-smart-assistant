import React, { memo } from 'react';

/**
 * 财务页面骨架屏组件
 * 匹配Finance视图的布局结构
 */
const FinanceSkeleton: React.FC = memo(() => {
  return (
    <div className="flex flex-col space-y-8 pb-12">
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .skeleton-shimmer {
          position: relative;
          overflow: hidden;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: shimmer 2s infinite;
          will-change: transform;
        }
        .skeleton-shimmer::before {
          content: '';
          position: absolute;
          inset: 0;
          background: inherit;
        }
      `}</style>

      {/* Header Skeleton */}
      <div className="sticky top-0 z-20 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <div className="w-10"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 skeleton-shimmer"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 skeleton-shimmer"></div>
      </div>

      {/* Balance Summary Skeleton */}
      <div className="flex flex-col items-center px-4">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 skeleton-shimmer"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6 skeleton-shimmer"></div>
        
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-8 rounded-full bg-gray-200 dark:bg-gray-700 skeleton-shimmer"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 skeleton-shimmer"></div>
            </div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 skeleton-shimmer"></div>
          </div>
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-8 rounded-full bg-gray-200 dark:bg-gray-700 skeleton-shimmer"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 skeleton-shimmer"></div>
            </div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 skeleton-shimmer"></div>
          </div>
        </div>
      </div>

      {/* Chart Section Skeleton */}
      <div className="px-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4 skeleton-shimmer"></div>
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          {/* Chart Circle Skeleton */}
          <div className="flex items-center justify-center h-48">
            <div className="w-40 h-40 rounded-full bg-gray-200 dark:bg-gray-700 skeleton-shimmer"></div>
          </div>
          {/* Legend Skeleton */}
          <div className="grid grid-cols-2 gap-y-4 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 skeleton-shimmer"></div>
                <div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-1 skeleton-shimmer"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-8 skeleton-shimmer"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Skeleton */}
      <div className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 skeleton-shimmer"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 skeleton-shimmer"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 skeleton-shimmer"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 skeleton-shimmer"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 skeleton-shimmer"></div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 skeleton-shimmer"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 skeleton-shimmer"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

FinanceSkeleton.displayName = 'FinanceSkeleton';

export default FinanceSkeleton;
