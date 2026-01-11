
import React, { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import * as taskService from '../src/services/taskService';

interface TasksProps {
  onNotify: (msg: string) => void;
}

const Tasks: React.FC<TasksProps> = ({ onNotify }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalendarMode, setIsCalendarMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('10:00');
  const [newTaskCategory, setNewTaskCategory] = useState('工作');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // 加载任务数据
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('加载任务失败:', error);
      onNotify('加载任务失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const newState = !task.completed;
      await taskService.toggleTaskComplete(id, newState);
      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          return { ...t, completed: newState };
        }
        return t;
      }));
      // 在状态更新之后调用通知
      onNotify(newState ? `已完成: ${task.title}` : `已恢复: ${task.title}`);
    } catch (error) {
      console.error('更新任务状态失败:', error);
      onNotify('更新失败，请稍后重试');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const newTask = await taskService.createTask({
        title: newTaskTitle,
        time: newTaskTime,
        category: newTaskCategory,
        priority: newTaskPriority,
        completed: false,
        date: '今日'
      });

      setTasks([newTask, ...tasks]);
      setNewTaskTitle('');
      setShowAddModal(false);
      onNotify(`任务已添加: ${newTaskTitle}`);
    } catch (error) {
      console.error('添加任务失败:', error);
      onNotify('添加任务失败，请稍后重试');
    }
  };

  const sections = ['今日', '即将开始', '已完成'];

  const renderListView = () => (
    <div className="space-y-8">
      {sections.map(sec => {
        const sectionTasks = tasks.filter(t => (sec === '已完成' ? t.completed : !t.completed && (sec === '今日' ? t.date === '今日' : t.date === '明天')));
        if (sectionTasks.length === 0) return null;

        return (
          <div key={sec} className="space-y-3">
            <h3
              onClick={() => sec === '已完成' && setIsCompletedCollapsed(!isCompletedCollapsed)}
              className={`font-bold text-lg dark:text-white flex items-center justify-between cursor-pointer ${sec === '已完成' ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2">
                {sec}
                {sec === '今日' && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">{sectionTasks.length}</span>}
              </div>
              {sec === '已完成' && (
                <span className="material-symbols-outlined text-gray-400 transition-transform duration-300" style={{ transform: isCompletedCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              )}
            </h3>
            <div className={`space-y-2 overflow-hidden transition-all duration-300 ${sec === '已完成' && isCompletedCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
              {sectionTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer ${task.completed ? 'opacity-60 grayscale-[0.5]' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-primary border-primary' : 'border-gray-200 dark:border-gray-600'}`}>
                      {task.completed && <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>}
                    </div>
                    <div>
                      <p className={`text-sm font-medium dark:text-white ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.title}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[12px]">schedule</span> {task.time} • {task.category}
                      </p>
                    </div>
                  </div>
                  {!task.completed && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${task.priority === 'High' ? 'bg-red-50 text-red-500 dark:bg-red-900/20' :
                      task.priority === 'Medium' ? 'bg-orange-50 text-orange-500 dark:bg-orange-900/20' :
                        'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20'
                      }`}>
                      {task.priority === 'High' ? '高' : task.priority === 'Medium' ? '中' : '低'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTimelineView = () => {
    const timelineTasks = [...tasks]
      .filter(t => t.date === '今日')
      .sort((a, b) => a.time.localeCompare(b.time));

    return (
      <div className="space-y-6 pl-4 relative py-4">
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-800"></div>
        {timelineTasks.map((task) => (
          <div key={task.id} className="relative pl-8 animate-in slide-in-from-left-2">
            <div className={`absolute left-[-5px] top-1.5 w-3 h-3 rounded-full border-2 bg-white dark:bg-background-dark z-10 ${task.completed ? 'border-primary' : 'border-gray-400 dark:border-gray-600'}`}></div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {task.time}
              </span>
              <div
                onClick={() => toggleTask(task.id)}
                className={`bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all active:scale-[0.98] cursor-pointer ${task.completed ? 'opacity-40 grayscale-[0.5]' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-bold dark:text-white ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.title}</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight">{task.category}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${task.priority === 'High' ? 'bg-red-50 text-red-500' :
                    task.priority === 'Medium' ? 'bg-orange-50 text-orange-500' :
                      'bg-emerald-50 text-emerald-500'
                    }`}>
                    {task.priority === 'High' ? '高' : task.priority === 'Medium' ? '中' : '低'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {timelineTasks.length === 0 && (
          <div className="py-20 text-center text-gray-400">今日暂无安排</div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 text-sm">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 space-y-6 min-h-screen pb-32 relative">
      <div className="flex flex-col gap-2">
        <div className="flex items-center h-12 justify-end">
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">
            {new Date().toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }).replace('/', '月') + '日'}
          </p>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight">我的待办</h2>
            <p className="text-gray-500 text-sm mt-1">早上好，Alex</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center hover:bg-primary/20 transition-all active:scale-95 shadow-sm shadow-primary/10"
          >
            <span className="material-symbols-outlined font-bold">add</span>
          </button>
        </div>
      </div>

      {/* Mode Toggle */}
      <div
        onClick={() => {
          setIsCalendarMode(!isCalendarMode);
          onNotify(isCalendarMode ? "已切换至列表模式" : "已切换至时间轴模式");
        }}
        className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all group"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-xl">
            {isCalendarMode ? 'view_timeline' : 'format_list_bulleted'}
          </span>
          <div>
            <p className="font-bold dark:text-white text-sm">
              {isCalendarMode ? "时间轴模式" : "列表模式"}
            </p>
            <p className="text-[10px] text-gray-400">点击切换视图样式</p>
          </div>
        </div>
        <div className={`w-12 h-6 rounded-full relative p-1 transition-all duration-300 ${isCalendarMode ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-800'}`}>
          <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 transform ${isCalendarMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
        </div>
      </div>

      {/* View Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isCalendarMode ? renderTimelineView() : renderListView()}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-24 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-8">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold dark:text-white">添加待办事项</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">任务名称</label>
                  <input
                    type="text"
                    placeholder="输入待办事项..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    required
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">时间</label>
                    <input
                      type="time"
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                      required
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">分类</label>
                    <select
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white appearance-none"
                    >
                      <option value="工作">工作</option>
                      <option value="个人">个人</option>
                      <option value="休闲">休闲</option>
                      <option value="学习">学习</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">优先级</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['High', 'Medium', 'Low'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewTaskPriority(p)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border-2 ${newTaskPriority === p
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-gray-50 dark:bg-gray-800 border-transparent dark:text-gray-400'
                          }`}
                      >
                        {p === 'High' ? '高' : p === 'Medium' ? '中' : '低'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                >
                  确认添加
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
