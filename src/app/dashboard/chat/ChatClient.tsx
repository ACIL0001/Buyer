'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnackbar } from 'notistack';
import useAuth from '@/hooks/useAuth';
import { useCreateSocket } from '@/contexts/socket';
import { ChatAPI } from '@/app/api/chat';
import { MessageAPI } from '@/app/api/messages';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  TextField,
  Avatar,
  IconButton,
  Badge,
  Tooltip,
  CircularProgress,
  useTheme,
  alpha,
  Chip,
  useMediaQuery,
  Stack,
  InputAdornment,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  SearchRounded,
  SendRounded,
  MoreVertRounded,
  KeyboardBackspaceRounded,
  ChatRounded,
  RefreshRounded,
  CloseRounded,
  MenuRounded,
} from '@mui/icons-material';

// ===== MODERN STYLED COMPONENTS =====

const ModernChatContainer = styled(Box)(({ theme }) => ({
  height: 'calc(100vh - 64px)',
  display: 'flex',
  background: 'linear-gradient(135deg, #667eea 0%, #1976d2 50%, #64b5f6 100%)',
  borderRadius: '20px',
  overflow: 'hidden',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(33, 150, 243, 0.3), transparent 50%)',
    pointerEvents: 'none',
  },
  [theme.breakpoints.down('md')]: {
    height: 'calc(100vh - 56px)',
    borderRadius: '16px',
  },
  [theme.breakpoints.down('sm')]: {
    height: 'calc(100vh - 48px)',
    borderRadius: '12px',
  },
}));

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: '380px',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(30px)',
  borderRight: '1px solid rgba(255, 255, 255, 0.3)',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
  [theme.breakpoints.down('lg')]: {
    width: '340px',
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    zIndex: 1200,
    transform: 'translateX(-100%)',
    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    '&.open': {
      transform: 'translateX(0)',
    },
  },
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5, 2.5),
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(25, 118, 210, 0.1) 100%)',
  backdropFilter: 'blur(10px)',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), transparent)',
  },
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 2.5),
  background: 'rgba(102, 126, 234, 0.03)',
}));

const ContactsList = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(1.5),
  background: 'rgba(255, 255, 255, 0.5)',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0, 0, 0, 0.02)',
    borderRadius: '10px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'linear-gradient(135deg, #667eea, #1976d2)',
    borderRadius: '10px',
    '&:hover': {
      background: 'linear-gradient(135deg, #1976d2, #667eea)',
    },
  },
}));

const ContactCard = styled(motion.div, {
  shouldForwardProp: (prop) => prop !== '$active',
})<{ $active?: boolean }>(({ theme, $active }) => ({
  padding: theme.spacing(2, 2.5),
  margin: theme.spacing(0.75, 1),
  borderRadius: '18px',
  background: $active 
    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(25, 118, 210, 0.15) 100%)' 
    : 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  border: $active 
    ? '2px solid rgba(102, 126, 234, 0.4)' 
    : '1px solid rgba(0, 0, 0, 0.06)',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: $active 
    ? '0 8px 24px rgba(102, 126, 234, 0.2)' 
    : '0 2px 8px rgba(0, 0, 0, 0.04)',
  '&:hover': {
    background: $active 
      ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(25, 118, 210, 0.2) 100%)' 
      : 'rgba(255, 255, 255, 0.95)',
    transform: 'translateY(-3px)',
    boxShadow: '0 12px 32px rgba(102, 126, 234, 0.15)',
    borderColor: $active ? 'rgba(102, 126, 234, 0.5)' : 'rgba(102, 126, 234, 0.2)',
  },
}));

const ChatArea = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 30% 20%, rgba(102, 126, 234, 0.05), transparent 50%)',
    pointerEvents: 'none',
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
  },
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5, 3),
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
  position: 'relative',
  zIndex: 1,
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(3, 4),
  overflowY: 'auto',
  background: 'transparent',
  position: 'relative',
  zIndex: 0,
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0, 0, 0, 0.02)',
    borderRadius: '10px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'linear-gradient(135deg, #667eea, #1976d2)',
    borderRadius: '10px',
    '&:hover': {
      background: 'linear-gradient(135deg, #1976d2, #667eea)',
    },
  },
}));

