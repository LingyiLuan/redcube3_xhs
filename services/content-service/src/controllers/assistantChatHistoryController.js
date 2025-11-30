const {
  listConversations,
  createConversation,
  getConversation,
  getConversationMessages,
  addMessage,
  deleteConversation
} = require('../database/assistantChatQueries');

function ensureUser(req, res) {
  if (!req.user || !req.user.id) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return null;
  }
  return req.user.id;
}

async function listUserChats(req, res) {
  const userId = ensureUser(req, res);
  if (!userId) return;

  try {
    const chats = await listConversations(userId);
    res.json({ success: true, chats });
  } catch (error) {
    console.error('[AssistantChat] Failed to list chats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load assistant chats',
      message: error.message
    });
  }
}

async function createUserChat(req, res) {
  const userId = ensureUser(req, res);
  if (!userId) return;

  try {
    const { title } = req.body;
    const chat = await createConversation(userId, title);
    res.status(201).json({ success: true, chat });
  } catch (error) {
    console.error('[AssistantChat] Failed to create chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start conversation',
      message: error.message
    });
  }
}

async function getUserChat(req, res) {
  const userId = ensureUser(req, res);
  if (!userId) return;

  try {
    const { chatId } = req.params;
    const chat = await getConversation(chatId, userId);

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const messages = await getConversationMessages(chatId, userId);
    res.json({ success: true, chat, messages });
  } catch (error) {
    console.error('[AssistantChat] Failed to load chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load conversation',
      message: error.message
    });
  }
}

async function appendChatMessage(req, res) {
  const userId = ensureUser(req, res);
  if (!userId) return;

  try {
    const { chatId } = req.params;
    const { role, content, metadata } = req.body;

    if (!role || !content) {
      return res.status(400).json({ success: false, error: 'role and content are required' });
    }

    const chat = await getConversation(chatId, userId);
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const message = await addMessage(chatId, userId, role, content, metadata);
    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('[AssistantChat] Failed to append message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save message',
      message: error.message
    });
  }
}

async function deleteUserChat(req, res) {
  const userId = ensureUser(req, res);
  if (!userId) return;

  try {
    const { chatId } = req.params;
    const chat = await getConversation(chatId, userId);
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    await deleteConversation(chatId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('[AssistantChat] Failed to delete chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation',
      message: error.message
    });
  }
}

module.exports = {
  listUserChats,
  createUserChat,
  getUserChat,
  appendChatMessage,
  deleteUserChat
};


