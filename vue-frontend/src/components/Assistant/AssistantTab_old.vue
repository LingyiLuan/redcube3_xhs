<template>
  <div class="assistant-tab">
    <template v-if="!isAuthenticated">
      <div class="assistant-auth-gate">
        <Sparkles :size="36" />
        <h4>Sign in to use the AI assistant</h4>
        <p>Keep your chat history synced across sessions and trigger workflows from conversations.</p>
        <button class="login-btn" @click="openLoginModal">Sign in</button>
      </div>
    </template>
    <template v-else>
      <div class="assistant-layout">
        <div class="chat-panel">
          <div class="assistant-header">
            <h3>AI Assistant</h3>
            <div class="header-actions">
              <button
                @click="toggleHistoryModal"
                class="history-btn"
                :title="`History (${chats.length})`"
              >
                <FileText :size="16" />
                <span v-if="chats.length > 0" class="history-count">{{ chats.length }}</span>
              </button>
              <button
                v-if="messages.length > 0"
                @click="clearChat"
                class="clear-btn"
                title="Clear chat history"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>

          <div class="messages-container" ref="scrollableContent">
            <div v-if="messages.length === 0" class="empty-state">
              <h4 class="empty-greeting">How can I help you?</h4>
              <div class="prompt-cards">
                <button
                  v-for="prompt in suggestedPrompts"
                  :key="prompt"
                  class="prompt-card"
                  @click="sendMessage(prompt)"
                >
                  {{ prompt }}
                </button>
              </div>
            </div>
            <div v-else class="messages-list">
              <MessageBubble
                v-for="message in messages"
                :key="message.id"
                :message="message"
              />
            </div>
          </div>

          <div class="input-section">
            <MessageInput
              v-model="userInput"
              :is-loading="isLoading"
              @send="handleSendMessage"
            />
          </div>
        </div>
      </div>

      <!-- History Modal -->
      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showHistoryModal" class="history-modal-overlay" @click="closeHistoryModal">
            <div class="history-modal-content" @click.stop>
              <div class="history-modal-header">
                <h3>Conversation History</h3>
                <button @click="closeHistoryModal" class="close-modal-btn">
                  <X :size="20" />
                </button>
              </div>
              <div class="history-modal-body">
                <button class="new-chat-modal-btn" @click="handleNewChatFromModal">
                  <Plus :size="16" />
                  <span>New Chat</span>
                </button>
                <div v-if="chats.length === 0" class="history-empty-modal">
                  No conversation history yet. Start a new chat to begin.
                </div>
                <div v-else class="history-list-modal">
                  <button
                    v-for="chat in chats"
                    :key="chat.id"
                    :class="['history-item-modal', { active: chat.id === activeChatId }]"
                    @click="selectChatFromModal(chat.id)"
                  >
                    <div class="history-item-main-modal">
                      <span class="history-title-modal">{{ chat.title }}</span>
                      <span class="history-meta-modal">{{ formatTimestamp(chat.updatedAt) }}</span>
                    </div>
                    <p class="history-preview-modal">{{ chat.lastMessagePreview || 'No messages yet' }}</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Sparkles, Trash2, FileText, X, Plus } from 'lucide-vue-next'
import MessageBubble from './MessageBubble.vue'
import MessageInput from './MessageInput.vue'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useUIStore } from '@/stores/uiStore'
import { useAssistantChatStore } from '@/stores/assistantChatStore'
import { useAuthStore } from '@/stores/authStore'
import { useEventBus } from '@/utils/eventBus'
import { assistantService } from '@/services/assistantService'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const router = useRouter()
const workflowStore = useWorkflowStore()
const uiStore = useUIStore()
const assistantChatStore = useAssistantChatStore()
const authStore = useAuthStore()
const eventBus = useEventBus()

const userInput = ref('')
const isLoading = ref(false)
const scrollableContent = ref<HTMLElement | null>(null)
const showHistoryModal = ref(false)

const suggestedPrompts = [
  'Show me Amazon SWE interviews',
  'How do I create a learning map?',
  'What are the best Google interview prep tips?',
  'Analyze Meta system design questions'
]

