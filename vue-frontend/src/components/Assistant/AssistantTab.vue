<template>
  <div class="assistant-tab">
    <template v-if="!isAuthenticated">
      <AuthEmptyState
        :icon="Sparkles"
        title="Sign in to use AI Assistant"
        description="Get personalized interview prep insights and workflow automation"
      />
    </template>
    <template v-else>
      <div class="assistant-layout">
        <!-- Header -->
        <div class="assistant-header">
          <h3>AI Assistant</h3>
          <div class="header-actions">
            <button @click="toggleHistoryModal" class="history-btn" title="Conversation History">
              <FileText :size="16" />
            </button>
            <button v-if="messages.length > 0" @click="clearChat" class="clear-btn" title="Clear chat">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="messages-container" ref="scrollableContent">
          <div v-if="messages.length === 0" class="empty-state">
            <h4 class="empty-greeting">How can I help you today?</h4>
            <div class="prompt-cards">
              <button v-for="prompt in suggestedPrompts" :key="prompt" class="prompt-card" @click="sendMessage(prompt)">
                {{ prompt }}
              </button>
            </div>
          </div>
          <div v-else class="messages-list">
            <MessageBubble v-for="message in messages" :key="message.id" :message="message" />
          </div>
        </div>

        <!-- Input Section (Always at bottom) -->
        <div class="input-section">
          <MessageInput v-model="userInput" :is-loading="isLoading" @send="handleSendMessage" />
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
                  No conversation history yet
                </div>
                <div v-else class="history-list-modal">
                  <button
                    v-for="chat in chats"
                    :key="chat.id"
                    :class="['history-item-modal', { active: chat.id === activeChatId }]"
                    @click="selectChatFromModal(chat.id)"
                  >
                    <div class="history-item-header">
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
import AuthEmptyState from '@/components/common/AuthEmptyState.vue'
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
const isExecutingWorkflow = ref(false) // ✅ FIX: Separate loading state for workflow execution
const scrollableContent = ref<HTMLElement | null>(null)
const showHistoryModal = ref(false)

const suggestedPrompts = [
  'Compare Google SWE and Amazon SWE',
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
  eventBus.emit('open-login-modal', { returnUrl: '/workflow' })
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
async function handleSendMessage(prompt?: string) {
  // ✅ UX FIX: Better authentication check with clear error message
  if (!isAuthenticated.value) {
    console.warn('[AssistantTab] User not authenticated, opening login modal')
    uiStore.showToast('Please sign in to use the AI Assistant', 'warning')
    openLoginModal()
    return
  }

  // ✅ UX FIX: Validate auth store state
  if (!authStore.userId) {
    console.error('[AssistantTab] Authentication state invalid - userId missing')
    uiStore.showToast('Authentication error. Please sign in again.', 'error')
    // Force logout to clear invalid state
    await authStore.logout()
    openLoginModal()
    return
  }

  // Use provided prompt or fall back to userInput.value
  const content = prompt ? prompt.trim() : userInput.value.trim()
  
  if (!content || isLoading.value) return

  // Clear input only if we used userInput.value (not a direct prompt)
  if (!prompt) {
    userInput.value = ''
  }
  
  const userContent = content

  isLoading.value = true
  
  try {
    // Add user message first - wrap in try-catch to handle errors
    try {
      await assistantChatStore.appendMessage('user', userContent)
      scrollToBottom()
    } catch (appendError: any) {
      console.error('[AssistantTab] Failed to add user message:', appendError)
      // ✅ UX FIX: More specific error messages
      if (appendError?.message?.includes('Authentication') || appendError?.response?.status === 401) {
        uiStore.showToast('Session expired. Please sign in again.', 'error')
        await authStore.logout()
        openLoginModal()
      } else {
        uiStore.showToast('Failed to save message. Please try again.', 'error')
      }
      isLoading.value = false
      return
    }

    // Query assistant
    const data = await assistantService.query(userContent)

    const assistantText = data.response || data.message || 'Sorry, I encountered an error. Please try again.'
    
    // Add assistant response
    try {
      await assistantChatStore.appendMessage('assistant', assistantText, {
        actions: data.actions,
        type: data.type
      })
      scrollToBottom()
    } catch (appendError: any) {
      console.error('[AssistantTab] Failed to add assistant message:', appendError)
      // Don't return here - still show the response even if save fails
    }

    // ✅ FIX: Don't await workflow execution - fire and forget so input button can reset
    if (data.actions && data.actions.length > 0) {
      handleActions(data.actions, data.type || 'general').catch(error => {
        console.error('[AssistantTab] Error executing workflow action:', error)
      })
    }
  } catch (error: any) {
    console.error('[AssistantTab] Failed to send message:', error)
    
    // Add error message to chat
    try {
      await assistantChatStore.appendMessage(
        'assistant',
        'Sorry, I encountered an error connecting to the assistant. Please try again.'
      )
      scrollToBottom()
    } catch (appendError: any) {
      console.error('[AssistantTab] Failed to add error message:', appendError)
      uiStore.showToast('Failed to connect to assistant. Please try again.', 'error')
    }
  } finally {
    isLoading.value = false
  }
}

// Handle assistant actions
async function handleActions(actions: any[], type: string) {
  console.log('[AssistantTab] Handling actions:', actions, 'Type:', type)

  isExecutingWorkflow.value = true

  try {
    for (const action of actions) {
      if (action.type === 'execute_workflow') {
        await executeWorkflow(action.data)
      }
    }
  } finally {
    isExecutingWorkflow.value = false
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
      const result = await workflowStore.executeBatchAnalysis(addedNodes, analysisNodeId)

      if (!result) {
        console.warn('[AssistantTab] Analysis was cancelled or returned null')
        return
      }

      // ✅ FIX: Check if analysis was cancelled before creating results node
      const analysisNode = workflowStore.nodes.find(n => n.id === analysisNodeId)
      if (analysisNode?.data.status === 'cancelled') {
        console.log('[AssistantTab] Analysis was cancelled, not creating results node')
        return
      }

      workflowStore.updateNodeData(analysisNodeId, {
        status: 'completed',
        analysisResult: result
      })

      // ✅ FIX: Double-check cancellation before creating results node (defense in depth)
      const analysisNodeAfterUpdate = workflowStore.nodes.find(n => n.id === analysisNodeId)
      if (analysisNodeAfterUpdate?.data.status === 'cancelled') {
        console.log('[AssistantTab] Analysis was cancelled after update, not creating results node')
        return
      }

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
  // Pass prompt directly to handleSendMessage to avoid reactivity timing issues
  handleSendMessage(prompt)
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
  if (confirm('Clear this conversation?')) {
    await assistantChatStore.deleteActiveChat()
  }
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
/* Layout */
.assistant-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #FFFFFF;
}

.assistant-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Header */
.assistant-header {
  flex-shrink: 0;
  padding: 12px 16px;
  border-bottom: 1px solid #E5E7EB;
  background: #F9FAFB;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.assistant-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-btn {
  position: relative;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  color: #6B7280;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 13px;
}

.history-btn:hover {
  background: #F3F4F6;
  border-color: #D1D5DB;
  color: #374151;
}

.history-count {
  background: #1E3A8A;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.clear-btn {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  color: #6B7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: #FEE2E2;
  border-color: #FCA5A5;
  color: #DC2626;
}

/* Auth Gate */
.assistant-auth-gate {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  padding: 48px 24px;
}

.auth-icon {
  color: #1E3A8A;
  opacity: 0.9;
}

.assistant-auth-gate h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
}

.assistant-auth-gate p {
  margin: 0;
  font-size: 14px;
  color: #6B7280;
  max-width: 320px;
}

.login-btn {
  border: none;
  background: #1E3A8A;
  color: #fff;
  border-radius: 8px;
  padding: 10px 24px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
}

.login-btn:hover {
  background: #1E40AF;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
}

/* Messages Area */
.assistant-auth-gate {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  padding: 48px 24px;
}

.auth-icon {
  color: #1E3A8A;
  opacity: 0.9;
}

.assistant-auth-gate h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
}

