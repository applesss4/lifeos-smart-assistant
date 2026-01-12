import React from 'react';

/**
 * 打卡页面骨架屏组件
 */
const AttendanceSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center pt-8 pb-12 space-y-10 animate-pulse">
      {/* Clock Skeleton */}
      <div className="flex flex-col items-center">
        <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 mb-3"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-48"></div>
      </div>

      {/* Punch Button Skeleton */}
      <div className="w-64 h-64 rounded-full bg-gray-200 dark:bg-gray-700"></div>

      {/* Status Skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="w-full px-4 space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-3"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-3"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceSkeleton;
