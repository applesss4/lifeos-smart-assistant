/**
 * 离线状态指示器组件
 * 显示网络连接状态和离线提示
 * 需求: 9.1, 9.2
 */

import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function OfflineIndicator() {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  // 在线且连接正常时不显示
  if (isOnline && !isSlowConnection) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: isOnline ? '#ff9800' : '#f44336',
        color: 'white',
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 500,
        zIndex: 9999,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      {isOnline ? (
        <>
          ⚠️ 网络连接缓慢，部分功能可能受影响
        </>
      ) : (
        <>
          📡 网络连接已断开，请检查网络设置
        </>
      )}
    </div>
  );
}