.assistant-auth-gate p {
  margin: 0;
  font-size: 14px;
  color: #6B7280;
  max-width: 320px;
}

.login-btn {
  border: none;
  background: #1E3A8A;
  color: #fff;
  border-radius: 8px;
  padding: 10px 24px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
}

.login-btn:hover {
  background: #1E40AF;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 0;
  background: #FFFFFF;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 16px;
}

.empty-greeting {
  font-size: 20px;
  font-weight: 600;
  color: #1F2937;
  margin: 0 0 32px 0;
}

.prompt-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 400px;
}

.prompt-card {
  padding: 16px 20px;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  background: #FFFFFF;
  color: #374151;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.prompt-card:hover {
  border-color: #1E3A8A;
  background: #EFF6FF;
  color: #1E3A8A;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.15);
  transform: translateY(-2px);
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Input Section */
.input-section {
  flex-shrink: 0;
  padding: 8px 12px;
  border-top: 1px solid #E5E7EB;
  background: #F9FAFB;
}

/* History Modal */
.history-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.history-modal-content {
  position: relative;
  width: 100%;
  max-width: 500px;
  max-height: 70vh;
  background: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.history-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E7EB;
  background: #F9FAFB;
}

.history-modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
}

.close-modal-btn {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  color: #6B7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-modal-btn:hover {
  background: #F3F4F6;
  border-color: #D1D5DB;
}

.history-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.new-chat-modal-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  background: #1E3A8A;
  color: #fff;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s ease;
}

.new-chat-modal-btn:hover {
  background: #1E40AF;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
}

.history-empty-modal {
  text-align: center;
  padding: 48px 24px;
  color: #9CA3AF;
  font-size: 14px;
}

.history-list-modal {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item-modal {
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 12px 16px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-item-modal:hover {
  background: #F9FAFB;
  border-color: #1E3A8A;
}

.history-item-modal.active {
  background: #EFF6FF;
  border-color: #1E3A8A;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
}

.history-title-modal {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}

.history-meta-modal {
  font-size: 11px;
  font-weight: 500;
  color: #9CA3AF;
}

.history-preview-modal {
  margin: 0;
  font-size: 13px;
  color: #6B7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .history-modal-content,
.modal-leave-active .history-modal-content {
  transition: transform 0.25s ease;
}

.modal-enter-from .history-modal-content,
.modal-leave-to .history-modal-content {
  transform: scale(0.95);
}
</style>

