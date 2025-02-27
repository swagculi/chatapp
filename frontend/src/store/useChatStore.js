import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./userAuthStore";
import { playNotificationSound } from "../lib/sound";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    unreadCounts: {}, // {userId: count}
    soundEnabled: localStorage.getItem('chat-sound-enabled') !== 'false', // Default to true
    typingUsers: {}, // {userId: boolean}

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const { data } = await axiosInstance.get("/messages/users");
            set({ users: data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch users");
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true, messages: [] });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch messages");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set({ messages: [...messages, res.data] });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send message");
        }
    },
    
    markMessagesAsSeen: async (userId) => {
        try {
            await axiosInstance.put(`/messages/seen/${userId}`);
            set(state => ({
                messages: state.messages.map(msg => 
                    msg.senderId === userId ? { ...msg, seen: true } : msg
                ),
                // Clear unread count for this user
                unreadCounts: {
                    ...state.unreadCounts,
                    [userId]: 0
                }
            }));
        } catch (error) {
            console.error("Error marking messages as seen:", error);
        }
    },

    getUnreadCounts: async () => {
        try {
            const res = await axiosInstance.get('/messages/unread-counts');
            set({ unreadCounts: res.data });
        } catch (error) {
            console.error("Error fetching unread counts:", error);
        }
    },

    toggleSound: () => {
        const newSoundEnabled = !get().soundEnabled;
        localStorage.setItem('chat-sound-enabled', newSoundEnabled.toString());
        set({ soundEnabled: newSoundEnabled });
    },

    setSelectedUser: (user) => {
        set({ selectedUser: user });
    },

    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            // Play notification sound when receiving a new message
            if (get().soundEnabled) {
                playNotificationSound();
            }
            
            // If the user is currently viewing the chat with the sender,
            // mark the message as seen immediately
            const { selectedUser } = get();
            if (selectedUser?._id === newMessage.senderId) {
                get().markMessagesAsSeen(newMessage.senderId);
                // Only add the message to the current messages array if it belongs to the current conversation
                set(state => ({
                    messages: [...state.messages, newMessage],
                }));
            } else {
                // Otherwise, increment the unread count
                set(state => ({
                    unreadCounts: {
                        ...state.unreadCounts,
                        [newMessage.senderId]: (state.unreadCounts[newMessage.senderId] || 0) + 1
                    }
                }));
            }
        });

        socket.on("messagesSeen", ({ senderId, receiverId }) => {
            if (senderId === useAuthStore.getState().authUser._id) {
                set(state => ({
                    messages: state.messages.map(msg => 
                        msg.senderId === senderId ? { ...msg, seen: true } : msg
                    )
                }));
            }
        });

        socket.on("messagesRead", ({ senderId }) => {
            set(state => ({
                unreadCounts: {
                    ...state.unreadCounts,
                    [senderId]: 0
                }
            }));
        });

        // Add listener for typing events
        socket.on("userTyping", ({ senderId, isTyping }) => {
            set(state => ({
                typingUsers: {
                    ...state.typingUsers,
                    [senderId]: isTyping
                }
            }));
        });

        // Add listener for confetti events
        socket.on("confettiTriggered", ({ senderId }) => {
            // We don't need to update state here as the ConfettiButton component
            // will handle the confetti animation directly
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("newMessage");
        socket.off("messagesSeen");
        socket.off("messagesRead");
        socket.off("userTyping");
        socket.off("confettiTriggered");
    }
}));