const isAuthenticated = computed(() => authStore.isAuthenticated)
const chats = computed(() => assistantChatStore.chats)
const activeChatId = computed(() => assistantChatStore.activeChatId)
const messages = computed(() => assistantChatStore.messages)

onMounted(() => {
  if (isAuthenticated.value) {
    assistantChatStore.fetchChats()
  }
})

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    assistantChatStore.fetchChats()
  } else {
    assistantChatStore.reset()
  }
})

function openLoginModal() {
  eventBus.emit('open-login-modal')
}

function toggleHistoryModal() {
  showHistoryModal.value = !showHistoryModal.value
}

function closeHistoryModal() {
  showHistoryModal.value = false
}

async function handleNewChat() {
  if (!isAuthenticated.value) {
    openLoginModal()
    return
  }
  await assistantChatStore.startNewChat()
}

async function handleNewChatFromModal() {
  closeHistoryModal()
  await handleNewChat()
}

async function selectChat(chatId: number) {
  if (chatId === activeChatId.value) return
  try {
    await assistantChatStore.loadChat(chatId)
    await nextTick()
    scrollToBottom()
  } catch (error) {
    // Toast already surfaced
  }
}

async function selectChatFromModal(chatId: number) {
  closeHistoryModal()
  await selectChat(chatId)
}

// Send message
async function handleSendMessage() {
  if (!isAuthenticated.value) {
    openLoginModal()
    return
  }

  if (!userInput.value.trim() || isLoading.value) return

  const userContent = userInput.value.trim()
  userInput.value = ''

  await assistantChatStore.appendMessage('user', userContent)
  scrollToBottom()

  isLoading.value = true
  try {
    const data = await assistantService.query(userContent)

    const assistantText = data.response || data.message || 'Sorry, I encountered an error. Please try again.'
    await assistantChatStore.appendMessage('assistant', assistantText, {
      actions: data.actions,
      type: data.type
    })
    scrollToBottom()

    if (data.actions && data.actions.length > 0) {
      await handleActions(data.actions, data.type || 'general')
    }
  } catch (error) {
    console.error('[AssistantTab] Failed to send message:', error)
    await assistantChatStore.appendMessage(
      'assistant',
      'Sorry, I encountered an error connecting to the assistant. Please try again.'
    )
  } finally {
    isLoading.value = false
  }
}

// Handle assistant actions
async function handleActions(actions: any[], type: string) {
  console.log('[AssistantTab] Handling actions:', actions, 'Type:', type)

  for (const action of actions) {
    if (action.type === 'execute_workflow') {
      await executeWorkflow(action.data)
    }
  }
}

// Execute autonomous workflow
async function executeWorkflow(workflowData: any) {
  console.log('[AssistantTab] Executing workflow:', workflowData)

  const { posts, analysisType, autoExecute } = workflowData

  if (!posts || posts.length === 0) {
    uiStore.showToast('No posts found for workflow', 'warning')
    return
  }

  await router.push('/workflow')
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 500))

  const baseX = 100
  const baseY = 100
  const rowSpacing = 100
  const addedNodeIds: string[] = []

  posts.forEach((post: any, index: number) => {
    const position = {
      x: baseX,
      y: baseY + (index * rowSpacing)
    }

    const newNode = workflowStore.addNode({
      type: 'input',
      position,
      data: {
        label: post.title || 'Reddit Post',
        content: post.body_text || post.title || '',
        redditUrl: post.url || `https://reddit.com/r/cscareerquestions/comments/${post.post_id}`,
        postId: post.post_id,
        company: post.company,
        role: post.role_type,
        level: post.level,
        outcome: post.outcome
      }
    })

    if (newNode && newNode.id) {
      addedNodeIds.push(newNode.id)
    }
  })

  uiStore.showToast(`Added ${posts.length} posts to canvas`, 'success')

  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 500))

  const analysisX = baseX + 400
  const analysisY = baseY + (posts.length * rowSpacing) / 2 - 100

  const analysisNode = workflowStore.addNode({
    type: 'analysis',
    position: { x: analysisX, y: analysisY },
    data: {
      label: 'Analysis',
      status: 'idle'
    }
  })

  const analysisNodeId = analysisNode?.id

  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 300))

  if (analysisNodeId) {
    for (const inputNodeId of addedNodeIds) {
      workflowStore.addEdge({
        source: inputNodeId,
        target: analysisNodeId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'default'
      })
    }
  }

  if (autoExecute && analysisNodeId) {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 800))

    const addedNodes = workflowStore.nodes.filter(node => addedNodeIds.includes(node.id))

    if (addedNodes.length === 0) {
      uiStore.showToast('No nodes found to analyze', 'error')
      return
    }

    workflowStore.updateNodeData(analysisNodeId, { status: 'analyzing' })

    try {
      const result = await workflowStore.executeBatchAnalysis(addedNodes)

      if (!result) {
        console.warn('[AssistantTab] Analysis was cancelled or returned null')
        return
      }

      workflowStore.updateNodeData(analysisNodeId, {
        status: 'completed',
        analysisResult: result
      })

      workflowStore.createResultsNode(analysisNodeId, result)
      uiStore.showToast('Analysis complete!', 'success')
    } catch (error) {
      console.error('[AssistantTab] Analysis failed:', error)
      workflowStore.updateNodeData(analysisNodeId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Analysis failed'
      })
      uiStore.showToast('Analysis failed', 'error')
    }
  }
}

