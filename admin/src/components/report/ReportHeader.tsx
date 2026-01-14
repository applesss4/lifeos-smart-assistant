import React, { useState } from 'react';

export type ExportFormat = 'pdf' | 'excel' | 'image';

interface ReportHeaderProps {
    currentMonth: number;
    currentYear: number;
    onMonthChange: (month: number) => void;
    onYearChange: (year: number) => void;
    onExport: (format: ExportFormat) => void;
    onResetLayout: () => void;
    exportInProgress: boolean;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({
    currentMonth,
    currentYear,
    onMonthChange,
    onYearChange,
    onExport,
    onResetLayout,
    exportInProgress
}) => {
    const [showExportMenu, setShowExportMenu] = useState(false);

    const handleExport = (format: ExportFormat) => {
        onExport(format);
        setShowExportMenu(false);
    };

    // 生成年份选项（当前年份前后5年）
    const currentYearValue = new Date().getFullYear();
    const yearOptions = Array.from({ length: 11 }, (_, i) => currentYearValue - 5 + i);

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            {/* 左侧：标题和描述 */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight dark:text-white">月度综合报告</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    智能分析 · 数据洞察 · 趋势预测
                </p>
            </div>

            {/* 右侧：控制按钮组 */}
            <div className="flex flex-wrap items-center gap-2">
                {/* 月份和年份选择器 */}
                <div className="flex items-center gap-2 bg-white dark:bg-[#1c2127] border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-1.5 shadow-sm">
                    <span className="material-symbols-outlined text-primary text-base">calendar_month</span>
                    
                    {/* 年份选择 */}
                    <select
                        value={currentYear}
                        onChange={(e) => onYearChange(Number(e.target.value))}
                        className="bg-transparent border-none text-sm font-semibold text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer pr-1"
                        disabled={exportInProgress}
                    >
                        {yearOptions.map(year => (
                            <option key={year} value={year}>{year}年</option>
                        ))}
                    </select>

                    {/* 月份选择 */}
                    <select
                        value={currentMonth}
                        onChange={(e) => onMonthChange(Number(e.target.value))}
                        className="bg-transparent border-none text-sm font-semibold text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer"
                        disabled={exportInProgress}
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{m}月</option>
                        ))}
                    </select>
                </div>

                {/* 导出按钮（带下拉菜单） */}
                <div className="relative">
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={exportInProgress}
                        className="bg-white dark:bg-[#1c2127] border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <span className="material-symbols-outlined text-base">
                            {exportInProgress ? 'hourglass_empty' : 'download'}
                        </span>
                        {exportInProgress ? '导出中...' : '导出报告'}
                        {!exportInProgress && (
                            <span className="material-symbols-outlined text-base">
                                {showExportMenu ? 'expand_less' : 'expand_more'}
                            </span>
                        )}
                    </button>

                    {/* 导出格式下拉菜单 */}
                    {showExportMenu && !exportInProgress && (
                        <>
                            {/* 点击外部关闭菜单的遮罩 */}
                            <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setShowExportMenu(false)}
                            />
                            
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1c2127] border border-gray-100 dark:border-gray-800 rounded-lg shadow-lg overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => handleExport('pdf')}
                                    className="w-full px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                                >
                                    <span className="material-symbols-outlined text-red-500 text-base">picture_as_pdf</span>
                                    <div>
                                        <div>导出为 PDF</div>
                                        <div className="text-xs text-gray-400 font-normal">完整报告文档</div>
                                    </div>
                                </button>
                                
                                <button
                                    onClick={() => handleExport('excel')}
                                    className="w-full px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                                >
                                    <span className="material-symbols-outlined text-green-500 text-base">table_chart</span>
                                    <div>
                                        <div>导出为 Excel</div>
                                        <div className="text-xs text-gray-400 font-normal">原始数据表格</div>
                                    </div>
                                </button>
                                
                                <button
                                    onClick={() => handleExport('image')}
                                    className="w-full px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                                >
                                    <span className="material-symbols-outlined text-blue-500 text-base">image</span>
                                    <div>
                                        <div>导出为图片</div>
                                        <div className="text-xs text-gray-400 font-normal">高清截图</div>
                                    </div>
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* 重置布局按钮 */}
                <button
                    onClick={onResetLayout}
                    disabled={exportInProgress}
                    className="bg-white dark:bg-[#1c2127] border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    title="重置所有分区的显示状态"
                >
                    <span className="material-symbols-outlined text-base">refresh</span>
                    重置布局
                </button>
            </div>
        </div>
    );
};

export default ReportHeader;
