
import React, { useState, useEffect } from 'react';
import * as dailyReportService from '@/services/dailyReportService';
import { DailyReport } from '@/services/dailyReportService';

const ReportsView: React.FC = () => {
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await dailyReportService.getDailyReports();
            setReports(data);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id?: string) => {
        if (!id) return;
        if (!confirm('确定要删除这份日报存档吗？')) return;
        try {
            await dailyReportService.deleteDailyReport(id);
            setReports(reports.filter(r => r.id !== id));
        } catch (error) {
            console.error('删除日报失败:', error);
            alert('删除失败');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tight dark:text-white">今日日报管理</h2>
                <span className="text-sm font-medium text-gray-400">{reports.length} 份存档</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reports.map((report) => (
                    <div key={report.id} className="bg-white dark:bg-[#1c2127] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 group transition-all hover:border-primary/20">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{report.reportDate}</p>
                                <h3 className="font-bold text-lg dark:text-white">日报总结存档</h3>
                            </div>
                            <button
                                onClick={() => handleDelete(report.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic border-l-4 border-primary/20 pl-4 py-1">
                            "{report.narrative}"
                        </p>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-center">
                                <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">总计工时</p>
                                <p className="font-black text-sm dark:text-white">{report.totalHours}h</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-center">
                                <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">完成任务</p>
                                <p className="font-black text-sm text-emerald-500">{report.completedTasksCount}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-center">
                                <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">总计支出</p>
                                <p className="font-black text-sm text-orange-500">¥{report.totalSpent.toFixed(0)}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && <div className="col-span-2 text-center py-12 text-gray-400">加载中...</div>}
                {!isLoading && reports.length === 0 && <div className="col-span-2 text-center py-12 text-gray-400">暂无存档</div>}
            </div>
        </div>
    );
};

export default ReportsView;
