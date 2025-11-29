const pool = require('../config/database');

function mapConversationRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: row.metadata,
    lastMessagePreview: row.last_message_preview || null
  };
}

function mapMessageRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    metadata: row.metadata,
    createdAt: row.created_at
  };
}

async function listConversations(userId, limit = 25) {
  const query = `
    SELECT c.*,
      (
        SELECT content
        FROM assistant_messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) AS last_message_preview
    FROM assistant_conversations c
    WHERE c.user_id = $1
    ORDER BY c.updated_at DESC
    LIMIT $2
  `;

  const result = await pool.query(query, [userId, limit]);
  return result.rows.map(mapConversationRow);
}

async function createConversation(userId, title, metadata = null) {
  const query = `
    INSERT INTO assistant_conversations (user_id, title, metadata)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const result = await pool.query(query, [
    userId,
    title || 'New Conversation',
    metadata ? JSON.stringify(metadata) : null
  ]);

  return mapConversationRow(result.rows[0]);
}

async function getConversation(conversationId, userId) {
  const query = `
    SELECT *
    FROM assistant_conversations
    WHERE id = $1 AND user_id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [conversationId, userId]);
  return mapConversationRow(result.rows[0]);
}

async function getConversationMessages(conversationId, userId, limit = 200) {
  const query = `
    SELECT m.*
    FROM assistant_messages m
    INNER JOIN assistant_conversations c ON c.id = m.conversation_id
    WHERE m.conversation_id = $1
      AND c.user_id = $2
    ORDER BY m.created_at ASC
    LIMIT $3
  `;

  const result = await pool.query(query, [conversationId, userId, limit]);
  return result.rows.map(mapMessageRow);
}

async function addMessage(conversationId, userId, role, content, metadata = null) {
  // Ensure conversation belongs to user
  const conversation = await getConversation(conversationId, userId);
  if (!conversation) {
    return null;
  }

  const query = `
    INSERT INTO assistant_messages (conversation_id, role, content, metadata)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const result = await pool.query(query, [
    conversationId,
    role,
    content,
    metadata ? JSON.stringify(metadata) : null
  ]);

  return mapMessageRow(result.rows[0]);
}

async function deleteConversation(conversationId, userId) {
  await pool.query(
    'DELETE FROM assistant_conversations WHERE id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  return true;
}

module.exports = {
  listConversations,
  createConversation,
  getConversation,
  getConversationMessages,
  addMessage,
  deleteConversation
};

