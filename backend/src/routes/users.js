const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/users/:id/dashboard
 *
 * Returns all projects and tasks assigned to a user.
 * For each task, includes is_blocked and blocked_by_titles.
 * Optimized to ≤3 database queries.
 */
router.get('/:id/dashboard', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Query 1: Get user info + their projects
    const userProjects = await db('users')
      .select(
        'users.id as user_id',
        'users.name as user_name',
        'users.email as user_email',
        'projects.id as project_id',
        'projects.name as project_name',
        'projects.description as project_description'
      )
      .join('project_user', 'users.id', 'project_user.user_id')
      .join('projects', 'projects.id', 'project_user.project_id')
      .where('users.id', userId);

    if (userProjects.length === 0) {
      return res.status(404).json({ error: 'User not found or has no projects' });
    }

    const user = {
      id: userProjects[0].user_id,
      name: userProjects[0].user_name,
      email: userProjects[0].user_email,
    };

    const projectIds = userProjects.map((row) => row.project_id);

    // Query 2: Get ALL tasks in the user's projects (need all for dependency resolution)
    const allTasks = await db('tasks')
      .select(
        'tasks.id',
        'tasks.title',
        'tasks.project_id',
        'tasks.assignee_id',
        'tasks.parent_task_id',
        'tasks.due_date',
        'tasks.is_completed',
        'tasks.created_at',
        'assignee.name as assignee_name'
      )
      .leftJoin('users as assignee', 'tasks.assignee_id', 'assignee.id')
      .whereIn('tasks.project_id', projectIds);

    // Query 3: Get all dependencies for tasks in these projects
    const allDeps = await db('task_dependencies')
      .select(
        'task_dependencies.task_id',
        'task_dependencies.dependency_id',
        'dep_task.title as dependency_title',
        'dep_task.is_completed as dependency_completed'
      )
      .join('tasks as dep_task', 'task_dependencies.dependency_id', 'dep_task.id')
      .join('tasks as main_task', 'task_dependencies.task_id', 'main_task.id')
      .whereIn('main_task.project_id', projectIds);

    // --- Post-processing in JS ---

    // Build dependency map: task_id -> [{ dependency_id, title, is_completed }]
    const depMap = {};
    for (const dep of allDeps) {
      if (!depMap[dep.task_id]) depMap[dep.task_id] = [];
      depMap[dep.task_id].push({
        dependency_id: dep.dependency_id,
        title: dep.dependency_title,
        is_completed: !!dep.dependency_completed,
      });
    }

    // Build task lookup and subtask grouping
    const taskMap = {};
    const subtasksByParent = {};

    for (const task of allTasks) {
      taskMap[task.id] = task;
      if (task.parent_task_id) {
        if (!subtasksByParent[task.parent_task_id]) subtasksByParent[task.parent_task_id] = [];
        subtasksByParent[task.parent_task_id].push({
          id: task.id,
          title: task.title,
          is_completed: !!task.is_completed,
          assignee_id: task.assignee_id,
          assignee_name: task.assignee_name,
          due_date: task.due_date,
        });
      }
    }

    // Build project structure
    const projectMap = {};
    for (const row of userProjects) {
      projectMap[row.project_id] = {
        id: row.project_id,
        name: row.project_name,
        description: row.project_description,
        tasks: [],
      };
    }

    // Populate tasks (only top-level, assigned to user)
    for (const task of allTasks) {
      if (task.parent_task_id) continue; // skip subtasks
      if (task.assignee_id !== userId) continue; // only user's tasks

      const deps = depMap[task.id] || [];
      const incompleteDeps = deps.filter((d) => !d.is_completed);

      const taskObj = {
        id: task.id,
        title: task.title,
        project_id: task.project_id,
        assignee_id: task.assignee_id,
        assignee_name: task.assignee_name,
        due_date: task.due_date,
        is_completed: !!task.is_completed,
        is_blocked: incompleteDeps.length > 0,
        blocked_by_titles: incompleteDeps.map((d) => d.title),
        dependencies: deps.map((d) => ({
          id: d.dependency_id,
          title: d.title,
          is_completed: d.is_completed,
        })),
        subtasks: subtasksByParent[task.id] || [],
      };

      if (projectMap[task.project_id]) {
        projectMap[task.project_id].tasks.push(taskObj);
      }
    }

    res.json({
      user,
      projects: Object.values(projectMap),
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users
 * List all users (for dropdowns)
 */
router.get('/', async (req, res) => {
  try {
    const users = await db('users').select('*');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
