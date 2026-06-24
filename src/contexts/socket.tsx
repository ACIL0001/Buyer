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
  onlineUsers: string[];
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
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [relode, setRelode] = useState(false);
  const [showChat, setShowChat] = useState<boolean>(true);
  const [socketError, setSocketError] = useState<string | null>(null);





  const { user } = useAuth();

  // Initialize socket when user changes
  useEffect(() => {
    let currentSocket: Socket | undefined;
    
    const createSocket = () => {
      let userId = 'guest'; // Default to guest for unauthenticated users
      let token = ''; // Store the JWT token
      
      if (user?._id) {
        userId = user._id;
        // The token is not directly in the 'user' object from useAuth usually, we must get it from localStorage
        const authData = window.localStorage.getItem('auth');
        if (authData) {
          try {
            const parsed = JSON.parse(authData);
            token = parsed?.tokens?.accessToken || parsed?.tokens?.access_token || '';
          } catch (e) {}
        }
      } else {
        // Fallback to localStorage if useAuth hasn't loaded (though useAuth is preferred)
        const authData = window.localStorage.getItem('auth');
        if (authData) {
          try {
            const userData = JSON.parse(authData);
            userId = userData?.user?._id || 'guest';
            token = userData?.tokens?.accessToken || userData?.tokens?.access_token || '';
          } catch (error) {
            console.error('Error parsing auth data:', error);
          }
        }
      }

      // If still no authenticated user, use the guestUserId from localStorage
      if (userId === 'guest' || !userId) {
        let savedGuestUserId = window.localStorage.getItem('guestUserId');
        if (!savedGuestUserId) {
          savedGuestUserId = `guest_${Date.now()}_${typeof crypto !== 'undefined' ? crypto.randomUUID().split('-')[0] : Math.random().toString(36).substr(2, 9)}`;
          window.localStorage.setItem('guestUserId', savedGuestUserId);
        }
        userId = savedGuestUserId;
      }

      currentSocket = io(app.socket, {
        query: { userId }, 
        auth: { token }, // Pass token securely via auth payload
        transports: ['websocket', 'polling'],
        timeout: 20000,
        // Limit reconnection attempts to prevent spam
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

        currentSocket.on('connect', () => {
          setSocketError(null);
        });

        currentSocket.on('online-users', (users: any) => {
          if (Array.isArray(users)) {
            setOnlineUsers(users.map((u: any) => u.userId || u._id || u));
          }
        });

        currentSocket.on('connect_error', (error) => {
          setSocketError('Failed to connect to chat server');
        });

        currentSocket.on('sendNotificationChatCreate', (data) => {
          if (data.code === '001') {
            setShow(true);
            setCheck(true);
          }
        });

        currentSocket.on('sendMessage', (data) => {
          setMessages(p => {
            // Check if message already exists to avoid duplicates
            // We use a looser time window (5s) to catch slightly delayed server responses vs socket
            const isDuplicate = p.some((msg: any) => {
               const idMatch = msg._id === data._id;
               const contentMatch = msg.message === data.message && msg.sender === data.sender;
               const timeMatch = Math.abs(new Date(msg.createdAt).getTime() - new Date(data.createdAt).getTime()) < 5000;
               
               if (idMatch) return true;
               if (contentMatch && timeMatch) {
                   return true;
               }
               return false;
            });
            
            if (isDuplicate) {
              return p;
            }
            
            return [...p, data];
          });
        });
        
        // Listen for adminMessage events specifically for admin-to-user communication
        currentSocket.on('adminMessage', (data) => {
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
                   return true;
               }
               return false;
            });
            
            if (isDuplicate) {
              return p;
            }
            
            return [...p, adminMessage];
          });
        });

        setSocket(currentSocket);
    };

    // Create socket on mount or when user changes
    createSocket();

    return () => {
      if (currentSocket) {
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