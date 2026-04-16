import { useState, useEffect, useRef } from 'react';
import { createTask, fetchProjectTasks } from '../api';

export function TaskForm({ projects, userId, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [dueDate, setDueDate] = useState('');
  const [dependencyIds, setDependencyIds] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target)) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch tasks for selected project (for dependency dropdown)
  useEffect(() => {
    if (!projectId) return;
    fetchProjectTasks(projectId)
      .then(setProjectTasks)
      .catch(() => setProjectTasks([]));
  }, [projectId]);

  const handleProjectSelect = (id) => {
    setProjectId(id);
    setDependencyIds([]); // Reset deps when project changes
    setProjectDropdownOpen(false);
  };

  const toggleDependency = (taskId) => {
    setDependencyIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const data = {
        title: title.trim(),
        project_id: parseInt(projectId),
        assignee_id: userId,
        due_date: dueDate || null,
        dependency_ids: dependencyIds,
      };
      await createTask(data);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Task</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">Task Title</label>
            <input
              id="task-title"
              className="form-input"
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Project</label>
            <div className="custom-dropdown" ref={projectDropdownRef} style={{ width: '100%', display: 'block' }}>
              <button
                className="form-input"
                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                type="button"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}
              >
                <span>{projects.find((p) => p.id === projectId)?.name || 'Select Project...'}</span>
                <span className={`custom-dropdown-arrow ${projectDropdownOpen ? 'open' : ''}`}>▾</span>
              </button>

              {projectDropdownOpen && (
                <div className="custom-dropdown-menu" style={{ width: '100%', maxHeight: '200px', overflowY: 'auto' }}>
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      className={`custom-dropdown-item ${p.id === projectId ? 'active' : ''}`}
                      onClick={() => handleProjectSelect(p.id)}
                      type="button"
                    >
                      <span className="custom-dropdown-item-name">{p.name}</span>
                      {p.id === projectId && <span className="custom-dropdown-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-due-date">Due Date</label>
            <input
              id="task-due-date"
              className="form-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Dependencies</label>
            <p className="form-help">Select tasks that must be completed before this one can start</p>

            {dependencyIds.length > 0 && (
              <div className="selected-chips">
                {dependencyIds.map((depId) => {
                  const depTask = projectTasks.find((t) => t.id === depId);
                  return (
                    <span key={depId} className="chip">
                      {depTask?.title || `Task #${depId}`}
                      <button
                        type="button"
                        className="chip-remove"
                        onClick={() => toggleDependency(depId)}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <select
              className="form-select"
              multiple
              value={dependencyIds.map(String)}
              onChange={(e) => {
                const selected = parseInt(e.target.value);
                toggleDependency(selected);
              }}
            >
              {projectTasks.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                  style={dependencyIds.includes(t.id) ? {
                    background: 'var(--accent-glow)',
                    color: 'var(--accent-primary-light)'
                  } : {}}
                >
                  {t.title} {t.is_completed ? '✓' : ''}
                </option>
              ))}
            </select>

            {projectTasks.length === 0 && (
              <p className="form-help" style={{ marginTop: '0.5rem' }}>
                No tasks in this project yet
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !title.trim()}
          >
            {submitting ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </div>
    </div>
  );
}
