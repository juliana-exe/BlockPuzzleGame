import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { CLASSIC_LEVELS, PUZZLE_LEVELS } from '../game/levels';
import { getMaxUnlockedLevel } from '../utils/storage';

export default function LevelSelectScreen({ navigation, route }) {
  const { mode } = route.params;
  const isClassic = mode === 'classic';
  const levels    = isClassic ? CLASSIC_LEVELS : PUZZLE_LEVELS;

  const [maxUnlocked, setMaxUnlocked] = useState(1);

  useEffect(() => {
    getMaxUnlockedLevel(mode).then(setMaxUnlocked);
  }, [mode]);

  const renderLevel = ({ item }) => {
    const unlocked = item.level <= maxUnlocked;
    return (
      <TouchableOpacity
        style={[styles.levelCard, !unlocked && styles.levelLocked]}
        onPress={() => {
          if (unlocked) navigation.navigate('Game', { mode, level: item.level });
        }}
        activeOpacity={unlocked ? 0.7 : 1}
      >
        <View style={styles.levelHeader}>
          <Text style={[styles.levelNum, !unlocked && { color: COLORS.textSecondary }]}>
            {item.level}
          </Text>
          {!unlocked && <Text style={styles.lockIcon}>🔒</Text>}
        </View>
        <Text style={[styles.levelBadge, !unlocked && { opacity: 0.4 }]}>{item.badge}</Text>
        {isClassic ? (
          <Text style={[styles.levelInfo, !unlocked && { opacity: 0.4 }]}>
            Meta: {item.linesTarget} linhas
          </Text>
        ) : (
          <>
            <Text style={[styles.levelInfo, !unlocked && { opacity: 0.4 }]}>
              Meta: {item.scoreTarget} pts
            </Text>
            <Text style={[styles.levelInfo, styles.levelInfoAlt, !unlocked && { opacity: 0.4 }]}>
              Limite: {item.maxMoves} jogadas
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isClassic ? '🕹️ CLÁSSICO' : '🧠 PUZZLE'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.sub}>
        {isClassic
          ? `${levels.length} níveis · Velocidade aumenta`
          : `${levels.length} níveis · Meta de pontuação`}
      </Text>

      <FlatList
        data={levels}
        keyExtractor={item => String(item.level)}
        renderItem={renderLevel}
        numColumns={3}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  backBtn: { padding: 8 },
  backTxt: { color: COLORS.accent, fontSize: 15, fontWeight: 'bold' },
  title: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },

  sub: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 12, marginBottom: 12 },

  grid: { paddingHorizontal: 12, paddingBottom: 20 },
  levelCard: {
    flex: 1,
    margin: 5,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    minHeight: 88,
  },
  levelLocked: { opacity: 0.55, borderColor: '#333' },
  levelHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  levelNum: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  lockIcon: { fontSize: 14 },
  levelBadge: { fontSize: 10, marginTop: 2, color: COLORS.textSecondary },
  levelInfo: { fontSize: 10, marginTop: 3, color: COLORS.success, textAlign: 'center' },
  levelInfoAlt: { color: COLORS.warning, marginTop: 1 },
});