const MessageBubble = styled(motion.div, {
  shouldForwardProp: (prop) => prop !== '$sender',
})<{ $sender?: boolean }>(({ theme, $sender }) => ({
  maxWidth: '100%', // Let parent control max width
  width: 'fit-content', // Only take necessary space
  padding: theme.spacing(1.5, 2.5),
  borderRadius: $sender ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
  background: $sender 
    ? 'linear-gradient(135deg, #667eea 0%, #1976d2 100%)' 
    : 'rgba(255, 255, 255, 0.95)',
  color: $sender ? 'white' : '#2d3748',
  boxShadow: $sender 
    ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
    : '0 2px 8px rgba(0, 0, 0, 0.1)',
  marginBottom: theme.spacing(0.5), // Reduced margin since we have wrapper margin
  // alignSelf: $sender ? 'flex-end' : 'flex-start', // Handled by parent
  position: 'relative',
  backdropFilter: 'blur(10px)',
  border: $sender ? 'none' : '1px solid rgba(0, 0, 0, 0.05)',
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%',
  },
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5, 3),
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  borderTop: '1px solid rgba(0, 0, 0, 0.08)',
  boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
  position: 'relative',
  zIndex: 1,
}));

const InputWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  background: 'rgba(255, 255, 255, 0.9)',
  padding: theme.spacing(1.25, 2.5),
  borderRadius: '30px',
  border: '2px solid rgba(102, 126, 234, 0.2)',
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  '&:focus-within': {
    borderColor: 'rgba(102, 126, 234, 0.5)',
    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
    background: 'rgba(255, 255, 255, 1)',
  },
}));

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: theme.spacing(4),
  textAlign: 'center',
  background: 'transparent',
  position: 'relative',
  zIndex: 0,
}));

const SidebarOverlay = styled(Box)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'block',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 1100,
    opacity: 0,
    visibility: 'hidden',
    transition: 'all 0.3s ease',
    '&.open': {
      opacity: 1,
      visibility: 'visible',
    },
  },
}));

// ===== MAIN COMPONENT =====

