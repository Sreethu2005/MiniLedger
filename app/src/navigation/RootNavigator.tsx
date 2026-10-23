import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { AddLoanScreen } from '../screens/AddLoanScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { user, token, isLoading } = useAuth();

  // Show splash loader while checking SecureStore session
  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  const isAuthenticated = !!token && !!user;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0F172A',
          },
          headerTintColor: '#F8FAFC',
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: '#F8FAFC',
          },
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          // Main App Stack
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddLoan"
              component={AddLoanScreen}
              options={{
                title: 'Record New Loan',
                headerBackTitle: 'Back',
                presentation: 'modal',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
});
