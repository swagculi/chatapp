import { useEffect } from 'react';
import { useAuthStore } from '../store/userAuthStore';
import { axiosInstance } from '../lib/axios';

export const useNotifications = () => {
  const { authUser } = useAuthStore();

  useEffect(() => {
    if (!authUser) return;
    
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    // Request permission for notifications
    const requestNotificationPermission = async () => {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          registerPushSubscription();
        }
      } else if (Notification.permission === 'granted') {
        registerPushSubscription();
      }
    };

    // Register push subscription with the server
    const registerPushSubscription = async () => {
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          
          // Get push subscription
          let subscription = await registration.pushManager.getSubscription();
          
          // If no subscription exists, create one
          if (!subscription) {
            // Get public key from server
            const response = await axiosInstance.get('/notifications/public-key');
            const publicKey = response.data.publicKey;
            
            // Convert public key to Uint8Array
            const applicationServerKey = urlBase64ToUint8Array(publicKey);
            
            // Create new subscription
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey
            });
          }
          
          // Send subscription to server
          await axiosInstance.post('/notifications/subscribe', {
            subscription: JSON.stringify(subscription)
          });
        }
      } catch (error) {
        console.error('Error registering push subscription:', error);
      }
    };

    // Helper function to convert base64 to Uint8Array
    const urlBase64ToUint8Array = (base64String) => {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      
      return outputArray;
    };

    requestNotificationPermission();
  }, [authUser]);
}; 