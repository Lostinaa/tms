import useStore from '../store/useStore';
import { ProjectSection } from './ProjectSection';
import { TaskForm } from './TaskForm';
import { Toast } from './Toast';
import { UserDropdown } from './UserDropdown';
import { useEffect } from 'react';

export function Dashboard() {
  const userId = useStore((s) => s.userId);
  const setUserId = useStore((s) => s.setUserId);
  const users = useStore((s) => s.users);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const data = useStore((s) => s.data);
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const showForm = useStore((s) => s.showForm);
  const setShowForm = useStore((s) => s.setShowForm);
  const toasts = useStore((s) => s.toasts);
  const dismissToast = useStore((s) => s.dismissToast);
  const handleComplete = useStore((s) => s.handleComplete);
  const handleTaskCreated = useStore((s) => s.handleTaskCreated);
  const loadDashboard = useStore((s) => s.loadDashboard);
  const loadUsers = useStore((s) => s.loadUsers);
  const getStats = useStore((s) => s.getStats);

  const stats = getStats();

  // Initial data load
  useEffect(() => {
    loadUsers();
    loadDashboard();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="header-logo">T</div>
            <h1 className="header-title">TaskFlow</h1>
          </div>
          <div className="header-user">
            <button 
              className="header-user-select" 
              onClick={toggleTheme}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', border: 'none', background: 'transparent' }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <UserDropdown />
            <div className="user-avatar">
              {data?.user?.name?.charAt(0) || '?'}
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="loading-spinner" />
            <div className="loading-text">Loading your dashboard...</div>
          </div>
        ) : data ? (
          <>
            {/* Stats */}
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-label">Total Tasks</div>
                <div className="stat-value">{stats.total}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Completed</div>
                <div className="stat-value complete">{stats.completed}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Blocked</div>
                <div className="stat-value blocked">{stats.blocked}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">In Progress</div>
                <div className="stat-value">{stats.pending}</div>
              </div>
            </div>

            {/* Add Task Button */}
            <div style={{ marginBottom: '1.5rem' }}>
              <button
                className="btn-add-task"
                onClick={() => setShowForm(true)}
              >
                <span style={{ fontSize: '1.2rem' }}>+</span>
                New Task
              </button>
            </div>

            {/* Projects & Tasks */}
            {data.projects.map((project, i) => (
              <ProjectSection
                key={project.id}
                project={project}
                index={i}
              />
            ))}

            {data.projects.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">No projects found</div>
              </div>
            )}
          </>
        ) : null}
      </main>

      {/* Task Creation Modal */}
      {showForm && data && (
        <TaskForm
          projects={data.projects}
          userId={userId}
          onClose={() => setShowForm(false)}
          onCreated={handleTaskCreated}
        />
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
