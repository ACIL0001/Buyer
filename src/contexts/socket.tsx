import React, { createContext, useEffect, useState, useContext, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import app from '@/config';
import useAuth from '@/hooks/useAuth';

interface Props {
  children?: ReactNode;
  setShow?: (val: boolean) => void;
  setCheck?: (val: boolean) => void;
}

interface SocketContextData {
  socket: Socket | undefined;
  onlineUsers: unknown;
  messages: unknown;
  setMessages: unknown;
  setRelode: React.Dispatch<React.SetStateAction<boolean>>;
  showChat: boolean;
  setShowChat: React.Dispatch<React.SetStateAction<boolean>>;
  socketError: string | null;
  setSocketError: React.Dispatch<React.SetStateAction<string | null>>;
}

const CreateSocket = createContext<SocketContextData | null>(null);

export function useCreateSocket() {
  return useContext(CreateSocket);
}

// Modified component to work with Next.js App Router
const SocketProvider: React.FC<Props> = (props = {}) => {
  const { 
    children = null, 
    setShow = () => {}, 
    setCheck = () => {} 
  } = props;
  
  const [socket, setSocket] = useState<Socket | undefined>();
  const [messages, setMessages] = useState<unknown[]>([]);
  const [onlineUsers] = useState<unknown>([]);
  const [relode, setRelode] = useState(false);
  const [showChat, setShowChat] = useState<boolean>(true);
  const [socketError, setSocketError] = useState<string | null>(null);





  const { user } = useAuth();

  // Initialize socket when user changes
  useEffect(() => {
    let currentSocket: Socket | undefined;
    
    const createSocket = () => {
      let userId = 'guest'; // Default to guest for unauthenticated users
      
      if (user?._id) {
        userId = user._id;
      } else {
        // Fallback to localStorage if useAuth hasn't loaded (though useAuth is preferred)
        const authData = window.localStorage.getItem('auth');
        if (authData) {
          try {
            const userData = JSON.parse(authData);
            userId = userData?.user?._id || 'guest';
          } catch (error) {
            console.error('Error parsing auth data:', error);
          }
        }
      }

      console.log('Creating socket connection for user:', userId);

      currentSocket = io(app.socket, {
        query: { userId },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        // Limit reconnection attempts to prevent spam
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

        currentSocket.on('connect', () => {
          console.log('Socket connected successfully with ID:', currentSocket?.id);
          setSocketError(null);
        });

        currentSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setSocketError('Failed to connect to chat server');
        });

        currentSocket.on('sendNotificationChatCreate', (data) => {
          console.log('Create Chat from seller data = ', data);
          if (data.code === '001') {
            setShow(true);
            setCheck(true);
          }
        });

        currentSocket.on('sendMessage', (data) => {
          console.group('📨 Buyer Socket: sendMessage');
          console.log('Data:', data);
          setMessages(p => {
            // Check if message already exists to avoid duplicates
            // We use a looser time window (5s) to catch slightly delayed server responses vs socket
            const isDuplicate = p.some((msg: any) => {
               const idMatch = msg._id === data._id;
               const contentMatch = msg.message === data.message && msg.sender === data.sender;
               const timeMatch = Math.abs(new Date(msg.createdAt).getTime() - new Date(data.createdAt).getTime()) < 5000;
               
               if (idMatch) return true;
               if (contentMatch && timeMatch) {
                   console.log('Skipping duplicate by content/time:', data._id);
                   return true;
               }
               return false;
            });
            
            if (isDuplicate) {
              console.log('🚫 Duplicate message, filtering out');
              console.groupEnd();
              return p;
            }
            
            console.log('✅ Adding message to state');
            console.groupEnd();
            return [...p, data];
          });
        });
        
        // Listen for adminMessage events specifically for admin-to-user communication
        currentSocket.on('adminMessage', (data) => {
          console.group('📨 Buyer Socket: adminMessage');
          console.log('Data:', data);
          // Make sure the sender is properly set to 'admin'
          const adminMessage = {
            ...data,
            sender: 'admin'
          };
          // Always accept admin messages
          setMessages(p => {
            // Check if message already exists to avoid duplicates
            const isDuplicate = p.some((msg: any) => {
               const idMatch = msg._id === adminMessage._id;
               const contentMatch = msg.message === adminMessage.message && msg.sender === 'admin';
               const timeMatch = Math.abs(new Date(msg.createdAt).getTime() - new Date(adminMessage.createdAt).getTime()) < 5000;
               
               if (idMatch) return true;
               if (contentMatch && timeMatch) {
                   console.log('Skipping duplicate admin message by content/time:', adminMessage._id);
                   return true;
               }
               return false;
            });
            
            if (isDuplicate) {
              console.log('🚫 Duplicate admin message, filtering out');
              console.groupEnd();
              return p;
            }
            
            console.log('✅ Adding admin message to state');
            console.groupEnd();
            return [...p, adminMessage];
          });
        });

        setSocket(currentSocket);
    };

    // Create socket on mount or when user changes
    createSocket();

    // Cleanup on unmount or when user changes
    return () => {
      if (currentSocket) {
        console.log('Cleaning up socket (user changed or unmount)');
        currentSocket.disconnect();
        currentSocket = undefined;
        setSocket(undefined);
      }
    };
  }, [user?._id]); // Re-run when user ID changes

  return (
    <CreateSocket.Provider 
      value={{
        showChat,
        messages,
        setMessages,
        setShowChat,
        socket,
        onlineUsers,
        setRelode,
        socketError,
        setSocketError
      }}
    >
      {children}
    </CreateSocket.Provider>
  );
};

export default SocketProvider;