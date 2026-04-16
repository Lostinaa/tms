import { useState } from 'react';
import { TaskCard } from './TaskCard';

const PROJECT_ICONS = ['🚀', '⚡', '🎯', '🔮', '💎', '🌟'];

export function ProjectSection({ project, index }) {
  const [collapsed, setCollapsed] = useState(false);

  const completedCount = project.tasks.filter((t) => t.is_completed).length;
  const blockedCount = project.tasks.filter((t) => t.is_blocked && !t.is_completed).length;
  const icon = PROJECT_ICONS[index % PROJECT_ICONS.length];

  return (
    <div className="project-section">
      <div className="project-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="project-header-left">
          <div className="project-icon">{icon}</div>
          <div>
            <div className="project-name">{project.name}</div>
            <div className="project-meta">
              {project.tasks.length} task{project.tasks.length !== 1 ? 's' : ''}
              {completedCount > 0 && ` · ${completedCount} done`}
              {blockedCount > 0 && ` · ${blockedCount} blocked`}
            </div>
          </div>
        </div>
        <span className={`project-toggle ${collapsed ? 'collapsed' : ''}`}>▼</span>
      </div>

      {!collapsed && (
        <div className="project-tasks">
          {project.tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-text">No tasks assigned to you in this project</div>
            </div>
          ) : (
            project.tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
