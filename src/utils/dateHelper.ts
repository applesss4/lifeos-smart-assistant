/**
 * 日期辅助函数
 * 
 * 解决时区问题：toISOString() 返回 UTC 时间，可能与本地日期不同
 */

/**
 * 获取本地日期字符串（YYYY-MM-DD 格式）
 * 使用本地时区，而不是 UTC
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取昨天的本地日期字符串
 */
export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
}

/**
 * 获取指定天数前的本地日期字符串
 */
export function getDaysAgoDateString(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getLocalDateString(date);
}

/**
 * 比较两个日期是否是同一天（忽略时间）
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return getLocalDateString(date1) === getLocalDateString(date2);
}
