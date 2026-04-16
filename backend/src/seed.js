const db = require('./db');

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data (in reverse FK order)
  await db('task_dependencies').del();
  await db('tasks').del();
  await db('project_user').del();
  await db('projects').del();
  await db('users').del();

  // --- Users ---
  const [alice] = await db('users').insert({ name: 'Alice Johnson', email: 'alice@example.com' }).returning('id');
  const [bob] = await db('users').insert({ name: 'Bob Smith', email: 'bob@example.com' }).returning('id');
  const [carol] = await db('users').insert({ name: 'Carol Williams', email: 'carol@example.com' }).returning('id');

  const aliceId = alice.id || alice;
  const bobId = bob.id || bob;
  const carolId = carol.id || carol;

  console.log(`  Created users: Alice(${aliceId}), Bob(${bobId}), Carol(${carolId})`);

  // --- Projects ---
  const [projAlpha] = await db('projects').insert({ name: 'Project Alpha', description: 'Main product launch' }).returning('id');
  const [projBeta] = await db('projects').insert({ name: 'Project Beta', description: 'Internal tooling' }).returning('id');

  const alphaId = projAlpha.id || projAlpha;
  const betaId = projBeta.id || projBeta;

  console.log(`  Created projects: Alpha(${alphaId}), Beta(${betaId})`);

  // --- Project memberships ---
  await db('project_user').insert([
    { user_id: aliceId, project_id: alphaId },
    { user_id: aliceId, project_id: betaId },
    { user_id: bobId, project_id: alphaId },
    { user_id: carolId, project_id: betaId },
  ]);

  // --- Tasks for Project Alpha ---
  const [t1] = await db('tasks').insert({
    title: 'Write project spec',
    project_id: alphaId,
    assignee_id: aliceId,
    due_date: '2026-04-18',
    is_completed: true,
  }).returning('id');

  const [t2] = await db('tasks').insert({
    title: 'Design database schema',
    project_id: alphaId,
    assignee_id: aliceId,
    due_date: '2026-04-20',
    is_completed: false,
  }).returning('id');

  const [t3] = await db('tasks').insert({
    title: 'Implement API endpoints',
    project_id: alphaId,
    assignee_id: bobId,
    due_date: '2026-04-22',
    is_completed: false,
  }).returning('id');

  const [t4] = await db('tasks').insert({
    title: 'Write unit tests',
    project_id: alphaId,
    assignee_id: aliceId,
    due_date: '2026-04-25',
    is_completed: false,
  }).returning('id');

  const [t5] = await db('tasks').insert({
    title: 'Deploy to staging',
    project_id: alphaId,
    assignee_id: bobId,
    due_date: '2026-04-28',
    is_completed: false,
  }).returning('id');

  const [t9] = await db('tasks').insert({
    title: 'Security Audit',
    project_id: alphaId,
    assignee_id: aliceId,
    due_date: '2026-04-30',
    is_completed: false,
  }).returning('id');

  const t1Id = t1.id || t1;
  const t2Id = t2.id || t2;
  const t3Id = t3.id || t3;
  const t4Id = t4.id || t4;
  const t5Id = t5.id || t5;
  const t9Id = t9.id || t9;

  // --- Subtasks for "Design database schema" ---
  await db('tasks').insert([
    { title: 'Define entity relationships', project_id: alphaId, assignee_id: aliceId, parent_task_id: t2Id, due_date: '2026-04-19', is_completed: false },
    { title: 'Create ER diagram', project_id: alphaId, assignee_id: aliceId, parent_task_id: t2Id, due_date: '2026-04-19', is_completed: false },
  ]);

  // --- Tasks for Project Beta ---
  const [t6] = await db('tasks').insert({
    title: 'Setup CI/CD pipeline',
    project_id: betaId,
    assignee_id: aliceId,
    due_date: '2026-04-20',
    is_completed: false,
  }).returning('id');

  const [t7] = await db('tasks').insert({
    title: 'Configure monitoring',
    project_id: betaId,
    assignee_id: carolId,
    due_date: '2026-04-22',
    is_completed: false,
  }).returning('id');

  const [t8] = await db('tasks').insert({
    title: 'Write deployment docs',
    project_id: betaId,
    assignee_id: aliceId,
    due_date: '2026-04-24',
    is_completed: false,
  }).returning('id');

  const t6Id = t6.id || t6;
  const t7Id = t7.id || t7;
  const t8Id = t8.id || t8;

  // --- Dependencies ---
  await db('task_dependencies').insert([
    // "Design database schema" depends on "Write project spec" (completed → not blocked)
    { task_id: t2Id, dependency_id: t1Id },
    // "Implement API endpoints" depends on "Design database schema" (incomplete → blocked)
    { task_id: t3Id, dependency_id: t2Id },
    // "Write unit tests" depends on "Implement API endpoints" (incomplete → blocked)
    { task_id: t4Id, dependency_id: t3Id },
    // "Deploy to staging" depends on both "Implement API" and "Write tests" (both incomplete → blocked)
    { task_id: t5Id, dependency_id: t3Id },
    { task_id: t5Id, dependency_id: t4Id },
    // "Security Audit" depends on "Design DB" and "Implement API" (multiple blockages for Alice test)
    { task_id: t9Id, dependency_id: t2Id },
    { task_id: t9Id, dependency_id: t3Id },
    // Beta: "Write deployment docs" depends on "Setup CI/CD pipeline"
    { task_id: t8Id, dependency_id: t6Id },
    // Beta: "Configure monitoring" depends on "Setup CI/CD pipeline"
    { task_id: t7Id, dependency_id: t6Id },
  ]);

  console.log('  Created tasks with dependencies');
  console.log('✅ Seeding complete!');

  await db.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
