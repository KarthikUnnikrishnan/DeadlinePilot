import React, { useState } from 'react';
import type { Task } from '../api';
import { Calendar, Trash2, Edit2, CheckCircle2, Circle, Sparkles, Clock, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (taskId: number, status: 'pending' | 'in_progress' | 'completed') => void;
  onDeleteTask: (taskId: number) => void;
  onEditTask: (task: Task) => void;
  onGenerateSubtasks: (taskId: number) => Promise<void>;
  onToggleSubtask: (subtaskId: number, currentStatus: 'pending' | 'completed') => void;
  onDeleteSubtask: (subtaskId: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdateStatus,
  onDeleteTask,
  onEditTask,
  onGenerateSubtasks,
  onToggleSubtask,
  onDeleteSubtask,
}) => {
  const [isExpanding, setIsExpanding] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const completedSubtasks = task.subtasks.filter(s => s.status === 'completed').length;
  const totalSubtasks = task.subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const getDeadlineText = () => {
    if (!task.deadline) return { text: 'No deadline', isOverdue: false, isUrgent: false };
    const deadlineDate = new Date(task.deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    
    if (diffTime < 0) {
      return { text: 'Overdue', isOverdue: true, isUrgent: false };
    }
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return { text: 'Due tomorrow', isOverdue: false, isUrgent: true };
    if (diffDays <= 3) return { text: `Due in ${diffDays} days`, isOverdue: false, isUrgent: true };
    return { text: `Due in ${diffDays} days`, isOverdue: false, isUrgent: false };
  };

  const deadlineInfo = getDeadlineText();

  const handleAISubtaskGeneration = async () => {
    setIsGenerating(true);
    try {
      await onGenerateSubtasks(task.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const getRiskBadgeColors = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/35';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/35';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/35';
      case 'safe':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35';
    }
  };

  const getWorkloadVsAvailable = (t: Task) => {
    if (!t.risk_message) return "";
    const match = t.risk_message.match(/(\d+\.?\d*)h.*(\d+\.?\d*)h/);
    if (match && match.length >= 3) {
      const workload = match[1];
      const available = match[2];
      return `${workload}h workload / ${available}h available`;
    }
    if (t.risk_level === 'critical') {
      return "Overdue / No time left";
    }
    return "";
  };

  const getPriorityColors = (p: string) => {
    switch (p) {
      case 'high':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'low':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className={`glass-card rounded-2xl border border-slate-800/80 p-5 hover:border-slate-700/80 transition-all shadow-lg flex flex-col justify-between ${task.status === 'completed' ? 'opacity-85' : ''}`}>
      {/* Risk Alert Banner */}
      {task.status !== 'completed' && task.risk_level && task.risk_level !== 'none' && task.risk_level !== 'safe' && (
        <div className={`mb-4 p-2.5 rounded-xl border flex items-start gap-2 text-[10px] md:text-xs leading-snug ${
          task.risk_level === 'critical' 
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : task.risk_level === 'high'
              ? 'bg-orange-500/10 border-orange-500/25 text-orange-400'
              : 'bg-amber-500/10 border-amber-500/25 text-amber-450'
        }`}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{task.risk_message}</span>
        </div>
      )}

      <div>
        {/* Card Header */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="flex items-start gap-3">
            <button 
              onClick={() => onUpdateStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
              className="mt-0.5 text-slate-500 hover:text-indigo-400 transition-colors"
            >
              {task.status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
              ) : (
                <Circle className="w-5 h-5 text-slate-600 hover:text-slate-500" />
              )}
            </button>
            <div>
              <h4 className={`text-sm md:text-base font-semibold text-slate-200 ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                {task.title}
              </h4>
              {task.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className={`text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColors(task.priority)} uppercase tracking-wider`}>
              {task.priority}
            </span>
            {task.status !== 'completed' && task.risk_level && task.risk_level !== 'none' && (
              <span className={`text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getRiskBadgeColors(task.risk_level)}`}>
                {task.risk_level}
              </span>
            )}
            <button 
              onClick={() => onEditTask(task)}
              className="text-slate-500 hover:text-indigo-400 hover:bg-slate-800/40 p-1.5 rounded-lg transition-all cursor-pointer"
              title="Edit Task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => onDeleteTask(task.id)}
              className="text-slate-500 hover:text-red-400 hover:bg-slate-800/40 p-1.5 rounded-lg transition-all cursor-pointer"
              title="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div>
        {/* Task Metadata Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 mt-4 pt-3 border-t border-slate-800/50">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {task.deadline ? (
              <span className={deadlineInfo.isOverdue ? 'text-red-450 font-medium' : deadlineInfo.isUrgent ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ({deadlineInfo.text})
              </span>
            ) : (
              <span className="text-slate-500">No deadline</span>
            )}
          </div>

          {totalSubtasks > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">{completedSubtasks}/{totalSubtasks} Checklist</span>
              <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${subtaskProgress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Countdown Pressure Indicator */}
        {task.deadline && task.status !== 'completed' && task.risk_level && task.risk_level !== 'none' && (
          <div className="mt-3 px-3 py-2 bg-slate-900/40 rounded-xl border border-slate-800/60 flex items-center justify-between text-[10px] md:text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Pressure Index
            </span>
            <span className={`font-bold ${
              task.risk_level === 'critical' ? 'text-red-400' :
              task.risk_level === 'high' ? 'text-orange-400' :
              task.risk_level === 'medium' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {getWorkloadVsAvailable(task)}
            </span>
          </div>
        )}

        {/* Subtasks Section */}
        {totalSubtasks > 0 ? (
          <div className="mt-4 pt-3 border-t border-slate-800/50">
            <button 
              onClick={() => setIsExpanding(!isExpanding)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-slate-300 transition-colors mb-2"
            >
              <span className="flex items-center gap-1">
                AI Checklist & Schedule
              </span>
              {isExpanding ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isExpanding && (
              <div className="space-y-1.5 mt-2 max-h-52 overflow-y-auto pr-1">
                {task.subtasks.map((subtask) => (
                  <div 
                    key={subtask.id} 
                    className={`flex justify-between items-center bg-slate-900/30 hover:bg-slate-900/70 px-3 py-1.5 rounded-xl border border-slate-800/40 text-xs transition-colors ${subtask.status === 'completed' ? 'opacity-65' : ''}`}
                  >
                    <div className="flex items-center gap-2 shrink overflow-hidden">
                      <button 
                        onClick={() => onToggleSubtask(subtask.id, subtask.status)}
                        className="text-slate-500 hover:text-indigo-400 transition-colors shrink-0"
                      >
                        {subtask.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-650" />
                        )}
                      </button>
                      <span className={`text-slate-350 truncate ${subtask.status === 'completed' ? 'line-through text-slate-500' : ''}`} title={subtask.title}>
                        {subtask.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[9px] text-slate-500 flex items-center gap-0.5 bg-slate-850 px-1.5 py-0.5 rounded border border-slate-800">
                        <Clock className="w-2.5 h-2.5" />
                        {subtask.estimated_time_minutes}m
                      </span>
                      <button 
                        onClick={() => onDeleteSubtask(subtask.id)}
                        className="text-slate-600 hover:text-red-400 p-0.5 rounded transition-all"
                        title="Delete subtask"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          task.status !== 'completed' && (
            <div className="mt-4 pt-3 border-t border-slate-800/50">
              <button
                onClick={handleAISubtaskGeneration}
                disabled={isGenerating}
                className="w-full py-2 bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <Sparkles className={`w-3.5 h-3.5 group-hover:animate-pulse ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'AI is breaking down task...' : 'Pilot Breakdown (AI Subtasks)'}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};
