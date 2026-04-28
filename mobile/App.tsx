import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuth } from './src/context/AuthContext';
import { usePushNotifications } from './src/hooks/usePushNotifications';

function PushSetup() {
  const { token } = useAuth();
  const { register } = usePushNotifications();

  useEffect(() => {
    if (token) register();
  }, [token]);

  return null;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F5FF' }}>
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <PushSetup />
      <AppNavigator />
    </AuthProvider>
  );
}
