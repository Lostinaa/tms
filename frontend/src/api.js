const API_BASE = 'http://localhost:3001/api';

export async function fetchDashboard(userId) {
  const res = await fetch(`${API_BASE}/users/${userId}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

export async function createTask(taskData) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create task');
  }
  return res.json();
}

export async function completeTask(taskId) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
    method: 'PUT',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to complete task');
  }
  return res.json();
}

export async function fetchProjectTasks(projectId) {
  const res = await fetch(`${API_BASE}/tasks/project/${projectId}`);
  if (!res.ok) throw new Error('Failed to fetch project tasks');
  return res.json();
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}
