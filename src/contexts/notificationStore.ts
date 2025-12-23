import { create } from 'zustand';

export interface Notification {
    _id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    data?: Record<string, unknown>;
    read: boolean;
    createdAt: string;
    updatedAt: string;
    receiver?: string;
    reciver?: string;
    senderId?: any;
    senderName?: string;
    senderEmail?: string;
}

interface NotificationStore {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;

    // Actions
    setNotifications: (notifications: Notification[]) => void;
    setUnreadCount: (count: number) => void;
    setLoading: (loading: boolean) => void;

    // Optimistic updates
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,

    setNotifications: (notifications) => set({ notifications }),

    setUnreadCount: (count) => set({ unreadCount: count }),

    setLoading: (loading) => set({ loading }),

    markAsRead: (id) => set((state) => {
        // Find if the notification exists and is unread
        const target = state.notifications.find(n => n._id === id);

        // If already read or not found, don't change unreadCount
        if (!target || target.read) {
            return {
                notifications: state.notifications.map(n =>
                    n._id === id ? { ...n, read: true } : n
                )
            };
        }

        // Otherwise decrement count and update status
        return {
            notifications: state.notifications.map(n =>
                n._id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
        };
    }),

    markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
    })),

    addNotification: (notification) => set((state) => {
        // Prevent duplicates
        if (state.notifications.some(n => n._id === notification._id)) {
            return state;
        }

        return {
            notifications: [notification, ...state.notifications],
            unreadCount: !notification.read ? state.unreadCount + 1 : state.unreadCount
        };
    })
}));
