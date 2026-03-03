import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import type { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Could add a splash screen here later
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            {/* Sprint 2+ screens will be added here */}
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ animationTypeForReplace: 'pop' }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
