/**
 * Generate a unique ID for nodes, edges, etc.
 */
export function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate a node ID
 */
export function generateNodeId(): string {
  return `node-${generateUUID()}`
}

/**
 * Generate an edge ID
 */
export function generateEdgeId(source: string, target: string): string {
  return `edge-${source}-${target}`
}
