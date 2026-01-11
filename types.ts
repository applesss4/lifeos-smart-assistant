
export enum ViewType {
  HOME = 'HOME',
  ATTENDANCE = 'ATTENDANCE',
  TASKS = 'TASKS',
  FINANCE = 'FINANCE'
}

export interface Task {
  id: string;
  title: string;
  time: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  date: string;
  user_id?: string; // 添加用户ID字段用于数据隔离
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
  paymentMethod?: string;
  time: string;
  icon: string;
  user_id?: string; // 添加用户ID字段用于数据隔离
}
