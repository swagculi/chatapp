import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";


export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    onlineUsers: [],
    socket: null,

    isCheckingAuth: true,

    checkAuth: async() => {
        try {
            const res = await axiosInstance.get("/auth/check");
            
            set({authUser:res.data});
            get().connectSocket();

        } catch (error) {
            console.log("Error in checkAuth:", error);
            set({authUser:null});

        } finally {
            set({isCheckingAuth: false });
        }
    },

    

    signup: async (data) => {
        set({isSigningUp: true});
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            toast.success("Account created successfully");
            get().connectSocket();
            set({authUser: res.data});

        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data });
            toast.success("Logged in successfully");

            get().connectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({authUser: null});
            toast.success("Logged out successfully");
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
          const res = await axiosInstance.put("/auth/update-profile", data);
          set({ authUser: res.data });
          toast.success("Profile updated successfully");
        } catch (error) {
          console.log("error in update profile:", error);
          toast.error(error.response.data.message);
        } finally {
          set({ isUpdatingProfile: false });
        }
      },
      

      connectSocket: () => {
        const {authUser} = get()
        if(!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id,
            },
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
        });
        socket.connect()

        set({socket:socket});

        socket.on("getOnlineUsers", (userids) => {
            set({onlineUsers: userids});
        })

        socket.on('connect', () => {
            console.log('Socket connected');
        });
        
        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
        
        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
      },
      disconnectSocket: () => {
        if(get().socket?.connected) get().socket.disconnect();
      },
}));