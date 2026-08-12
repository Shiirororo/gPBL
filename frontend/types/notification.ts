export interface Notification {
  id: number
  ownerId: string
  name: string
  description: string
  start_time: string
  notify_time: string
  deadline: string
  status: number
  created_at: string
  updated_at: string
}

export interface CreateNotificationInput {
  name: string
  description: string
  start_time: string
  notify_time: string
  deadline: string
  status?: number
}
