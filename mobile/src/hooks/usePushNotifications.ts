import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import api from '../services/api';

// Configure how notifications are shown while the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const register = useCallback(async () => {
    try {
      // Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Push] Permission not granted — skipping token registration');
        return;
      }

      // Android requires an explicit notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'ShareCampus',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1E4D8C',
          sound: 'default',
        });
      }

      // getDevicePushTokenAsync returns the raw FCM token on Android,
      // which is exactly what the Firebase Admin SDK backend expects.
      const { data: token } = await Notifications.getDevicePushTokenAsync();

      await api.post('/notifications/register-token', {
        token,
        platform: Platform.OS,
      });

      console.log('[Push] Token registered:', token.slice(0, 20) + '…');
    } catch (error) {
      // Non-fatal — the app works without push notifications
      console.log('[Push] Registration failed:', error);
    }
  }, []);

  return { register };
}
