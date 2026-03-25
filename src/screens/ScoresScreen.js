import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { getClassicHighScores, getPuzzleHighScores } from '../utils/storage';

export default function ScoresScreen({ navigation }) {
  const [tab, setTab]             = useState('classic');
  const [scores, setScores]       = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = tab === 'classic'
        ? await getClassicHighScores()
        : await getPuzzleHighScores();
      setScores(data);
    };
    load();
  }, [tab]);

  const renderItem = ({ item, index }) => (
    <View style={[styles.row, index === 0 && styles.rowFirst]}>
      <Text style={styles.rank}>{['🥇','🥈','🥉'][index] || `#${index + 1}`}</Text>
      <Text style={styles.rowScore}>{item.score}</Text>
      <Text style={styles.rowMeta}>
        Nível {item.level}
        {tab === 'classic' && item.lines != null ? `  ·  ${item.lines} linhas` : ''}
      </Text>
      <Text style={styles.rowDate}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏆 RECORDES</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'classic' && styles.tabActive]}
          onPress={() => setTab('classic')}
        >
          <Text style={[styles.tabTxt, tab === 'classic' && styles.tabTxtActive]}>🕹️ Clássico</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'puzzle' && styles.tabActive]}
          onPress={() => setTab('puzzle')}
        >
          <Text style={[styles.tabTxt, tab === 'puzzle' && styles.tabTxtActive]}>🧠 Puzzle</Text>
        </TouchableOpacity>
      </View>

      {scores.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTxt}>Nenhuma partida jogada ainda.</Text>
          <Text style={styles.emptyIcon}>🎮</Text>
        </View>
      ) : (
        <FlatList
          data={scores}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { padding: 8 },
  backTxt: { color: COLORS.accent, fontSize: 15, fontWeight: 'bold' },
  title: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },

  tabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, backgroundColor: COLORS.surface, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: COLORS.primary },
  tabTxt: { color: COLORS.textSecondary, fontWeight: 'bold' },
  tabTxtActive: { color: COLORS.text },

  list: { paddingHorizontal: 20, paddingBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8, gap: 10 },
  rowFirst: { borderWidth: 2, borderColor: COLORS.warning },
  rank: { fontSize: 20, width: 32, textAlign: 'center' },
  rowScore: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', flex: 1 },
  rowMeta: { color: COLORS.textSecondary, fontSize: 12 },
  rowDate: { color: COLORS.textSecondary, fontSize: 11 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTxt: { color: COLORS.textSecondary, fontSize: 16 },
  emptyIcon: { fontSize: 48 },
});
