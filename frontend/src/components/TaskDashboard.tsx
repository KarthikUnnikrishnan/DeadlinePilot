import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { Task, ScheduleItem } from '../api';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { 
  Plus, Compass, ListTodo, CheckSquare, Clock, ShieldAlert, 
  Search, RotateCw, Sparkles, Info, Sliders, Flame, Trophy, 
  TrendingUp, BarChart3, Award, Lightbulb, AlertCircle, CheckCircle2 
} from 'lucide-react';

export const TaskDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'deck' | 'analytics' | 'review'>('deck');

  // Scheduler settings state
  const [showSettings, setShowSettings] = useState(false);
  const [wakeTime, setWakeTime] = useState('08:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [peakStart, setPeakStart] = useState('09:00');
  const [peakEnd, setPeakEnd] = useState('12:00');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      setWakeTime(data.wake_time);
      setSleepTime(data.sleep_time);
      setPeakStart(data.peak_start);
      setPeakEnd(data.peak_end);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsError('');
    try {
      await api.updateSettings({
        wake_time: wakeTime,
        sleep_time: sleepTime,
        peak_start: peakStart,
        peak_end: peakEnd,
      });
      await fetchSchedule();
      setShowSettings(false);
    } catch (err) {
      console.error("Failed to update settings", err);
      setSettingsError('Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchAllTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      setError('Could not fetch tasks. Is the backend server running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    setLoadingSchedule(true);
    try {
      const data = await api.getSchedule();
      setSchedule(data);
    } catch (err) {
      console.error("Failed to compile schedule", err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    fetchAllTasks();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      fetchSchedule();
    } else {
      setSchedule([]);
    }
  }, [tasks]);

  const handleCreateOrUpdateTask = async (taskData: { title: string; description: string; deadline?: string; priority: string }) => {
    const castedData = {
      ...taskData,
      priority: taskData.priority as 'low' | 'medium' | 'high'
    };
    if (editingTask) {
      try {
        const updated = await api.updateTask(editingTask.id, castedData);
        setTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t));
        setEditingTask(null);
      } catch (err) {
        console.error(err);
        setError('Failed to update task');
      }
    } else {
      try {
        const newTask = await api.createTask(castedData);
        setTasks(prev => [newTask, ...prev]);
      } catch (err) {
        console.error(err);
        setError('Failed to create task');
      }
    }
  };

  const handleUpdateStatus = async (taskId: number, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      const updated = await api.updateTask(taskId, { status });
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await api.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateSubtasks = async (taskId: number) => {
    try {
      const updatedTask = await api.generateSubtasks(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleToggleSubtask = async (subtaskId: number, currentStatus: 'pending' | 'completed') => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const updatedSubtask = await api.updateSubtask(subtaskId, { status: newStatus });
      setTasks(prev => prev.map(task => {
        if (task.subtasks.some(s => s.id === subtaskId)) {
          const updatedSubtasks = task.subtasks.map(s => s.id === subtaskId ? updatedSubtask : s);
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    try {
      await api.deleteSubtask(subtaskId);
      setTasks(prev => prev.map(task => {
        if (task.subtasks.some(s => s.id === subtaskId)) {
          return { ...task, subtasks: task.subtasks.filter(s => s.id !== subtaskId) };
        }
        return task;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeedTemplate = async (title: string, priority: 'low' | 'medium' | 'high', daysFromNow: number, desc: string) => {
    setError('');
    setLoading(true);
    try {
      const dl = new Date();
      dl.setDate(dl.getDate() + daysFromNow);
      dl.setHours(17, 0, 0, 0);

      const created = await api.createTask({
        title,
        description: desc,
        priority,
        deadline: dl.toISOString()
      });

      // Automatically compile AI subtasks for maximum user satisfaction
      try {
        await api.generateSubtasks(created.id);
      } catch (err) {
        console.error("Subtask auto-breakdown failed", err);
      }
      
      await fetchAllTasks();
    } catch (err) {
      console.error(err);
      setError('Could not initialize template task. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Stats Calculations
  const activeTasksCount = tasks.filter(t => t.status !== 'completed').length;
  const highRiskTasks = tasks.filter(t => t.status !== 'completed' && (t.risk_level === 'high' || t.risk_level === 'critical'));
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;

  const isPanicMode = tasks.some(t => {
    if (t.status === 'completed' || !t.deadline) return false;
    const timeDiff = new Date(t.deadline).getTime() - new Date().getTime();
    return timeDiff < 24 * 60 * 60 * 1000;
  });

  const totalMinutesRemaining = tasks
    .filter(t => t.status !== 'completed')
    .reduce((sum, t) => {
      const subtaskMinutes = t.subtasks
        .filter(s => s.status !== 'completed')
        .reduce((sSum, s) => sSum + s.estimated_time_minutes, 0);
      return sum + (t.subtasks.length > 0 ? subtaskMinutes : 30);
    }, 0);

  const hoursRemaining = Math.floor(totalMinutesRemaining / 60);
  const minsRemaining = totalMinutesRemaining % 60;

  // Missed Tasks (pending and deadline is in the past)
  const missedTasks = tasks.filter(t => {
    if (t.status === 'completed' || !t.deadline) return false;
    return new Date(t.deadline).getTime() < new Date().getTime();
  });

  // Productivity metrics
  const totalTasksCount = tasks.length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  
  // Simulated streak (grows based on completion indicators)
  const completedToday = tasks.some(t => t.status === 'completed');
  const streakCount = completedTasksCount > 0 ? (completedToday ? 5 : 4) : 0;

  const totalFocusMinutesClocked = tasks.reduce((sum, t) => {
    return sum + t.subtasks
      .filter(s => s.status === 'completed')
      .reduce((sSum, s) => sSum + s.estimated_time_minutes, 0);
  }, 0);
  const totalFocusHours = Math.floor(totalFocusMinutesClocked / 60);
  const totalFocusMins = totalFocusMinutesClocked % 60;

  // Productivity Score calculation
  const productivityScore = Math.max(
    0,
    Math.min(
      100,
      totalTasksCount > 0 
        ? Math.round((completedTasksCount / totalTasksCount) * 100) - (missedTasks.length * 15)
        : 100
    )
  );

  const filteredTasks = tasks
    .filter(t => {
      if (filter === 'pending') return t.status !== 'completed';
      if (filter === 'completed') return t.status === 'completed';
      return true;
    })
    .filter(t => 
      t.title.toLowerCase().includes(search.toLowerCase()) || 
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
    );

  // Motivation Engine Copilot Message
  const getCopilotAlert = () => {
    if (isPanicMode) {
      return {
        message: "🚨 ALERT: We are falling behind schedule. Panic Mode active: breaks compressed to 0m, low priority tasks hidden. Execute emergency plans!",
        type: 'critical'
      };
    }
    if (missedTasks.length > 0) {
      return {
        message: "⚠️ STATUS DIRECTIVE: You're behind schedule on core targets. Focus on urgent tasks immediately to stabilize checkpoints.",
        type: 'warning'
      };
    }
    if (tasks.length === 0) {
      return {
        message: "✨ SYSTEM CO-PILOT: Workspace horizon clear. Seed a quick template below to compile mock schedule paths.",
        type: 'info'
      };
    }
    if (completedTasksCount > 0 && activeTasksCount === 0) {
      return {
        message: "🏆 MISSION SUCCESS: Great work today. All active task targets checked off. Keep the momentum going!",
        type: 'success'
      };
    }
    return {
      message: "🚀 FLIGHT UPDATE: Scheduling engines running at peak parameters. Subtasks distributed to match your energy spikes.",
      type: 'optimal'
    };
  };

  const copilotAlert = getCopilotAlert();

  // Energy Curve SVG points calculation
  const parseTime = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h + (m / 60);
  };

  const getEnergyForHour = (h: number): number => {
    const wake = parseTime(wakeTime);
    const sleep = parseTime(sleepTime);
    const peakS = parseTime(peakStart);
    const peakE = parseTime(peakEnd);

    const isSleeping = sleep > wake 
      ? (h < wake || h >= sleep)
      : (h >= sleep && h < wake);

    if (isSleeping) return 15;

    const isPeak = peakE > peakS
      ? (h >= peakS && h < peakE)
      : (h >= peakS || h < peakE);

    if (isPeak) return 95;

    // Normal waking hours curve
    if (h < peakS) {
      const dist = h - wake;
      return dist <= 0 ? 40 : Math.min(80, 40 + dist * 15);
    } else {
      const dist = sleep - h;
      return dist <= 0 ? 40 : Math.min(80, 40 + dist * 8);
    }
  };

  // Generate SVG path coordinates
  const svgWidth = 500;
  const svgHeight = 150;
  const paddingX = 25;
  const paddingY = 20;

  const energyPoints = Array.from({ length: 24 }, (_, hour) => {
    const energy = getEnergyForHour(hour);
    const x = paddingX + (hour / 23) * (svgWidth - 2 * paddingX);
    const y = svgHeight - paddingY - (energy / 100) * (svgHeight - 2 * paddingY);
    return { hour, energy, x, y };
  });

  const pathD = energyPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${energyPoints[energyPoints.length - 1].x} ${svgHeight - paddingY} L ${energyPoints[0].x} ${svgHeight - paddingY} Z`;

  // Radial dial circumference helper
  const dialRadius = 40;
  const dialCircumference = 2 * Math.PI * dialRadius;
  const dialOffset = dialCircumference - (productivityScore / 100) * dialCircumference;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 transition-all duration-300">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-650/15 border border-indigo-500/20 rounded-2xl shadow-indigo-600/5 shadow-inner">
            <Compass className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              DeadlinePilot
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-550/20 text-indigo-400 border border-indigo-500/30 rounded-md uppercase tracking-wider">Flight Deck</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Your intelligent workspace navigator and task orchestrator.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={fetchAllTasks}
            className="p-2.5 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-slate-200 rounded-xl transition-all cursor-pointer"
            title="Reload Tasks"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setEditingTask(null); setIsFormOpen(true); }}
            className="flex-1 md:flex-initial py-2.5 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-550 hover:to-purple-550 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        </div>
      </div>

      {/* Motivation Engine Copilot Alert Banner */}
      <div className={`mb-6 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex items-center gap-3 ${
        copilotAlert.type === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse' :
        copilotAlert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
        copilotAlert.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
        copilotAlert.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
        'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />
        <div className="shrink-0 p-1.5 rounded-lg bg-white/5">
          {copilotAlert.type === 'critical' ? <ShieldAlert className="w-5 h-5" /> :
           copilotAlert.type === 'warning' ? <AlertCircle className="w-5 h-5" /> :
           copilotAlert.type === 'success' ? <Trophy className="w-5 h-5" /> :
           copilotAlert.type === 'info' ? <Info className="w-5 h-5" /> :
           <Sparkles className="w-5 h-5" />}
        </div>
        <p className="text-xs md:text-sm font-bold tracking-wide select-none leading-relaxed">
          {copilotAlert.message}
        </p>
      </div>

      {/* Tab Navigation Menu */}
      <div className="flex border-b border-slate-900 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('deck')}
          className={`pb-3 px-4 font-bold text-xs tracking-wider uppercase transition-all relative cursor-pointer ${
            activeTab === 'deck' 
              ? 'text-indigo-400 border-b-2 border-indigo-500' 
              : 'text-slate-450 hover:text-slate-200'
          }`}
        >
          🧭 Flight Deck
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-4 font-bold text-xs tracking-wider uppercase transition-all relative cursor-pointer ${
            activeTab === 'analytics' 
              ? 'text-purple-400 border-b-2 border-purple-500' 
              : 'text-slate-455 hover:text-slate-200'
          }`}
        >
          📊 Progress Analytics
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`pb-3 px-4 font-bold text-xs tracking-wider uppercase transition-all relative cursor-pointer ${
            activeTab === 'review' 
              ? 'text-emerald-400 border-b-2 border-emerald-500' 
              : 'text-slate-455 hover:text-slate-200'
          }`}
        >
          🤖 AI Weekly Review
        </button>
      </div>

      {/* Connection Issue Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-in fade-in duration-300">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Operation Issue</p>
            <p className="text-xs text-red-450/80">{error}</p>
          </div>
        </div>
      )}

      {/* Tab Contents */}
      <div className="transition-all duration-300">
        
        {/* TAB 1: FLIGHT DECK */}
        {activeTab === 'deck' && (
          <div className="animate-in fade-in duration-300 space-y-6">
            
            {/* Tiny Core Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 hover:border-slate-700/50 transition-colors">
                <div className="p-2.5 bg-slate-850 text-slate-400 rounded-xl border border-slate-800">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">All Tasks</p>
                  <p className="text-xl font-bold text-slate-100">{tasks.length}</p>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 hover:border-slate-700/50 transition-colors">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Active Tasks</p>
                  <p className="text-xl font-bold text-indigo-400">{activeTasksCount}</p>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 hover:border-slate-700/50 transition-colors">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Completed</p>
                  <p className="text-xl font-bold text-emerald-450">{completedTasksCount}</p>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 col-span-2 lg:col-span-1 hover:border-slate-700/50 transition-colors">
                <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Est. Focus Time</p>
                  <p className="text-xl font-bold text-purple-400">
                    {hoursRemaining > 0 ? `${hoursRemaining}h ` : ''}{minsRemaining}m
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Alert panel */}
            {highRiskTasks.length > 0 && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-start gap-3.5 text-rose-400 text-sm animate-pulse">
                <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400 border border-rose-500/30 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-rose-200">Co-Pilot Alert: Deadline Risk Detected</h4>
                  <p className="text-xs text-rose-400/90 mt-1 leading-relaxed">
                    You have {highRiskTasks.length} active task{highRiskTasks.length > 1 ? 's' : ''} at critical risk or overdue. 
                    Focus on completing subtasks or adjust schedules to stay on track.
                  </p>
                </div>
              </div>
            )}

            {/* Dashboard Columns Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Tasks Board */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/80 p-1 rounded-xl w-full sm:w-auto">
                    <button
                      onClick={() => setFilter('all')}
                      className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${filter === 'all' ? 'bg-slate-850 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilter('pending')}
                      className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${filter === 'pending' ? 'bg-slate-850 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setFilter('completed')}
                      className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${filter === 'completed' ? 'bg-slate-850 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Completed
                    </button>
                  </div>

                  <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-250 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs md:text-sm"
                    />
                  </div>
                </div>

                {/* Empty State / Task Grid */}
                {loading && tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Compass className="w-9 h-9 text-indigo-500 animate-spin mb-4" />
                    <p className="text-slate-450 text-sm">Orchestrating flight course...</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="glass-panel rounded-2xl p-8 text-center border border-dashed border-slate-800">
                    <Compass className="w-12 h-12 text-slate-650 mx-auto mb-4 animate-pulse" />
                    
                    {tasks.length === 0 ? (
                      // Smart Empty State with suggestions
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-base font-bold text-slate-200">System Horizon Clear</h3>
                          <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                            Welcome, Pilot. Your flight deck is empty. Select one of the quick setup templates below to compile an AI subtask schedule instantly:
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto pt-2">
                          <button
                            onClick={() => handleSeedTemplate(
                              "Submit Project Milestones & Review", 
                              "high", 
                              1, 
                              "Deliver milestones, debug API routers, write documentation, and perform review."
                            )}
                            className="glass-card p-4 rounded-xl border border-slate-800 hover:border-indigo-500/30 transition-all text-left flex flex-col justify-between hover:bg-slate-900/10 hover:-translate-y-0.5 cursor-pointer"
                          >
                            <div>
                              <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider block w-fit mb-2">High Risk</span>
                              <h4 className="text-xs font-bold text-slate-200 leading-snug">Demo Project Review</h4>
                              <p className="text-[10px] text-slate-450 mt-1 line-clamp-2">AI breaks task down into 5 subtasks, compressing breaks and focus blocks.</p>
                            </div>
                            <span className="text-[9px] font-extrabold text-indigo-400 hover:text-indigo-300 mt-3 flex items-center gap-1">Seed Demo &rarr;</span>
                          </button>

                          <button
                            onClick={() => handleSeedTemplate(
                              "Refactor API Gateway Auth", 
                              "medium", 
                              3, 
                              "Modify auth handlers, setup session encryption, and write integration tests."
                            )}
                            className="glass-card p-4 rounded-xl border border-slate-800 hover:border-purple-500/30 transition-all text-left flex flex-col justify-between hover:bg-slate-900/10 hover:-translate-y-0.5 cursor-pointer"
                          >
                            <div>
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider block w-fit mb-2">Medium</span>
                              <h4 className="text-xs font-bold text-slate-200 leading-snug">API Auth Refactoring</h4>
                              <p className="text-[10px] text-slate-450 mt-1 line-clamp-2">Allocates subtasks into daily peaks, inserting 10-minute breaks.</p>
                            </div>
                            <span className="text-[9px] font-extrabold text-purple-400 hover:text-purple-300 mt-3 flex items-center gap-1">Seed Demo &rarr;</span>
                          </button>

                          <button
                            onClick={() => handleSeedTemplate(
                              "Declutter Workspace Desk", 
                              "low", 
                              5, 
                              "Wipe monitor, clean keycaps, manage power cables, declutter physical notes."
                            )}
                            className="glass-card p-4 rounded-xl border border-slate-800 hover:border-slate-700/50 transition-all text-left flex flex-col justify-between hover:bg-slate-900/10 hover:-translate-y-0.5 cursor-pointer"
                          >
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider block w-fit mb-2">Low</span>
                              <h4 className="text-xs font-bold text-slate-200 leading-snug">Clean Desk Space</h4>
                              <p className="text-[10px] text-slate-450 mt-1 line-clamp-2">Low priority task scheduled during off-peak slots to avoid fatigue.</p>
                            </div>
                            <span className="text-[9px] font-extrabold text-slate-350 hover:text-slate-250 mt-3 flex items-center gap-1">Seed Demo &rarr;</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-base font-bold text-slate-300">No tasks found</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          Adjust your search query or filters to find specific items.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredTasks.map((task) => (
                      <div key={task.id} className="transition-all hover:scale-[1.01] duration-300">
                        <TaskCard
                          task={task}
                          onUpdateStatus={handleUpdateStatus}
                          onDeleteTask={handleDeleteTask}
                          onEditTask={(t) => {
                            setEditingTask(t);
                            setIsFormOpen(true);
                          }}
                          onGenerateSubtasks={handleGenerateSubtasks}
                          onToggleSubtask={handleToggleSubtask}
                          onDeleteSubtask={handleDeleteSubtask}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Daily Schedule Panel */}
              <div className="lg:col-span-1">
                <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 sticky top-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm md:text-base font-bold text-slate-200 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      Urgency Schedule
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-1.5 border rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold ${
                          showSettings 
                            ? 'bg-purple-650/20 border-purple-500/35 text-purple-400' 
                            : 'bg-slate-800/40 hover:bg-slate-850 border-slate-700/50 text-slate-400 hover:text-slate-250'
                        }`}
                        title="Schedule Settings"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        Settings
                      </button>
                      <button
                        onClick={fetchSchedule}
                        disabled={loadingSchedule || tasks.length === 0}
                        className="p-1.5 bg-slate-800/40 hover:bg-slate-850 border border-slate-700/50 text-slate-400 hover:text-slate-250 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                        title="Refresh Schedule"
                      >
                        {loadingSchedule ? (
                          <RotateCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            Pilot Schedule
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {showSettings && (
                    <form onSubmit={handleSaveSettings} className="mb-6 p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                        Smart Allocation Settings
                      </h4>
                      
                      {settingsError && (
                        <p className="text-[10px] text-red-455 bg-red-500/10 p-1.5 rounded border border-red-500/20">
                          {settingsError}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Wake Time
                          </label>
                          <input
                            type="time"
                            value={wakeTime}
                            onChange={(e) => setWakeTime(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition-colors [color-scheme:dark]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Sleep Time
                          </label>
                          <input
                            type="time"
                            value={sleepTime}
                            onChange={(e) => setSleepTime(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition-colors [color-scheme:dark]"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Peak Start
                          </label>
                          <input
                            type="time"
                            value={peakStart}
                            onChange={(e) => setPeakStart(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition-colors [color-scheme:dark]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Peak End
                          </label>
                          <input
                            type="time"
                            value={peakEnd}
                            onChange={(e) => setPeakEnd(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition-colors [color-scheme:dark]"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-850 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowSettings(false)}
                          className="px-3 py-1.5 bg-transparent hover:bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-slate-200 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingSettings}
                          className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[10px] font-bold rounded-lg transition-all shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                        >
                          {savingSettings ? 'Saving...' : 'Apply'}
                        </button>
                      </div>
                    </form>
                  )}

                  {isPanicMode && (
                    <div className="mb-6 p-4 bg-red-955/20 border border-red-500/30 rounded-xl relative overflow-hidden animate-pulse">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
                      <div className="flex items-start gap-3 relative z-10 text-xs md:text-sm">
                        <div className="p-2 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 shrink-0 mt-0.5">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-red-200 uppercase tracking-wider text-[10px] md:text-xs">
                            🚨 Panic Mode Active
                          </h4>
                          <p className="text-[10px] md:text-xs text-red-450 mt-1 leading-normal">
                            Emergency schedule compiled. Low priority tasks are temporarily suspended, and break times have been eliminated to maximize consecutive focus blocks.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {loadingSchedule && schedule.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <RotateCw className="w-6 h-6 text-purple-500 animate-spin mb-2" />
                      <p className="text-xs text-slate-500">Compiling schedule...</p>
                    </div>
                  ) : schedule.length === 0 ? (
                    <div className="text-center py-14 border border-dashed border-slate-800/60 rounded-xl">
                      <Clock className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-pulse" />
                      <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                        No scheduled items. Create tasks and run AI breakdowns to establish your daily itinerary.
                      </p>
                    </div>
                  ) : (
                    <div className="relative border-l border-slate-800/80 ml-2.5 pl-5 space-y-6 max-h-[550px] overflow-y-auto pr-1">
                      {schedule.map((item, index) => (
                        <div key={index} className="relative group">
                          {/* Bullet marker */}
                          <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 bg-[#070b13] border border-purple-500 rounded-full group-hover:bg-purple-500 transition-colors" />
                          
                          <div className="space-y-1 bg-slate-900/30 hover:bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/40 transition-colors">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[9px] md:text-[10px] font-bold px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">
                                {item.time_slot}
                              </span>
                              <span className="text-[9px] text-slate-550 bg-slate-850 px-1.5 py-0.5 rounded border border-slate-800">
                                {item.duration_minutes}m
                              </span>
                            </div>
                            
                            <h5 className="text-xs font-semibold text-slate-200 mt-1">
                              {item.subtask_title}
                            </h5>
                            
                            <p className="text-[10px] text-slate-450 flex items-center gap-1 font-medium italic">
                              <span className="w-1 h-1 bg-slate-600 rounded-full" />
                              {item.task_title}
                            </p>
                            
                            <div className="text-[9px] text-slate-500 bg-slate-955/40 p-2 rounded-lg border border-slate-900/60 mt-2 flex items-start gap-1">
                              <Info className="w-3.5 h-3.5 text-purple-400/80 shrink-0 mt-0.5" />
                              <span className="leading-normal">{item.reason}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: PROGRESS ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800 animate-in fade-in duration-300 space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-900">
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Productivity Progress Analytics
                </h3>
                <p className="text-xs text-slate-450 mt-1">Deep analysis of workload velocity, focus duration, and mental energy alignment.</p>
              </div>
            </div>

            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Card 1: Streak */}
              <div className="glass-card rounded-2xl p-5 border border-slate-850 flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/25 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                  <Flame className="w-12 h-12 text-orange-500 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold uppercase text-slate-450 tracking-wider">Velocity Streak</span>
                  <div className="flex items-baseline gap-1 pt-1.5">
                    <span className="text-3xl font-black text-orange-400 animate-pulse">{streakCount}</span>
                    <span className="text-xs font-bold text-slate-400">Days Active</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-450 mt-4 leading-relaxed">
                  {streakCount > 0 ? "⚡ Systems charged! Your daily checklist streak is currently active." : "Plan and complete checklist subtasks to kickstart your daily streak."}
                </p>
              </div>

              {/* Card 2: Completion Rate */}
              <div className="glass-card rounded-2xl p-5 border border-slate-850 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/25 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                  <Award className="w-12 h-12 text-indigo-500" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold uppercase text-slate-450 tracking-wider">Completion Index</span>
                  <div className="flex items-baseline gap-1 pt-1.5">
                    <span className="text-3xl font-black text-indigo-400">{completionRate}%</span>
                    <span className="text-xs font-bold text-slate-400">Rate</span>
                  </div>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${completionRate}%` }} />
                </div>
                <p className="text-[10px] text-slate-455 mt-4 leading-relaxed">
                  Shows tasks completed out of total tasks registered. Target &gt;80% for high velocity.
                </p>
              </div>

              {/* Card 3: Energy Peak */}
              <div className="glass-card rounded-2xl p-5 border border-slate-850 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/25 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                  <Clock className="w-12 h-12 text-purple-500" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold uppercase text-slate-450 tracking-wider">Optimal Focus Window</span>
                  <div className="flex flex-col pt-1.5">
                    <span className="text-lg font-black text-purple-400">{peakStart} - {peakEnd}</span>
                    <span className="text-[9px] font-bold text-slate-455">Biological Energy Spikes</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-455 mt-4 leading-relaxed">
                  Highly complex subtasks are auto-slotted in this window to limit cognitive fatigue.
                </p>
              </div>

              {/* Card 4: Focus Time Checked Off */}
              <div className="glass-card rounded-2xl p-5 border border-slate-850 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/25 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                  <BarChart3 className="w-12 h-12 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold uppercase text-slate-450 tracking-wider">Total Focus Time</span>
                  <div className="flex items-baseline gap-1 pt-1.5">
                    <span className="text-3xl font-black text-emerald-450">{totalFocusHours}h {totalFocusMins}m</span>
                    <span className="text-xs font-bold text-slate-400">Completed</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-455 mt-4 leading-relaxed">
                  Cumulative duration of completed subtask sessions compiled by the AI schedule engine.
                </p>
              </div>

            </div>

            {/* SVG Hourly Energy Wave Chart */}
            <div className="glass-card rounded-2xl p-6 border border-slate-850 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Biological Energy Wave & Sleep Cycles</h4>
                  <p className="text-[11px] text-slate-450">Calculated dynamically based on your smart wake ({wakeTime}), sleep ({sleepTime}) and peak hours ({peakStart} - {peakEnd}).</p>
                </div>
                <div className="flex gap-4 text-[10px] font-bold">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-purple-500" /> Cognitive Peak (95%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500/60" /> Standard Awake (60%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-800" /> Sleep Mode (15%)</span>
                </div>
              </div>

              {/* energy chart SVG wrapper */}
              <div className="w-full overflow-x-auto pt-2">
                <div className="min-w-[500px] w-full h-[180px] relative">
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>

                    {/* horizontal grid markers */}
                    <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} className="stroke-slate-900" strokeWidth="1" strokeDasharray="3" />
                    <line x1={paddingX} y1={(svgHeight - 2 * paddingY) / 2 + paddingY} x2={svgWidth - paddingX} y2={(svgHeight - 2 * paddingY) / 2 + paddingY} className="stroke-slate-900" strokeWidth="1" strokeDasharray="3" />
                    <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} className="stroke-slate-850" strokeWidth="1" />

                    {/* Gradient Area under curve */}
                    <path d={areaD} fill="url(#energyGrad)" />

                    {/* Spline stroke curve */}
                    <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" />

                    {/* dots for each hour */}
                    {energyPoints.map((pt, idx) => {
                      const isPeak = pt.energy === 95;
                      const isSleep = pt.energy === 15;
                      return (
                        <g key={idx} className="group/dot">
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isPeak ? "3.5" : "2"}
                            className={`${
                              isPeak ? 'fill-purple-400 stroke-purple-650' : 
                              isSleep ? 'fill-slate-700' : 'fill-indigo-400'
                            } hover:scale-150 transition-all cursor-pointer`}
                          />
                          {/* hover label */}
                          <title>Hour: {pt.hour}:00 | Energy: {pt.energy}%</title>
                        </g>
                      );
                    })}

                    {/* energy labels y-axis */}
                    <text x={paddingX - 8} y={paddingY + 3} className="text-[8px] fill-slate-500 font-bold text-right" textAnchor="end">100%</text>
                    <text x={paddingX - 8} y={(svgHeight - 2 * paddingY) / 2 + paddingY + 3} className="text-[8px] fill-slate-550 font-bold text-right" textAnchor="end">50%</text>
                    <text x={paddingX - 8} y={svgHeight - paddingY + 3} className="text-[8px] fill-slate-600 font-bold text-right" textAnchor="end">0%</text>

                    {/* hour indicators x-axis */}
                    <text x={paddingX} y={svgHeight - paddingY + 12} className="text-[8px] fill-slate-500 font-bold text-center" textAnchor="middle">00h</text>
                    <text x={paddingX + (6 / 23) * (svgWidth - 2 * paddingX)} y={svgHeight - paddingY + 12} className="text-[8px] fill-slate-500 font-bold text-center" textAnchor="middle">06h</text>
                    <text x={paddingX + (12 / 23) * (svgWidth - 2 * paddingX)} y={svgHeight - paddingY + 12} className="text-[8px] fill-slate-500 font-bold text-center" textAnchor="middle">12h</text>
                    <text x={paddingX + (18 / 23) * (svgWidth - 2 * paddingX)} y={svgHeight - paddingY + 12} className="text-[8px] fill-slate-500 font-bold text-center" textAnchor="middle">18h</text>
                    <text x={svgWidth - paddingX} y={svgHeight - paddingY + 12} className="text-[8px] fill-slate-500 font-bold text-center" textAnchor="middle">23h</text>
                  </svg>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: AI WEEKLY REVIEW */}
        {activeTab === 'review' && (
          <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800 animate-in fade-in duration-300 space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-900">
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  AI Weekly Review & Co-Pilot Advisor
                </h3>
                <p className="text-xs text-slate-455 mt-1">Automated analysis of completed tasks, missed deadlines, velocity score, and tactical recommendations.</p>
              </div>
            </div>

            {/* Score and Overview Ring Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Radial progress ring */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 bg-slate-900/30 rounded-2xl border border-slate-850 relative">
                <span className="text-[9px] font-extrabold uppercase text-slate-450 tracking-wider mb-4">Productivity Velocity Index</span>
                
                <div className="relative flex items-center justify-center">
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r={dialRadius}
                      className="stroke-slate-800/80"
                      strokeWidth="9"
                      fill="transparent"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r={dialRadius}
                      className={`transition-all duration-1000 ease-out ${
                        productivityScore >= 80 ? 'stroke-emerald-500' :
                        productivityScore >= 50 ? 'stroke-amber-500' : 'stroke-rose-500'
                      }`}
                      strokeWidth="9"
                      fill="transparent"
                      strokeDasharray={dialCircumference}
                      strokeDashoffset={dialOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">{productivityScore}%</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Optimum</span>
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <span className="text-xs font-bold text-slate-200">
                    {productivityScore >= 80 ? "🏆 Excellent Workspace Velocity" :
                     productivityScore >= 50 ? "⚡ Moderate System Balance" : "🚨 Workload Congestion warning"}
                  </span>
                  <p className="text-[10px] text-slate-455">Computed from target check-offs minus missed checkpoint penalties.</p>
                </div>
              </div>

              {/* Right Column: Breakdown Lists */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Completed Checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-450" />
                    Completed Items ({completedTasksCount})
                  </h4>
                  
                  {completedTasksCount === 0 ? (
                    <div className="py-8 text-center bg-slate-950/20 border border-slate-900 rounded-xl text-slate-500 text-[11px]">
                      No completed tasks registered. Finish items to generate reviews.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {tasks.filter(t => t.status === 'completed').map(task => (
                        <div key={task.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium truncate max-w-[170px]">{task.title}</span>
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">Success</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Overdue/Missed checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Missed Checkpoints ({missedTasks.length})
                  </h4>
                  
                  {missedTasks.length === 0 ? (
                    <div className="py-8 text-center bg-slate-950/20 border border-slate-900 rounded-xl text-slate-450 text-[11px] italic">
                      Zero missed deadlines. Workspace safe from pressure checkpoints!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {missedTasks.map(task => (
                        <div key={task.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                          <span className="text-slate-350 font-medium truncate max-w-[160px]">{task.title}</span>
                          <span className="text-[9px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-bold uppercase">Overdue</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* AI Advisor Box */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950/20 border border-indigo-500/15 rounded-2xl space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Lightbulb className="w-24 h-24 text-indigo-400" />
              </div>
              <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-4.5 h-4.5" />
                AI Pilot Coach Suggestions
              </h4>
              
              <ul className="text-xs text-slate-350 space-y-2 list-none pl-1">
                {productivityScore === 100 && tasks.length === 0 ? (
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                    <span>Flight Deck is currently idle. Click the seed templates on the Flight Deck tab to inspect AI-driven scheduler capabilities.</span>
                  </li>
                ) : (
                  <>
                    {missedTasks.length > 0 && (
                      <li className="flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" />
                        <span>You have <strong className="text-red-400">{missedTasks.length} overdue checkpoints</strong>. We highly advise prioritizing their subtasks during your next cognitive peak.</span>
                      </li>
                    )}
                    <li className="flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                      <span>Maintain high scheduling precision by allocating your hardest tasks to the biological peak slot of <strong>{peakStart} - {peakEnd}</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                      <span>Keep checklist subtasks under 45 minutes to trigger 10-minute break buffers, preventing neural fatigue spikes.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

          </div>
        )}

      </div>

      {/* Task Creation Form Modal */}
      {isFormOpen && (
        <TaskForm
          task={editingTask || undefined}
          onSubmit={handleCreateOrUpdateTask}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};
