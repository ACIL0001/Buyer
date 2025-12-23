import { useState, useCallback, useEffect, useRef } from 'react';
import { authStore } from '@/contexts/authStore';
import { useCreateSocket } from '@/contexts/socket';
import { getUnreadNotificationCount, getNotifications } from '@/utils/api';
import { NotificationAPI } from '@/app/api/notification';
import { useNotificationStore, Notification } from '@/contexts/notificationStore';

export default function useNotification() {
  // Use global store state
  const {
    notifications,
    unreadCount,
    loading,
    setNotifications,
    setUnreadCount,
    setLoading,
    markAsRead: markAsReadInStore,
    markAllAsRead: markAllAsReadInStore,
    addNotification
  } = useNotificationStore();

  const [error, setError] = useState<string | null>(null);

  // Refs to track if fetches are in progress
  const isFetchingNotificationsRef = useRef(false);
  const isFetchingCountRef = useRef(false);

  // Call useCreateSocket at the top level
  const socketContext = useCreateSocket();

  const fetchNotifications = useCallback(async () => {
    // Prevent overlapping fetches
    if (isFetchingNotificationsRef.current) return;

    try {
      // Check if user is authenticated before making API call
      const { auth, isLogged } = authStore.getState();

      if (!isLogged || !auth?.tokens?.accessToken) {
        setNotifications([]); // Reset notifications
        setUnreadCount(0); // Reset unread count
        return;
      }

      isFetchingNotificationsRef.current = true;
      // Only set loading on initial fetch or empty state
      if (notifications.length === 0) {
        setLoading(true);
      }

      try {
        // Use centralized API helper that handles 404s gracefully
        const data = await getNotifications();
        const allNotifications = (data && (data as any).notifications) ? (data as any).notifications : [];

        // Filter out chat notifications (they should appear in ChatNotifications component)
        const generalNotifications = allNotifications.filter((notification: any) => {
          const isChatNotification =
            notification.type === 'CHAT_CREATED' ||
            notification.type === 'MESSAGE_RECEIVED' ||
            notification.type === 'MESSAGE_ADMIN' ||
            notification.type === 'ADMIN_MESSAGE_SENT';

          const isAdminMessageTitle = notification.title === 'Nouveau message de l\'admin';

          return !(isChatNotification || isAdminMessageTitle);
        });

        setNotifications(generalNotifications);

        setError(null); // Clear any previous errors
      } catch (fetchErr) {
        console.error('❌ Error fetching notifications:', fetchErr);
        setError('Failed to fetch notifications');
        // Don't reset notifications on error, keep old data
      }
    } catch (err) {
      setError('Unexpected error in notifications hook');
      console.error('❌ Unexpected error in fetchNotifications:', err);
    } finally {
      setLoading(false);
      isFetchingNotificationsRef.current = false;
    }
  }, [notifications.length, setNotifications, setUnreadCount, setLoading]);

  // Fetch unread count with enhanced error handling
  const fetchUnreadCount = useCallback(async () => {
    if (isFetchingCountRef.current) return;

    try {
      // Check if user is authenticated before making API call
      const { auth, isLogged } = authStore.getState();
      if (!isLogged || !auth?.tokens?.accessToken) {
        setUnreadCount(0); // Reset unread count
        return;
      }

      isFetchingCountRef.current = true;
      try {
        const count = await getUnreadNotificationCount();

        // Handle different response structures
        const countData = count?.data ? count.data : (typeof count === 'number' ? count : 0);

        // Validate count
        if (typeof countData !== 'number') {
          setUnreadCount(0);
          return;
        }

        setUnreadCount(countData);
      } catch (countErr: any) {
        console.error('❌ Error fetching unread count:', countErr);
        // Default to 0 on error
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('❌ Unexpected error in fetchUnreadCount:', err);
      setUnreadCount(0); // Default to 0 on unexpected error
    } finally {
      isFetchingCountRef.current = false;
    }
  }, [setUnreadCount]);

  // Mark a notification as read with optimistic update and enhanced error handling
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { auth, isLogged } = authStore.getState();
      if (!isLogged || !auth?.tokens?.accessToken) {
        return;
      }

      // Optimistic update via store
      markAsReadInStore(notificationId);

      try {
        const result = await NotificationAPI.markAsRead(notificationId);

        if (result.success === false) {
          throw new Error('Failed to mark notification as read');
        }

        // Refresh notifications silently to ensure sync
        fetchUnreadCount();
      } catch (markErr) {
        console.error('❌ Error marking notification as read:', markErr);
        // Revert could be implemented here if store supports it, 
        // but typically a re-fetch is safer on error.
        await fetchNotifications();
        await fetchUnreadCount();
      }
    } catch (err) {
      console.error('❌ Unexpected error in markAsRead:', err);
    }
  }, [markAsReadInStore, fetchNotifications, fetchUnreadCount]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { auth, isLogged } = authStore.getState();
      if (!isLogged || !auth?.tokens?.accessToken) {
        return;
      }

      // Optimistic update via store
      markAllAsReadInStore();

      try {
        const result = await NotificationAPI.markAllAsRead();

        if (result.success === false) {
          throw new Error('Failed to mark all notifications as read');
        }

        // Refresh count to be sure
        fetchUnreadCount();
      } catch (markErr) {
        console.error('❌ Error marking all notifications as read:', markErr);
        // Revert/Refresh on error
        fetchNotifications();
        fetchUnreadCount();
      }
    } catch (err) {
      console.error('❌ Unexpected error in markAllAsRead:', err);
    }
  }, [markAllAsReadInStore, fetchNotifications, fetchUnreadCount]);

  // Initial fetch when component mounts - using a ref to prevent double fetch in strict mode
  const initialFetchDone = useRef(false);
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchNotifications();
      fetchUnreadCount();
      initialFetchDone.current = true;
    }
  }, [fetchNotifications, fetchUnreadCount]);

  // Polling for new notifications (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  // Listen for real-time notifications from socket
  useEffect(() => {
    if (!socketContext?.socket) {
      return;
    }

    const handleNewNotification = (notification: Notification) => {
      // Only process general notifications (non-chat, non-admin)
      // Aggressively filter out chat-related notifications
      // These should ONLY be handled by useChatNotifications or useChatNotificationsWithGeneral
      const isChatType =
        notification.type === 'CHAT_CREATED' ||
        notification.type === 'MESSAGE_RECEIVED' ||
        notification.type === 'MESSAGE_ADMIN' ||
        notification.type === 'ADMIN_MESSAGE_SENT';

      // Check deeply for chat-related data
      const hasChatData =
        (notification as any).chatId ||
        notification.data?.chatId ||
        notification.data?.messageId ||
        notification.data?.isSocket === true;

      const isAdminMessage =
        notification.title?.includes('Nouveau message de l\'admin') ||
        notification.type === 'MESSAGE_ADMIN' ||
        notification.data?.senderId === 'admin';

      // If it looks like a chat message or chat notification, IGNORE IT in the general bell
      if (isChatType || hasChatData || isAdminMessage) {
        console.log('🔔 useNotification: Ignoring chat-related notification:', notification._id);
        return;
      }

      // Handle both reciver/receiver property names for consistency
      if (notification.receiver && !notification.reciver) {
        notification.reciver = notification.receiver;
      } else if (notification.reciver && !notification.receiver) {
        notification.receiver = notification.reciver;
      }

      // Add to store (handles duplicates and unread count)
      addNotification(notification);
    };

    try {
      socketContext.socket.off('notification');
      socketContext.socket.on('notification', handleNewNotification);

      return () => {
        if (socketContext.socket) {
          socketContext.socket.off('notification', handleNewNotification);
        }
      };
    } catch (error) {
      console.warn('⚠️ Socket notification listener error:', error);
    }
  }, [socketContext?.socket, addNotification]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
    refreshUnreadCount: fetchUnreadCount
  };
} 