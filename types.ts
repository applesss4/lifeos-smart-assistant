
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
}
