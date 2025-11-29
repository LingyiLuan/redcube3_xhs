/**
 * Validation utilities for forms and inputs
 */

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0
}

export function minLength(value: string, min: number): boolean {
  return value.length >= min
}

export function maxLength(value: string, max: number): boolean {
  return value.length <= max
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateNodeContent(content: string): { valid: boolean; error?: string } {
  if (!isNotEmpty(content)) {
    return { valid: false, error: 'Content cannot be empty' }
  }

  if (!minLength(content, 10)) {
    return { valid: false, error: 'Content must be at least 10 characters' }
  }

  if (!maxLength(content, 10000)) {
    return { valid: false, error: 'Content must be less than 10,000 characters' }
  }

  return { valid: true }
}
