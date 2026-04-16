const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * POST /api/tasks
 *
 * Create a new task with optional dependencies.
 * Body: { title, project_id, assignee_id, due_date, parent_task_id?, dependency_ids? }
 */
router.post('/', async (req, res) => {
  try {
    const { title, project_id, assignee_id, due_date, parent_task_id, dependency_ids } = req.body;

    // Validation
    if (!title || !project_id) {
      return res.status(400).json({ error: 'title and project_id are required' });
    }

    // Verify project exists
    const project = await db('projects').where('id', project_id).first();
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify assignee is a member of the project
    if (assignee_id) {
      const membership = await db('project_user')
        .where({ user_id: assignee_id, project_id })
        .first();
      if (!membership) {
        return res.status(400).json({ error: 'Assignee is not a member of this project' });
      }
    }

    // Validate parent task (subtask constraint)
    if (parent_task_id) {
      const parentTask = await db('tasks').where('id', parent_task_id).first();
      if (!parentTask) {
        return res.status(400).json({ error: 'Parent task not found' });
      }
      if (parentTask.parent_task_id) {
        return res.status(400).json({ error: 'Cannot nest subtasks more than 1 level deep' });
      }
      if (parentTask.project_id !== project_id) {
        return res.status(400).json({ error: 'Parent task must be in the same project' });
      }
    }

    // Validate dependencies belong to same project
    if (dependency_ids && dependency_ids.length > 0) {
      const depTasks = await db('tasks')
        .whereIn('id', dependency_ids)
        .select('id', 'project_id');

      if (depTasks.length !== dependency_ids.length) {
        return res.status(400).json({ error: 'One or more dependency tasks not found' });
      }

      const invalidDeps = depTasks.filter((t) => t.project_id !== project_id);
      if (invalidDeps.length > 0) {
        return res.status(400).json({ error: 'All dependencies must be in the same project' });
      }
    }

    // Create the task
    const [inserted] = await db('tasks').insert({
      title,
      project_id,
      assignee_id: assignee_id || null,
      parent_task_id: parent_task_id || null,
      due_date: due_date || null,
      is_completed: false,
    }).returning('*');

    const taskId = inserted.id || inserted;

    // Insert dependencies
    if (dependency_ids && dependency_ids.length > 0) {
      const depRows = dependency_ids.map((depId) => ({
        task_id: taskId,
        dependency_id: depId,
      }));
      await db('task_dependencies').insert(depRows);
    }

    // Fetch the created task with full info
    const task = await db('tasks')
      .select('tasks.*', 'users.name as assignee_name')
      .leftJoin('users', 'tasks.assignee_id', 'users.id')
      .where('tasks.id', taskId)
      .first();

    // Fetch dependencies info
    const deps = await db('task_dependencies')
      .select('task_dependencies.*', 'tasks.title as dependency_title', 'tasks.is_completed as dependency_completed')
      .join('tasks', 'task_dependencies.dependency_id', 'tasks.id')
      .where('task_dependencies.task_id', taskId);

    const incompleteDeps = deps.filter((d) => !d.dependency_completed);

    res.status(201).json({
      ...task,
      is_blocked: incompleteDeps.length > 0,
      blocked_by_titles: incompleteDeps.map((d) => d.dependency_title),
      dependencies: deps.map((d) => ({
        id: d.dependency_id,
        title: d.dependency_title,
        is_completed: !!d.dependency_completed,
      })),
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/tasks/:id/complete
 *
 * Mark a task as complete.
 * Returns the completed task and any tasks that were blocked by it and are now unblocked.
 */
router.put('/:id/complete', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);

    const task = await db('tasks').where('id', taskId).first();
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.is_completed) {
      return res.status(400).json({ error: 'Task is already completed' });
    }

    // Mark as complete
    await db('tasks').where('id', taskId).update({ is_completed: true });

    // Find tasks that depend on this one
    const dependentTaskIds = await db('task_dependencies')
      .where('dependency_id', taskId)
      .select('task_id');

    const dependentIds = dependentTaskIds.map((r) => r.task_id);

    // Check which of those are now fully unblocked
    const newlyUnblocked = [];

    if (dependentIds.length > 0) {
      for (const depTaskId of dependentIds) {
        // Get all dependencies for this dependent task
        const allDeps = await db('task_dependencies')
          .join('tasks', 'task_dependencies.dependency_id', 'tasks.id')
          .where('task_dependencies.task_id', depTaskId)
          .select('tasks.id', 'tasks.is_completed');

        // Check if ALL dependencies are now complete
        // (the current task was just marked complete, so treat it as completed)
        const allComplete = allDeps.every(
          (d) => d.id === taskId || !!d.is_completed
        );

        if (allComplete) {
          const unblockedTask = await db('tasks')
            .where('id', depTaskId)
            .select('id', 'title')
            .first();
          if (unblockedTask) {
            newlyUnblocked.push(unblockedTask);
          }
        }
      }
    }

    res.json({
      completed_task: { id: taskId, title: task.title },
      newly_unblocked: newlyUnblocked,
    });
  } catch (err) {
    console.error('Complete task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tasks/project/:projectId
 * Get all tasks for a project (for dependency dropdown)
 */
router.get('/project/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const tasks = await db('tasks')
      .where({ project_id: projectId, parent_task_id: null })
      .select('id', 'title', 'is_completed');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
