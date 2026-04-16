import { create } from 'zustand';
import { fetchDashboard, completeTask as apiCompleteTask, fetchUsers, createTask as apiCreateTask } from '../api';

/**
 * Global Zustand store for the Task Manager application.
 * 
 * Slices:
 *  - User & Theme (userId, users, theme)
 *  - Dashboard (data, loading, error, stats)
 *  - UI (showForm, toasts)
 *  - Actions (loadDashboard, handleComplete, handleTaskCreated, etc.)
 */
const useStore = create((set, get) => ({
  // ========== User & Theme ==========
  userId: 1,
  users: [],
  theme: localStorage.getItem('theme') || 'dark',

  setUserId: (id) => {
    set({ userId: id });
    // Auto-reload dashboard on user change
    get().loadDashboard(id);
  },

  loadUsers: async () => {
    try {
      const users = await fetchUsers();
      set({ users });
    } catch {
      // Silently fail — users dropdown stays empty
    }
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    set({ theme: newTheme });
  },

  // ========== Dashboard Data ==========
  data: null,
  loading: true,
  error: '',

  loadDashboard: async (overrideUserId) => {
    const userId = overrideUserId || get().userId;
    set({ loading: true, error: '' });
    try {
      const result = await fetchDashboard(userId);
      set({ data: result, loading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to load dashboard', loading: false });
    }
  },

  // ========== Computed Stats ==========
  getStats: () => {
    const data = get().data;
    const allTasks = data?.projects?.flatMap((p) => p.tasks) || [];
    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.is_completed).length;
    const blocked = allTasks.filter((t) => t.is_blocked && !t.is_completed).length;
    return {
      total,
      completed,
      blocked,
      pending: total - completed - blocked,
    };
  },

  // ========== Task Actions ==========
  handleComplete: async (taskId) => {
    const { addToast, loadDashboard } = get();
    try {
      const result = await apiCompleteTask(taskId);

      if (result.newly_unblocked.length > 0) {
        const names = result.newly_unblocked.map((t) => t.title).join(', ');
        addToast('✅ Task Completed!', `Unblocked: ${names}`);
      } else {
        addToast('✅ Task Completed!', `"${result.completed_task.title}" marked as done`);
      }

      await loadDashboard();
    } catch (err) {
      addToast('❌ Error', err.message || 'Failed to complete task');
    }
  },

  handleTaskCreated: () => {
    const { addToast, loadDashboard } = get();
    addToast('🎉 Task Created!', 'New task has been added successfully');
    loadDashboard();
    set({ showForm: false });
  },

  // ========== UI State ==========
  showForm: false,
  setShowForm: (show) => set({ showForm: show }),

  // ========== Toast Notifications ==========
  toasts: [],

  addToast: (title, message) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts, { id, title, message }],
    }));

    // Auto-remove after 5.5s
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5500);
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export default useStore;
