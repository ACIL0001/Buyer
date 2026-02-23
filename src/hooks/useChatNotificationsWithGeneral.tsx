import { useState, useCallback, useEffect } from 'react';
import { useCreateSocket } from '@/contexts/socket';
import { authStore } from '@/contexts/authStore';
import { useSnackbar } from 'notistack';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import React from 'react'; // Required for JSX
import { ChatAPI } from '../app/api/chat';
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
  createdAt: string;
}

export function useChatNotificationsWithGeneral() {
  const [chatNotifications, setChatNotifications] = useState<ChatNotification[]>([]);
  const [chatCreatedNotifications, setChatCreatedNotifications] = useState<ChatNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketContext = useCreateSocket();
  const isReady = authStore((state) => state.isReady);
  
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fetchChatRelatedNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Get auth from store or localStorage (fallback)
      let token = authStore.getState().auth?.tokens?.accessToken;
      let userId = authStore.getState().auth?.user?._id;

      if (!token || !userId) {
        console.log('ChatHook: Auth store empty, checking localStorage');
        const storedAuth = typeof window !== 'undefined' ? localStorage.getItem('auth') : null;
        if (storedAuth) {
          const parsed = JSON.parse(storedAuth);
          token = parsed.tokens?.accessToken;
          userId = parsed.user?._id;
        }
      }

      if (!token || !userId) {
         console.log('ChatHook: No auth found, skipping fetch');
         setChatNotifications([]);
         setChatCreatedNotifications([]);
         setLoading(false);
         return;
      }

      // 2. Fetch Notifications (for unread count and status)
      const response = await fetch(`${app.baseURL}notification/chat`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-access-key': app.apiKey,
        },
      });

      let unreadMessages: ChatNotification[] = [];
      let created: ChatNotification[] = [];
      let unreadChatIds = new Set<string>();

      if (response.ok) {
        const data = await response.json();
        
        let allNotifications: any[] = [];
        if (Array.isArray(data)) {
          allNotifications = data;
        } else if (data.notifications && Array.isArray(data.notifications)) {
          allNotifications = data.notifications;
        } else if (data.data && Array.isArray(data.data)) {
          allNotifications = data.data;
        }

        console.log('ChatHook: Fetched total chat notifications:', allNotifications.length);

        created = allNotifications.filter((n: any) => {
          const type = (n.type || '').toUpperCase();
          return type === 'CHAT_CREATED' || type === 'NEW_CHAT';
        });
        
        setChatCreatedNotifications(created);

        unreadMessages = allNotifications.filter((n: any) => {
          const type = (n.type || n.data?.type || '').toUpperCase();
          if (type === 'CHAT_CREATED' || type === 'NEW_CHAT') return false;
          return type.includes('MESSAGE') || type === 'NEW_MESSAGE' || type === 'MESSAGE_RECEIVED' || type === 'UNREAD_MESSAGE';
        });

        // Collect IDs of chats with unread messages for filtering history later
        unreadMessages.forEach((msg: any) => {
             const cId = msg.chatId || msg.data?.chatId || msg.idChat;
             if (cId) unreadChatIds.add(cId);
        });
        
        console.log(`ChatHook: Found ${unreadMessages.length} unread messages across ${unreadChatIds.size} chats`);

      } else {
        console.error('ChatHook: Error fetching notifications', response.status);
      }

      // 3. Always Fetch Recent Conversations for the list display (History)
      try {
           const chatResponse = await ChatAPI.getChats({ id: userId, from: 'buyer' });
           
           if (chatResponse.success && Array.isArray(chatResponse.data)) {
              console.log(`ChatHook: Fetched ${chatResponse.data.length} recent conversations`);
              
              // Map recent conversations to notification format
              const recentChatsAsNotifications: ChatNotification[] = chatResponse.data
                .filter((chat: any) => {
                    // Filter out chats that are already shown in unread notifications
                    const cId = chat._id || chat.id;
                    return !unreadChatIds.has(cId);
                })
                .map((chat: any) => {
                    const otherUser = chat.users?.find((u: any) => u._id !== userId) || 
                                      chat.participants?.find((p: any) => p !== userId) || 
                                      { firstName: 'Utilisateur', lastName: 'Inconnu' };
                    
                    let senderName = 'Utilisateur';
                    if (otherUser.companyName) {
                       senderName = otherUser.companyName;
                    } else if (otherUser.firstName) {
                       senderName = `${otherUser.firstName} ${otherUser.lastName || ''}`.trim();
                    }

                    // Safe extract message content
                    let lastMsgContent = chat.lastMessage;
                    if (lastMsgContent && typeof lastMsgContent === 'object') {
                        lastMsgContent = lastMsgContent.message || 'Message';
                    }
                    
                    return {
                      _id: chat._id || chat.id,
                      chatId: chat._id || chat.id,
                      type: 'RECENT_CONVERSATION',
                      title: senderName,
                      message: typeof lastMsgContent === 'string' ? lastMsgContent : 'Conversation',
                      read: true, // These are history, so considered read (unread ones are in unreadMessages)
                      data: chat,
                      senderId: otherUser._id || otherUser,
                      senderName: senderName,
                      createdAt: chat.lastMessageTime || chat.updatedAt || chat.createdAt || new Date().toISOString()
                    };
              });

              // Sanitize unread messages to ensure string content
              const sanitizedUnreadMessages = unreadMessages.map((msg) => {
                let msgContent = msg.message;
                if (msg.data && msg.data.message) {
                    msgContent = msg.data.message;
                }
                
                if (msgContent && typeof msgContent === 'object') {
                    const anyContent = msgContent as any;
                    msgContent = anyContent.message || anyContent.content || JSON.stringify(msgContent);
                }
                
                return {
                    ...msg,
                    message: typeof msgContent === 'string' ? msgContent : 'Nouveau message'
                };
              });
              
              // Combine: Unread Notifications + Remaining Recent Chats
              const combinedList = [...sanitizedUnreadMessages, ...recentChatsAsNotifications];
              
              // Sort by most recent
              combinedList.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );

              setChatNotifications(combinedList);
           } else {
              // If chat history fails, at least show unread notifications
              setChatNotifications(unreadMessages); 
           }
      } catch (chatError) {
           console.error('ChatHook: Error fetching chats:', chatError);
           // Fallback to just unread messages
           setChatNotifications(unreadMessages); 
      }

    } catch (err) {
      console.error('Error in chat notification hook:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    // setLoading(true); // Don't set loading true on refresh to avoid flickering or disappearing list
    await fetchChatRelatedNotifications();
    // setLoading(false);
  }, [fetchChatRelatedNotifications]);

  // Only fetch notifications when auth is ready
  useEffect(() => {
    if (isReady) {
      fetchChatRelatedNotifications();
    }
  }, [isReady, fetchChatRelatedNotifications]);

  // Ref to track processed notification IDs to prevent duplicates and side-effects in state updaters
  const processedIdsRef = React.useRef(new Set<string>());

  useEffect(() => {
    if (!socketContext?.socket) return;

    const handleNewMessage = (data: any) => {
      console.log('ChatHook: Real-time message received:', data);
      
      const chatId = data.idChat || data.chatId;
      const senderName = data.senderName || 'Nouveau message';
      
      // Safe extract message content
      let msgContent = data.message;
      if (msgContent && typeof msgContent === 'object') {
          msgContent = msgContent.message || 'Message';
      }
      const messageText = typeof msgContent === 'string' ? msgContent : 'Vous avez reçu un message';
      
      const notificationId = data.messageId || data._id || `temp_${Date.now()}`;
      
      // Prevent duplicate processing
      if (processedIdsRef.current.has(notificationId)) {
        return;
      }
      processedIdsRef.current.add(notificationId);
      
      // Update chat notifications list to show this new message at top and mark as unread
      setChatNotifications(prev => {
         const existingIndex = prev.findIndex(n => n.chatId === chatId);
         const updatedAttributes = {
             message: messageText,
             createdAt: new Date().toISOString(),
             read: false, // Mark as unread
             senderName: senderName
         };
         
         if (existingIndex > -1) {
             // Move to top and update
             const updatedList = [...prev];
             updatedList[existingIndex] = { ...updatedList[existingIndex], ...updatedAttributes };
             updatedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
             return updatedList;
         } else {
             // Add new
             const newNotif: ChatNotification = {
                 _id: notificationId,
                 chatId: chatId,
                 type: 'RECENT_CONVERSATION',
                 title: senderName,
                 message: messageText,
                 read: false,
                 data: data,
                 senderId: data.sender || data.senderId,
                 senderName: senderName,
                 createdAt: new Date().toISOString()
             };
             return [newNotif, ...prev];
         }
      });

      // Skip snackbar if user is already in this chat
      const isCurrentlyInThisChat = pathname.includes('/chat') && 
        (searchParams.get('chatId') === chatId || searchParams.get('conversationId') === chatId);
      
      if (!isCurrentlyInThisChat) {
        enqueueSnackbar(`${senderName}: ${messageText}`, {
          variant: 'info',
          autoHideDuration: 5000,
          anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
          action: (key) => (
            <button 
              onClick={() => {
                router.push(`/dashboard/chat?chatId=${chatId}`);
                closeSnackbar(key);
              }}
              style={{
                color: 'white', 
                background: 'rgba(255,255,255,0.2)', 
                border: 'none', 
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              VOIR
            </button>
          )
        });
      }
    };

    const handleChatCreated = (data: any) => {
      console.log('ChatHook: Real-time chat created:', data);
      
      const chatId = data.chatId || data.data?.chatId;
      const title = data.title || 'Nouvelle conversation';
      const message = data.message || 'Une nouvelle conversation a commencé';
      const notificationId = data._id || `temp_chat_${Date.now()}`;

      // Prevent duplicate processing
      if (processedIdsRef.current.has(notificationId)) {
        return;
      }
      processedIdsRef.current.add(notificationId);

      const newNotification: ChatNotification = {
        _id: notificationId,
        chatId: chatId,
        type: 'CHAT_CREATED',
        title: title,
        message: message,
        read: false,
        data: data,
        senderId: data.senderId,
        senderName: data.senderName,
        createdAt: data.createdAt || new Date().toISOString()
      };

      enqueueSnackbar(`${title}: ${message}`, {
        variant: 'success',
        autoHideDuration: 5000,
        anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
        action: (key) => (
          <button 
            onClick={() => {
               router.push(`/dashboard/chat?chatId=${chatId}`);
               closeSnackbar(key);
            }}
            style={{ 
              color: 'white', 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer', 
              fontWeight: 'bold',
              fontSize: '12px'
            }}
          >
            VOIR
          </button>
        )
      });

      setChatCreatedNotifications(prev => [newNotification, ...prev]);
    };

    const handleNotification = (data: any) => {
      if (data.type === 'CHAT_CREATED') {
        handleChatCreated(data);
      } else if (data.type === 'MESSAGE_RECEIVED' || data.type === 'MESSAGE_ADMIN' || data.type === 'ADMIN_MESSAGE_SENT') {
        handleNewMessage({
          ...(data.data || {}),
          messageId: data.data?.messageId || data.data?._id || data._id,
          message: data.message || data.data?.message
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
  }, [socketContext, pathname, searchParams, enqueueSnackbar, closeSnackbar, router]);

  const markAsRead = useCallback((idOrChatId: string) => {
    // Determine if it's a chat ID or notification ID
    // We try to match by chatId primarily as that's what we usually have
    
    setChatNotifications(prev => prev.map(n => 
      (n.chatId === idOrChatId || n._id === idOrChatId) ? { ...n, read: true } : n
    ));
    
    setChatCreatedNotifications(prev => prev.map(n => 
      (n.chatId === idOrChatId || n._id === idOrChatId) ? { ...n, read: true } : n
    ));
  }, []);

  const markAllRead = useCallback(() => {
    setChatNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setChatCreatedNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const totalUnread = chatNotifications.filter(n => !n.read).length + chatCreatedNotifications.filter(n => !n.read).length;

  return {
    chatNotifications,
    chatCreatedNotifications,
    totalUnread,
    loading,
    error,
    refresh: refreshAll,
    markAsRead,
    markAllRead
  };
}

export default useChatNotificationsWithGeneral;
