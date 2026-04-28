import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import CreateItemScreen from '../screens/CreateItemScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import MyItemsScreen from '../screens/MyItemsScreen';
import ChatsScreen from '../screens/ChatsScreen';
import WishlistScreen from '../screens/WishlistScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import ConfirmationScreen from '../screens/ConfirmationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  ItemDetail: { itemId: string };
  CreateItem: undefined;
  Profile: undefined;
  EditProfile: undefined;
  MyItems: undefined;
  Wishlist: undefined;
  Chats: undefined;
  ChatDetail: {
    chatId: string;
    firebaseChatId: string;
    chatStatus: import('../types').ChatStatus;
    otherUserId: string;
    otherUserName: string;
    otherUserPhoto: string | null;
    itemTitle: string;
    itemId: string;
    isReceiver: boolean;
  };
  Confirmation: {
    chatId: string;
    isReceiver: boolean;
    otherUserName: string;
    itemTitle: string;
  };
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Home" component={HomeScreen} />
      <MainStack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <MainStack.Screen name="CreateItem" component={CreateItemScreen} />
      <MainStack.Screen name="Profile" component={ProfileScreen} />
      <MainStack.Screen name="EditProfile" component={EditProfileScreen} />
      <MainStack.Screen name="MyItems" component={MyItemsScreen} />
      <MainStack.Screen name="Wishlist" component={WishlistScreen} />
      <MainStack.Screen name="Chats" component={ChatsScreen} />
      <MainStack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <MainStack.Screen name="Confirmation" component={ConfirmationScreen} />
    </MainStack.Navigator>
  );
}

// sharecampus://login   → abre la pantalla de login (ej: tras verificar email)
// sharecampus://forgot  → abre recuperar contraseña
const linking = {
  prefixes: ['sharecampus://'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot',
    },
  },
};

export default function AppNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <View style={styles.loaderIconWrap}>
          <Text style={styles.loaderEmoji}>🎓</Text>
        </View>
        <Text style={styles.loaderBrand}>ShareCampus</Text>
        <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      {token ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F5FF',
  },
  loaderIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  loaderEmoji: { fontSize: 44 },
  loaderBrand: {
    fontSize: 26,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
});
