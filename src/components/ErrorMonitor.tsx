/**
 * 错误监控面板组件
 * 用于开发和调试时查看错误日志和统计信息
 * 需求: 9.5
 */

import React, { useState, useEffect } from 'react';
import { errorLogger, LogEntry, ErrorStats, LogLevel } from '../utils/errorLogger';

export function ErrorMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<ErrorStats>(errorLogger.getErrorStats());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');

  useEffect(() => {
    if (isOpen) {
      refreshData();
      const interval = setInterval(refreshData, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen, selectedLevel]);

  const refreshData = () => {
    setStats(errorLogger.getErrorStats());
    const filter = selectedLevel !== 'all' ? { level: selectedLevel } : undefined;
    setLogs(errorLogger.getLogEntries(filter));
  };

  const handleExport = () => {
    const data = errorLogger.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('确定要清除所有日志吗？')) {
      errorLogger.clearLogs();
      refreshData();
    }
  };

  // 仅在开发环境显示
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <>
      {/* 浮动按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '16px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: stats.totalErrors > 0 ? '#f44336' : '#2196f3',
          color: 'white',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          fontSize: '20px',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {stats.totalErrors > 0 ? '⚠️' : '📊'}
      </button>

      {/* 监控面板 */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 9999,
            overflow: 'auto',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              maxWidth: '800px',
              margin: '0 auto'
            }}
          >
            {/* 头部 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>错误监控面板</h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            {/* 统计信息 */}
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>统计信息</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>总错误数</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f44336' }}>
                    {stats.totalErrors}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>警告数</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff9800' }}>
                    {stats.errorsByLevel[LogLevel.WARN]}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>信息数</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2196f3' }}>
                    {stats.errorsByLevel[LogLevel.INFO]}
                  </div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={handleExport}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                导出日志
              </button>
              <button
                onClick={handleClear}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                清除日志
              </button>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as LogLevel | 'all')}
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <option value="all">所有级别</option>
                <option value={LogLevel.ERROR}>错误</option>
                <option value={LogLevel.WARN}>警告</option>
                <option value={LogLevel.INFO}>信息</option>
                <option value={LogLevel.DEBUG}>调试</option>
              </select>
            </div>

            {/* 日志列表 */}
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#999' }}>
                  暂无日志
                </div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: getLevelColor(log.level),
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold' }}>
                        [{log.level.toUpperCase()}] {log.category}
                      </span>
                      <span style={{ color: '#666' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ marginBottom: '4px' }}>{log.message}</div>
                    {log.error && (
                      <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>
                        {JSON.stringify(log.error, null, 2)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getLevelColor(level: LogLevel): string {
  switch (level) {
    case LogLevel.ERROR:
    case LogLevel.FATAL:
      return '#ffebee';
    case LogLevel.WARN:
      return '#fff3e0';
    case LogLevel.INFO:
      return '#e3f2fd';
    case LogLevel.DEBUG:
      return '#f5f5f5';
    default:
      return '#ffffff';
  }
}
