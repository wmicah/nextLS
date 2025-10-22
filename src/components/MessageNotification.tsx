"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, X, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/app/_trpc/client";
// Removed complex SSE hooks - using simple polling instead

interface MessageNotificationProps {
  // Add any props if needed
}

export default function MessageNotification({}: MessageNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [notification, setNotification] = useState<any>(null);
  const audio = new Audio("/notification.mp3"); // You'll need to add this file

  // Get user settings to check sound preferences
  const { data: userSettings } = trpc.settings.getSettings.useQuery();

  // Simple polling for unread count
  const { data: unreadCount = 0 } = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 10000, // Poll every 10 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  const lastCountRef = useRef<number>(0);

  useEffect(() => {
    if (unreadCount !== undefined && unreadCount > lastCountRef.current) {
      // Show notification for new unread messages
      if (!isMuted) {
        setNotification({
          id: Date.now(),
          content: `You have ${unreadCount} unread message${
            unreadCount > 1 ? "s" : ""
          }`,
        });
        setIsVisible(true);

        // Play sound only if user has sound notifications enabled
        if (userSettings?.soundNotifications !== false) {
          try {
            audio.play().catch(() => {
              // Ignore audio play errors
            });
          } catch (error) {
            // Ignore audio errors
          }
        }

        // Auto-hide after 5 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      }
    }
    lastCountRef.current = unreadCount || 0;
  }, [unreadCount, isMuted, audio]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!isVisible || !notification) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-24 right-6 z-50"
      >
        <Card className="w-80 shadow-2xl border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-800">
                    New Message
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {notification.content}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
