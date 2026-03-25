import React, { useCallback } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import ClassicGame from '../game/classic/ClassicGame';
import PuzzleGame from '../game/puzzle/PuzzleGame';
import { saveClassicScore, savePuzzleScore, saveMaxUnlockedLevel } from '../utils/storage';

export default function GameScreen({ navigation, route }) {
  const { mode, level = 1 } = route.params;

  const handleGameOver = useCallback(async (...args) => {
    if (mode === 'classic') {
      const [score, lvl, lines] = args;
      await saveClassicScore(score, lvl, lines);
      await saveMaxUnlockedLevel('classic', Math.min(lvl + 1, 20));
      navigation.replace('GameOver', { mode, score, level: lvl, extra: lines });
    } else {
      const [score, lvl] = args;
      await savePuzzleScore(score, lvl);
      await saveMaxUnlockedLevel('puzzle', Math.min(lvl + 1, 30));
      navigation.replace('GameOver', { mode, score, level: lvl });
    }
  }, [mode, navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        {mode === 'classic'
          ? <ClassicGame startLevel={level} onGameOver={handleGameOver} />
          : <PuzzleGame  startLevel={level} onGameOver={handleGameOver} />
        }
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
});