export default function ModernChat() {
  const { auth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const { t, i18n } = useTranslation();

  // State management
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessages, setLastMessages] = useState<Record<string, any>>({});

  // Socket
  const socketContext = useCreateSocket();
  const socket = socketContext?.socket;
  const socketMessages = (socketContext?.messages || []) as any[];

  // Combine and deduplicate messages
  const combinedMessages = useMemo(() => {
    // Filter socket messages for current chat
    const currentChatSocketMessages = socketMessages.filter((m: any) => 
      !m.idChat || (selectedChat && m.idChat === selectedChat._id)
    );

    const allMessages = [...messages, ...currentChatSocketMessages];
    const uniqueMessages = allMessages.filter((message, index, self) => 
      index === self.findIndex(m => 
        m._id === message._id || 
        (m.message === message.message && 
         m.sender === message.sender && 
         m.idChat === message.idChat &&
         Math.abs(new Date(m.createdAt || 0).getTime() - new Date(message.createdAt || 0).getTime()) < 5000)
      )
    );
    return uniqueMessages.sort((a, b) => 
      new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );
  }, [messages, socketMessages, selectedChat]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ===== API FUNCTIONS =====

  const fetchChats = async () => {
    if (!auth?.user?._id) {
      console.warn('⚠️ Cannot fetch chats: No user ID available');
      return;
    }
    
    console.log('🔄 Fetching chats for buyer:', auth.user._id);
    setLoading(true);
    setError(null);
    
    try {
      const response = await ChatAPI.getChats({ 
        id: auth.user._id, 
        from: 'buyer' 
      });
      
      let chatsArray: any[] = [];
      if (Array.isArray(response)) {
        chatsArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        chatsArray = response.data;
      } else if ((response as any)?.chats && Array.isArray((response as any).chats)) {
        chatsArray = (response as any).chats;
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        chatsArray = [];
      }
      
      const validChats = chatsArray.filter((chat: any) => {
        return chat && 
               chat._id && 
               Array.isArray(chat.users) && 
               chat.users.length >= 2;
      });
      
      if (validChats.length === 0) {
        console.log('ℹ️ No chats found for this buyer');
        setChats([]);
        setLastMessages({});
        setError(null);
        setLoading(false);
        return;
      }
      
      const lastMessagesMap: Record<string, any> = {};
      const lastMessagePromises = validChats.map(async (chat: any) => {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          );
          
          const messagesPromise = MessageAPI.getByConversation(chat._id);
          const messagesResponse: any = await Promise.race([messagesPromise, timeoutPromise]);
          const messages = messagesResponse?.data || messagesResponse || [];
          
          if (Array.isArray(messages) && messages.length > 0) {
            const sortedMessages = [...messages].sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt || 0).getTime();
              const dateB = new Date(b.createdAt || 0).getTime();
              return dateB - dateA;
            });
            lastMessagesMap[chat._id] = sortedMessages[0];
          }
        } catch (error) {
          console.warn(`Error fetching last message for chat ${chat._id}:`, error);
        }
      });
      
      await Promise.allSettled(lastMessagePromises);
      setLastMessages(lastMessagesMap);
      
      const sortedChats = [...validChats].sort((a: any, b: any) => {
        const lastMsgA = lastMessagesMap[a._id];
        const lastMsgB = lastMessagesMap[b._id];
        
        const timeA = lastMsgA 
          ? new Date(lastMsgA.createdAt || 0).getTime()
          : new Date(a.createdAt || 0).getTime();
        const timeB = lastMsgB
          ? new Date(lastMsgB.createdAt || 0).getTime()
          : new Date(b.createdAt || 0).getTime();
        
        return timeB - timeA;
      });
      
      setChats(sortedChats);
      setError(null);
    } catch (error: any) {
      console.error('❌ Error fetching chats:', error);
      setError('Failed to load chats. Please try refreshing.');
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    if (!chatId) return;
    
    setLoading(true);
    try {
      const response: any = await MessageAPI.getByConversation(chatId);
      const messagesData = response?.data || response || [];
      setMessages(Array.isArray(messagesData) ? messagesData : []);
      setError(null);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    const receiver = selectedChat.users?.find((user: any) => user._id !== auth?.user?._id) || selectedChat.users?.[0];
    if (!receiver || !receiver._id) {
      console.error('Receiver not found in chat users');
      setNewMessage(messageText);
      return;
    }

    const tempMessage = {
      _id: `temp_${Date.now()}`,
      idChat: selectedChat._id,
      message: messageText,
      sender: auth?.user?._id,
      reciver: receiver._id,
      createdAt: new Date().toISOString(),
      isSocket: true
    };

    setMessages(prev => [...prev, tempMessage]);
    
    const messageData = {
      idChat: selectedChat._id,
      message: messageText,
      sender: auth?.user?._id || '',
      reciver: receiver._id
    };

    if (socket) {
      // socket.emit('sendMessage', messageData);
    }
    
    MessageAPI.send(messageData).then(response => {
      if (response && (response as any)._id) {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempMessage._id 
              ? { ...response, idChat: selectedChat._id }
              : msg
          )
        );
        
        if (selectedChat._id) {
          setLastMessages((prev: Record<string, any>) => ({
            ...prev,
            [selectedChat._id]: { ...(response as any), idChat: selectedChat._id }
          }));
        }
      }
      if (socketContext?.setMessages) {
        (socketContext.setMessages as (msgs: any[]) => void)([]);
      }
      setError(null);
    }).catch(error => {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      setNewMessage(messageText);
    });
  };

  const handleChatSelect = async (chat: any) => {
    setSelectedChat(chat);
    if (socketContext?.setMessages) {
      (socketContext.setMessages as (msgs: any[]) => void)([]);
    }
    await fetchMessages(chat._id);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const formatTime = (timestamp: any) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
  };

  const getOtherUser = (chat: any) => {
    if (!chat || !chat.users || !Array.isArray(chat.users)) return null;
    return chat.users.find((user: any) => user._id !== auth?.user?._id) || chat.users[0];
  };

  useEffect(() => {
    if (auth?.user?._id) {
      fetchChats();
    }
  }, [auth?.user?._id]);

  useEffect(() => {
    if (!socket || !selectedChat?._id || !auth?.user?._id) return;
    
    console.log('Joining chat room:', selectedChat._id);
    socket.emit('joinChat', { chatId: selectedChat._id, userId: auth.user._id });
    
    return () => {
      console.log('Leaving chat room:', selectedChat._id);
      if (auth?.user?._id) {
        socket.emit('leaveChat', { chatId: selectedChat._id, userId: auth.user._id });
      }
    };
  }, [socket, selectedChat?._id, auth?.user?._id]);

  // Direct socket listeners for real-time updates (similar to Admin ChatLayout)
  useEffect(() => {
        if (!socket || !selectedChat?._id) return;
    
        console.log('🎧 Adding direct socket listeners for ChatClient. Chat ID:', selectedChat._id);
        
        const handleNewSocketMessage = (data: any) => {
          console.group('🔥 ChatClient: New Socket Message');
          console.log('Payload:', data);
          
          // Check if message belongs to current chat
          if (data.idChat === selectedChat._id) {
            console.log('✅ Message belongs to current chat, adding to state');
            
            setMessages(prev => {
              // Deduplicate
              const exists = prev.some(msg => 
                msg._id === data._id || 
                (msg.message === data.message && msg.sender === data.sender && 
                   Math.abs(new Date(msg.createdAt).getTime() - new Date(data.createdAt).getTime()) < 5000)
              );
              
              if (exists) {
                console.log('⚠️ Message already exists in local state, skipping');
                console.groupEnd();
                return prev;
              }
              
              console.log('✅ Added to local messages');
              console.groupEnd();
              return [...prev, data];
            });
            
            // Scroll to bottom
            setTimeout(() => {
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          } else {
            console.log('❌ Message NOT for current chat:', data.idChat);
            console.groupEnd();
          }
        };
    
        // Listen for both event types
        socket.on('adminMessage', handleNewSocketMessage);
        socket.on('sendMessage', handleNewSocketMessage);
        
        return () => {
          console.log('🧹 Removing direct socket listeners');
          socket.off('adminMessage', handleNewSocketMessage);
          socket.off('sendMessage', handleNewSocketMessage);
        };
      }, [socket, selectedChat?._id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [combinedMessages]);

  const filteredChats = chats.filter(chat => {
    const otherUser = getOtherUser(chat);
    if (!otherUser) return false;
    const name = `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  // Auto-select chat from URL query param
  useEffect(() => {
    const conversationId = searchParams.get('conversationId') || searchParams.get('chatId');
    const targetUserId = searchParams.get('userId');

    if (chats.length > 0 && !selectedChat) {
      if (conversationId) {
        const chatToSelect = chats.find(chat => chat._id === conversationId);
        if (chatToSelect) {
          handleChatSelect(chatToSelect);
        }
      } else if (targetUserId) {
        // Try to find existing chat with this user
        const chatToSelect = chats.find(chat => 
          chat.users?.some((u: any) => u._id === targetUserId)
        );
        if (chatToSelect) {
          handleChatSelect(chatToSelect);
        }
      }
    }
  }, [chats, searchParams, selectedChat]);

  return (
    <>
      <SidebarOverlay 
        className={sidebarOpen ? 'open' : ''}
        onClick={() => setSidebarOpen(false)}
      />
      
      <ModernChatContainer>
        {/* Sidebar */}
        <SidebarContainer className={sidebarOpen ? 'open' : ''}>
          <SidebarHeader>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h5" fontWeight={700} sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #1976d2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {isMobile ? t('chat.title') : t('chat.title')}
              </Typography>
              {isMobile && (
                <IconButton onClick={() => setSidebarOpen(false)}>
                  <CloseRounded />
                </IconButton>
              )}
            </Stack>
          </SidebarHeader>

          <SearchContainer>
            <TextField
              fullWidth
              size="small"
              placeholder={t('chat.searchConversations')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '25px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '& fieldset': { border: 'none' },
                },
              }}
            />
          </SearchContainer>

          <ContactsList>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : filteredChats.length === 0 ? (
              <Box textAlign="center" py={8} px={3}>
                <ChatRounded sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary" variant="body2">
                  {t('chat.noConversations')}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  {t('chat.startFromOrder')}
                </Typography>
              </Box>
            ) : (
              filteredChats.map((chat) => {
                const otherUser = getOtherUser(chat);
                const lastMsg = lastMessages[chat._id];
                const isActive = selectedChat?._id === chat._id;

                return (
                  <ContactCard
                    key={chat._id}
                    $active={isActive}
                    onClick={() => handleChatSelect(chat)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color="success"
                      >
                        <Avatar
                          src={otherUser?.avatar?.url || '/assets/images/avatar.jpg'}
                          sx={{ width: 48, height: 48 }}
                        >
                          {otherUser?.firstName?.[0] || 'U'}
                        </Avatar>
                      </Badge>

                      <Box flex={1} minWidth={0}>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {`${otherUser?.firstName || ''} ${otherUser?.lastName || t('chat.unknown')}`.trim()}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          noWrap
                          sx={{ display: 'block', maxWidth: '100%' }}
                        >
                          {lastMsg?.message || t('chat.noMessages')}
                        </Typography>
                      </Box>

                      {lastMsg && (
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(lastMsg.createdAt)}
                        </Typography>
                      )}
                    </Stack>
                  </ContactCard>
                );
              })
            )}
          </ContactsList>
        </SidebarContainer>

        {/* Chat Area */}
        <ChatArea>
          {!selectedChat ? (
            <EmptyState>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <ChatRounded sx={{ fontSize: 120, color: 'rgba(102, 126, 234, 0.3)', mb: 3 }} />
                <Typography variant="h5" fontWeight={600} color="text.secondary" gutterBottom>
                  {t('chat.selectConversation')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('chat.chooseContact')}
                </Typography>
              </motion.div>
            </EmptyState>
          ) : (
            <>
              <ChatHeader>
                {isMobile && (
                  <IconButton onClick={() => setSidebarOpen(true)}>
                    <MenuRounded />
                  </IconButton>
                )}
                
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  color="success"
                >
                  <Avatar
                    src={getOtherUser(selectedChat)?.avatar?.url || '/assets/images/avatar.jpg'}
                    sx={{ width: 48, height: 48 }}
                  />
                </Badge>

                <Box flex={1}>
                  <Typography variant="h6" fontWeight={600}>
                    {`${getOtherUser(selectedChat)?.firstName || ''} ${getOtherUser(selectedChat)?.lastName || t('chat.user')}`.trim()}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {t('chat.online')}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Tooltip title={t('chat.refresh')}>
                    <IconButton size="small" onClick={() => fetchMessages(selectedChat._id)}>
                      <RefreshRounded />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('chat.moreOptions')}>
                    <IconButton size="small">
                      <MoreVertRounded />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </ChatHeader>

              <MessagesContainer>
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                  </Box>
                ) : combinedMessages.length === 0 ? (
                  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                    <Typography variant="body1" color="text.secondary">
                      {t('chat.noMessages')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('chat.startConversation')}
                    </Typography>
                  </Box>
                ) : (
                  <>
                {combinedMessages.map((msg, index) => {
                  const isSender = msg.sender === auth?.user?._id;
                  const showAvatar = !isSender && (
                    index === 0 || 
                    combinedMessages[index - 1].sender !== msg.sender ||
                    new Date(msg.createdAt).getTime() - new Date(combinedMessages[index - 1].createdAt).getTime() > 60000
                  );

                  return (
                    <Box
                      key={msg._id || index}
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                         justifyContent: isSender ? 'flex-end' : 'flex-start',
                        mb: 1,
                        alignItems: 'flex-end',
                      }}
                    >
                      {!isSender && (
                        <Box sx={{ width: 40, mr: 1, display: 'flex', justifyContent: 'center' }}>
                           {showAvatar ? (
                             <Avatar
                               src={getOtherUser(selectedChat)?.avatar?.url || '/assets/images/avatar.jpg'}
                               sx={{ width: 32, height: 32 }}
                             >
                               {getOtherUser(selectedChat)?.firstName?.[0] || 'U'}
                             </Avatar>
                           ) : <Box sx={{ width: 32 }} />}
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isSender ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                        <MessageBubble
                          $sender={isSender}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>
                            {msg.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mt: 0.5,
                              opacity: 0.7,
                              fontSize: '0.65rem',
                              textAlign: 'right', // Timestamp always right aligned in bubble
                              width: '100%',
                            }}
                          >
                            {formatTime(msg.createdAt)}
                          </Typography>
                        </MessageBubble>
                      </Box>
                    </Box>
                  );
                })}
                <div ref={messagesEndRef} />
                  </>
                )}
              </MessagesContainer>

              <InputContainer>
                <InputWrapper>
                  <TextField
                    fullWidth
                    variant="standard"
                    placeholder={t('chat.typeMessage')}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    InputProps={{
                      disableUnderline: true,
                      sx: { fontSize: '0.95rem' },
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #1976d2 100%)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1976d2 0%, #667eea 100%)',
                      },
                      '&:disabled': {
                        background: 'rgba(0, 0, 0, 0.12)',
                      },
                    }}
                  >
                    <SendRounded />
                  </IconButton>
                </InputWrapper>
              </InputContainer>
            </>
          )}
        </ChatArea>
      </ModernChatContainer>
    </>
  );
}
