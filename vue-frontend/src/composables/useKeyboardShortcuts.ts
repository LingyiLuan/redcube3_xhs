// @ts-nocheck
import { onMounted, onUnmounted } from 'vue'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean  // Cmd on Mac, Ctrl on Windows
  shift?: boolean
  alt?: boolean
  handler: (event: KeyboardEvent) => void
  description: string
}

/**
 * Check if the active element is an editable field
 */
function isEditableElement(element: Element | null): boolean {
  if (!element) return false

  const tagName = element.tagName

  // Check for input and textarea elements
  if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
    return true
  }

  // Check for contenteditable elements
  if (element.hasAttribute('contenteditable')) {
    const value = element.getAttribute('contenteditable')
    return value === 'true' || value === ''
  }

  return false
}

/**
 * Keyboard shortcuts composable
 * Handles platform-specific shortcuts (Cmd on Mac, Ctrl on Windows)
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  function handleKeyDown(event: KeyboardEvent) {
    // Don't handle shortcuts if user is typing in an editable field
    // UNLESS it's a meta/ctrl shortcut (like Cmd+S, Cmd+E)
    const activeElement = document.activeElement
    const isInEditableField = isEditableElement(activeElement)

    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()

      // Check modifiers
      const ctrlPressed = shortcut.ctrl && event.ctrlKey
      const metaPressed = shortcut.meta && (isMac ? event.metaKey : event.ctrlKey)
      const shiftPressed = shortcut.shift ? event.shiftKey : !event.shiftKey
      const altPressed = shortcut.alt ? event.altKey : !event.altKey

      // Match keyboard shortcut
      if (keyMatches) {
        let modifiersMatch = true

        if (shortcut.meta !== undefined || shortcut.ctrl !== undefined) {
          modifiersMatch = (ctrlPressed || metaPressed)
        }

        if (shortcut.shift !== undefined) {
          modifiersMatch = modifiersMatch && (shortcut.shift === event.shiftKey)
        }

        if (shortcut.alt !== undefined) {
          modifiersMatch = modifiersMatch && (shortcut.alt === event.altKey)
        }

        if (modifiersMatch) {
          // Skip shortcuts without meta/ctrl modifier when in editable field
          // This allows Delete, Backspace, Escape, etc. to work normally in text fields
          // But still allows Cmd+S, Cmd+E, Cmd+Z, etc. to work globally
          const hasMetaOrCtrl = shortcut.meta || shortcut.ctrl
          if (isInEditableField && !hasMetaOrCtrl) {
            // Skip this shortcut - let the default behavior happen
            continue
          }

          event.preventDefault()
          shortcut.handler(event)
          return
        }
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  return {
    isMac
  }
}
