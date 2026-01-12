
import React, { useState, useEffect } from 'react';
import SalaryView from './views/SalaryView';
import AttendanceView from './views/AttendanceView';
import FinanceView from './views/FinanceView';
import ReportsView from './views/ReportsView';
import TasksView from './views/TasksView';
import MonthlyStatsView from './views/MonthlyStatsView';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { useAuth } from '../../src/contexts/AuthContext';
import * as profileService from '../../src/services/profileService';
import type { UserProfile } from '../../src/services/profileService';

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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showUserSelector, setShowUserSelector] = useState(false);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { user, signOut } = useAuth();

    // 检测屏幕尺寸
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
                setIsMobileMenuOpen(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 加载所有用户
    useEffect(() => {
        loadUsers();
    }, []);

    // 点击外部关闭用户选择器和移动菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showUserSelector && !target.closest('.user-selector-container')) {
                setShowUserSelector(false);
            }
            if (isMobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
                setIsMobileMenuOpen(false);
            }
        };

        if (showUserSelector || isMobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserSelector, isMobileMenuOpen]);

    const loadUsers = async () => {
        setIsLoadingUsers(true);
        try {
            console.log('开始加载用户列表...');
            
            // 首先获取当前管理员的资料
            const currentAdminProfile = await profileService.getCurrentUserProfile();
            console.log('当前管理员资料:', currentAdminProfile);
            
            // 加载所有用户
            const allUsers = await profileService.getAllUsers();
            console.log('加载到的用户:', allUsers);
            setUsers(allUsers);
            
            // 默认选择当前管理员自己的数据
            if (currentAdminProfile && !selectedUser) {
                setSelectedUser(currentAdminProfile);
                console.log('默认选择管理员自己:', currentAdminProfile);
            } else if (allUsers.length > 0 && !selectedUser) {
                // 如果无法获取管理员资料，则选择第一个用户
                setSelectedUser(allUsers[0]);
                console.log('默认选择第一个用户:', allUsers[0]);
            } else if (allUsers.length === 0) {
                console.warn('没有找到任何用户!');
            }
        } catch (error) {
            console.error('加载用户列表失败:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleUserSelect = (user: UserProfile) => {
        setSelectedUser(user);
        setShowUserSelector(false);
    };

    const handleViewChange = (view: AdminView) => {
        setActiveView(view);
        if (isMobile) {
            setIsMobileMenuOpen(false);
        }
    };

    const menuItems = [
        { id: AdminView.SALARY, label: '工资统计', icon: 'payments' },
        { id: AdminView.ATTENDANCE, label: '打卡管理', icon: 'fingerprint' },
        { id: AdminView.FINANCE, label: '收支管理', icon: 'account_balance_wallet' },
        { id: AdminView.REPORTS, label: '日报管理', icon: 'history_edu' },
        { id: AdminView.TASKS, label: '待办统计', icon: 'checklist' },
        { id: AdminView.MONTHLY_STATS, label: '月末统计', icon: 'analytics' },
    ];

    const handleLogout = async () => {
        try {
            await signOut();
            console.log('✅ 管理员已登出');
            // AdminProtectedRoute will handle redirect to login
        } catch (error) {
            console.error('❌ 登出失败:', error);
        }
    };

    const renderContent = () => {
        const userId = selectedUser?.id;
        
        switch (activeView) {
            case AdminView.SALARY: return <SalaryView selectedUserId={userId} />;
            case AdminView.ATTENDANCE: return <AttendanceView selectedUserId={userId} />;
            case AdminView.FINANCE: return <FinanceView selectedUserId={userId} />;
            case AdminView.REPORTS: return <ReportsView selectedUserId={userId} />;
            case AdminView.TASKS: return <TasksView selectedUserId={userId} />;
            case AdminView.MONTHLY_STATS: return <MonthlyStatsView selectedUserId={userId} />;
            default: return <SalaryView selectedUserId={userId} />;
        }
    };

    return (
        <AdminProtectedRoute>
            <div className="flex h-screen bg-[#f8f8f5] dark:bg-[#111418] overflow-hidden">
            {/* Desktop Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-[#1c2127] border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex-col hidden md:flex`}
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
                            onClick={() => handleViewChange(item.id)}
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

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
                    {/* Logout Button */}
                    {isSidebarOpen && (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                            <span className="material-symbols-outlined">logout</span>
                            <span className="font-bold text-sm tracking-tight">退出登录</span>
                        </button>
                    )}
                    
                    {/* Collapse Button */}
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

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`mobile-menu fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#1c2127] z-50 transform transition-transform duration-300 md:hidden ${
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-white">shield_person</span>
                        </div>
                        <h1 className="font-black text-lg tracking-tight dark:text-white">LifeOS <span className="text-primary text-xs uppercase ml-1">Admin</span></h1>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleViewChange(item.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeView === item.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span className="font-bold text-sm tracking-tight">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span className="font-bold text-sm tracking-tight">退出登录</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-14 md:h-16 bg-white dark:bg-[#1c2127] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-8 z-10 shadow-sm">
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="mobile-menu-button md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs md:text-sm font-medium hidden md:inline">后台管理 /</span>
                            <span className="text-gray-900 dark:text-white text-sm md:text-sm font-bold">
                                {menuItems.find(i => i.id === activeView)?.label}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-6">
                        {/* User Selector */}
                        <div className="relative user-selector-container">
                            <button
                                onClick={() => setShowUserSelector(!showUserSelector)}
                                className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                            >
                                <div className="size-6 md:size-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-sm">person</span>
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-xs text-gray-400 font-medium">查看用户</p>
                                    <p className="text-sm font-bold dark:text-white truncate max-w-[100px] md:max-w-none">
                                        {selectedUser?.username || selectedUser?.email?.split('@')[0] || '选择用户'}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined text-gray-400 text-sm hidden sm:inline">expand_more</span>
                            </button>

                            {/* User Dropdown */}
                            {showUserSelector && (
                                <div className="absolute top-full right-0 mt-2 w-64 md:w-72 bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-96 overflow-y-auto">
                                    {isLoadingUsers ? (
                                        <div className="px-4 py-8 text-center text-gray-400 text-sm">加载中...</div>
                                    ) : users.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-gray-400 text-sm">暂无用户</div>
                                    ) : (
                                        users.map((u) => (
                                            <button
                                                key={u.id}
                                                onClick={() => handleUserSelect(u)}
                                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors ${selectedUser?.id === u.id ? 'bg-primary/5' : ''
                                                    }`}
                                            >
                                                <div className={`size-10 rounded-full flex items-center justify-center ${selectedUser?.id === u.id ? 'bg-primary/20' : 'bg-gray-100 dark:bg-gray-800'
                                                    }`}>
                                                    <span className={`material-symbols-outlined ${selectedUser?.id === u.id ? 'text-primary' : 'text-gray-400'
                                                        }`}>
                                                        person
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold truncate ${selectedUser?.id === u.id ? 'text-primary' : 'dark:text-white'
                                                        }`}>
                                                        {u.username || u.email.split('@')[0]}
                                                    </p>
                                                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                                </div>
                                                {selectedUser?.id === u.id && (
                                                    <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Admin Info - Hidden on mobile */}
                        <div className="hidden md:flex items-center gap-3 pl-6 border-l border-gray-200 dark:border-gray-700">
                            <div className="size-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"></div>
                            <span className="text-sm font-bold dark:text-gray-300 truncate max-w-[150px]">{user?.email || '管理员'}</span>
                        </div>
                    </div>
                </header>

                {/* View Container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8f8f5] dark:bg-[#111418] pb-20 md:pb-8">
                    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
                        {renderContent()}
                    </div>
                </div>

                {/* Mobile Bottom Navigation */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1c2127] border-t border-gray-200 dark:border-gray-800 z-30 safe-area-inset-bottom">
                    <div className="flex items-center justify-around px-2 py-2">
                        {menuItems.slice(0, 5).map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleViewChange(item.id)}
                                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px] ${
                                    activeView === item.id
                                        ? 'text-primary'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                <span className="text-[10px] font-bold tracking-tight">{item.label.replace('管理', '').replace('统计', '')}</span>
                            </button>
                        ))}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px] text-gray-500 dark:text-gray-400"
                        >
                            <span className="material-symbols-outlined text-xl">more_horiz</span>
                            <span className="text-[10px] font-bold tracking-tight">更多</span>
                        </button>
                    </div>
                </nav>
            </main>
        </div>
        </AdminProtectedRoute>
    );
};

export default App;
