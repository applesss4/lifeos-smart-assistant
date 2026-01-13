import React, { memo } from 'react';

/**
 * 打卡页面骨架屏组件
 * 优化了动画性能，使用GPU加速
 */
const AttendanceSkeleton: React.FC = memo(() => {
  return (
    <div className="flex flex-col items-center pt-8 pb-12 space-y-10">
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
      
      {/* Clock Skeleton */}
      <div className="flex flex-col items-center">
        <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 mb-3 skeleton-shimmer"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-48 skeleton-shimmer"></div>
      </div>

      {/* Punch Button Skeleton */}
      <div className="w-64 h-64 rounded-full bg-gray-200 dark:bg-gray-700 skeleton-shimmer"></div>

      {/* Status Skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 skeleton-shimmer"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-24 skeleton-shimmer"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="w-full px-4 space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3 skeleton-shimmer"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-3 skeleton-shimmer"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 skeleton-shimmer"></div>
          </div>
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-3 skeleton-shimmer"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 skeleton-shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  );
});

AttendanceSkeleton.displayName = 'AttendanceSkeleton';

export default AttendanceSkeleton;
