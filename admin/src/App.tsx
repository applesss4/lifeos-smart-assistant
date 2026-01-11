
import React, { useState } from 'react';
import SalaryView from './views/SalaryView';
import AttendanceView from './views/AttendanceView';
import FinanceView from './views/FinanceView';
import ReportsView from './views/ReportsView';
import TasksView from './views/TasksView';
import MonthlyStatsView from './views/MonthlyStatsView';

enum AdminView {
    SALARY = 'salary',
    ATTENDANCE = 'attendance',
    FINANCE = 'finance',
    REPORTS = 'reports',
    TASKS = 'tasks',
    MONTHLY_STATS = 'monthly_stats'
}

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<AdminView>(AdminView.SALARY);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const menuItems = [
        { id: AdminView.SALARY, label: '工资统计', icon: 'payments' },
        { id: AdminView.ATTENDANCE, label: '打卡管理', icon: 'fingerprint' },
        { id: AdminView.FINANCE, label: '收支管理', icon: 'account_balance_wallet' },
        { id: AdminView.REPORTS, label: '日报管理', icon: 'history_edu' },
        { id: AdminView.TASKS, label: '待办统计', icon: 'checklist' },
        { id: AdminView.MONTHLY_STATS, label: '月末统计', icon: 'analytics' },
    ];

    const renderContent = () => {
        switch (activeView) {
            case AdminView.SALARY: return <SalaryView />;
            case AdminView.ATTENDANCE: return <AttendanceView />;
            case AdminView.FINANCE: return <FinanceView />;
            case AdminView.REPORTS: return <ReportsView />;
            case AdminView.TASKS: return <TasksView />;
            case AdminView.MONTHLY_STATS: return <MonthlyStatsView />;
            default: return <SalaryView />;
        }
    };

    return (
        <div className="flex h-screen bg-[#f8f8f5] dark:bg-[#111418] overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-[#1c2127] border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col`}
            >
                <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-white">shield_person</span>
                    </div>
                    {isSidebarOpen && <h1 className="font-black text-lg tracking-tight dark:text-white">LifeOS <span className="text-primary text-xs uppercase ml-1">Admin</span></h1>}
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeView === item.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: isSidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                            chevron_left
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white dark:bg-[#1c2127] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 z-10 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm font-medium">后台管理 /</span>
                        <span className="text-gray-900 dark:text-white text-sm font-bold">
                            {menuItems.find(i => i.id === activeView)?.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="size-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"></div>
                        <span className="text-sm font-bold dark:text-gray-300">管理员</span>
                    </div>
                </header>

                {/* View Container */}
                <div className="flex-1 overflow-y-auto p-8 bg-[#f8f8f5] dark:bg-[#111418]">
                    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
                        {renderContent()}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
