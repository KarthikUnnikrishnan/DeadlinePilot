

const API_BASE_URL = import.meta.env.VITE_API_URL + "/api";

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  estimated_time_minutes: number;
  status: 'pending' | 'completed';
  order_index: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  deadline?: string; // ISO format string
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  subtasks: Subtask[];
  risk_level: 'none' | 'safe' | 'medium' | 'high' | 'critical';
  risk_message?: string;
}

export interface UserSettings {
  wake_time: string;
  sleep_time: string;
  peak_start: string;
  peak_end: string;
}

export interface ScheduleItem {
  id: number;
  time_slot: string;
  task_title: string;
  subtask_title: string;
  duration_minutes: number;
  reason: string;
  task_id?: number;
  subtask_id?: number;
  start_time?: string;
  end_time?: string;
}

export const api = {
  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${API_BASE_URL}/tasks`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  async createTask(task: { title: string; description?: string; deadline?: string; priority?: string }): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  async updateTask(taskId: number, updates: Partial<Task>): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },

  async deleteTask(taskId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete task');
  },

  async generateSubtasks(taskId: number): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/generate-subtasks`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to generate subtasks');
    return response.json();
  },

  async updateSubtask(subtaskId: number, updates: { title?: string; estimated_time_minutes?: number; status?: string; order_index?: number }): Promise<Subtask> {
    const response = await fetch(`${API_BASE_URL}/tasks/subtasks/${subtaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update subtask');
    return response.json();
  },

  async deleteSubtask(subtaskId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/subtasks/${subtaskId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete subtask');
  },

  async getSchedule(): Promise<ScheduleItem[]> {
    const response = await fetch(`${API_BASE_URL}/schedule`);
    if (!response.ok) throw new Error('Failed to fetch schedule');
    return response.json();
  },

  async getSettings(): Promise<UserSettings> {
    const response = await fetch(`${API_BASE_URL}/schedule/settings`);
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const response = await fetch(`${API_BASE_URL}/schedule/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
  }
};
