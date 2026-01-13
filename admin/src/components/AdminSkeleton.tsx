import React from 'react';

/**
 * 管理后台骨架屏组件
 * 在视图加载时显示，提升用户体验
 * 优化了动画性能，使用GPU加速
 */
const AdminSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
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
      <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 skeleton-shimmer"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 skeleton-shimmer"></div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 skeleton-shimmer"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-gray-200 dark:bg-gray-700 rounded-xl skeleton-shimmer"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 skeleton-shimmer"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 skeleton-shimmer"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4 skeleton-shimmer"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg skeleton-shimmer"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 skeleton-shimmer"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 skeleton-shimmer"></div>
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 skeleton-shimmer"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSkeleton;
