const {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow
} = require('../database/workflowQueries');

function ensureUser(req, res) {
  if (!req.user || !req.user.id) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return null;
  }
  return req.user.id;
}

async function listUserWorkflows(req, res) {
  const userId = ensureUser(req, res);
  if (!userId) return;

  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const workflows = await listWorkflows(userId, limit);
    res.json({ success: true, workflows });
  } catch (error) {
    console.error('[WorkflowLibrary] Failed to list workflows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load workflows',
      message: error.message
    });
  }
}

async function createUserWorkflow(req, res) {
  const userId = ensureUser(req, res);
  if (!userId) return;

  try {
    const { name, workflow } = req.body;

    if (!workflow || typeof workflow !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid workflow payload'
      });
    }

    const sanitizedName = (name && name.trim()) || 'Untitled Workflow';
    const newWorkflow = await createWorkflow(userId, sanitizedName, workflow);

    res.status(201).json({ success: true, workflow: newWorkflow });
  } catch (error) {
    console.error('[WorkflowLibrary] Failed to create workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save workflow',
      message: error.message
    });
  }
}

async function getUserWorkflow(req, res) {
  const userId = ensureUser(req, res);
  if (!userId) return;

  try {
    const { workflowId } = req.params;
    const workflow = await getWorkflow(workflowId, userId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    res.json({ success: true, workflow });
  } catch (error) {
    console.error('[WorkflowLibrary] Failed to load workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load workflow',
      message: error.message
    });
  }
}

async function updateUserWorkflow(req, res) {
  const userId = ensureUser(req, res);
  if (!userId) return;

  try {
    const { workflowId } = req.params;
    const { name, workflow } = req.body;

    const existing = await getWorkflow(workflowId, userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    const updated = await updateWorkflow(
      workflowId,
      userId,
      name ? name.trim() : null,
      workflow && typeof workflow === 'object' ? workflow : null
    );

    res.json({ success: true, workflow: updated });
  } catch (error) {
    console.error('[WorkflowLibrary] Failed to update workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workflow',
      message: error.message
    });
  }
}

async function deleteUserWorkflow(req, res) {
  const userId = ensureUser(req, res);
  if (!userId) return;

  try {
    const { workflowId } = req.params;
    const existing = await getWorkflow(workflowId, userId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    await deleteWorkflow(workflowId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('[WorkflowLibrary] Failed to delete workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete workflow',
      message: error.message
    });
  }
}

module.exports = {
  listUserWorkflows,
  createUserWorkflow,
  getUserWorkflow,
  updateUserWorkflow,
  deleteUserWorkflow
};


