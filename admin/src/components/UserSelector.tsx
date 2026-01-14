import React, { useState, useEffect } from 'react';
import * as profileService from '../../../src/services/profileService';

interface User {
    id: string;
    username: string;
    email?: string;
}

interface UserSelectorProps {
    onSelect: (userId: string) => void;
    onCancel: () => void;
    selectedUserIds?: string[];
    multiSelect?: boolean;
}

const UserSelector: React.FC<UserSelectorProps> = ({
    onSelect,
    onCancel,
    selectedUserIds = [],
    multiSelect = false,
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Set<string>>(new Set(selectedUserIds));
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const profiles = await profileService.getAllUsers();
            setUsers(profiles.map(p => ({
                id: p.id,
                username: p.username,
                email: p.email,
            })));
        } catch (error) {
            console.error('加载用户列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUser = (userId: string) => {
        if (multiSelect) {
            const newSelected = new Set(selected);
            if (newSelected.has(userId)) {
                newSelected.delete(userId);
            } else {
                newSelected.add(userId);
            }
            setSelected(newSelected);
        } else {
            onSelect(userId);
        }
    };

    const handleConfirm = () => {
        if (multiSelect && selected.size > 0) {
            // For multi-select, we'll send to the first selected user
            // In a real implementation, you might want to send to all selected users
            onSelect(Array.from(selected)[0]);
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white dark:bg-[#1c2127] rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-black dark:text-white">选择用户</h3>
                        <button
                            onClick={onCancel}
                            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="搜索用户名或邮箱..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                    />
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">加载中...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">未找到用户</div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => toggleUser(user.id)}
                                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                                        selected.has(user.id) ? 'bg-primary/5 dark:bg-primary/10' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {multiSelect && (
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                selected.has(user.id)
                                                    ? 'bg-primary border-primary'
                                                    : 'border-gray-300 dark:border-gray-600'
                                            }`}>
                                                {selected.has(user.id) && (
                                                    <span className="material-symbols-outlined text-white text-[14px]">check</span>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-bold text-sm dark:text-white">{user.username}</p>
                                            {user.email && (
                                                <p className="text-xs text-gray-400">{user.email}</p>
                                            )}
                                        </div>
                                        {!multiSelect && (
                                            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {multiSelect && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl font-bold"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selected.size === 0}
                            className={`flex-1 py-3 bg-primary text-white rounded-xl font-bold ${
                                selected.size === 0 ? 'opacity-50' : ''
                            }`}
                        >
                            确认 ({selected.size})
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserSelector;