function sendMessage(prompt: string) {
  userInput.value = prompt
  handleSendMessage()
}

async function scrollToBottom() {
  await nextTick()
  if (scrollableContent.value) {
    scrollableContent.value.scrollTop = scrollableContent.value.scrollHeight
  }
}

async function clearChat() {
  if (!isAuthenticated.value) {
    openLoginModal()
    return
  }
  await assistantChatStore.deleteActiveChat()
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.assistant-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #FFFFFF;
}

.assistant-layout {
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  overflow: hidden;
}

.assistant-header {
  flex-shrink: 0;
  padding: 12px 16px;
  border-bottom: 2px solid #000;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.assistant-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-btn {
  position: relative;
  background: transparent;
  border: 2px solid #000;
  color: #000;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
  font-weight: 600;
}

.history-btn:hover {
  background: #000;
  color: #fff;
}

.history-count {
  font-size: 11px;
  font-weight: 700;
}

.clear-btn {
  background: transparent;
  border: 2px solid #000;
  color: #000;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.clear-btn:hover {
  background: #EF4444;
  border-color: #EF4444;
  color: #fff;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 16px 16px 16px;
}

.empty-greeting {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 24px 0;
}

.prompt-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 280px;
}

.prompt-card {
  padding: 14px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  background: #FFFFFF;
  color: #374151;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.prompt-card:hover {
  border-color: #111827;
  background: #F9FAFB;
  color: #111827;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 16px;
}

.input-section {
  flex-shrink: 0;
  padding: 12px;
  border-top: 2px solid #000;
  background: #FFFFFF;
}

/* History Modal Styles */
.history-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.history-modal-content {
  position: relative;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  background: white;
  border: 3px solid #000;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 2px solid #000;
  background: #fff;
}

.history-modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.close-modal-btn {
  background: transparent;
  border: 2px solid #000;
  color: #000;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.close-modal-btn:hover {
  background: #000;
  color: #fff;
}

.history-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.new-chat-modal-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px solid #000;
  background: #000;
  color: #fff;
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.15s ease;
}

.new-chat-modal-btn:hover {
  background: #fff;
  color: #000;
}

.history-empty-modal {
  text-align: center;
  padding: 48px 24px;
  color: #666;
  font-size: 14px;
}

.history-list-modal {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item-modal {
  border: 2px solid #000;
  border-radius: 4px;
  padding: 12px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.history-item-modal:hover {
  background: #f5f5f5;
}

.history-item-modal.active {
  background: #000;
  color: #fff;
}

.history-item-main-modal {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}

.history-title-modal {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.history-meta-modal {
  font-size: 11px;
  font-weight: 600;
  opacity: 0.6;
}

.history-preview-modal {
  margin: 0;
  font-size: 12px;
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item-modal.active .history-preview-modal {
  opacity: 0.7;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .history-modal-content,
.modal-leave-active .history-modal-content {
  transition: transform 0.2s ease;
}

.modal-enter-from .history-modal-content,
.modal-leave-to .history-modal-content {
  transform: scale(0.95);
}
</style>

