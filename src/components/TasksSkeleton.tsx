import React, { memo } from 'react';

/**
 * 任务页面骨架屏组件
 * 匹配Tasks视图的布局结构
 */
const TasksSkeleton: React.FC = memo(() => {
  return (
    <div className="flex flex-col p-4 space-y-6 min-h-screen pb-32">
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
      <div className="flex flex-col gap-2">
        <div className="flex items-center h-12 justify-end">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 skeleton-shimmer"></div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 skeleton-shimmer"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 skeleton-shimmer"></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 skeleton-shimmer"></div>
        </div>
      </div>

      {/* Mode Toggle Skeleton */}
      <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded skeleton-shimmer"></div>
          <div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1 skeleton-shimmer"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 skeleton-shimmer"></div>
          </div>
        </div>
        <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full skeleton-shimmer"></div>
      </div>

      {/* Tasks List Skeleton */}
      <div className="space-y-8">
        {/* Today Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 skeleton-shimmer"></div>
            <div className="h-5 w-8 bg-gray-200 dark:bg-gray-700 rounded-full skeleton-shimmer"></div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 skeleton-shimmer"></div>
                  <div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 skeleton-shimmer"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 skeleton-shimmer"></div>
                  </div>
                </div>
                <div className="h-5 w-8 bg-gray-200 dark:bg-gray-700 rounded-full skeleton-shimmer"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Section */}
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 skeleton-shimmer"></div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 skeleton-shimmer"></div>
                  <div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-2 skeleton-shimmer"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 skeleton-shimmer"></div>
                  </div>
                </div>
                <div className="h-5 w-8 bg-gray-200 dark:bg-gray-700 rounded-full skeleton-shimmer"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

TasksSkeleton.displayName = 'TasksSkeleton';

export default TasksSkeleton;
