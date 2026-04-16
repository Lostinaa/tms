import { useState } from 'react';
import { Tooltip } from './Tooltip';
import useStore from '../store/useStore';

export function TaskCard({ task }) {
  const [completing, setCompleting] = useState(false);
  const handleComplete = useStore((s) => s.handleComplete);

  const onComplete = async () => {
    setCompleting(true);
    try {
      await handleComplete(task.id);
    } finally {
      setCompleting(false);
    }
  };

  const statusClass = task.is_completed
    ? 'completed'
    : task.is_blocked
      ? 'blocked'
      : '';

  const dueDateStr = task.due_date
    ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const isOverdue = task.due_date && !task.is_completed &&
    new Date(task.due_date + 'T00:00:00') < new Date();

  return (
    <div className={`task-card ${statusClass}`} id={`task-${task.id}`}>
      <div className="task-card-top">
        <div className="task-info">
          <div className="task-title-row">
            <span className="task-title">{task.title}</span>
            {task.is_completed && (
              <span className="task-badge complete">Done</span>
            )}
            {task.is_blocked && !task.is_completed && (
              <Tooltip blockedByTitles={task.blocked_by_titles}>
                <span className="task-badge blocked">Blocked</span>
              </Tooltip>
            )}
          </div>
          <div className="task-meta">
            {dueDateStr && (
              <span className="task-meta-item" style={isOverdue ? { color: 'var(--color-blocked)' } : {}}>
                📅 {dueDateStr}{isOverdue ? ' (overdue)' : ''}
              </span>
            )}
            {task.assignee_name && (
              <span className="task-meta-item">👤 {task.assignee_name}</span>
            )}
            {task.dependencies && task.dependencies.length > 0 && (
              <span className="task-meta-item">
                🔗 {task.dependencies.length} dep{task.dependencies.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="task-actions">
          {!task.is_completed && (
            <button
              className="btn-complete"
              onClick={onComplete}
              disabled={completing || task.is_blocked}
              title={task.is_blocked ? 'Cannot complete: dependencies not met' : 'Mark as complete'}
            >
              {completing ? 'Completing...' : '✓ Complete'}
            </button>
          )}
        </div>
      </div>

      {task.subtasks && task.subtasks.length > 0 && (
        <div className="subtasks">
          <div className="subtasks-label">
            Subtasks ({task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length})
          </div>
          {task.subtasks.map((sub) => (
            <div key={sub.id} className={`subtask-item ${sub.is_completed ? 'complete' : ''}`}>
              <span className={`subtask-dot ${sub.is_completed ? 'complete' : ''}`} />
              {sub.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
