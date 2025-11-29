import apiClient from './apiClient'

export interface SavedWorkflow {
  id: number
  name: string
  workflowJson?: any
  createdAt: string
  updatedAt: string
}

export const workflowLibraryService = {
  async list(): Promise<SavedWorkflow[]> {
    const response = await apiClient.get('/workflow/library')
    return response.data.workflows || []
  },

  async fetch(workflowId: number | string): Promise<SavedWorkflow> {
    const response = await apiClient.get(`/workflow/library/${workflowId}`)
    return response.data.workflow
  },

  async create(payload: { name: string; workflow: any }): Promise<SavedWorkflow> {
    const response = await apiClient.post('/workflow/library', payload)
    return response.data.workflow
  },

  async update(workflowId: number | string, payload: { name?: string; workflow?: any }) {
    const response = await apiClient.put(`/workflow/library/${workflowId}`, payload)
    return response.data.workflow
  },

  async remove(workflowId: number | string) {
    await apiClient.delete(`/workflow/library/${workflowId}`)
  }
}

