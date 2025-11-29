// @ts-nocheck
import { ref, toRaw, isReactive, isRef } from 'vue'

export interface HistoryState<T> {
  state: T
  timestamp: number
  description?: string
}

/**
 * Recursively unwrap all Vue Proxy objects to plain objects
 * This is necessary because toRaw() only unwraps the top level
 */
function deepToRaw<T>(obj: T): T {
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj
  }

  // Handle primitive types
  if (typeof obj !== 'object') {
    return obj
  }

  // Unwrap ref
  if (isRef(obj)) {
    return deepToRaw(toRaw(obj.value)) as T
  }

  // Unwrap reactive/proxy
  if (isReactive(obj)) {
    obj = toRaw(obj)
  }

  // Handle arrays recursively
  if (Array.isArray(obj)) {
    return obj.map(item => deepToRaw(item)) as T
  }

  // Handle Date objects (don't unwrap)
  if (obj instanceof Date) {
    return obj
  }

  // Handle plain objects recursively
  const result: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = deepToRaw(obj[key])
    }
  }
  return result as T
}

/**
 * Deep clone a state object, handling Vue Proxy objects
 * Converts reactive proxies to plain objects before cloning
 */
function deepClone<T>(state: T): T {
  // Recursively convert all Vue Proxies to raw objects
  const raw = deepToRaw(state)

  // Use structuredClone for deep cloning (better than JSON.parse/stringify)
  // It handles Date, Map, Set, ArrayBuffer, etc.
  return structuredClone(raw)
}

/**
 * Undo/Redo history manager
 * Keeps a stack of past states with a configurable limit
 */
export function useHistory<T>(initialState: T, maxSize = 15) {
  const history = ref<HistoryState<T>[]>([
    { state: deepClone(initialState), timestamp: Date.now() }
  ])
  const currentIndex = ref(0)

  /**
   * Push a new state to history
   */
  function push(state: T, description?: string) {
    // Remove any future states if we're not at the end
    if (currentIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentIndex.value + 1)
    }

    // Add new state (deep clone to avoid reference issues)
    history.value.push({
      state: deepClone(state),
      timestamp: Date.now(),
      description
    })

    // Limit history size (keep most recent)
    if (history.value.length > maxSize) {
      history.value = history.value.slice(history.value.length - maxSize)
    }

    currentIndex.value = history.value.length - 1
  }

  /**
   * Undo - go back one step
   */
  function undo(): T | null {
    if (currentIndex.value > 0) {
      currentIndex.value--
      return deepClone(history.value[currentIndex.value].state)
    }
    return null
  }

  /**
   * Redo - go forward one step
   */
  function redo(): T | null {
    if (currentIndex.value < history.value.length - 1) {
      currentIndex.value++
      return deepClone(history.value[currentIndex.value].state)
    }
    return null
  }

  /**
   * Get current state
   */
  function getCurrent(): T {
    return deepClone(history.value[currentIndex.value].state)
  }

  /**
   * Check if can undo
   */
  function canUndo(): boolean {
    return currentIndex.value > 0
  }

  /**
   * Check if can redo
   */
  function canRedo(): boolean {
    return currentIndex.value < history.value.length - 1
  }

  /**
   * Clear all history
   */
  function clear() {
    history.value = [{ state: deepClone(initialState), timestamp: Date.now() }]
    currentIndex.value = 0
  }

  /**
   * Get history size
   */
  function size(): number {
    return history.value.length
  }

  return {
    push,
    undo,
    redo,
    getCurrent,
    canUndo,
    canRedo,
    clear,
    size,
    currentIndex,
    history
  }
}
