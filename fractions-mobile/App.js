import React from 'react';
import AppLoading from 'expo-app-loading';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomePage from './screens/HomePage';
import Login from './screens/Login';
import LevelSelect from './screens/LevelSelect';
import CharacterSelect from './screens/CharacterSelect';
import Dialogue from './screens/Dialogue';
import MapLevels from './screens/MapLevels';
import Quiz from './screens/Quiz';
import FinishScreen from './screens/FinishScreen';

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomePage} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="LevelSelect" component={LevelSelect} />
        <Stack.Screen name="CharacterSelect" component={CharacterSelect} />
        <Stack.Screen name="Dialogue" component={Dialogue} />
        <Stack.Screen name="MapLevels" component={MapLevels} />
        <Stack.Screen name="Quiz" component={Quiz} />
        <Stack.Screen name="FinishScreen" component={FinishScreen} />
        {/* Add more screens here */} 
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
