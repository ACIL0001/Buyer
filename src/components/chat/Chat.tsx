'use client'
import './style.css'
import { useEffect, useRef, useState, useCallback } from 'react'
import { BiSearch, BiSend, BiArrowBack, BiPhone, BiVideo, BiDotsVerticalRounded } from 'react-icons/bi'
import { BsChatDots, BsEmojiSmile, BsThreeDotsVertical } from 'react-icons/bs'
import { HiOutlinePaperAirplane, HiOutlineEmojiHappy } from 'react-icons/hi'
import { IoMdSend, IoMdAttach } from 'react-icons/io'
import { RiMessage3Line, RiUser3Line } from 'react-icons/ri'
import { ChatAPI } from '@/app/api/chat'
import { MessageAPI } from '@/app/api/messages'
import { useCreateSocket } from '@/contexts/socket'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'

// Define TypeScript interfaces
interface User {
  _id: string
  firstName: string
  lastName: string
  avatar?: string
  socialReason?: string
  entreprise?: string
  companyName?: string
  [key: string]: any
}

interface Chat {
  _id: string
  users: User[]
  createdAt: string
  lastMessage?: string
  unreadCount?: number
}

interface Message {
  _id: string
  idChat: string
  message: string
  sender: string
  reciver: string
  createdAt: string
  isRead?: boolean
}

type SocketMessage = Message;

