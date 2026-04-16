/**
 * Creates all tables for the Task Manager with Dependencies.
 *
 * Tables:
 *  - users
 *  - projects
 *  - project_user (many-to-many join)
 *  - tasks (with optional parent_task_id for subtasks)
 *  - task_dependencies (many-to-many self-reference)
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').notNullable().unique();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('projects', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('description');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('project_user', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable()
        .references('id').inTable('users').onDelete('CASCADE');
      table.integer('project_id').unsigned().notNullable()
        .references('id').inTable('projects').onDelete('CASCADE');
      table.unique(['user_id', 'project_id']);
    })
    .createTable('tasks', (table) => {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.integer('project_id').unsigned().notNullable()
        .references('id').inTable('projects').onDelete('CASCADE');
      table.integer('assignee_id').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.integer('parent_task_id').unsigned()
        .references('id').inTable('tasks').onDelete('CASCADE');
      table.date('due_date');
      table.boolean('is_completed').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('task_dependencies', (table) => {
      table.increments('id').primary();
      table.integer('task_id').unsigned().notNullable()
        .references('id').inTable('tasks').onDelete('CASCADE');
      table.integer('dependency_id').unsigned().notNullable()
        .references('id').inTable('tasks').onDelete('CASCADE');
      table.unique(['task_id', 'dependency_id']);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('task_dependencies')
    .dropTableIfExists('tasks')
    .dropTableIfExists('project_user')
    .dropTableIfExists('projects')
    .dropTableIfExists('users');
};
