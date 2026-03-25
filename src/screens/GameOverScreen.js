import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { getClassicHighScores, getPuzzleHighScores } from '../utils/storage';
import { hapticLight } from '../utils/haptics';

export default function GameOverScreen({ navigation, route }) {
  const { mode, score, level, extra } = route.params;
  const isClassic = mode === 'classic';

  const [highScore, setHighScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    (async () => {
      const scores = isClassic
        ? await getClassicHighScores()
        : await getPuzzleHighScores();
      const best = scores[0]?.score || 0;
      setHighScore(best);
      setIsNewRecord(score >= best);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d1a" />
      <LinearGradient colors={['#0d0d1a','#111128','#0a1628']} style={StyleSheet.absoluteFill} />
      <View style={styles.container}>
        {/* Trophy / emoji */}
        <Text style={styles.emoji}>{isNewRecord ? '🏆' : '🎮'}</Text>

        <Text style={styles.title}>FIM DE JOGO</Text>

        {isNewRecord && (
          <View style={styles.recordBadge}>
            <Text style={styles.recordTxt}>🥇 NOVO RECORDE!</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsBox}>
          <StatRow label="Pontuação" value={score} highlight />
          <StatRow label="Nível" value={level} />
          {isClassic && extra !== undefined && <StatRow label="Linhas" value={extra} />}
          <StatRow label="Melhor" value={highScore} />
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: COLORS.accent }]}
            onPress={() => { hapticLight(); navigation.replace('Game', { mode, level }); }}
          >
            <Text style={styles.btnTxt}>🔄  JOGAR NOVAMENTE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: COLORS.primary }]}
            onPress={() => { hapticLight(); navigation.navigate('LevelSelect', { mode }); }}
          >
            <Text style={styles.btnTxt}>📋  ESCOLHER NÍVEL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: COLORS.surface }]}
            onPress={() => { hapticLight(); navigation.navigate('Home'); }}
          >
            <Text style={styles.btnTxt}>🏠  MENU PRINCIPAL</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function StatRow({ label, value, highlight }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && { color: COLORS.accent, fontSize: 28 }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 24 },

  emoji: { fontSize: 72 },
  title: { color: COLORS.text, fontSize: 36, fontWeight: 'bold', letterSpacing: 4 },

  recordBadge: { backgroundColor: COLORS.warning, paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20 },
  recordTxt: { color: '#000', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },

  statsBox: { width: '100%', backgroundColor: COLORS.surface, borderRadius: 16, padding: 18, gap: 10 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { color: COLORS.textSecondary, fontSize: 15 },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: 'bold' },

  buttons: { width: '100%', gap: 12 },
  btn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnTxt: { color: COLORS.text, fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
});
