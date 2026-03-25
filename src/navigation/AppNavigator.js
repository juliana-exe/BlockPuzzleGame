import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen        from '../screens/HomeScreen';
import LevelSelectScreen from '../screens/LevelSelectScreen';
import GameScreen        from '../screens/GameScreen';
import GameOverScreen    from '../screens/GameOverScreen';
import ScoresScreen      from '../screens/ScoresScreen';
import SettingsScreen    from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#1a1a2e' },
      }}
    >
      <Stack.Screen name="Home"        component={HomeScreen} />
      <Stack.Screen name="LevelSelect" component={LevelSelectScreen} />
      <Stack.Screen name="Game"        component={GameScreen} />
      <Stack.Screen name="GameOver"    component={GameOverScreen} />
      <Stack.Screen name="Scores"      component={ScoresScreen} />
      <Stack.Screen name="Settings"    component={SettingsScreen} />
    </Stack.Navigator>
  );
}
