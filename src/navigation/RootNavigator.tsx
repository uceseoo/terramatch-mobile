import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import type { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ProjectScreen from '../screens/ProjectScreen';
import SiteScreen from '../screens/SiteScreen';
import PolygonDetailScreen from '../screens/PolygonDetailScreen';
import EditPolygonScreen from '../screens/EditPolygonScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
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
            <Stack.Screen name="Project" component={ProjectScreen} />
            <Stack.Screen name="Site" component={SiteScreen} />
            <Stack.Screen name="PolygonDetail" component={PolygonDetailScreen} />
            <Stack.Screen name="EditPolygon" component={EditPolygonScreen} />
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
