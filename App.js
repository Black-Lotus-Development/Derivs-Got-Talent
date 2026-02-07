import React, { Component } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';

import { colors } from './src/theme';
import { DerivAuthProvider } from './src/context/DerivAuthContext';

import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import BuilderScreen from './src/screens/BuilderScreen';
import DeploymentScreen from './src/screens/DeploymentScreen';
import ReplayScreen from './src/screens/ReplayScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import RoutineScreen from './src/screens/RoutineScreen';
import StrategyValidationScreen from './src/screens/StrategyValidationScreen';

const Stack = createStackNavigator();

const paperTheme = {
  ...MD3LightTheme,
  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: { ...MD3LightTheme.fonts.displayLarge, fontFamily: 'Poppins_800ExtraBold' },
    displayMedium: { ...MD3LightTheme.fonts.displayMedium, fontFamily: 'Poppins_800ExtraBold' },
    displaySmall: { ...MD3LightTheme.fonts.displaySmall, fontFamily: 'Poppins_700Bold' },
    headlineLarge: { ...MD3LightTheme.fonts.headlineLarge, fontFamily: 'Poppins_700Bold' },
    headlineMedium: { ...MD3LightTheme.fonts.headlineMedium, fontFamily: 'Poppins_700Bold' },
    headlineSmall: { ...MD3LightTheme.fonts.headlineSmall, fontFamily: 'Poppins_600SemiBold' },
    titleLarge: { ...MD3LightTheme.fonts.titleLarge, fontFamily: 'Poppins_600SemiBold' },
    titleMedium: { ...MD3LightTheme.fonts.titleMedium, fontFamily: 'Poppins_600SemiBold' },
    titleSmall: { ...MD3LightTheme.fonts.titleSmall, fontFamily: 'Poppins_500Medium' },
    labelLarge: { ...MD3LightTheme.fonts.labelLarge, fontFamily: 'Poppins_600SemiBold' },
    labelMedium: { ...MD3LightTheme.fonts.labelMedium, fontFamily: 'Poppins_500Medium' },
    labelSmall: { ...MD3LightTheme.fonts.labelSmall, fontFamily: 'Poppins_500Medium' },
    bodyLarge: { ...MD3LightTheme.fonts.bodyLarge, fontFamily: 'Poppins_400Regular' },
    bodyMedium: { ...MD3LightTheme.fonts.bodyMedium, fontFamily: 'Poppins_400Regular' },
    bodySmall: { ...MD3LightTheme.fonts.bodySmall, fontFamily: 'Poppins_400Regular' },
  },
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.success,
    background: colors.bg,
    surface: colors.bgCard,
    surfaceVariant: colors.bgSurface,
    onSurface: colors.textPrimary,
    onBackground: colors.textPrimary,
    outline: colors.divider,
  },
};

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bgCard,
    text: colors.textPrimary,
    primary: colors.primary,
    border: colors.divider,
  },
};

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'red', marginBottom: 12 }}>Runtime Error</Text>
          <Text style={{ fontSize: 14, color: '#333' }}>{this.state.error?.toString()}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <DerivAuthProvider>
            <PaperProvider theme={paperTheme}>
              <NavigationContainer theme={navTheme}>
                <StatusBar style="light" />
                <Stack.Navigator
                  initialRouteName="Home"
                  screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: colors.bg },
                  }}
                >
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Home" component={HomeScreen} />
                  <Stack.Screen name="Builder" component={BuilderScreen} />
                  <Stack.Screen name="StrategyValidation" component={StrategyValidationScreen} />
                  <Stack.Screen name="Deployment" component={DeploymentScreen} />
                  <Stack.Screen name="Replay" component={ReplayScreen} />
                  <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
                  <Stack.Screen name="Routine" component={RoutineScreen} />
                </Stack.Navigator>
              </NavigationContainer>
            </PaperProvider>
          </DerivAuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default App;
