import AppLoading from 'expo-app-loading';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Audio } from 'expo-av';
import { useEffect, useState, createContext, useContext } from 'react';
import HomePage from './screens/HomePage';
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import LevelSelect from './screens/LevelSelect';
import CharacterSelect from './screens/CharacterSelect';
import Dialogue from './screens/Dialogue';
import MapLevels from './screens/MapLevels';
import Quiz from './screens/Quiz';
import FinishScreen from './screens/FinishScreen';
import Leaderboard from './screens/Leaderboards';

const MusicContext = createContext();

const Stack = createStackNavigator();

export const useMusic = () => useContext(MusicContext);

export default function App() {
  const [fontsLoaded] = useFonts({
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
  });
  const [backgroundMusic, setBackgroundMusic] = useState(null);
  const [battleMusic, setBattleMusic] = useState(null);
  const [currentMusic, setCurrentMusic] = useState('background');

  const startBackgroundMusic = async () => {
    try {
      console.log('Setting up audio...');
      // Set audio mode to allow playback in silent mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('Audio mode set');

      // Load background music
      console.log('Loading background music...');
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/audio/18 - Seeker´s Path.wav'),
        { shouldPlay: true, isLooping: true }
      );
      console.log('Sound object created');
      await sound.setVolumeAsync(1.0);
      console.log('Volume set to 1.0');
      setBackgroundMusic(sound);
      console.log('Background music loaded and playing');
    } catch (error) {
      console.warn('Failed to setup audio:', error);
    }
  };

  const switchToBattleMusic = async () => {
    console.log('Switching to battle music');
    // Pause background music and start battle music
    if (backgroundMusic) {
      console.log('Pausing background music');
      await backgroundMusic.pauseAsync();
    } else {
      console.log('Background music not loaded');
    }
    if (!battleMusic) {
      try {
        console.log('Loading battle music');
        const { sound } = await Audio.Sound.createAsync(
          require('./assets/audio/We Must Battle NOW!  - Cody O\'Quinn - 01 We Must Battle NOW!.mp3'),
          { shouldPlay: true, isLooping: true }
        );
        setBattleMusic(sound);
        console.log('Battle music loaded and playing');
      } catch (error) {
        console.warn('Failed to load battle music:', error);
      }
    } else {
      console.log('Resuming battle music');
      await battleMusic.playAsync();
    }
    setCurrentMusic('battle');
  };

  const switchToBackgroundMusic = async () => {
    console.log('Switching to background music');
    // Stop battle music completely and resume background music
    if (battleMusic) {
      console.log('Stopping battle music');
      await battleMusic.stopAsync();
      await battleMusic.unloadAsync();
      setBattleMusic(null);
    } else {
      console.log('Battle music not loaded');
    }
    if (backgroundMusic) {
      console.log('Playing background music');
      await backgroundMusic.playAsync();
    } else {
      console.log('Background music not loaded');
    }
    setCurrentMusic('background');
  };

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <MusicContext.Provider value={{ startBackgroundMusic, switchToBattleMusic, switchToBackgroundMusic, currentMusic, backgroundMusic, battleMusic }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomePage} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="LevelSelect" component={LevelSelect} />
          <Stack.Screen name="CharacterSelect" component={CharacterSelect} />
          <Stack.Screen name="Dialogue" component={Dialogue} />
          <Stack.Screen name="MapLevels" component={MapLevels} />
          <Stack.Screen name="Quiz" component={Quiz} />
          <Stack.Screen name="FinishScreen" component={FinishScreen} />
          <Stack.Screen name="Leaderboard" component={Leaderboard} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </MusicContext.Provider>
  );
}