export default function Chat() {
  const { t } = useTranslation();
  const router = useRouter()
  const searchParams = useSearchParams()
  const [err, setErr] = useState<boolean>(false)
  const [search, setSearch] = useState<string>('')
  const [userChat, setUserChat] = useState<User | null>(null)
  const [idChat, setIdChat] = useState<string>('')
  const [chats, setChats] = useState<Chat[]>([])
  const [text, setText] = useState<string>('')
  const [reget, setReget] = useState<boolean>(false)
  const [arr, setArr] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [typing, setTyping] = useState<boolean>(false)
  const [isOnline, setIsOnline] = useState<boolean>(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const [allReceivedMessages, setAllReceivedMessages] = useState<Set<string>>(new Set())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLInputElement>(null)
  const currentChatRef = useRef<string>('')
  const processedMessagesRef = useRef<Set<string>>(new Set())
  const socketListenersAddedRef = useRef<boolean>(false)
  const messageTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const urlParamsProcessedRef = useRef<string | null>(null)
  const socketContext = useCreateSocket()
  const socket = socketContext?.socket

  // Check authentication
  useEffect(() => {
    const auth = localStorage.getItem('auth')
    console.log('🔐 Auth check:', auth ? 'Found' : 'Not found')
    if (!auth) {
      console.log('❌ No auth data found, setting error')
      setErr(true)
    } else {
      try {
        const authData = JSON.parse(auth)
        console.log('🔐 Auth data structure:', {
          hasUser: !!authData.user,
          hasTokens: !!authData.tokens,
          userKeys: authData.user ? Object.keys(authData.user) : [],
          userId: authData.user?._id,
          userType: authData.user?.type
        })
        
        // Check for user data in different possible structures
        const hasValidUser = authData.user && (
          authData.user._id || 
          authData.user.id ||
          (authData.user.user && authData.user.user._id)
        )
        
        if (!hasValidUser) {
          console.log('❌ No valid user data found, setting error')
          setErr(true)
        } else {
          console.log('✅ Valid auth data found')
        }
      } catch (error) {
        console.error('❌ Error parsing auth data:', error)
        setErr(true)
      }
    }
  }, [])

  // Fetch chats
  const getChats = useCallback(async () => {
    try {
      console.log('🔍 Fetching chats...')
      
      // Get user ID from auth data with robust extraction
      const authData = localStorage.getItem('auth')
      if (!authData) {
        console.error('❌ No auth data found')
        return
      }
      
      const userData = JSON.parse(authData)
      console.log('🔍 User data structure:', {
        hasUser: !!userData.user,
        userKeys: userData.user ? Object.keys(userData.user) : [],
        directId: userData.user?._id,
        nestedId: userData.user?.user?._id,
        rootId: userData._id
      })
      
      // Try multiple ways to extract user ID
      let userId = userData?.user?._id || 
                   userData?.user?.id || 
                   userData?.user?.user?._id || 
                   userData?._id
      
      if (!userId) {
        console.error('❌ No user ID found in auth data')
        console.error('❌ Available data:', userData)
        return
      }
      
      console.log('✅ User ID for chat fetch:', userId)
      
      // Call the correct API endpoint with proper parameters
      const response = await ChatAPI.getChats({
        id: userId,
        from: 'client' // Use 'client' instead of 'buyer' to match server logic
      })
      
      console.log('📨 Chats response:', response)
      if (response.data) {
        const rawChats = response.data as Chat[];
        
        // Deduplicate chats to prevent the same user appearing multiple times
        const uniqueChatsMap = new Map<string, Chat>();
        rawChats.forEach((chat: Chat) => {
            const partner = chat.users.find(user => user._id !== userId) || chat.users[0];
            const partnerId = partner?._id;
            
            if (partnerId) {
               if (!uniqueChatsMap.has(partnerId)) {
                  uniqueChatsMap.set(partnerId, chat);
               } else {
                  const existingChat = uniqueChatsMap.get(partnerId)!;
                  const existingTime = new Date((existingChat as any).updatedAt || existingChat.createdAt || 0).getTime();
                  const newTime = new Date((chat as any).updatedAt || chat.createdAt || 0).getTime();
                  // Replace if the current one is newer
                  if (newTime > existingTime) {
                     uniqueChatsMap.set(partnerId, chat);
                  }
               }
            }
        });
        
        const deduplicatedChats = Array.from(uniqueChatsMap.values()).sort((a, b) => {
          const timeA = new Date((a as any).updatedAt || a.createdAt || 0).getTime();
          const timeB = new Date((b as any).updatedAt || b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        setChats(deduplicatedChats)
        setArr(deduplicatedChats)
        console.log('✅ Chats loaded:', deduplicatedChats.length)
      } else {
        console.log('⚠️ No chat data in response')
      }
    } catch (error) {
      console.error('❌ Error fetching chats:', error)
    }
  }, [])

  // Fetch messages for a specific chat
  const getMessages = useCallback(async (chatId: string) => {
    try {
      setLoading(true)
      const response = await MessageAPI.getByConversation(chatId)
      if (response.data && Array.isArray(response.data)) {
        // Deduplicate messages by _id before setting
        const uniqueMessages = response.data.filter((message: Message, index: number, self: Message[]) => 
          index === self.findIndex(m => m._id === message._id)
        )
        setMessages(uniqueMessages)
        console.log('✅ Loaded', uniqueMessages.length, 'unique messages for chat:', chatId)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Mark chat as read
  const markChatAsRead = useCallback((chatId: string) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat._id === chatId 
          ? { ...chat, unreadCount: 0 }
          : chat
      )
    )
  }, [])

  // Send message
  const sendMessage = useCallback(async () => {
    if (!text.trim()) return

    try {
      const authData = localStorage.getItem('auth')
      if (!authData) return
      
      const userData = JSON.parse(authData)
      const currentUserId = userData?.user?._id || 
                           userData?.user?.id || 
                           userData?.user?.user?._id || 
                           userData?._id
      
      if (!currentUserId) return

      // If no chat ID but we have a userChat (userId from URL), send message without idChat
      // Server will create chat automatically
      const messageData = {
        idChat: idChat || 'undefined', // Server will handle chat creation if undefined
        message: text.trim(),
        sender: currentUserId,
        reciver: userChat?._id || ''
      }

      const response = await MessageAPI.send(messageData)
      
      // If chat was created, update idChat and refresh chats
      if (response && response.data?.idChat && !idChat) {
        setIdChat(response.data.idChat)
        await getChats()
      }
      
      setText('')
      setReget(prev => !prev)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }, [text, idChat, userChat, getChats])

  // Handle chat selection
  const handleChatSelect = useCallback((chat: Chat) => {
    try {
      const authData = localStorage.getItem('auth')
      if (!authData) return
      
      const userData = JSON.parse(authData)
      const currentUserId = userData?.user?._id || 
                           userData?.user?.id || 
                           userData?.user?.user?._id || 
                           userData?._id
      
      if (!currentUserId) return
      
      const otherUser = chat.users.find(user => user._id !== currentUserId)
      if (otherUser) {
        setUserChat(otherUser)
        setIdChat(chat._id)
        markChatAsRead(chat._id)
        getMessages(chat._id)
      }
    } catch (error) {
      console.error('Error in handleChatSelect:', error)
    }
  }, [markChatAsRead, getMessages])

  // Handle URL parameters to open specific chat
  useEffect(() => {
    const chatIdParam = searchParams.get('chatId');
    const userIdParam = searchParams.get('userId') || searchParams.get('sellerId');
    const announceId = searchParams.get('announceId');
    const announceType = searchParams.get('announceType');
    
    if (announceId && announceType) {
      console.log(`💬 Chat opened from ${announceType} listing: ${announceId}`);
    }
    
    // Create a stable key for tracking processed params
    const currentParams = `${chatIdParam || ''}_${userIdParam || ''}`;
    const lastProcessed = urlParamsProcessedRef.current;
    
    // Skip if we've already processed these exact params
    if (currentParams === lastProcessed && currentParams !== '') {
      return;
    }
    
    if (!chatIdParam && !userIdParam) {
      urlParamsProcessedRef.current = null;
      return;
    }
    
    // Mark as processing
    urlParamsProcessedRef.current = currentParams;
    
    // If chats haven't loaded yet, wait for them
    if (chats.length === 0 && !chatIdParam) {
      // If userId is provided but chats aren't loaded, fetch chats first
      if (userIdParam) {
        getChats();
      }
      return;
    }
    
    if (chatIdParam) {
      // Find chat by ID and open it
      const chat = chats.find(c => c._id === chatIdParam);
      if (chat) {
        handleChatSelect(chat);
      }
    } else if (userIdParam) {
      // Find chat with specific user and open it
      const chat = chats.find(c => 
        c.users?.some((user: any) => {
          const userIdStr = user._id?.toString() || user._id;
          return userIdStr === userIdParam?.toString() || userIdStr === userIdParam;
        })
      );
      if (chat) {
        handleChatSelect(chat);
      } else {
        // Chat doesn't exist yet - set up the interface so user can start chatting
        // The chat will be created automatically by the server when first message is sent
        console.log('💬 Chat with user not found, will be created on first message:', userIdParam);
        
        const authData = localStorage.getItem('auth');
        if (authData) {
          // Create async function to fetch user details
          const setupChatWithUser = async () => {
            try {
              const userData = JSON.parse(authData);
              const currentUserId = userData?.user?._id || 
                                   userData?.user?.id || 
                                   userData?.user?.user?._id || 
                                   userData?._id;
              
              // Try to fetch user details for better display
              try {
                const UserAPI = await import('@/app/api/users');
                const userResponse = await UserAPI.UserAPI.getUserById(userIdParam);
                if (userResponse && userResponse.data) {
                  const sellerUser: User = {
                    _id: userResponse.data._id || userIdParam,
                    firstName: userResponse.data.firstName || 'Vendeur',
                    lastName: userResponse.data.lastName || '',
                    avatar: userResponse.data.avatar
                  };
                  setUserChat(sellerUser);
                  console.log('✅ Fetched seller user details:', sellerUser);
                } else {
                  // Fallback to temp user if fetch fails
                  const tempUser: User = {
                    _id: userIdParam,
                    firstName: 'Vendeur',
                    lastName: '',
                  };
                  setUserChat(tempUser);
                }
              } catch (fetchError) {
                console.warn('⚠️ Could not fetch user details, using temp user:', fetchError);
                // Fallback to temp user
                const tempUser: User = {
                  _id: userIdParam,
                  firstName: 'Vendeur',
                  lastName: '',
                };
                setUserChat(tempUser);
              }
              
              // Note: idChat will be set when first message is sent and chat is created
            } catch (error) {
              console.error('❌ Error setting up chat:', error);
              // Fallback to temp user on any error
              const tempUser: User = {
                _id: userIdParam,
                firstName: 'Vendeur',
                lastName: '',
              };
              setUserChat(tempUser);
            }
          };
          
          // Call the async function
          setupChatWithUser();
        }
      }
    }
  }, [searchParams, chats]);

  // Filter chats based on search
  useEffect(() => {
    if (search.trim()) {
      const filtered = chats.filter(chat => 
        chat.users.some(user => 
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase())
        )
      )
      setArr(filtered)
    } else {
      setArr(chats)
    }
  }, [search, chats])

  // Update current chat ref when idChat changes and clear processed messages
  useEffect(() => {
    currentChatRef.current = idChat
    // Clear processed messages when switching chats to allow new messages
    processedMessagesRef.current.clear()
    // Also clear global received messages for the new chat
    setAllReceivedMessages(new Set())
    // Clear all pending timeouts when switching chats
    messageTimeoutRef.current.forEach(timeout => clearTimeout(timeout))
    messageTimeoutRef.current.clear()
  }, [idChat])

  // Socket event listeners - Completely rewritten to prevent duplicates
  useEffect(() => {
    if (!socket || !socket.on || socketListenersAddedRef.current) {
      console.log('🔌 Socket listeners already added or socket not available')
      return
    }

    console.log('🔌 Setting up socket listeners for the first time')

    const handleNewMessage = (data: SocketMessage) => {
      console.log('📨 Socket message received:', data)
      
      // Check if message was already received globally
      if (allReceivedMessages.has(data._id)) {
        console.log('⚠️ Message already received globally, skipping duplicate')
        return
      }
      
      // Clear any existing timeout for this message
      if (messageTimeoutRef.current.has(data._id)) {
        clearTimeout(messageTimeoutRef.current.get(data._id)!)
      }
      
      // Debounce message processing to prevent rapid duplicates
      const timeoutId = setTimeout(() => {
        console.log('⏰ Processing debounced message:', data._id)
        
        // Only add message if it's for the current chat
        if (data.idChat === currentChatRef.current) {
          setMessages(prev => {
            // Double-check if message already exists in state (by _id or by content + sender + time)
            const messageExists = prev.some(msg => {
              if (msg._id === data._id) return true
              // Also check by content, sender, and time to catch duplicates without _id
              if (msg.message === data.message && 
                  msg.sender === data.sender && 
                  msg.idChat === data.idChat &&
                  Math.abs(new Date(msg.createdAt || 0).getTime() - new Date(data.createdAt || 0).getTime()) < 2000) {
                return true
              }
              return false
            })
            if (messageExists) {
              console.log('⚠️ Message already exists in state, skipping duplicate:', data._id)
              return prev
            }
            console.log('✅ Adding new message to current chat:', data._id)
            // Sort messages by createdAt to maintain order
            const updated = [...prev, data].sort((a, b) => {
              const timeA = new Date(a.createdAt || 0).getTime()
              const timeB = new Date(b.createdAt || 0).getTime()
              return timeA - timeB
            })
            return updated
          })
        }
        
        // Mark message as received globally
        setAllReceivedMessages(prev => new Set([...prev, data._id]))
        
        // Update chat list optimistically
        setChats(prevChats => {
            const chatIndex = prevChats.findIndex(c => c._id === data.idChat);
            if (chatIndex !== -1) {
                const updatedChat = { ...prevChats[chatIndex] };
                updatedChat.lastMessage = data.message;
                updatedChat.createdAt = data.createdAt || new Date().toISOString(); 
                
                if (data.idChat !== currentChatRef.current) {
                    updatedChat.unreadCount = (updatedChat.unreadCount || 0) + 1;
                }

                const newChats = [...prevChats];
                newChats.splice(chatIndex, 1);
                newChats.unshift(updatedChat);
                return newChats;
            } else {
                setReget(prev => !prev); 
                return prevChats;
            }
        });
        
        // Clean up timeout
        messageTimeoutRef.current.delete(data._id)
      }, 100) // 100ms debounce
      
      messageTimeoutRef.current.set(data._id, timeoutId)
    }

    const handleAdminMessage = (data: SocketMessage) => {
      console.log('📨 Admin message received:', data)
      
      // Check if message was already received globally
      if (allReceivedMessages.has(data._id)) {
        console.log('⚠️ Admin message already received globally, skipping duplicate')
        return
      }
      
      // Clear any existing timeout for this message
      if (messageTimeoutRef.current.has(data._id)) {
        clearTimeout(messageTimeoutRef.current.get(data._id)!)
      }
      
      // Debounce message processing to prevent rapid duplicates
      const timeoutId = setTimeout(() => {
        console.log('⏰ Processing debounced admin message:', data._id)
        
        // Only add message if it's for the current chat
        if (data.idChat === currentChatRef.current) {
          setMessages(prev => {
            // Double-check if message already exists in state (by _id or by content + sender + time)
            const messageExists = prev.some(msg => {
              if (msg._id === data._id) return true
              // Also check by content, sender, and time to catch duplicates without _id
              if (msg.message === data.message && 
                  msg.sender === data.sender && 
                  msg.idChat === data.idChat &&
                  Math.abs(new Date(msg.createdAt || 0).getTime() - new Date(data.createdAt || 0).getTime()) < 2000) {
                return true
              }
              return false
            })
            if (messageExists) {
              console.log('⚠️ Admin message already exists in state, skipping duplicate:', data._id)
              return prev
            }
            console.log('✅ Adding new admin message to current chat:', data._id)
            // Sort messages by createdAt to maintain order
            const updated = [...prev, data].sort((a, b) => {
              const timeA = new Date(a.createdAt || 0).getTime()
              const timeB = new Date(b.createdAt || 0).getTime()
              return timeA - timeB
            })
            return updated
          })
        }
        
        // Mark message as received globally
        setAllReceivedMessages(prev => new Set([...prev, data._id]))
        
        // Update chat list optimistically
        setChats(prevChats => {
            const chatIndex = prevChats.findIndex(c => c._id === data.idChat);
            if (chatIndex !== -1) {
                const updatedChat = { ...prevChats[chatIndex] };
                updatedChat.lastMessage = data.message;
                updatedChat.createdAt = data.createdAt || new Date().toISOString();
                
                if (data.idChat !== currentChatRef.current) {
                    updatedChat.unreadCount = (updatedChat.unreadCount || 0) + 1;
                }

                const newChats = [...prevChats];
                newChats.splice(chatIndex, 1);
                newChats.unshift(updatedChat);
                return newChats;
            } else {
                setReget(prev => !prev);
                return prevChats;
            }
        });
        
        // Clean up timeout
        messageTimeoutRef.current.delete(data._id)
      }, 100) // 100ms debounce
      
      messageTimeoutRef.current.set(data._id, timeoutId)
    }

    // Add listeners only once and mark as added
    socket.on('sendMessage', handleNewMessage)
    socket.on('adminMessage', handleAdminMessage)
    socketListenersAddedRef.current = true

    console.log('✅ Socket listeners added successfully')

    return () => {
      console.log('🧹 Cleaning up socket listeners')
      if (socket && socket.off) {
        socket.off('sendMessage', handleNewMessage)
        socket.off('adminMessage', handleAdminMessage)
        socketListenersAddedRef.current = false
      }
    }
  }, [socket]) // Only run when socket changes

  // Scroll to bottom when new messages arrive or chat changes
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messages, idChat])

  // Load chats on mount
  useEffect(() => {
    if (!err) {
      getChats()
    }
  }, [err, getChats, reget])

  // Component cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Chat component unmounting, cleaning up socket listeners')
      if (socket && socket.off) {
        socket.off('sendMessage')
        socket.off('adminMessage')
      }
      socketListenersAddedRef.current = false
      processedMessagesRef.current.clear()
      
      // Clear all pending timeouts
      messageTimeoutRef.current.forEach(timeout => clearTimeout(timeout))
      messageTimeoutRef.current.clear()
    }
  }, [socket])

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Format time
  const formatTime = (dateString: string) => {
    if (!dateString) return ''
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      } else if (days === 1) {
        return t('chat.yesterday')
      } else if (days < 7) {
        return date.toLocaleDateString('fr-FR', { weekday: 'short' })
      } else {
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      }
    } catch (error) {
      console.error('Error formatting time:', error)
      return ''
    }
  }

  // Format message date
  const formatMessageDate = (dateString: string) => {
    if (!dateString) return ''
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) {
        return t('chat.today')
      } else if (days === 1) {
        return t('chat.yesterday')
      } else if (days < 7) {
        return date.toLocaleDateString('fr-FR', { weekday: 'long' })
      } else {
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
      }
    } catch (error) {
      console.error('Error formatting message date:', error)
      return ''
    }
  }

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    if (!Array.isArray(messages)) {
      console.warn('groupMessagesByDate: messages is not an array', messages)
      return {}
    }
    
    const groups: { [key: string]: Message[] } = {}
    
    messages.forEach((message, index) => {
      if (!message || !message.createdAt) {
        console.warn(`groupMessagesByDate: message at index ${index} is invalid`, message)
        return
      }
      
      try {
        const date = new Date(message.createdAt)
        if (isNaN(date.getTime())) {
          console.warn(`groupMessagesByDate: invalid date for message at index ${index}`, message.createdAt)
          return
        }
        
        const dateString = date.toDateString()
        if (!groups[dateString]) {
          groups[dateString] = []
        }
        groups[dateString].push(message)
      } catch (error) {
        console.error(`Error grouping message by date at index ${index}:`, error, message)
      }
    })
    
    return groups
  }

  const goBack = () => {
    router.push('/')
  }

  if (err) {
    return (
      <div className="modern-error-container">
        <div className="error-content">
          <div className="error-icon">
            <RiMessage3Line />
          </div>
          <h2>{t('chat.accessDenied')}</h2>
          <p>{t('chat.loginRequired')}</p>
          <button className="error-button" onClick={goBack}>
            <BiArrowBack />
            {t('chat.backToHome')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-chat-app">
      {/* Header */}
      <div className="chat-header-modern">
        <button className="back-button-modern" onClick={goBack}>
          <BiArrowBack />
        </button>
        <div className="header-content">
          <h1>{t('chat.messages')}</h1>
          <p>{t('chat.discussRealTime')}</p>
        </div>
        <div className="header-actions">
          <button className="action-button">
            <BiSearch />
          </button>
          <button className="action-button">
            <BsThreeDotsVertical />
          </button>
        </div>
      </div>

      <div className="chat-main-container">
        {/* Sidebar */}
        <div className="chat-sidebar-modern">
          <div className="sidebar-header">
            <div className="search-container-modern">
              <BiSearch className="search-icon" />
              <input 
                type="text" 
                placeholder={t('chat.searchConversations')}
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="search-input-modern"
              />
            </div>
          </div>
  
          <div className="conversations-list">
            {arr.length === 0 ? (
              <div className="empty-conversations">
                <div className="empty-icon">
                  <BsChatDots />
                </div>
                <h3>{t('chat.noConversations')}</h3>
                <p>{t('chat.startNewConversation')}</p>
              </div>
            ) : (
              arr.map((chat) => {
                let currentUserId = null
                try {
                  const authData = localStorage.getItem('auth')
                  if (authData) {
                    const userData = JSON.parse(authData)
                    currentUserId = userData?.user?._id || 
                                   userData?.user?.id || 
                                   userData?.user?.user?._id || 
                                   userData?._id
                  }
                } catch (error) {
                  console.error('Error getting current user ID:', error)
                }
                
                if (!currentUserId) return null
                
                const otherUser = chat.users.find(user => user._id !== currentUserId)
                if (!otherUser) return null
                
                return (
                  <div 
                    key={chat._id}
                    className={`conversation-item ${idChat === chat._id ? 'active' : ''}`}
                    onClick={() => handleChatSelect(chat)}
                  >
                    <div className="conversation-avatar">
                      <Image
                        src={otherUser.avatar || '/assets/images/avatar.jpg'}
                        alt={`${otherUser.firstName} ${otherUser.lastName}`}
                        width={50}
                        height={50}
                        className="avatar-image"
                        onError={(e: any) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/assets/images/avatar.jpg'
                        }}
                      />
                      <div className={`online-status ${isOnline ? 'online' : 'offline'}`}></div>
                    </div>
                    <div className="conversation-content">
                      <div className="conversation-header">
                        <h4>{otherUser.socialReason || otherUser.entreprise || otherUser.companyName || `${otherUser.firstName} ${otherUser.lastName}`}</h4>
                        <span className="conversation-time">
                          {chat.createdAt ? formatTime(chat.createdAt) : ''}
                        </span>
                      </div>
                      <div className="conversation-preview">
                        <p>{chat.lastMessage || t('chat.noMessage')}</p>
                        {chat.unreadCount && chat.unreadCount > 0 && (
                          <div className="unread-badge">
                            {chat.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
  
        {/* Chat Area */}
        <div className="chat-area-modern">
          {!idChat && !userChat ? (
            <div className="empty-chat-modern">
              <div className="empty-chat-content">
                <div className="empty-chat-icon">
                  <RiMessage3Line />
                </div>
                <h3>{t('chat.selectConversation')}</h3>
                <p>{t('chat.chooseConversationToStart')}</p>
              </div>
            </div>
          ) : (
            <div className="chat-conversation-wrapper">
              {/* Chat Header */}
              <div className="chat-conversation-header">
                <div className="conversation-info">
                  <div className="conversation-avatar-small">
                    <Image
                      src={userChat?.avatar || '/assets/images/avatar.jpg'}
                      alt={`${userChat?.firstName} ${userChat?.lastName}`}
                      width={40}
                      height={40}
                      className="avatar-image-small"
                      onError={(e: any) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/assets/images/avatar.jpg'
                      }}
                    />
                    <div className={`online-status-small ${isOnline ? 'online' : 'offline'}`}></div>
                  </div>
                  <div className="conversation-details">
                    <h4>{userChat?.socialReason || userChat?.entreprise || userChat?.companyName || `${userChat?.firstName} ${userChat?.lastName}`}</h4>
                    <span className="status-text">
                      {isOnline ? t('chat.online') : t('chat.offline')}
                    </span>
                  </div>
                </div>
                <div className="conversation-actions">
                  <button className="action-btn">
                    <BiPhone />
                  </button>
                  <button className="action-btn">
                    <BiVideo />
                  </button>
                  <button className="action-btn">
                    <BiDotsVerticalRounded />
                  </button>
                </div>
              </div>
                    
              {/* Messages Area */}
              <div className="messages-container">
                {loading ? (
                  <div className="loading-messages">
                    <div className="loading-spinner"></div>
                    <p>{t('chat.loadingMessages')}</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="empty-messages-modern">
                    <div className="empty-messages-icon">
                      <RiMessage3Line />
                    </div>
                    <h4>{t('chat.noMessages')}</h4>
                    <p>{t('chat.sendFirstMessage')}</p>
                  </div>
                ) : (
                  <div className="messages-list">
                    {Array.isArray(messages) && messages.length > 0 ? (() => {
                      // Deduplicate messages before grouping by date
                      const uniqueMessages = messages.filter((message, index, self) => 
                        index === self.findIndex(m => {
                          // Check by _id first
                          if (m._id && message._id && m._id === message._id) return true
                          // Also check by content, sender, and time (within 2 seconds)
                          if (m.message === message.message && 
                              m.sender === message.sender && 
                              m.idChat === message.idChat &&
                              Math.abs(new Date(m.createdAt || 0).getTime() - new Date(message.createdAt || 0).getTime()) < 2000) {
                            return true
                          }
                          return false
                        })
                      )
                      
                      return Object.entries(groupMessagesByDate(uniqueMessages)).map(([date, dateMessages]) => (
                        <div key={date}>
                          <div className="date-divider">
                            <span>{dateMessages[0]?.createdAt ? formatMessageDate(dateMessages[0].createdAt) : ''}</span>
                          </div>
                          {dateMessages.map((message) => {
                            let isSender = false
                            try {
                              const authData = localStorage.getItem('auth')
                              if (authData) {
                                const userData = JSON.parse(authData)
                                const currentUserId = userData?.user?._id || 
                                                     userData?.user?.id || 
                                                     userData?.user?.user?._id || 
                                                     userData?._id
                                isSender = message.sender === currentUserId
                              }
                            } catch (error) {
                              console.error('Error checking message sender:', error)
                            }
                            
                            return (
                              <div
                                key={message._id || `${message.sender}_${message.createdAt}_${message.message}`}
                                className={`message-wrapper-modern ${isSender ? 'sender' : 'receiver'}`}
                              >
                                <div className={`message-bubble ${isSender ? 'sent' : 'received'}`}>
                                  <p>{message.message}</p>
                                  <span className="message-time">
                                    {message.createdAt ? formatTime(message.createdAt) : ''}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ))
                    })() : null}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* Message Input */}
                <div className="message-input-container">
                  <div className="input-wrapper">
                    <button className="attach-button">
                      <IoMdAttach />
                    </button>
                    <div className="input-field">
                      <input 
                        ref={textRef}
                        type="text" 
                        placeholder={t('chat.typeMessage')}
                        value={text} 
                        onChange={(e) => setText(e.target.value)} 
                        onKeyPress={handleKeyPress}
                        className="message-input"
                      />
                      <button 
                        className="emoji-button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        <HiOutlineEmojiHappy />
                      </button>
                    </div>
                    <button 
                      className={`send-button ${text.trim() ? 'active' : ''}`}
                      onClick={sendMessage}
                      disabled={!text.trim()}
                    >
                      <IoMdSend />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}