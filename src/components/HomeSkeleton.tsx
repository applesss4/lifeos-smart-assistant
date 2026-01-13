import React, { memo } from 'react';

/**
 * 首页骨架屏组件
 * 在数据加载时显示，提升用户体验
 * 优化了动画性能，使用GPU加速的transform和opacity
 */
const HomeSkeleton: React.FC = memo(() => {
  return (
    <div className="flex flex-col min-h-screen pb-20">
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
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-white/20 rounded-lg w-32 skeleton-shimmer"></div>
          <div className="h-10 w-10 bg-white/20 rounded-full skeleton-shimmer"></div>
        </div>
        <div className="h-6 bg-white/20 rounded w-48 mb-2 skeleton-shimmer"></div>
        <div className="h-4 bg-white/20 rounded w-32 skeleton-shimmer"></div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3 skeleton-shimmer"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 skeleton-shimmer"></div>
          </div>
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3 skeleton-shimmer"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 skeleton-shimmer"></div>
          </div>
        </div>

        {/* Action Button Skeleton */}
        <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg skeleton-shimmer"></div>
        </div>

        {/* Tasks Section Skeleton */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 skeleton-shimmer"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 skeleton-shimmer"></div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded skeleton-shimmer"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 skeleton-shimmer"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 skeleton-shimmer"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses Section Skeleton */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 skeleton-shimmer"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 skeleton-shimmer"></div>
          </div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl skeleton-shimmer"></div>
                    <div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 skeleton-shimmer"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 skeleton-shimmer"></div>
                    </div>
                  </div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16 skeleton-shimmer"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

HomeSkeleton.displayName = 'HomeSkeleton';

export default HomeSkeleton;
