const pool = require('../config/database');

function mapWorkflowRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    workflowJson: row.workflow_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function listWorkflows(userId, limit = 20) {
  const query = `
    SELECT id, user_id, name, created_at, updated_at
    FROM user_workflows
    WHERE user_id = $1
    ORDER BY updated_at DESC
    LIMIT $2
  `;

  const result = await pool.query(query, [userId, limit]);
  return result.rows.map(mapWorkflowRow);
}

async function getWorkflow(workflowId, userId) {
  const query = `
    SELECT *
    FROM user_workflows
    WHERE id = $1 AND user_id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [workflowId, userId]);
  return mapWorkflowRow(result.rows[0]);
}

async function createWorkflow(userId, name, workflowJson) {
  const query = `
    INSERT INTO user_workflows (user_id, name, workflow_json)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const values = [
    userId,
    name || 'Untitled Workflow',
    workflowJson ? JSON.stringify(workflowJson) : JSON.stringify({})
  ];

  const result = await pool.query(query, values);
  return mapWorkflowRow(result.rows[0]);
}

async function updateWorkflow(workflowId, userId, name, workflowJson) {
  const query = `
    UPDATE user_workflows
    SET
      name = COALESCE($3, name),
      workflow_json = COALESCE($4, workflow_json),
      updated_at = NOW()
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;

  const values = [
    workflowId,
    userId,
    name || null,
    workflowJson ? JSON.stringify(workflowJson) : null
  ];

  const result = await pool.query(query, values);
  return mapWorkflowRow(result.rows[0]);
}

async function deleteWorkflow(workflowId, userId) {
  await pool.query(
    'DELETE FROM user_workflows WHERE id = $1 AND user_id = $2',
    [workflowId, userId]
  );
  return true;
}

module.exports = {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow
};


