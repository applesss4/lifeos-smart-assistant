/**
 * 网络状态Hook
 * 提供网络状态监控和离线状态处理
 * 需求: 9.1, 9.2
 */

import { useState, useEffect } from 'react';
import { networkErrorHandler, NetworkStatus } from '../utils/networkErrorHandler';

export interface UseNetworkStatusReturn {
  isOnline: boolean;
  networkStatus: NetworkStatus;
  isSlowConnection: boolean;
}

/**
 * 监控网络状态的Hook
 * @returns 网络状态信息
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
    networkErrorHandler.getNetworkStatus()
  );

  useEffect(() => {
    // 订阅网络状态变化
    const unsubscribe = networkErrorHandler.onNetworkStatusChange((status) => {
      setNetworkStatus(status);
    });

    // 清理订阅
    return unsubscribe;
  }, []);

  return {
    isOnline: networkStatus !== 'offline',
    networkStatus,
    isSlowConnection: networkStatus === 'slow'
  };
}
