import { useState, useCallback, useEffect } from 'react';
import { useCreateSocket } from '@/contexts/socket';
import { authStore } from '@/contexts/authStore';
import app from '@/config';

// Unified interface matching Backend Notification Schema
interface ChatNotification {
  _id: string;
  chatId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: any;
  senderId?: any;
  senderName?: string;
  senderEmail?: string;
  // unread: number; // Removed as it does not exist on individual notifications
  createdAt: string;
}

export function useChatNotificationsWithGeneral() {
  const [chatNotifications, setChatNotifications] = useState<ChatNotification[]>([]);
  const [chatCreatedNotifications, setChatCreatedNotifications] = useState<ChatNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketContext = useCreateSocket();
  const auth = authStore((state) => state.auth);
  const isReady = authStore((state) => state.isReady);

  const fetchChatRelatedNotifications = useCallback(async () => {
    try {
      // Get current auth state to avoid dependency issues
      const currentAuth = authStore.getState().auth;
      const currentIsReady = authStore.getState().isReady;

      // Wait for auth to be ready
      if (!currentIsReady) {
        console.log('Auth not ready yet, skipping chat notifications fetch');
        return;
      }

      // Check if user is authenticated
      if (!currentAuth?.user?._id || !currentAuth?.tokens?.accessToken) {
        console.log('User not authenticated, setting empty chat notifications');
        setChatNotifications([]);
        setChatCreatedNotifications([]);
        return;
      }

      const token = currentAuth.tokens.accessToken;

      const response = await fetch(`${app.baseURL}notification/chat`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-access-key': process.env.NEXT_PUBLIC_KEY_API_BYUER as string,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const allNotifications = data.notifications || [];

        console.log('ChatHook: Fetched total chat notifications:', allNotifications.length);

        // Filter notifications by type
        const created = allNotifications.filter((n: any) => n.type === 'CHAT_CREATED');
        const messages = allNotifications.filter((n: any) =>
          n.type === 'MESSAGE_RECEIVED' || n.type === 'MESSAGE_ADMIN' || n.type === 'ADMIN_MESSAGE_SENT'
        );

        console.log(`ChatHook: Split into ${created.length} created and ${messages.length} messages`);

        setChatCreatedNotifications(created);
        setChatNotifications(messages);
      }
    } catch (err) {
      console.error('Error fetching chat notifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const fetchAllChatRelatedNotifications = useCallback(async () => {
    setLoading(true);
    console.log('ChatHook: Fetching all chat-related notifications');
    await fetchChatRelatedNotifications();
    setLoading(false);
  }, [fetchChatRelatedNotifications]);

  // Only fetch notifications when auth is ready
  useEffect(() => {
    if (isReady) {
      fetchChatRelatedNotifications();
    }
  }, [isReady, fetchChatRelatedNotifications]);

  useEffect(() => {
    if (!socketContext?.socket) return;

    const handleNewMessage = (data: any) => {
      console.log('ChatHook: Real-time message received:', data);

      // Construct a notification object from the message data
      // Note: We use messageId as _id or fallback to a temp ID
      const newNotification: ChatNotification = {
        _id: data.messageId || data._id || `temp_${Date.now()}`,
        chatId: data.idChat || data.chatId,
        type: 'MESSAGE_RECEIVED',
        title: 'Nouveau message', // You might want to use translation here if possible, or generic
        message: data.message,
        read: false,
        data: data,
        senderId: data.sender || data.senderId,
        // We might not have senderName immediately available in socket data unless sent
        // But the UI handles missing senderName
        senderName: data.senderName,
        createdAt: data.createdAt || new Date().toISOString()
      };

      setChatNotifications(prev => {
        // Prevent duplicates
        if (prev.some(n => n._id === newNotification._id)) return prev;
        // Add to top
        return [newNotification, ...prev];
      });
    };

    const handleChatCreated = (data: any) => {
      console.log('ChatHook: Real-time chat created:', data);
      const newNotification: ChatNotification = {
        _id: data._id || `temp_chat_${Date.now()}`,
        chatId: data.chatId || data.data?.chatId,
        type: 'CHAT_CREATED',
        title: data.title || 'Nouvelle conversation',
        message: data.message || 'Une nouvelle conversation a commencé',
        read: false,
        data: data,
        senderId: data.senderId,
        senderName: data.senderName,
        createdAt: data.createdAt || new Date().toISOString()
      };

      setChatCreatedNotifications(prev => {
        if (prev.some(n => n._id === newNotification._id)) return prev;
        return [newNotification, ...prev];
      });
    };

    const handleNotification = (data: any) => {
      // Check if it's a chat related notification
      if (data.type === 'CHAT_CREATED') {
        handleChatCreated(data);
      } else if (data.type === 'MESSAGE_RECEIVED' || data.type === 'MESSAGE_ADMIN') {
        handleNewMessage({
          ...data.data,
          messageId: data.data?.messageId || data.data?._id,
          message: data.message // Use notification message or data message
        });
      }
    };

    socketContext.socket.on('newMessage', handleNewMessage);
    socketContext.socket.on('sendNotificationChatCreate', handleChatCreated);
    socketContext.socket.on('notification', handleNotification);

    return () => {
      socketContext.socket?.off('newMessage', handleNewMessage);
      socketContext.socket?.off('sendNotificationChatCreate', handleChatCreated);
      socketContext.socket?.off('notification', handleNotification);
    };
  }, [socketContext]);

  // Since API returns only unread chat notifications (filtered by read: false on backend),
  // the length of the array is the unread count.
  const chatMessagesUnread = chatNotifications.length;
  const chatCreatedUnread = chatCreatedNotifications.length;
  const totalUnread = chatMessagesUnread + chatCreatedUnread;

  console.log('ChatHook: Chat messages unread:', chatMessagesUnread);
  console.log('ChatHook: Chat created unread:', chatCreatedUnread);
  console.log('ChatHook: Total chat unread:', totalUnread);

  return {
    chatNotifications,
    chatCreatedNotifications,
    totalUnread,
    loading,
    error,
    refresh: fetchAllChatRelatedNotifications
  };
}

export default useChatNotificationsWithGeneral;