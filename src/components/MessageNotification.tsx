"use client"

import { useEffect, useState } from "react"
import { MessageCircle, X, Bell, Volume2, VolumeX } from "lucide-react"
import { trpc } from "@/app/_trpc/client"
import ProfilePictureUploader from "./ProfilePictureUploader"

interface MessageNotificationProps {
  conversationId?: string
}

export default function MessageNotification({
  conversationId,
}: MessageNotificationProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  // Get unread count
  const { data: unreadCount = 0 } = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 3000, // Real-time updates every 3 seconds
      staleTime: 1000, // Consider data stale after 1 second
    }
  )

  // Get conversations for notifications
  const { data: conversations = [] } = trpc.messaging.getConversations.useQuery(
    undefined,
    {
      refetchInterval: 3000, // Real-time updates every 3 seconds
      staleTime: 1000, // Consider data stale after 1 second
    }
  )

  // Get current user info
  const { data: authData } = trpc.authCallback.useQuery()

  // Play notification sound
  const playNotificationSound = () => {
    if (!soundEnabled) return

    try {
      const audio = new Audio("/notification.mp3") // You'll need to add this file
      audio.volume = 0.5
      audio.play().catch(() => {
        // Fallback: create a simple beep sound
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = 800
        gainNode.gain.value = 0.1

        oscillator.start()
        setTimeout(() => oscillator.stop(), 200)
      })
    } catch (error) {
      console.log("Could not play notification sound")
    }
  }

  // Show browser notification
  const showBrowserNotification = (title: string, body: string) => {
    if (!("Notification" in window)) return

    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      })
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, {
            body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
          })
        }
      })
    }
  }

  // Track previous unread count to detect new messages
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0)

  // Check for new messages and show notifications
  useEffect(() => {
    // Only show notifications if unread count increased
    if (unreadCount > previousUnreadCount && previousUnreadCount > 0) {
      // Find conversations with new unread messages
      conversations.forEach((conversation) => {
        const unreadMessages = conversation._count?.messages || 0
        if (unreadMessages > 0 && conversation.messages[0]) {
          const currentUserId = authData?.user?.id

          // Determine the other user based on conversation type
          let otherUser
          if ('client' in conversation && 'coachId' in conversation) {
            // Coach-Client conversation
            otherUser = conversation.coachId === currentUserId
              ? conversation.client
              : { id: conversation.coachId, name: "Coach", email: "coach@example.com" }
          } else {
            // Client-to-client conversation
            otherUser = conversation.client1Id === currentUserId
              ? conversation.client2
              : conversation.client1
          }

          if (!otherUser) return // Skip if we can't determine the other user
          
          const notification = {
            id: Date.now() + Math.random(), // Ensure unique ID
            title: `New message from ${
              otherUser.name || otherUser.email.split("@")[0]
            }`,
            body: conversation.messages[0]?.content || "New message received",
            conversationId: conversation.id,
            timestamp: new Date(),
            otherUser: otherUser,
          }

          // Don't show notification if we're already in this conversation
          if (conversationId !== conversation.id) {
            setNotifications((prev) => [...prev, notification])
            playNotificationSound()
            showBrowserNotification(notification.title, notification.body)
          }
        }
      })
    }

    // Update previous count
    setPreviousUnreadCount(unreadCount)
  }, [unreadCount, conversations, conversationId, previousUnreadCount])

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((n) => Date.now() - n.timestamp.getTime() < 5000)
      )
    }, 5000)

    return () => clearTimeout(timer)
  }, [notifications])

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  return (
    <>
      {/* Notification Settings Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className='fixed bottom-4 right-4 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg z-40'
      >
        <Bell className='h-5 w-5' />
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Settings Panel */}
      {showSettings && (
        <div className='fixed bottom-16 right-4 bg-gray-800 border border-gray-700 rounded-lg p-4 w-64 shadow-lg z-50'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-white font-semibold'>Notifications</h3>
            <button
              onClick={() => setShowSettings(false)}
              className='text-gray-400 hover:text-white'
            >
              <X className='h-4 w-4' />
            </button>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-gray-300 text-sm'>Sound</span>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className='p-1 rounded hover:bg-gray-700'
              >
                {soundEnabled ? (
                  <Volume2 className='h-4 w-4 text-green-400' />
                ) : (
                  <VolumeX className='h-4 w-4 text-gray-400' />
                )}
              </button>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-gray-300 text-sm'>Unread messages</span>
              <span className='text-blue-400 font-semibold'>{unreadCount}</span>
            </div>

            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className='w-full px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600'
              >
                Clear all notifications
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notification Toasts */}
      <div className='fixed top-4 right-4 space-y-2 z-50'>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className='bg-gray-800 border border-gray-700 rounded-lg p-4 w-80 shadow-lg flex items-start gap-3 animate-slide-in'
          >
            <ProfilePictureUploader
              currentAvatarUrl={notification.otherUser?.settings?.avatarUrl}
              userName={
                notification.otherUser?.name ||
                notification.otherUser?.email ||
                "User"
              }
              onAvatarChange={() => {}}
              size='sm'
              readOnly={true}
              className='flex-shrink-0'
            />
            <div className='flex-1 min-w-0'>
              <h4 className='text-white font-semibold text-sm truncate'>
                {notification.title}
              </h4>
              <p className='text-gray-300 text-sm mt-1 line-clamp-2'>
                {notification.body}
              </p>
              <p className='text-gray-500 text-xs mt-2'>
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className='text-gray-400 hover:text-white flex-shrink-0'
            >
              <X className='h-4 w-4' />
            </button>
          </div>
        ))}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
