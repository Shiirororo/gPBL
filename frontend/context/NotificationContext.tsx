"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { type Notification, type CreateNotificationInput } from "@/types/notification"
import { useToast } from "@/components/ui/toast-provider"

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  create: (input: CreateNotificationInput) => Promise<void>
  remove: (id: number) => Promise<void>
  markAllRead: () => void
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  loading: true,
  create: async () => {},
  remove: async () => {},
  markAllRead: () => {},
})

export function useNotifications() {
  return useContext(NotificationContext)
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const esRef = useRef<EventSource | null>(null)
  const showToast = useToast()

  // Fetch initial list
  useEffect(() => {
    fetch("/api/notification")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.data ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Open SSE connection
  useEffect(() => {
    let es: EventSource

    async function openSSE() {
      try {
        const res = await fetch("/api/notification/token")
        if (!res.ok) return
        const { token } = await res.json()

        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080"

        es = new EventSource(`${backendUrl}/v1/notification/stream?token=${token}`)
        esRef.current = es

        es.addEventListener("notification", (e) => {
          try {
            const n: Notification = JSON.parse(e.data)
            setNotifications((prev) => {
              // Avoid duplicates — the optimistic add in create() may have
              // already inserted this notification before the SSE event arrives.
              if (prev.some((existing) => existing.id === n.id)) {
                return prev
              }
              return [n, ...prev]
            })
            setUnreadCount((c) => c + 1)
            showToast(`🔔 ${n.name}`, "success")
          } catch {
            // malformed event — ignore
          }
        })

        es.onerror = () => {
          // EventSource reconnects automatically; nothing to do here
        }
      } catch (err) {
        console.error("SSE setup failed", err)
      }
    }

    openSSE()

    return () => {
      es?.close()
      esRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const create = useCallback(async (input: CreateNotificationInput) => {
    const res = await fetch("/api/notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? "Failed to create notification")
    }
    const { id } = await res.json()
    // Optimistically add a placeholder; the SSE event will not fire for our
    // own creation, so we construct the entry from the input.
    const newNotification: Notification = {
      id,
      ownerId: "",
      name: input.name,
      description: input.description,
      start_time: input.start_time,
      notify_time: input.notify_time,
      deadline: input.deadline,
      status: input.status ?? 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setNotifications((prev) => [newNotification, ...prev])
  }, [])

  const remove = useCallback(async (id: number) => {
    const res = await fetch(`/api/notification/${id}`, { method: "DELETE" })
    if (!res.ok && res.status !== 204) {
      throw new Error("Failed to delete notification")
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const markAllRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, create, remove, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
