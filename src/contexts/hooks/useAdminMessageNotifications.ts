import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useCreateSocket } from '@/contexts/socket';
import { authStore } from '@/contexts/authStore';
import app from '@/config';
import axios from 'axios';

interface AdminNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: any;
  createdAt: string;
}

interface AdminMessage {
  _id: string;
  sender: string;
  receiver?: string;
  reciver?: string; // Keep both properties for backward compatibility
  message: string;
  isUnRead: boolean;
  createdAt: string;
}

// Cache for processed messages to avoid duplicates
const adminMessageNotificationCache = {
  processedMessages: new Set<string>(),
  lastProcessedTime: 0
};

export function useAdminMessageNotifications() {
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [socketMessages, setSocketMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to track if a fetch is in progress to prevent race conditions
  const isFetchingRef = useRef(false);

  const socketContext = useCreateSocket();
  const auth = authStore((state) => state.auth);
  const isReady = authStore((state) => state.isReady);

  // Get current user from auth store
  const getCurrentUserId = useCallback(() => {
    return auth?.user?._id;
  }, [auth?.user?._id]);

  const currentUserId = getCurrentUserId();

  // Ref to track if we have notifications (to avoid dependency on state in callback)
  const hasAdminNotificationsRef = useRef(false);

  useEffect(() => {
    hasAdminNotificationsRef.current = adminNotifications.length > 0;
  }, [adminNotifications.length]);

  // Fetch admin message notifications
  const fetchAdminNotifications = useCallback(async () => {
    // Prevent overlapping fetches
    if (isFetchingRef.current) return;

    try {
      // Get current auth state to avoid dependency issues
      const currentAuth = authStore.getState().auth;
      const currentIsReady = authStore.getState().isReady;

      // Wait for auth to be ready
      if (!currentIsReady) {
        // console.log('Auth not ready yet, skipping admin notifications fetch');
        return;
      }

      // Check if user is authenticated
      if (!currentAuth?.user?._id || !currentAuth?.tokens?.accessToken) {
        // console.log('User not authenticated, setting empty admin notifications');
        setAdminNotifications([]);
        setLoading(false);
        return;
      }

      isFetchingRef.current = true;
      // Don't set loading to true on every background refresh to avoid UI flickering
      // Only set it on initial load if we have no data
      if (!hasAdminNotificationsRef.current) {
        setLoading(true);
      }

      const token = currentAuth.tokens.accessToken;

      const response = await axios.get(`${app.baseURL}notification/general`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-access-key': process.env.NEXT_PUBLIC_KEY_API_BYUER as string,
        }
      });

      const data = response.data;
      const allNotifications = data.notifications || [];

      // Filter for admin message notifications only
      const adminMessageNotifications = allNotifications.filter((notification: AdminNotification) => {
        // Include notifications with admin message title
        const isAdminMessageTitle = notification.title === 'Nouveau message de l\'admin';

        // Include notifications where sender is admin
        const isAdminSender =
          (notification.data?.users as any)?.[0]?._id === 'admin' ||
          (notification.data?.users as any)?.[0]?.AccountType === 'admin' ||
          notification.data?.senderId === 'admin' ||
          (notification.data?.sender as any)?._id === 'admin' ||
          (notification.data?.sender as any)?.AccountType === 'admin';

        // Include MESSAGE_ADMIN and MESSAGE_RECEIVED types
        const isCorrectType = notification.type === 'MESSAGE_ADMIN' || notification.type === 'MESSAGE_RECEIVED';

        return (isAdminMessageTitle || isAdminSender) && isCorrectType;
      });

      setAdminNotifications(adminMessageNotifications);
      setError(null);
    } catch (err) {
      // Quietly fail for network errors to avoid spamming console
      if (axios.isAxiosError(err)) {
        if (err.code !== 'ERR_CANCELED') {
          console.warn('Error fetching admin message notifications:', err.message);
        }
      } else {
        console.error('Error fetching admin message notifications:', err);
      }
      setError('Failed to fetch admin notifications');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Calculate total unread count for admin messages
  const totalUnreadCount = useMemo(() => {
    return adminNotifications.filter(notification => !notification.read).length;
  }, [adminNotifications]);

  // Calculate unread count for ONLY admin messages (not notifications)
  const unreadAdminMessagesCount = useMemo(() => {
    // Count unread admin notifications from database (existing notifications)
    const unreadAdminNotifications = adminNotifications.filter(n => !n.read);

    // Count socket messages that are from admin and unread (new real-time messages)
    const unreadAdminSocketMessages = (socketMessages as any[]).filter(msg => {
      // Must be unread
      if (msg.isUnRead === false) return false;

      // Must be from admin
      const isFromAdmin =
        msg.sender === 'admin' ||
        msg.senderId === 'admin' ||
        msg.sender?._id === 'admin';

      if (!isFromAdmin) return false;

      // Must be for current user
      const isForCurrentUser =
        msg.receiver === currentUserId ||
        msg.receiverId === currentUserId ||
        msg.reciver === currentUserId;

      if (!isForCurrentUser) return false;

      return true;
    });

    // Total count = existing notifications + new socket messages
    const totalCount = unreadAdminNotifications.length + unreadAdminSocketMessages.length;

    return totalCount;
  }, [adminNotifications, socketMessages, currentUserId]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    // console.log('🔄 Refreshing admin message notifications');
    await fetchAdminNotifications();
  }, [fetchAdminNotifications]);

  // Handle new admin messages from socket
  const handleNewAdminMessage = useCallback((data: any) => {
    // console.log('📨 New admin message received:', data);

    // Check if message is from admin
    const isFromAdmin =
      data.sender === 'admin' ||
      data.senderId === 'admin' ||
      data.sender?._id === 'admin';

    if (!isFromAdmin) {
      return;
    }

    // Check if message is for current user - support both receiver and reciver spellings
    const isForCurrentUser =
      data.receiver === currentUserId ||
      data.receiverId === currentUserId ||
      data.reciver === currentUserId ||
      data.reciverId === currentUserId;

    if (!isForCurrentUser) {
      return;
    }

    // Prevent duplicate processing
    const now = Date.now();
    const messageId = data._id || data.id || `${data.sender}-${data.receiver}-${now}`;
    const cacheKey = `${messageId}-${data.createdAt || now}`;

    if (adminMessageNotificationCache.processedMessages.has(cacheKey)) {
      return;
    }

    // Check if message already exists in state
    setSocketMessages(prev => {
      const exists = prev.some(msg =>
        msg._id === messageId ||
        (msg.sender === data.sender &&
          msg.receiver === data.receiver &&
          msg.message === data.message &&
          Math.abs(new Date(msg.createdAt).getTime() - new Date(data.createdAt || now).getTime()) < 1000)
      );

      if (exists) {
        return prev;
      }

      // Add new admin message
      const newAdminMessage = {
        ...data,
        _id: messageId,
        isUnRead: true,
        createdAt: data.createdAt || new Date().toISOString()
      };

      return [...prev, newAdminMessage];
    });

    // Update cache
    adminMessageNotificationCache.processedMessages.add(cacheKey);
    adminMessageNotificationCache.lastProcessedTime = now;
  }, [currentUserId]);

  // Function to clear socket messages (when chat is opened)
  const clearSocketMessages = useCallback(() => {
    setSocketMessages([]);
    // Clear cache
    adminMessageNotificationCache.processedMessages.clear();
    adminMessageNotificationCache.lastProcessedTime = 0;
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {

      // Optimistic update
      setAdminNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

      // Make API call to mark as read
      const { auth } = authStore.getState();
      if (auth?.tokens?.accessToken) {
        await axios.put(`${app.baseURL}notification/${notificationId}/read`, {}, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.tokens.accessToken}`,
            'x-access-key': process.env.NEXT_PUBLIC_KEY_API_BYUER as string,
          }
        });

        // Refresh admin notifications to get the latest data from server
        // We can do this in the background
        fetchAdminNotifications();
      }
    } catch (error) {
      console.error('❌ Error marking admin notification as read:', error);
      // Revert optimistic update on error
      setAdminNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId
            ? { ...notification, read: false }
            : notification
        )
      );
    }
  }, [fetchAdminNotifications]); // Added fetchAdminNotifications dependency

  // Listen for socket events
  useEffect(() => {
    if (!socketContext?.socket) return;

    // console.log('🔌 Setting up admin message socket listeners');

    socketContext.socket.on('sendMessage', handleNewAdminMessage);
    socketContext.socket.on('newMessage', handleNewAdminMessage);

    // Add specific listener for adminMessage events - highest priority
    socketContext.socket.on('adminMessage', (data) => {
      // Always process adminMessage events with high priority
      handleNewAdminMessage({
        ...data,
        isHighPriority: true // Mark as high priority
      });
    });

    socketContext.socket.on('notification', (notification) => {
      // Handle admin notifications
      if (notification.type === 'MESSAGE_ADMIN' && notification.userId === currentUserId) {
        // This will be handled by the database notifications
        // Consider triggering a refresh here instead of relying on the socket message alone
        fetchAdminNotifications();
      }
    });

    return () => {
      // console.log('🔌 Cleaning up admin message socket listeners');
      socketContext.socket?.off('sendMessage', handleNewAdminMessage);
      socketContext.socket?.off('newMessage', handleNewAdminMessage);
      socketContext.socket?.off('adminMessage');
      socketContext.socket?.off('notification');
    };
  }, [socketContext?.socket, handleNewAdminMessage, currentUserId, fetchAdminNotifications]);

  // Only fetch notifications when auth is ready
  useEffect(() => {
    if (isReady) {
      fetchAdminNotifications();
    }
  }, [isReady, fetchAdminNotifications]);

  // Fetch notifications when user comes online (socket connects) - but only once
  useEffect(() => {
    if (socketContext?.socket?.connected && currentUserId && isReady) {
      fetchAdminNotifications();
    }
  }, [socketContext?.socket?.connected, currentUserId, isReady, fetchAdminNotifications]);

  return {
    adminNotifications,
    socketMessages,
    totalUnreadCount,
    unreadAdminMessagesCount,
    loading,
    refreshNotifications,
    clearSocketMessages,
    markAsRead
  };
}

export default useAdminMessageNotifications; 